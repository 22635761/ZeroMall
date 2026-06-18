# ZeroMall — Shopee Clone (Microservices + Monorepo)

ZeroMall là một hệ thống thương mại điện tử mô phỏng theo mô hình **Shopee**, được xây dựng theo kiến trúc Microservices, đóng gói hoàn chỉnh bằng **Docker Compose** và đồng bộ dữ liệu thật với **PostgreSQL**.

---

## 📁 1. Cấu Trúc Dự Án

```text
ZeroMall/
├── frontend/                   # React SPA (Vite + TypeScript + TailwindCSS v4)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # AuthModal (Đăng ký / Đăng nhập)
│   │   │   ├── buyer/          # Trang chủ, Chi tiết sản phẩm, Header, Hero...
│   │   │   └── seller/         # Seller Portal, Thêm / Sửa / Xóa Sản Phẩm
│   │   └── App.tsx
│   ├── Dockerfile
│   └── nginx.conf              # Cấu hình Nginx phục vụ React Router SPA
│
├── services/
│   ├── auth-service/           # ✅ Xác thực & Phân quyền (NestJS + Prisma) — Port 3001
│   │   ├── prisma/schema.prisma    # Bảng: User, Shop, ShopFollow
│   │   └── src/
│   │
│   ├── product-service/        # ✅ Quản lý sản phẩm (NestJS + Prisma) — Port 3002
│   │   ├── prisma/schema.prisma    # Bảng: Product, Review, ProductLike
│   │   ├── seed_postgres.js        # Script nạp dữ liệu mẫu
│   │   └── src/
│   │
│   ├── order-service/          # 🔜 Quản lý đơn hàng (chưa phát triển) — Port 3003
│   ├── payment-service/        # 🔜 Thanh toán (chưa phát triển) — Port 3004
│   ├── notification-service/   # 🔜 Thông báo (chưa phát triển) — Port 3005
│   └── analytics-service/      # 🔜 Phân tích thống kê (chưa phát triển) — Port 3006
│
├── docker-compose.yml          # Điều phối toàn bộ stack
└── package.json                # Root npm Workspaces
```

---

## 🛠️ 2. Công Nghệ Sử Dụng

| Thành phần | Công nghệ |
| :--- | :--- |
| Frontend | React + TypeScript + Vite + TailwindCSS v4 |
| Backend (active) | NestJS + TypeScript + Prisma ORM v7 |
| Database | PostgreSQL 15 (schema riêng cho từng service) |
| Cache | Redis 7 |
| Message Broker | Kafka *(chuẩn bị — chưa dùng)* |
| Object Storage | Cloudinary (cloud) |
| Search Engine | Elasticsearch *(chuẩn bị — chưa dùng)* |
| Container | Docker + Docker Compose |

---

## 🌟 3. Chức Năng Đã Hoàn Thành

### 3.1 Xác Thực & Phân Quyền (RBAC)
- Đăng ký / Đăng nhập với mã hóa mật khẩu `bcrypt` + JWT Token.
- 5 vai trò: `BUYER`, `SHOP_OWNER`, `SHOP_STAFF`, `ADMIN`, `PLATFORM_SUPPORT`.
- Tự động tạo `Shop` khi đăng ký tài khoản `SHOP_OWNER`.

### 3.2 Kênh Người Bán (Seller Portal)
- Thêm/Sửa/Xóa/Ẩn sản phẩm kết nối thẳng với PostgreSQL.
- Biểu mẫu 4 tab: Thông tin, Bán hàng, Vận chuyển, Thông tin khác.
- Hỗ trợ biến thể sản phẩm (Color × Size) tự động sinh bảng giá.

### 3.3 Trang Chi Tiết Sản Phẩm
- Giao diện chuẩn Shopee, trình trượt ảnh, chọn biến thể, lưu voucher.
- Thông tin shop tính toán động: số ngày tham gia, tổng sản phẩm, tổng đánh giá.

