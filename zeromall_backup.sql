--
-- PostgreSQL database dump
--

\restrict qhCucdPD0WSWUxXoRfteWNQlUy6sQBYT8gKxrO8eV2sr9SUuOLoFI7T5uy6qoYl

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO postgres;

--
-- Name: discount; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA discount;


ALTER SCHEMA discount OWNER TO postgres;

--
-- Name: order; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA "order";


ALTER SCHEMA "order" OWNER TO postgres;

--
-- Name: payment; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA payment;


ALTER SCHEMA payment OWNER TO postgres;

--
-- Name: product; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA product;


ALTER SCHEMA product OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AuditLog; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth."AuditLog" (
    id text NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "user" text NOT NULL,
    action text NOT NULL
);


ALTER TABLE auth."AuditLog" OWNER TO postgres;

--
-- Name: Shop; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth."Shop" (
    id text NOT NULL,
    name text NOT NULL,
    "ownerId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "responseRate" integer DEFAULT 100 NOT NULL,
    "responseTime" text DEFAULT 'trong vài giờ'::text NOT NULL,
    email text,
    "phoneNumber" text,
    "pickupAddress" text,
    "shippingSettings" text,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    logo text,
    description text
);


ALTER TABLE auth."Shop" OWNER TO postgres;

--
-- Name: ShopFollow; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth."ShopFollow" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "shopId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE auth."ShopFollow" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "shopId" text,
    avatar text,
    birthday text,
    gender text,
    "phoneNumber" text,
    status text DEFAULT 'ACTIVE'::text NOT NULL
);


ALTER TABLE auth."User" OWNER TO postgres;

--
-- Name: Voucher; Type: TABLE; Schema: discount; Owner: postgres
--

CREATE TABLE discount."Voucher" (
    id text NOT NULL,
    "shopId" text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    type text NOT NULL,
    value double precision NOT NULL,
    "minSpend" double precision NOT NULL,
    "maxDiscount" double precision,
    "usageLimit" integer NOT NULL,
    "usedCount" integer DEFAULT 0 NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "targetUserId" text
);


ALTER TABLE discount."Voucher" OWNER TO postgres;

--
-- Name: Order; Type: TABLE; Schema: order; Owner: postgres
--

CREATE TABLE "order"."Order" (
    id text NOT NULL,
    "buyerId" text NOT NULL,
    "buyerEmail" text NOT NULL,
    "buyerName" text NOT NULL,
    "buyerPhone" text NOT NULL,
    "shippingAddress" text NOT NULL,
    "totalAmount" double precision NOT NULL,
    "shippingFee" double precision NOT NULL,
    "paymentMethod" text NOT NULL,
    status text DEFAULT 'PENDING_PAYMENT'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "ghnDistrictId" integer,
    "ghnOrderCode" text,
    "ghnWardCode" text,
    "refundDescription" text,
    "refundEmail" text,
    "refundReason" text,
    "refundProofImages" text,
    "shopDiscountAmount" double precision DEFAULT 0,
    "platformDiscountAmount" double precision DEFAULT 0,
    "shopVoucherCode" text,
    "platformVoucherCode" text,
    "appliedVoucherIds" text,
    "commissionRate" double precision DEFAULT 5
);


ALTER TABLE "order"."Order" OWNER TO postgres;

--
-- Name: OrderItem; Type: TABLE; Schema: order; Owner: postgres
--

CREATE TABLE "order"."OrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    "shopId" text NOT NULL,
    name text NOT NULL,
    image text NOT NULL,
    variant text,
    price double precision NOT NULL,
    quantity integer NOT NULL
);


ALTER TABLE "order"."OrderItem" OWNER TO postgres;

--
-- Name: EscrowTransaction; Type: TABLE; Schema: payment; Owner: postgres
--

CREATE TABLE payment."EscrowTransaction" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "shopId" text NOT NULL,
    amount double precision NOT NULL,
    "commissionRate" double precision NOT NULL,
    status text DEFAULT 'HELD'::text NOT NULL,
    "releaseAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE payment."EscrowTransaction" OWNER TO postgres;

--
-- Name: SystemConfig; Type: TABLE; Schema: payment; Owner: postgres
--

CREATE TABLE payment."SystemConfig" (
    key text NOT NULL,
    value text NOT NULL
);


ALTER TABLE payment."SystemConfig" OWNER TO postgres;

--
-- Name: Transaction; Type: TABLE; Schema: payment; Owner: postgres
--

CREATE TABLE payment."Transaction" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "buyerId" text NOT NULL,
    amount double precision NOT NULL,
    "paymentMethod" text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "providerTxId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE payment."Transaction" OWNER TO postgres;

--
-- Name: Wallet; Type: TABLE; Schema: payment; Owner: postgres
--

CREATE TABLE payment."Wallet" (
    id text NOT NULL,
    "buyerId" text NOT NULL,
    balance double precision DEFAULT 5000000 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "onHoldBalance" double precision DEFAULT 0 NOT NULL
);


ALTER TABLE payment."Wallet" OWNER TO postgres;

--
-- Name: WalletTransaction; Type: TABLE; Schema: payment; Owner: postgres
--

