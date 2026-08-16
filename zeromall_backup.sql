--
-- PostgreSQL database dump
--

\restrict 3P8YhvMsxxbLFdDaMiJvI3U0M2hPIM2Px31jRay0Bjse6SvKNnrdbF736NnL462

-- Dumped from database version 15.19
-- Dumped by pg_dump version 15.19

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
-- Name: chat; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA chat;


ALTER SCHEMA chat OWNER TO postgres;

--
-- Name: discount; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA discount;


ALTER SCHEMA discount OWNER TO postgres;

--
-- Name: notification; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA notification;


ALTER SCHEMA notification OWNER TO postgres;

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

--
-- Name: MessageType; Type: TYPE; Schema: chat; Owner: postgres
--

CREATE TYPE chat."MessageType" AS ENUM (
    'TEXT',
    'IMAGE',
    'PRODUCT_CARD',
    'ORDER_CARD'
);


ALTER TYPE chat."MessageType" OWNER TO postgres;

--
-- Name: SenderType; Type: TYPE; Schema: chat; Owner: postgres
--

CREATE TYPE chat."SenderType" AS ENUM (
    'BUYER',
    'SHOP',
    'SYSTEM'
);


ALTER TYPE chat."SenderType" OWNER TO postgres;

--
-- Name: NotificationType; Type: TYPE; Schema: notification; Owner: postgres
--

CREATE TYPE notification."NotificationType" AS ENUM (
    'ORDER',
    'PROMOTION',
    'SYSTEM',
    'CHAT'
);


ALTER TYPE notification."NotificationType" OWNER TO postgres;

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
-- Name: Conversation; Type: TABLE; Schema: chat; Owner: postgres
--

