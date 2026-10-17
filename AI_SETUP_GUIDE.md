# Hướng Dẫn Cài Đặt & Chạy Local AI Service (ZeroMall)

Hệ thống AI của ZeroMall hoạt động **100% Local / Offline**, không phụ thuộc vào Google Gemini hay cloud API bên ngoài, đảm bảo không bao giờ hết quota và tốc độ phản hồi < 100ms.

---

## 1. Yêu Cầu Môi Trường
- **Python**: 3.9+ (khuyên dùng Python 3.9 - 3.11)
- **Node.js**: 18+ & Docker Desktop
- **Ollama** (tùy chọn cho NLP nâng cao): https://ollama.com

---

## 2. Khởi Chạy CLIP Microservice (Port 5005) - BẮT BUỘC CHO GIÁM ĐỊNH HÌNH ẢNH

Microservice này phụ trách:
- Giám định mâu thuẫn giữa hình ảnh và tiêu đề (Visual-Text Mismatch).
- Phân loại ngành hàng dựa trên ảnh sản phẩm (Zero-shot Multimodal Classification).
- Phản hồi siêu tốc trong ~80-100ms.

### Bước 2.1: Cài đặt thư viện Python
```bash
cd services/clip-service
pip install -r requirements.txt
```

*(Nếu dùng macOS và gặp lỗi liên quan đến PyTorch, có thể cài trực tiếp: `pip install sentence-transformers pillow torch`)*

### Bước 2.2: Chạy server
```bash
# Chạy trực tiếp:
python3 server.py

# Hoặc chạy ngầm trong background (khuyên dùng):
nohup python3 server.py > /tmp/clip_service.log 2>&1 &
```

### Bước 2.3: Kiểm tra hoạt động
```bash
curl http://localhost:5005/health
# Kết quả trả về:
# {"status": "ok", "service": "zeromall-clip-local-ai", "model": "clip-ViT-B-32", ...}
```

---

## 3. Cài Đặt & Chạy Ollama (Port 11434) - CHO NLP & TÌM KIẾM NGỮ NGHĨA

Dùng để phân tích ý định tìm kiếm của người mua (Search Semantic) và sửa lỗi chính tả:

### Bước 3.1: Cài Ollama
- **macOS**: `brew install ollama` hoặc tải từ [ollama.com](https://ollama.com)
- **Linux**: `curl -fsSL https://ollama.com/install.sh | sh`
- **Windows**: Tải file installer từ [ollama.com](https://ollama.com)

### Bước 3.2: Tải model Qwen 2.5 siêu nhẹ (1.5B)
```bash
ollama run qwen2.5:1.5b
```
*(Gõ `/bye` sau khi test để thoát terminal chat, model sẽ được lưu cục bộ).*

### Bước 3.3: Đảm bảo Ollama đang lắng nghe
```bash
curl http://localhost:11434/api/tags
```

---

## 4. Chạy Toàn Bộ Hệ Thống ZeroMall bằng Docker

Sau khi CLIP service và Ollama đã sẵn sàng:

```bash
# Tại thư mục gốc ZeroMall:
docker-compose up -d --build
```

- **Frontend**: http://localhost:3000
- **Kong Gateway**: http://localhost:8000
- **Product Service**: http://localhost:3002
- **Postgres Database**: localhost:5432
