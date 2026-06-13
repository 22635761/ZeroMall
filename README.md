# ZeroMall - Shopee Clone Microservices & Monorepo

ZeroMall là một hệ thống thương mại điện tử mô phỏng (Shopee Clone) được xây dựng theo kiến trúc Microservices tinh gọn, phục vụ cho mục đích phát triển và pair-programming. Dự án được phát triển theo mô hình Monorepo sử dụng **npm workspaces**, đóng gói hoàn chỉnh bằng **Docker Compose** và đồng bộ hóa cơ sở dữ liệu thật với **PostgreSQL**.

---

## 📁 1. Cấu Trúc Dự Án (Project Structure)

```text
ZeroMall/
├── frontend/             # React SPA (Vite + TypeScript + TailwindCSS v4) -> Port 3000
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/   # AuthModal (Đăng ký/Đăng nhập)
│   │   │   ├── buyer/    # Giao diện Người Mua (Home, ProductDetailPage, Header, Hero, Categories...)
│   │   │   └── seller/   # Giao diện Kênh Người Bán (SellerPortal, AddProductForm, ProductListTable)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   └── nginx.conf        # Cấu hình Nginx phục vụ React Router SPA
│
├── services/             # Thư mục chứa các backend microservices (NestJS + Prisma v7)
│   ├── auth-service/     # Quản lý User, Shop & Phân Quyền (RBAC) -> Port 3001
│   │   ├── prisma/
│   │   │   └── schema.prisma # Schema định nghĩa User, Shop, ShopFollow
│   │   └── src/
│   │
│   ├── product-service/  # Quản lý Sản Phẩm, Nhận Xét, Lượt Thích -> Port 3002
│   │   ├── prisma/
│   │   │   └── schema.prisma # Schema định nghĩa Product, Review, ProductLike
│   │   └── src/
│   │
│   ├── order-service/    # Quản lý Đơn Hàng (Đang phát triển) -> Port 3003
│   ├── payment-service/  # Quản lý Thanh Toán (Đang phát triển) -> Port 3004
│   ├── notification-service/ # Gửi thông báo (Đang phát triển) -> Port 3005
│   └── analytics-service/    # Phân tích thống kê (Đang phát triển) -> Port 3006
│
├── docker-compose.yml    # Điều phối toàn bộ Stack (Services + DB + Cache + Brokers)
├── package.json          # Root package.json quản lý npm Workspaces
└── services/product-service/seed_postgres.js # Script nạp/dọn dẹp dữ liệu mẫu database PostgreSQL
```

---

## 🛠️ 2. Công Nghệ Sử Dụng (Tech Stack)

* **Frontend:** React + TypeScript + Vite + TailwindCSS v4 + Nginx (Docker)
* **Backend Microservices:** Node.js + NestJS + TypeScript + Prisma ORM v7
* **Database & Cache:** PostgreSQL (schema độc lập: `auth` và `product`), Redis
* **Message Broker:** Kafka (KRaft mode)
* **Search Engine:** Elasticsearch
* **Object Storage:** MinIO (S3-compatible)

---

## 🌟 3. Các Chức Năng Đã Thực Hiện (Implemented Features)

### 3.1. Phân Hệ Đăng Nhập, Đăng Ký & Phân Quyền (RBAC)
* **Xác thực:** Mã hóa mật khẩu với `bcrypt`, cấp phát `JWT Token`.
* **Phân quyền người dùng:** Gồm 5 vai trò chính: `BUYER` (Người mua), `SHOP_OWNER` (Chủ shop), `SHOP_STAFF` (Nhân viên CSKH của shop), `ADMIN` (Quản trị sàn), `PLATFORM_SUPPORT` (Hỗ trợ kỹ thuật).
* **Guards bảo mật:** `JwtAuthGuard` và `@Roles(...)` kết hợp `RolesGuard` bảo vệ các API nhạy cảm.
* **Tự động hóa:** Tự động khởi tạo cấu hình `Shop` mặc định khi đăng ký tài khoản với vai trò `SHOP_OWNER`.

