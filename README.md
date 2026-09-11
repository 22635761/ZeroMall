# ZeroMall — Sàn Thương Mại Điện Tử & Hệ Thống Giao Vận ZMX Express

Hệ thống mô phỏng đầy đủ chu trình thương mại điện tử chuẩn **Shopee** và giao vận chuyên biệt **Shopee Express (SPX / ZMX Logistics)**:
- Kiến trúc **Microservices** đóng gói hoàn chỉnh bằng **Docker Compose**.
- Định tuyến tập trung qua **Kong API Gateway**.
- Cơ sở dữ liệu phân tán **PostgreSQL** với các Schema độc lập.
- Giao tiếp bất đồng bộ qua **Apache Kafka**.
- Hệ thống thanh toán tự động với **SePay QR Code** & Ví điện tử **ZeroPay**.
- Vận hành Logistics thực tế: **Điểm danh GPS khuôn mặt, Chụp ảnh lấy hàng POP, Đóng xe tải Linehaul niêm phong Seal chì, Đối soát chuyến xe đến, Phân tuyến bưu cục và Shipper quét nhận hàng xuất kho**.

---

## 📋 Danh Sách Cổng & Dịch Vụ Hệ Thống (Port Mapping)

Khi khởi động toàn bộ stack bằng Docker, các cổng sau được ánh xạ ra máy chủ để kiểm tra:

| Cổng (Port) | Dịch vụ (Service Container) | Công nghệ | Mục đích / Chức năng |
| :--- | :--- | :--- | :--- |
| **`3000`** | `zeromall-frontend` | React 18, Vite, Tailwind v4, Nginx | Giao diện toàn bộ hệ thống (Sàn mua sắm, Seller, Delivery, Admin, CSKH) |
| **`8000`** | `zeromall-kong` | Kong API Gateway | Cổng định tuyến API tập trung cho toàn bộ backend microservices |
| **`8001`** | `zeromall-kong` | Kong Admin API | Cổng quản trị và kiểm tra routes/plugins của Kong Gateway |
| **`3001`** | `zeromall-auth-service` | NestJS, Prisma | Dịch vụ xác thực tài khoản, phân quyền JWT, quản lý người dùng |
| **`3002`** | `zeromall-product-service` | NestJS, Prisma | Quản lý sản phẩm, biến thể (SKU), danh mục hàng hóa & đánh giá |
| **`3003`** | `zeromall-discount-service`| NestJS, Prisma | Quản lý mã giảm giá sàn (Platform Voucher) và voucher của Shop |
| **`3004`** | `zeromall-order-service` | NestJS, Prisma | Tiếp nhận, tách đơn theo từng Shop, tính phí ship GHN/ZMX & lưu vết |
| **`3005`** | `zeromall-payment-service` | NestJS, Prisma | Ví ZeroPay, Ký quỹ đảm bảo (Escrow), Rút tiền ngân hàng, SePay QR |
| **`3008`** | `zeromall-delivery-service`| NestJS, Prisma | Quản lý Hub bưu cục, Chuyến xe tải Linehaul, Đội ngũ Shipper & Seal chì |
| **`5432`** | `zeromall-postgres` | PostgreSQL 15 | Cơ sở dữ liệu trung tâm chứa 6 Schema chuyên biệt |
| **`9092`** | `zeromall-kafka` | Apache Kafka | Event bus truyền tin nhắn bất đồng bộ giữa các service |
| **`2181`** | `zeromall-zookeeper` | Zookeeper | Quản lý và đồng bộ trạng thái cụm Kafka |
| **`5050`** | `zeromall-pgadmin` | pgAdmin 4 | Giao diện đồ họa quản trị CSDL PostgreSQL (Tùy chọn) |

---

## 🚀 Hướng Dẫn Khởi Động & Test Nhanh Dự Án

### 1. Yêu Cầu Hệ Thống
- Đã cài đặt **Docker** & **Docker Desktop** (khuyến nghị bản 4.x trở lên).
- Đã cài đặt **Node.js** (v18+ hoặc v20+).
- Đã cài đặt **Git**.

