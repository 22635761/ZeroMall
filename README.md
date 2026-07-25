# ZeroMall — Shopee Clone (Microservices + Monorepo)

ZeroMall là một hệ thống thương mại điện tử mô phỏng theo mô hình **Shopee**, được xây dựng theo kiến trúc Microservices, đóng gói hoàn chỉnh bằng **Docker Compose**, định tuyến tập trung qua **Kong API Gateway** và đồng bộ dữ liệu thực tế với **PostgreSQL**.

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
│   │   │   ├── seller/         # Seller Portal, ShopRevenue, ShopWallet, ShopBankAccounts...
│   │   │   │   ├── ShopBankAccounts.tsx    # Quản lý tài khoản ngân hàng liên kết người bán
│   │   │   │   ├── ShopWallet.tsx          # Số dư Ví ZeroMall & Rút tiền 1-click
│   │   │   │   └── ShopRevenue.tsx         # Báo cáo doanh thu & bộ lọc Tháng/Năm
│   │   │   ├── admin/          # Admin Portal (Báo cáo hệ thống, GMV, Duyệt shop, Tỉ lệ chiết khấu)
│   │   │   └── cs-support/     # CS Support Portal (Xử lý khiếu nại, Duyệt rút tiền, Đơn hàng)
│   │   ├── pages/
│   │   │   ├── buyer/
│   │   │   │   ├── CategoryProductsPage.tsx # Trang sản phẩm theo danh mục riêng (/category/:slug)
│   │   │   │   ├── ShopDetailPage.tsx       # Trang gian hàng người bán chuẩn Shopee (/shop/:shopId)
│   │   │   │   └── ProductDetailPage.tsx    # Trang chi tiết sản phẩm
│   │   │   ├── seller/SellerPortal.tsx      # Kênh Người Bán (Seller Centre)
│   │   │   ├── admin/AdminPortal.tsx        # Trang Quản Trị Hệ Thống (Admin)
│   │   │   └── CsSupport/CsSupportPage.tsx  # Trang Chăm Sóc Khách Hàng & Hỗ Trợ (CS Portal)
│   │   └── App.tsx
│   ├── Dockerfile
│   └── nginx.conf              # Cấu hình Nginx phục vụ React Router SPA
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
│   ├── payment-service/        # ✅ Thanh toán, Tạm giữ Escrow, Ví & SePay Webhook (NestJS + Prisma) — Port 3005
│   │   ├── prisma/schema.prisma    # Bảng: Transaction, Wallet, WalletTransaction, EscrowTransaction, WithdrawRequest
│   │
│   └── notification-service/   # 🔜 Thông báo bất đồng bộ Kafka
│
├── docker-compose.yml          # Điều phối toàn bộ stack (Services + Kong + Postgres + Kafka)
└── package.json                # Root npm Workspaces
```

---

## 🛠️ 2. Công Nghệ Sử Dụng

| Thành phần | Công nghệ |
| :--- | :--- |
| **Frontend** | React 18 + TypeScript + Vite + TailwindCSS v4 |
| **Backend Microservices** | NestJS + TypeScript + Prisma ORM |
| **API Gateway** | Kong API Gateway (Định tuyến tập trung tại port 8000) |
| **Database** | PostgreSQL 15 (Chia các Schema riêng: `auth`, `product`, `discount`, `order`, `payment`) |
| **Event Streaming** | Apache Kafka (Giao tiếp bất đồng bộ giữa Order, Payment & Product Services) |
| **Payment Gateway** | SePay Webhook (Tự động nạp tiền ví qua mã QR chuyển khoản ngân hàng thực tế) |
| **Map & Geocoding** | Leaflet Map + Goong Maps API (Autocomplete & Reverse Geocoding) |
| **Containerization** | Docker + Docker Compose |

---

## 🌟 3. Các Chức Năng Đã Triển Khai

### 3.1 Trang Chi Tiết Gian Hàng Người Bán Chuẩn Shopee (`/shop/:shopId`)
- **Header Cover Banner**: Thiết kế hiện đại với huy hiệu `Yêu Thích+` / `Mall`, Tên Shop, Trạng thái online, và nút `➕ Theo Dõi` (cập nhật số lượng follower realtime).
- **Thống Kê Gian Hàng**: Số lượng Sản Phẩm, Người Theo Dõi, Đánh Giá trung bình ⭐, Tỉ Lệ Phản Hồi Chat, và Thời Gian Phản Hồi.
- **Mã Giảm Giá Gian Hàng (Shop Vouchers)**: Truy vấn trực tiếp từ CSDL (`discount-service`), chỉ hiển thị mã giảm giá khi Shop có phát hành.
- **Tabs Điều Hướng**: `🛒 Tất Cả Sản Phẩm`, `🔥 Bán Chạy Nhất`, `🏷️ Mã Giảm Giá`, `📋 Giới Thiệu Shop`.

### 3.2 Trang Khám Phá Sản Phẩm Theo Danh Mục Riêng (`/category/:categorySlug`)
- **Breadcrumbs & Hero Banner**: Hiển thị Biểu tượng danh mục (Icon), Tên danh mục, Số sản phẩm sẵn có và mô tả.
- **Quick Switcher Bar**: Cho phép người mua chuyển nhanh qua lại giữa các danh mục ngay tại trang.
- **Bộ Lọc & Sắp Xếp Nâng Cao**: Tìm kiếm nội bộ danh mục, sắp xếp theo *Mới nhất*, *Bán chạy*, *Giá thấp ➔ cao*, *Giá cao ➔ thấp*.
- **Đồng Bộ Thẻ Sản Phẩm**: Hiển thị $100\%$ đồng nhất với thẻ sản phẩm Trang Chủ (ảnh, giá flash price, rating ⭐, số lượng bán).

### 3.3 Tài Khoản Ngân Hàng Kênh Người Bán & Rút Tiền 1-Click
- **Trang Quản Lý Tài Khoản Ngân Hàng (`sub=bank-accounts`)**: Cho phép Thêm, Sửa, Xóa và Đặt làm mặc định các tài khoản ngân hàng liên kết (MBBank, Vietcombank, Techcombank, VietinBank, BIDV, VPBank, TPBank, Agribank, ACB, OCB...).
- **Rút Tiền 1-Click Số Dư Ví ZeroMall (`sub=balance`)**: Tự động tải danh sách ngân hàng đã liên kết, người bán chỉ cần chọn tài khoản từ Dropdown để gửi yêu cầu rút tiền.

### 3.4 Bảo Lưu Chiết Khấu Sàn Khi Đặt Hàng (Commission Preservation)
- Trường `commissionRate` được lưu cố định vào bảng `Order` ngay tại thời điểm đặt hàng.
- Khi giải ngân tạm giữ Escrow về Ví Shop, hệ thống luôn áp dụng tỉ lệ chiết khấu đã bảo lưu của đơn hàng đó, đảm bảo việc Admin thay đổi chiết khấu sàn sau này không ảnh hưởng đến các đơn hàng cũ.

### 3.5 Báo Cáo Thống Kê GMV & Doanh Thu Hệ Thống
- Trang Admin Reports tích hợp bộ lọc Tháng/Năm linh hoạt.
- Thống kê GMV thực tế (chỉ tính các đơn hàng `COMPLETED` & `PROCESSING`, loại bỏ cước vận chuyển và đơn hủy/chờ thanh toán).
- Báo cáo phân bổ doanh số thanh toán (Ví ZeroPay vs COD) và Top đơn hàng giá trị cao nhất.

### 3.6 Tự Động Nạp Tiền Ví Qua QR SePay Webhook
- Khi người dùng nạp tiền vào Ví ZeroPay, hệ thống sinh mã QR ngân hàng chuẩn VietQR kèm nội dung `ZMPAY <MÃ_GIAO_DỊCH>`.
- Sepay Webhook tự động lắng nghe và cộng số dư ví ngay khi tiền về tài khoản ngân hàng.

---

## 🚀 4. Hướng Dẫn Chạy Dự Án

### Sử Dụng Docker Compose (Khuyến nghị)

**Bước 1 — Khởi động toàn bộ các Container:**
```bash
docker compose up -d --build
```

**Bước 2 — Đồng bộ cấu trúc cơ sở dữ liệu (Database Schema):**
```bash
# Đồng bộ auth-service
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zeromall?schema=auth" npx prisma db push --schema=services/auth-service/prisma/schema.prisma