### 3.2. Kênh Người Bán (Seller Portal) & Quản Lý Sản Phẩm (CRUD)
* **Thêm mới sản phẩm:** Chia biểu mẫu làm 4 tab thông minh (Thông tin cơ bản, Bán hàng, Vận chuyển, Thông tin khác), có thanh checklist tiến trình thời gian thực.
* **Tải lên Media động:** Giả lập upload hình ảnh (tối đa 9 ảnh, có progress bar tải lên), cho phép dán link YouTube/TikTok để xem trước video trực tiếp.
* **Biến thể sản phẩm (Variant Matrix):** Nhập các nhóm phân loại (Màu sắc, Kích cỡ) tự động tạo lưới cấu hình giá và tồn kho hàng loạt.
* **Bảng danh sách sản phẩm (CRUD):** Hỗ trợ lọc theo trạng thái tab (Hoạt động, Đã ẩn, Hết hàng), thanh tìm kiếm theo tên/SKU, bộ lọc danh mục và thao tác Sửa/Xóa/Ẩn/Hiện thời gian thực kết nối database PostgreSQL.

### 3.3. Trang Chi Tiết Sản Phẩm (Product Detail Page)
* **UI chuẩn Shopee:** Giao diện chi tiết, thanh Breadcrumbs, trình trượt chuyển ảnh lớn nhỏ mượt mà.
* **Voucher & Giỏ hàng:** Tính năng thu thập mã giảm giá (Voucher) của Shop, bộ đếm số lượng mua hàng thực tế theo số lượng tồn kho.
* **Thông tin Shop động:** Đọc và đếm dữ liệu trực tiếp từ Postgres: tổng số sản phẩm hiện có, tỉ lệ phản hồi (mặc định 100%), thời gian tham gia tính theo thời gian thực (đăng ký hôm nay hiển thị `"1 ngày"`).

### 3.4. Hệ Thống Đánh Giá (Reviews) & Lượt Thích (Likes) & Theo Dõi Shop (Follows) Thật
* **Đánh giá thật:** Các đánh giá bắt buộc phải do tài khoản người dùng đã đăng ký và đăng nhập trong hệ thống viết. Tên người đánh giá được tự động lấy từ phiên đăng nhập (Read-only) tránh giả mạo danh tính.
* **Điểm sao động:** Trung bình sao của sản phẩm được tính toán động dựa vào công thức trung bình cộng của toàn bộ bản ghi `Review` trong cơ sở dữ liệu.
* **Lượt thích sản phẩm:** Nhấn nút trái tim (♥) sẽ gửi API để lưu mối quan hệ `ProductLike` trong database. Lượt thích mặc định khi mới tạo là `0`.
* **Theo dõi shop:** Nhấn nút **Theo Dõi** để chuyển đổi giữa Theo dõi/Đang theo dõi, tự động lưu mối quan hệ `ShopFollow` và cập nhật tức thì số lượng người theo dõi trên giao diện.

---

## 🚀 4. Hướng Dẫn Khởi Chạy Dự Án Chi Tiết

Có hai cách để chạy dự án: thông qua **Docker Compose (Khuyến nghị)** hoặc **Chạy thủ công từng service trên máy local**.

### LƯU Ý QUAN TRỌNG: Thiết lập file `.hosts`
Để Frontend có thể kết nối với các microservices, hãy đảm bảo hệ điều hành của bạn nhận diện các cổng kết nối cục bộ. Dự án đã cấu hình mặc định trỏ về `localhost` trên máy host.

---

### 📦 CÁCH 1: Chạy bằng Docker Compose (Khuyến nghị)
Bạn chỉ cần một câu lệnh duy nhất để chạy toàn bộ stack hệ thống (Frontend, Auth-Service, Product-Service, PostgreSQL, Redis, Kafka, MinIO, v.v.).

#### **Bước 1: Khởi động Docker Compose**
Tại thư mục root của dự án (`ZeroMall/`), chạy lệnh:
```bash
docker compose up -d --build
```
*Lệnh này sẽ tải các image cần thiết, build mã nguồn ứng dụng và khởi chạy dưới nền.*

#### **Bước 2: Đồng bộ cấu trúc Database (Prisma db push)**
Khi Postgres khởi động xong, bạn cần tạo các bảng cơ sở dữ liệu cho cả hai dịch vụ:
```bash
# Đồng bộ bảng của auth-service
npx prisma db push --schema=services/auth-service/prisma/schema.prisma

# Đồng bộ bảng của product-service
npx prisma db push --schema=services/product-service/prisma/schema.prisma
```