CREATE TABLE payment."WalletTransaction" (
    id text NOT NULL,
    "walletId" text NOT NULL,
    amount double precision NOT NULL,
    type text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'SUCCESS'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE payment."WalletTransaction" OWNER TO postgres;

--
-- Name: WithdrawRequest; Type: TABLE; Schema: payment; Owner: postgres
--

CREATE TABLE payment."WithdrawRequest" (
    id text NOT NULL,
    "shopId" text NOT NULL,
    amount double precision NOT NULL,
    "bankName" text NOT NULL,
    "bankAccount" text NOT NULL,
    "accountName" text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE payment."WithdrawRequest" OWNER TO postgres;

--
-- Name: Category; Type: TABLE; Schema: product; Owner: postgres
--

CREATE TABLE product."Category" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE product."Category" OWNER TO postgres;

--
-- Name: FlashSale; Type: TABLE; Schema: product; Owner: postgres
--

CREATE TABLE product."FlashSale" (
    id text NOT NULL,
    "timeSlot" text NOT NULL,
    "productsCount" integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'UPCOMING'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE product."FlashSale" OWNER TO postgres;

--
-- Name: Product; Type: TABLE; Schema: product; Owner: postgres
--

CREATE TABLE product."Product" (
    id text NOT NULL,
    "shopId" text NOT NULL,
    name text NOT NULL,
    image text,
    category text NOT NULL,
    brand text NOT NULL,
    description text NOT NULL,
    price text NOT NULL,
    stock integer NOT NULL,
    sales integer DEFAULT 0 NOT NULL,
    status text NOT NULL,
    sku text,
    "variationsText" text,
    "hasVariations" boolean DEFAULT false NOT NULL,
    "variationGroups" text,
    "variationRows" text,
    weight text,
    length text,
    width text,
    height text,
    condition text DEFAULT 'new'::text NOT NULL,
    "isPreOrder" boolean DEFAULT false NOT NULL,
    "preOrderDays" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    images text,
    video text,
    "originalPrice" text,
    "isViolated" boolean DEFAULT false NOT NULL,
    "reportsCount" integer DEFAULT 0 NOT NULL,
    "violationReason" text,
    "categoryId" text
);


ALTER TABLE product."Product" OWNER TO postgres;

--
-- Name: ProductLike; Type: TABLE; Schema: product; Owner: postgres
--

CREATE TABLE product."ProductLike" (
    id text NOT NULL,
    "productId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE product."ProductLike" OWNER TO postgres;

--
-- Name: Review; Type: TABLE; Schema: product; Owner: postgres
--

CREATE TABLE product."Review" (
    id text NOT NULL,
    "productId" text NOT NULL,
    username text NOT NULL,
    rating integer NOT NULL,
    comment text NOT NULL,
    variant text NOT NULL,
    reply text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "orderId" text,
    images text
);


ALTER TABLE product."Review" OWNER TO postgres;

--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth."AuditLog" (id, "timestamp", "user", action) FROM stdin;
837bc0b4-c592-497f-a4ed-b40756fed0f5	2026-07-22 08:40:18.009	admin@zeromall.com	Tạo tài khoản CSKH mới cho cskh_1@gmail.com
d1a3364b-37b7-4972-8522-cd447359992d	2026-07-23 11:39:06.211	admin@zeromall.com	Cập nhật trạng thái Flash Sale ID FS-002 thành RUNNING
1e47a643-2b64-45e1-b604-20095e7004d1	2026-07-24 10:56:22.213	admin@zeromall.com	Thay đổi mức chiết khấu sàn thành 10%
cd00344f-4f80-4505-a12a-5355f7f6ac7c	2026-07-25 02:23:46.426	cskh_1@gmail.com	Phê duyệt yêu cầu rút tiền mã #51ff79b8-b051-4d4a-864d-7ac114680ee4
\.


--
-- Data for Name: Shop; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth."Shop" (id, name, "ownerId", "createdAt", "updatedAt", "responseRate", "responseTime", email, "phoneNumber", "pickupAddress", "shippingSettings", status, logo, description) FROM stdin;
6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	ZeroMall Fashion Hub	5c64ac2d-0123-43c0-86bf-b9495528c27d	2023-06-30 04:38:06.895	2026-06-29 05:17:03.087	98	trong vài giờ	seller1@zeromall.com	12345678	{"fullName":"Chủ Shop Thời Trang","phoneNumber":"12345678","province":"Đồng Nai","district":"Biên Hòa","ward":"Tân Phong","detailAddress":"2D-6 Đường Trần Công An, Phường Tân Phong, Thành Phố Biên Hòa, Tỉnh Đồng Nai","coordinates":{"lat":10.956885873872949,"lng":106.82681802522231}}	{"express":true,"fast":true,"saver":true,"bulky":false}	APPROVED	\N	\N
f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	ZeroMall Home & Kitchen	e62d94af-244c-4d16-9e79-cb23e99f59c1	2025-12-31 04:38:06.906	2026-06-29 05:17:05.191	95	trong vài phút	seller2@zeromall.com	123123123	{"fullName":"Chủ Shop Đồ Gia Dụng","phoneNumber":"123456","province":"Hồ Chí Minh","district":"Phú Nhuận","ward":"Phường 1","detailAddress":"Quán Anh Đạt, 34 Hẻm 30 Đoàn Thị Điểm, Phường 1, Quận Phú Nhuận, Thành Phố Hồ Chí Minh","coordinates":{"lat":10.956885873872949,"lng":106.82681802522231}}	{"express":true,"fast":true,"saver":true,"bulky":false}	APPROVED	\N	\N
\.


--
-- Data for Name: ShopFollow; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth."ShopFollow" (id, "userId", "shopId", "createdAt") FROM stdin;
a326db51-be12-4e3a-96f7-d4eff8b6da97	3150f691-6e58-47c7-ad4c-acbd52f027c5	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	2026-06-29 04:38:06.949
689249da-732f-4eef-9744-114008486db9	fe5b7a8f-5682-4fe2-be60-bebb017030e6	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	2026-06-29 04:38:06.951
353719ed-0401-40cd-9573-3867920b62ea	56616593-2515-4adb-a449-6f65e963c0ea	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	2026-06-29 04:38:06.952
25e34619-3850-4412-b724-79da1a8c28c7	3150f691-6e58-47c7-ad4c-acbd52f027c5	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	2026-06-29 04:38:06.953
c43ddf0c-d95e-4c7b-b698-c113e463925d	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	2026-07-24 11:34:06.459
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth."User" (id, email, password, name, role, "createdAt", "updatedAt", "shopId", avatar, birthday, gender, "phoneNumber", status) FROM stdin;
f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	$2b$10$lw5m3alK.skZTn4vn5c.VO0cAKgq.tYa3.NJvW7aimXAepGx64pCa	cuong	BUYER	2026-06-30 11:09:45.447	2026-06-30 11:09:45.447	\N	\N	\N	\N	\N	ACTIVE
f9e9a433-f8eb-4d3c-9b13-278358c4592c	cskh_1@gmail.com	$2b$10$1x8EIGZFmznKGU4msuDPD.28KZFo4oDeL4GFDu2fLBkx5Jx2hiMdC	Nhân viên cskh Cường	PLATFORM_SUPPORT	2026-07-22 08:40:17.997	2026-07-22 08:40:17.997	\N	\N	\N	\N	\N	ACTIVE
3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	$2b$10$tWELMmxvyzvYYvd5dFJs2ulO2VdrxIVzSMdkZyUwmdhDaJ58v.70C	n*****h	BUYER	2026-06-29 04:38:06.911	2026-06-29 04:38:06.911	\N	\N	\N	\N	\N	ACTIVE
fe5b7a8f-5682-4fe2-be60-bebb017030e6	buyer.t0@zeromall.com	$2b$10$tWELMmxvyzvYYvd5dFJs2ulO2VdrxIVzSMdkZyUwmdhDaJ58v.70C	t*****0	BUYER	2026-06-29 04:38:06.913	2026-06-29 04:38:06.913	\N	\N	\N	\N	\N	ACTIVE
56616593-2515-4adb-a449-6f65e963c0ea	buyer.ma@zeromall.com	$2b$10$tWELMmxvyzvYYvd5dFJs2ulO2VdrxIVzSMdkZyUwmdhDaJ58v.70C	m*****a	BUYER	2026-06-29 04:38:06.915	2026-06-29 04:38:06.915	\N	\N	\N	\N	\N	ACTIVE
admin-uuid-1111-2222-333333333333	admin@zeromall.com	$2b$10$j4c0HJNVZcYp2WIvAmXh/uoBT5nCVfmSMU3lK.h2PnNQYL2ECapJu	Admin ZeroMall	ADMIN	2026-06-29 05:16:38.741	2026-06-29 05:16:38.741	\N	\N	\N	\N	\N	ACTIVE
5c64ac2d-0123-43c0-86bf-b9495528c27d	seller1@zeromall.com	$2b$10$tWELMmxvyzvYYvd5dFJs2ulO2VdrxIVzSMdkZyUwmdhDaJ58v.70C	Chủ Shop Thời Trang	SHOP_OWNER	2026-06-29 04:38:06.891	2026-06-29 05:17:03.096	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	\N	\N	\N	\N	ACTIVE
e62d94af-244c-4d16-9e79-cb23e99f59c1	seller2@zeromall.com	$2b$10$tWELMmxvyzvYYvd5dFJs2ulO2VdrxIVzSMdkZyUwmdhDaJ58v.70C	Chủ Shop Đồ Gia Dụng	SHOP_OWNER	2026-06-29 04:38:06.904	2026-06-29 05:17:05.192	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	\N	\N	\N	\N	ACTIVE
\.


--
-- Data for Name: Voucher; Type: TABLE DATA; Schema: discount; Owner: postgres
--

COPY discount."Voucher" (id, "shopId", name, code, type, value, "minSpend", "maxDiscount", "usageLimit", "usedCount", "startDate", "endDate", "createdAt", "updatedAt", "targetUserId") FROM stdin;
710b22fd-4d36-419c-a770-95a03ed5664f	4dff03a8-0e89-4b08-a254-c3bef5c53a78	shop	SHOP	percentage	10	100000	5000	100	0	2026-06-20 04:02:00	2026-06-27 04:02:00	2026-06-20 04:02:56.809	2026-06-20 04:02:56.809	\N
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: order; Owner: postgres
--

COPY "order"."Order" (id, "buyerId", "buyerEmail", "buyerName", "buyerPhone", "shippingAddress", "totalAmount", "shippingFee", "paymentMethod", status, "createdAt", "updatedAt", "ghnDistrictId", "ghnOrderCode", "ghnWardCode", "refundDescription", "refundEmail", "refundReason", "refundProofImages", "shopDiscountAmount", "platformDiscountAmount", "shopVoucherCode", "platformVoucherCode", "appliedVoucherIds", "commissionRate") FROM stdin;
260620102938	e9cd2310-7eb9-4ce5-ba8e-7e9e1f815d2d	hhshh@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	457700	37700	zeropay	PROCESSING	2026-06-20 12:03:02.146	2026-06-20 12:03:02.197	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
260629591100	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	Quang Hiệp	(+84) 964 579 875	Đường không tên, Phú Lâm, An Giang, Phú Lâm, Phú Tân, An Giang	450000	30000	cod	PROCESSING	2026-06-29 05:59:11.677	2026-06-29 05:59:11.743	1756	\N	510505	\N	\N	\N	\N	0	0	\N	\N	\N	5
260629600135	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	487700	37700	cod	PROCESSING	2026-06-29 06:00:13.561	2026-06-29 06:00:13.586	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
260630113938	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	487700	37700	cod	PROCESSING	2026-06-30 11:39:38.796	2026-06-30 11:39:38.846	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
260717060031	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	4700	2700	cod	PROCESSING	2026-07-17 06:00:31.751	2026-07-17 06:00:31.806	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
260629060925	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	617700	37700	sepay	CANCELLED	2026-06-29 06:09:25.89	2026-07-19 01:39:46.144	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
260629061107	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	487700	37700	sepay	CANCELLED	2026-06-29 06:11:07.962	2026-07-19 01:39:46.147	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
260717053934	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	487700	37700	sepay	CANCELLED	2026-07-17 05:39:34.039	2026-07-19 01:39:46.148	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
260717055639	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	39700	37700	sepay	CANCELLED	2026-07-17 05:56:39.131	2026-07-19 01:39:46.149	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
260717055720	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	4700	2700	sepay	CANCELLED	2026-07-17 05:57:20.525	2026-07-19 01:39:46.15	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
260719011826	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	4700	2700	sepay	REFUNDED	2026-07-19 01:18:26.99	2026-07-24 06:00:19.339	\N	GHN-MOCK-1784425771427	\N		vqc141@gmail.com	[Đã nhận hàng nhưng hàng có vấn đề (bể vỡ, sai mẫu, hàng lỗi, khác mô tả...) - Miễn ship hoàn về] Lý do: Gửi sai hàng / khác phân loại đã đặt	\N	0	0	\N	\N	\N	5
260717060418	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	4700	2700	sepay	COMPLETED	2026-07-17 06:04:18.517	2026-07-24 06:00:34.787	\N	GHN-VN-492465584	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
260717060402	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	4700	2700	cod	COMPLETED	2026-07-17 06:04:02.428	2026-07-24 11:26:47.827	\N	GHN-VN-564473242	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
260717060050	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	4700	2700	sepay	COMPLETED	2026-07-17 06:00:50.241	2026-07-24 11:04:04.023	\N	GHN-VN-188272803	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: order; Owner: postgres
--

COPY "order"."OrderItem" (id, "orderId", "productId", "shopId", name, image, variant, price, quantity) FROM stdin;
bcbfe8e9-9cc6-44a0-b9f1-2261d50f120d	260620102938	49c24149-2be0-47ef-bceb-ab0b51a352b0	0a2c2409-6fcc-4582-9b98-e622e37c6774	Kệ Đồ Nhà Bếp Thông Minh Sơn Tĩnh Điện 3 Tầng	https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=400&q=80	\N	420000	1
47a779dd-4e92-42c4-905b-dc65acc81c4a	260629591100	7eca41aa-9dff-4051-b617-16cd233a66e8	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	Kệ Đồ Nhà Bếp Thông Minh Sơn Tĩnh Điện 3 Tầng	https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=400&q=80	\N	420000	1
84f5c99f-ad44-44de-8863-bd79b6c1f18b	260629600135	50809270-b63e-43ff-93b7-913411c073f8	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Giày Sneaker Nam Nữ Thể Thao Da Mềm Cao Cấp	https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80	\N	450000	1
f5928d98-330f-4659-b93f-8cb619465b9a	260630113938	50809270-b63e-43ff-93b7-913411c073f8	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Giày Sneaker Nam Nữ Thể Thao Da Mềm Cao Cấp	https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80	\N	450000	1
6f41ca03-5ab4-4ac3-8d25-7cea063f1e2f	260717060031	130c82e3-a2ef-437e-8e77-a6da1ab4af5b	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	cuong	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	\N	2000	1
56295947-0cb3-428f-9c86-e36c115048fe	260717060050	bea80f9c-aab7-4885-90b2-3f962816edda	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	cuong	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	\N	2000	1
aefa9c3c-85fe-452b-83a4-22008f162694	260717060402	bea80f9c-aab7-4885-90b2-3f962816edda	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	cuong	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	\N	2000	1
4215a68f-745b-4005-8354-5b5af6a12383	260717060418	c01b68c8-330f-484a-b73d-1d65b194f189	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	cuong	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	\N	2000	1
a55f67f1-4b0d-4f90-ad2a-ca247951703a	260629060925	07dd1cf8-a26e-49a2-a7d0-95abe3ec8388	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	Bộ Bát Đĩa Sứ Tráng Men Xanh Cổ Điển Sang Trọng	https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&q=80	\N	580000	1
b87067d1-b943-459e-ad46-93a0f020a336	260629061107	50809270-b63e-43ff-93b7-913411c073f8	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Giày Sneaker Nam Nữ Thể Thao Da Mềm Cao Cấp	https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80	\N	450000	1
11c5283b-a539-494d-af73-547ee59dc989	260717053934	50809270-b63e-43ff-93b7-913411c073f8	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Giày Sneaker Nam Nữ Thể Thao Da Mềm Cao Cấp	https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80	\N	450000	1
0550bc78-682a-4b10-b4df-b91a1113a0e7	260717055639	130c82e3-a2ef-437e-8e77-a6da1ab4af5b	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	cuong	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	\N	2000	1
a0ff89e6-6baf-45c5-b31b-ffd3774557ff	260717055720	130c82e3-a2ef-437e-8e77-a6da1ab4af5b	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	cuong	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	\N	2000	1
a169476e-5eef-4dea-a34e-450a53a397a4	260719011826	bea80f9c-aab7-4885-90b2-3f962816edda	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	cuong	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	\N	2000	1
\.


--
-- Data for Name: EscrowTransaction; Type: TABLE DATA; Schema: payment; Owner: postgres
--

COPY payment."EscrowTransaction" (id, "orderId", "shopId", amount, "commissionRate", status, "releaseAt", "createdAt", "updatedAt") FROM stdin;
e80aff1b-1191-4dc5-9978-606cdaa35eb0	260717060418	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	2000	5	RELEASED	2026-07-24 06:01:34.827	2026-07-24 06:00:34.831	2026-07-24 06:01:36.142
4c3ad2da-b6c7-4bb3-b6bd-5b4d2e44822a	260717060402	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	2000	5	RELEASED	2026-07-24 11:27:47.832	2026-07-24 11:26:47.835	2026-07-24 11:27:52.166
9bdc2d44-2685-42c6-a313-d131d01c7b7e	260717060050	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	2000	5	RELEASED	2026-07-24 11:56:44.069	2026-07-24 11:55:44.071	2026-07-24 11:56:54.97
\.


--
-- Data for Name: SystemConfig; Type: TABLE DATA; Schema: payment; Owner: postgres
--

COPY payment."SystemConfig" (key, value) FROM stdin;
commission_rate	10
\.


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: payment; Owner: postgres
--

COPY payment."Transaction" (id, "orderId", "buyerId", amount, "paymentMethod", status, "providerTxId", "createdAt", "updatedAt") FROM stdin;
f1387749-7585-4543-a937-6c166c607454	260620102938	e9cd2310-7eb9-4ce5-ba8e-7e9e1f815d2d	457700	zeropay	SUCCESS	ZPAY-98a08b43-88f1-4916-9023-5fb57d387c2a	2026-06-20 12:03:02.168	2026-06-20 12:03:02.175
a49d75ab-6cf6-4797-b87d-c725b7ac9413	260629591100	3150f691-6e58-47c7-ad4c-acbd52f027c5	450000	cod	PENDING	\N	2026-06-29 05:59:11.715	2026-06-29 05:59:11.715
aad71175-6efd-462f-8831-5c72b4387c55	260629600135	3150f691-6e58-47c7-ad4c-acbd52f027c5	487700	cod	PENDING	\N	2026-06-29 06:00:13.579	2026-06-29 06:00:13.579
1770ec9f-56eb-462d-a1c4-2c27bb281c82	260630113938	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	487700	cod	PENDING	\N	2026-06-30 11:39:38.822	2026-06-30 11:39:38.822
b5696d5d-1aad-40f8-b16d-0ec541f1da47	260717060031	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	4700	cod	PENDING	\N	2026-07-17 06:00:31.768	2026-07-17 06:00:31.768
d4a2460a-b53a-4314-97c8-906b4221631a	260717060050	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	4700	sepay	SUCCESS	FT26198287617050	2026-07-17 06:00:50.259	2026-07-17 06:03:33.539
fa2a4e10-a555-44e5-adf5-71ba216bc661	260717060402	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	4700	cod	PENDING	\N	2026-07-17 06:04:02.439	2026-07-17 06:04:02.439
fe8ea942-9632-4b30-9cbe-898ade8c4e41	260717060418	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	4700	sepay	SUCCESS	FT26198408262469	2026-07-17 06:04:18.532	2026-07-17 06:04:36.528
f43c35fd-9052-460d-a5e5-00bc3c20eca6	260629060925	3150f691-6e58-47c7-ad4c-acbd52f027c5	617700	sepay	PENDING	\N	2026-06-29 06:09:25.94	2026-06-29 06:09:25.94
e2773bf6-c6c1-4e59-b334-9d57866826b0	260629061107	3150f691-6e58-47c7-ad4c-acbd52f027c5	487700	sepay	PENDING	\N	2026-06-29 06:11:07.996	2026-06-29 06:11:07.996
19cab6d1-21b6-4389-aa45-0f2d56130848	260717053934	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	487700	sepay	PENDING	\N	2026-07-17 05:39:34.062	2026-07-17 05:39:34.062
b88572a1-65ac-400d-a217-aec2556c7ac1	260717055639	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	39700	sepay	PENDING	\N	2026-07-17 05:56:39.15	2026-07-17 05:56:39.15
e8a551c0-a8b6-4738-a886-6fa428d03eb6	260717055720	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	4700	sepay	PENDING	\N	2026-07-17 05:57:20.541	2026-07-17 05:57:20.541
37b890d4-0f49-4576-ad99-f8be7b43136e	260719011826	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	4700	sepay	SUCCESS	FT26201775501660	2026-07-19 01:18:27.018	2026-07-19 01:18:46.301
\.


--
-- Data for Name: Wallet; Type: TABLE DATA; Schema: payment; Owner: postgres
--

COPY payment."Wallet" (id, "buyerId", balance, "createdAt", "updatedAt", "onHoldBalance") FROM stdin;
c9c18360-3bb6-4f1a-90d7-be5eab2500e3	guest-buyer-id	5000000	2026-06-20 12:02:52.655	2026-06-20 12:02:52.655	0
32b85b1a-bcc5-46a6-9c78-3fcfc60de3e7	e9cd2310-7eb9-4ce5-ba8e-7e9e1f815d2d	4542300	2026-06-20 12:02:52.653	2026-06-20 12:03:02.174	0
37aa0cd4-289f-4a5e-97e9-0297a8a9fed9	0843610c-e845-437b-a239-fd17acd55ad5	5000000	2026-06-29 04:10:53.128	2026-06-29 04:10:53.128	0
6033f671-76c8-46e4-8ba1-91792deb1b31	5c64ac2d-0123-43c0-86bf-b9495528c27d	5000000	2026-06-29 05:19:38.376	2026-06-29 05:19:38.376	0
2e6f2599-2ced-453d-855d-545a70c613c9	3150f691-6e58-47c7-ad4c-acbd52f027c5	5000000	2026-06-29 05:58:25.113	2026-06-29 05:58:25.113	0
bf52b83a-1ad7-417b-b68d-9a48da080744	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	5316700	2026-06-30 11:09:54.308	2026-07-24 06:00:19.363	0
c119dbea-af00-41a1-a483-cb5c97d91e90	PLATFORM	300	2026-07-24 06:01:36.15	2026-07-24 11:56:54.977	0
1ec2e675-1528-48bb-a4f1-33096c3ba62b	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	5003700	2026-07-19 02:44:45.73	2026-07-25 02:22:51.328	0
\.


--
-- Data for Name: WalletTransaction; Type: TABLE DATA; Schema: payment; Owner: postgres
--

COPY payment."WalletTransaction" (id, "walletId", amount, type, description, status, "createdAt") FROM stdin;
84705788-ef4b-4722-91a8-0b98b31678a3	bf52b83a-1ad7-417b-b68d-9a48da080744	50000	DEPOSIT	Nạp tiền tự động qua QR Ngân hàng (Ref: SIMULATE-ZMW-1784265853169)	SUCCESS	2026-07-17 05:24:13.22
472c6e01-b767-4a14-b449-646ae73ea56b	bf52b83a-1ad7-417b-b68d-9a48da080744	50000	DEPOSIT	Nạp tiền tự động qua QR Ngân hàng (Ref: SIMULATE-ZMW-1784265853935)	SUCCESS	2026-07-17 05:24:13.942
0279ae81-b92a-4d0d-a621-7d3080d435f2	bf52b83a-1ad7-417b-b68d-9a48da080744	50000	DEPOSIT	Nạp tiền tự động qua QR Ngân hàng (Ref: SIMULATE-ZMW-1784265854490)	SUCCESS	2026-07-17 05:24:14.501
53ee4b9e-a2e6-4767-8996-6db9ae8ce1f0	bf52b83a-1ad7-417b-b68d-9a48da080744	100000	DEPOSIT	Nạp tiền tự động qua QR Ngân hàng (Ref: SIMULATE-ZMW-1784265867990)	SUCCESS	2026-07-17 05:24:28.005
c4fbb26c-22e3-488d-bc67-1049acd46795	bf52b83a-1ad7-417b-b68d-9a48da080744	50000	DEPOSIT	Nạp tiền tự động qua QR Ngân hàng (Ref: SIMULATE-ZMW-1784266181924)	SUCCESS	2026-07-17 05:29:41.946
7bcdc194-2127-481f-a4a2-18a7ec09b11b	bf52b83a-1ad7-417b-b68d-9a48da080744	2000	DEPOSIT	Đang chờ chuyển khoản QR (Memo: ZMWALLETF1BA7A53)	PENDING	2026-07-17 05:43:01.212
c0721200-3620-494b-a3e6-72b4cde03884	bf52b83a-1ad7-417b-b68d-9a48da080744	2000	DEPOSIT	Đang chờ chuyển khoản QR (Memo: ZMWALLETF1BA7A53)	PENDING	2026-07-17 05:43:52.678
21e38e55-7535-4fc2-a242-92f180204f9d	bf52b83a-1ad7-417b-b68d-9a48da080744	3000	DEPOSIT	Đang chờ chuyển khoản QR (Memo: ZMWALLETF1BA7A53)	PENDING	2026-07-17 05:44:14.081
4c87fe94-a07a-4b76-bb8e-cab9575bbe5e	bf52b83a-1ad7-417b-b68d-9a48da080744	10000	DEPOSIT	Nạp tiền thành công qua QR (Ref: TEST-001)	SUCCESS	2026-07-17 05:45:42.428
e8992db1-6a2e-4e15-85a1-d6fe8d177e8f	bf52b83a-1ad7-417b-b68d-9a48da080744	2000	DEPOSIT	Nạp tiền thành công qua QR (Ref: FT26201383469357)	SUCCESS	2026-07-19 01:20:15.257
8a7587ad-0cfa-4b08-97bc-a56dcc641960	bf52b83a-1ad7-417b-b68d-9a48da080744	2000	DEPOSIT	Nạp tiền thành công qua QR (Ref: FT26205448792087)	SUCCESS	2026-07-24 03:02:25.81
339a1c6b-a68f-4f0f-82f5-b15fcd095b99	bf52b83a-1ad7-417b-b68d-9a48da080744	2000	WITHDRAW	Rút tiền về tài khoản ngân hàng MBBank (0964579675) - Mã yêu cầu: 37431e3f-4680-401e-bf4f-66132b3ddc49	SUCCESS	2026-07-24 04:22:45.32
dc34a0e4-0575-4cb4-879b-36bbeeb40760	bf52b83a-1ad7-417b-b68d-9a48da080744	2000	DEPOSIT	Đang chờ chuyển khoản QR (Memo: ZMWALLETF1BA7A53)	PENDING	2026-07-24 04:46:02.175
2aa5473b-7b18-48b3-8f58-7aad7d579090	bf52b83a-1ad7-417b-b68d-9a48da080744	4700	REFUND	Hoàn tiền trả hàng cho đơn hàng #260719011826	SUCCESS	2026-07-24 06:00:19.368
0d690faf-5693-4206-b433-ed67d36d9cdc	1ec2e675-1528-48bb-a4f1-33096c3ba62b	1900	REVENUE	Giải ngân doanh thu đơn hàng #260717060418 (sau chiết khấu 5%)	SUCCESS	2026-07-24 06:01:36.147
35759e2c-b8b7-4c3e-adce-557fe197c1da	c119dbea-af00-41a1-a483-cb5c97d91e90	100	COMMISSION	Chiết khấu sàn 5% đơn hàng #260717060418 từ Shop 6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	SUCCESS	2026-07-24 06:01:36.153
d7cfbc5d-3377-4a25-9f52-d51720adb5b7	1ec2e675-1528-48bb-a4f1-33096c3ba62b	1900	REVENUE	Giải ngân doanh thu đơn hàng #260717060050 (sau chiết khấu 5%)	SUCCESS	2026-07-24 11:56:54.976
4b2352cc-8646-4a80-84d0-ccafcf8a264c	1ec2e675-1528-48bb-a4f1-33096c3ba62b	1900	REVENUE	Giải ngân doanh thu đơn hàng #260717060402 (sau chiết khấu 5%)	SUCCESS	2026-07-24 11:27:52.174
28e89b24-b13b-441c-832b-1f4340e56d16	c119dbea-af00-41a1-a483-cb5c97d91e90	100	COMMISSION	Chiết khấu sàn 5% đơn hàng #260717060050 từ Shop 6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	SUCCESS	2026-07-24 11:56:54.978
1fcc4ba1-c01a-4d93-b501-5fa0aed3b18a	c119dbea-af00-41a1-a483-cb5c97d91e90	100	COMMISSION	Chiết khấu sàn 5% đơn hàng #260717060402 từ Shop 6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	SUCCESS	2026-07-24 11:27:52.179
03d0ed69-2618-470b-9f4f-a7a8133a3a9e	1ec2e675-1528-48bb-a4f1-33096c3ba62b	2000	WITHDRAW	Rút tiền về tài khoản ngân hàng MBBank (MB) (0964579675) - Mã yêu cầu: 51ff79b8-b051-4d4a-864d-7ac114680ee4	SUCCESS	2026-07-25 02:22:51.336
\.


--
-- Data for Name: WithdrawRequest; Type: TABLE DATA; Schema: payment; Owner: postgres
--

COPY payment."WithdrawRequest" (id, "shopId", amount, "bankName", "bankAccount", "accountName", status, "createdAt", "updatedAt") FROM stdin;
37431e3f-4680-401e-bf4f-66132b3ddc49	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	2000	MBBank	0964579675	VU QUOC CUONG	APPROVED	2026-07-24 04:22:45.316	2026-07-24 04:42:40.952
51ff79b8-b051-4d4a-864d-7ac114680ee4	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	2000	MBBank (MB)	0964579675	VU QUOC CUONG	APPROVED	2026-07-25 02:22:51.334	2026-07-25 02:23:41.442
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: product; Owner: postgres
--

COPY product."Category" (id, name, slug, "createdAt") FROM stdin;
23335b85-7e31-4e49-ae21-afe12c951fe7	Mẹ & Bé	me-va-be	2026-07-22 08:16:43.362
7c06bb99-8dde-4337-96c0-273696daa3fe	Thiết Bị Điện Tử	thiet-bi-dien-tu	2026-07-22 08:16:43.362
7f0f191a-fa82-4d98-81aa-13d32c20fab8	Điện Thoại & Phụ Kiện	dien-thoai-phu-kien	2026-07-22 08:16:43.362
9cd1423d-4dee-4998-93bd-4b0c7b968928	Thời Trang Nam	thoi-trang-nam	2026-07-22 08:16:43.361
85484319-1304-4d29-86b1-2b65980c36aa	Máy Tính & Laptop	may-tinh-laptop	2026-07-23 11:25:47.066
981fb48d-5ff0-40f3-85e2-2ea6011682c2	Đồng Hồ	dong-ho	2026-07-23 11:25:47.066
8c9a628e-4d88-4361-9f9f-dfe1464895ab	Máy Ảnh	may-anh	2026-07-23 11:25:47.066
dec2bbb5-567c-4ab4-8175-0feb65e8bf77	Giày Dép Nam	giay-dep-nam	2026-07-23 11:25:47.066
4ff7e1b5-53a6-4525-ba37-8f2129453998	Gia Dụng	gia-dung	2026-07-23 11:25:47.066
ec25310a-4e87-43df-b898-4f2c16e712ca	Thể Thao	the-thao	2026-07-23 11:25:47.066
dcb70d3d-bdae-49e6-9bbe-331ab2a10f6d	Thời Trang Nữ	thoi-trang-nu	2026-07-23 11:25:47.066
70ddc8c0-1a5a-4be8-80c6-1e932449c812	Nhà Cửa	nha-cua	2026-07-23 11:25:47.066
9dd5d8c7-24e7-4e12-bc3d-3bad3b745595	Sắc Đẹp	sac-dep	2026-07-23 11:25:47.066
9fa32a2c-5c4d-47e9-82c8-53696a0545e1	Sức Khỏe	suc-khoe	2026-07-23 11:25:47.066
fdf7905e-c3bd-4fe7-b979-5f0c2acc4f8a	Phụ Kiện Nữ	phu-kien-nu	2026-07-23 11:25:47.066
c664bff4-9baa-4835-8723-dea374ff1c57	Giày Dép Nữ	giay-dep-nu	2026-07-23 11:25:47.066
825d4683-d05c-47a4-8cac-3f54890a2d75	Túi Ví Nữ	tui-vi-nu	2026-07-23 11:25:47.066
c930e93c-7d04-4f3f-9fe1-d02feffda6f1	Sách & VPP	sach-vpp	2026-07-23 11:25:47.066
\.


--
-- Data for Name: FlashSale; Type: TABLE DATA; Schema: product; Owner: postgres
--

COPY product."FlashSale" (id, "timeSlot", "productsCount", status, "createdAt") FROM stdin;
FS-001	00:00 - 09:00	12	ENDED	2026-07-23 11:37:05.572
FS-003	15:00 - 21:00	35	RUNNING	2026-07-23 11:37:05.572
FS-004	21:00 - 24:00	18	UPCOMING	2026-07-23 11:37:05.572
FS-002	09:00 - 15:00	24	RUNNING	2026-07-23 11:37:05.572
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: product; Owner: postgres
--

COPY product."Product" (id, "shopId", name, image, category, brand, description, price, stock, sales, status, sku, "variationsText", "hasVariations", "variationGroups", "variationRows", weight, length, width, height, condition, "isPreOrder", "preOrderDays", "createdAt", "updatedAt", images, video, "originalPrice", "isViolated", "reportsCount", "violationReason", "categoryId") FROM stdin;
aac07fcf-9b55-4ce6-9b2f-2e3d34275e4f	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Áo Khoác Bomber Unisex Cực Ngầu Nỉ Ngoại Dày Dặn	https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80	Thời Trang Nam	No Brand	Áo khoác bomber phong cách đường phố năng động, chất liệu nỉ ngoại cao cấp dày dặn ấm áp, thích hợp đi chơi hay đi học.	250000	100	0	active	BMB-BLK-01	\N	f	[]	[]	500	\N	\N	\N	new	f	7	2026-06-29 04:38:06.922	2026-06-29 04:38:06.922	\N	\N	350000	f	0	\N	9cd1423d-4dee-4998-93bd-4b0c7b968928
bcba9294-1540-4629-a1f4-21ea531b21d8	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Váy Tay Bồng Dáng Xòe Công Chúa Cực Xinh	https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80	Thời Trang Nữ	No Brand	Váy xòe phong cách tiểu thư cổ điển điệu đà, tay bồng thanh lịch, chất vải voan hàn cao cấp mềm mại hai lớp cực chuẩn phom dáng.	320000	45	0	active	DRS-PNK-02	\N	f	[]	[]	300	\N	\N	\N	new	f	7	2026-06-29 04:38:06.925	2026-06-29 04:38:06.925	\N	\N	450000	f	0	\N	dcb70d3d-bdae-49e6-9bbe-331ab2a10f6d
c01b68c8-330f-484a-b73d-1d65b194f189	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	cuong	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	Phụ Kiện Nữ	2	2	2000	2	1	active			f	[{"name":"Màu sắc","options":[]}]	[]	2	2	2	2	new	f	7	2026-07-17 05:56:07.87	2026-07-17 05:56:07.87	["https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg"]		20000	f	0	\N	fdf7905e-c3bd-4fe7-b979-5f0c2acc4f8a
7d707a15-9b2d-413f-9064-21e60c61ec61	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Balo Thời Trang Học Sinh Sinh Viên Chống Nước	https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80	Túi Ví Nữ	No Brand	Balo thời trang đựng vừa laptop 15.6 inch, chất vải oxford chống thấm nước tốt, nhiều ngăn tiện lợi đi học hay du lịch ngắn ngày.	199000	80	0	active	BP-GRY-05	\N	f	[]	[]	600	\N	\N	\N	new	f	7	2026-06-29 04:38:06.933	2026-06-29 04:38:06.933	\N	\N	280000	f	0	\N	825d4683-d05c-47a4-8cac-3f54890a2d75
b1fc3f48-76b8-4492-bf91-af20167e137e	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Nón Lưỡi Trai Kaki Trơn Phong Cách Hàn Quốc	https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80	Phụ Kiện Nữ	No Brand	Mũ lưỡi trai kaki basic unisex nam nữ đội đều đẹp, phom dáng cứng cáp ôm đầu thoải mái, điều chỉnh size dễ dàng.	75000	150	0	active	CAP-BLK-04	\N	f	[]	[]	100	\N	\N	\N	new	f	7	2026-06-29 04:38:06.931	2026-06-29 04:38:06.931	\N	\N	120000	f	0	\N	fdf7905e-c3bd-4fe7-b979-5f0c2acc4f8a
bea80f9c-aab7-4885-90b2-3f962816edda	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	cuong	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	Phụ Kiện Nữ	2	2	2000	2	2	active			f	[{"name":"Màu sắc","options":[]}]	[]	2	2	2	2	new	f	7	2026-07-17 05:56:09.138	2026-07-17 05:56:09.138	["https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg"]		20000	f	0	\N	fdf7905e-c3bd-4fe7-b979-5f0c2acc4f8a
7eca41aa-9dff-4051-b617-16cd233a66e8	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	Kệ Đồ Nhà Bếp Thông Minh Sơn Tĩnh Điện 3 Tầng	https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=400&q=80	Nhà Cửa	No Brand	Kệ để gia vị, lò vi sóng bằng thép carbon sơn tĩnh điện chống gỉ sét, chịu lực lên đến 50kg, giúp căn bếp luôn ngăn nắp gọn gàng.	420000	30	1	active	SHF-KIT-05	\N	f	[]	[]	3500	\N	\N	\N	new	f	7	2026-06-29 04:38:06.944	2026-06-29 04:38:06.944	\N	\N	600000	f	0	\N	70ddc8c0-1a5a-4be8-80c6-1e932449c812
502872df-544b-4d08-97f6-f5136d2f36c6	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	Bình Giữ Nhiệt Lõi Inox 316 Cao Cấp 1000ml	https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80	Nhà Cửa	Lock&Lock	Bình giữ nhiệt dung tích lớn giữ nóng/lạnh lên đến 24 giờ, chất liệu thép không gỉ 316 y tế siêu an toàn, có quai xách tiện lợi.	350000	70	0	active	THM-LOCK-04	\N	f	[]	[]	600	\N	\N	\N	new	f	7	2026-06-29 04:38:06.942	2026-06-29 04:38:06.942	\N	\N	490000	f	0	\N	70ddc8c0-1a5a-4be8-80c6-1e932449c812
07dd1cf8-a26e-49a2-a7d0-95abe3ec8388	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	Bộ Bát Đĩa Sứ Tráng Men Xanh Cổ Điển Sang Trọng	https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&q=80	Nhà Cửa	No Brand	Bộ bát đĩa sứ cao cấp gồm 12 chi tiết tráng men bóng cao cấp, phong cách Bắc Âu sang trọng, chịu nhiệt tốt dùng được trong lò vi sóng.	580000	15	0	active	CER-BLU-03	\N	f	[]	[]	4000	\N	\N	\N	new	f	7	2026-06-29 04:38:06.94	2026-07-22 08:16:43.395	\N	\N	750000	t	42	Hàng giả/nhái thương hiệu, lừa đảo	70ddc8c0-1a5a-4be8-80c6-1e932449c812
d6b333d1-acc0-4081-97b3-a2a397ffe56b	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	Nồi Chiên Không Dầu Điện Tử 6.5L Đa Năng Tiện Lợi	https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=400&q=80	Gia Dụng	Philips	Nồi chiên không dầu dung tích lớn 6.5L, điều khiển điện tử cảm ứng nhạy bén, công nghệ chiên xoáy nhiệt 360 độ hạn chế dầu mỡ bảo vệ sức khỏe.	1850000	20	0	active	AF-PLP-01	\N	f	[]	[]	5500	\N	\N	\N	new	f	7	2026-06-29 04:38:06.935	2026-06-29 04:38:06.935	\N	\N	2500000	f	0	\N	4ff7e1b5-53a6-4525-ba37-8f2129453998
ed97f21d-2134-40ca-a758-5b6fea1ce201	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	Máy Xay Sinh Tố Cầm Tay Sạc Pin Mini Không Dây	https://images.unsplash.com/photo-1578643463396-0997cb5328c1?w=400&q=80	Gia Dụng	Bear	Máy xay sinh tố đa năng sạc pin tiện lợi mang đi làm, đi du lịch. Lưỡi dao inox 304 sắc bén, chất liệu nhựa cao cấp an toàn cho bé.	290000	40	0	active	BL-BEAR-02	\N	f	[]	[]	800	\N	\N	\N	new	f	7	2026-06-29 04:38:06.937	2026-06-29 04:38:06.937	\N	\N	390000	f	0	\N	4ff7e1b5-53a6-4525-ba37-8f2129453998
50809270-b63e-43ff-93b7-913411c073f8	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Giày Sneaker Nam Nữ Thể Thao Da Mềm Cao Cấp	https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80	Giày Dép Nam	Adidas	Giày sneaker thể thao phong cách Hàn Quốc trẻ trung năng động, đế cao su chống trơn trượt êm chân, phù hợp đi học, đi làm, dạo phố.	450000	60	2	active	SNK-WHT-03	\N	f	[]	[]	700	\N	\N	\N	new	f	7	2026-06-29 04:38:06.928	2026-06-29 04:38:06.928	\N	\N	600000	f	0	\N	dec2bbb5-567c-4ab4-8175-0feb65e8bf77
130c82e3-a2ef-437e-8e77-a6da1ab4af5b	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	cuong	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	Phụ Kiện Nữ	2	2	2000	2	1	active			f	[{"name":"Màu sắc","options":[]}]	[]	2	2	2	2	new	f	7	2026-07-17 05:56:09.202	2026-07-22 08:16:43.395	["https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg"]		20000	t	15	Mặt hàng chưa kiểm định y tế	fdf7905e-c3bd-4fe7-b979-5f0c2acc4f8a
\.


--
-- Data for Name: ProductLike; Type: TABLE DATA; Schema: product; Owner: postgres
--

COPY product."ProductLike" (id, "productId", "userId", "createdAt") FROM stdin;
47943044-e025-487e-93ac-6910c4c649d1	7eca41aa-9dff-4051-b617-16cd233a66e8	3150f691-6e58-47c7-ad4c-acbd52f027c5	2026-06-29 05:34:26.178
481ca697-d3e9-4190-978c-8a6b6e306b01	aac07fcf-9b55-4ce6-9b2f-2e3d34275e4f	3150f691-6e58-47c7-ad4c-acbd52f027c5	2026-06-29 04:38:06.958
f7a84923-7c9a-4e3d-9695-b6a845f0ea35	aac07fcf-9b55-4ce6-9b2f-2e3d34275e4f	fe5b7a8f-5682-4fe2-be60-bebb017030e6	2026-06-29 04:38:06.958
0207a458-258f-49b6-b56a-988091ecb8b9	bcba9294-1540-4629-a1f4-21ea531b21d8	3150f691-6e58-47c7-ad4c-acbd52f027c5	2026-06-29 04:38:06.961
578ed9af-7fc0-4863-981b-da5e5e0d7f31	bcba9294-1540-4629-a1f4-21ea531b21d8	fe5b7a8f-5682-4fe2-be60-bebb017030e6	2026-06-29 04:38:06.961
f1b4290b-6306-454c-a201-70e10b924b27	50809270-b63e-43ff-93b7-913411c073f8	3150f691-6e58-47c7-ad4c-acbd52f027c5	2026-06-29 04:38:06.963
238903f1-e3c4-45de-95f2-1f27302a0da2	50809270-b63e-43ff-93b7-913411c073f8	fe5b7a8f-5682-4fe2-be60-bebb017030e6	2026-06-29 04:38:06.963
243dcb10-78ed-4380-9283-5b2fc71e2769	b1fc3f48-76b8-4492-bf91-af20167e137e	3150f691-6e58-47c7-ad4c-acbd52f027c5	2026-06-29 04:38:06.965
8cdaf7f3-bad1-495e-b305-e4c862d75ef8	b1fc3f48-76b8-4492-bf91-af20167e137e	fe5b7a8f-5682-4fe2-be60-bebb017030e6	2026-06-29 04:38:06.965
15b823db-54be-4dec-8ae2-3e41133401f3	7d707a15-9b2d-413f-9064-21e60c61ec61	3150f691-6e58-47c7-ad4c-acbd52f027c5	2026-06-29 04:38:06.967
418fbedd-b284-4de5-a034-ab4f0ff37d55	7d707a15-9b2d-413f-9064-21e60c61ec61	fe5b7a8f-5682-4fe2-be60-bebb017030e6	2026-06-29 04:38:06.967
6eca050e-b0c0-414d-836e-01730814a30a	d6b333d1-acc0-4081-97b3-a2a397ffe56b	3150f691-6e58-47c7-ad4c-acbd52f027c5	2026-06-29 04:38:06.968
c1554641-cf45-4c3f-a457-d71c55765cda	d6b333d1-acc0-4081-97b3-a2a397ffe56b	fe5b7a8f-5682-4fe2-be60-bebb017030e6	2026-06-29 04:38:06.968
34f09705-eafa-489b-a0bd-0440a621d69d	ed97f21d-2134-40ca-a758-5b6fea1ce201	3150f691-6e58-47c7-ad4c-acbd52f027c5	2026-06-29 04:38:06.971
09064bb3-c654-437c-8039-9380fe83bae4	ed97f21d-2134-40ca-a758-5b6fea1ce201	fe5b7a8f-5682-4fe2-be60-bebb017030e6	2026-06-29 04:38:06.971
2e0f6c05-516c-4857-818e-6d3c82bd6e62	07dd1cf8-a26e-49a2-a7d0-95abe3ec8388	3150f691-6e58-47c7-ad4c-acbd52f027c5	2026-06-29 04:38:06.978
439da30a-ba10-4739-9115-7b9ea57abeee	07dd1cf8-a26e-49a2-a7d0-95abe3ec8388	fe5b7a8f-5682-4fe2-be60-bebb017030e6	2026-06-29 04:38:06.978
037de9c7-5023-41cc-981d-b3086515464c	502872df-544b-4d08-97f6-f5136d2f36c6	3150f691-6e58-47c7-ad4c-acbd52f027c5	2026-06-29 04:38:06.98
1fc9fe95-ed1b-4bc9-b53c-e380d8cf1bf9	502872df-544b-4d08-97f6-f5136d2f36c6	fe5b7a8f-5682-4fe2-be60-bebb017030e6	2026-06-29 04:38:06.98
fdfdfc61-02b6-4733-b47b-4f1caa648b03	7eca41aa-9dff-4051-b617-16cd233a66e8	fe5b7a8f-5682-4fe2-be60-bebb017030e6	2026-06-29 04:38:06.983
\.


--
-- Data for Name: Review; Type: TABLE DATA; Schema: product; Owner: postgres
--

COPY product."Review" (id, "productId", username, rating, comment, variant, reply, "createdAt", "orderId", images) FROM stdin;
83a8f779-2511-4d97-b5a1-c716f4d86983	7eca41aa-9dff-4051-b617-16cd233a66e8	n*****h	5	ngon luôn	Tiêu chuẩn	\N	2026-06-29 05:10:52	\N	\N
fa26ba3e-3a2d-44f2-a8dc-31baafc61bcc	c01b68c8-330f-484a-b73d-1d65b194f189	cuong	5	ok	Tiêu chuẩn	\N	2026-07-24 06:28:26.016	\N	\N
5120420e-46a1-4227-a796-934d6cc4ee93	bea80f9c-aab7-4885-90b2-3f962816edda	cuong	5	ok nha ae	Tiêu chuẩn	\N	2026-07-24 11:26:47.77	260717060402	["https://res.cloudinary.com/dxkfusgxs/image/upload/v1784892404/pnfbseo413jvcflp78f5.png"]
\.


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: ShopFollow ShopFollow_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth."ShopFollow"
    ADD CONSTRAINT "ShopFollow_pkey" PRIMARY KEY (id);


--
-- Name: Shop Shop_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth."Shop"
    ADD CONSTRAINT "Shop_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Voucher Voucher_pkey; Type: CONSTRAINT; Schema: discount; Owner: postgres
--

ALTER TABLE ONLY discount."Voucher"
    ADD CONSTRAINT "Voucher_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: order; Owner: postgres
--

ALTER TABLE ONLY "order"."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: order; Owner: postgres
--

ALTER TABLE ONLY "order"."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: EscrowTransaction EscrowTransaction_pkey; Type: CONSTRAINT; Schema: payment; Owner: postgres
--

ALTER TABLE ONLY payment."EscrowTransaction"
    ADD CONSTRAINT "EscrowTransaction_pkey" PRIMARY KEY (id);


--
-- Name: SystemConfig SystemConfig_pkey; Type: CONSTRAINT; Schema: payment; Owner: postgres
--

ALTER TABLE ONLY payment."SystemConfig"
    ADD CONSTRAINT "SystemConfig_pkey" PRIMARY KEY (key);


--
-- Name: Transaction Transaction_pkey; Type: CONSTRAINT; Schema: payment; Owner: postgres
--

ALTER TABLE ONLY payment."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY (id);


--
-- Name: WalletTransaction WalletTransaction_pkey; Type: CONSTRAINT; Schema: payment; Owner: postgres
--

ALTER TABLE ONLY payment."WalletTransaction"
    ADD CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY (id);


--
-- Name: Wallet Wallet_pkey; Type: CONSTRAINT; Schema: payment; Owner: postgres
--

ALTER TABLE ONLY payment."Wallet"
    ADD CONSTRAINT "Wallet_pkey" PRIMARY KEY (id);


--
-- Name: WithdrawRequest WithdrawRequest_pkey; Type: CONSTRAINT; Schema: payment; Owner: postgres
--

ALTER TABLE ONLY payment."WithdrawRequest"
    ADD CONSTRAINT "WithdrawRequest_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: product; Owner: postgres
--

ALTER TABLE ONLY product."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: FlashSale FlashSale_pkey; Type: CONSTRAINT; Schema: product; Owner: postgres
--

ALTER TABLE ONLY product."FlashSale"
    ADD CONSTRAINT "FlashSale_pkey" PRIMARY KEY (id);


--
-- Name: ProductLike ProductLike_pkey; Type: CONSTRAINT; Schema: product; Owner: postgres
--

ALTER TABLE ONLY product."ProductLike"
    ADD CONSTRAINT "ProductLike_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: product; Owner: postgres
--

ALTER TABLE ONLY product."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: Review Review_pkey; Type: CONSTRAINT; Schema: product; Owner: postgres
--

ALTER TABLE ONLY product."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY (id);


--
-- Name: ShopFollow_userId_shopId_key; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "ShopFollow_userId_shopId_key" ON auth."ShopFollow" USING btree ("userId", "shopId");


--
-- Name: Shop_ownerId_key; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "Shop_ownerId_key" ON auth."Shop" USING btree ("ownerId");


--
-- Name: User_email_key; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON auth."User" USING btree (email);


--
-- Name: Voucher_shopId_code_key; Type: INDEX; Schema: discount; Owner: postgres
--

CREATE UNIQUE INDEX "Voucher_shopId_code_key" ON discount."Voucher" USING btree ("shopId", code);


--
-- Name: EscrowTransaction_orderId_key; Type: INDEX; Schema: payment; Owner: postgres
--

CREATE UNIQUE INDEX "EscrowTransaction_orderId_key" ON payment."EscrowTransaction" USING btree ("orderId");


--
-- Name: Transaction_orderId_key; Type: INDEX; Schema: payment; Owner: postgres
--

CREATE UNIQUE INDEX "Transaction_orderId_key" ON payment."Transaction" USING btree ("orderId");


--
-- Name: Wallet_buyerId_key; Type: INDEX; Schema: payment; Owner: postgres
--

CREATE UNIQUE INDEX "Wallet_buyerId_key" ON payment."Wallet" USING btree ("buyerId");


--
-- Name: Category_name_key; Type: INDEX; Schema: product; Owner: postgres
--

CREATE UNIQUE INDEX "Category_name_key" ON product."Category" USING btree (name);


--
-- Name: Category_slug_key; Type: INDEX; Schema: product; Owner: postgres
--

CREATE UNIQUE INDEX "Category_slug_key" ON product."Category" USING btree (slug);


--
-- Name: FlashSale_timeSlot_key; Type: INDEX; Schema: product; Owner: postgres
--

CREATE UNIQUE INDEX "FlashSale_timeSlot_key" ON product."FlashSale" USING btree ("timeSlot");


--
-- Name: ProductLike_productId_userId_key; Type: INDEX; Schema: product; Owner: postgres
--

CREATE UNIQUE INDEX "ProductLike_productId_userId_key" ON product."ProductLike" USING btree ("productId", "userId");


--
-- Name: ShopFollow ShopFollow_shopId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth."ShopFollow"
    ADD CONSTRAINT "ShopFollow_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES auth."Shop"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ShopFollow ShopFollow_userId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth."ShopFollow"
    ADD CONSTRAINT "ShopFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Shop Shop_ownerId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth."Shop"
    ADD CONSTRAINT "Shop_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES auth."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_shopId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth."User"
    ADD CONSTRAINT "User_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES auth."Shop"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: order; Owner: postgres
--

ALTER TABLE ONLY "order"."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WalletTransaction WalletTransaction_walletId_fkey; Type: FK CONSTRAINT; Schema: payment; Owner: postgres
--

ALTER TABLE ONLY payment."WalletTransaction"
    ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES payment."Wallet"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Product Product_categoryId_fkey; Type: FK CONSTRAINT; Schema: product; Owner: postgres
--

ALTER TABLE ONLY product."Product"
    ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES product."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Product fk_product_shop; Type: FK CONSTRAINT; Schema: product; Owner: postgres
--

ALTER TABLE ONLY product."Product"
    ADD CONSTRAINT fk_product_shop FOREIGN KEY ("shopId") REFERENCES auth."Shop"(id) ON DELETE CASCADE;


--
-- Name: ProductLike fk_productlike_product; Type: FK CONSTRAINT; Schema: product; Owner: postgres
--

ALTER TABLE ONLY product."ProductLike"
    ADD CONSTRAINT fk_productlike_product FOREIGN KEY ("productId") REFERENCES product."Product"(id) ON DELETE CASCADE;


--
-- Name: ProductLike fk_productlike_user; Type: FK CONSTRAINT; Schema: product; Owner: postgres
--

ALTER TABLE ONLY product."ProductLike"
    ADD CONSTRAINT fk_productlike_user FOREIGN KEY ("userId") REFERENCES auth."User"(id) ON DELETE CASCADE;


--
-- Name: Review fk_review_product; Type: FK CONSTRAINT; Schema: product; Owner: postgres
--

ALTER TABLE ONLY product."Review"
    ADD CONSTRAINT fk_review_product FOREIGN KEY ("productId") REFERENCES product."Product"(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict qhCucdPD0WSWUxXoRfteWNQlUy6sQBYT8gKxrO8eV2sr9SUuOLoFI7T5uy6qoYl

