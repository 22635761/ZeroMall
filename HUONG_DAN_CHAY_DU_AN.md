# HƯỚNG DẪN CLONE VÀ CHẠY DỰ ÁN ZEROMALL

Chào bạn! Đây là hướng dẫn đầy đủ, chi tiết từ A - Z để bạn kéo mã nguồn dự án **ZeroMall** về máy tính và chạy toàn bộ hệ thống Microservices + Cơ sở dữ liệu + Phòng Thử Đồ Online AI một cách mượt mà nhất.

---

## 🛠️ 1. Yêu Cầu Cài Đặt Trước Khi Chạy

Máy tính của bạn cần cài đặt sẵn:
1. **Docker Desktop** (bản mới nhất, đang bật và chạy bình thường).
2. **Node.js** (v18 trở lên hoặc v20 LTS).
3. **Python** (v3.10 hoặc v3.11 - dùng cho Phòng thử đồ ảo AI).
4. **Git**.

---

## 📥 2. Bước 1: Clone Mã Nguồn Về Máy

Mở Terminal (macOS/Linux) hoặc PowerShell / Git Bash (Windows):

```bash
git clone https://github.com/22635761/ZeroMall.git
cd ZeroMall
```

---

## 🚀 3. Bước 2: Khởi Động Toàn Bộ Hệ Thống Bằng Docker

Chỉ cần chạy một lệnh duy nhất:

```bash
docker compose up -d --build
```

> **Thời gian chạy**: Mất khoảng 2 - 5 phút ở lần đầu tiên để Docker tải image và build các service.
> Sau khi xong, hãy kiểm tra danh sách container đang chạy:
> ```bash
> docker ps
> ```

---

## 💾 4. Bước 3: Khôi Phục Cơ Sở Dữ Liệu Thực Tế (Database)

Dự án đã có sẵn bản sao lưu đầy đủ toàn bộ cơ sở dữ liệu (sản phẩm thời trang, tài khoản, giỏ hàng, đơn hàng, hệ thống bưu cục...). 

Bạn chỉ cần chạy lệnh sau:

### Trên macOS / Linux:
```bash
./restore-db.sh
```

### Hoặc chạy lệnh Docker trực tiếp (Hoạt động trên cả Windows):
```bash
docker exec -i zeromall-postgres psql -U postgres -d zeromall < database/init-zeromall.sql
```

> Sau khi nạp xong, hệ thống đã sẵn sàng với hơn 10.000 sản phẩm, tài khoản mẫu và các cấu hình nghiệp vụ hoàn chỉnh!

---

## 🌐 5. Bước 4: Mở Trình Duyệt Để Trải Nghiệm

Sau khi các container đã chạy và CSDL đã được nạp:

- **Trang chủ Mua sắm (Buyer Portal)**: [http://localhost:3000](http://localhost:3000)
- **Kênh Người Bán (Seller Portal)**: [http://localhost:3000/seller/products](http://localhost:3000/seller/products)
- **Hệ Thống Giao Vận ZMX Logistics**: [http://localhost:3000/delivery](http://localhost:3000/delivery)
- **Trung Tâm Chăm Sóc Khách Hàng (CSKH)**: [http://localhost:3000/support](http://localhost:3000/support)
- **Trang Quản Trị Hệ Thống (Admin)**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Kong API Gateway**: [http://localhost:8000](http://localhost:8000)

---

## 🤖 6. Bước 5: Phòng Thử Đồ Ảo AI (Virtual Try-On Port 5006)

Dịch vụ **Phòng Thử Đồ Online AI** (thử đồ chân dung/toàn thân theo số đo Chiều cao & Cân nặng, vóc dáng gầy/mập) đã được cấu hình sẵn sàng:

### Cách 1: Hoàn toàn tự động qua Docker (Khuyên Dùng - Không cần cài Python)
- Dịch vụ `tryon-service` đã được tích hợp trực tiếp vào `docker-compose.yml`.
- Khi bạn chạy `docker compose up -d --build` ở Bước 2, dịch vụ AI **tự động được build và kích hoạt trên cổng 5006**.
- Kiểm tra trạng thái hoạt động:
  ```bash
  curl http://localhost:5006/health
  ```
  *(Kết quả trả về: `{"status": "ok", "service": "zeromall-tryon-service"}`)*

### Cách 2: Chạy trực tiếp bằng Python độc lập trên máy
Nếu bạn muốn chạy bằng Python nội bộ:
1. Mở một tab Terminal mới tại thư mục dự án `ZeroMall`.
2. Cài đặt các thư viện Python:
   ```bash
   pip install -r services/tryon-service/requirements.txt
   ```
3. Khởi chạy service:
   - **Trên macOS / Linux:**
     ```bash
     python3 services/tryon-service/server.py
     ```
   - **Trên Windows:**
     ```bash
     python services/tryon-service/server.py
     ```
4. Khi thấy thông báo `ZeroMall 3D Virtual Try-On Server running at http://localhost:5006` là dịch vụ AI đã sẵn sàng hoạt động!

> **Lưu ý quan trọng cho người dùng Windows & máy mới clone**:
> - Đã sửa triệt để lỗi thiếu thư viện `mage-space`.
> - Đã sửa lỗi đường dẫn tạm thời `/tmp` (tương thích đa nền tảng Windows/macOS/Linux bằng thư viện `tempfile`).
> - Đã hỗ trợ tự động nhận diện ảnh trang phục và ảnh người mẫu cục bộ không lo lỗi đường dẫn.

---

## 🔑 7. Danh Sách Tài Khoản Mẫu Để Đăng Nhập Test

Hệ thống có sẵn các tài khoản demo sau để bạn đăng nhập thử:

| Vai trò | Email / Tên tài khoản | Mật khẩu |
| :--- | :--- | :--- |
| **Người Mua (Buyer)** | `buyer@zeromall.vn` (hoặc `cuong`) | `123456` |
| **Chủ Shop (Seller)** | `seller@zeromall.vn` | `123456` |
| **Nhân Viên Bưu Cục** | `hub@zeromall.vn` | `123456` |
| **Tài Xế Giao Hàng** | `driver@zeromall.vn` | `123456` |
| **Quản Trị Viên (Admin)**| `admin@zeromall.vn` | `123456` |

---

## 🛑 8. Lệnh Tắt Hệ Thống Khi Không Sử Dụng

Khi bạn muốn tắt hệ thống:
```bash
docker compose down
```

Nếu muốn tắt và xóa dữ liệu cache container để chạy lại từ đầu:
```bash
docker compose down -v
```

Chúc bạn trải nghiệm dự án vui vẻ và thành công! 🚀
