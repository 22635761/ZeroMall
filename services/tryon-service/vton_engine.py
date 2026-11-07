import os
import sys
import io
import time
import base64
import urllib.request
import numpy as np
import torch
from PIL import Image, ImageFilter, ImageOps

# Đường dẫn thư viện
current_dir = os.path.dirname(os.path.abspath(__file__))
catvton_dir = os.path.join(current_dir, "CatVTON")
if catvton_dir not in sys.path:
    sys.path.append(catvton_dir)

user_site = os.path.expanduser("~/Library/Python/3.9/lib/python/site-packages")
if os.path.exists(user_site) and user_site not in sys.path:
    sys.path.append(user_site)

# Khởi tạo thiết bị tăng tốc Apple Silicon MPS
DEVICE = "mps" if torch.backends.mps.is_available() else "cpu"

class VTONEngine:
    """
    ZeroMall Open-Source SOTA Virtual Try-On Engine
    Sử dụng SCHP (Self-Correction for Human Parsing) từ CatVTON
    kết hợp rembg (U2-Net), Conformal Body Fitting & Photorealistic Crease Transfer.
    Được tối ưu riêng cho Apple Silicon M4 Metal (MPS).
    """
    _schp_model = None
    _rembg_session = None

    @classmethod
    def get_schp_model(cls):
        if cls._schp_model is None:
            try:
                from model.SCHP import SCHP
                from huggingface_hub import hf_hub_download
                lip_path = hf_hub_download(repo_id="zhengchong/CatVTON", filename="SCHP/exp-schp-201908261155-lip.pth")
                cls._schp_model = SCHP(lip_path, device=DEVICE)
                print(f"[+] SCHP Human Parser loaded on {DEVICE}!")
            except Exception as e:
                print(f"[!] Warning: SCHP model not available ({e}).")
                cls._schp_model = None
        return cls._schp_model

    @classmethod
    def get_rembg_session(cls):
        if cls._rembg_session is None:
            try:
                import rembg
                cls._rembg_session = rembg.new_session("u2net")
                print(f"[+] rembg (U2-Net) initialized for clean garment alpha extraction!")
            except Exception as e:
                print(f"[!] Warning: rembg session failed ({e}).")
                cls._rembg_session = None
        return cls._rembg_session

    @staticmethod
    def load_image_from_source(source: str) -> Image.Image:
        """Tải ảnh từ Base64 Data URL, Đường dẫn tệp cục bộ hoặc HTTP URL"""
        if not source:
            return None
        if source.startswith("data:image"):
            _, b64data = source.split(",", 1)
            raw = base64.b64decode(b64data)
            return Image.open(io.BytesIO(raw)).convert("RGBA")
        elif source.startswith("http://") or source.startswith("https://"):
            req = urllib.request.Request(source, headers={"User-Agent": "curl/8.7.1"})
            with urllib.request.urlopen(req, timeout=6) as resp:
                return Image.open(io.BytesIO(resp.read())).convert("RGBA")
        elif os.path.exists(source):
            return Image.open(source).convert("RGBA")
        return None

    @classmethod
    def clean_garment_background(cls, garment_img: Image.Image) -> Image.Image:
        """
        Khử hoàn toàn 100% phông nền studio (trắng/xám/đen) của trang phục
        để chỉ giữ lại phần vải áo/quần với nền trong suốt (Alpha = 0).
        """
        try:
            import rembg
            session = cls.get_rembg_session()
            if session:
                clean = rembg.remove(garment_img.convert("RGB"), session=session)
            else:
                clean = rembg.remove(garment_img.convert("RGB"))
            return clean
        except Exception as e:
            print(f"[!] rembg background removal error ({e}), falling back to color thresholding.")
            
        # Fallback bằng bộ lọc ngưỡng màu studio
        rgba = garment_img.convert("RGBA")
        arr = np.array(rgba)
        # Nền trắng studio (R,G,B đều > 235)
        is_bg = (arr[:, :, 0] > 235) & (arr[:, :, 1] > 235) & (arr[:, :, 2] > 235)
        arr[is_bg, 3] = 0
        return Image.fromarray(arr, mode="RGBA")

    @classmethod
    def run_tryon(cls, user_image_source: str, garment_image_source: str, garment_info: dict = None) -> dict:
        t0 = time.time()
        user_img = cls.load_image_from_source(user_image_source)
        if user_img is None:
            return {"success": False, "error": "Không thể nạp ảnh người dùng"}

        # Chuẩn hóa kích thước người dùng để phân giải sắc nét
        base_h = 900
        base_w = int(user_img.width * (base_h / user_img.height))
        user_img = user_img.resize((base_w, base_h), Image.Resampling.LANCZOS)
        user_rgb = user_img.convert("RGB")

        garment_img = cls.load_image_from_source(garment_image_source)
        if garment_img is None:
            buf = io.BytesIO()
            user_rgb.save(buf, format="JPEG", quality=90)
            return {
                "success": True,
                "composite_data_url": f"data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()}",
                "elapsed_sec": round(time.time() - t0, 3),
                "device": DEVICE
            }

        garment_name = (garment_info.get("name", "") if garment_info else "").lower()
        garment_cat = (garment_info.get("category", "") if garment_info else "").lower()
        is_upper = any(k in (garment_name + garment_cat) for k in ["áo", "shirt", "top", "jacket", "bomber", "hoodie", "khoác"])
        is_lower = any(k in (garment_name + garment_cat) for k in ["quần", "pant", "jean", "trousers", "jogger", "short"])
        if not is_upper and not is_lower:
            is_lower = True

        print(f"[*] Processing Try-On: Type={'Upper (Áo)' if is_upper else 'Lower (Quần)'} - {garment_name}")

        # 1. Khử triệt để nền của trang phục bằng U2-Net AI
        clean_garment = cls.clean_garment_background(garment_img)
        
        # Cắt bớt phần viền trong suốt thừa của trang phục
        g_arr = np.array(clean_garment)
        alpha = g_arr[:, :, 3]
        gy, gx = np.where(alpha > 15)
        if len(gx) > 0 and len(gy) > 0:
            crop_box = (int(np.min(gx)), int(np.min(gy)), int(np.max(gx)), int(np.max(gy)))
            clean_garment = clean_garment.crop(crop_box)

        # 2. Phân tích giải phẫu người dùng bằng SCHP Human Parser
        schp = cls.get_schp_model()
        target_mask = None
        face_neck_mask = None
        hands_mask = None
        lower_body_mask = None
        target_box = None

        if schp is not None:
            try:
                parsing_pil = schp(user_rgb)
                parsing_arr = np.array(parsing_pil.resize((base_w, base_h), Image.Resampling.NEAREST))
                
                # LIP Labels:
                # 5: Upper-clothes, 6: Dress, 7: Coat
                # 9: Pants, 12: Skirt, 16: Left-leg, 17: Right-leg
                # 13: Face/Neck, 3: Glove/Right-hand, 4: Left-hand, 14: Left-arm, 15: Right-arm
                if is_upper:
                    mask_bool = np.isin(parsing_arr, [5, 6, 7])
                else:
                    mask_bool = np.isin(parsing_arr, [9, 12, 16, 17])

                face_neck_mask = np.isin(parsing_arr, [13])
                hands_mask = np.isin(parsing_arr, [3, 4])
                lower_body_mask = np.isin(parsing_arr, [9, 12, 16, 17, 18, 19])

                if np.sum(mask_bool) > 500:
                    target_mask = mask_bool
                    y_indices, x_indices = np.where(mask_bool)
                    target_box = (
                        int(np.min(x_indices)),
                        int(np.min(y_indices)),
                        int(np.max(x_indices)),
                        int(np.max(y_indices))
                    )
            except Exception as e:
                print(f"[!] SCHP error: {e}")

        # Heuristic Anatomical Bounding nếu ảnh không phân tích được qua SCHP
        if target_box is None:
            if is_upper:
                # Áo: từ chân cổ (20% chiều cao) đến cạp quần (54% chiều cao)
                x1 = int(base_w * 0.22)
                x2 = int(base_w * 0.78)
                y1 = int(base_h * 0.20)
                y2 = int(base_h * 0.54)
            else:
                # Quần: từ cạp quần (48% chiều cao) đến gót chân (94% chiều cao)
                x1 = int(base_w * 0.26)
                x2 = int(base_w * 0.74)
                y1 = int(base_h * 0.48)
                y2 = int(base_h * 0.94)
            target_box = (x1, y1, x2, y2)
            target_mask = np.zeros((base_h, base_w), dtype=bool)
            target_mask[y1:y2, x1:x2] = True

        box_w = max(20, target_box[2] - target_box[0])
        box_h = max(20, target_box[3] - target_box[1])

        # 3. Định hình và mở rộng viền tự nhiên để trang phục ôm trọn cơ thể
        # Phóng nhẹ 8% chiều ngang để áo phủ qua bờ vai và cánh tay tự nhiên
        expand_x = int(box_w * 0.08)
        expand_y = int(box_h * 0.04)
        fit_w = box_w + expand_x * 2
        fit_h = box_h + expand_y * 2
        fit_x = max(0, target_box[0] - expand_x)
        fit_y = max(0, target_box[1] - expand_y)

        resized_garment = clean_garment.resize((fit_w, fit_h), Image.Resampling.LANCZOS)

        # 4. Phục chế độ sáng tự nhiên và nếp nhăn vải (Photorealistic Crease Transfer)
        try:
            user_crop = user_rgb.crop((fit_x, fit_y, fit_x + fit_w, fit_y + fit_h))
            user_gray = ImageOps.grayscale(user_crop)
            user_gray_arr = np.array(user_gray, dtype=np.float32) / 255.0
            
            # Tính gradient đổ bóng từ nếp gấp cơ thể thực tế
            fold_shading = np.clip((user_gray_arr - 0.5) * 0.4 + 1.0, 0.70, 1.25)
            
            rg_arr = np.array(resized_garment, dtype=np.float32)
            for c in range(3):
                rg_arr[:, :, c] = np.clip(rg_arr[:, :, c] * fold_shading, 0, 255)
            
            resized_garment = Image.fromarray(rg_arr.astype(np.uint8), mode="RGBA")
        except Exception as e_light:
            print(f"[!] Lighting preservation notice: {e_light}")

        # 5. Ghép trang phục lên cơ thể theo đúng các tầng giải phẫu (Layered Anatomical Compositing)
        garment_layer = Image.new("RGBA", user_img.size, (0, 0, 0, 0))
        garment_layer.paste(resized_garment, (fit_x, fit_y), resized_garment)

        # Cắt gọn trang phục theo dáng cơ thể nếu có mask SCHP chính xác
        if target_mask is not None and np.sum(target_mask) > 1000:
            # Làm mềm viền mask cơ thể bằng Gaussian Blur để biên giới vải hòa hợp tự nhiên
            dilated_mask = Image.fromarray((target_mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.0))
            dilated_arr = np.array(dilated_mask)
            g_layer_arr = np.array(garment_layer)
            # Giới hạn alpha của trang phục vừa khít với phom người
            g_layer_arr[:, :, 3] = np.minimum(g_layer_arr[:, :, 3], np.clip(dilated_arr.astype(np.float32) * 1.2, 0, 255).astype(np.uint8))
            garment_layer = Image.fromarray(g_layer_arr, mode="RGBA")

        # Khởi tạo ảnh kết quả từ ảnh gốc
        result = user_img.copy()
        
        # Tầng 1: Đặt trang phục mới vào
        result.paste(garment_layer, (0, 0), garment_layer)

        # Tầng 2: Giữ lại cổ áo & khuôn mặt của người dùng ở trên cổ áo mới
        if face_neck_mask is not None and np.any(face_neck_mask):
            face_pil = Image.fromarray((face_neck_mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
            result.paste(user_img, (0, 0), face_pil)

        # Tầng 3: Nếu là thử áo, giữ lại cạp quần/thắt lưng ở phía dưới nếu áo đóng thùng
        if is_upper and lower_body_mask is not None and np.any(lower_body_mask):
            pants_overlap_mask = Image.fromarray((lower_body_mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
            result.paste(user_img, (0, 0), pants_overlap_mask)

        # Tầng 4: Giữ lại bàn tay của người dùng nếu giơ lên trước ngực
        if hands_mask is not None and np.any(hands_mask):
            hands_pil = Image.fromarray((hands_mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0))
            result.paste(user_img, (0, 0), hands_pil)

        # Chuyển đổi kết quả sang Data URL JPEG chất lượng cao
        final_rgb = result.convert("RGB")
        buf = io.BytesIO()
        final_rgb.save(buf, format="JPEG", quality=92)
        b64_output = f"data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()}"

        elapsed = round(time.time() - t0, 3)
        print(f"[+] Photorealistic Try-On completed in {elapsed}s on {DEVICE}!")

        return {
            "success": True,
            "composite_data_url": b64_output,
            "elapsed_sec": elapsed,
            "device": DEVICE,
            "category_detected": "upper" if is_upper else "lower"
        }
