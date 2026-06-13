# ZeroMall - Project Status & Memory Log

Tài liệu này lưu trữ toàn bộ trạng thái hiện tại, cấu trúc thư mục, các công nghệ đã cấu hình, các tác nhân và lịch sử triển khai của dự án **ZeroMall (Shopee Clone)**. Đây là file ghi nhớ cốt lõi để theo dõi trạng thái qua từng bước phát triển tiếp theo.

---

## 1. Công Nghệ Sử Dụng (Tech Stack)

* **Frontend:** React + TypeScript + Vite + TailwindCSS v4
* **Backend Microservices:** Node.js + NestJS + TypeScript + Prisma ORM v7
* **Database & Cache:** PostgreSQL, Redis
* **Message Broker:** Kafka (KRaft mode)
* **Search Engine:** Elasticsearch
* **Object Storage:** MinIO (S3-compatible)

---

## 2. Cấu Trúc Thư Mục Hiện Tại (Directory Tree)

```text
ZeroMall/
├── frontend/             # React Frontend (Vite) -> Chạy trên Port 3000
│   ├── public/
│   │   └── hero-banner.png # Banner Flash Sale (AI generated)
│   ├── src/             # React Source Code (Dashboard, Simulator)
│   │   ├── components/  # Header, Hero, Categories, FlashSale, Features, ChatWidget, CheckoutModal
│   │   ├── App.tsx
│   │   └── index.css     # Đã import Tailwind CSS v4
│   ├── package.json
│   └── vite.config.ts    # Cấu hình cổng chạy 3000
│
├── services/             # Thư mục chứa các backend microservices
│   ├── auth-service/     # NestJS Auth & Shop Service -> Chạy trên Port 3001
│   │   ├── prisma/
│   │   │   ├── schema.prisma # Prisma Schema v7 (User model)
│   │   │   └── migrations/   # Lịch sử migration database
│   │   ├── src/
│   │   │   └── main.ts           # Chạy trên port 3001
│   │   ├── package.json
│   │   └── prisma.config.ts  # Config kết nối DB của Prisma v7
│   │
│   ├── product-service/  # NestJS Product Service -> Chạy trên Port 3002
│   ├── order-service/    # NestJS Order Service -> Chạy trên Port 3003
│   ├── payment-service/  # NestJS Payment Service -> Chạy trên Port 3004
│   ├── notification-service/ # NestJS Notification Service -> Chạy trên Port 3005
│   └── analytics-service/ # NestJS Analytics Service -> Chạy trên Port 3006
│
├── package.json             # Root package.json (npm workspaces)
├── .gitignore               # Root gitignore
└── project_status.md        # File ghi nhớ hiện tại
```

---

## 3. Các Tác Nhân Hệ Thống (Actors & Roles)

Hệ thống được thiết kế để phục vụ 8 đối tượng chính:
1. **Khách hàng / Người mua (Buyer/Customer):** Mua hàng, áp mã giảm giá, thanh toán, chat, đánh giá, khiếu nại.
2. **Người bán / Chủ Shop (Seller/Shop Owner):** Đăng ký shop, đăng sản phẩm, quản lý tồn kho, chuẩn bị đơn, tham gia Flash Sale, rút tiền.
3. **Nhân viên của Shop (Shop Staff/Operator):** Nhân viên kho chuẩn bị hàng hoặc nhân viên trực chat tư vấn (chủ shop phân quyền).
4. **Quản trị viên Hệ thống (Platform Admin):** Kiểm duyệt nội dung/Shop vi phạm, thiết lập Platform Voucher, giải quyết tranh chấp (Dispute), quản lý rút tiền.
5. **Nhân viên Hỗ trợ khách hàng sàn (CSKH):** Tiếp nhận yêu cầu hỗ trợ qua livechat từ cả Buyer và Seller, xử lý và kiểm duyệt các đánh giá chứa từ cấm hoặc spam.
6. **Đối tác Giao vận / Shipper (Logistics):** Giao tiếp qua API/Webhook để lấy hàng và cập nhật hành trình đơn.
7. **Đối tác Thanh toán (Payment Gateway):** Momo, VNPay, ZaloPay... thực hiện giao dịch và gửi callback Webhook xác nhận trạng thái hóa đơn.
8. **Hệ thống Kiểm duyệt & Điều phối Tự động (Bots):** Quét từ cấm (Anti-Spam), Tự động hủy đơn quá hạn (Auto-Cancel), Tự động hoàn tất đơn hàng (Auto-Complete).