#### **Bước 3: Nạp dữ liệu mẫu (Seeding)**
Chạy tập lệnh nạp dữ liệu mẫu bao gồm tài khoản Buyer/Seller, Shop, Sản phẩm, Nhận xét, Lượt thích và Lượt theo dõi:
```bash
node services/product-service/seed_postgres.js
```
*(Script này sẽ tự động xóa sạch dữ liệu rác cũ và nạp lại từ đầu để tránh trùng lặp dữ liệu)*

#### **Bước 4: Truy cập ứng dụng**
* **React Frontend:** Truy cập `http://localhost:3000`
* **Auth Service API:** `http://localhost:3001`
* **Product Service API:** `http://localhost:3002`

---

### 💻 CÁCH 2: Chạy thủ công trên máy local (Không dùng Docker)
Nếu muốn sửa code nhanh và chạy trực tiếp trên máy cục bộ, hãy đảm bảo bạn vẫn đang chạy container database của Docker:
1. Chạy chỉ database: `docker compose up -d postgres redis`
2. Đồng bộ DB:
   ```bash
   npx prisma db push --schema=services/auth-service/prisma/schema.prisma
   npx prisma db push --schema=services/product-service/prisma/schema.prisma
   ```
3. Mở **3 cửa sổ terminal** tại thư mục root của dự án và chạy:
   * **Terminal 1 (Frontend):** `npm run dev:frontend` (Cổng 3000)
   * **Terminal 2 (Auth Service):** `npm run dev:auth` (Cổng 3001)
   * **Terminal 3 (Product Service):** `npm run dev:product` (Cổng 3002)

---

## 🔑 5. Tài Khoản Thử Nghiệm Có Sẵn (Seeded Accounts)

Sau khi chạy script `seed_postgres.js`, bạn có thể dùng các tài khoản sau để đăng nhập trên giao diện:

| Email | Mật khẩu | Vai trò | Chức năng thử nghiệm |
| :--- | :--- | :--- | :--- |
| **buyer.nh@zeromall.com** | `password123` | `BUYER` | Đăng nhập mua hàng, nhấn Thích (♥), Theo dõi Shop, Viết đánh giá thật. |
| **buyer.t0@zeromall.com** | `password123` | `BUYER` | Tài khoản buyer phụ kiểm tra cộng dồn số lượng lượt thích/theo dõi. |
| **seller1@zeromall.com** | `password123` | `SHOP_OWNER` | Quản lý Shop `"ZeroMall Fashion Hub"`. CRUD sản phẩm thời trang. |
| **seller2@zeromall.com** | `password123` | `SHOP_OWNER` | Quản lý Shop `"ZeroMall Home & Kitchen"`. CRUD sản phẩm gia dụng. |

---

## 📝 6. Hướng Dẫn Cho Người Phát Triển Tiếp Theo (For Next Contributors)

Nếu bạn là người nhận dự án để phát triển tiếp, dưới đây là một số lưu ý quan trọng:

### 1. Thêm Trường/Bảng mới vào Database (Prisma)
1. Cập nhật schema tại `prisma/schema.prisma` của service tương ứng.
2. Chạy lệnh:
   ```bash
   npx prisma db push --schema=services/[tên-service]/prisma/schema.prisma
   ```
3. Chạy lệnh sinh Prisma Client cục bộ:
   ```bash
   npx prisma generate --schema=services/[tên-service]/prisma/schema.prisma
   ```
4. Nếu thay đổi DB chạy trên Docker, hãy chạy `docker compose up -d --build [service]` để Docker build lại image mới chứa Prisma Client vừa cập nhật.

### 2. Sửa đổi Giao diện Frontend
* Các API endpoint của backend được gọi trực tiếp bằng `fetch` lên cổng `http://localhost:3001` (Auth/Shop) và `http://localhost:3002` (Products/Reviews/Likes).
* Toàn bộ UI tuân thủ chuẩn TailwindCSS v4. Khi sửa đổi code Frontend, Docker container `zeromall-frontend` sẽ cần build lại nếu bạn chạy ở chế độ Docker. Khuyến nghị chạy local `npm run dev:frontend` để phát triển giao diện nhanh hơn (HMR - Hot Module Replacement).

### 3. Vận hành các microservice khác
* Các microservice khác như `order-service` hay `payment-service` đã được tạo khung thư mục sẵn. Bạn có thể sao chép cấu hình Prisma/NestJS từ `product-service` để phát triển tương tự.