### 2. Khởi Động Dự Án (Chỉ 2 Bước)

**Bước 1 — Mở Terminal tại thư mục gốc dự án và chạy:**
```bash
docker compose up -d --build
```
*(Chờ Docker tải image, biên dịch mã nguồn và khởi động tất cả các container)*

**Bước 2 — Nạp dữ liệu mẫu hoàn chỉnh vào CSDL (Có sẵn đơn hàng, sản phẩm, bưu cục, tài xế):**
```bash
docker exec -i zeromall-postgres psql -U postgres -d zeromall < zeromall_backup.sql
```
> [!NOTE]
> Lệnh trên sẽ tự động nạp $100\%$ cấu trúc và dữ liệu thực tế cho 6 schema (`auth`, `product`, `discount`, `order`, `payment`, `delivery`), giúp bạn có sẵn dữ liệu test ngay lập tức mà không cần tạo lại từ đầu.

---

## 🌐 Địa Chỉ Truy Cập Từng Phân Hệ

Bạn có thể mở trình duyệt và truy cập theo **đường dẫn Path (mặc định)** hoặc cấu hình **Subdomain ảo** tùy ý:

### Cách 1: Truy cập mặc định qua `localhost:3000` (Không cần cấu hình gì thêm)

| Phân hệ | Đường dẫn truy cập | Đối tượng sử dụng |
| :--- | :--- | :--- |
| **🛍️ Sàn Mua Sắm ZeroMall** | [http://localhost:3000](http://localhost:3000) | Người mua hàng (Buyer): Xem hàng, giỏ hàng, áp mã, thanh toán, theo dõi đơn |
| **🏬 Kênh Người Bán (Seller)** | [http://localhost:3000/seller](http://localhost:3000/seller) | Người bán (Shop Owner): Đăng sản phẩm, chuẩn bị hàng, ví doanh thu shop |
| **🚚 Cổng Giao Vận ZMX Logistics** | [http://localhost:3000/delivery](http://localhost:3000/delivery) | Tài xế (Shipper Mobile), Trạm Bưu Cục (Hub Operator), Điều Phối Viên |
| **👑 Quản Trị Hệ Thống (Admin)** | [http://localhost:3000/admin](http://localhost:3000/admin) | Quản trị sàn (Admin): Báo cáo GMV, duyệt sản phẩm, cài đặt hoa hồng |
| **🎧 Chăm Sóc Khách Hàng (CSKH)**| [http://localhost:3000/admin](http://localhost:3000/admin) | Nhân viên hỗ trợ: Duyệt mở Shop mới, duyệt yêu cầu rút tiền ví |
| **🗄️ pgAdmin (Quản trị CSDL)** | [http://localhost:5050](http://localhost:5050) | Email: `admin@zeromall.com` • Mật khẩu: `admin` |

### Cách 2: Trải nghiệm chuẩn Subdomain (Giống môi trường thực tế)
Nếu muốn mở theo từng subdomain như `seller.zeromall.local:3000`, thêm 1 dòng vào file hosts:
- **macOS/Linux**: `sudo nano /etc/hosts`
- **Windows**: Mở Notepad với quyền Admin file `C:\Windows\System32\drivers\etc\hosts`
```text
127.0.0.1 zeromall.local seller.zeromall.local admin.zeromall.local delivery.zeromall.local
```
Sau đó truy cập:
- Sàn Buyer: [http://zeromall.local:3000](http://zeromall.local:3000)
- Kênh Seller: [http://seller.zeromall.local:3000](http://seller.zeromall.local:3000)
- Cổng Delivery: [http://delivery.zeromall.local:3000](http://delivery.zeromall.local:3000)
- Cổng Admin/CSKH: [http://admin.zeromall.local:3000](http://admin.zeromall.local:3000)

---

## 🔑 Danh Sách Tài Khoản Mẫu Để Kiểm Thử (Test Accounts)

> [!IMPORTANT]
> **Mật khẩu chung cho TẤT CẢ tài khoản bên dưới:** **`123456`**

### 1. Tài Khoản Người Mua Hàng (Buyer)
- **Email:** `buyer.nh@zeromall.com`
- **Cổng đăng nhập:** [http://localhost:3000](http://localhost:3000) (bấm nút "Đăng Nhập" ở góc phải Header)
- **Đặc điểm:** Tài khoản đã có sẵn số dư ví **ZeroPay 5.000.000đ**, địa chỉ nhận hàng tại TP. Hồ Chí Minh để test luồng đặt hàng và thanh toán không cần nạp thêm tiền.

### 2. Tài Khoản Người Bán (Shop Owners)
- **Shop 1 (Thời trang):** `seller1@zeromall.com`
  - **Tên shop:** ZeroMall Fashion Hub (Kho lấy hàng: Phường Trảng Dài, TP. Biên Hòa, Đồng Nai).
- **Shop 2 (Gia dụng):** `seller2@zeromall.com`
  - **Tên shop:** ZeroMall Home & Kitchen (Kho lấy hàng: Quận Phú Nhuận, TP. Hồ Chí Minh).
- **Cổng đăng nhập:** [http://localhost:3000/seller](http://localhost:3000/seller)

### 3. Tài Khoản Quản Trị & CSKH
- **Quản trị sàn (Admin tối cao):** `admin@zeromall.com`
  - Quyền hạn: Báo cáo GMV toàn sàn, duyệt/khóa sản phẩm vi phạm, phân chia hoa hồng sàn, quản lý người dùng.
- **Nhân viên CSKH (CS Support):** `cskh_1@gmail.com`
  - Quyền hạn: Duyệt yêu cầu rút tiền ví ngân hàng của Buyer/Seller, duyệt đơn đăng ký mở Shop mới, xử lý khiếu nại.
- **Cổng đăng nhập:** [http://localhost:3000/admin](http://localhost:3000/admin) (hệ thống tự động điều hướng đúng giao diện Admin hoặc CSKH theo vai trò).

### 4. Tài Khoản Giao Vận ZMX Logistics (Đăng nhập tại [http://localhost:3000/delivery](http://localhost:3000/delivery))

#### A. Đội Ngũ Tài Xế Shipper (App Mobile Shipper View):
- **Tài xế 1 (TP.HCM):** `shipper1@zeromall.com`
  - Họ tên: Nguyễn Văn Giao • Xe máy: `59-X1 123.45` • Phụ trách: Tuyến Tân Bình / TP.HCM.
- **Tài xế 2 (Đồng Nai):** `shipper2@zeromall.com`
  - Họ tên: Trần Đình Phát • Xe máy: `60-F2 678.90` • Phụ trách: Tuyến Biên Hòa / Đồng Nai.

#### B. Trạm Trưởng Khai Thác Bưu Cục (Hub Operator Station - Máy quét Barcode):
- **Kho Tổng Tân Bình SOC (TP.HCM):** `hub_hcm@zeromall.com`
  - Phụ trách bưu cục mã `HCM01`. Quản lý tiếp nhận xe tải vào TP.HCM và phân tuyến phát Last-Mile.
- **Bưu Cục Biên Hòa Hub (Đồng Nai):** `hub_bienhoa@zeromall.com`
  - Phụ trách bưu cục mã `DN01`. Tiếp nhận hàng từ Shipper lấy tại Shop ở Đồng Nai, đóng xe tải đi liên tỉnh.
- **Kho Trung Chuyển Mê Linh SOC (Hà Nội):** `hub_melinh@zeromall.com`
  - Phụ trách bưu cục mã `HN01`. Cụm kho trung chuyển miền Bắc.

#### C. Điều Phối Viên Toàn Sàn (Logistics Operations Manager):
- **Email:** `operator@zeromall.com`
  - Giám sát luồng vận đơn toàn quốc, quản lý đội xe tải, hạn mức COD và đối soát thất thoát.

---

## 🔄 Kịch Bản Kiểm Thử Toàn Trình (End-to-End Walkthrough)

Dưới đây là kịch bản chuẩn để bạn hoặc đồng nghiệp có thể test trọn vẹn từ lúc khách bấm Mua hàng đến khi tiền về ví Người bán:

```
[1. Buyer Đặt Hàng] ➔ [2. Shop Chuẩn Bị & Bàn Giao] ➔ [3. Shipper Lấy Hàng (POP)]
                                                            │
                                                            ▼
[6. Giao Thành Công & Nhả Tiền] ◄── [5. Phân Tuyến & Shipper Nhận Tại Hub] ◄── [4. Hub Đóng Xe Linehaul & Đối Soát]
```

### Bước 1: Người mua đặt hàng
1. Vào `http://localhost:3000`, đăng nhập tài khoản `buyer.nh@zeromall.com`.
2. Chọn sản phẩm bất kỳ, bấm **Thêm Vào Giỏ** hoặc **Mua Ngay**.
3. Tại trang Giỏ hàng & Thanh toán:
   - Chọn phương thức thanh toán: **Ví ZeroPay** (trừ trực tiếp từ số dư 5 triệu có sẵn), **SePay QR**, hoặc **COD (Thanh toán khi nhận hàng)**.
   - Bấm **Đặt Hàng**. Đơn hàng được tạo thành công với mã vận đơn dạng `ZMX...`.

### Bước 2: Người bán xác nhận & Chuẩn bị hàng
1. Mở tab ẩn danh hoặc trình duyệt khác, vào `http://localhost:3000/seller`.
2. Đăng nhập tài khoản Shop tương ứng (ví dụ `seller1@zeromall.com`).
3. Vào mục **Quản lý đơn hàng** $\rightarrow$ Tìm đơn mới $\rightarrow$ Bấm **"Chuẩn Bị Hàng"** và **"Yêu Cầu Shipper Lấy Hàng"**.

### Bước 3: Shipper điểm danh ca sáng & Lấy hàng tại Shop (Proof of Pickup)
1. Vào `http://localhost:3000/delivery`, đăng nhập `shipper2@zeromall.com` (hoặc `shipper1@zeromall.com`).
2. **Điểm danh vào ca (Check-in)**:
   - Nếu đang `OFFLINE`, bấm **"📸 Điểm Danh Vào Ca"**.
   - Bật Camera chụp khuôn mặt thật trực tiếp + xác thực vị trí GPS tại Bưu cục.
   - Khi đã `ONLINE`, hệ thống sẽ tự động gán các đơn hàng cần lấy trong khu vực.
3. **Lấy hàng tại Shop**:
   - Chuyển sang tab **"📦 Đơn Hàng"** $\rightarrow$ Thẻ **"🏪 Lấy Hàng"**.
   - Xem địa chỉ kho shop, bấm **"📦 Xác Nhận Đã Lấy"**.
   - Camera môi trường tự động mở $\rightarrow$ Bấm **"📸 Chụp Ảnh Kiện Hàng"** (bằng chứng nhận hàng POP chuẩn SPX) $\rightarrow$ Xác nhận bàn giao. Đơn chuyển trạng thái `PICKED_UP`.

### Bước 4: Bưu cục gửi nhận bàn giao & Đóng xe tải Linehaul liên tỉnh
1. Đăng nhập `hub_bienhoa@zeromall.com` tại `http://localhost:3000/delivery`.
2. **Khâu 1 (Nhận từ Shipper)**: Bấm nút **"📥 Nhập Kho"** hoặc dùng Camera/súng quét mã barcode kiện hàng vừa lấy. Kiện hàng chuyển sang `AT_ORIGIN_HUB`.
3. **Khâu 2 (Phân loại & Đóng xe tải)**:
   - Chọn các kiện hàng cần gửi đi TP.HCM (Kho Tân Bình SOC).
   - Bấm **"🚛 Đóng Xe Tuyến"**.
   - Chọn Tuyến `DN01 ➔ HCM01`, chọn Xe tải (ví dụ `60C-999.11`), kiểm tra Mã niêm phong Seal chì (ví dụ `SEAL-DN01-HCM01-8832`).
   - Bấm **"Xác Nhận Xuất Xe"**. Đơn chuyển sang `IN_TRANSIT`.

### Bước 5: Bưu cục phát tiếp nhận xe tải & Đối soát cắt seal chì
1. Đăng nhập tài khoản Bưu cục nhận: `hub_hcm@zeromall.com`.
2. Chọn **Khâu 3: "Tiếp Nhận Xe Tải Đến"**.
3. Thấy chuyến xe tải từ Biên Hòa vừa cập bến kèm mã Seal chì niêm phong.
4. Bấm **"📋 Đối Soát Chuyến"** $\rightarrow$ Bật camera/máy quét để dỡ từng kiện hoặc bấm **"Nhập Nhanh Toàn Bộ"**. Kiện hàng chính thức nhập kho phát `AT_DESTINATION_HUB`.

### Bước 6: Bưu cục phát phân tuyến & Shipper quét nhận hàng xuất kho
1. Vẫn ở tài khoản `hub_hcm@zeromall.com`, chuyển sang **Khâu 4: "Chia Tuyến Giao"**.
2. Bấm **"🛵 Phân Tuyến Giao"** (hoặc chọn nhiều kiện bấm **"Phân Tuyến Shipper"**):
   - Modal bật lên hiển thị danh sách Shipper thuộc bưu cục.
   - Bấm **"⚡ Đề Xuất Theo Tuyến"** để tự động gán cho Shipper phụ trách khu vực của khách (ví dụ `Nguyễn Văn Giao`).
   - Đơn chuyển sang trạng thái: **`DELIVERY_ASSIGNED` (Chờ Shipper Nhận Tại Bưu Cục)**.
3. Đăng nhập App Shipper `shipper1@zeromall.com`:
   - Vào tab **"🛵 Giao Hàng"**: Kiện hàng xuất hiện ở mục **"🏢 Chờ Quét Nhận Tại Bưu Cục"** (chưa lên xe máy).
   - Shipper kiểm đếm kiện vật lý tại kệ, bấm **"📷 Quét Nhận Lên Xe"** (hoặc vào tab **"📷 Quét Mã"** quét barcode).
   - Kiện hàng chính thức chuyển sang mục **"🛵 Đang Trên Xe Đi Giao" (`OUT_FOR_DELIVERY`)**.

### Bước 7: Shipper giao hàng & Ký quỹ nhả tiền cho Người Bán
1. Shipper đến nhà người nhận, bấm **"📞 Gọi Khách"**, **"🗺️ Dẫn Đường"**.
2. Khách nhận hàng: Shipper bấm **"✅ Giao Thành Công & Thu COD"**. Đơn chuyển sang `DELIVERED`.
3. Khách hàng (`buyer.nh@zeromall.com`) vào lại [http://localhost:3000](http://localhost:3000) $\rightarrow$ Vào **Đơn Mua** $\rightarrow$ Bấm **"Đã Nhận Hàng"** hoặc gửi Đánh giá 5 sao.
4. Hệ thống Ký Quỹ (Escrow) tự động giải phóng tiền giữ: Khấu trừ $5\%$ phí sàn và cộng $95\%$ doanh thu ròng vào Ví người bán (`ShopWallet`). Shop có thể bấm Rút Tiền về ngân hàng ngay lập tức!

---

## 🛠️ Xử Lý Sự Cố Thường Gặp (Troubleshooting)

- **Nếu không kết nối được Docker:** Đảm bảo Docker Desktop đã được mở và đang chạy ở chế độ nền.
- **Nếu cổng 3000 hoặc 8000 bị trùng:** Kiểm tra xem có tiến trình nào đang chiếm cổng bằng `lsof -i :3000` (macOS) hoặc `netstat -ano | findstr :3000` (Windows) và tắt ứng dụng trùng.
- **Nếu muốn xem log của một service bất kỳ:**
  ```bash
  docker compose logs -f delivery-service   # Xem log giao vận
  docker compose logs -f order-service      # Xem log đặt hàng
  docker compose logs -f frontend           # Xem log giao diện
  ```
- **Khởi động lại toàn bộ từ đầu:**
  ```bash
  docker compose down -v && docker compose up -d --build
  docker exec -i zeromall-postgres psql -U postgres -d zeromall < zeromall_backup.sql
  ```
