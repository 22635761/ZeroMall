# ZeroMall — Hướng Dẫn Cài Đặt & Chạy Dự Án

## Yêu Cầu Hệ Thống

| Công cụ | Phiên bản tối thiểu |
|---------|---------------------|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | 4.x trở lên |
| [Node.js](https://nodejs.org/) | 18.x trở lên |
| Git | Bất kỳ |



# ZeroMall — Shopee Clone (Microservices + Monorepo)

ZeroMall là một hệ thống thương mại điện tử mô phỏng theo mô hình **Shopee**, được xây dựng theo kiến trúc Microservices, đóng gói hoàn chỉnh bằng **Docker Compose**, định tuyến tập trung qua **Kong API Gateway**, giao vận chuyên biệt chuẩn **Shopee Express (ZMX Logistics)** và đồng bộ dữ liệu thực tế với **PostgreSQL**.

---

## 📁 1. Cấu Trúc Dự Án

```text
ZeroMall/
├── frontend/                   # React SPA (Vite + TypeScript + TailwindCSS v4)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # AuthModal, ProfileModal, ReviewModal, SepayPaymentModal
│   │   │   ├── buyer/          # Trang chủ, Chi tiết sản phẩm, Header, Đơn mua, Giỏ hàng...
│   │   │   │   ├── BuyerBankAccounts.tsx   # Quản lý tài khoản ngân hàng người mua
│   │   │   │   ├── BuyerWithdrawForm.tsx    # Yêu cầu rút tiền người mua
│   │   │   │   ├── CartStepView.tsx        # Bước 1: Xem giỏ hàng theo shop
│   │   │   │   ├── CheckoutStepView.tsx    # Bước 2: Thanh toán, Áp Voucher & Ví ZeroPay
│   │   │   │   └── BuyerOrdersPage.tsx     # Lịch sử đơn mua & Đánh giá sản phẩm
│   │   │   ├── seller/         # Seller Portal, ShopRevenue, ShopWallet, ShopLogisticsManager...
│   │   │   │   ├── ShopBankAccounts.tsx    # Quản lý tài khoản ngân hàng liên kết người bán
│   │   │   │   ├── ShopWallet.tsx          # Số dư Ví ZeroMall & Rút tiền 1-click
│   │   │   │   ├── ShopRevenue.tsx         # Báo cáo doanh thu & bộ lọc Tháng/Năm
│   │   │   │   └── ShopLogisticsManager.tsx# Quản lý giao vận & đơn hàng ZMX của Shop
│   │   │   ├── delivery/       # ZMX Logistics Components (Chuẩn Shopee Express)
│   │   │   │   ├── DeliveryAuthForm.tsx    # Đăng nhập Cổng Giao Vận (Driver / Hub Staff / Operator)
│   │   │   │   ├── DriverAppView.tsx       # App Di Động Cho Shipper (Lấy hàng, Bàn giao, Giao hàng, Ví COD)
│   │   │   │   ├── HubOperatorStation.tsx  # Trạm Máy Quét Bắn Barcode Bưu Cục / Kho SOC
│   │   │   │   └── LiveMapTracking.tsx     # Bản đồ hành trình tương tác đa chặng Goong Map / Leaflet OSM
│   │   │   ├── admin/          # Admin Portal (Báo cáo hệ thống, GMV, Duyệt shop, Tỉ lệ chiết khấu)
│   │   │   └── cs-support/     # CS Support Portal (Xử lý khiếu nại, Duyệt rút tiền, Đơn hàng)
│   │   ├── pages/
│   │   │   ├── buyer/
│   │   │   │   ├── CategoryProductsPage.tsx # Trang sản phẩm theo danh mục riêng (/category/:slug)
│   │   │   │   ├── ShopDetailPage.tsx       # Trang gian hàng người bán chuẩn Shopee (/shop/:shopId)
│   │   │   │   ├── ProductDetailPage.tsx    # Trang chi tiết sản phẩm
│   │   │   │   └── UserPurchaseTab.tsx      # Lịch sử đơn mua & Tra cứu Live Tracking Map
│   │   │   ├── seller/SellerPortal.tsx      # Kênh Người Bán (Seller Centre)
│   │   │   ├── delivery/DeliveryPortal.tsx  # Cổng Điều Phối & Quản Trị Logistics ZMX
│   │   │   ├── admin/AdminPortal.tsx        # Trang Quản Trị Hệ Thống (Admin)
│   │   │   └── CsSupport/CsSupportPage.tsx  # Trang Chăm Sóc Khách Hàng & Hỗ Trợ (CS Portal)
│   │   └── App.tsx
│   ├── Dockerfile
│   └── nginx.conf              # Cấu hình Nginx phục vụ React Router SPA & Subdomains
│
├── services/
│   ├── auth-service/           # ✅ Xác thực & Phân quyền (NestJS + Prisma) — Port 3001
│   │   ├── prisma/schema.prisma    # Bảng: User, Shop, ShopFollow, AuditLog
│   │
│   ├── product-service/        # ✅ Quản lý sản phẩm, Danh mục & Review (NestJS + Prisma) — Port 3002
│   │   ├── prisma/schema.prisma    # Bảng: Product, Category, Review, ProductLike
│   │
│   ├── discount-service/       # ✅ Quản lý mã giảm giá / Voucher (NestJS + Prisma) — Port 3003
│   │   ├── prisma/schema.prisma    # Bảng: Voucher
│   │
│   ├── order-service/          # ✅ Quản lý đơn hàng & Bảo lưu chiết khấu (NestJS + Prisma) — Port 3004
│   │   ├── prisma/schema.prisma    # Bảng: Order, OrderItem
│   │
│   ├── payment-service/        # ✅ Thanh toán, Ký quỹ Escrow, Ví & SePay Webhook (NestJS + Prisma) — Port 3005
│   │   ├── prisma/schema.prisma    # Bảng: Transaction, Wallet, WalletTransaction, EscrowTransaction, WithdrawRequest
│   │
│   └── delivery-service/       # ✅ Hệ thống Giao Vận ZeroExpress / SPX (NestJS + Prisma) — Port 3008
│       ├── prisma/schema.prisma    # Bảng: Hub, Driver, Shipment, DeliveryAssignment, HubScan, CodTransaction...
│
├── docker-compose.yml          # Điều phối toàn bộ stack (Services + Kong + Postgres + Kafka + Redis)
└── package.json                # Root npm Workspaces
```

---

## 🛠️ 2. Công Nghệ Sử Dụng

| Thành phần | Công nghệ |
| :--- | :--- |
| **Frontend** | React 18 + TypeScript + Vite + TailwindCSS v4 |
| **Backend Microservices** | NestJS + TypeScript + Prisma ORM |
| **API Gateway** | Kong API Gateway (Định tuyến tập trung tại port 8000) |
| **Database** | PostgreSQL 15 (Chia các Schema riêng: `auth`, `product`, `discount`, `order`, `payment`, `delivery`) |
| **Event Streaming** | Apache Kafka (Giao tiếp bất đồng bộ giữa Order, Payment, Delivery & Product Services) |
| **Payment Gateway** | SePay Webhook (Tự động nạp tiền ví qua mã QR chuyển khoản ngân hàng thực tế) |
| **Map & Geocoding** | Leaflet Map + OpenStreetMap + Goong Maps API (Bản đồ lộ trình đa chặng thời gian thực) |
| **Containerization** | Docker + Docker Compose |

---

## 🌟 3. Các Chức Năng Nổi Bật Đã Triển Khai

### 3.1 Hệ Thống Giao Vận Chuyên Biệt Chuẩn Shopee Express (ZMX Logistics)
- **Chu Trình 4 Giai Đoạn Nối Tiếp Thực Tế**:
  1. `PICKUP`: Shipper khu vực nhận nhiệm vụ lấy hàng tại kho Shop $\rightarrow$ Quét "Đã lấy xong".
  2. `HANDOVER & SORTING`: Shipper nộp về Bưu cục gửi (Kho SOC) $\rightarrow$ Nhân viên kho quét nhập kho & đóng xe tải đường dài Linehaul.
  3. `INBOUND RECEIVING`: Xe tải trung chuyển đến Bưu cục phát $\rightarrow$ Nhân viên bưu cục đích quét nhận kiện.
  4. `LAST-MILE DISPATCH`: Hệ thống chia tuyến phát $\rightarrow$ Shipper nhận nhiệm vụ giao tận nhà khách $\rightarrow$ Xác nhận giao thành công & thu tiền COD.
- **Bản Đồ Hành Trình Trực Quan (Live Interactive Map Tracking)**:
  - Tích hợp Goong Map & Leaflet OSM hiển thị trực quan 3 mốc: **Kho Người Bán ➔ Bưu Cục Phát ➔ Nhà Khách Hàng**.
  - Marker động biểu diễn Xe tải Linehaul đang chạy trên quốc lộ và Shipper đang di chuyển phát hàng tận nơi.
  - Phân tích địa chỉ động $100\%$ từ CSDL thực tế, không hardcode.

### 3.2 Quy Tắc Tiền Tệ, Ký Quỹ & Hạn Mức COD (Escrow & Settlement)
- **Ký Quỹ Đảm Bảo Shopee (Shopee Guarantee / Escrow Holding)**:
  - Tiền thanh toán của khách (Online Sepay/ZeroPay hoặc COD) được giữ ở trạng thái `HELD` trong tài khoản ký quỹ sàn.
  - **Nhả tiền về Ví Shop (`RELEASED`)**: Ngay lập tức khi khách bấm *"Đã nhận được hàng"* / *"Đánh giá"* hoặc sau 3 ngày kể từ khi `DELIVERED`. Tự động trừ $5\%$ phí sàn và cộng $95\%$ doanh thu thực vào Ví Shop.
- **Hạn Mức Thu Nộp COD Của Shipper (COD Cap & Remittance)**:
  - Giới hạn tiền mặt COD Shipper được giữ tối đa là **10.000.000đ**.
  - Nếu vượt 10 triệu $\rightarrow$ Hệ thống tự động khóa nhận đơn mới.
  - Tích hợp nút *"Nộp Tiền COD Về Bưu Cục"* để giải phóng hạn mức và mở khóa tài xế.

### 3.3 Phân Quyền Trạm Khai Thác Kho & App Tài Xế
- **Trạm Khai Thác Kho Chuyên Biệt (`HUB_OPERATOR`)**: Dành riêng cho Nhân viên tại từng Kho (Tân Bình SOC, Biên Hòa Hub, Mê Linh SOC) với giao diện Máy quét bắn mã Barcode tốc độ cao.
- **App Di Động Cho Tài Xế (`DRIVER`)**: Nhận đơn, gọi khách 1-click, dẫn đường Google Maps, bàn giao kho và quản lý ví thu hộ COD.
- **Trung Tâm Điều Phối Cấp Cao (`LOGISTICS_OPERATOR`)**: Giám sát mạng lưới Hub toàn quốc, bảng đối soát COD và quản lý đội ngũ tài xế.

---

## 🚀 4. Hướng Dẫn Chạy Dự Án

### Khôi Phục Nhanh CSDL Từ Tệp Sao Lưu (`zeromall_backup.sql`)

**Bước 1 — Khởi động toàn bộ stack với Docker Compose:**
```bash
docker compose up -d --build
```

**Bước 2 — Import toàn bộ Cơ Sở Dữ Liệu từ tệp `zeromall_backup.sql` có sẵn:**
```bash
docker exec -i zeromall-postgres psql -U postgres -d zeromall < zeromall_backup.sql
```
*Chỉ cần chạy duy nhất lệnh trên, toàn bộ 6 Schema (`auth`, `product`, `discount`, `order`, `payment`, `delivery`) sẽ được khôi phục $100\%$ hoàn chỉnh!*

---

### 🌐 Địa Chỉ Truy Cập Dịch Vụ

- **Sàn Mua Sắm ZeroMall (Buyer & Seller)**: http://localhost:3000 hoặc http://zeromall.local:3000
- **Cổng Giao Vận ZMX (Driver / Hub Station / Operator)**: http://delivery.zeromall.local:3000
- **Kong API Gateway**: http://localhost:8000
- **pgAdmin (Quản lý CSDL)**: http://localhost:5050 (Email: `admin@zeromall.com`, Mật khẩu: `admin`)

---

## 🔑 5. Danh Sách Tài Khoản Thử Nghiệm

Mật khẩu mặc định cho tất cả tài khoản: **`123456`**

| Email tài khoản | Vai trò (Role) | Chức năng / Phạm vi quản lý |
| :--- | :--- | :--- |
| `buyer.nh@zeromall.com` | BUYER | Người mua hàng, ví ZeroPay sẵn 5.000.000đ |
| `seller1@zeromall.com` | SHOP_OWNER | Cửa hàng "ZeroMall Fashion Hub" (Kho: Biên Hòa, Đồng Nai) |
| `seller2@zeromall.com` | SHOP_OWNER | Cửa hàng "ZeroMall Home & Kitchen" (Kho: Phú Nhuận, TP.HCM) |
| `hub_hcm@zeromall.com` | HUB_OPERATOR | Trưởng Kho Tổng Tân Bình SOC (TP.HCM) |
| `hub_bienhoa@zeromall.com` | HUB_OPERATOR | Trưởng Bưu Cục Biên Hòa Hub (Đồng Nai) |
| `hub_melinh@zeromall.com` | HUB_OPERATOR | Trưởng Kho Mê Linh SOC (Hà Nội) |
| `shipper1@zeromall.com` | DRIVER | Tài xế Nguyễn Văn Giao (Tuyến: Tân Bình / TP.HCM) |
| `shipper2@zeromall.com` | DRIVER | Tài xế Trần Đình Phát (Tuyến: Biên Hòa / Đồng Nai) |
| `operator@zeromall.com` | LOGISTICS_OPERATOR | Điều phối viên & Quản trị logistics toàn sàn |
| `admin@zeromall.com` | ADMIN | Quản trị viên hệ thống toàn diện |
| `cskh_1@gmail.com` | PLATFORM_SUPPORT | Nhân viên CSKH & Hỗ trợ khiếu nại |