# Đồng bộ product-service
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zeromall?schema=product" npx prisma db push --schema=services/product-service/prisma/schema.prisma

# Đồng bộ discount-service
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zeromall?schema=discount" npx prisma db push --schema=services/discount-service/prisma/schema.prisma

# Đồng bộ order-service
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zeromall?schema=order" npx prisma db push --schema=services/order-service/prisma/schema.prisma

# Đồng bộ payment-service
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zeromall?schema=payment" npx prisma db push --schema=services/payment-service/prisma/schema.prisma
```

**Bước 3 — Nạp dữ liệu mẫu (Sản phẩm & Review):**
```bash
node services/product-service/seed_postgres.js
```

**Bước 4 — Truy cập các địa chỉ ứng dụng:**

- **React Frontend**: http://localhost:3000
- **Kong API Gateway**: http://localhost:8000
- **pgAdmin (Quản lý Database)**: http://localhost:5050 (Email: `admin@zeromall.com`, Mật khẩu: `admin`)

---

## 🔑 5. Tài Khoản Thử Nghiệm

Mật khẩu mặc định cho tất cả tài khoản: **`123456`**

| Email tài khoản | Vai trò (Role) | Ghi chú |
| :--- | :--- | :--- |
| `buyer.nh@zeromall.com` | BUYER | Người mua hàng, ví ZeroPay sẵn 5.000.000đ |
| `seller1@zeromall.com` | SHOP_OWNER | Cửa hàng "ZeroMall Fashion Hub" |
| `seller2@zeromall.com` | SHOP_OWNER | Cửa hàng "ZeroMall Home & Kitchen" |
| `admin@zeromall.com` | ADMIN | Quản trị viên hệ thống |
| `cs@zeromall.com` | PLATFORM_SUPPORT | Nhân viên Hỗ trợ & Chăm sóc khách hàng |
