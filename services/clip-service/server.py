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
print(f"[*] Loading clip-ViT-B-32 model on Apple Silicon / CPU / CUDA...")
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

# ------------------------------------------------------------------------------
# DANH MỤC VẬT PHẨM NGUY HẠI / CẤM KINH DOANH TRÊN SÀN (Visual Contraband Detector)
# ------------------------------------------------------------------------------
PROHIBITED_CONCEPTS = {
    "Vũ khí / Súng đạn": {
        "prompt": "gun handgun pistol rifle shotgun assault firearm weapon ammunition military weapon revolver sniper firearm súng súng ngắn súng trường vũ khí",
        "label": "Súng / Vũ khí sát thương (Firearms/Weapons)",
        "threshold": 0.22
    },
    "Vũ khí lạnh / Kiếm / Dao găm": {
        "prompt": "sword katana samurai combat blade tactical dagger hunting knife switchblade weapon bayonet kiếm dao găm vũ khí thô sơ",
        "label": "Kiếm / Dao găm / Vũ khí thô sơ (Swords/Blades)",
        "threshold": 0.22
    },
    "Chất cấm / Cần sa / Ma túy": {
        "prompt": "cannabis marijuana weed dried drug narcotic pills ecstasy heroin substance meth thuốc phiện cần sa ma túy",
        "label": "Cần sa / Ma túy / Chất kích thích (Cannabis/Drugs)",
        "threshold": 0.22
    },
    "Pháo nổ / Thuốc nổ": {
        "prompt": "firecrackers fireworks pyrotechnics explosives explosive device dynamite pháo nổ pháo hoa nổ thuốc nổ",
        "label": "Pháo nổ / Thuốc nổ (Fireworks/Explosives)",
        "threshold": 0.22
    },
    "Thiết bị quay lén giấu kín": {
        "prompt": "hidden spy camera pinhole spy cam covert surveillance camera camera quay lén ngụy trang",
        "label": "Camera quay lén ngụy trang (Spy Cameras)",
        "threshold": 0.22
    },
    "Tiền polymer giả": {
        "prompt": "counterfeit currency fake banknotes fake money polymer bills tiền polymer giả tiền giả",
        "label": "Tiền polymer giả (Counterfeit Currency)",
        "threshold": 0.22
    }
}

PROHIBITED_KEYS = list(PROHIBITED_CONCEPTS.keys())
PROHIBITED_PROMPTS = [PROHIBITED_CONCEPTS[k]["prompt"] for k in PROHIBITED_KEYS]
print("[*] Pre-encoding prohibited safety vectors for visual contraband detection...")
PROHIBITED_EMBEDDINGS = model.encode(PROHIBITED_PROMPTS)
print(f"[+] {len(PROHIBITED_KEYS)} prohibited safety concepts ready!")

print(f"[+] {len(CAT_KEYS)} category vectors ready! Starting server on port {PORT}...")


COMPATIBLE_CATEGORIES = {
    "Thời Trang Nam": ["Thời Trang Nam", "Thời Trang Nữ", "Thể Thao"],
    "Thời Trang Nữ": ["Thời Trang Nữ", "Thời Trang Nam", "Phụ Kiện Nữ", "Túi Ví Nữ", "Thể Thao"],
    "Thể Thao": ["Thể Thao", "Thời Trang Nam", "Thời Trang Nữ"],
    "Giày Dép Nam": ["Giày Dép Nam", "Giày Dép Nữ", "Thể Thao"],
    "Giày Dép Nữ": ["Giày Dép Nữ", "Giày Dép Nam", "Thời Trang Nữ"],
    "Gia Dụng": ["Gia Dụng", "Nhà Cửa"],
    "Nhà Cửa": ["Nhà Cửa", "Gia Dụng"],
    "Máy Ảnh": ["Máy Ảnh", "Thiết Bị Điện Tử"],
    "Điện Thoại & Phụ Kiện": ["Điện Thoại & Phụ Kiện", "Thiết Bị Điện Tử", "Máy Tính & Laptop"],
    "Máy Tính & Laptop": ["Máy Tính & Laptop", "Thiết Bị Điện Tử", "Điện Thoại & Phụ Kiện"],
    "Thiết Bị Điện Tử": ["Thiết Bị Điện Tử", "Điện Thoại & Phụ Kiện", "Máy Tính & Laptop", "Máy Ảnh"],
    "Túi Ví Nữ": ["Túi Ví Nữ", "Thời Trang Nữ", "Phụ Kiện Nữ"],
    "Sách & VPP": ["Sách & VPP"],
}


def parse_single_image_item(item):
    if not item:
        return None
    if isinstance(item, str):
        if item.startswith("data:") or len(item) > 200:
            raw_str = item.split(",", 1)[1] if item.startswith("data:") else item
            try:
                raw_bytes = base64.b64decode(raw_str)
                return Image.open(io.BytesIO(raw_bytes)).convert("RGB")
            except Exception:
                return None
        elif item.startswith("http://") or item.startswith("https://"):
            try:
                req = urllib.request.Request(item, headers={"User-Agent": "Mozilla/5.0"})
                raw_bytes = urllib.request.urlopen(req, timeout=10).read()
                return Image.open(io.BytesIO(raw_bytes)).convert("RGB")
            except Exception:
                return None
    elif isinstance(item, dict):
        return parse_pil_image(item)
    return None


