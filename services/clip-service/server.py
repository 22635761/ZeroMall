import os
import sys
import json
import base64
import io
import urllib.request
from http.server import HTTPServer, BaseHTTPRequestHandler
from PIL import Image
from sentence_transformers import SentenceTransformer, util

PORT = int(os.environ.get("CLIP_PORT", 5005))
print(f"[*] Loading clip-ViT-B-32 model on Apple Silicon / CPU...")
model = SentenceTransformer("clip-ViT-B-32")
print(f"[+] Model loaded!")

# Ngành hàng & vật thể chuẩn để phân loại hình ảnh (Zero-shot Multimodal Vision)
CANONICAL_CATEGORIES = {
    "Áo khoác / Áo thời trang": {
        "prompt": "leather jacket coat outerwear jacket bomber blazer hoodie windbreaker top",
        "label": "Áo khoác / Áo thời trang",
        "suggestedTitle": "Áo Khoác Phong Cách Thời Trang Nam Nữ Cao Cấp",
        "zero_category": "Thời Trang Nam",
        "domain": "TOPS"
    },
    "Áo thun / Áo sơ mi": {
        "prompt": "t-shirt shirt polo sweater top apparel men women",
        "label": "Áo thun / Áo sơ mi thời trang",
        "suggestedTitle": "Áo Thời Trang Phong Cách Trẻ Trung",
        "zero_category": "Thời Trang Nam",
        "domain": "TOPS"
    },
    "Quần / Quần dài / Quần thể thao": {
        "prompt": "pants trousers jeans shorts sweatpants joggers bottom clothing",
        "label": "Quần dài / Quần thời trang",
        "suggestedTitle": "Quần Thể Thao Dài Nam Nữ Năng Động",
        "zero_category": "Thời Trang Nam",
        "domain": "BOTTOMS"
    },
    "Váy / Đầm nữ": {
        "prompt": "women dress skirt gown female clothing",
        "label": "Váy đầm thời trang nữ",
        "suggestedTitle": "Đầm Váy Thời Trang Nữ Dáng Xinh Cao Cấp",
        "zero_category": "Thời Trang Nữ",
        "domain": "DRESS"
    },
    "Thể Thao": {
        "prompt": "sports football soccer jersey athletic sportswear kit wika runner",
        "label": "Bộ quần áo thể thao / bóng đá",
        "suggestedTitle": "Bộ Quần Áo Bóng Đá Thể Thao Nam Nữ Thoáng Khí",
        "zero_category": "Thể Thao",
        "domain": "SPORTS"
    },
    "Giày Dép Nam": {
        "prompt": "men sneakers shoes boots sandals athletic footwear",
        "label": "Giày thể thao / Sneaker nam",
        "suggestedTitle": "Giày Sneaker Thể Thao Nam Năng Động",
        "zero_category": "Giày Dép Nam",
        "domain": "FOOTWEAR"
    },
    "Giày Dép Nữ": {
        "prompt": "women high heels shoes boots sandals footwear",
        "label": "Giày dép nữ / Giày cao gót",
        "suggestedTitle": "Giày Cao Gót Nữ Thanh Lịch",
        "zero_category": "Giày Dép Nữ",
        "domain": "FOOTWEAR"
    },
    "Gia Dụng": {
        "prompt": "kitchen appliance air fryer cooker pot pan blender microwave",
        "label": "Đồ gia dụng / Thiết bị nhà bếp",
        "suggestedTitle": "Thiết Bị Gia Dụng Nhà Bếp Đa Năng Cao Cấp",
        "zero_category": "Gia Dụng",
        "domain": "KITCHEN"
    },
    "Máy Ảnh": {
        "prompt": "camera photography lens tripod digital camera gopro",
        "label": "Máy ảnh / Thiết bị quay phim",
        "suggestedTitle": "Máy Ảnh Kỹ Thuật Số Chính Hãng",
        "zero_category": "Máy Ảnh",
        "domain": "CAMERA"
    },
    "Điện Thoại & Phụ Kiện": {
        "prompt": "smartphone mobile phone case charger headphones airpods",
        "label": "Điện thoại & Phụ kiện",
        "suggestedTitle": "Điện Thoại Thông Minh Phụ Kiện Cao Cấp",
        "zero_category": "Điện Thoại & Phụ Kiện",
        "domain": "ELECTRONICS"
    },
    "Máy Tính & Laptop": {
        "prompt": "laptop computer pc keyboard monitor gaming mouse",
        "label": "Máy tính & Laptop",
        "suggestedTitle": "Laptop Máy Tính Cấu Hình Cao",
        "zero_category": "Máy Tính & Laptop",
        "domain": "ELECTRONICS"
    },
    "Túi Ví Nữ": {
        "prompt": "backpack handbag wallet purse bag clutch",
        "label": "Balo / Túi xách / Ví",
        "suggestedTitle": "Balo Túi Xách Thời Trang Tiện Lợi",
        "zero_category": "Túi Ví Nữ",
        "domain": "BAGS"
    },
    "Sách & VPP": {
        "prompt": "books textbook notebook stationery pens paper document",
        "label": "Sách & Văn phòng phẩm",
        "suggestedTitle": "Sách & Văn Phòng Phẩm Học Tập",
        "zero_category": "Sách & VPP",
        "domain": "BOOKS"
    },
    "Sơ đồ / Tài liệu": {
        "prompt": "software architecture flowchart code terminal diagram system text",
        "label": "Sơ đồ luồng mã nguồn / text hệ thống",
        "suggestedTitle": "Tài Liệu Hướng Dẫn Hệ Thống ZeroMall",
        "zero_category": "Sách & VPP",
        "domain": "DIAGRAM"
    },
    "Cảnh ngoài trời / Xe cộ": {
        "prompt": "person riding bicycle outdoors street cyclist delivery delivery person",
        "label": "Người đi xe đạp / Cảnh ngoài trời",
        "suggestedTitle": "Sản Phẩm Thể Thao Xe Đạp Ngoài Trời",
        "zero_category": "Thể Thao",
        "domain": "OUTDOOR"
    }
}

