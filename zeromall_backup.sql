--
-- PostgreSQL database dump
--

\restrict jcORg1BAuSxN1AF42LjjFxMQBU0W2HKJcc04fjUTOFNxO0luKhVVAckxfkNiBLv

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
-- Name: chat; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA chat;


ALTER SCHEMA chat OWNER TO postgres;

--
-- Name: delivery; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA delivery;


ALTER SCHEMA delivery OWNER TO postgres;

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
-- Name: Claim; Type: TABLE; Schema: delivery; Owner: postgres
--

CREATE TABLE delivery."Claim" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "shipmentId" text NOT NULL,
    "sellerId" text NOT NULL,
    "buyerId" text,
    "claimType" text NOT NULL,
    description text NOT NULL,
    "requestedAmount" double precision DEFAULT 0 NOT NULL,
    status text DEFAULT 'OPEN'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "resolvedAt" timestamp(3) without time zone
);


ALTER TABLE delivery."Claim" OWNER TO postgres;

--
-- Name: ClaimEvidence; Type: TABLE; Schema: delivery; Owner: postgres
--

CREATE TABLE delivery."ClaimEvidence" (
    id text NOT NULL,
    "claimId" text NOT NULL,
    "fileUrl" text NOT NULL,
    "fileType" text DEFAULT 'IMAGE'::text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE delivery."ClaimEvidence" OWNER TO postgres;

--
-- Name: CodTransaction; Type: TABLE; Schema: delivery; Owner: postgres
--

CREATE TABLE delivery."CodTransaction" (
    id text NOT NULL,
    "shipmentId" text NOT NULL,
    "orderId" text NOT NULL,
    "sellerId" text NOT NULL,
    "codAmount" double precision DEFAULT 0 NOT NULL,
    "collectedAmount" double precision DEFAULT 0 NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "collectedAt" timestamp(3) without time zone,
    "settledAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE delivery."CodTransaction" OWNER TO postgres;

--
-- Name: DeliveryAssignment; Type: TABLE; Schema: delivery; Owner: postgres
--

CREATE TABLE delivery."DeliveryAssignment" (
    id text NOT NULL,
    "shipmentId" text NOT NULL,
    "driverId" text NOT NULL,
    type text DEFAULT 'PICKUP'::text NOT NULL,
    status text DEFAULT 'ASSIGNED'::text NOT NULL,
    note text,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone
);


ALTER TABLE delivery."DeliveryAssignment" OWNER TO postgres;

--
-- Name: DeliveryAttempt; Type: TABLE; Schema: delivery; Owner: postgres
--

CREATE TABLE delivery."DeliveryAttempt" (
    id text NOT NULL,
    "shipmentId" text NOT NULL,
    "driverId" text NOT NULL,
    "attemptNumber" integer DEFAULT 1 NOT NULL,
    status text DEFAULT 'FAILED'::text NOT NULL,
    "failureReason" text NOT NULL,
    note text,
    "proofImage" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE delivery."DeliveryAttempt" OWNER TO postgres;

--
-- Name: Driver; Type: TABLE; Schema: delivery; Owner: postgres
--

CREATE TABLE delivery."Driver" (
    id text NOT NULL,
    "userId" text,
    name text NOT NULL,
    phone text NOT NULL,
    "vehicleType" text DEFAULT 'MOTORBIKE'::text NOT NULL,
    "vehicleNumber" text NOT NULL,
    "hubId" text NOT NULL,
    status text DEFAULT 'AVAILABLE'::text NOT NULL,
    "currentLat" double precision,
    "currentLng" double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "operatingArea" text,
    "assignedDistrict" text,
    "assignedProvince" text
);


ALTER TABLE delivery."Driver" OWNER TO postgres;

--
-- Name: Hub; Type: TABLE; Schema: delivery; Owner: postgres
--

CREATE TABLE delivery."Hub" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    address text NOT NULL,
    province text NOT NULL,
    district text NOT NULL,
    ward text,
    latitude double precision,
    longitude double precision,
    type text DEFAULT 'ORIGIN_HUB'::text NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE delivery."Hub" OWNER TO postgres;

--
-- Name: HubScan; Type: TABLE; Schema: delivery; Owner: postgres
--

CREATE TABLE delivery."HubScan" (
    id text NOT NULL,
    "shipmentId" text NOT NULL,
    "hubId" text NOT NULL,
    "scanType" text NOT NULL,
    "staffId" text,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE delivery."HubScan" OWNER TO postgres;

--
-- Name: Package; Type: TABLE; Schema: delivery; Owner: postgres
--

CREATE TABLE delivery."Package" (
    id text NOT NULL,
    "shipmentId" text NOT NULL,
    weight double precision DEFAULT 0.5 NOT NULL,
    length double precision DEFAULT 15 NOT NULL,
    width double precision DEFAULT 10 NOT NULL,
    height double precision DEFAULT 10 NOT NULL,
    "packageType" text DEFAULT 'STANDARD'::text NOT NULL,
    "declaredValue" double precision DEFAULT 0 NOT NULL,
    fragile boolean DEFAULT false NOT NULL,
    liquid boolean DEFAULT false NOT NULL,
    "highValue" boolean DEFAULT false NOT NULL,
    "specialHandling" text,
    "itemsSummary" text
);


ALTER TABLE delivery."Package" OWNER TO postgres;

--
-- Name: Return; Type: TABLE; Schema: delivery; Owner: postgres
--

CREATE TABLE delivery."Return" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "shipmentId" text NOT NULL,
    "sellerId" text NOT NULL,
    "buyerId" text NOT NULL,
    reason text NOT NULL,
    type text DEFAULT 'DELIVERY_FAILED'::text NOT NULL,
    status text DEFAULT 'RETURNING'::text NOT NULL,
    "returnShippingFee" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone
);


ALTER TABLE delivery."Return" OWNER TO postgres;

--
-- Name: SellerAddress; Type: TABLE; Schema: delivery; Owner: postgres
--

CREATE TABLE delivery."SellerAddress" (
    id text NOT NULL,
    "sellerId" text NOT NULL,
    name text NOT NULL,
    "contactName" text NOT NULL,
    phone text NOT NULL,
    address text NOT NULL,
    province text NOT NULL,
    district text NOT NULL,
    ward text,
    latitude double precision,
    longitude double precision,
    "isDefault" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE delivery."SellerAddress" OWNER TO postgres;

--
-- Name: Settlement; Type: TABLE; Schema: delivery; Owner: postgres
--

CREATE TABLE delivery."Settlement" (
    id text NOT NULL,
    "sellerId" text NOT NULL,
    "periodStart" timestamp(3) without time zone NOT NULL,
    "periodEnd" timestamp(3) without time zone NOT NULL,
    "totalCod" double precision DEFAULT 0 NOT NULL,
    "shippingFee" double precision DEFAULT 0 NOT NULL,
    "platformFee" double precision DEFAULT 0 NOT NULL,
    refund double precision DEFAULT 0 NOT NULL,
    adjustment double precision DEFAULT 0 NOT NULL,
    "netAmount" double precision DEFAULT 0 NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "settledAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE delivery."Settlement" OWNER TO postgres;

--
-- Name: Shipment; Type: TABLE; Schema: delivery; Owner: postgres
--

CREATE TABLE delivery."Shipment" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "sellerId" text NOT NULL,
    "buyerId" text NOT NULL,
    "trackingNumber" text NOT NULL,
    "pickupAddressId" text,
    "deliveryAddress" text NOT NULL,
    "buyerName" text NOT NULL,
    "buyerPhone" text NOT NULL,
    "declaredValue" double precision DEFAULT 0 NOT NULL,
    "codAmount" double precision DEFAULT 0 NOT NULL,
    "shippingFee" double precision DEFAULT 0 NOT NULL,
    "carrierId" text DEFAULT 'SPX'::text NOT NULL,
    status text DEFAULT 'CREATED'::text NOT NULL,
    "currentHubId" text,
    "pickedUpAt" timestamp(3) without time zone,
    "deliveredAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE delivery."Shipment" OWNER TO postgres;

--
-- Name: ShipmentTracking; Type: TABLE; Schema: delivery; Owner: postgres
--

CREATE TABLE delivery."ShipmentTracking" (
    id text NOT NULL,
    "shipmentId" text NOT NULL,
    status text NOT NULL,
    "hubId" text,
    "driverId" text,
    latitude double precision,
    longitude double precision,
    title text NOT NULL,
    description text NOT NULL,
    location text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE delivery."ShipmentTracking" OWNER TO postgres;

--
-- Name: ShippingRate; Type: TABLE; Schema: delivery; Owner: postgres
--

CREATE TABLE delivery."ShippingRate" (
    id text NOT NULL,
    "serviceId" text DEFAULT 'STANDARD'::text NOT NULL,
    "originProvince" text NOT NULL,
    "destinationProvince" text NOT NULL,
    "weightFrom" double precision DEFAULT 0 NOT NULL,
    "weightTo" double precision DEFAULT 2 NOT NULL,
    "baseFee" double precision DEFAULT 25000 NOT NULL,
    "extraFeePerKg" double precision DEFAULT 5000 NOT NULL,
    "codFeePercent" double precision DEFAULT 0 NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE delivery."ShippingRate" OWNER TO postgres;

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
-- Name: CostPriceHistory; Type: TABLE; Schema: product; Owner: postgres
--

CREATE TABLE product."CostPriceHistory" (
    id text NOT NULL,
    "productId" text NOT NULL,
    "shopId" text NOT NULL,
    "costPrice" double precision NOT NULL,
    quantity integer NOT NULL,
    "invoiceCode" text,
    supplier text,
    note text,
    "importedBy" text NOT NULL,
    "importDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE product."CostPriceHistory" OWNER TO postgres;

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
-- Name: PriceHistory; Type: TABLE; Schema: product; Owner: postgres
--

CREATE TABLE product."PriceHistory" (
    id text NOT NULL,
    "productId" text NOT NULL,
    "shopId" text NOT NULL,
    "oldPrice" double precision NOT NULL,
    "newPrice" double precision NOT NULL,
    "changeType" text DEFAULT 'MANUAL'::text NOT NULL,
    "changedBy" text NOT NULL,
    "changedByRole" text DEFAULT 'SELLER'::text NOT NULL,
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE product."PriceHistory" OWNER TO postgres;

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
    "categoryId" text,
    "costPrice" double precision DEFAULT 0
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
b1273c68-dade-4f41-bfc4-bd160e3dd9a6	CUong shop	1f8cace7-86af-49ad-98f6-d6a68fb941e8	2026-08-21 02:54:25.998	2026-08-21 02:54:25.998	100	trong vài giờ	\N	\N	\N	\N	DRAFT	\N	\N
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
1f8cace7-86af-49ad-98f6-d6a68fb941e8	banhang1@zeromall.com	$2b$10$S1BQ6fUcq/a0oBNEHJNFTexhyIW46UhkS1OFiPCSX8BCNlThMuYHq	cuong shop	SHOP_OWNER	2026-08-21 02:54:25.994	2026-08-21 02:54:26.002	b1273c68-dade-4f41-bfc4-bd160e3dd9a6	\N	\N	\N	\N	ACTIVE
driver-user-01	shipper1@zeromall.com	$2b$10$j4c0HJNVZcYp2WIvAmXh/uoBT5nCVfmSMU3lK.h2PnNQYL2ECapJu	Nguyễn Văn Giao (Shipper 1)	DRIVER	2026-08-21 15:20:29.425	2026-08-21 15:20:29.425	\N	\N	\N	\N	0908123456	ACTIVE
driver-user-02	shipper2@zeromall.com	$2b$10$j4c0HJNVZcYp2WIvAmXh/uoBT5nCVfmSMU3lK.h2PnNQYL2ECapJu	Trần Đình Phát (Shipper 2)	DRIVER	2026-08-21 15:20:29.425	2026-08-21 15:20:29.425	\N	\N	\N	\N	0912345678	ACTIVE
driver-user-03	operator@zeromall.com	$2b$10$j4c0HJNVZcYp2WIvAmXh/uoBT5nCVfmSMU3lK.h2PnNQYL2ECapJu	Điều Phối Viên ZMX	LOGISTICS_OPERATOR	2026-08-21 15:20:29.425	2026-08-21 15:20:29.425	\N	\N	\N	\N	0987654321	ACTIVE
user-hub-hcm	hub_hcm@zeromall.com	$2b$10$j4c0HJNVZcYp2WIvAmXh/uoBT5nCVfmSMU3lK.h2PnNQYL2ECapJu	Trần Văn Kho (Tân Bình SOC)	HUB_OPERATOR	2026-08-23 11:19:24.932	2026-08-23 11:19:24.932	\N	\N	\N	\N	0901112233	ACTIVE
user-hub-dn	hub_bienhoa@zeromall.com	$2b$10$j4c0HJNVZcYp2WIvAmXh/uoBT5nCVfmSMU3lK.h2PnNQYL2ECapJu	Lê Thị Thu (Biên Hòa Hub)	HUB_OPERATOR	2026-08-23 11:19:24.932	2026-08-23 11:19:24.932	\N	\N	\N	\N	0902223344	ACTIVE
user-hub-hn	hub_melinh@zeromall.com	$2b$10$j4c0HJNVZcYp2WIvAmXh/uoBT5nCVfmSMU3lK.h2PnNQYL2ECapJu	Phạm Minh Bắc (Mê Linh SOC)	HUB_OPERATOR	2026-08-23 11:19:24.932	2026-08-23 11:19:24.932	\N	\N	\N	\N	0903334455	ACTIVE
\.


--
-- Data for Name: Conversation; Type: TABLE DATA; Schema: chat; Owner: postgres
--

COPY chat."Conversation" (id, "buyerId", "shopId", "lastMessage", "lastMessageAt", "unreadBuyerCount", "unreadShopCount", "createdAt", "updatedAt") FROM stdin;
9e933e84-a38b-4e5a-8ced-b8dad1b89cc8	e62d94af-244c-4d16-9e79-cb23e99f59c1	zeromall-official	Cuộc trò chuyện mới được khởi tạo 👋	2026-08-12 18:47:31.754	0	0	2026-08-12 18:47:31.754	2026-08-12 18:47:31.768
4d0898ba-c81f-46d3-a9f0-65428a713ce6	3150f691-6e58-47c7-ad4c-acbd52f027c5	zeromall-official	Cuộc trò chuyện mới được khởi tạo 👋	2026-08-12 18:44:33.108	0	0	2026-08-12 18:44:33.116	2026-08-12 19:21:41.204
c90b9590-6053-4fcd-a0ba-d2c65f5b2281	880a2880-43c0-4506-b25a-86dc34299f7b	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	Cuộc trò chuyện mới được khởi tạo 👋	2026-08-14 15:52:01.97	0	0	2026-08-14 15:52:01.971	2026-08-14 15:52:01.986
8bb0d8cc-1601-41a5-897a-84f35db1886f	f9e9a433-f8eb-4d3c-9b13-278358c4592c	zeromall-official	s	2026-08-16 02:56:47.141	0	1	2026-08-16 02:56:12.049	2026-08-16 02:56:47.141
ae01366f-1d90-41da-9d9e-37e0b525f0cd	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	d9be6bae-681d-4b47-8e4f-aa95eac1ce49	Cuộc trò chuyện mới được khởi tạo 👋	2026-08-16 11:16:05.483	0	0	2026-08-16 11:16:05.484	2026-08-16 11:37:55.659
47286368-549f-48bf-bf57-34b362927a9e	5c64ac2d-0123-43c0-86bf-b9495528c27d	zeromall-official	Cuộc trò chuyện mới được khởi tạo 👋	2026-08-14 07:35:05.781	0	0	2026-08-14 07:35:05.783	2026-08-16 12:42:25.466
30a0a116-9c82-43da-8102-28aafa958692	880a2880-43c0-4506-b25a-86dc34299f7b	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Cuộc trò chuyện mới được khởi tạo 👋	2026-08-14 15:43:56.303	0	0	2026-08-14 15:43:56.305	2026-08-16 12:42:43.814
a5fdb195-5e64-4fa7-b059-f2a67b730546	3150f691-6e58-47c7-ad4c-acbd52f027c5	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	kfkremvg	2026-08-14 15:41:02.827	0	0	2026-08-12 19:06:35.006	2026-08-16 12:42:44.482
c5b0cf91-7931-4f5b-b6d9-00d89b4c151c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	hi	2026-08-16 11:45:45.668	0	0	2026-08-16 11:15:38.791	2026-08-23 12:33:08.366
b41b364a-9815-4419-8baf-8cb5a2db285a	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	1	2026-08-16 11:42:49.006	0	2	2026-08-16 11:12:40.036	2026-08-16 11:42:49.007
731e5ff5-c53f-41f2-a8a9-b7b1e702dc27	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	zeromall-official	1	2026-08-16 11:42:50.794	0	3	2026-08-16 01:52:05.596	2026-08-16 11:42:50.794
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: chat; Owner: postgres
--

COPY chat."Message" (id, "conversationId", "senderId", "senderType", type, content, metadata, "isRead", "createdAt") FROM stdin;
675116f7-dd6c-4af1-a980-43c3fa67a3f5	a5fdb195-5e64-4fa7-b059-f2a67b730546	3150f691-6e58-47c7-ad4c-acbd52f027c5	BUYER	TEXT	hjvfhdnj	null	t	2026-08-14 07:34:38.254
db6636fc-619d-41df-b3a9-9abce87ddfec	a5fdb195-5e64-4fa7-b059-f2a67b730546	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	SHOP	TEXT	hello	null	t	2026-08-14 07:35:13.422
0b7e6df0-c06f-4f66-bd9b-35f8610680a8	731e5ff5-c53f-41f2-a8a9-b7b1e702dc27	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	BUYER	TEXT	xin chào	null	f	2026-08-16 01:52:12.945
606bc793-b4ac-4114-9f5a-e5fb7c64dc86	8bb0d8cc-1601-41a5-897a-84f35db1886f	f9e9a433-f8eb-4d3c-9b13-278358c4592c	BUYER	TEXT	s	null	f	2026-08-16 02:56:47.138
50b5331c-539a-43a2-b69b-f7e87c788ae5	731e5ff5-c53f-41f2-a8a9-b7b1e702dc27	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	BUYER	TEXT	xin chào	null	f	2026-08-16 02:57:48.133
8700bd28-013f-4745-ab9c-f298c7f919de	b41b364a-9815-4419-8baf-8cb5a2db285a	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	BUYER	TEXT	hi shop	null	f	2026-08-16 11:12:43.622
e4430df0-487e-4013-ba17-062e8d80ea27	b41b364a-9815-4419-8baf-8cb5a2db285a	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	BUYER	TEXT	1	null	f	2026-08-16 11:42:49.004
a7df4c03-6cb7-4750-b4ce-dbef860e4193	731e5ff5-c53f-41f2-a8a9-b7b1e702dc27	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	BUYER	TEXT	1	null	f	2026-08-16 11:42:50.792
d49978dd-ee39-4640-88c8-8cb3980df2a9	c5b0cf91-7931-4f5b-b6d9-00d89b4c151c	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	SHOP	TEXT	Chào bạn, shop có thể giúp gì cho bạn ạ?	null	t	2026-08-16 11:44:26.11
fc2f9433-cda8-488b-9de9-36c06fa85038	c5b0cf91-7931-4f5b-b6d9-00d89b4c151c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	BUYER	TEXT	hi	null	t	2026-08-16 11:38:57.363
40bc7dfc-c388-4dbe-a560-8b9964c42ff9	c5b0cf91-7931-4f5b-b6d9-00d89b4c151c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	BUYER	TEXT	hi	null	t	2026-08-16 11:42:14.769
a2ab584d-d7f6-4f09-8491-570e619403be	c5b0cf91-7931-4f5b-b6d9-00d89b4c151c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	BUYER	TEXT	hi	null	t	2026-08-16 11:45:45.651
9d24e630-b5fb-4ca0-93fb-1b750d1b2e71	c5b0cf91-7931-4f5b-b6d9-00d89b4c151c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	BUYER	TEXT	hi	null	t	2026-08-16 11:45:45.666
9ccef9a2-67e5-4148-8317-ca6feeaae31e	a5fdb195-5e64-4fa7-b059-f2a67b730546	3150f691-6e58-47c7-ad4c-acbd52f027c5	BUYER	TEXT	vfdnu	null	t	2026-08-14 08:30:52.472
86ef0ffd-f5c2-4b03-920d-c90a36074927	a5fdb195-5e64-4fa7-b059-f2a67b730546	3150f691-6e58-47c7-ad4c-acbd52f027c5	BUYER	TEXT	\\gfdf	null	t	2026-08-14 08:30:54.068
8b72583e-6570-4b47-be66-f01034f40002	a5fdb195-5e64-4fa7-b059-f2a67b730546	3150f691-6e58-47c7-ad4c-acbd52f027c5	BUYER	TEXT	kfkremvg	null	t	2026-08-14 15:41:02.822
\.


--
-- Data for Name: Claim; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."Claim" (id, "orderId", "shipmentId", "sellerId", "buyerId", "claimType", description, "requestedAmount", status, "createdAt", "resolvedAt") FROM stdin;
\.


--
-- Data for Name: ClaimEvidence; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."ClaimEvidence" (id, "claimId", "fileUrl", "fileType", description, "createdAt") FROM stdin;
\.


--
-- Data for Name: CodTransaction; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."CodTransaction" (id, "shipmentId", "orderId", "sellerId", "codAmount", "collectedAmount", status, "collectedAt", "settledAt", "createdAt") FROM stdin;
9ffe8c71-b6f8-4581-9088-2b4546470e00	3f223856-b214-4732-9cf3-b9256ed74e85	TEST-SPX-001	seller-test-01	350000	350000	COLLECTED	2026-08-21 15:05:05.688	\N	2026-08-21 15:04:30.39
03d11896-dced-4ba6-9c1d-554efd92e112	67247e2c-ca42-4f28-8393-c1cf59fd01f5	260629591100	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	450000	0	PENDING	\N	\N	2026-06-29 05:59:11.677
5caf7496-8355-47a8-a93d-5b61184b821b	455b88b8-ed1b-4c68-a3d9-ad1186e6d911	260717060402	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	4700	4700	COLLECTED	\N	\N	2026-07-17 06:04:02.428
b653784a-08d3-4e83-906e-dfc045ffe501	9f7c1701-38e8-4724-aa28-60b974b97cf6	260630113938	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	487700	487700	COLLECTED	\N	\N	2026-06-30 11:39:38.796
70567ae0-164d-46c2-ae7d-a1ad8e40d50f	686f6a7d-702d-454e-a648-cc198efff031	26081219054531939	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	450000	450000	COLLECTED	\N	\N	2026-08-12 19:05:45.329
7a7c7f26-6448-40a8-8472-e51b6758b034	3ce0a0fc-f266-4161-9f63-044b795e5d44	26081219201633973	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	18500	18500	COLLECTED	\N	\N	2026-08-12 19:20:16.354
a4d99035-d032-4aa7-8949-922573510c64	edd8f689-0329-48d6-906c-f0b7349d3b9e	26081218460363381	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	2000	2000	COLLECTED	\N	\N	2026-08-12 18:46:03.711
003b4d31-0825-440c-874d-61785c9a26f6	bcb26c4f-4551-49db-bb0a-4c6f632f2e6f	260717060031	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	4700	4700	COLLECTED	\N	\N	2026-07-17 06:00:31.751
00d90781-328a-4bbd-875c-9a8a4b551c84	3a348910-2a6f-4d0c-a7e3-dd611bbf193f	260629600135	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	487700	487700	COLLECTED	\N	\N	2026-06-29 06:00:13.561
90bf1cac-9b66-4b8a-9d22-a379dd91e39f	2a2bace0-c5d1-4463-9f79-45054ec59b87	26081408390084529	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	286500	286500	COLLECTED	\N	\N	2026-08-14 08:39:00.856
526387f2-0df3-460e-a9b0-468ccd49bc69	555a421f-3db0-40e5-aca5-8ca4e6c29092	26081415522442674	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	256500	0	PENDING	\N	\N	2026-08-14 15:52:24.44
74db7312-3224-416f-a721-f24f3e6bcc19	b3dbe83e-d8ff-4c73-9e8f-5bc4dcf7305e	26081602571961548	d9be6bae-681d-4b47-8e4f-aa95eac1ce49	237700	0	PENDING	\N	\N	2026-08-16 02:57:19.664
c260b278-32ce-4b2c-88ea-90d35d6ec19e	8e1c93a2-e180-4ef7-9be0-5c36e7fa3dd3	26082311485056556	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	0	0	NOT_APPLICABLE	\N	\N	2026-08-23 11:49:23.906
\.


--
-- Data for Name: DeliveryAssignment; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."DeliveryAssignment" (id, "shipmentId", "driverId", type, status, note, "assignedAt", "completedAt") FROM stdin;
51533878-ff73-46cb-84e9-f6ed5c148d97	5469cdb7-8233-4ed3-999f-f01060e8b288	driver-01	DELIVERY	ASSIGNED	\N	2026-08-21 15:49:20.578	\N
6efd029e-a6e7-4656-b4c3-12a8c9a2a1e6	686f6a7d-702d-454e-a648-cc198efff031	driver-01	DELIVERY	ASSIGNED	\N	2026-08-21 15:49:20.578	\N
92185025-ef72-4452-a09b-465fa0a70cfc	c7061a81-17bf-4560-8e1c-faab69f42942	driver-02	PICKUP	ASSIGNED	\N	2026-08-21 15:56:46.179	\N
64cdb1e6-26a3-4797-8b5f-65305f579b5b	95d0d3b7-3825-464f-9cb4-a3923a233df5	driver-02	PICKUP	IN_PROGRESS	\N	2026-08-21 15:56:46.179	\N
a7a736a3-94f5-4dbf-9843-bdc321aaf9d7	5f103e88-7d37-4a3b-bbb2-4f187461a9fd	driver-02	DELIVERY	ASSIGNED	\N	2026-08-23 11:04:45.289	\N
50e4572e-a52c-4e1e-80c2-4fc5d53ef43e	56a0ba85-7207-45ff-924a-38504685b7f8	driver-02	PICKUP	IN_PROGRESS	\N	2026-08-21 15:56:46.179	\N
b6e8dd94-9764-477d-bd98-f5b86198b8ee	3f223856-b214-4732-9cf3-b9256ed74e85	driver-01	DELIVERY	CANCELLED	Tài xế từ chối nhận cuốc	2026-08-21 15:49:20.578	\N
4f39a740-60fa-43ca-a8e0-e195124f12be	a1a5c840-4da4-4568-8ba0-c191a4f0da0a	driver-02	PICKUP	ASSIGNED	\N	2026-08-23 11:04:45.289	\N
eacfd8b8-cf11-4727-96a1-d5f45cd438ad	67247e2c-ca42-4f28-8393-c1cf59fd01f5	driver-01	PICKUP	ASSIGNED	\N	2026-08-23 12:01:51.268	\N
a8a507f5-a850-4983-8f86-16aae9e54527	8e1c93a2-e180-4ef7-9be0-5c36e7fa3dd3	driver-02	PICKUP	ASSIGNED	\N	2026-08-23 12:06:00.673	\N
\.


--
-- Data for Name: DeliveryAttempt; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."DeliveryAttempt" (id, "shipmentId", "driverId", "attemptNumber", status, "failureReason", note, "proofImage", "createdAt") FROM stdin;
\.


--
-- Data for Name: Driver; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."Driver" (id, "userId", name, phone, "vehicleType", "vehicleNumber", "hubId", status, "currentLat", "currentLng", "createdAt", "updatedAt", "operatingArea", "assignedDistrict", "assignedProvince") FROM stdin;
driver-03	driver-user-03	Lê Hữu Tải (ZMX Van)	0987654321	VAN	51D-999.88	hub-hn-01	AVAILABLE	\N	\N	2026-08-21 15:00:36.447	2026-08-21 15:00:36.447	Huyện Mê Linh, Quận Cầu Giấy, Hà Nội	Mê Linh	Hà Nội
driver-02	driver-user-02	Trần Đình Phát (SPX 02)	0912345678	MOTORBIKE	60-F2 888.99	hub-dn-01	BUSY	\N	\N	2026-08-21 15:00:36.447	2026-08-23 11:05:56.988	Thành phố Biên Hòa, Tân Phong, Tam Hiệp	Biên Hòa	Đồng Nai
driver-01	driver-user-01	Nguyễn Văn Giao (SPX 01)	0908123456	MOTORBIKE	59-A1 123.45	hub-hcm-01	AVAILABLE	\N	\N	2026-08-21 15:00:36.447	2026-08-23 11:29:00.37	Quận Tân Bình, Quận 10, Quận Phú Nhuận	Tân Bình	Hồ Chí Minh
\.


--
-- Data for Name: Hub; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."Hub" (id, code, name, address, province, district, ward, latitude, longitude, type, status, "createdAt", "updatedAt") FROM stdin;
hub-hcm-01	HCM01	Kho Tổng Tân Bình SOC	123 Trường Chinh, P. 15	Hồ Chí Minh	Quận Tân Bình	\N	\N	\N	SORTING_CENTER	ACTIVE	2026-08-21 15:00:36.447	2026-08-21 15:00:36.447
hub-dn-01	DN01	Bưu Cục Giao Hàng Biên Hòa Hub	45 Phạm Văn Thuận, Tân Phong	Đồng Nai	TP. Biên Hòa	\N	\N	\N	DESTINATION_HUB	ACTIVE	2026-08-21 15:00:36.447	2026-08-21 15:00:36.447
hub-hn-01	HN01	Kho Trung Chuyển Mê Linh SOC	Khu Công Nghiệp Quang Minh	Hà Nội	Huyện Mê Linh	\N	\N	\N	SORTING_CENTER	ACTIVE	2026-08-21 15:00:36.447	2026-08-21 15:00:36.447
\.


--
-- Data for Name: HubScan; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."HubScan" (id, "shipmentId", "hubId", "scanType", "staffId", note, "createdAt") FROM stdin;
020180b2-2177-43d3-964a-05a4e798ec76	95d0d3b7-3825-464f-9cb4-a3923a233df5	hub-hcm-01	AT_ORIGIN_HUB	\N	\N	2026-08-21 16:07:03.973
\.


--
-- Data for Name: Package; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."Package" (id, "shipmentId", weight, length, width, height, "packageType", "declaredValue", fragile, liquid, "highValue", "specialHandling", "itemsSummary") FROM stdin;
7cb1c6db-470f-42cf-bcab-411e0bf04c24	3f223856-b214-4732-9cf3-b9256ed74e85	0.5	15	10	10	STANDARD	350000	f	f	f	\N	Áo Thun Polo Cao Cấp x2
3bfc45ca-6741-45eb-8156-1d8fe55a093c	17091b7c-bb40-40dc-8e87-7397c0073e74	0.5	15	10	10	STANDARD	457700	f	f	f	\N	Kệ Đồ Nhà Bếp Thông Minh Sơn Tĩnh Điện 3 Tầng
7d23ceee-ab07-4faf-847b-a47d41e6383e	67247e2c-ca42-4f28-8393-c1cf59fd01f5	0.5	15	10	10	STANDARD	450000	f	f	f	\N	Kệ Đồ Nhà Bếp Thông Minh Sơn Tĩnh Điện 3 Tầng
a5d62f9f-e05d-4144-a593-b932e22ebf41	f9fc945f-ee73-40df-a1bf-41bc76bc522b	0.5	15	10	10	STANDARD	617700	f	f	f	\N	Bộ Bát Đĩa Sứ Tráng Men Xanh Cổ Điển Sang Trọng
0ebce740-750c-44a0-8880-b827baf254f4	aff4ed4a-5d1d-4d28-91d7-30dd4c395409	0.5	15	10	10	STANDARD	487700	f	f	f	\N	Giày Sneaker Nam Nữ Thể Thao Da Mềm Cao Cấp
f9770836-efb9-462f-843d-6d6189baf688	c7061a81-17bf-4560-8e1c-faab69f42942	0.5	15	10	10	STANDARD	487700	f	f	f	\N	Giày Sneaker Nam Nữ Thể Thao Da Mềm Cao Cấp
842ccd5c-958d-4c41-96b9-a7a652ecdc8e	56a0ba85-7207-45ff-924a-38504685b7f8	0.5	15	10	10	STANDARD	39700	f	f	f	\N	cuong
0d7b8758-1d1e-4ea6-8cdd-337bf8d5e981	95d0d3b7-3825-464f-9cb4-a3923a233df5	0.5	15	10	10	STANDARD	4700	f	f	f	\N	cuong
ad51862c-5e19-421c-b3ca-060531c18a2b	2c8263db-829e-4668-a686-587b92094626	0.5	15	10	10	STANDARD	4700	f	f	f	\N	cuong
95b20b9d-6ad0-4813-be59-f04619958a47	0dbda82e-4218-4519-9f70-3f72a131db4d	0.5	15	10	10	STANDARD	4700	f	f	f	\N	cuong
68c07af0-c869-4ac0-b81e-73b1a19022f3	455b88b8-ed1b-4c68-a3d9-ad1186e6d911	0.5	15	10	10	STANDARD	4700	f	f	f	\N	cuong
fab0d8a5-0d46-4bc5-9677-d85a4120da8d	a9b157d2-b499-48f8-9630-711b52f731c7	0.5	15	10	10	STANDARD	4700	f	f	f	\N	cuong
1ca288c1-3666-456b-af98-291a4794cb70	9f7c1701-38e8-4724-aa28-60b974b97cf6	0.5	15	10	10	STANDARD	487700	f	f	f	\N	Giày Sneaker Nam Nữ Thể Thao Da Mềm Cao Cấp
688eb8e6-d7ab-4358-82eb-5a7917ae04c9	686f6a7d-702d-454e-a648-cc198efff031	0.5	15	10	10	STANDARD	450000	f	f	f	\N	Giày Sneaker Nam Nữ Thể Thao Da Mềm Cao Cấp
66d8adbe-d920-443a-9141-a7a226226a2e	6963ca7b-efef-4c35-a1f7-a96ef7252d4b	0.5	15	10	10	STANDARD	250000	f	f	f	\N	Áo Khoác Bomber Unisex Cực Ngầu Nỉ Ngoại Dày Dặn
7dd43b6a-40eb-4164-97a8-8fd9b9bacb77	3ce0a0fc-f266-4161-9f63-044b795e5d44	0.5	15	10	10	STANDARD	18500	f	f	f	\N	cuong
683b07af-1b3f-4499-a0a3-b543af2113a1	edd8f689-0329-48d6-906c-f0b7349d3b9e	0.5	15	10	10	STANDARD	2000	f	f	f	\N	cuong
bdfb996a-2ceb-488b-9345-6b0e83ab2535	bcb26c4f-4551-49db-bb0a-4c6f632f2e6f	0.5	15	10	10	STANDARD	4700	f	f	f	\N	cuong
533189e2-0463-4926-ae7d-77ac9bac92a7	3a348910-2a6f-4d0c-a7e3-dd611bbf193f	0.5	15	10	10	STANDARD	487700	f	f	f	\N	Giày Sneaker Nam Nữ Thể Thao Da Mềm Cao Cấp
2b033923-4b17-4dba-80c9-55f2b6b391bf	5469cdb7-8233-4ed3-999f-f01060e8b288	0.5	15	10	10	STANDARD	241500	f	f	f	\N	Áo Khoác Bomber Unisex Cực Ngầu Nỉ Ngoại Dày Dặn
a43a9b2d-b6f0-49ec-b595-00c315c5b21d	7a789292-f96b-4683-b460-5aadfd80b713	0.5	15	10	10	STANDARD	216500	f	f	f	\N	Áo Khoác Bomber Unisex Cực Ngầu Nỉ Ngoại Dày Dặn
34701f24-7984-401b-9641-b533c52cf27e	2a2bace0-c5d1-4463-9f79-45054ec59b87	0.5	15	10	10	STANDARD	286500	f	f	f	\N	Váy Tay Bồng Dáng Xòe Công Chúa Cực Xinh
87323395-926a-4ffb-bae6-28317104fe5e	1f3f1d51-d488-4724-9b8b-2c8b106f58ff	0.5	15	10	10	STANDARD	2000	f	f	f	\N	cuong
bea560aa-7c54-4825-a414-fc6e8c121681	555a421f-3db0-40e5-aca5-8ca4e6c29092	0.5	15	10	10	STANDARD	256500	f	f	f	\N	Máy Xay Sinh Tố Cầm Tay Sạc Pin Mini Không Dây
d0bd522d-1497-447a-bdac-39cf9678a61f	eb726f71-1af4-412a-8bab-fc1637c2e001	0.5	15	10	10	STANDARD	91500	f	f	f	\N	Nón Lưỡi Trai Kaki Trơn Phong Cách Hàn Quốc
fe25264f-0dd9-4573-bb91-a2179498bca1	b3dbe83e-d8ff-4c73-9e8f-5bc4dcf7305e	0.5	15	10	10	STANDARD	237700	f	f	f	\N	HLE GUMAYUSI FANMEETING SEOUL
cd3fedce-2a76-487d-8f72-98a84f86906e	a1a5c840-4da4-4568-8ba0-c191a4f0da0a	0.5	15	10	10	STANDARD	39700	f	f	f	\N	cuong
da9865e4-16dd-42e1-b005-9f634c613e0a	5f103e88-7d37-4a3b-bbb2-4f187461a9fd	0.5	15	10	10	STANDARD	39700	f	f	f	\N	cuong
10d8486f-fa9f-4afc-8e64-6661134f5691	8e1c93a2-e180-4ef7-9be0-5c36e7fa3dd3	0.5	15	10	10	STANDARD	215500	f	f	f	\N	Balo Thời Trang Học Sinh Sinh Viên Chống Nước x1
\.


--
-- Data for Name: Return; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."Return" (id, "orderId", "shipmentId", "sellerId", "buyerId", reason, type, status, "returnShippingFee", "createdAt", "completedAt") FROM stdin;
\.


--
-- Data for Name: SellerAddress; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."SellerAddress" (id, "sellerId", name, "contactName", phone, address, province, district, ward, latitude, longitude, "isDefault", "createdAt", "updatedAt") FROM stdin;
addr-shop-fashion	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Kho Thời Trang Biên Hòa	Chủ Shop Fashion	0964579675	2D-6 Đường Trần Công An, Phường Tân Phong, Thành Phố Biên Hòa, Tỉnh Đồng Nai	Đồng Nai	Biên Hòa	Tân Phong	\N	\N	t	2026-08-23 11:53:29.785	2026-08-23 11:53:29.785
addr-shop-home	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	Kho Gia Dụng Phú Nhuận	Chủ Shop Gia Dụng	0912345678	Quán Anh Đạt, 34 Hẻm 30 Đoàn Thị Điểm, Phường 1, Quận Phú Nhuận, Thành Phố Hồ Chí Minh	Hồ Chí Minh	Phú Nhuận	Phường 1	\N	\N	t	2026-08-23 11:53:29.785	2026-08-23 11:53:29.785
\.


--
-- Data for Name: Settlement; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."Settlement" (id, "sellerId", "periodStart", "periodEnd", "totalCod", "shippingFee", "platformFee", refund, adjustment, "netAmount", status, "settledAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Shipment; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."Shipment" (id, "orderId", "sellerId", "buyerId", "trackingNumber", "pickupAddressId", "deliveryAddress", "buyerName", "buyerPhone", "declaredValue", "codAmount", "shippingFee", "carrierId", status, "currentHubId", "pickedUpAt", "deliveredAt", "createdAt", "updatedAt") FROM stdin;
17091b7c-bb40-40dc-8e87-7397c0073e74	260620102938	0a2c2409-6fcc-4582-9b98-e622e37c6774	e9cd2310-7eb9-4ce5-ba8e-7e9e1f815d2d	ZMX2606204751	\N	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	457700	0	25000	ZMX	WAITING_PICKUP	hub-hcm-01	\N	\N	2026-06-20 12:03:02.146	2026-06-20 12:03:02.146
3f223856-b214-4732-9cf3-b9256ed74e85	TEST-SPX-001	seller-test-01	buyer-test-01	ZMX2608217824	\N	Số 120 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh	Trần Thị Lan	0988776655	350000	350000	25000	ZMX	AT_DESTINATION_HUB	hub-hcm-01	\N	2026-08-21 15:05:05.684	2026-08-21 15:04:30.39	2026-08-23 11:29:00.373
5469cdb7-8233-4ed3-999f-f01060e8b288	26081408234506930	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	3150f691-6e58-47c7-ad4c-acbd52f027c5	ZMX2608142751	addr-shop-fashion	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	minhanh	0344461922	241500	0	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-08-14 08:23:45.082	2026-08-14 08:23:45.082
67247e2c-ca42-4f28-8393-c1cf59fd01f5	260629591100	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	3150f691-6e58-47c7-ad4c-acbd52f027c5	ZMX2606291588	addr-shop-home	Đường không tên, Phú Lâm, An Giang, Phú Lâm, Phú Tân, An Giang	Quang Hiệp	(+84) 964 579 875	450000	450000	25000	ZMX	WAITING_PICKUP	hub-hcm-01	\N	\N	2026-06-29 05:59:11.677	2026-06-29 05:59:11.677
c7061a81-17bf-4560-8e1c-faab69f42942	260717053934	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2607176584	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	487700	0	25000	ZMX	CREATED	hub-hcm-01	\N	\N	2026-07-17 05:39:34.039	2026-07-17 05:39:34.039
2c8263db-829e-4668-a686-587b92094626	260719011826	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2607197067	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	4700	0	25000	ZMX	CREATED	hub-hcm-01	\N	\N	2026-07-19 01:18:26.99	2026-07-19 01:18:26.99
0dbda82e-4218-4519-9f70-3f72a131db4d	260717060418	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2607172323	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	4700	0	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-07-17 06:04:18.517	2026-07-17 06:04:18.517
455b88b8-ed1b-4c68-a3d9-ad1186e6d911	260717060402	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2607172269	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	4700	4700	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-07-17 06:04:02.428	2026-07-17 06:04:02.428
f9fc945f-ee73-40df-a1bf-41bc76bc522b	260629060925	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	3150f691-6e58-47c7-ad4c-acbd52f027c5	ZMX2606298706	addr-shop-home	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	617700	0	25000	ZMX	CREATED	hub-hcm-01	\N	\N	2026-06-29 06:09:25.89	2026-06-29 06:09:25.89
b3dbe83e-d8ff-4c73-9e8f-5bc4dcf7305e	26081602571961548	d9be6bae-681d-4b47-8e4f-aa95eac1ce49	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2608167312	\N	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	237700	237700	25000	ZMX	WAITING_PICKUP	hub-hcm-01	\N	\N	2026-08-16 02:57:19.664	2026-08-16 02:57:19.664
a9b157d2-b499-48f8-9630-711b52f731c7	260717060050	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2607172059	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	4700	0	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-07-17 06:00:50.241	2026-07-17 06:00:50.241
9f7c1701-38e8-4724-aa28-60b974b97cf6	260630113938	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2606304262	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	487700	487700	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-06-30 11:39:38.796	2026-06-30 11:39:38.796
aff4ed4a-5d1d-4d28-91d7-30dd4c395409	260629061107	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	3150f691-6e58-47c7-ad4c-acbd52f027c5	ZMX2606298304	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	487700	0	25000	ZMX	OUT_FOR_DELIVERY	hub-hcm-01	\N	\N	2026-06-29 06:11:07.962	2026-08-21 15:52:04.78
95d0d3b7-3825-464f-9cb4-a3923a233df5	260717055720	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2607175882	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	4700	0	25000	ZMX	AT_ORIGIN_HUB	hub-hcm-01	2026-08-21 16:03:20.73	\N	2026-07-17 05:57:20.525	2026-08-21 16:07:03.964
56a0ba85-7207-45ff-924a-38504685b7f8	260717055639	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2607178865	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	39700	0	25000	ZMX	PICKED_UP	hub-hcm-01	2026-08-23 11:06:03.742	\N	2026-07-17 05:56:39.131	2026-08-23 11:06:03.748
686f6a7d-702d-454e-a648-cc198efff031	26081219054531939	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	3150f691-6e58-47c7-ad4c-acbd52f027c5	ZMX2608128386	addr-shop-fashion	151 Nguyễn Kim, Phường 7, Quận 10, Hồ Chí Minh, Phường 7, Quận 10, Hồ Chí Minh	minhanh	0344461922	450000	450000	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-08-12 19:05:45.329	2026-08-12 19:05:45.329
6963ca7b-efef-4c35-a1f7-a96ef7252d4b	26081219040078621	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	3150f691-6e58-47c7-ad4c-acbd52f027c5	ZMX2608125741	addr-shop-fashion	151 Nguyễn Kim, Phường 7, Quận 10, Hồ Chí Minh, Phường 7, Quận 10, Hồ Chí Minh	minhanh	0344461922	250000	0	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-08-12 19:04:00.797	2026-08-12 19:04:00.797
3ce0a0fc-f266-4161-9f63-044b795e5d44	26081219201633973	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	3150f691-6e58-47c7-ad4c-acbd52f027c5	ZMX2608122053	addr-shop-fashion	151 Nguyễn Kim, Phường 7, Quận 10, Hồ Chí Minh, Phường 7, Quận 10, Hồ Chí Minh	minhanh	0344461922	18500	18500	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-08-12 19:20:16.354	2026-08-12 19:20:16.354
edd8f689-0329-48d6-906c-f0b7349d3b9e	26081218460363381	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	3150f691-6e58-47c7-ad4c-acbd52f027c5	ZMX2608128411	addr-shop-fashion	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	minhanh	0344461922	2000	2000	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-08-12 18:46:03.711	2026-08-12 18:46:03.711
bcb26c4f-4551-49db-bb0a-4c6f632f2e6f	260717060031	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2607174341	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	4700	4700	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-07-17 06:00:31.751	2026-07-17 06:00:31.751
3a348910-2a6f-4d0c-a7e3-dd611bbf193f	260629600135	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	3150f691-6e58-47c7-ad4c-acbd52f027c5	ZMX2606299259	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	487700	487700	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-06-29 06:00:13.561	2026-06-29 06:00:13.561
7a789292-f96b-4683-b460-5aadfd80b713	26081407384657547	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	3150f691-6e58-47c7-ad4c-acbd52f027c5	ZMX2608147050	addr-shop-fashion	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	minhanh	0344461922	216500	0	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-08-14 07:38:46.666	2026-08-14 07:38:46.666
2a2bace0-c5d1-4463-9f79-45054ec59b87	26081408390084529	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	3150f691-6e58-47c7-ad4c-acbd52f027c5	ZMX2608148679	addr-shop-fashion	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	minhanh	0344461922	286500	286500	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-08-14 08:39:00.856	2026-08-14 08:39:00.856
1f3f1d51-d488-4724-9b8b-2c8b106f58ff	26081415440545296	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	880a2880-43c0-4506-b25a-86dc34299f7b	ZMX2608142083	addr-shop-fashion	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	minhanh	0344461922	2000	0	25000	ZMX	CREATED	hub-hcm-01	\N	\N	2026-08-14 15:44:05.515	2026-08-14 15:44:05.515
eb726f71-1af4-412a-8bab-fc1637c2e001	26081415590264558	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	880a2880-43c0-4506-b25a-86dc34299f7b	ZMX2608142776	addr-shop-fashion	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	minhanh	0344461922	91500	0	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-08-14 15:59:02.658	2026-08-14 15:59:02.658
a1a5c840-4da4-4568-8ba0-c191a4f0da0a	26081613042232789	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2608161782	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	39700	0	25000	ZMX	WAITING_PICKUP	hub-hcm-01	\N	\N	2026-08-16 13:04:22.343	2026-08-16 13:04:22.343
5f103e88-7d37-4a3b-bbb2-4f187461a9fd	26081613051819386	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2608162333	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	39700	0	25000	ZMX	OUT_FOR_DELIVERY	hub-hcm-01	\N	\N	2026-08-16 13:05:18.217	2026-08-16 13:05:18.217
555a421f-3db0-40e5-aca5-8ca4e6c29092	26081415522442674	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	880a2880-43c0-4506-b25a-86dc34299f7b	ZMX2608148644	addr-shop-home	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	minhanh	0344461922	256500	256500	25000	ZMX	WAITING_PICKUP	hub-hcm-01	\N	\N	2026-08-14 15:52:24.44	2026-08-14 15:52:24.44
8e1c93a2-e180-4ef7-9be0-5c36e7fa3dd3	26082311485056556	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2608236199	addr-shop-fashion	3D Lê Lợi, Phường 4, Gò Vấp, Thành phố Hồ Chí Minh	Minh Anh	0964579675	215500	0	25000	ZMX	PICKUP_ASSIGNED	hub-hcm-01	\N	\N	2026-08-23 11:49:23.906	2026-08-23 11:49:23.906
\.


--
-- Data for Name: ShipmentTracking; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."ShipmentTracking" (id, "shipmentId", status, "hubId", "driverId", latitude, longitude, title, description, location, "timestamp") FROM stdin;
ebac4663-d172-4327-9e07-870887eddf2e	3f223856-b214-4732-9cf3-b9256ed74e85	CREATED	\N	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608217824 được khởi tạo thành công. Hệ thống Shopee Express (ZMX) đang chờ phân công tài xế lấy hàng.	Kênh Người Bán ZeroMall	2026-08-21 15:04:30.39
26a6b2d5-bdeb-4718-97ec-47759ee91073	3f223856-b214-4732-9cf3-b9256ed74e85	PICKUP_ASSIGNED	\N	driver-01	\N	\N	Đã điều phối tài xế lấy hàng	Tài xế Nguyễn Văn Giao (ZMX 01) (0908123456 - 59-A1 123.45) đang trên đường đến địa chỉ người bán để lấy kiện hàng.	59-A1 123.45	2026-08-21 15:05:01.446
dd390266-af4a-439b-b1f4-a43141694f33	3f223856-b214-4732-9cf3-b9256ed74e85	DELIVERED	hub-hcm-01	\N	\N	\N	Giao hàng thành công	Giao hàng thành công. Tài xế đã thu COD: 350.000đ. Khách hàng đã ký nhận.	Số 120 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh	2026-08-21 15:05:05.686
d46186a1-7cf9-47ae-8425-739512082426	17091b7c-bb40-40dc-8e87-7397c0073e74	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2606204751 đã được đồng bộ từ đơn hàng #260620102938	Kho người bán	2026-06-20 12:03:02.146
c0e3e930-0b9e-4414-b982-cd528136505b	67247e2c-ca42-4f28-8393-c1cf59fd01f5	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2606291588 đã được đồng bộ từ đơn hàng #260629591100	Kho người bán	2026-06-29 05:59:11.677
1b32d06e-c8e6-4bc8-aa5b-95cf7fc52357	f9fc945f-ee73-40df-a1bf-41bc76bc522b	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2606298706 đã được đồng bộ từ đơn hàng #260629060925	Kho người bán	2026-06-29 06:09:25.89
737c8dda-2557-4fe2-87cc-b58b7a89a74a	aff4ed4a-5d1d-4d28-91d7-30dd4c395409	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2606298304 đã được đồng bộ từ đơn hàng #260629061107	Kho người bán	2026-06-29 06:11:07.962
66dfdb50-0312-4d78-8303-d45aa147a6e4	c7061a81-17bf-4560-8e1c-faab69f42942	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2607176584 đã được đồng bộ từ đơn hàng #260717053934	Kho người bán	2026-07-17 05:39:34.039
793a31f3-11a8-4d76-aac5-3d419222d6e6	56a0ba85-7207-45ff-924a-38504685b7f8	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2607178865 đã được đồng bộ từ đơn hàng #260717055639	Kho người bán	2026-07-17 05:56:39.131
1d031a78-2fe2-49eb-8cb5-f5992adc6f1c	95d0d3b7-3825-464f-9cb4-a3923a233df5	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2607175882 đã được đồng bộ từ đơn hàng #260717055720	Kho người bán	2026-07-17 05:57:20.525
8c24fde5-45d7-4112-82f7-8d62ec6af543	2c8263db-829e-4668-a686-587b92094626	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2607197067 đã được đồng bộ từ đơn hàng #260719011826	Kho người bán	2026-07-19 01:18:26.99
d8a2ae50-e67a-49ba-b61a-910b76a45eea	0dbda82e-4218-4519-9f70-3f72a131db4d	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2607172323 đã được đồng bộ từ đơn hàng #260717060418	Kho người bán	2026-07-17 06:04:18.517
999a9cb2-e4d4-4cc5-8c36-1b02c218d09f	455b88b8-ed1b-4c68-a3d9-ad1186e6d911	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2607172269 đã được đồng bộ từ đơn hàng #260717060402	Kho người bán	2026-07-17 06:04:02.428
ef78a1bb-511f-471e-8d63-a2816ccb1ded	a9b157d2-b499-48f8-9630-711b52f731c7	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2607172059 đã được đồng bộ từ đơn hàng #260717060050	Kho người bán	2026-07-17 06:00:50.241
bd19b690-7e41-4522-a9b3-b4c0ae6510af	9f7c1701-38e8-4724-aa28-60b974b97cf6	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2606304262 đã được đồng bộ từ đơn hàng #260630113938	Kho người bán	2026-06-30 11:39:38.796
306c532b-4aca-4e69-91a6-4e6690b928d4	686f6a7d-702d-454e-a648-cc198efff031	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608128386 đã được đồng bộ từ đơn hàng #26081219054531939	Kho người bán	2026-08-12 19:05:45.329
98972d63-d164-40c5-bff3-bfcee2541e21	6963ca7b-efef-4c35-a1f7-a96ef7252d4b	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608125741 đã được đồng bộ từ đơn hàng #26081219040078621	Kho người bán	2026-08-12 19:04:00.797
c601750e-ed12-444c-992f-a27977032bb2	3ce0a0fc-f266-4161-9f63-044b795e5d44	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608122053 đã được đồng bộ từ đơn hàng #26081219201633973	Kho người bán	2026-08-12 19:20:16.354
249a1e16-6f43-4c30-82d6-734c3f29f4f1	edd8f689-0329-48d6-906c-f0b7349d3b9e	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608128411 đã được đồng bộ từ đơn hàng #26081218460363381	Kho người bán	2026-08-12 18:46:03.711
a3236a25-e172-41c0-99b7-41149aad5839	bcb26c4f-4551-49db-bb0a-4c6f632f2e6f	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2607174341 đã được đồng bộ từ đơn hàng #260717060031	Kho người bán	2026-07-17 06:00:31.751
033b8f97-b013-458b-8be7-ade59f392574	3a348910-2a6f-4d0c-a7e3-dd611bbf193f	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2606299259 đã được đồng bộ từ đơn hàng #260629600135	Kho người bán	2026-06-29 06:00:13.561
5108d805-a13a-4b18-a5e5-975623ba43b8	5469cdb7-8233-4ed3-999f-f01060e8b288	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608142751 đã được đồng bộ từ đơn hàng #26081408234506930	Kho người bán	2026-08-14 08:23:45.082
24dee188-419d-4173-a4da-8435f293b838	7a789292-f96b-4683-b460-5aadfd80b713	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608147050 đã được đồng bộ từ đơn hàng #26081407384657547	Kho người bán	2026-08-14 07:38:46.666
a1a2ce44-0040-47a4-959f-d15c9226d6aa	2a2bace0-c5d1-4463-9f79-45054ec59b87	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608148679 đã được đồng bộ từ đơn hàng #26081408390084529	Kho người bán	2026-08-14 08:39:00.856
3807fa77-2292-42ff-a19c-87e570a68644	1f3f1d51-d488-4724-9b8b-2c8b106f58ff	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608142083 đã được đồng bộ từ đơn hàng #26081415440545296	Kho người bán	2026-08-14 15:44:05.515
1da51835-1749-424b-aa00-4b6a1197264d	555a421f-3db0-40e5-aca5-8ca4e6c29092	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608148644 đã được đồng bộ từ đơn hàng #26081415522442674	Kho người bán	2026-08-14 15:52:24.44
e9456cdb-08d6-4b6f-818f-4ca8967dcc41	eb726f71-1af4-412a-8bab-fc1637c2e001	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608142776 đã được đồng bộ từ đơn hàng #26081415590264558	Kho người bán	2026-08-14 15:59:02.658
f249be19-3390-4d7d-b1c5-dc5fb573360d	b3dbe83e-d8ff-4c73-9e8f-5bc4dcf7305e	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608167312 đã được đồng bộ từ đơn hàng #26081602571961548	Kho người bán	2026-08-16 02:57:19.664
2262b333-ceed-43d3-af91-f5ed2fae8ab4	a1a5c840-4da4-4568-8ba0-c191a4f0da0a	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608161782 đã được đồng bộ từ đơn hàng #26081613042232789	Kho người bán	2026-08-16 13:04:22.343
5661a285-b068-435e-9831-1a5c66976c8e	5f103e88-7d37-4a3b-bbb2-4f187461a9fd	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608162333 đã được đồng bộ từ đơn hàng #26081613051819386	Kho người bán	2026-08-16 13:05:18.217
cb29185e-d57a-4420-a5ab-a9a94a50da06	aff4ed4a-5d1d-4d28-91d7-30dd4c395409	OUT_FOR_DELIVERY	\N	driver-02	\N	\N	Đang tiến hành giao hàng	Tài xế Trần Đình Phát (SPX 02) đã nhận kiện hàng và bắt đầu lộ trình giao đến bạn.	60-F2 888.99	2026-08-21 15:52:04.78
21e38c66-7b47-4b52-a332-e4a9f04d45f2	95d0d3b7-3825-464f-9cb4-a3923a233df5	PICKING_UP	\N	driver-02	\N	\N	Tài xế đang đến lấy hàng	Tài xế Trần Đình Phát (SPX 02) đã chấp nhận đơn và đang di chuyển đến địa chỉ người bán.	60-F2 888.99	2026-08-21 16:03:15.783
155ea6ef-cd03-4c4a-9a45-96925c8cc95e	95d0d3b7-3825-464f-9cb4-a3923a233df5	PICKED_UP	hub-hcm-01	\N	\N	\N	Tài xế đã lấy hàng thành công	Kiện hàng đã được tài xế tiếp nhận từ người bán và đang trên đường nhập kho xuất phát.	Kho người bán	2026-08-21 16:03:20.736
74f1736a-44ee-4d10-a9b5-0613b4c80994	95d0d3b7-3825-464f-9cb4-a3923a233df5	AT_ORIGIN_HUB	hub-hcm-01	\N	\N	\N	Đơn hàng đã đến kho xuất phát	Bưu kiện đã nhập kho Kho Tổng Tân Bình SOC. Đang chuẩn bị quét mã vạch và phân loại.	Kho Tổng Tân Bình SOC	2026-08-21 16:07:03.964
a1dc7f35-1e0a-4ac6-b2c8-b2f8209c7b08	56a0ba85-7207-45ff-924a-38504685b7f8	PICKING_UP	\N	driver-02	\N	\N	Tài xế đang đến lấy hàng	Tài xế Trần Đình Phát (SPX 02) đã chấp nhận đơn và đang di chuyển đến địa chỉ người bán.	60-F2 888.99	2026-08-23 11:05:57.002
78526dff-0688-4a47-abdb-19474575de2c	56a0ba85-7207-45ff-924a-38504685b7f8	PICKED_UP	hub-hcm-01	\N	\N	\N	Tài xế đã lấy hàng thành công	Kiện hàng đã được tài xế tiếp nhận từ người bán và đang trên đường nhập kho xuất phát.	Kho người bán	2026-08-23 11:06:03.748
4f16a99b-8b80-4da4-b239-d3a1f5979231	3f223856-b214-4732-9cf3-b9256ed74e85	REASSIGNING	\N	\N	\N	\N	Đang điều phối lại tài xế	Tài xế Nguyễn Văn Giao (SPX 01) bận, hệ thống SPX đang tự động điều phối tài xế khác.	\N	2026-08-23 11:29:00.373
c3137c4b-8cc3-4a93-b9d6-10cfd344123b	8e1c93a2-e180-4ef7-9be0-5c36e7fa3dd3	CREATED	\N	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608236199 được khởi tạo thành công. Hệ thống ZeroMall Express (ZMX) đang chờ phân công tài xế lấy hàng.	Kênh Người Bán ZeroMall	2026-08-23 11:49:23.906
\.


--
-- Data for Name: ShippingRate; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."ShippingRate" (id, "serviceId", "originProvince", "destinationProvince", "weightFrom", "weightTo", "baseFee", "extraFeePerKg", "codFeePercent", status, "createdAt") FROM stdin;
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
80eafd99-2959-484b-91a2-5eff90973012	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	Đặt hàng thành công 🛒	Đơn hàng #26081602 trị giá 237.700đ đã được khởi tạo thành công.	ORDER	f	{"action": "VIEW_ORDER", "orderId": "26081602571961548"}	2026-08-16 02:57:19.71	2026-08-16 02:57:19.71
f62f5d51-2d3f-4401-9dab-7a9beabc4466	d9be6bae-681d-4b47-8e4f-aa95eac1ce49	Đơn hàng mới từ Khách hàng 📦	Shop có 1 đơn hàng mới #26081602 từ khách hàng Vũ quốc cường. Vui lòng kiểm tra và chuẩn bị hàng.	ORDER	f	{"action": "VIEW_ORDER", "orderId": "26081602571961548"}	2026-08-16 02:57:19.718	2026-08-16 02:57:19.718
e970bb33-5373-4a03-b00d-9b26871cbaf1	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	⚙️ Đơn hàng được cập nhật	Đơn hàng #26081602 của bạn đã chuyển sang trạng thái: Đang xử lý.	ORDER	f	{"action": "VIEW_ORDER", "status": "PROCESSING", "orderId": "26081602571961548"}	2026-08-16 02:57:19.734	2026-08-16 02:57:19.734
f9860f79-71b6-464a-a81b-67be210a8808	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	Đặt hàng thành công 🛒	Đơn hàng #26081613 trị giá 39.700đ đã được khởi tạo thành công.	ORDER	f	{"action": "VIEW_ORDER", "orderId": "26081613042232789"}	2026-08-16 13:04:22.359	2026-08-16 13:04:22.359
866fa83f-e362-4bdd-8aeb-419e9dced0ff	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Đơn hàng mới từ Khách hàng 📦	Shop có 1 đơn hàng mới #26081613 từ khách hàng Vũ quốc cường. Vui lòng kiểm tra và chuẩn bị hàng.	ORDER	f	{"action": "VIEW_ORDER", "orderId": "26081613042232789"}	2026-08-16 13:04:22.366	2026-08-16 13:04:22.366
1e73a5af-bc46-4077-97c3-7646ef5ca250	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	Đặt hàng thành công 🛒	Đơn hàng #26081613 trị giá 39.700đ đã được khởi tạo thành công.	ORDER	f	{"action": "VIEW_ORDER", "orderId": "26081613051819386"}	2026-08-16 13:05:18.226	2026-08-16 13:05:18.226
9a9e0186-d9c9-45f8-a922-5b8ccf0462ad	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Đơn hàng mới từ Khách hàng 📦	Shop có 1 đơn hàng mới #26081613 từ khách hàng Vũ quốc cường. Vui lòng kiểm tra và chuẩn bị hàng.	ORDER	f	{"action": "VIEW_ORDER", "orderId": "26081613051819386"}	2026-08-16 13:05:18.228	2026-08-16 13:05:18.228
4243c557-b38c-4e02-bd76-494b6ef28e15	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	⚙️ Đơn hàng được cập nhật	Đơn hàng #26081613 của bạn đã chuyển sang trạng thái: Đang xử lý.	ORDER	f	{"action": "VIEW_ORDER", "status": "PROCESSING", "orderId": "26081613051819386"}	2026-08-16 13:05:18.252	2026-08-16 13:05:18.252
51c14e1e-d5c7-4fea-98fc-2f9ca08d4401	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	🚚 Đơn hàng được cập nhật	Đơn hàng #26081613 của bạn đã chuyển sang trạng thái: Đang giao hàng.	ORDER	f	{"action": "VIEW_ORDER", "status": "SHIPPING", "orderId": "26081613051819386"}	2026-08-16 13:40:37.053	2026-08-16 13:40:37.053
37f72f30-9f45-408c-b0e2-46d986c5c7ce	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	⚙️ Đơn hàng được cập nhật	Đơn hàng #26081613 của bạn đã chuyển sang trạng thái: Đang xử lý.	ORDER	f	{"action": "VIEW_ORDER", "status": "PROCESSING", "orderId": "26081613042232789"}	2026-08-20 07:38:41.936	2026-08-20 07:38:41.936
00115ae5-ab9d-494c-91bf-c72b5f7c4771	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	📦 Đơn hàng được cập nhật	Đơn hàng #26081613 của bạn đã chuyển sang trạng thái: SHIPPED.	ORDER	f	{"action": "VIEW_ORDER", "status": "SHIPPED", "orderId": "26081613051819386"}	2026-08-21 11:09:10.306	2026-08-21 11:09:10.306
77fe1b47-b090-41db-b07b-71c376ef8a9e	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	📦 Đơn hàng được cập nhật	Đơn hàng #26081613 của bạn đã chuyển sang trạng thái: SHIPPED.	ORDER	f	{"action": "VIEW_ORDER", "status": "SHIPPED", "orderId": "26081613051819386"}	2026-08-21 11:09:16.495	2026-08-21 11:09:16.495
1d480281-b997-4004-ad33-a992686fa1e7	3150f691-6e58-47c7-ad4c-acbd52f027c5	📦 Đơn hàng được cập nhật	Đơn hàng #26081408 của bạn đã chuyển sang trạng thái: COMPLETED.	ORDER	f	{"action": "VIEW_ORDER", "status": "COMPLETED", "orderId": "26081408390084529"}	2026-08-21 15:57:46.963	2026-08-21 15:57:46.963
d2f417b5-d032-4d7d-87c7-38ed0bb939e3	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	📦 Đơn hàng được cập nhật	Đơn hàng #26071705 của bạn đã chuyển sang trạng thái: SHIPPED.	ORDER	f	{"action": "VIEW_ORDER", "status": "SHIPPED", "orderId": "260717055720"}	2026-08-21 16:03:20.781	2026-08-21 16:03:20.781
68c7a4f3-bc1f-4d02-84f1-7000467cbc5d	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	📦 Đơn hàng được cập nhật	Đơn hàng #26071705 của bạn đã chuyển sang trạng thái: SHIPPED.	ORDER	f	{"action": "VIEW_ORDER", "status": "SHIPPED", "orderId": "260717055639"}	2026-08-23 11:06:03.807	2026-08-23 11:06:03.807
2ae629d3-86bf-45cc-b363-08faa4eb5f66	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	Đặt hàng thành công 🛒	Đơn hàng #26082311 trị giá 216.500đ đã được khởi tạo thành công.	ORDER	f	{"action": "VIEW_ORDER", "orderId": "26082311481046083"}	2026-08-23 11:48:10.527	2026-08-23 11:48:10.527
73b82651-fb69-40d5-99d6-f8d574ea26c2	d9be6bae-681d-4b47-8e4f-aa95eac1ce49	Đơn hàng mới từ Khách hàng 📦	Shop có 1 đơn hàng mới #26082311 từ khách hàng Minh Anh. Vui lòng kiểm tra và chuẩn bị hàng.	ORDER	f	{"action": "VIEW_ORDER", "orderId": "26082311481046083"}	2026-08-23 11:48:10.535	2026-08-23 11:48:10.535
bc49b023-a2e3-44db-876c-27e7c1b24c78	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	⚙️ Đơn hàng được cập nhật	Đơn hàng #26082311 của bạn đã chuyển sang trạng thái: Đang xử lý.	ORDER	f	{"action": "VIEW_ORDER", "status": "PROCESSING", "orderId": "26082311481046083"}	2026-08-23 11:48:10.544	2026-08-23 11:48:10.544
252294a6-ddf8-4865-89d1-0d78ae11e1db	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	Đặt hàng thành công 🛒	Đơn hàng #26082311 trị giá 215.500đ đã được khởi tạo thành công.	ORDER	f	{"action": "VIEW_ORDER", "orderId": "26082311485056556"}	2026-08-23 11:48:50.594	2026-08-23 11:48:50.594
72ab98ed-3ef4-46da-8046-d78081dcafa9	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Đơn hàng mới từ Khách hàng 📦	Shop có 1 đơn hàng mới #26082311 từ khách hàng Minh Anh. Vui lòng kiểm tra và chuẩn bị hàng.	ORDER	f	{"action": "VIEW_ORDER", "orderId": "26082311485056556"}	2026-08-23 11:48:50.602	2026-08-23 11:48:50.602
57190dfa-1103-4f2c-920c-8430b32ea4d8	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	⚙️ Đơn hàng được cập nhật	Đơn hàng #26082311 của bạn đã chuyển sang trạng thái: Đang xử lý.	ORDER	f	{"action": "VIEW_ORDER", "status": "PROCESSING", "orderId": "26082311485056556"}	2026-08-23 11:48:50.611	2026-08-23 11:48:50.611
54f8c66b-bb1c-42df-b82d-ed7e880a5e79	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	🚚 Đơn hàng được cập nhật	Đơn hàng #26082311 của bạn đã chuyển sang trạng thái: Đang giao hàng.	ORDER	f	{"action": "VIEW_ORDER", "status": "SHIPPING", "orderId": "26082311485056556"}	2026-08-23 11:49:14.486	2026-08-23 11:49:14.486
f41c3c51-2c58-4f13-89a6-54d3e49e61ab	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	📦 Đơn hàng được cập nhật	Đơn hàng #26082311 của bạn đã chuyển sang trạng thái: SHIPPED.	ORDER	f	{"action": "VIEW_ORDER", "status": "SHIPPED", "orderId": "26082311485056556"}	2026-08-23 11:49:23.923	2026-08-23 11:49:23.923
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
26081415440545296	880a2880-43c0-4506-b25a-86dc34299f7b	minhanh@zeromall.com	minhanh	0344461922	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	2000	0	zeropay	REFUNDED	2026-08-14 15:44:05.515	2026-08-14 15:50:35.475	1452	GHN-VN-487424201	21007	m , ,m,ml	minhanh@zeromall.com	[Chưa nhận hàng hoặc nhận thiếu hàng] Lý do: Chưa nhận được hàng sau thời gian dài	\N	0	0	\N	FREESHIP	\N	5
260717055720	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	4700	2700	sepay	SHIPPED	2026-07-17 05:57:20.525	2026-08-21 16:03:20.772	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
260717055639	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	39700	37700	sepay	SHIPPED	2026-07-17 05:56:39.131	2026-08-23 11:06:03.789	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
26081415522442674	880a2880-43c0-4506-b25a-86dc34299f7b	minhanh@zeromall.com	minhanh	0344461922	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	256500	16500	cod	PROCESSING	2026-08-14 15:52:24.44	2026-08-14 15:52:24.474	1452	\N	21007	\N	\N	\N	\N	0	50000	\N	DISCOUNT50K	\N	5
26081415590264558	880a2880-43c0-4506-b25a-86dc34299f7b	minhanh@zeromall.com	minhanh	0344461922	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	91500	16500	zeropay	COMPLETED	2026-08-14 15:59:02.658	2026-08-14 16:01:21.666	1452	GHN-VN-697013339	21007	\N	\N	\N	\N	0	0	\N	\N	\N	5
26081602571961548	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	237700	37700	cod	PROCESSING	2026-08-16 02:57:19.664	2026-08-16 02:57:19.71	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
26081613042232789	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	39700	37700	sepay	PROCESSING	2026-08-16 13:04:22.343	2026-08-20 07:38:41.878	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
26081613051819386	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	39700	37700	zeropay	SHIPPED	2026-08-16 13:05:18.217	2026-08-21 11:09:16.474	\N	ZMX-VN-490311514	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5
26081408390084529	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	minhanh	0344461922	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	286500	16500	cod	COMPLETED	2026-08-14 08:39:00.856	2026-08-21 15:57:46.921	1452	GHN-VN-889275153	21007	\N	\N	\N	\N	0	50000	\N	DISCOUNT50K	\N	5
26082311481046083	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Minh Anh	0964579675	3D Lê Lợi, Phường 4, Gò Vấp, Thành phố Hồ Chí Minh	216500	16500	zeropay	PROCESSING	2026-08-23 11:48:10.503	2026-08-23 11:48:10.531	1461	\N	21303	\N	\N	\N	\N	0	0	\N	\N	\N	5
26082311485056556	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Minh Anh	0964579675	3D Lê Lợi, Phường 4, Gò Vấp, Thành phố Hồ Chí Minh	215500	16500	zeropay	SHIPPED	2026-08-23 11:48:50.583	2026-08-23 11:49:23.919	1461	ZMX2608236199	21303	\N	\N	\N	\N	0	0	\N	\N	\N	5
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
99187ec5-33c2-44c0-b884-f1374025adfb	26081602571961548	7039c315-059c-4cdb-b53d-24175ee21b11	d9be6bae-681d-4b47-8e4f-aa95eac1ce49	HLE GUMAYUSI FANMEETING SEOUL	https://res.cloudinary.com/dxkfusgxs/image/upload/v1786723668/vko8e4q8yqblfv2fsev7.jpg	\N	200000	1
d8e2b4f0-8a40-4721-bde8-7d07fcbfe394	26081613042232789	130c82e3-a2ef-437e-8e77-a6da1ab4af5b	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	cuong	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	\N	2000	1
6a8f7497-9d19-4547-8cf7-4329695923a1	26081613051819386	130c82e3-a2ef-437e-8e77-a6da1ab4af5b	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	cuong	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	\N	2000	1
ed123108-7989-4dff-b49a-b7bcf36d9613	26082311481046083	7039c315-059c-4cdb-b53d-24175ee21b11	d9be6bae-681d-4b47-8e4f-aa95eac1ce49	HLE GUMAYUSI FANMEETING SEOUL	https://res.cloudinary.com/dxkfusgxs/image/upload/v1786723668/vko8e4q8yqblfv2fsev7.jpg	\N	200000	1
c582301d-a5d7-4bfa-8ba5-a9c1b1688b6b	26082311485056556	7d707a15-9b2d-413f-9064-21e60c61ec61	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Balo Thời Trang Học Sinh Sinh Viên Chống Nước	https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80	\N	199000	1
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
977aa155-667e-4c08-a693-a32cc2545ba0	26081415590264558	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	75000	5	RELEASED	2026-08-17 16:01:12.253	2026-08-14 16:01:12.254	2026-08-14 16:01:21.683
2d365fee-b335-405d-996c-8e0c885c44c9	26081408390084529	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	320000	5	RELEASED	2026-08-17 15:49:39.42	2026-08-14 15:49:39.423	2026-08-20 07:36:39.861
ccca042c-a160-4f31-87d8-cbcbd33ae88b	26081415440545296	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	2000	5	RELEASED	2026-08-17 15:49:40.51	2026-08-14 15:49:40.511	2026-08-20 07:36:39.888
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
be6a8f96-e6e3-425e-b882-b23614eb1f2f	26081602571961548	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	237700	cod	PENDING	\N	2026-08-16 02:57:19.688	2026-08-16 02:57:19.688
aab106a0-9a18-494f-b3e4-f3b0a46a1f4d	26081613051819386	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	39700	zeropay	SUCCESS	ZPAY-c24f4362-c0e5-4548-b90d-3a43c79b3d86	2026-08-16 13:05:18.23	2026-08-16 13:05:18.242
50152923-74a8-43d4-a756-242e2208ce22	26081613042232789	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	39700	sepay	SUCCESS	TEST_REF_26081613	2026-08-16 13:04:22.359	2026-08-20 07:38:41.845
88f0fb62-ec6d-4a07-99a4-6a46b88fa904	26082311481046083	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	216500	zeropay	SUCCESS	ZPAY-8a20ad32-4678-429d-9b91-b30528d73bc1	2026-08-23 11:48:10.517	2026-08-23 11:48:10.522
ced5879c-9fde-4847-840f-d9d6128574ab	26082311485056556	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	215500	zeropay	SUCCESS	ZPAY-8e8bd18b-bebb-49dc-b606-2d92b3090865	2026-08-23 11:48:50.595	2026-08-23 11:48:50.599
\.


--
-- Data for Name: Wallet; Type: TABLE DATA; Schema: payment; Owner: postgres
--

COPY payment."Wallet" (id, "buyerId", balance, "createdAt", "updatedAt", "onHoldBalance") FROM stdin;
c9c18360-3bb6-4f1a-90d7-be5eab2500e3	guest-buyer-id	5000000	2026-06-20 12:02:52.655	2026-06-20 12:02:52.655	0
32b85b1a-bcc5-46a6-9c78-3fcfc60de3e7	e9cd2310-7eb9-4ce5-ba8e-7e9e1f815d2d	4542300	2026-06-20 12:02:52.653	2026-06-20 12:03:02.174	0
37aa0cd4-289f-4a5e-97e9-0297a8a9fed9	0843610c-e845-437b-a239-fd17acd55ad5	5000000	2026-06-29 04:10:53.128	2026-06-29 04:10:53.128	0
6033f671-76c8-46e4-8ba1-91792deb1b31	5c64ac2d-0123-43c0-86bf-b9495528c27d	5000000	2026-06-29 05:19:38.376	2026-06-29 05:19:38.376	0
2e6f2599-2ced-453d-855d-545a70c613c9	3150f691-6e58-47c7-ad4c-acbd52f027c5	4292000	2026-06-29 05:58:25.113	2026-08-14 08:23:45.104	0
af81c680-56a5-4af4-ae06-22209106f113	880a2880-43c0-4506-b25a-86dc34299f7b	4908500	2026-08-14 15:43:45.632	2026-08-14 15:59:02.675	0
c119dbea-af00-41a1-a483-cb5c97d91e90	PLATFORM	125450	2026-07-24 06:01:36.15	2026-08-20 07:36:39.89	0
1ec2e675-1528-48bb-a4f1-33096c3ba62b	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	7379550	2026-07-19 02:44:45.73	2026-08-21 09:27:31.898	0
bf52b83a-1ad7-417b-b68d-9a48da080744	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	4845000	2026-06-30 11:09:54.308	2026-08-23 11:48:50.597	0
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
c53243e5-55ba-412f-91a0-e7d09c789d8d	bf52b83a-1ad7-417b-b68d-9a48da080744	39700	PAYMENT	Thanh toán đơn hàng #26081613051819386	SUCCESS	2026-08-16 13:05:18.24
a95e3f20-d4fd-4a31-a06a-eb501ceaed59	bf52b83a-1ad7-417b-b68d-9a48da080744	2000	DEPOSIT	Đang chờ chuyển khoản QR (Memo: ZMWALLETF1BA7A53)	PENDING	2026-08-16 13:06:45.219
ac94f6b3-e81b-4c52-96be-117fe6237472	1ec2e675-1528-48bb-a4f1-33096c3ba62b	304000	REVENUE	Giải ngân doanh thu đơn hàng #26081408390084529 (sau chiết khấu 5%)	SUCCESS	2026-08-20 07:36:39.869
bc7aa30a-cc31-4fca-ac4e-1cce7d611176	c119dbea-af00-41a1-a483-cb5c97d91e90	16000	COMMISSION	Chiết khấu sàn 5% đơn hàng #26081408390084529 từ Shop 6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	SUCCESS	2026-08-20 07:36:39.871
dad207fa-ee05-40cc-890b-e18da7aab330	1ec2e675-1528-48bb-a4f1-33096c3ba62b	1900	REVENUE	Giải ngân doanh thu đơn hàng #26081415440545296 (sau chiết khấu 5%)	SUCCESS	2026-08-20 07:36:39.889
b303874b-e5eb-4199-959c-a9ba118fc845	c119dbea-af00-41a1-a483-cb5c97d91e90	100	COMMISSION	Chiết khấu sàn 5% đơn hàng #26081415440545296 từ Shop 6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	SUCCESS	2026-08-20 07:36:39.89
97e22cf4-102b-47a4-81d1-96ab025e1df1	1ec2e675-1528-48bb-a4f1-33096c3ba62b	2000	WITHDRAW	Rút tiền về tài khoản ngân hàng MBBank (MB) (0964579675) - Mã yêu cầu: 9c0ffb65-c341-46b0-9be6-3097eb8ea512	PENDING	2026-08-21 09:27:31.91
f5d0b855-69e2-46fb-99d6-a1c55928a57a	bf52b83a-1ad7-417b-b68d-9a48da080744	216500	PAYMENT	Thanh toán đơn hàng #26082311481046083	SUCCESS	2026-08-23 11:48:10.521
0ef489f1-ddd9-49c7-8c11-65f72560dff8	bf52b83a-1ad7-417b-b68d-9a48da080744	215500	PAYMENT	Thanh toán đơn hàng #26082311485056556	SUCCESS	2026-08-23 11:48:50.598
\.


--
-- Data for Name: WithdrawRequest; Type: TABLE DATA; Schema: payment; Owner: postgres
--

COPY payment."WithdrawRequest" (id, "shopId", amount, "bankName", "bankAccount", "accountName", status, "createdAt", "updatedAt") FROM stdin;
37431e3f-4680-401e-bf4f-66132b3ddc49	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	2000	MBBank	0964579675	VU QUOC CUONG	APPROVED	2026-07-24 04:22:45.316	2026-07-24 04:42:40.952
51ff79b8-b051-4d4a-864d-7ac114680ee4	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	2000	MBBank (MB)	0964579675	VU QUOC CUONG	APPROVED	2026-07-25 02:22:51.334	2026-07-25 02:23:41.442
9c0ffb65-c341-46b0-9be6-3097eb8ea512	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	2000	MBBank (MB)	0964579675	VU QUOC CUONG	PENDING	2026-08-21 09:27:31.905	2026-08-21 09:27:31.905
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
-- Data for Name: CostPriceHistory; Type: TABLE DATA; Schema: product; Owner: postgres
--

COPY product."CostPriceHistory" (id, "productId", "shopId", "costPrice", quantity, "invoiceCode", supplier, note, "importedBy", "importDate", "createdAt") FROM stdin;
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
-- Data for Name: PriceHistory; Type: TABLE DATA; Schema: product; Owner: postgres
--

COPY product."PriceHistory" (id, "productId", "shopId", "oldPrice", "newPrice", "changeType", "changedBy", "changedByRole", reason, "createdAt") FROM stdin;
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: product; Owner: postgres
--

COPY product."Product" (id, "shopId", name, image, category, brand, description, price, stock, sales, status, sku, "variationsText", "hasVariations", "variationGroups", "variationRows", weight, length, width, height, condition, "isPreOrder", "preOrderDays", "createdAt", "updatedAt", images, video, "originalPrice", "isViolated", "reportsCount", "violationReason", "categoryId", "costPrice") FROM stdin;
7eca41aa-9dff-4051-b617-16cd233a66e8	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	Kệ Đồ Nhà Bếp Thông Minh Sơn Tĩnh Điện 3 Tầng	https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=400&q=80	Nhà Cửa	No Brand	Kệ để gia vị, lò vi sóng bằng thép carbon sơn tĩnh điện chống gỉ sét, chịu lực lên đến 50kg, giúp căn bếp luôn ngăn nắp gọn gàng.	420000	30	1	active	SHF-KIT-05	\N	f	[]	[]	3500	\N	\N	\N	new	f	7	2026-06-29 04:38:06.944	2026-06-29 04:38:06.944	\N	\N	600000	f	0	\N	70ddc8c0-1a5a-4be8-80c6-1e932449c812	0
502872df-544b-4d08-97f6-f5136d2f36c6	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	Bình Giữ Nhiệt Lõi Inox 316 Cao Cấp 1000ml	https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80	Nhà Cửa	Lock&Lock	Bình giữ nhiệt dung tích lớn giữ nóng/lạnh lên đến 24 giờ, chất liệu thép không gỉ 316 y tế siêu an toàn, có quai xách tiện lợi.	350000	70	0	active	THM-LOCK-04	\N	f	[]	[]	600	\N	\N	\N	new	f	7	2026-06-29 04:38:06.942	2026-06-29 04:38:06.942	\N	\N	490000	f	0	\N	70ddc8c0-1a5a-4be8-80c6-1e932449c812	0
07dd1cf8-a26e-49a2-a7d0-95abe3ec8388	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	Bộ Bát Đĩa Sứ Tráng Men Xanh Cổ Điển Sang Trọng	https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&q=80	Nhà Cửa	No Brand	Bộ bát đĩa sứ cao cấp gồm 12 chi tiết tráng men bóng cao cấp, phong cách Bắc Âu sang trọng, chịu nhiệt tốt dùng được trong lò vi sóng.	580000	15	0	active	CER-BLU-03	\N	f	[]	[]	4000	\N	\N	\N	new	f	7	2026-06-29 04:38:06.94	2026-07-22 08:16:43.395	\N	\N	750000	t	42	Hàng giả/nhái thương hiệu, lừa đảo	70ddc8c0-1a5a-4be8-80c6-1e932449c812	0
d6b333d1-acc0-4081-97b3-a2a397ffe56b	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	Nồi Chiên Không Dầu Điện Tử 6.5L Đa Năng Tiện Lợi	https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=400&q=80	Gia Dụng	Philips	Nồi chiên không dầu dung tích lớn 6.5L, điều khiển điện tử cảm ứng nhạy bén, công nghệ chiên xoáy nhiệt 360 độ hạn chế dầu mỡ bảo vệ sức khỏe.	1850000	20	0	active	AF-PLP-01	\N	f	[]	[]	5500	\N	\N	\N	new	f	7	2026-06-29 04:38:06.935	2026-06-29 04:38:06.935	\N	\N	2500000	f	0	\N	4ff7e1b5-53a6-4525-ba37-8f2129453998	0
50809270-b63e-43ff-93b7-913411c073f8	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Giày Sneaker Nam Nữ Thể Thao Da Mềm Cao Cấp	https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80	Giày Dép Nam	Adidas	Giày sneaker thể thao phong cách Hàn Quốc trẻ trung năng động, đế cao su chống trơn trượt êm chân, phù hợp đi học, đi làm, dạo phố.	450000	59	3	active	SNK-WHT-03	\N	f	[]	[]	700	\N	\N	\N	new	f	7	2026-06-29 04:38:06.928	2026-08-12 19:05:45.341	\N	\N	600000	f	0	\N	dec2bbb5-567c-4ab4-8175-0feb65e8bf77	0
c01b68c8-330f-484a-b73d-1d65b194f189	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	cuong	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	Phụ Kiện Nữ	2	2	2000	1	2	active			f	[{"name":"Màu sắc","options":[]}]	[]	2	2	2	2	new	f	7	2026-07-17 05:56:07.87	2026-08-12 19:20:16.37	["https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg"]		20000	f	0	\N	fdf7905e-c3bd-4fe7-b979-5f0c2acc4f8a	0
bcba9294-1540-4629-a1f4-21ea531b21d8	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Váy Tay Bồng Dáng Xòe Công Chúa Cực Xinh	https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80	Thời Trang Nữ	No Brand	Váy xòe phong cách tiểu thư cổ điển điệu đà, tay bồng thanh lịch, chất vải voan hàn cao cấp mềm mại hai lớp cực chuẩn phom dáng.	320000	44	1	active	DRS-PNK-02	\N	f	[]	[]	300	\N	\N	\N	new	f	7	2026-06-29 04:38:06.925	2026-08-14 08:39:00.869	\N	\N	450000	f	0	\N	dcb70d3d-bdae-49e6-9bbe-331ab2a10f6d	0
aac07fcf-9b55-4ce6-9b2f-2e3d34275e4f	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Áo Khoác Bomber Unisex Cực Ngầu Nỉ Ngoại Dày Dặn	https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80	Thời Trang Nam	No Brand	Áo khoác bomber phong cách đường phố năng động, chất liệu nỉ ngoại cao cấp dày dặn ấm áp, thích hợp đi chơi hay đi học.	250000	97	3	active	BMB-BLK-01	\N	f	[]	[]	500	\N	\N	\N	new	f	7	2026-06-29 04:38:06.922	2026-08-14 08:23:45.155	\N	\N	350000	f	0	\N	9cd1423d-4dee-4998-93bd-4b0c7b968928	0
bea80f9c-aab7-4885-90b2-3f962816edda	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	cuong	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	Phụ Kiện Nữ	2	2	2000	1	3	active			f	[{"name":"Màu sắc","options":[]}]	[]	2	2	2	2	new	f	7	2026-07-17 05:56:09.138	2026-08-14 15:44:05.665	["https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg"]		20000	f	0	\N	fdf7905e-c3bd-4fe7-b979-5f0c2acc4f8a	0
ed97f21d-2134-40ca-a758-5b6fea1ce201	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	Máy Xay Sinh Tố Cầm Tay Sạc Pin Mini Không Dây	https://images.unsplash.com/photo-1578643463396-0997cb5328c1?w=400&q=80	Gia Dụng	Bear	Máy xay sinh tố đa năng sạc pin tiện lợi mang đi làm, đi du lịch. Lưỡi dao inox 304 sắc bén, chất liệu nhựa cao cấp an toàn cho bé.	290000	39	1	active	BL-BEAR-02	\N	f	[]	[]	800	\N	\N	\N	new	f	7	2026-06-29 04:38:06.937	2026-08-14 15:52:24.457	\N	\N	390000	f	0	\N	4ff7e1b5-53a6-4525-ba37-8f2129453998	0
b1fc3f48-76b8-4492-bf91-af20167e137e	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Nón Lưỡi Trai Kaki Trơn Phong Cách Hàn Quốc	https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80	Phụ Kiện Nữ	No Brand	Mũ lưỡi trai kaki basic unisex nam nữ đội đều đẹp, phom dáng cứng cáp ôm đầu thoải mái, điều chỉnh size dễ dàng.	75000	149	1	active	CAP-BLK-04	\N	f	[]	[]	100	\N	\N	\N	new	f	7	2026-06-29 04:38:06.931	2026-08-14 15:59:02.694	\N	\N	120000	f	0	\N	fdf7905e-c3bd-4fe7-b979-5f0c2acc4f8a	0
130c82e3-a2ef-437e-8e77-a6da1ab4af5b	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	cuong	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	Phụ Kiện Nữ	2	2	2000	0	3	active			f	[{"name":"Màu sắc","options":[]}]	[]	2	2	2	2	new	f	7	2026-07-17 05:56:09.202	2026-08-16 13:05:18.251	["https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg"]		20000	t	15	Mặt hàng chưa kiểm định y tế	fdf7905e-c3bd-4fe7-b979-5f0c2acc4f8a	0
7d707a15-9b2d-413f-9064-21e60c61ec61	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Balo Thời Trang Học Sinh Sinh Viên Chống Nước	https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80	Túi Ví Nữ	No Brand	Balo thời trang đựng vừa laptop 15.6 inch, chất vải oxford chống thấm nước tốt, nhiều ngăn tiện lợi đi học hay du lịch ngắn ngày.	199000	79	1	active	BP-GRY-05	\N	f	[]	[]	600	\N	\N	\N	new	f	7	2026-06-29 04:38:06.933	2026-08-23 11:48:50.61	\N	\N	280000	f	0	\N	825d4683-d05c-47a4-8cac-3f54890a2d75	0
7039c315-059c-4cdb-b53d-24175ee21b11	d9be6bae-681d-4b47-8e4f-aa95eac1ce49	HLE GUMAYUSI FANMEETING SEOUL	https://res.cloudinary.com/dxkfusgxs/image/upload/v1786723668/vko8e4q8yqblfv2fsev7.jpg	Sức Khỏe & Sắc Đẹp	HLE	bé trai biết làm nũng	200000	8	2	active	\N	\N	f	[]	[]	1	10	8	0.1	new	f	2	2026-08-14 16:09:16.647	2026-08-23 11:48:10.558	["https://res.cloudinary.com/dxkfusgxs/image/upload/v1786723668/vko8e4q8yqblfv2fsev7.jpg"]	https://www.youtube.com/watch?v=69ZDBWoj5YM&list=RDl_uzEREOKfo&index=9	200000	f	0	\N	\N	0
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
-- Name: ClaimEvidence ClaimEvidence_pkey; Type: CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."ClaimEvidence"
    ADD CONSTRAINT "ClaimEvidence_pkey" PRIMARY KEY (id);


--
-- Name: Claim Claim_pkey; Type: CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."Claim"
    ADD CONSTRAINT "Claim_pkey" PRIMARY KEY (id);


--
-- Name: CodTransaction CodTransaction_pkey; Type: CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."CodTransaction"
    ADD CONSTRAINT "CodTransaction_pkey" PRIMARY KEY (id);


--
-- Name: CodTransaction CodTransaction_shipmentId_key; Type: CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."CodTransaction"
    ADD CONSTRAINT "CodTransaction_shipmentId_key" UNIQUE ("shipmentId");


--
-- Name: DeliveryAssignment DeliveryAssignment_pkey; Type: CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."DeliveryAssignment"
    ADD CONSTRAINT "DeliveryAssignment_pkey" PRIMARY KEY (id);


--
-- Name: DeliveryAttempt DeliveryAttempt_pkey; Type: CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."DeliveryAttempt"
    ADD CONSTRAINT "DeliveryAttempt_pkey" PRIMARY KEY (id);


--
-- Name: Driver Driver_pkey; Type: CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."Driver"
    ADD CONSTRAINT "Driver_pkey" PRIMARY KEY (id);


--
-- Name: HubScan HubScan_pkey; Type: CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."HubScan"
    ADD CONSTRAINT "HubScan_pkey" PRIMARY KEY (id);


--
-- Name: Hub Hub_code_key; Type: CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."Hub"
    ADD CONSTRAINT "Hub_code_key" UNIQUE (code);


--
-- Name: Hub Hub_pkey; Type: CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."Hub"
    ADD CONSTRAINT "Hub_pkey" PRIMARY KEY (id);


--
-- Name: Package Package_pkey; Type: CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."Package"
    ADD CONSTRAINT "Package_pkey" PRIMARY KEY (id);


--
-- Name: Package Package_shipmentId_key; Type: CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."Package"
    ADD CONSTRAINT "Package_shipmentId_key" UNIQUE ("shipmentId");


--
-- Name: Return Return_pkey; Type: CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."Return"
    ADD CONSTRAINT "Return_pkey" PRIMARY KEY (id);


--
-- Name: SellerAddress SellerAddress_pkey; Type: CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."SellerAddress"
    ADD CONSTRAINT "SellerAddress_pkey" PRIMARY KEY (id);


--
-- Name: Settlement Settlement_pkey; Type: CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."Settlement"
    ADD CONSTRAINT "Settlement_pkey" PRIMARY KEY (id);


--
-- Name: ShipmentTracking ShipmentTracking_pkey; Type: CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."ShipmentTracking"
    ADD CONSTRAINT "ShipmentTracking_pkey" PRIMARY KEY (id);


--
-- Name: Shipment Shipment_orderId_key; Type: CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."Shipment"
    ADD CONSTRAINT "Shipment_orderId_key" UNIQUE ("orderId");


--
-- Name: Shipment Shipment_pkey; Type: CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."Shipment"
    ADD CONSTRAINT "Shipment_pkey" PRIMARY KEY (id);


--
-- Name: Shipment Shipment_trackingNumber_key; Type: CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."Shipment"
    ADD CONSTRAINT "Shipment_trackingNumber_key" UNIQUE ("trackingNumber");


--
-- Name: ShippingRate ShippingRate_pkey; Type: CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."ShippingRate"
    ADD CONSTRAINT "ShippingRate_pkey" PRIMARY KEY (id);


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
-- Name: CostPriceHistory CostPriceHistory_pkey; Type: CONSTRAINT; Schema: product; Owner: postgres
--

ALTER TABLE ONLY product."CostPriceHistory"
    ADD CONSTRAINT "CostPriceHistory_pkey" PRIMARY KEY (id);


--
-- Name: FlashSale FlashSale_pkey; Type: CONSTRAINT; Schema: product; Owner: postgres
--

ALTER TABLE ONLY product."FlashSale"
    ADD CONSTRAINT "FlashSale_pkey" PRIMARY KEY (id);


--
-- Name: PriceHistory PriceHistory_pkey; Type: CONSTRAINT; Schema: product; Owner: postgres
--

ALTER TABLE ONLY product."PriceHistory"
    ADD CONSTRAINT "PriceHistory_pkey" PRIMARY KEY (id);


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
-- Name: ClaimEvidence ClaimEvidence_claimId_fkey; Type: FK CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."ClaimEvidence"
    ADD CONSTRAINT "ClaimEvidence_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES delivery."Claim"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Claim Claim_shipmentId_fkey; Type: FK CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."Claim"
    ADD CONSTRAINT "Claim_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES delivery."Shipment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CodTransaction CodTransaction_shipmentId_fkey; Type: FK CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."CodTransaction"
    ADD CONSTRAINT "CodTransaction_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES delivery."Shipment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DeliveryAssignment DeliveryAssignment_driverId_fkey; Type: FK CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."DeliveryAssignment"
    ADD CONSTRAINT "DeliveryAssignment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES delivery."Driver"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DeliveryAssignment DeliveryAssignment_shipmentId_fkey; Type: FK CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."DeliveryAssignment"
    ADD CONSTRAINT "DeliveryAssignment_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES delivery."Shipment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DeliveryAttempt DeliveryAttempt_driverId_fkey; Type: FK CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."DeliveryAttempt"
    ADD CONSTRAINT "DeliveryAttempt_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES delivery."Driver"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DeliveryAttempt DeliveryAttempt_shipmentId_fkey; Type: FK CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."DeliveryAttempt"
    ADD CONSTRAINT "DeliveryAttempt_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES delivery."Shipment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Driver Driver_hubId_fkey; Type: FK CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."Driver"
    ADD CONSTRAINT "Driver_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES delivery."Hub"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HubScan HubScan_hubId_fkey; Type: FK CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."HubScan"
    ADD CONSTRAINT "HubScan_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES delivery."Hub"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HubScan HubScan_shipmentId_fkey; Type: FK CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."HubScan"
    ADD CONSTRAINT "HubScan_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES delivery."Shipment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Package Package_shipmentId_fkey; Type: FK CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."Package"
    ADD CONSTRAINT "Package_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES delivery."Shipment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Return Return_shipmentId_fkey; Type: FK CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."Return"
    ADD CONSTRAINT "Return_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES delivery."Shipment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ShipmentTracking ShipmentTracking_shipmentId_fkey; Type: FK CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."ShipmentTracking"
    ADD CONSTRAINT "ShipmentTracking_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES delivery."Shipment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Shipment Shipment_currentHubId_fkey; Type: FK CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."Shipment"
    ADD CONSTRAINT "Shipment_currentHubId_fkey" FOREIGN KEY ("currentHubId") REFERENCES delivery."Hub"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Shipment Shipment_pickupAddressId_fkey; Type: FK CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."Shipment"
    ADD CONSTRAINT "Shipment_pickupAddressId_fkey" FOREIGN KEY ("pickupAddressId") REFERENCES delivery."SellerAddress"(id) ON UPDATE CASCADE ON DELETE SET NULL;


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
-- Name: CostPriceHistory fk_costpricehistory_product; Type: FK CONSTRAINT; Schema: product; Owner: postgres
--

ALTER TABLE ONLY product."CostPriceHistory"
    ADD CONSTRAINT fk_costpricehistory_product FOREIGN KEY ("productId") REFERENCES product."Product"(id) ON DELETE CASCADE;


--
-- Name: PriceHistory fk_pricehistory_product; Type: FK CONSTRAINT; Schema: product; Owner: postgres
--

ALTER TABLE ONLY product."PriceHistory"
    ADD CONSTRAINT fk_pricehistory_product FOREIGN KEY ("productId") REFERENCES product."Product"(id) ON DELETE CASCADE;


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

\unrestrict jcORg1BAuSxN1AF42LjjFxMQBU0W2HKJcc04fjUTOFNxO0luKhVVAckxfkNiBLv