### 3.4 Đánh Giá, Thích & Theo Dõi (100% Database thật)
- Chỉ tài khoản đã đăng nhập mới được viết đánh giá — tên gắn với tài khoản, không sửa được.
- Điểm sao trung bình tính từ dữ liệu `Review` thật trong database.
- Nút ♥ Thích sản phẩm lưu vào bảng `ProductLike`.
- Nút Theo Dõi / Đang Theo Dõi lưu vào bảng `ShopFollow`, cập nhật số lượng tức thì.

---

## 🚀 4. Hướng Dẫn Chạy Dự Án

### CÁCH 1: Docker Compose (Khuyến nghị)

**Bước 1 — Khởi động toàn bộ stack:**
```bash
docker compose up -d --build
```

**Bước 2 — Đồng bộ cấu trúc database (lần đầu hoặc sau khi thay đổi schema):**
```bash
npx prisma db push --schema=services/auth-service/prisma/schema.prisma
npx prisma db push --schema=services/product-service/prisma/schema.prisma
```

**Bước 3 — Nạp dữ liệu mẫu:**
```bash
node services/product-service/seed_postgres.js
```
> ⚠️ Script này **xóa sạch và tạo lại** toàn bộ dữ liệu mẫu để tránh trùng lặp.

**Bước 4 — Truy cập:**
| Service | Địa chỉ |
| :--- | :--- |
| 🛍️ React Frontend | http://localhost:3000 |
| 🔐 Auth API | http://localhost:3001 |
| 📦 Product API | http://localhost:3002 |
| 🗄️ pgAdmin | http://localhost:5050 |

---

### CÁCH 2: Chạy Local (Không Docker)

Chạy database trước:
```bash
docker compose up -d postgres redis
```

Sau đó mở **3 terminal** tại thư mục root:
```bash
# Terminal 1
npm run dev:frontend

# Terminal 2
npm run dev:auth

# Terminal 3
npm run dev:product
```

Hoặc chạy đồng thời cả 3:
```bash
npm run dev:all
```

---

## 🔑 5. Tài Khoản Thử Nghiệm

> Mật khẩu chung: `password123`

| Email | Vai trò | Ghi chú |
| :--- | :--- | :--- |
| `buyer.nh@zeromall.com` | BUYER | Mua hàng, thích, theo dõi, viết đánh giá |
| `buyer.t0@zeromall.com` | BUYER | Tài khoản buyer phụ |
| `buyer.ma@zeromall.com` | BUYER | Tài khoản buyer phụ |
| `seller1@zeromall.com` | SHOP_OWNER | Shop "ZeroMall Fashion Hub" — thời trang |
| `seller2@zeromall.com` | SHOP_OWNER | Shop "ZeroMall Home & Kitchen" — gia dụng |

---

## 🗄️ 6. Kết Nối pgAdmin

Truy cập `http://localhost:5050` với:
- Email: `admin@zeromall.com`
- Password: `admin`

Sau đó thêm server mới:
- Host: `postgres`
- Port: `5432`
- Database: `zeromall`
- Username: `postgres`
- Password: `postgres`

Dữ liệu nằm trong các schema: `auth` và `product`.

---

## 📝 7. Hướng Dẫn Phát Triển Tiếp

### Thêm bảng / trường mới vào Database
```bash
# 1. Sửa file schema.prisma của service tương ứng
# 2. Đồng bộ vào database
npx prisma db push --schema=services/[service]/prisma/schema.prisma

# 3. Sinh lại Prisma Client
npx prisma generate --schema=services/[service]/prisma/schema.prisma

# 4. Build lại Docker image nếu đang chạy Docker
docker compose up -d --build [service]
```

### Phát triển các service mới (order, payment...)
Các thư mục `order-service`, `payment-service`, `notification-service`, `analytics-service` đã có sẵn cấu trúc NestJS cơ bản. Khi cần phát triển:
1. Copy cấu hình Prisma + Dockerfile từ `product-service` vào service mới.
2. Thêm service vào `docker-compose.yml`.
3. Thêm script `dev:[service]` vào root `package.json`.

### Bật Kafka / Elasticsearch
Các infrastructure này chỉ cần thêm vào `docker-compose.yml` và cài thư viện tương ứng khi cần dùng.