def parse_pil_image(payload):
    image_b64 = payload.get("imageBase64") or payload.get("image")
    image_url = payload.get("imageUrl") or payload.get("image")

    try:
        if image_b64 and (image_b64.startswith("data:") or len(image_b64) > 200):
            if image_b64.startswith("data:"):
                image_b64 = image_b64.split(",", 1)[1]
            raw_bytes = base64.b64decode(image_b64)
            return Image.open(io.BytesIO(raw_bytes)).convert("RGB")
        elif image_url and (image_url.startswith("http://") or image_url.startswith("https://")):
            req = urllib.request.Request(image_url, headers={"User-Agent": "Mozilla/5.0"})
            raw_bytes = urllib.request.urlopen(req, timeout=10).read()
            return Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    except Exception:
        return None
    return None


def audit_single_image_logic(pil_img, name, category, name_emb=None):
    """
    AGENT: MultiImageVisualAgent
    Thẩm định 1 bức ảnh cụ thể bằng mô hình CLIP ViT-B-32 Zero-Shot Matching
    """
    img_emb = model.encode(pil_img)

    # 0. QUÉT AN TOÀN THỊ GIÁC: PHÁT HIỆN HÀNG CẤM (Vũ khí, Súng, Kiếm, Cần sa...)
    prohibited_sims = util.cos_sim(img_emb, PROHIBITED_EMBEDDINGS)[0]
    best_proh_idx = prohibited_sims.argmax().item()
    max_proh_sim = float(prohibited_sims[best_proh_idx].item())
    proh_key = PROHIBITED_KEYS[best_proh_idx]
    proh_info = PROHIBITED_CONCEPTS[proh_key]

    is_prohibited = False
    prohibited_label = ""
    if max_proh_sim >= proh_info["threshold"]:
        is_prohibited = True
        prohibited_label = proh_info["label"]

    sims = util.cos_sim(img_emb, CAT_EMBEDDINGS)[0]
    best_idx = sims.argmax().item()
    best_cat = CAT_KEYS[best_idx]
    cat_info = CANONICAL_CATEGORIES[best_cat]
    visual_confidence = round(float(sims[best_idx]) * 100, 1)

    title_sim = 0.0
    is_mismatch = False
    reason = ""

    lower_name = name.lower()
    category_clean = (category or "").strip()
    cat_lower = category_clean.lower()
    domain = cat_info.get("domain", "")
    pred_cat = cat_info.get("zero_category", "Thời Trang Nam")

    if is_prohibited:
        is_mismatch = True
        reason = f"[Visual Safety Guard] Hình ảnh nhận diện là {prohibited_label} (độ tin cậy: {round(max_proh_sim*100, 1)}%) - thuộc danh mục hàng cấm kinh doanh tuyệt đối trên sàn ZeroMall!"
    elif best_cat == "Sơ đồ / Tài liệu":
        is_mismatch = True
        reason = f"Ảnh hiển thị sơ đồ/văn bản hệ thống, không phải ảnh chụp sản phẩm thực tế (\"{name}\")."
    elif best_cat == "Cảnh ngoài trời / Xe cộ":
        if not any(k in lower_name for k in ["xe đạp", "bicycle", "cyclist"]):
            is_mismatch = True
            reason = f"Ảnh chụp người đi xe đạp/giao hàng ngoài trời, không khớp với sản phẩm \"{name}\"."

    # A. KIỂM TRA CHÉO HÌNH ẢNH VS NGÀNH HÀNG (Category Cross-Audit Toàn diện)
    if not is_mismatch and category_clean and pred_cat:
        is_compatible = False
        allowed = COMPATIBLE_CATEGORIES.get(pred_cat, [pred_cat])
        for a in allowed:
            if a.lower() in cat_lower or cat_lower in a.lower():
                is_compatible = True
                break

        if not is_compatible:
            is_mismatch = True
            reason = f"Ảnh hiển thị {cat_info['label']} (ngành: {pred_cat}), không tương thích với ngành hàng '{category_clean}' bạn chọn."

    # B. KIỂM TRA CHÉO HÌNH ẢNH VS TIÊU ĐỀ SẢN PHẨM (Title Cross-Audit)
    if not is_mismatch and name:
        if name_emb is None:
            name_emb = model.encode([name])[0]
        title_sim = float(util.cos_sim(img_emb, name_emb)[0].item())

        # 1. TOPS vs BOTTOMS
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

    # Ngưỡng tương đồng Cosine cấu hình động
    cosine_threshold = float(os.environ.get("CLIP_SIMILARITY_THRESHOLD", "0.45"))
    if not is_mismatch and title_sim > 0 and title_sim < cosine_threshold:
        if not reason:
            is_mismatch = True
            reason = f"Độ tương quan giữa ảnh ({cat_info['label']}) và tiêu đề đạt {round(title_sim, 2)}, thấp hơn ngưỡng an toàn {cosine_threshold}."

    final_suggested_cat = cat_info.get("zero_category", "Thời Trang Nam")

    return {
        "isMismatch": is_mismatch,
        "isProhibited": is_prohibited,
        "prohibitedLabel": prohibited_label,
        "detectedVisual": prohibited_label if is_prohibited else cat_info["label"],
        "suggestedTitle": cat_info["suggestedTitle"],
        "suggestedCategory": final_suggested_cat,
        "visualConfidence": visual_confidence,
        "similarity": round(title_sim, 4),
        "reason": reason,
        "source": "local-clip-engine"
    }


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
                "multiImageCapable": True,
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
                name = (payload.get("name") or payload.get("title") or "").strip()
                category = (payload.get("category") or "").strip()
                name_emb = model.encode([name])[0] if name else None

                # Kiểm tra nếu client gửi mảng nhiều ảnh (Multi-Image Audit)
                raw_images = payload.get("images")
                if isinstance(raw_images, list) and len(raw_images) > 0:
                    image_results = []
                    worst_idx = 0
                    worst_item = None
                    min_sim = 1.0

                    for idx, img_item in enumerate(raw_images[:9]): # Quét tối đa 9 ảnh
                        pil_img = parse_single_image_item(img_item)
                        if pil_img is None:
                            continue

                        audit_res = audit_single_image_logic(pil_img, name, category, name_emb)
                        audit_res["imageIndex"] = idx
                        image_results.append(audit_res)

                        # Thuật toán Worst-case Pooling (Lấy trường hợp xấu nhất)
                        cur_sim = audit_res["similarity"]
                        if audit_res["isMismatch"] or cur_sim < min_sim:
                            min_sim = cur_sim
                            worst_idx = idx
                            worst_item = audit_res

                    if not image_results:
                        self.send_response(200)
                        self.send_header("Content-Type", "application/json")
                        self.end_headers()
                        self.wfile.write(json.dumps({
                            "isMismatch": False,
                            "message": "Không đọc được hình ảnh hợp lệ trong album"
                        }).encode("utf-8"))
                        return

                    # Đánh giá tổng hợp: Ưu tiên phát hiện hàng cấm (Vũ khí, Súng, Dao kiếm, Cần sa...)
                    any_prohibited = any(r.get("isProhibited", False) for r in image_results)
                    any_mismatch = any(r["isMismatch"] for r in image_results) or any_prohibited

                    if any_prohibited:
                        proh_item = next(r for r in image_results if r.get("isProhibited", False))
                        worst_item = proh_item
                        worst_idx = proh_item.get("imageIndex", 0)
                        agg_reason = f"Ảnh số {worst_idx + 1} phát hiện {proh_item.get('prohibitedLabel', 'hàng cấm')} - thuộc danh mục hàng cấm kinh doanh trên sàn!"
                    elif any_mismatch:
                        agg_reason = f"Ảnh số {worst_idx + 1} vi phạm: {worst_item['reason'] if worst_item else 'Bất tương đồng với tiêu đề'}"
                    else:
                        agg_reason = f"Toàn bộ {len(image_results)} ảnh hợp lệ và tương đồng với tiêu đề sản phẩm."

                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "isMismatch": any_mismatch,
                        "isProhibited": any_prohibited,
                        "prohibitedLabel": worst_item.get("prohibitedLabel", "") if any_prohibited and worst_item else "",
                        "worstImageIndex": worst_idx,
                        "minSimilarity": round(min_sim, 4),
                        "detectedVisual": worst_item["detectedVisual"] if worst_item else "Sản phẩm",
                        "suggestedTitle": worst_item["suggestedTitle"] if worst_item else name,
                        "suggestedCategory": "Hàng Cấm Kinh Doanh" if any_prohibited else (worst_item["suggestedCategory"] if worst_item else category),
                        "visualConfidence": worst_item["visualConfidence"] if worst_item else 95.0,
                        "similarity": round(min_sim, 4),
                        "reason": agg_reason,
                        "totalImagesScanned": len(image_results),
                        "imageAudits": image_results,
                        "source": "multi-image-clip-agent"
                    }, ensure_ascii=False).encode("utf-8"))
                    return

                # Nếu chỉ gửi 1 ảnh (Single image - Backward compatibility)
                pil_img = parse_pil_image(payload)
                if pil_img is None:
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "isMismatch": False,
                        "message": "Không có ảnh hợp lệ để kiểm tra thị giác"
                    }).encode("utf-8"))
                    return

                res = audit_single_image_logic(pil_img, name, category, name_emb)

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(res, ensure_ascii=False).encode("utf-8"))

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
    print(f"[*] ZeroMall Local CLIP Multi-Image Audit Agent is listening on 0.0.0.0:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Stopping server...")
        server.server_close()
