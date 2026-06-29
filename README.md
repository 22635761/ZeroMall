# ZeroMall — Shopee Clone (Microservices + Monorepo)

ZeroMall là một hệ thống thương mại điện tử mô phỏng theo mô hình **Shopee**, được xây dựng theo kiến trúc Microservices, đóng gói hoàn chỉnh bằng **Docker Compose**, định tuyến tập trung qua **Kong API Gateway** và đồng bộ dữ liệu thật với **PostgreSQL**.

---

## 📁 1. Cấu Trúc Dự Án

```text
ZeroMall/
├── frontend/                   # React SPA (Vite + TypeScript + TailwindCSS v4)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # AuthModal (Đăng ký / Đăng nhập), ProfileModal
│   │   │   ├── buyer/          # Trang chủ, Chi tiết sản phẩm, Header, Đơn mua...
│   │   │   │   ├── AddressModal.tsx      # Quản lý địa chỉ 3 cấp hành chính & Bản đồ
│   │   │   │   ├── CartStepView.tsx      # Bước 1: Xem giỏ hàng theo shop
│   │   │   │   ├── CheckoutStepView.tsx  # Bước 2: Thanh toán, Áp Voucher & Chọn ví ZeroPay
│   │   │   │   ├── BuyerOrdersPage.tsx   # Lịch sử đơn hàng đã mua & Quản lý trạng thái đơn
│   │   │   │   └── CartPage.tsx          # Điều phối luồng Giỏ hàng - Thanh toán
│   │   │   └── seller/         # Seller Portal, ShopOnboarding, Vouchers...
│   │   └── App.tsx
│   ├── Dockerfile
│   └── nginx.conf              # Cấu hình Nginx phục vụ React Router SPA
│
├── services/
│   ├── auth-service/           # ✅ Xác thực & Phân quyền (NestJS + Prisma) — Port 3001
│   │   ├── prisma/schema.prisma    # Bảng: User, Shop, ShopFollow
│   │
│   ├── product-service/        # ✅ Quản lý sản phẩm & Review (NestJS + Prisma) — Port 3002
│   │   ├── prisma/schema.prisma    # Bảng: Product, Review, ProductLike
│   │   ├── seed_postgres.js        # Script nạp dữ liệu mẫu
│   │
│   ├── discount-service/       # ✅ Quản lý mã giảm giá / Voucher (NestJS + Prisma) — Port 3003
│   │   ├── prisma/schema.prisma    # Bảng: Voucher
│   │
│   ├── order-service/          # ✅ Quản lý đơn hàng (NestJS + Prisma) — Port 3004
│   │   ├── prisma/schema.prisma    # Bảng: Order, OrderItem
│   │
│   ├── payment-service/        # ✅ Thanh toán & Ví giả lập ZeroPay (NestJS + Prisma) — Port 3005
│   │   ├── prisma/schema.prisma    # Bảng: Transaction, Wallet
│   │
│   ├── notification-service/   # 🔜 Thông báo (chưa phát triển)
│   └── analytics-service/      # 🔜 Phân tích thống kê (chưa phát triển)
│
├── kong/
│   └── kong.yml                # Cấu hình định tuyến và Rules cho Kong API Gateway
├── docker-compose.yml          # Điều phối toàn bộ stack (Services + Kong + Postgres + Redis)
└── package.json                # Root npm Workspaces định nghĩa các script chạy nhanh
```

---

## 🛠️ 2. Công Nghệ Sử Dụng

| Thành phần | Công nghệ |
| :--- | :--- |
| **Frontend** | React 18 + TypeScript + Vite + TailwindCSS v4 |
| **Backend Microservices** | NestJS + TypeScript + Prisma ORM |
| **API Gateway** | Kong API Gateway (Định tuyến tập trung, bảo mật cổng ngoài) |
| **Database** | PostgreSQL 15 (Mỗi microservice sở hữu schema riêng độc lập) |
| **Map & Geocoding** | Leaflet Map (Bản đồ tương tác) + Goong Maps API (Autocomplete địa chỉ, Reverse Geocoding) |
| **Cache & Session** | Redis 7 |
| **Containerization** | Docker + Docker Compose |

---

## 🌟 3. Chức Năng Đã Hoàn Thành