---

## 4. Các Services Đang Chạy (Running Services & Ports)

### 4.1. Cấu hình Runtime
* **Vite React Frontend:** Chạy tại `http://localhost:3000` (UI chính)
* **NestJS Auth Service:** Chạy tại `http://localhost:3001` (nằm trong `services/auth-service`)
* **NestJS Product Service:** Chạy tại `http://localhost:3002` (nằm trong `services/product-service`)
* **NestJS Order Service:** Chạy tại `http://localhost:3003` (nằm trong `services/order-service`)
* **NestJS Payment Service:** Chạy tại `http://localhost:3004` (nằm trong `services/payment-service`)
* **NestJS Notification Service:** Chạy tại `http://localhost:3005` (nằm trong `services/notification-service`)
* **NestJS Analytics Service:** Chạy tại `http://localhost:3006` (nằm trong `services/analytics-service`)

---

## 5. Lịch Sử Công Việc Đã Thực Hiện (Milestones Completed)

1. **Khởi tạo root workspace:** Cấu hình workspaces trong `package.json`, viết `.gitignore` bỏ qua cache.
2. **Setup NestJS Backend Services:** Khởi tạo các backend microservices (`auth-service`, `product-service`, v.v.).
3. **Setup React Frontend & Homepage:** Cài đặt Tailwind CSS v4, tạo các component Header, Hero, Categories, FlashSale, Features, ChatWidget, CheckoutModal, hoàn thiện trang chủ.
4. **Dọn dẹp mã nguồn thừa (Codebase Cleanup):** Xóa bỏ toàn bộ các thư mục `test/` mặc định sinh bởi Nest CLI trên các microservices, loại bỏ các tệp tin kiểm thử (`*.spec.ts`) để giữ mã nguồn tinh gọn.

---

## 6. Các Phím Tắt / Script Lệnh Tiện Ích

Tại thư mục root của dự án, bạn có thể sử dụng các lệnh npm:
* **Chạy Frontend Dev (Port 3000):** `npm run dev:frontend`
* **Chạy Auth Service Dev (Port 3001):** `npm run dev:auth`
* **Chạy Product Service Dev (Port 3002):** `npm run dev:product`
* **Chạy Order Service Dev (Port 3003):** `npm run dev:order`
* **Chạy Payment Service Dev (Port 3004):** `npm run dev:payment`
* **Chạy Notification Service Dev (Port 3005):** `npm run dev:notification`
* **Chạy Analytics Service Dev (Port 3006):** `npm run dev:analytics`
* **Chạy Đồng thời Tất cả (All Services):** `npm run dev:all`

---

## 7. Thiết Kế Cơ Sở Dữ Liệu & Models Hiện Tại

Hiện tại, cơ sở dữ liệu và Prisma migrations chưa được tích hợp chạy (sẽ thực hiện sau khi cấu hình Docker hoặc cơ sở dữ liệu local hoàn chỉnh). Chi tiết tệp schema nằm tại `services/auth-service/prisma/schema.prisma`.

---

## 8. Chi Tiết Định Tuyến API Hiện Tại

* **Auth Service (`http://localhost:3001`):**
  - `GET /`: Trả về tin nhắn chào mừng của Auth Service.
  - `GET /health`: Kiểm tra sức khỏe các thành phần.
* **Product Service (`http://localhost:3002`):**
  - `GET /`: Trả về tin nhắn chào mừng của Product Service.