CREATE TABLE chat."Conversation" (
    id text NOT NULL,
    "buyerId" text NOT NULL,
    "shopId" text NOT NULL,
    "lastMessage" text,
    "lastMessageAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    "unreadBuyerCount" integer DEFAULT 0 NOT NULL,
    "unreadShopCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE chat."Conversation" OWNER TO postgres;

--
-- Name: Message; Type: TABLE; Schema: chat; Owner: postgres
--

CREATE TABLE chat."Message" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "senderId" text NOT NULL,
    "senderType" chat."SenderType" DEFAULT 'BUYER'::chat."SenderType" NOT NULL,
    type chat."MessageType" DEFAULT 'TEXT'::chat."MessageType" NOT NULL,
    content text NOT NULL,
    metadata jsonb,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE chat."Message" OWNER TO postgres;

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
-- Name: Notification; Type: TABLE; Schema: notification; Owner: postgres
--

CREATE TABLE notification."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    type notification."NotificationType" DEFAULT 'ORDER'::notification."NotificationType" NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE notification."Notification" OWNER TO postgres;

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
a8fd309a-35c8-4b56-8e52-e31306163372	2026-08-14 15:56:53.179	admin@zeromall.com	Mở khóa cửa hàng "Shop good HLE"
\.


--
-- Data for Name: Shop; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth."Shop" (id, name, "ownerId", "createdAt", "updatedAt", "responseRate", "responseTime", email, "phoneNumber", "pickupAddress", "shippingSettings", status, logo, description) FROM stdin;
6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	ZeroMall Fashion Hub	5c64ac2d-0123-43c0-86bf-b9495528c27d	2023-06-30 04:38:06.895	2026-06-29 05:17:03.087	98	trong vài giờ	seller1@zeromall.com	12345678	{"fullName":"Chủ Shop Thời Trang","phoneNumber":"12345678","province":"Đồng Nai","district":"Biên Hòa","ward":"Tân Phong","detailAddress":"2D-6 Đường Trần Công An, Phường Tân Phong, Thành Phố Biên Hòa, Tỉnh Đồng Nai","coordinates":{"lat":10.956885873872949,"lng":106.82681802522231}}	{"express":true,"fast":true,"saver":true,"bulky":false}	APPROVED	\N	\N
f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	ZeroMall Home & Kitchen	e62d94af-244c-4d16-9e79-cb23e99f59c1	2025-12-31 04:38:06.906	2026-06-29 05:17:05.191	95	trong vài phút	seller2@zeromall.com	123123123	{"fullName":"Chủ Shop Đồ Gia Dụng","phoneNumber":"123456","province":"Hồ Chí Minh","district":"Phú Nhuận","ward":"Phường 1","detailAddress":"Quán Anh Đạt, 34 Hẻm 30 Đoàn Thị Điểm, Phường 1, Quận Phú Nhuận, Thành Phố Hồ Chí Minh","coordinates":{"lat":10.956885873872949,"lng":106.82681802522231}}	{"express":true,"fast":true,"saver":true,"bulky":false}	APPROVED	\N	\N
d9be6bae-681d-4b47-8e4f-aa95eac1ce49	Shop good HLE	880a2880-43c0-4506-b25a-86dc34299f7b	2026-08-14 15:41:52.252	2026-08-14 15:56:53.166	100	trong vài giờ	minhanh@zeromall.com	0344461922	{"fullName":"Minh Anh","phoneNumber":"0344461922","province":"Hồ Chí Minh","district":"Gò Vấp","ward":"Phường 4","detailAddress":"Nhà C, 4, Nguyễn Văn Bảo, Gò Vấp, Hồ Chí Minh","coordinates":{"lat":10.821944687846669,"lng":106.68726426981377}}	{"express":true,"fast":true,"saver":true,"bulky":false}	APPROVED	\N	\N
\.


--
-- Data for Name: ShopFollow; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth."ShopFollow" (id, "userId", "shopId", "createdAt") FROM stdin;
689249da-732f-4eef-9744-114008486db9	fe5b7a8f-5682-4fe2-be60-bebb017030e6	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	2026-06-29 04:38:06.951
353719ed-0401-40cd-9573-3867920b62ea	56616593-2515-4adb-a449-6f65e963c0ea	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	2026-06-29 04:38:06.952
25e34619-3850-4412-b724-79da1a8c28c7	3150f691-6e58-47c7-ad4c-acbd52f027c5	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	2026-06-29 04:38:06.953
c43ddf0c-d95e-4c7b-b698-c113e463925d	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	2026-07-24 11:34:06.459
25771d78-ae74-45d7-9e9f-efa30f14a007	3150f691-6e58-47c7-ad4c-acbd52f027c5	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	2026-08-14 08:33:32.009
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
880a2880-43c0-4506-b25a-86dc34299f7b	minhanh@zeromall.com	$2b$10$mxf4EkGc99fw.CDLXasW5.lM36fXrepEFGndqCNzH7d6UaeZL8JD2	Minh Anh	SHOP_OWNER	2026-08-14 15:41:52.249	2026-08-14 15:56:53.17	d9be6bae-681d-4b47-8e4f-aa95eac1ce49	\N	\N	\N	\N	ACTIVE
\.


--
-- Data for Name: Conversation; Type: TABLE DATA; Schema: chat; Owner: postgres
--

COPY chat."Conversation" (id, "buyerId", "shopId", "lastMessage", "lastMessageAt", "unreadBuyerCount", "unreadShopCount", "createdAt", "updatedAt") FROM stdin;
9e933e84-a38b-4e5a-8ced-b8dad1b89cc8	e62d94af-244c-4d16-9e79-cb23e99f59c1	zeromall-official	Cuộc trò chuyện mới được khởi tạo 👋	2026-08-12 18:47:31.754	0	0	2026-08-12 18:47:31.754	2026-08-12 18:47:31.768
4d0898ba-c81f-46d3-a9f0-65428a713ce6	3150f691-6e58-47c7-ad4c-acbd52f027c5	zeromall-official	Cuộc trò chuyện mới được khởi tạo 👋	2026-08-12 18:44:33.108	0	0	2026-08-12 18:44:33.116	2026-08-12 19:21:41.204
47286368-549f-48bf-bf57-34b362927a9e	5c64ac2d-0123-43c0-86bf-b9495528c27d	zeromall-official	Cuộc trò chuyện mới được khởi tạo 👋	2026-08-14 07:35:05.781	0	0	2026-08-14 07:35:05.783	2026-08-14 07:35:05.815
a5fdb195-5e64-4fa7-b059-f2a67b730546	3150f691-6e58-47c7-ad4c-acbd52f027c5	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	kfkremvg	2026-08-14 15:41:02.827	0	3	2026-08-12 19:06:35.006	2026-08-14 15:41:04.135
c90b9590-6053-4fcd-a0ba-d2c65f5b2281	880a2880-43c0-4506-b25a-86dc34299f7b	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	Cuộc trò chuyện mới được khởi tạo 👋	2026-08-14 15:52:01.97	0	0	2026-08-14 15:52:01.971	2026-08-14 15:52:01.986
30a0a116-9c82-43da-8102-28aafa958692	880a2880-43c0-4506-b25a-86dc34299f7b	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Cuộc trò chuyện mới được khởi tạo 👋	2026-08-14 15:43:56.303	0	0	2026-08-14 15:43:56.305	2026-08-14 15:58:55.559
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: chat; Owner: postgres
--

COPY chat."Message" (id, "conversationId", "senderId", "senderType", type, content, metadata, "isRead", "createdAt") FROM stdin;
675116f7-dd6c-4af1-a980-43c3fa67a3f5	a5fdb195-5e64-4fa7-b059-f2a67b730546	3150f691-6e58-47c7-ad4c-acbd52f027c5	BUYER	TEXT	hjvfhdnj	null	t	2026-08-14 07:34:38.254
db6636fc-619d-41df-b3a9-9abce87ddfec	a5fdb195-5e64-4fa7-b059-f2a67b730546	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	SHOP	TEXT	hello	null	t	2026-08-14 07:35:13.422
9ccef9a2-67e5-4148-8317-ca6feeaae31e	a5fdb195-5e64-4fa7-b059-f2a67b730546	3150f691-6e58-47c7-ad4c-acbd52f027c5	BUYER	TEXT	vfdnu	null	f	2026-08-14 08:30:52.472
86ef0ffd-f5c2-4b03-920d-c90a36074927	a5fdb195-5e64-4fa7-b059-f2a67b730546	3150f691-6e58-47c7-ad4c-acbd52f027c5	BUYER	TEXT	\\gfdf	null	f	2026-08-14 08:30:54.068
8b72583e-6570-4b47-be66-f01034f40002	a5fdb195-5e64-4fa7-b059-f2a67b730546	3150f691-6e58-47c7-ad4c-acbd52f027c5	BUYER	TEXT	kfkremvg	null	f	2026-08-14 15:41:02.822
\.


--
-- Data for Name: Voucher; Type: TABLE DATA; Schema: discount; Owner: postgres
--

COPY discount."Voucher" (id, "shopId", name, code, type, value, "minSpend", "maxDiscount", "usageLimit", "usedCount", "startDate", "endDate", "createdAt", "updatedAt", "targetUserId") FROM stdin;
710b22fd-4d36-419c-a770-95a03ed5664f	4dff03a8-0e89-4b08-a254-c3bef5c53a78	shop	SHOP	percentage	10	100000	5000	100	0	2026-06-20 04:02:00	2026-06-27 04:02:00	2026-06-20 04:02:56.809	2026-06-20 04:02:56.809	\N
1a6e976f-fff2-456a-83df-80831f105e9e	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	minhanh	SHOP50	fixed	20000	100000	\N	100	0	2026-08-14 08:29:00	2026-08-21 08:32:00	2026-08-14 08:33:06.078	2026-08-14 08:33:06.078	\N
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: notification; Owner: postgres
--

COPY notification."Notification" (id, "userId", title, content, type, "isRead", metadata, "createdAt", "updatedAt") FROM stdin;
c8b50fdd-d506-449e-9397-9d7613934c4c	3150f691-6e58-47c7-ad4c-acbd52f027c5	Đặt hàng thành công 🛒	Đơn hàng #26081218 trị giá 2.000đ đã được khởi tạo thành công.	ORDER	t	{"orderId": "26081218460363381"}	2026-08-12 18:46:03.812	2026-08-12 18:46:09.691
6e8d0963-3b03-4343-b91a-a0991273d43a	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Đơn hàng mới từ Khách hàng 📦	Shop có 1 đơn hàng mới #26081219 từ khách hàng minhanh. Vui lòng kiểm tra và chuẩn bị hàng.	ORDER	t	{"orderId": "26081219040078621"}	2026-08-12 19:04:00.844	2026-08-12 19:04:12.168
1e9277d3-5879-4f76-a885-397fdba0d1f8	3150f691-6e58-47c7-ad4c-acbd52f027c5	Đặt hàng thành công 🛒	Đơn hàng #26081219 trị giá 250.000đ đã được khởi tạo thành công.	ORDER	t	{"orderId": "26081219040078621"}	2026-08-12 19:04:00.829	2026-08-12 19:05:08.364
09b5f459-88e0-49a5-8bcd-54f9a5b5e5b0	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Đơn hàng mới từ Khách hàng 📦	Shop có 1 đơn hàng mới #26081219 từ khách hàng minhanh. Vui lòng kiểm tra và chuẩn bị hàng.	ORDER	t	{"orderId": "26081219054531939"}	2026-08-12 19:05:45.358	2026-08-12 19:05:54.949
f9af2795-a5ae-4dc2-b090-5e09a8cb3e70	3150f691-6e58-47c7-ad4c-acbd52f027c5	Đặt hàng thành công 🛒	Đơn hàng #26081219 trị giá 450.000đ đã được khởi tạo thành công.	ORDER	t	{"orderId": "26081219054531939"}	2026-08-12 19:05:45.344	2026-08-12 19:06:09.972
6ff30f01-bcd8-4a3d-bdb3-ee90fde0071e	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Đơn hàng mới từ Khách hàng 📦	Shop có 1 đơn hàng mới #26081219 từ khách hàng minhanh. Vui lòng kiểm tra và chuẩn bị hàng.	ORDER	t	{"action": "VIEW_ORDER", "orderId": "26081219201633973"}	2026-08-12 19:20:16.42	2026-08-12 19:20:33.393
7a239cf5-c628-42df-b28b-02ae6eb420e7	3150f691-6e58-47c7-ad4c-acbd52f027c5	Đặt hàng thành công 🛒	Đơn hàng #26081219 trị giá 18.500đ đã được khởi tạo thành công.	ORDER	t	{"action": "VIEW_ORDER", "orderId": "26081219201633973"}	2026-08-12 19:20:16.402	2026-08-12 19:20:44.397
a5c2eb1f-44f6-4e76-af4f-d4f67f234354	3150f691-6e58-47c7-ad4c-acbd52f027c5	📦 Đơn hàng được cập nhật	Đơn hàng #26062960 của bạn đã chuyển sang trạng thái: COMPLETED.	ORDER	t	{"action": "VIEW_ORDER", "status": "COMPLETED", "orderId": "260629600135"}	2026-08-14 07:33:43.75	2026-08-14 07:34:26.315
bf767882-51fb-47fa-8f86-532553e897c2	3150f691-6e58-47c7-ad4c-acbd52f027c5	⚙️ Đơn hàng được cập nhật	Đơn hàng #26081407 của bạn đã chuyển sang trạng thái: Đang xử lý.	ORDER	t	{"action": "VIEW_ORDER", "status": "PROCESSING", "orderId": "26081407384657547"}	2026-08-14 07:38:50.796	2026-08-14 07:39:06.354
1280ba86-b21e-4939-b542-d0ff6ae46c11	3150f691-6e58-47c7-ad4c-acbd52f027c5	Đặt hàng thành công 🛒	Đơn hàng #26081407 trị giá 216.500đ đã được khởi tạo thành công.	ORDER	t	{"action": "VIEW_ORDER", "orderId": "26081407384657547"}	2026-08-14 07:38:46.715	2026-08-14 07:39:55.861
6691c2ce-5026-4eb5-8a1f-3a2973b99a79	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Đơn hàng mới từ Khách hàng 📦	Shop có 1 đơn hàng mới #26081407 từ khách hàng minhanh. Vui lòng kiểm tra và chuẩn bị hàng.	ORDER	t	{"action": "VIEW_ORDER", "orderId": "26081407384657547"}	2026-08-14 07:38:46.733	2026-08-14 08:07:14.986
cb37cd3b-6f36-4629-81bb-730132f902ad	3150f691-6e58-47c7-ad4c-acbd52f027c5	📦 Đơn hàng được cập nhật	Đơn hàng #26081407 của bạn đã chuyển sang trạng thái: COMPLETED.	ORDER	t	{"action": "VIEW_ORDER", "status": "COMPLETED", "orderId": "26081407384657547"}	2026-08-14 08:13:02.524	2026-08-14 08:14:29.867
597f684e-3ff5-43b8-980a-a3a948850eaa	3150f691-6e58-47c7-ad4c-acbd52f027c5	📦 Đơn hàng được cập nhật	Đơn hàng #26081407 của bạn đã chuyển sang trạng thái: COMPLETED.	ORDER	t	{"action": "VIEW_ORDER", "status": "COMPLETED", "orderId": "26081407384657547"}	2026-08-14 08:07:40.838	2026-08-14 08:14:59.995
a8e3159e-bf47-4f36-b78a-17f2135ea948	3150f691-6e58-47c7-ad4c-acbd52f027c5	🚚 Đơn hàng được cập nhật	Đơn hàng #26081407 của bạn đã chuyển sang trạng thái: Đang giao hàng.	ORDER	t	{"action": "VIEW_ORDER", "status": "SHIPPING", "orderId": "26081407384657547"}	2026-08-14 08:07:29.21	2026-08-14 08:15:01.311
b0b55ef9-908a-49e8-98a8-feb71f4ae6f4	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Đơn hàng mới từ Khách hàng 📦	Shop có 1 đơn hàng mới #26081408 từ khách hàng minhanh. Vui lòng kiểm tra và chuẩn bị hàng.	ORDER	t	{"action": "VIEW_ORDER", "orderId": "26081408234506930"}	2026-08-14 08:23:45.113	2026-08-14 08:24:22.451
bf70651e-2f9c-4af1-91ba-bfeebeac3d9c	3150f691-6e58-47c7-ad4c-acbd52f027c5	🎉 Đơn hàng được cập nhật	Đơn hàng #26081408 của bạn đã chuyển sang trạng thái: Đã giao hàng.	ORDER	t	{"action": "VIEW_ORDER", "status": "DELIVERED", "orderId": "26081408234506930"}	2026-08-14 08:27:37.967	2026-08-14 08:27:48.419
19baac63-5973-47bd-acad-c84e6374e07b	3150f691-6e58-47c7-ad4c-acbd52f027c5	📦 Đơn hàng được cập nhật	Đơn hàng #26081408 của bạn đã chuyển sang trạng thái: COMPLETED.	ORDER	t	{"action": "VIEW_ORDER", "status": "COMPLETED", "orderId": "26081408234506930"}	2026-08-14 08:27:54.529	2026-08-14 08:28:04.162
2a1fcaf5-ff76-4ad7-85fa-052157dfb839	3150f691-6e58-47c7-ad4c-acbd52f027c5	🚚 Đơn hàng được cập nhật	Đơn hàng #26081408 của bạn đã chuyển sang trạng thái: Đang giao hàng.	ORDER	t	{"action": "VIEW_ORDER", "status": "SHIPPING", "orderId": "26081408234506930"}	2026-08-14 08:27:30.161	2026-08-14 08:28:06.13
d21edc47-d523-4dc2-ae5d-498665db77a6	3150f691-6e58-47c7-ad4c-acbd52f027c5	⚙️ Đơn hàng được cập nhật	Đơn hàng #26081408 của bạn đã chuyển sang trạng thái: Đang xử lý.	ORDER	t	{"action": "VIEW_ORDER", "status": "PROCESSING", "orderId": "26081408234506930"}	2026-08-14 08:23:45.134	2026-08-14 08:28:07.912
41cce1ec-f2b2-444f-8e5b-93476b0bde6f	3150f691-6e58-47c7-ad4c-acbd52f027c5	Đặt hàng thành công 🛒	Đơn hàng #26081408 trị giá 241.500đ đã được khởi tạo thành công.	ORDER	t	{"action": "VIEW_ORDER", "orderId": "26081408234506930"}	2026-08-14 08:23:45.099	2026-08-14 08:28:11.371
b4b1aaf1-a11c-4c6e-a4bf-6a4247383a83	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Đơn hàng mới từ Khách hàng 📦	Shop có 1 đơn hàng mới #26081408 từ khách hàng minhanh. Vui lòng kiểm tra và chuẩn bị hàng.	ORDER	t	{"action": "VIEW_ORDER", "orderId": "26081408390084529"}	2026-08-14 08:39:00.89	2026-08-14 08:42:27.003
8c00e693-fa16-4e53-a77a-9d9cb78a1f28	3150f691-6e58-47c7-ad4c-acbd52f027c5	📦 Đơn hàng được cập nhật	Đơn hàng #26081408 của bạn đã chuyển sang trạng thái: COMPLETED.	ORDER	t	{"action": "VIEW_ORDER", "status": "COMPLETED", "orderId": "26081408234506930"}	2026-08-14 08:29:09.803	2026-08-14 08:42:49.676
73624405-b2b2-4f7d-8c6a-8a786ea1b9e1	3150f691-6e58-47c7-ad4c-acbd52f027c5	Đặt hàng thành công 🛒	Đơn hàng #26081408 trị giá 286.500đ đã được khởi tạo thành công.	ORDER	t	{"action": "VIEW_ORDER", "orderId": "26081408390084529"}	2026-08-14 08:39:00.877	2026-08-14 08:42:49.676
2fe2e36d-b7ef-437d-a3fb-8525279f1a27	3150f691-6e58-47c7-ad4c-acbd52f027c5	⚙️ Đơn hàng được cập nhật	Đơn hàng #26081408 của bạn đã chuyển sang trạng thái: Đang xử lý.	ORDER	t	{"action": "VIEW_ORDER", "status": "PROCESSING", "orderId": "26081408390084529"}	2026-08-14 08:39:04.896	2026-08-14 08:42:49.676
96aae5ad-3fd1-4ba3-a262-c6c6bc57fef7	3150f691-6e58-47c7-ad4c-acbd52f027c5	🚚 Đơn hàng được cập nhật	Đơn hàng #26081408 của bạn đã chuyển sang trạng thái: Đang giao hàng.	ORDER	t	{"action": "VIEW_ORDER", "status": "SHIPPING", "orderId": "26081408390084529"}	2026-08-14 08:42:44.537	2026-08-14 08:42:49.676
1391be9b-0972-474e-93a5-2abb4b880228	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Đơn hàng mới từ Khách hàng 📦	Shop có 1 đơn hàng mới #26081415 từ khách hàng minhanh. Vui lòng kiểm tra và chuẩn bị hàng.	ORDER	t	{"action": "VIEW_ORDER", "orderId": "26081415440545296"}	2026-08-14 15:44:05.607	2026-08-14 15:47:20.182
38538a55-d7f7-4a4f-86c0-470926c9eb39	3150f691-6e58-47c7-ad4c-acbd52f027c5	🎉 Đơn hàng được cập nhật	Đơn hàng #26081408 của bạn đã chuyển sang trạng thái: Đã giao hàng.	ORDER	f	{"action": "VIEW_ORDER", "status": "DELIVERED", "orderId": "26081408390084529"}	2026-08-14 15:49:39.418	2026-08-14 15:49:39.418
0fe59cc8-ca95-42c4-89fb-3b774bb11695	880a2880-43c0-4506-b25a-86dc34299f7b	📦 Đơn hàng được cập nhật	Đơn hàng #26081415 của bạn đã chuyển sang trạng thái: REFUND_PENDING.	ORDER	t	{"action": "VIEW_ORDER", "status": "REFUND_PENDING", "orderId": "26081415440545296"}	2026-08-14 15:50:06.025	2026-08-14 15:51:02.042
ee090b64-0c33-41ba-ab4d-83e01d68c656	880a2880-43c0-4506-b25a-86dc34299f7b	Đặt hàng thành công 🛒	Đơn hàng #26081415 trị giá 2.000đ đã được khởi tạo thành công.	ORDER	t	{"action": "VIEW_ORDER", "orderId": "26081415440545296"}	2026-08-14 15:44:05.591	2026-08-14 15:51:06.696
20d24dc3-9535-4bd2-9a9a-a88394dbc0d2	880a2880-43c0-4506-b25a-86dc34299f7b	⚙️ Đơn hàng được cập nhật	Đơn hàng #26081415 của bạn đã chuyển sang trạng thái: Đang xử lý.	ORDER	t	{"action": "VIEW_ORDER", "status": "PROCESSING", "orderId": "26081415440545296"}	2026-08-14 15:44:05.648	2026-08-14 15:51:06.696
4333faf2-115b-4248-b79a-eb418c5162d6	880a2880-43c0-4506-b25a-86dc34299f7b	🚚 Đơn hàng được cập nhật	Đơn hàng #26081415 của bạn đã chuyển sang trạng thái: Đang giao hàng.	ORDER	t	{"action": "VIEW_ORDER", "status": "SHIPPING", "orderId": "26081415440545296"}	2026-08-14 15:49:09.019	2026-08-14 15:51:06.696
6f18be3d-f701-4cfb-bac7-32b3af1dd939	880a2880-43c0-4506-b25a-86dc34299f7b	🎉 Đơn hàng được cập nhật	Đơn hàng #26081415 của bạn đã chuyển sang trạng thái: Đã giao hàng.	ORDER	t	{"action": "VIEW_ORDER", "status": "DELIVERED", "orderId": "26081415440545296"}	2026-08-14 15:49:40.511	2026-08-14 15:51:06.696
e4dfb309-1ad8-49de-9a7f-e3cc4932953e	880a2880-43c0-4506-b25a-86dc34299f7b	💸 Đơn hàng được cập nhật	Đơn hàng #26081415 của bạn đã chuyển sang trạng thái: Đã hoàn tiền.	ORDER	t	{"action": "VIEW_ORDER", "status": "REFUNDED", "orderId": "26081415440545296"}	2026-08-14 15:50:35.487	2026-08-14 15:51:06.696
6fc9bffe-34f2-45dd-b251-795f18d9d8a5	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	Đơn hàng mới từ Khách hàng 📦	Shop có 1 đơn hàng mới #26081415 từ khách hàng minhanh. Vui lòng kiểm tra và chuẩn bị hàng.	ORDER	f	{"action": "VIEW_ORDER", "orderId": "26081415522442674"}	2026-08-14 15:52:24.479	2026-08-14 15:52:24.479
9693cd82-e039-495b-8993-a8819a4e2303	880a2880-43c0-4506-b25a-86dc34299f7b	Đặt hàng thành công 🛒	Đơn hàng #26081415 trị giá 256.500đ đã được khởi tạo thành công.	ORDER	t	{"action": "VIEW_ORDER", "orderId": "26081415522442674"}	2026-08-14 15:52:24.461	2026-08-14 15:58:23.842
ed337448-2f93-4849-967d-274abe2b04ca	880a2880-43c0-4506-b25a-86dc34299f7b	⚙️ Đơn hàng được cập nhật	Đơn hàng #26081415 của bạn đã chuyển sang trạng thái: Đang xử lý.	ORDER	t	{"action": "VIEW_ORDER", "status": "PROCESSING", "orderId": "26081415522442674"}	2026-08-14 15:52:24.492	2026-08-14 15:58:23.842
a3b80815-e8f3-4f6e-b898-46ae7c9589ff	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Đơn hàng mới từ Khách hàng 📦	Shop có 1 đơn hàng mới #26081415 từ khách hàng minhanh. Vui lòng kiểm tra và chuẩn bị hàng.	ORDER	t	{"action": "VIEW_ORDER", "orderId": "26081415590264558"}	2026-08-14 15:59:02.682	2026-08-14 15:59:09.698
cb1c4fdd-ac84-4d2b-bde4-3b879e33d659	880a2880-43c0-4506-b25a-86dc34299f7b	🚚 Đơn hàng được cập nhật	Đơn hàng #26081415 của bạn đã chuyển sang trạng thái: Đang giao hàng.	ORDER	t	{"action": "VIEW_ORDER", "status": "SHIPPING", "orderId": "26081415590264558"}	2026-08-14 16:00:53.576	2026-08-14 16:01:05.786
a73b31df-3a6f-4d1f-8299-36ec78207bc9	880a2880-43c0-4506-b25a-86dc34299f7b	Đặt hàng thành công 🛒	Đơn hàng #26081415 trị giá 91.500đ đã được khởi tạo thành công.	ORDER	t	{"action": "VIEW_ORDER", "orderId": "26081415590264558"}	2026-08-14 15:59:02.672	2026-08-14 16:01:09.047
8273875a-3e0d-4db4-8e44-a5c4b0856a74	880a2880-43c0-4506-b25a-86dc34299f7b	⚙️ Đơn hàng được cập nhật	Đơn hàng #26081415 của bạn đã chuyển sang trạng thái: Đang xử lý.	ORDER	t	{"action": "VIEW_ORDER", "status": "PROCESSING", "orderId": "26081415590264558"}	2026-08-14 15:59:02.694	2026-08-14 16:01:09.047
cdb154b1-dc8c-4d6f-84e3-7121f84af1fe	880a2880-43c0-4506-b25a-86dc34299f7b	🎉 Đơn hàng được cập nhật	Đơn hàng #26081415 của bạn đã chuyển sang trạng thái: Đã giao hàng.	ORDER	f	{"action": "VIEW_ORDER", "status": "DELIVERED", "orderId": "26081415590264558"}	2026-08-14 16:01:12.254	2026-08-14 16:01:12.254
b52ca9bd-7287-4edf-a634-fac74db7ce2d	880a2880-43c0-4506-b25a-86dc34299f7b	📦 Đơn hàng được cập nhật	Đơn hàng #26081415 của bạn đã chuyển sang trạng thái: COMPLETED.	ORDER	f	{"action": "VIEW_ORDER", "status": "COMPLETED", "orderId": "26081415590264558"}	2026-08-14 16:01:21.675	2026-08-14 16:01:21.675
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: order; Owner: postgres
--

COPY "order"."Order" (id, "buyerId", "buyerEmail", "buyerName", "buyerPhone", "shippingAddress", "totalAmount", "shippingFee", "paymentMethod", status, "createdAt", "updatedAt", "ghnDistrictId", "ghnOrderCode", "ghnWardCode", "refundDescription", "refundEmail", "refundReason", "refundProofImages", "shopDiscountAmount", "platformDiscountAmount", "shopVoucherCode", "platformVoucherCode", "appliedVoucherIds", "commissionRate") FROM stdin;
260620102938	e9cd2310-7eb9-4ce5-ba8e-7e9e1f815d2d	hhshh@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	457700	37700	zeropay	PROCESSING	2026-06-20 12:03:02.146	2026-06-20 12:03:02.197	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
260629591100	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	Quang Hiệp	(+84) 964 579 875	Đường không tên, Phú Lâm, An Giang, Phú Lâm, Phú Tân, An Giang	450000	30000	cod	PROCESSING	2026-06-29 05:59:11.677	2026-06-29 05:59:11.743	1756	\N	510505	\N	\N	\N	\N	0	0	\N	\N	\N	5
260629060925	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	617700	37700	sepay	CANCELLED	2026-06-29 06:09:25.89	2026-07-19 01:39:46.144	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
260629061107	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	487700	37700	sepay	CANCELLED	2026-06-29 06:11:07.962	2026-07-19 01:39:46.147	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
260717053934	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	487700	37700	sepay	CANCELLED	2026-07-17 05:39:34.039	2026-07-19 01:39:46.148	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
260717055639	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	39700	37700	sepay	CANCELLED	2026-07-17 05:56:39.131	2026-07-19 01:39:46.149	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
260717055720	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	4700	2700	sepay	CANCELLED	2026-07-17 05:57:20.525	2026-07-19 01:39:46.15	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
260719011826	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	4700	2700	sepay	REFUNDED	2026-07-19 01:18:26.99	2026-07-24 06:00:19.339	\N	GHN-MOCK-1784425771427	\N		vqc141@gmail.com	[Đã nhận hàng nhưng hàng có vấn đề (bể vỡ, sai mẫu, hàng lỗi, khác mô tả...) - Miễn ship hoàn về] Lý do: Gửi sai hàng / khác phân loại đã đặt	\N	0	0	\N	\N	\N	5
260717060418	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	4700	2700	sepay	COMPLETED	2026-07-17 06:04:18.517	2026-07-24 06:00:34.787	\N	GHN-VN-492465584	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
260717060402	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	4700	2700	cod	COMPLETED	2026-07-17 06:04:02.428	2026-07-24 11:26:47.827	\N	GHN-VN-564473242	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
260717060050	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	4700	2700	sepay	COMPLETED	2026-07-17 06:00:50.241	2026-07-24 11:04:04.023	\N	GHN-VN-188272803	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
260630113938	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	487700	37700	cod	COMPLETED	2026-06-30 11:39:38.796	2026-08-12 19:08:58.383	\N	GHN-VN-555795992	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
26081219054531939	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	minhanh	0344461922	151 Nguyễn Kim, Phường 7, Quận 10, Hồ Chí Minh, Phường 7, Quận 10, Hồ Chí Minh	450000	0	cod	COMPLETED	2026-08-12 19:05:45.329	2026-08-12 19:08:56.278	1452	GHN-VN-324051310	21007	\N	\N	\N	\N	0	0	\N	FREESHIP	\N	5
26081219040078621	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	minhanh	0344461922	151 Nguyễn Kim, Phường 7, Quận 10, Hồ Chí Minh, Phường 7, Quận 10, Hồ Chí Minh	250000	0	zeropay	COMPLETED	2026-08-12 19:04:00.797	2026-08-12 19:08:57.55	1452	GHN-VN-118142242	21007	\N	\N	\N	\N	0	0	\N	FREESHIP	\N	5
26081219201633973	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	minhanh	0344461922	151 Nguyễn Kim, Phường 7, Quận 10, Hồ Chí Minh, Phường 7, Quận 10, Hồ Chí Minh	18500	16500	cod	COMPLETED	2026-08-12 19:20:16.354	2026-08-12 19:20:56.709	1452	GHN-VN-878703231	21007	\N	\N	\N	\N	0	0	\N	\N	\N	5
26081218460363381	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	minhanh	0344461922	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	2000	0	cod	COMPLETED	2026-08-12 18:46:03.711	2026-08-12 19:08:57.974	1452	GHN-VN-960283895	21007	\N	\N	\N	\N	0	0	\N	FREESHIP	\N	5
260717060031	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	4700	2700	cod	COMPLETED	2026-07-17 06:00:31.751	2026-08-12 19:08:58.175	\N	GHN-VN-590528621	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
260629600135	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	487700	37700	cod	COMPLETED	2026-06-29 06:00:13.561	2026-08-14 07:33:43.672	\N	GHN-VN-756998021	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
26081408234506930	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	minhanh	0344461922	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	241500	16500	zeropay	COMPLETED	2026-08-14 08:23:45.082	2026-08-14 08:29:09.792	1452	GHN-VN-975045629	21007	\N	\N	\N	\N	0	25000	\N	DISCOUNT10	\N	5
26081407384657547	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	minhanh	0344461922	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	216500	16500	zeropay	COMPLETED	2026-08-14 07:38:46.666	2026-08-14 08:13:02.508	1452	GHN-VN-560834385	21007	\N	\N	\N	\N	0	50000	\N	DISCOUNT50K	\N	5
26081408390084529	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	minhanh	0344461922	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	286500	16500	cod	DELIVERED	2026-08-14 08:39:00.856	2026-08-14 15:49:39.407	1452	GHN-VN-889275153	21007	\N	\N	\N	\N	0	50000	\N	DISCOUNT50K	\N	5
26081415440545296	880a2880-43c0-4506-b25a-86dc34299f7b	minhanh@zeromall.com	minhanh	0344461922	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	2000	0	zeropay	REFUNDED	2026-08-14 15:44:05.515	2026-08-14 15:50:35.475	1452	GHN-VN-487424201	21007	m , ,m,ml	minhanh@zeromall.com	[Chưa nhận hàng hoặc nhận thiếu hàng] Lý do: Chưa nhận được hàng sau thời gian dài	\N	0	0	\N	FREESHIP	\N	5
26081415522442674	880a2880-43c0-4506-b25a-86dc34299f7b	minhanh@zeromall.com	minhanh	0344461922	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	256500	16500	cod	PROCESSING	2026-08-14 15:52:24.44	2026-08-14 15:52:24.474	1452	\N	21007	\N	\N	\N	\N	0	50000	\N	DISCOUNT50K	\N	5
26081415590264558	880a2880-43c0-4506-b25a-86dc34299f7b	minhanh@zeromall.com	minhanh	0344461922	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	91500	16500	zeropay	COMPLETED	2026-08-14 15:59:02.658	2026-08-14 16:01:21.666	1452	GHN-VN-697013339	21007	\N	\N	\N	\N	0	0	\N	\N	\N	5
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
f7e15af0-af57-4200-b01a-5443d1f27c4b	26081218460363381	130c82e3-a2ef-437e-8e77-a6da1ab4af5b	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	cuong	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	\N	2000	1
44c4d8c1-9c50-48d6-a2ea-ca7917336537	26081219040078621	aac07fcf-9b55-4ce6-9b2f-2e3d34275e4f	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Áo Khoác Bomber Unisex Cực Ngầu Nỉ Ngoại Dày Dặn	https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80	\N	250000	1
3c2af3ab-3936-4a9a-a06e-e9e5b926169a	26081219054531939	50809270-b63e-43ff-93b7-913411c073f8	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Giày Sneaker Nam Nữ Thể Thao Da Mềm Cao Cấp	https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80	\N	450000	1
0a5169f6-4da6-4be2-8666-6cd0cd40fb99	26081219201633973	c01b68c8-330f-484a-b73d-1d65b194f189	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	cuong	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	\N	2000	1
adb9e542-9baf-401e-8993-9413d40c1777	26081407384657547	aac07fcf-9b55-4ce6-9b2f-2e3d34275e4f	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Áo Khoác Bomber Unisex Cực Ngầu Nỉ Ngoại Dày Dặn	https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80	\N	250000	1
6c1fd399-6651-4a4c-a4a9-1e5ab2c51aca	26081408234506930	aac07fcf-9b55-4ce6-9b2f-2e3d34275e4f	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Áo Khoác Bomber Unisex Cực Ngầu Nỉ Ngoại Dày Dặn	https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80	\N	250000	1
a2d336d5-791a-46dc-85a0-fc08ecf881f0	26081408390084529	bcba9294-1540-4629-a1f4-21ea531b21d8	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Váy Tay Bồng Dáng Xòe Công Chúa Cực Xinh	https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80	\N	320000	1
8195a166-3047-4d40-9c5e-f31745393c4f	26081415440545296	bea80f9c-aab7-4885-90b2-3f962816edda	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	cuong	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	\N	2000	1
df87234d-e3a6-4f28-abf6-0ce210cb02d5	26081415522442674	ed97f21d-2134-40ca-a758-5b6fea1ce201	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	Máy Xay Sinh Tố Cầm Tay Sạc Pin Mini Không Dây	https://images.unsplash.com/photo-1578643463396-0997cb5328c1?w=400&q=80	\N	290000	1
fa1067c3-7041-4392-bbaf-c910665b18b0	26081415590264558	b1fc3f48-76b8-4492-bf91-af20167e137e	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Nón Lưỡi Trai Kaki Trơn Phong Cách Hàn Quốc	https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80	\N	75000	1
\.


--
-- Data for Name: EscrowTransaction; Type: TABLE DATA; Schema: payment; Owner: postgres
--

COPY payment."EscrowTransaction" (id, "orderId", "shopId", amount, "commissionRate", status, "releaseAt", "createdAt", "updatedAt") FROM stdin;
e80aff1b-1191-4dc5-9978-606cdaa35eb0	260717060418	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	2000	5	RELEASED	2026-07-24 06:01:34.827	2026-07-24 06:00:34.831	2026-07-24 06:01:36.142
4c3ad2da-b6c7-4bb3-b6bd-5b4d2e44822a	260717060402	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	2000	5	RELEASED	2026-07-24 11:27:47.832	2026-07-24 11:26:47.835	2026-07-24 11:27:52.166
9bdc2d44-2685-42c6-a313-d131d01c7b7e	260717060050	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	2000	5	RELEASED	2026-07-24 11:56:44.069	2026-07-24 11:55:44.071	2026-07-24 11:56:54.97
5b2ba943-be3a-43f5-8564-a34d23c9801e	26081219054531939	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	450000	5	RELEASED	2026-08-15 19:08:56.289	2026-08-12 19:08:56.292	2026-08-12 19:08:56.305
66f514da-8eed-4f9b-bd67-3971560c8fd0	26081219040078621	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	250000	5	RELEASED	2026-08-15 19:08:57.56	2026-08-12 19:08:57.56	2026-08-12 19:08:57.571
7db0cdbc-8f36-490e-90c0-02551cfccc1b	26081218460363381	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	2000	5	RELEASED	2026-08-15 19:08:57.982	2026-08-12 19:08:57.983	2026-08-12 19:08:57.994
57e7e559-025a-4a1a-96cf-55571db73964	260717060031	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	2000	5	RELEASED	2026-08-15 19:08:58.186	2026-08-12 19:08:58.187	2026-08-12 19:08:58.199
5106027a-e7c4-4da5-894d-d3beb1b557a1	260630113938	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	450000	5	RELEASED	2026-08-15 19:08:58.392	2026-08-12 19:08:58.393	2026-08-12 19:08:58.405
3c474775-cca1-4a33-b05b-0036b2d876a7	260629600135	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	450000	5	RELEASED	2026-08-15 19:08:58.871	2026-08-12 19:08:58.872	2026-08-12 19:08:58.883
f261d86e-ec32-47bf-8e0f-0c93a8a1349b	26081219201633973	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	2000	5	RELEASED	2026-08-15 19:20:56.723	2026-08-12 19:20:56.724	2026-08-12 19:20:56.737
748ecf61-00ad-4456-8321-8ce241f152df	26081407384657547	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	250000	5	RELEASED	2026-08-17 08:07:40.839	2026-08-14 08:07:40.843	2026-08-14 08:07:40.859
22c75be3-510b-4135-bb57-ea4e33f70cea	26081408234506930	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	250000	5	RELEASED	2026-08-17 08:27:37.949	2026-08-14 08:27:37.95	2026-08-14 08:27:54.542
2d365fee-b335-405d-996c-8e0c885c44c9	26081408390084529	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	320000	5	HELD	2026-08-17 15:49:39.42	2026-08-14 15:49:39.423	2026-08-14 15:49:39.423
ccca042c-a160-4f31-87d8-cbcbd33ae88b	26081415440545296	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	2000	5	HELD	2026-08-17 15:49:40.51	2026-08-14 15:49:40.511	2026-08-14 15:49:40.511
977aa155-667e-4c08-a693-a32cc2545ba0	26081415590264558	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	75000	5	RELEASED	2026-08-17 16:01:12.253	2026-08-14 16:01:12.254	2026-08-14 16:01:21.683
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
029ddb58-e649-4aa3-923a-7acf43de759c	26081218460363381	3150f691-6e58-47c7-ad4c-acbd52f027c5	2000	cod	PENDING	\N	2026-08-12 18:46:03.767	2026-08-12 18:46:03.767
5e08951a-b2ea-4c3a-9464-74e89f53516d	26081219040078621	3150f691-6e58-47c7-ad4c-acbd52f027c5	250000	zeropay	SUCCESS	ZPAY-956d8bcf-bfb4-4ba1-b5c8-80c74c292f30	2026-08-12 19:04:00.813	2026-08-12 19:04:00.833
afd1d632-c21c-43e1-aa5b-307ea866f334	26081219054531939	3150f691-6e58-47c7-ad4c-acbd52f027c5	450000	cod	PENDING	\N	2026-08-12 19:05:45.345	2026-08-12 19:05:45.345
022b1ccf-5dfc-42ed-849d-8d5404908efa	26081219201633973	3150f691-6e58-47c7-ad4c-acbd52f027c5	18500	cod	PENDING	\N	2026-08-12 19:20:16.377	2026-08-12 19:20:16.377
158bb08f-9bb0-480f-bcbd-4063185fc5b2	26081407384657547	3150f691-6e58-47c7-ad4c-acbd52f027c5	216500	zeropay	SUCCESS	ZPAY-cd7f4646-2858-4c1e-8ebf-6998922c73d0	2026-08-14 07:38:50.714	2026-08-14 07:38:50.735
0f09ad14-dc5a-4f1b-bb82-340cd345ac35	26081408234506930	3150f691-6e58-47c7-ad4c-acbd52f027c5	241500	zeropay	SUCCESS	ZPAY-59dafb67-0415-4d60-b6ba-228b4ac3f510	2026-08-14 08:23:45.097	2026-08-14 08:23:45.106
02200a76-9351-462c-9d5f-849e545aba5e	26081408390084529	3150f691-6e58-47c7-ad4c-acbd52f027c5	286500	cod	PENDING	\N	2026-08-14 08:39:04.875	2026-08-14 08:39:04.875
4c47627c-1893-497e-9967-9985b187a4bb	26081415440545296	880a2880-43c0-4506-b25a-86dc34299f7b	2000	zeropay	SUCCESS	ZPAY-23132a27-a247-4788-bcf8-cf0396776f8d	2026-08-14 15:44:05.551	2026-08-14 15:44:05.57
e94ed7b4-6880-4fe7-9ed3-796605e209c7	26081415522442674	880a2880-43c0-4506-b25a-86dc34299f7b	256500	cod	PENDING	\N	2026-08-14 15:52:24.462	2026-08-14 15:52:24.462
97f2c647-43fd-49c6-99d6-bb6a6354a1d6	26081415590264558	880a2880-43c0-4506-b25a-86dc34299f7b	91500	zeropay	SUCCESS	ZPAY-c9d7cabf-a32d-4f59-a313-d0f303a6dc33	2026-08-14 15:59:02.671	2026-08-14 15:59:02.677
\.


--
-- Data for Name: Wallet; Type: TABLE DATA; Schema: payment; Owner: postgres
--

COPY payment."Wallet" (id, "buyerId", balance, "createdAt", "updatedAt", "onHoldBalance") FROM stdin;
c9c18360-3bb6-4f1a-90d7-be5eab2500e3	guest-buyer-id	5000000	2026-06-20 12:02:52.655	2026-06-20 12:02:52.655	0
32b85b1a-bcc5-46a6-9c78-3fcfc60de3e7	e9cd2310-7eb9-4ce5-ba8e-7e9e1f815d2d	4542300	2026-06-20 12:02:52.653	2026-06-20 12:03:02.174	0
37aa0cd4-289f-4a5e-97e9-0297a8a9fed9	0843610c-e845-437b-a239-fd17acd55ad5	5000000	2026-06-29 04:10:53.128	2026-06-29 04:10:53.128	0
6033f671-76c8-46e4-8ba1-91792deb1b31	5c64ac2d-0123-43c0-86bf-b9495528c27d	5000000	2026-06-29 05:19:38.376	2026-06-29 05:19:38.376	0
bf52b83a-1ad7-417b-b68d-9a48da080744	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	5316700	2026-06-30 11:09:54.308	2026-07-24 06:00:19.363	0
2e6f2599-2ced-453d-855d-545a70c613c9	3150f691-6e58-47c7-ad4c-acbd52f027c5	4292000	2026-06-29 05:58:25.113	2026-08-14 08:23:45.104	0
af81c680-56a5-4af4-ae06-22209106f113	880a2880-43c0-4506-b25a-86dc34299f7b	4908500	2026-08-14 15:43:45.632	2026-08-14 15:59:02.675	0
1ec2e675-1528-48bb-a4f1-33096c3ba62b	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	7075650	2026-07-19 02:44:45.73	2026-08-14 16:01:21.685	322000
c119dbea-af00-41a1-a483-cb5c97d91e90	PLATFORM	109350	2026-07-24 06:01:36.15	2026-08-14 16:01:21.689	0
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
a95054c2-8803-424e-8a28-b58411a34e69	2e6f2599-2ced-453d-855d-545a70c613c9	250000	PAYMENT	Thanh toán đơn hàng #26081219040078621	SUCCESS	2026-08-12 19:04:00.829
8521b3f2-f4ca-45d2-9787-3e820d7b6b64	1ec2e675-1528-48bb-a4f1-33096c3ba62b	427500	REVENUE	Giải ngân doanh thu đơn hàng #26081219054531939 (sau chiết khấu 5%)	SUCCESS	2026-08-12 19:08:56.308
a5ceb500-b8c0-4c0b-a14e-935b985237dd	c119dbea-af00-41a1-a483-cb5c97d91e90	22500	COMMISSION	Chiết khấu sàn 5% đơn hàng #26081219054531939 từ Shop 6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	SUCCESS	2026-08-12 19:08:56.311
161e197b-b0e4-4706-96a8-ce3d62de1066	1ec2e675-1528-48bb-a4f1-33096c3ba62b	237500	REVENUE	Giải ngân doanh thu đơn hàng #26081219040078621 (sau chiết khấu 5%)	SUCCESS	2026-08-12 19:08:57.573
97144ddd-3872-4b1d-8bae-ad40a067097b	c119dbea-af00-41a1-a483-cb5c97d91e90	12500	COMMISSION	Chiết khấu sàn 5% đơn hàng #26081219040078621 từ Shop 6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	SUCCESS	2026-08-12 19:08:57.577
a4a559c9-6f82-471c-9986-6bd5551429e6	1ec2e675-1528-48bb-a4f1-33096c3ba62b	1900	REVENUE	Giải ngân doanh thu đơn hàng #26081218460363381 (sau chiết khấu 5%)	SUCCESS	2026-08-12 19:08:57.996
7510033c-162a-4ccd-a4b6-18296df510dc	c119dbea-af00-41a1-a483-cb5c97d91e90	100	COMMISSION	Chiết khấu sàn 5% đơn hàng #26081218460363381 từ Shop 6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	SUCCESS	2026-08-12 19:08:57.999
e2c39ab4-f987-4a59-9190-89c96ff1a8f0	1ec2e675-1528-48bb-a4f1-33096c3ba62b	1900	REVENUE	Giải ngân doanh thu đơn hàng #260717060031 (sau chiết khấu 5%)	SUCCESS	2026-08-12 19:08:58.203
8de23fb0-41da-44ed-aaac-9816d49fe622	c119dbea-af00-41a1-a483-cb5c97d91e90	100	COMMISSION	Chiết khấu sàn 5% đơn hàng #260717060031 từ Shop 6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	SUCCESS	2026-08-12 19:08:58.206
511e416d-cccc-4174-b9c4-b260f5945f37	1ec2e675-1528-48bb-a4f1-33096c3ba62b	427500	REVENUE	Giải ngân doanh thu đơn hàng #260630113938 (sau chiết khấu 5%)	SUCCESS	2026-08-12 19:08:58.409
4d6d40d2-2b4c-4eef-b1e7-e4c4c2b4edf5	c119dbea-af00-41a1-a483-cb5c97d91e90	22500	COMMISSION	Chiết khấu sàn 5% đơn hàng #260630113938 từ Shop 6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	SUCCESS	2026-08-12 19:08:58.412
4b3828f6-3ed1-45ab-ab9a-04ec9cea4a10	1ec2e675-1528-48bb-a4f1-33096c3ba62b	427500	REVENUE	Giải ngân doanh thu đơn hàng #260629600135 (sau chiết khấu 5%)	SUCCESS	2026-08-12 19:08:58.886
96dfd08f-2025-4b60-b09d-619f98299b84	c119dbea-af00-41a1-a483-cb5c97d91e90	22500	COMMISSION	Chiết khấu sàn 5% đơn hàng #260629600135 từ Shop 6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	SUCCESS	2026-08-12 19:08:58.889
11072b3a-3de8-4a11-b900-06a40ba411d5	1ec2e675-1528-48bb-a4f1-33096c3ba62b	1900	REVENUE	Giải ngân doanh thu đơn hàng #26081219201633973 (sau chiết khấu 5%)	SUCCESS	2026-08-12 19:20:56.741
8a020b58-3133-4ce1-b260-1e706f6c33c8	c119dbea-af00-41a1-a483-cb5c97d91e90	100	COMMISSION	Chiết khấu sàn 5% đơn hàng #26081219201633973 từ Shop 6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	SUCCESS	2026-08-12 19:20:56.745
b492e64e-ba4e-45dc-a248-2a29e04d4b22	2e6f2599-2ced-453d-855d-545a70c613c9	216500	PAYMENT	Thanh toán đơn hàng #26081407384657547	SUCCESS	2026-08-14 07:38:50.731
e0ac7bba-0931-48fb-8fb3-e2f5c8edf23e	1ec2e675-1528-48bb-a4f1-33096c3ba62b	237500	REVENUE	Giải ngân doanh thu đơn hàng #26081407384657547 (sau chiết khấu 5%)	SUCCESS	2026-08-14 08:07:40.864
dee428ed-6800-41da-bfa6-38d7b066339e	c119dbea-af00-41a1-a483-cb5c97d91e90	12500	COMMISSION	Chiết khấu sàn 5% đơn hàng #26081407384657547 từ Shop 6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	SUCCESS	2026-08-14 08:07:40.87
edf5be7d-e519-49b7-b93c-f910eaeb963d	2e6f2599-2ced-453d-855d-545a70c613c9	241500	PAYMENT	Thanh toán đơn hàng #26081408234506930	SUCCESS	2026-08-14 08:23:45.105
b7525868-8c90-4fcd-9f83-818e60e5e92a	1ec2e675-1528-48bb-a4f1-33096c3ba62b	237500	REVENUE	Giải ngân doanh thu đơn hàng #26081408234506930 (sau chiết khấu 5%)	SUCCESS	2026-08-14 08:27:54.545
59aee01f-aa04-4659-84ac-1daa8a956ae7	c119dbea-af00-41a1-a483-cb5c97d91e90	12500	COMMISSION	Chiết khấu sàn 5% đơn hàng #26081408234506930 từ Shop 6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	SUCCESS	2026-08-14 08:27:54.549
40f43582-5882-49df-b107-63fcae5d6a15	af81c680-56a5-4af4-ae06-22209106f113	2000	PAYMENT	Thanh toán đơn hàng #26081415440545296	SUCCESS	2026-08-14 15:44:05.566
8159ea6d-e94e-4a95-a9e0-2de227a6d063	af81c680-56a5-4af4-ae06-22209106f113	2000	REFUND	Hoàn tiền trả hàng cho đơn hàng #26081415440545296	SUCCESS	2026-08-14 15:50:35.492
a30f53f1-3226-4c6e-9b91-04c1df3706fa	af81c680-56a5-4af4-ae06-22209106f113	91500	PAYMENT	Thanh toán đơn hàng #26081415590264558	SUCCESS	2026-08-14 15:59:02.676
1561b431-d5a7-45fe-bdb6-cfa35b5e1c92	1ec2e675-1528-48bb-a4f1-33096c3ba62b	71250	REVENUE	Giải ngân doanh thu đơn hàng #26081415590264558 (sau chiết khấu 5%)	SUCCESS	2026-08-14 16:01:21.686
fb734b5f-f4f3-482a-a58c-0be2a8995b3c	c119dbea-af00-41a1-a483-cb5c97d91e90	3750	COMMISSION	Chiết khấu sàn 5% đơn hàng #26081415590264558 từ Shop 6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	SUCCESS	2026-08-14 16:01:21.69
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
7d707a15-9b2d-413f-9064-21e60c61ec61	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Balo Thời Trang Học Sinh Sinh Viên Chống Nước	https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80	Túi Ví Nữ	No Brand	Balo thời trang đựng vừa laptop 15.6 inch, chất vải oxford chống thấm nước tốt, nhiều ngăn tiện lợi đi học hay du lịch ngắn ngày.	199000	80	0	active	BP-GRY-05	\N	f	[]	[]	600	\N	\N	\N	new	f	7	2026-06-29 04:38:06.933	2026-06-29 04:38:06.933	\N	\N	280000	f	0	\N	825d4683-d05c-47a4-8cac-3f54890a2d75
7eca41aa-9dff-4051-b617-16cd233a66e8	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	Kệ Đồ Nhà Bếp Thông Minh Sơn Tĩnh Điện 3 Tầng	https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=400&q=80	Nhà Cửa	No Brand	Kệ để gia vị, lò vi sóng bằng thép carbon sơn tĩnh điện chống gỉ sét, chịu lực lên đến 50kg, giúp căn bếp luôn ngăn nắp gọn gàng.	420000	30	1	active	SHF-KIT-05	\N	f	[]	[]	3500	\N	\N	\N	new	f	7	2026-06-29 04:38:06.944	2026-06-29 04:38:06.944	\N	\N	600000	f	0	\N	70ddc8c0-1a5a-4be8-80c6-1e932449c812
502872df-544b-4d08-97f6-f5136d2f36c6	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	Bình Giữ Nhiệt Lõi Inox 316 Cao Cấp 1000ml	https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80	Nhà Cửa	Lock&Lock	Bình giữ nhiệt dung tích lớn giữ nóng/lạnh lên đến 24 giờ, chất liệu thép không gỉ 316 y tế siêu an toàn, có quai xách tiện lợi.	350000	70	0	active	THM-LOCK-04	\N	f	[]	[]	600	\N	\N	\N	new	f	7	2026-06-29 04:38:06.942	2026-06-29 04:38:06.942	\N	\N	490000	f	0	\N	70ddc8c0-1a5a-4be8-80c6-1e932449c812
07dd1cf8-a26e-49a2-a7d0-95abe3ec8388	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	Bộ Bát Đĩa Sứ Tráng Men Xanh Cổ Điển Sang Trọng	https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&q=80	Nhà Cửa	No Brand	Bộ bát đĩa sứ cao cấp gồm 12 chi tiết tráng men bóng cao cấp, phong cách Bắc Âu sang trọng, chịu nhiệt tốt dùng được trong lò vi sóng.	580000	15	0	active	CER-BLU-03	\N	f	[]	[]	4000	\N	\N	\N	new	f	7	2026-06-29 04:38:06.94	2026-07-22 08:16:43.395	\N	\N	750000	t	42	Hàng giả/nhái thương hiệu, lừa đảo	70ddc8c0-1a5a-4be8-80c6-1e932449c812
d6b333d1-acc0-4081-97b3-a2a397ffe56b	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	Nồi Chiên Không Dầu Điện Tử 6.5L Đa Năng Tiện Lợi	https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=400&q=80	Gia Dụng	Philips	Nồi chiên không dầu dung tích lớn 6.5L, điều khiển điện tử cảm ứng nhạy bén, công nghệ chiên xoáy nhiệt 360 độ hạn chế dầu mỡ bảo vệ sức khỏe.	1850000	20	0	active	AF-PLP-01	\N	f	[]	[]	5500	\N	\N	\N	new	f	7	2026-06-29 04:38:06.935	2026-06-29 04:38:06.935	\N	\N	2500000	f	0	\N	4ff7e1b5-53a6-4525-ba37-8f2129453998
130c82e3-a2ef-437e-8e77-a6da1ab4af5b	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	cuong	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	Phụ Kiện Nữ	2	2	2000	1	2	active			f	[{"name":"Màu sắc","options":[]}]	[]	2	2	2	2	new	f	7	2026-07-17 05:56:09.202	2026-08-12 18:46:03.769	["https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg"]		20000	t	15	Mặt hàng chưa kiểm định y tế	fdf7905e-c3bd-4fe7-b979-5f0c2acc4f8a
50809270-b63e-43ff-93b7-913411c073f8	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Giày Sneaker Nam Nữ Thể Thao Da Mềm Cao Cấp	https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80	Giày Dép Nam	Adidas	Giày sneaker thể thao phong cách Hàn Quốc trẻ trung năng động, đế cao su chống trơn trượt êm chân, phù hợp đi học, đi làm, dạo phố.	450000	59	3	active	SNK-WHT-03	\N	f	[]	[]	700	\N	\N	\N	new	f	7	2026-06-29 04:38:06.928	2026-08-12 19:05:45.341	\N	\N	600000	f	0	\N	dec2bbb5-567c-4ab4-8175-0feb65e8bf77
c01b68c8-330f-484a-b73d-1d65b194f189	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	cuong	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	Phụ Kiện Nữ	2	2	2000	1	2	active			f	[{"name":"Màu sắc","options":[]}]	[]	2	2	2	2	new	f	7	2026-07-17 05:56:07.87	2026-08-12 19:20:16.37	["https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg"]		20000	f	0	\N	fdf7905e-c3bd-4fe7-b979-5f0c2acc4f8a
bcba9294-1540-4629-a1f4-21ea531b21d8	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Váy Tay Bồng Dáng Xòe Công Chúa Cực Xinh	https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80	Thời Trang Nữ	No Brand	Váy xòe phong cách tiểu thư cổ điển điệu đà, tay bồng thanh lịch, chất vải voan hàn cao cấp mềm mại hai lớp cực chuẩn phom dáng.	320000	44	1	active	DRS-PNK-02	\N	f	[]	[]	300	\N	\N	\N	new	f	7	2026-06-29 04:38:06.925	2026-08-14 08:39:00.869	\N	\N	450000	f	0	\N	dcb70d3d-bdae-49e6-9bbe-331ab2a10f6d
aac07fcf-9b55-4ce6-9b2f-2e3d34275e4f	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Áo Khoác Bomber Unisex Cực Ngầu Nỉ Ngoại Dày Dặn	https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80	Thời Trang Nam	No Brand	Áo khoác bomber phong cách đường phố năng động, chất liệu nỉ ngoại cao cấp dày dặn ấm áp, thích hợp đi chơi hay đi học.	250000	97	3	active	BMB-BLK-01	\N	f	[]	[]	500	\N	\N	\N	new	f	7	2026-06-29 04:38:06.922	2026-08-14 08:23:45.155	\N	\N	350000	f	0	\N	9cd1423d-4dee-4998-93bd-4b0c7b968928
bea80f9c-aab7-4885-90b2-3f962816edda	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	cuong	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	Phụ Kiện Nữ	2	2	2000	1	3	active			f	[{"name":"Màu sắc","options":[]}]	[]	2	2	2	2	new	f	7	2026-07-17 05:56:09.138	2026-08-14 15:44:05.665	["https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg"]		20000	f	0	\N	fdf7905e-c3bd-4fe7-b979-5f0c2acc4f8a
ed97f21d-2134-40ca-a758-5b6fea1ce201	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	Máy Xay Sinh Tố Cầm Tay Sạc Pin Mini Không Dây	https://images.unsplash.com/photo-1578643463396-0997cb5328c1?w=400&q=80	Gia Dụng	Bear	Máy xay sinh tố đa năng sạc pin tiện lợi mang đi làm, đi du lịch. Lưỡi dao inox 304 sắc bén, chất liệu nhựa cao cấp an toàn cho bé.	290000	39	1	active	BL-BEAR-02	\N	f	[]	[]	800	\N	\N	\N	new	f	7	2026-06-29 04:38:06.937	2026-08-14 15:52:24.457	\N	\N	390000	f	0	\N	4ff7e1b5-53a6-4525-ba37-8f2129453998
b1fc3f48-76b8-4492-bf91-af20167e137e	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Nón Lưỡi Trai Kaki Trơn Phong Cách Hàn Quốc	https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80	Phụ Kiện Nữ	No Brand	Mũ lưỡi trai kaki basic unisex nam nữ đội đều đẹp, phom dáng cứng cáp ôm đầu thoải mái, điều chỉnh size dễ dàng.	75000	149	1	active	CAP-BLK-04	\N	f	[]	[]	100	\N	\N	\N	new	f	7	2026-06-29 04:38:06.931	2026-08-14 15:59:02.694	\N	\N	120000	f	0	\N	fdf7905e-c3bd-4fe7-b979-5f0c2acc4f8a
7039c315-059c-4cdb-b53d-24175ee21b11	d9be6bae-681d-4b47-8e4f-aa95eac1ce49	HLE GUMAYUSI FANMEETING SEOUL	https://res.cloudinary.com/dxkfusgxs/image/upload/v1786723668/vko8e4q8yqblfv2fsev7.jpg	Sức Khỏe & Sắc Đẹp	HLE	bé trai biết làm nũng	200000	10	0	active	\N	\N	f	[]	[]	1	10	8	0.1	new	f	2	2026-08-14 16:09:16.647	2026-08-14 16:09:16.647	["https://res.cloudinary.com/dxkfusgxs/image/upload/v1786723668/vko8e4q8yqblfv2fsev7.jpg"]	https://www.youtube.com/watch?v=69ZDBWoj5YM&list=RDl_uzEREOKfo&index=9	200000	f	0	\N	\N
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
8fea9596-440d-4e29-b037-bbde91e108b4	c01b68c8-330f-484a-b73d-1d65b194f189	n*****h	5	tuyệt	Mặc định	\N	2026-08-12 19:12:04.9	\N	\N
3fe20afa-d703-463c-b36d-31ff55007ae2	c01b68c8-330f-484a-b73d-1d65b194f189	n*****h	1	tệ	Mặc định	\N	2026-08-12 19:12:18.029	\N	\N
014b83c2-98f7-402d-813f-68cd6161f4ad	50809270-b63e-43ff-93b7-913411c073f8	n*****h	5	m, mczxz	Tiêu chuẩn	\N	2026-08-14 07:33:39.536	260629600135	["https://res.cloudinary.com/dxkfusgxs/image/upload/v1786692816/bsdpmbmrkzmjlorcqmme.jpg"]
ac1e3ba2-ff74-4e71-9bc5-fc71caa2a5d8	aac07fcf-9b55-4ce6-9b2f-2e3d34275e4f	n*****h	5	đẹp vừa vặn	Tiêu chuẩn	\N	2026-08-14 08:13:02.443	26081407384657547	["https://res.cloudinary.com/dxkfusgxs/image/upload/v1786695176/zvyjw0j4eivulsoaiamt.webp"]
86f2b09b-4f81-4b8e-aca9-d731aa8ca325	aac07fcf-9b55-4ce6-9b2f-2e3d34275e4f	n*****h	5	vnfngf	Tiêu chuẩn	\N	2026-08-14 08:29:09.753	26081408234506930	\N
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
-- Name: Conversation Conversation_pkey; Type: CONSTRAINT; Schema: chat; Owner: postgres
--

ALTER TABLE ONLY chat."Conversation"
    ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: chat; Owner: postgres
--

ALTER TABLE ONLY chat."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: Voucher Voucher_pkey; Type: CONSTRAINT; Schema: discount; Owner: postgres
--

ALTER TABLE ONLY discount."Voucher"
    ADD CONSTRAINT "Voucher_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: notification; Owner: postgres
--

ALTER TABLE ONLY notification."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


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
-- Name: Conversation_buyerId_idx; Type: INDEX; Schema: chat; Owner: postgres
--

CREATE INDEX "Conversation_buyerId_idx" ON chat."Conversation" USING btree ("buyerId");


--
-- Name: Conversation_buyerId_shopId_key; Type: INDEX; Schema: chat; Owner: postgres
--

CREATE UNIQUE INDEX "Conversation_buyerId_shopId_key" ON chat."Conversation" USING btree ("buyerId", "shopId");


--
-- Name: Conversation_shopId_idx; Type: INDEX; Schema: chat; Owner: postgres
--

CREATE INDEX "Conversation_shopId_idx" ON chat."Conversation" USING btree ("shopId");


--
-- Name: Message_conversationId_createdAt_idx; Type: INDEX; Schema: chat; Owner: postgres
--

CREATE INDEX "Message_conversationId_createdAt_idx" ON chat."Message" USING btree ("conversationId", "createdAt");


--
-- Name: Voucher_shopId_code_key; Type: INDEX; Schema: discount; Owner: postgres
--

CREATE UNIQUE INDEX "Voucher_shopId_code_key" ON discount."Voucher" USING btree ("shopId", code);


--
-- Name: Notification_userId_createdAt_idx; Type: INDEX; Schema: notification; Owner: postgres
--

CREATE INDEX "Notification_userId_createdAt_idx" ON notification."Notification" USING btree ("userId", "createdAt");


--
-- Name: Notification_userId_isRead_idx; Type: INDEX; Schema: notification; Owner: postgres
--

CREATE INDEX "Notification_userId_isRead_idx" ON notification."Notification" USING btree ("userId", "isRead");


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
-- Name: Message Message_conversationId_fkey; Type: FK CONSTRAINT; Schema: chat; Owner: postgres
--

ALTER TABLE ONLY chat."Message"
    ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES chat."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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

\unrestrict 3P8YhvMsxxbLFdDaMiJvI3U0M2hPIM2Px31jRay0Bjse6SvKNnrdbF736NnL462