### 3.1 Xác Thực & Phân Quyền (RBAC)
- Đăng ký / Đăng nhập với mã hóa mật khẩu `bcrypt` + JWT Token.
- Hỗ trợ các vai trò người dùng: `BUYER`, `SHOP_OWNER`, `SHOP_STAFF`, `ADMIN`.
- Tự động tạo `Shop` nháp khi đăng ký tài khoản `SHOP_OWNER`, chuyển sang luồng Onboarding bổ sung thông tin địa chỉ lấy hàng và kích hoạt vận chuyển trước khi được Admin phê duyệt hoạt động.

### 3.2 Kênh Người Bán (Seller Portal) & Onboarding
- Cung cấp luồng đăng ký hồ sơ shop đầy đủ thông tin: địa chỉ lấy hàng kết hợp bản đồ tìm kiếm Goong Map và lựa chọn cấu hình các phương thức vận chuyển (Hỏa tốc, Nhanh, Tiết kiệm).
- Thêm/Sửa/Xóa/Ẩn sản phẩm kết nối thẳng với PostgreSQL.
- Hỗ trợ thiết lập biến thể sản phẩm động (ví dụ: Màu sắc x Kích thước) tự động tạo bảng lưới cập nhật giá tiền, số lượng kho và mã SKU riêng biệt.

### 3.3 Khuyến Mãi & Kênh Marketing (`discount-service`)
- Chủ shop tự tạo và quản lý mã giảm giá (Voucher) cho cửa hàng của mình với số lượng giới hạn, mức giảm và giá trị đơn tối thiểu cụ thể.
- Giao diện tạo voucher có tính năng xem trước trực quan (Live Mockup Card) hiển thị giao diện coupon sẽ hiển thị cho người mua.
- Tích hợp áp dụng mã giảm giá của từng Shop và mã giảm giá chung của sàn ZeroMall tại bước Checkout, tự động tính toán trừ tiền trên hóa đơn.

### 3.4 Định Vị & Quản Lý Địa Chỉ 3 Cấp Hành Chính
- Xây dựng Module quản lý địa chỉ nhận hàng của người mua:
  - Bản đồ tương tác **Leaflet** với ghim định vị kéo thả (draggable marker).
  - Ô tìm kiếm gợi ý địa chỉ nhanh sử dụng **Goong Autocomplete API**.
  - Tự động lia bản đồ (flyTo) theo cấp độ zoom hành chính tương ứng khi chọn vùng.
  - Đồng bộ 2 chiều: Ghim bản đồ tự động điền Form (qua **Goong Reverse Geocoding API**), và ngược lại chọn dropdown Tỉnh ➔ Quận/Huyện ➔ Phường/Xã sẽ tự động định vị trên bản đồ.