CAT_KEYS = list(CANONICAL_CATEGORIES.keys())
CAT_PROMPTS = [CANONICAL_CATEGORIES[k]["prompt"] for k in CAT_KEYS]
print("[*] Pre-encoding canonical category vectors for instant zero-shot matching...")
CAT_EMBEDDINGS = model.encode(CAT_PROMPTS)
print(f"[+] {len(CAT_KEYS)} category vectors ready! Starting server on port {PORT}...")


def parse_pil_image(payload):
    image_b64 = payload.get("imageBase64") or payload.get("image")
    image_url = payload.get("imageUrl") or payload.get("image")

    if image_b64 and (image_b64.startswith("data:") or len(image_b64) > 200):
        if image_b64.startswith("data:"):
            image_b64 = image_b64.split(",", 1)[1]
        raw_bytes = base64.b64decode(image_b64)
        return Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    elif image_url and (image_url.startswith("http://") or image_url.startswith("https://")):
        req = urllib.request.Request(image_url, headers={"User-Agent": "Mozilla/5.0"})
        raw_bytes = urllib.request.urlopen(req, timeout=10).read()
        return Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    return None


class ClipHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path in ["/health", "/", "/status"]:
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "ok",
                "service": "zeromall-clip-local-ai",
                "model": "clip-ViT-B-32",
                "dimensions": 512,
                "endpoints": ["/embed", "/audit", "/classify"]
            }).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            payload = json.loads(body) if body else {}
        except Exception as e:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": f"Invalid JSON: {str(e)}"}).encode("utf-8"))
            return

        if self.path == "/embed":
            try:
                pil_img = parse_pil_image(payload)
                if pil_img is None:
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "Vui lòng cung cấp imageBase64 hoặc imageUrl"}).encode("utf-8"))
                    return

                embedding = model.encode(pil_img).tolist()
                rounded = [round(x, 6) for x in embedding]

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "embedding": rounded,
                    "dimensions": len(rounded)
                }).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

        elif self.path in ["/audit", "/classify"]:
            try:
                pil_img = parse_pil_image(payload)
                name = (payload.get("name") or payload.get("title") or "").strip()
                category = (payload.get("category") or "").strip()

                if pil_img is None:
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "isMismatch": False,
                        "message": "Không có ảnh hợp lệ để kiểm tra thị giác"
                    }).encode("utf-8"))
                    return

                # 1. Tính toán vector đặc trưng của ảnh
                img_emb = model.encode(pil_img)

                # 2. Nhận diện vật thể trong ảnh qua zero-shot category prompts
                sims = util.cos_sim(img_emb, CAT_EMBEDDINGS)[0]
                best_idx = sims.argmax().item()
                best_cat = CAT_KEYS[best_idx]
                cat_info = CANONICAL_CATEGORIES[best_cat]
                visual_confidence = round(float(sims[best_idx]) * 100, 1)

                # 3. Tính toán độ tương đồng giữa Tên sản phẩm và Hình ảnh
                title_sim = 0.0
                is_mismatch = False
                reason = ""

                lower_name = name.lower()

                # Kiểm tra các trường hợp đặc biệt không phải hàng tiêu dùng
                if best_cat == "Sơ đồ / Tài liệu":
                    is_mismatch = True
                    reason = f"Ảnh hiển thị sơ đồ/văn bản hệ thống, không phải ảnh chụp sản phẩm thực tế (\"{name}\")."
                elif best_cat == "Cảnh ngoài trời / Xe cộ":
                    if not any(k in lower_name for k in ["xe đạp", "bicycle", "cyclist"]):
                        is_mismatch = True
                        reason = f"Ảnh chụp người đi xe đạp/giao hàng ngoài trời, không khớp với sản phẩm \"{name}\"."

                # Kiểm tra tương đồng tên
                if not is_mismatch and name:
                    name_emb = model.encode([name])[0]
                    title_sim = float(util.cos_sim(img_emb, name_emb)[0].item())

                    domain = cat_info.get("domain", "")

                    # 1. TOPS (Áo khoác, Áo thun, Sơ mi...) vs BOTTOMS (Quần, Jeans, Shorts...)
                    if domain == "TOPS":
                        is_bottom = any(k in lower_name for k in ["quần", "quan", "jean", "short", "jogger", "trouser", "sweatpant", "kaki", "quần đùi", "quần dài", "quần âu"])
                        is_suit = any(k in lower_name for k in ["bộ", "set", "đồ bộ", "bộ đồ", "combo", "áo và quần", "áo phối quần"])
                        if is_bottom and not is_suit:
                            is_mismatch = True
                            reason = f"Ảnh hiển thị áo/áo khoác, không khớp với tên sản phẩm bạn nhập là quần (\"{name}\")."
                        elif any(k in lower_name for k in ["giày", "dép", "sneaker", "sandal", "nồi chiên", "bếp", "điện thoại", "laptop", "máy tính"]):
                            is_mismatch = True
                            reason = f"Ảnh là áo/áo khoác thời trang, không khớp với tên sản phẩm \"{name}\"."

                    elif domain == "BOTTOMS":
                        is_top = any(k in lower_name for k in ["áo", "ao", "khoác", "jacket", "hoodie", "sweater", "sơ mi", "polo", "thun", "blazer", "vest"])
                        is_suit = any(k in lower_name for k in ["bộ", "set", "đồ bộ", "bộ đồ", "combo", "áo và quần", "áo phối quần"])
                        if is_top and not is_suit:
                            is_mismatch = True
                            reason = f"Ảnh hiển thị quần thời trang, không khớp với tên sản phẩm bạn nhập là áo (\"{name}\")."
                        elif any(k in lower_name for k in ["giày", "dép", "sneaker", "sandal", "nồi chiên", "bếp", "điện thoại", "laptop", "máy tính"]):
                            is_mismatch = True
                            reason = f"Ảnh là quần thời trang, không khớp với tên sản phẩm \"{name}\"."

                    elif domain == "DRESS":
                        if any(k in lower_name for k in ["quần nam", "áo nam", "quần jean nam", "giày nam"]):
                            is_mismatch = True
                            reason = f"Ảnh là váy đầm thời trang nữ, không khớp với tên sản phẩm \"{name}\"."

                    elif domain == "SPORTS":
                        disallowed_themes = [
                            "siêu nhân", "gao", "công chúa", "bà ba", "áo dài", "đồ ngủ",
                            "pijama", "anime", "cosplay", "giày", "dép", "sneaker", "sandal",
                            "laptop", "máy tính", "điện thoại", "tai nghe", "bàn phím", "nồi chiên", "bếp"
                        ]
                        if any(k in lower_name for k in disallowed_themes):
                            is_mismatch = True
                            reason = f"Ảnh là trang phục thể thao/bóng đá thực tế, không khớp với tên sản phẩm \"{name}\"."

                    elif domain == "FOOTWEAR":
                        disallowed_themes = ["áo", "quần", "váy", "đầm", "nồi chiên", "điện thoại", "laptop", "máy tính"]
                        if any(k in lower_name for k in disallowed_themes):
                            is_mismatch = True
                            reason = f"Ảnh là giày dép, không khớp với tên sản phẩm \"{name}\"."

                    elif domain == "KITCHEN":
                        if not any(k in lower_name for k in ["nồi", "chảo", "bếp", "lò", "ấm", "máy xay", "gia dụng"]):
                            is_mismatch = True
                            reason = f"Ảnh là đồ gia dụng nhà bếp, không khớp với tên sản phẩm \"{name}\"."

                    elif domain == "ELECTRONICS":
                        if any(k in lower_name for k in ["áo", "quần", "váy", "đầm", "giày", "dép", "nồi chiên"]):
                            is_mismatch = True
                            reason = f"Ảnh là thiết bị công nghệ điện tử, không khớp với tên sản phẩm \"{name}\"."

                # Map suggested category sang ngành hàng chính thức ZeroMall
                final_suggested_cat = cat_info.get("zero_category", "Thời Trang Nam")

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "isMismatch": is_mismatch,
                    "detectedVisual": cat_info["label"],
                    "suggestedTitle": cat_info["suggestedTitle"],
                    "suggestedCategory": final_suggested_cat,
                    "visualConfidence": visual_confidence,
                    "similarity": round(title_sim, 4),
                    "reason": reason,
                    "source": "local-clip-engine"
                }, ensure_ascii=False).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass

if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), ClipHandler)
    print(f"[*] ZeroMall Local CLIP Vector & Vision Audit Service is listening on 0.0.0.0:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Stopping server...")
        server.server_close()