### 3.5 Quản Lý Đơn Hàng (`order-service`)
- Tiếp nhận yêu cầu đặt hàng thực tế từ Frontend, lưu trữ thông tin hóa đơn và các món hàng chi tiết kèm theo trạng thái đơn (`PENDING_PAYMENT`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
- Hỗ trợ lọc đơn hàng theo Buyer ID hoặc theo Shop ID phục vụ trang quản lý đơn mua và quản lý đơn bán.
- Cung cấp API cập nhật trạng thái đơn hàng bất đồng bộ.

### 3.6 Thanh Toán & Ví Giả Lập ZeroPay (`payment-service`)
- Xử lý các giao dịch thanh toán đơn hàng.
- Tích hợp phương thức thanh toán **Ví ZeroPay** giả lập:
  - Tự động khởi tạo ví mới và nạp sẵn **5.000.000đ** cho tài khoản thử nghiệm khi truy vấn ví lần đầu.
  - Thực hiện trừ tiền ví ảo khi thanh toán và cập nhật trạng thái giao dịch.
  - Sử dụng giao tiếp liên dịch vụ (Service-to-Service REST API) để tự động gọi sang `order-service` cập nhật đơn hàng sang trạng thái `PROCESSING` ngay khi thanh toán thành công.

### 3.7 Quản Lý Đơn Mua & Tối Ưu Giao Diện
- Trang **"Đơn mua"** cá nhân hiển thị chi tiết danh sách đơn hàng đã mua chia theo từng tab trạng thái rõ rệt.
- Hỗ trợ người mua nhấn **Hủy đơn hàng** trực tiếp (nếu đơn chưa giao) hoặc nhấn **Đã nhận được hàng** để hoàn thành đơn hàng.
- Tối ưu hóa UI Dropdown cá nhân góc trên phải: Chức năng xem "Đơn mua" được đặt ngay dưới "Thông tin cá nhân" và loại bỏ hoàn toàn các liên kết Kênh người bán thừa đối với Buyer.

---

## 🚀 4. Hướng Dẫn Chạy Dự Án

### CÁCH 1: Sử Dụng Docker Compose (Khuyến nghị)

**Bước 1 — Khởi động toàn bộ các Container:**
```bash
docker compose up -d --build
```

**Bước 2 — Đồng bộ cấu trúc cơ sở dữ liệu (Database Schema):**
Do hệ thống sử dụng các schema PostgreSQL độc lập để phân tách dữ liệu các microservice, bạn cần đẩy schema Prisma của từng dịch vụ vào cơ sở dữ liệu:
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
*Lưu ý: Script này sẽ dọn sạch và nạp lại các sản phẩm mẫu để tránh trùng lặp dữ liệu.*

**Bước 4 — Truy cập các dịch vụ:**

Mọi request API từ Frontend gọi lên đều được định tuyến thông qua **Kong API Gateway** tại cổng `8000`:
- **React Frontend**: http://localhost:3000
- **pgAdmin (Quản lý Database)**: http://localhost:5050
- **API Gateway (Kong)**: http://localhost:8000
  - Cổng định tuyến Auth API: `/auth/*` ➔ `auth-service:3001`
  - Cổng định tuyến Product API: `/products/*` ➔ `product-service:3002`
  - Cổng định tuyến Discount API: `/discounts/*` ➔ `discount-service:3003`
  - Cổng định tuyến Order API: `/orders/*` ➔ `order-service:3004`
  - Cổng định tuyến Payment API: `/payments/*` ➔ `payment-service:3005`

---

### CÁCH 2: Chạy Dưới Môi Trường Local (Không qua Docker)

Khởi động các hạ tầng cơ bản (Database PostgreSQL & Cache Redis) trước:
```bash
docker compose up -d postgres redis
```

Sau đó, mở một Terminal tại thư mục root của dự án và chạy lệnh khởi chạy đồng thời tất cả các service cùng frontend:
```bash
npm run dev:all
```
*Lưu ý: Lệnh này sử dụng package `concurrently` được cấu hình ở root monorepo để chạy song song các script `dev:frontend`, `dev:auth`, `dev:product`, `dev:discount`, `dev:order`, và `dev:payment`.*

---

## 🔑 5. Tài Khoản Thử Nghiệm

Mật khẩu đăng nhập mặc định cho toàn bộ các tài khoản thử nghiệm: **`123456`**

| Email tài khoản | Vai trò (Role) | Ghi chú |
| :--- | :--- | :--- |
| `buyer.nh@zeromall.com` | BUYER | Người mua hàng, đã có giỏ hàng mẫu, ví ZeroPay sẵn 5.000.000đ |
| `buyer.t0@zeromall.com` | BUYER | Người mua hàng thử nghiệm phụ |
| `seller1@zeromall.com` | SHOP_OWNER | Cửa hàng thời trang "ZeroMall Fashion Hub" |
| `seller2@zeromall.com` | SHOP_OWNER | Cửa hàng gia dụng "ZeroMall Home & Kitchen" |
| `admin@zeromall.com` | ADMIN | Quản trị viên hệ thống (sử dụng mật khẩu `admin` khi đăng nhập pgAdmin) |

---

## 🗄️ 6. Quản Lý Dữ Liệu Với pgAdmin

Truy cập địa chỉ `http://localhost:5050` với thông tin đăng nhập:
- **Email**: `admin@zeromall.com`
- **Mật khẩu**: `admin`

Để xem dữ liệu của hệ thống, thêm một Server mới trong pgAdmin với thông số:
- **Connection Host**: `postgres` (hoặc `localhost` nếu chạy ngoài docker)
- **Port**: `5432`
- **Maintenance Database**: `zeromall`
- **Username**: `postgres`
- **Password**: `postgres`

Cơ sở dữ liệu được phân chia cụ thể trong các schema: `auth`, `product`, `discount`, `order`, và `payment`.
