--
-- PostgreSQL database dump
--

\restrict nlH6ZDsgYPceMRgmTVTgQBElL6b3b0L0u38KA5INcWx0FqoBA7YuU94yPfKN6AM

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
-- Name: UserAddress; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth."UserAddress" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    region text NOT NULL,
    details text NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    lat double precision,
    lng double precision,
    "ghnDistrictId" integer,
    "ghnWardCode" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE auth."UserAddress" OWNER TO postgres;

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
    "completedAt" timestamp(3) without time zone,
    "proofImage" text
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
-- Name: DriverAttendance; Type: TABLE; Schema: delivery; Owner: postgres
--

CREATE TABLE delivery."DriverAttendance" (
    id text NOT NULL,
    "driverId" text NOT NULL,
    "hubId" text NOT NULL,
    "checkInAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "checkOutAt" timestamp(3) without time zone,
    "faceImage" text,
    latitude double precision,
    longitude double precision,
    "distanceToHub" double precision,
    status text DEFAULT 'CHECKED_IN'::text NOT NULL,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE delivery."DriverAttendance" OWNER TO postgres;

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
    status text DEFAULT 'REQUESTED'::text NOT NULL,
    "returnShippingFee" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "buyerShipDeadline" timestamp(3) without time zone,
    "csAgentId" text,
    "csNote" text,
    "reasonDetail" text,
    "refundAmount" double precision DEFAULT 0 NOT NULL,
    resolution text DEFAULT 'RETURN_REFUND'::text NOT NULL,
    "returnMethod" text,
    "returnNumber" text NOT NULL,
    "returnTrackingNumber" text,
    "sellerDeadline" timestamp(3) without time zone,
    "sellerInspectDeadline" timestamp(3) without time zone,
    "sellerNote" text,
    "sellerShippingCharge" double precision DEFAULT 0 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE delivery."Return" OWNER TO postgres;

--
-- Name: ReturnEvidence; Type: TABLE; Schema: delivery; Owner: postgres
--

CREATE TABLE delivery."ReturnEvidence" (
    id text NOT NULL,
    "returnId" text NOT NULL,
    "uploadedBy" text NOT NULL,
    "fileUrl" text NOT NULL,
    "fileType" text DEFAULT 'IMAGE'::text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE delivery."ReturnEvidence" OWNER TO postgres;

--
-- Name: ReturnItem; Type: TABLE; Schema: delivery; Owner: postgres
--

CREATE TABLE delivery."ReturnItem" (
    id text NOT NULL,
    "returnId" text NOT NULL,
    "orderItemId" text NOT NULL,
    "productId" text NOT NULL,
    "productName" text NOT NULL,
    "productImage" text,
    variant text,
    price double precision NOT NULL,
    quantity integer NOT NULL,
    "refundAmount" double precision DEFAULT 0 NOT NULL
);


ALTER TABLE delivery."ReturnItem" OWNER TO postgres;

--
-- Name: ReturnNegotiation; Type: TABLE; Schema: delivery; Owner: postgres
--

CREATE TABLE delivery."ReturnNegotiation" (
    id text NOT NULL,
    "returnId" text NOT NULL,
    "proposedBy" text NOT NULL,
    "proposedAmount" double precision NOT NULL,
    message text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE delivery."ReturnNegotiation" OWNER TO postgres;

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
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "proofImage" text
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
    "shopDiscountAmount" double precision DEFAULT 0 NOT NULL,
    "platformDiscountAmount" double precision DEFAULT 0 NOT NULL,
    "shopVoucherCode" text,
    "platformVoucherCode" text,
    "appliedVoucherIds" text,
    "commissionRate" double precision DEFAULT 5 NOT NULL,
    "checkoutGroupId" text,
    "shopId" text
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
9a68cf30-ca88-46ad-aefa-fb3f14b6936a	2026-08-26 07:10:46.796	admin@zeromall.com	[ADMIN MODERATION] Bỏ qua cảnh báo vi phạm cho sản phẩm cuong (ID: 130c82e3-a2ef-437e-8e77-a6da1ab4af5b)
06a69ac4-216a-43f9-b3f2-5ecba3717d3b	2026-08-29 03:27:10.109	cskh_1@gmail.com	Phê duyệt cửa hàng ID 75c99eae-6bb1-4865-9f04-3b928b656b3f
e79bf33e-72f0-4071-a03d-70a9ab87e526	2026-09-04 03:30:08.787	cskh_1@gmail.com	Phê duyệt cửa hàng ID 26ccb7f3-909f-4523-aee7-8a9a1db54990
7e175a59-04d5-4450-a122-5ce2010ad0a7	2026-09-08 08:33:42.829	cskh_1@gmail.com	Phê duyệt cửa hàng ID eec3f3ba-bf12-4643-bff5-580a5d6087b4
77193a65-7261-4c19-8251-bef41ccca47f	2026-09-17 09:52:40.064	cskh_1@gmail.com	Phê duyệt cửa hàng ID 2331d6e1-a082-45e7-8cc8-c2d497ba6832
\.


--
-- Data for Name: Shop; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth."Shop" (id, name, "ownerId", "createdAt", "updatedAt", "responseRate", "responseTime", email, "phoneNumber", "pickupAddress", "shippingSettings", status, logo, description) FROM stdin;
6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	ZeroMall Fashion Hub	5c64ac2d-0123-43c0-86bf-b9495528c27d	2023-06-30 04:38:06.895	2026-06-29 05:17:03.087	98	trong vài giờ	seller1@zeromall.com	12345678	{"fullName":"Chủ Shop Thời Trang","phoneNumber":"12345678","province":"Đồng Nai","district":"Biên Hòa","ward":"Tân Phong","detailAddress":"2D-6 Đường Trần Công An, Phường Tân Phong, Thành Phố Biên Hòa, Tỉnh Đồng Nai","coordinates":{"lat":10.956885873872949,"lng":106.82681802522231}}	{"express":true,"fast":true,"saver":true,"bulky":false}	APPROVED	\N	\N
f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	ZeroMall Home & Kitchen	e62d94af-244c-4d16-9e79-cb23e99f59c1	2025-12-31 04:38:06.906	2026-06-29 05:17:05.191	95	trong vài phút	seller2@zeromall.com	123123123	{"fullName":"Chủ Shop Đồ Gia Dụng","phoneNumber":"123456","province":"Hồ Chí Minh","district":"Phú Nhuận","ward":"Phường 1","detailAddress":"Quán Anh Đạt, 34 Hẻm 30 Đoàn Thị Điểm, Phường 1, Quận Phú Nhuận, Thành Phố Hồ Chí Minh","coordinates":{"lat":10.956885873872949,"lng":106.82681802522231}}	{"express":true,"fast":true,"saver":true,"bulky":false}	APPROVED	\N	\N
d9be6bae-681d-4b47-8e4f-aa95eac1ce49	Shop good HLE	880a2880-43c0-4506-b25a-86dc34299f7b	2026-08-14 15:41:52.252	2026-08-14 15:56:53.166	100	trong vài giờ	minhanh@zeromall.com	0344461922	{"fullName":"Minh Anh","phoneNumber":"0344461922","province":"Hồ Chí Minh","district":"Gò Vấp","ward":"Phường 4","detailAddress":"Nhà C, 4, Nguyễn Văn Bảo, Gò Vấp, Hồ Chí Minh","coordinates":{"lat":10.821944687846669,"lng":106.68726426981377}}	{"express":true,"fast":true,"saver":true,"bulky":false}	APPROVED	\N	\N
b1273c68-dade-4f41-bfc4-bd160e3dd9a6	CUong shop	1f8cace7-86af-49ad-98f6-d6a68fb941e8	2026-08-21 02:54:25.998	2026-08-21 02:54:25.998	100	trong vài giờ	\N	\N	\N	\N	DRAFT	\N	\N
75c99eae-6bb1-4865-9f04-3b928b656b3f	Zero mall	25e85ea6-ad03-4c3c-be4c-4f4eb6701e22	2026-08-29 03:24:15.47	2026-08-29 03:27:10.096	100	trong vài giờ	banhang1@gmail.com	0964579675	{"fullName":"Nguyên Minh Anh","phoneNumber":"0964579675","province":"Hồ Chí Minh","district":"Quận 1","ward":"Đa Kao","detailAddress":"Đường không tên, Đa Kao, Quận 1, Thành phố Hồ Chí Minh","coordinates":{"lat":10.788609160075174,"lng":106.69440006585029}}	{"express":true,"fast":true,"saver":true,"bulky":false}	APPROVED	\N	\N
26ccb7f3-909f-4523-aee7-8a9a1db54990	test 4/9	261f1c44-301b-4f38-a8e2-98aa40b8f205	2026-09-04 02:59:21.428	2026-09-04 03:30:08.76	100	trong vài giờ	bonchin@gmail.com	0964555555	{"fullName":"cuong","phoneNumber":"0964579675","province":"Phú Yên","district":"Huyện Sông Hinh","ward":"Xã Ealy","detailAddress":"ealy","ghnProvinceId":260,"ghnDistrictId":2206,"ghnWardCode":"390608"}	{"express":true,"fast":true,"saver":true,"bulky":false}	APPROVED	\N	\N
eec3f3ba-bf12-4643-bff5-580a5d6087b4	test89	2f45c53c-e05f-4ce0-8dae-473a2d7d64df	2026-09-08 08:32:09.023	2026-09-08 08:33:42.808	100	trong vài giờ	test89@gmail.com	1111111111111111111	{"fullName":"ha noi","phoneNumber":"0100000000","province":"Hà Nội","district":"Huyện Ba Vì","ward":"Thị trấn Tây Đằng","detailAddress":"hanoi","ghnProvinceId":201,"ghnDistrictId":1803,"ghnWardCode":"1B1701","coordinates":{"lat":10.771667923824742,"lng":106.6445576822277}}	{"express":true,"fast":true,"saver":true,"bulky":false}	APPROVED	\N	\N
2331d6e1-a082-45e7-8cc8-c2d497ba6832	test179	2160bae9-7f85-44ab-bd25-e051f42ff047	2026-09-17 09:50:44.151	2026-09-17 09:52:40.047	100	trong vài giờ	test179@gmail.com	0179179179	{"fullName":"test179","phoneNumber":"0179179179","province":"Hà Nội","district":"Huyện Mê Linh","ward":"Thị trấn Quang Minh","detailAddress":"123","ghnProvinceId":201,"ghnDistrictId":1581,"ghnWardCode":"1B2902"}	{"express":false,"fast":false,"saver":true,"bulky":false}	APPROVED	\N	\N
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
2b53c1b3-dc21-49fa-ac72-15cfa4e372b9	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	2331d6e1-a082-45e7-8cc8-c2d497ba6832	2026-09-17 10:40:48.557
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
25e85ea6-ad03-4c3c-be4c-4f4eb6701e22	banhang1@gmail.com	$2b$10$xpwtI8kkPy39cVXzHr6qjOkJTrO0bBO1mxJXblS/AIhFyyP67Vhou	Nguyên Minh Anh	SHOP_OWNER	2026-08-29 03:24:15.467	2026-08-29 03:27:10.101	75c99eae-6bb1-4865-9f04-3b928b656b3f	\N	\N	\N	\N	ACTIVE
261f1c44-301b-4f38-a8e2-98aa40b8f205	bonchin@gmail.com	$2b$10$IXcu1dLAxAwyWol72qssmOg8JXOO/WALWXNHGJ18EJviZScL7tAEy	test bốn chín	SHOP_OWNER	2026-09-04 02:59:21.425	2026-09-04 03:30:08.769	26ccb7f3-909f-4523-aee7-8a9a1db54990	\N	\N	\N	\N	ACTIVE
2f45c53c-e05f-4ce0-8dae-473a2d7d64df	test89@gmail.com	$2b$10$m2EpjMtdpqy9FZ7uAMH2VOXZD8TMs5D82xVXlX30mcTwkzP4ZXkju	test89	SHOP_OWNER	2026-09-08 08:32:09.019	2026-09-08 08:33:42.814	eec3f3ba-bf12-4643-bff5-580a5d6087b4	\N	\N	\N	\N	ACTIVE
driver-user-03-new	shipper3@zeromall.com	$2b$10$j4c0HJNVZcYp2WIvAmXh/uoBT5nCVfmSMU3lK.h2PnNQYL2ECapJu	Lê Hữu Tải	DRIVER	2026-09-09 02:46:26.597	2026-09-09 02:46:26.597	\N	\N	\N	\N	0918567890	ACTIVE
b98d1128-a7b7-4437-9b8c-d71035c0c6c9	vqc142@gmail.com	$2b$10$TjIFTlF82CCZ16oHsqNPyeXz7scjCT6mPwhS3r2.qESAfd89JzAuK	vqc142	BUYER	2026-09-17 09:30:07.698	2026-09-17 09:30:07.698	\N	\N	\N	\N	\N	ACTIVE
2160bae9-7f85-44ab-bd25-e051f42ff047	test179@gmail.com	$2b$10$bRJwrsTWybqFBRYpRqaulePZfiEMKYnIQkRUNdjEkD3ot4Vy8PDx.	test179	SHOP_OWNER	2026-09-17 09:50:44.148	2026-09-17 09:52:40.054	2331d6e1-a082-45e7-8cc8-c2d497ba6832	\N	\N	\N	\N	ACTIVE
\.


--
-- Data for Name: UserAddress; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth."UserAddress" (id, "userId", name, phone, region, details, "isDefault", lat, lng, "ghnDistrictId", "ghnWardCode", "createdAt", "updatedAt") FROM stdin;
1fba2c9c-3a2d-428a-bbad-98d8ff586ffa	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	cuong mua 179	1231231231	Phường 4, Quận Gò Vấp, Thành phố Hồ Chí Minh	Trường Đại học Công nghiệp TP.HCM, Nguyễn Văn Bảo, Phường 4, Gò Vấp, Thành phố Hồ Chí Minh	t	10.822050555073103	106.68688903055863	\N	\N	2026-09-17 13:43:30.382	2026-09-17 13:43:30.382
\.


--
-- Data for Name: Conversation; Type: TABLE DATA; Schema: chat; Owner: postgres
--

COPY chat."Conversation" (id, "buyerId", "shopId", "lastMessage", "lastMessageAt", "unreadBuyerCount", "unreadShopCount", "createdAt", "updatedAt") FROM stdin;
9e933e84-a38b-4e5a-8ced-b8dad1b89cc8	e62d94af-244c-4d16-9e79-cb23e99f59c1	zeromall-official	Cuộc trò chuyện mới được khởi tạo 👋	2026-08-12 18:47:31.754	0	0	2026-08-12 18:47:31.754	2026-08-12 18:47:31.768
4d0898ba-c81f-46d3-a9f0-65428a713ce6	3150f691-6e58-47c7-ad4c-acbd52f027c5	zeromall-official	Cuộc trò chuyện mới được khởi tạo 👋	2026-08-12 18:44:33.108	0	0	2026-08-12 18:44:33.116	2026-08-12 19:21:41.204
c90b9590-6053-4fcd-a0ba-d2c65f5b2281	880a2880-43c0-4506-b25a-86dc34299f7b	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	Cuộc trò chuyện mới được khởi tạo 👋	2026-08-14 15:52:01.97	0	0	2026-08-14 15:52:01.971	2026-08-14 15:52:01.986
16ba14ad-f413-4305-88c4-bb41e8a4f57b	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	PLATFORM_SUPPORT	\N	2026-09-17 09:48:51.395	0	0	2026-09-17 09:48:51.402	2026-09-17 09:48:51.472
8bb0d8cc-1601-41a5-897a-84f35db1886f	f9e9a433-f8eb-4d3c-9b13-278358c4592c	zeromall-official	s	2026-08-16 02:56:47.141	0	1	2026-08-16 02:56:12.049	2026-08-16 02:56:47.141
ae01366f-1d90-41da-9d9e-37e0b525f0cd	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	d9be6bae-681d-4b47-8e4f-aa95eac1ce49	Cuộc trò chuyện mới được khởi tạo 👋	2026-08-16 11:16:05.483	0	0	2026-08-16 11:16:05.484	2026-08-16 11:37:55.659
48ab3e1a-da44-471f-91cd-92974374e344	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	dạ em chào shop	2026-09-17 09:49:12.644	0	2	2026-09-17 09:49:08.588	2026-09-17 13:44:18.891
94684073-df06-43e9-ae15-f10675e60dec	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	2331d6e1-a082-45e7-8cc8-c2d497ba6832	ok chưa	2026-09-17 13:44:14.926	0	2	2026-09-17 13:44:12.388	2026-09-17 13:44:19.672
47286368-549f-48bf-bf57-34b362927a9e	5c64ac2d-0123-43c0-86bf-b9495528c27d	zeromall-official	Cuộc trò chuyện mới được khởi tạo 👋	2026-08-14 07:35:05.781	0	0	2026-08-14 07:35:05.783	2026-08-16 12:42:25.466
30a0a116-9c82-43da-8102-28aafa958692	880a2880-43c0-4506-b25a-86dc34299f7b	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Cuộc trò chuyện mới được khởi tạo 👋	2026-08-14 15:43:56.303	0	0	2026-08-14 15:43:56.305	2026-08-16 12:42:43.814
a5fdb195-5e64-4fa7-b059-f2a67b730546	3150f691-6e58-47c7-ad4c-acbd52f027c5	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	kfkremvg	2026-08-14 15:41:02.827	0	0	2026-08-12 19:06:35.006	2026-08-16 12:42:44.482
b41b364a-9815-4419-8baf-8cb5a2db285a	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	1	2026-08-16 11:42:49.006	0	2	2026-08-16 11:12:40.036	2026-08-16 11:42:49.007
c5b0cf91-7931-4f5b-b6d9-00d89b4c151c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	hi	2026-08-16 11:45:45.668	0	0	2026-08-16 11:15:38.791	2026-08-26 08:56:16.211
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
e22957fa-0fbb-458a-ae01-2bea2391f751	48ab3e1a-da44-471f-91cd-92974374e344	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	BUYER	TEXT	dạ em chào shop	null	f	2026-09-17 09:49:12.632
5dc35f43-5eb6-4bbf-9501-a1fe8076c2ac	48ab3e1a-da44-471f-91cd-92974374e344	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	BUYER	TEXT	dạ em chào shop	null	f	2026-09-17 09:49:12.641
79ae0c9b-2744-45a8-9791-b15f74a66324	94684073-df06-43e9-ae15-f10675e60dec	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	BUYER	TEXT	ok chưa	null	f	2026-09-17 13:44:14.915
19d7125b-9de2-4fe6-a9b7-ea3e842d4e1c	94684073-df06-43e9-ae15-f10675e60dec	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	BUYER	TEXT	ok chưa	null	f	2026-09-17 13:44:14.923
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
c2c5cb0f-a175-477e-8fcd-b2b796f74c3f	61a394df-8186-4681-b7b6-cc87a9d05726	26082903365823351	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	0	0	NOT_APPLICABLE	\N	\N	2026-08-29 03:39:17.255
43e721e7-d01e-4fa8-9d7b-63eab770f487	8979fa95-6a8a-4cdb-9496-966a22f771e9	260908110231387250250	eec3f3ba-bf12-4643-bff5-580a5d6087b4	39700	0	PENDING	\N	\N	2026-09-08 11:40:53.856
f07c36b2-e489-43d0-85b9-c2b3b5fbce70	92c43042-2b74-4b27-9071-5be36c0fc6c5	260908110231416377915	26ccb7f3-909f-4523-aee7-8a9a1db54990	47700	0	PENDING	\N	\N	2026-09-09 08:39:00.878
0dcbf9fd-9469-45a7-a9c2-eb5199c31857	a88c7940-36be-48c6-a429-42215f186b40	260917134355381382706	2331d6e1-a082-45e7-8cc8-c2d497ba6832	0	0	NOT_APPLICABLE	\N	\N	2026-09-18 04:19:32.449
b325b0db-458b-44a4-9c3b-20bd27269174	b39b0699-86e0-485d-8ee3-ef70809438ff	260918053648198398587	2331d6e1-a082-45e7-8cc8-c2d497ba6832	0	0	NOT_APPLICABLE	\N	\N	2026-09-18 05:48:55.075
\.


--
-- Data for Name: DeliveryAssignment; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."DeliveryAssignment" (id, "shipmentId", "driverId", type, status, note, "assignedAt", "completedAt", "proofImage") FROM stdin;
51533878-ff73-46cb-84e9-f6ed5c148d97	5469cdb7-8233-4ed3-999f-f01060e8b288	driver-01	DELIVERY	ASSIGNED	\N	2026-08-21 15:49:20.578	\N	\N
6efd029e-a6e7-4656-b4c3-12a8c9a2a1e6	686f6a7d-702d-454e-a648-cc198efff031	driver-01	DELIVERY	ASSIGNED	\N	2026-08-21 15:49:20.578	\N	\N
92185025-ef72-4452-a09b-465fa0a70cfc	c7061a81-17bf-4560-8e1c-faab69f42942	driver-02	PICKUP	ASSIGNED	\N	2026-08-21 15:56:46.179	\N	\N
64cdb1e6-26a3-4797-8b5f-65305f579b5b	95d0d3b7-3825-464f-9cb4-a3923a233df5	driver-02	PICKUP	IN_PROGRESS	\N	2026-08-21 15:56:46.179	\N	\N
a7a736a3-94f5-4dbf-9843-bdc321aaf9d7	5f103e88-7d37-4a3b-bbb2-4f187461a9fd	driver-02	DELIVERY	ASSIGNED	\N	2026-08-23 11:04:45.289	\N	\N
50e4572e-a52c-4e1e-80c2-4fc5d53ef43e	56a0ba85-7207-45ff-924a-38504685b7f8	driver-02	PICKUP	IN_PROGRESS	\N	2026-08-21 15:56:46.179	\N	\N
b6e8dd94-9764-477d-bd98-f5b86198b8ee	3f223856-b214-4732-9cf3-b9256ed74e85	driver-01	DELIVERY	CANCELLED	Tài xế từ chối nhận cuốc	2026-08-21 15:49:20.578	\N	\N
4f39a740-60fa-43ca-a8e0-e195124f12be	a1a5c840-4da4-4568-8ba0-c191a4f0da0a	driver-02	PICKUP	ASSIGNED	\N	2026-08-23 11:04:45.289	\N	\N
eacfd8b8-cf11-4727-96a1-d5f45cd438ad	67247e2c-ca42-4f28-8393-c1cf59fd01f5	driver-01	PICKUP	ASSIGNED	\N	2026-08-23 12:01:51.268	\N	\N
a8a507f5-a850-4983-8f86-16aae9e54527	8e1c93a2-e180-4ef7-9be0-5c36e7fa3dd3	driver-02	PICKUP	ASSIGNED	\N	2026-08-23 12:06:00.673	\N	\N
dc9a2a11-fbf1-4f34-80d9-23cf97409b24	61a394df-8186-4681-b7b6-cc87a9d05726	driver-02	PICKUP	ASSIGNED	\N	2026-09-04 02:48:57.187	\N	\N
6543bcb7-1217-4206-af7c-5a663afd265c	17091b7c-bb40-40dc-8e87-7397c0073e74	driver-01	PICKUP	ASSIGNED	\N	2026-09-09 04:03:01.177	\N	\N
54d72a60-cc69-42ec-9bcd-76b6e9b67c72	1f3f1d51-d488-4724-9b8b-2c8b106f58ff	driver-01	PICKUP	ASSIGNED	\N	2026-09-09 04:03:01.193	\N	\N
d0c69ef5-19f5-417d-9f8d-f128f077784d	2c8263db-829e-4668-a686-587b92094626	driver-01	PICKUP	ASSIGNED	\N	2026-09-09 04:03:01.196	\N	\N
a5aec384-dd46-4b8b-bbdd-af2dc1d3981d	555a421f-3db0-40e5-aca5-8ca4e6c29092	driver-01	PICKUP	ASSIGNED	\N	2026-09-09 04:03:01.198	\N	\N
1f90016a-5252-4b9d-9781-a7d9b2957bdf	b3dbe83e-d8ff-4c73-9e8f-5bc4dcf7305e	driver-01	PICKUP	ASSIGNED	\N	2026-09-09 04:03:01.202	\N	\N
1c7bde49-b32a-4f09-9677-67e7d7a0305d	f9fc945f-ee73-40df-a1bf-41bc76bc522b	driver-01	PICKUP	ASSIGNED	\N	2026-09-09 04:03:01.205	\N	\N
1bbcc39c-2be1-414b-97b9-c34ed3f746b6	8979fa95-6a8a-4cdb-9496-966a22f771e9	driver-03	PICKUP	COMPLETED	\N	2026-09-09 04:18:42.89	2026-09-09 04:46:15.481	data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QBMRXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAACgKADAAQAAAABAAAB4AAAAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/8AAEQgB4AKAAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/bAEMAAQEBAQEBAgEBAgMCAgIDBAMDAwMEBgQEBAQEBgcGBgYGBgYHBwcHBwcHBwgICAgICAkJCQkJCwsLCwsLCwsLC//bAEMBAgICAwMDBQMDBQsIBggLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLC//dAAQAKP/aAAwDAQACEQMRAD8A/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//0P8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9H/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//S/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//0/8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9T/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//V/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//1v8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9f/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//Q/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//0f8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9L/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//T/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//1P8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9X/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//W/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//1/8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9D/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//R/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//0v8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9P/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//U/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//1f8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9b/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//X/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//0P8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9H/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//S/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//0/8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9T/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//Z
3b6b5153-55a1-4155-b6fa-6a9d57993362	8979fa95-6a8a-4cdb-9496-966a22f771e9	driver-01	DELIVERY	ASSIGNED	\N	2026-09-09 09:52:50.45	\N	\N
1aabb40f-5ae8-451e-b6f3-2771454901ae	a88c7940-36be-48c6-a429-42215f186b40	driver-03	PICKUP	COMPLETED	\N	2026-09-18 04:33:21.422	2026-09-18 04:33:47.936	data:image/jpeg;base64,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
4df49530-04f6-44bf-8d0e-db81938c3d1f	b39b0699-86e0-485d-8ee3-ef70809438ff	driver-03	PICKUP	COMPLETED	\N	2026-09-18 05:48:55.112	2026-09-18 05:50:15.843	data:image/jpeg;base64,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
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
driver-02	driver-user-02	Trần Đình Phát (SPX 02)	0912345678	MOTORBIKE	60-F2 888.99	hub-dn-01	OFFLINE	\N	\N	2026-08-21 15:00:36.447	2026-08-23 11:05:56.988	Thành phố Biên Hòa, Tân Phong, Tam Hiệp	Biên Hòa	Đồng Nai
driver-01	driver-user-01	Nguyễn Văn Giao (SPX 01)	0908123456	MOTORBIKE	59-A1 123.45	hub-hcm-01	AVAILABLE	10.8014	106.6538	2026-08-21 15:00:36.447	2026-09-09 04:03:01.164	Quận Tân Bình, Quận 10, Quận Phú Nhuận	Tân Bình	Hồ Chí Minh
driver-03	driver-user-03-new	Lê Hữu Tải (ZMX Van)	0987654321	VAN	51D-999.88	hub-hn-01	AVAILABLE	21.1837	105.7196	2026-08-21 15:00:36.447	2026-09-18 04:33:21.404	Huyện Mê Linh, Quận Cầu Giấy, Hà Nội	Mê Linh	Hà Nội
driver-truck-hn	\N	Trần Quốc Bảo (ZMX Linehaul 15T)	0912.888.999	TRUCK	29C-888.99	hub-hn-01	AVAILABLE	\N	\N	2026-09-18 06:34:50.993	2026-09-18 06:34:50.993	Tuyến Bắc - Nam (Hà Nội ➔ TP.HCM)	\N	Hà Nội
driver-truck-hcm	\N	Nguyễn Hữu Nam (3PL Indo-Trans 20ft)	0903.112.233	TRUCK	51C-777.66	hub-hcm-01	AVAILABLE	\N	\N	2026-09-18 06:34:50.993	2026-09-18 06:34:50.993	Tuyến Nam - Bắc (TP.HCM ➔ Hà Nội)	\N	Hồ Chí Minh
driver-truck-dn	\N	Đặng Văn Hùng (ZMX Linehaul 8T)	0937.668.899	TRUCK	60C-555.44	hub-dn-01	AVAILABLE	\N	\N	2026-09-18 06:34:50.993	2026-09-18 06:34:50.993	Tuyến Đông Nam Bộ (Đồng Nai ➔ TP.HCM)	\N	Đồng Nai
\.


--
-- Data for Name: DriverAttendance; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."DriverAttendance" (id, "driverId", "hubId", "checkInAt", "checkOutAt", "faceImage", latitude, longitude, "distanceToHub", status, note, "createdAt") FROM stdin;
d90930da-51b8-4eb2-b1b0-99a07f81eadb	driver-03	hub-hn-01	2026-09-09 03:59:53.833	2026-09-09 04:01:27.619	\N	21.1837	105.7196	0	CHECKED_OUT	Điểm danh ca sáng 07:30 tại Mê Linh Hub	2026-09-09 03:59:53.833
cf41bd60-723b-4da2-91bf-3abde65438df	driver-01	hub-hcm-01	2026-09-09 04:03:01.163	\N	\N	10.8014	106.6538	0	CHECKED_IN	Điểm danh ca sáng tại Kho Tổng Tân Bình SOC	2026-09-09 04:03:01.163
3a428bd2-7ebd-455f-99a2-b5978cec9d1b	driver-03	hub-hn-01	2026-09-09 04:05:05.417	2026-09-09 04:05:10.927	data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QBMRXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAACgKADAAQAAAABAAAB4AAAAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/8AAEQgB4AKAAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/bAEMAAQEBAQEBAgEBAgMCAgIDBAMDAwMEBgQEBAQEBgcGBgYGBgYHBwcHBwcHBwgICAgICAkJCQkJCwsLCwsLCwsLC//bAEMBAgICAwMDBQMDBQsIBggLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLC//dAAQAKP/aAAwDAQACEQMRAD8A/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//0P8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9H/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//S/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//0/8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9T/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//V/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//1v8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9f/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//Q/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//0f8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9L/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//T/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//1P8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9X/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//W/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//1/8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9D/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//R/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//0v8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9P/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//U/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//1f8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9b/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//X/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//0P8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9H/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//S/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//0/8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9T/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//Z	21.1837	105.7196	0	CHECKED_OUT	Điểm danh ca sáng - Khoảng cách 20m	2026-09-09 04:05:05.417
f449599d-a4f7-4552-a393-390cd86e3b35	driver-03	hub-hn-01	2026-09-09 04:06:46.906	2026-09-09 04:10:16.83	data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=	21.1837	105.7196	0	CHECKED_OUT	Điểm danh tại Bưu cục thành công	2026-09-09 04:06:46.906
7b76542b-ca79-4d5d-b1cc-1943b42738fb	driver-03	hub-hn-01	2026-09-09 04:18:42.866	2026-09-09 09:45:37.443	data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QBMRXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAACgKADAAQAAAABAAAB4AAAAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/8AAEQgB4AKAAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/bAEMAAQEBAQEBAgEBAgMCAgIDBAMDAwMEBgQEBAQEBgcGBgYGBgYHBwcHBwcHBwgICAgICAkJCQkJCwsLCwsLCwsLC//bAEMBAgICAwMDBQMDBQsIBggLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLC//dAAQAKP/aAAwDAQACEQMRAD8A/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//0P8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9H/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//S/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//0/8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9T/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//V/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//1v8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9f/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//Q/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//0f8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9L/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//T/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//1P8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9X/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//W/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//1/8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9D/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//R/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//0v8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9P/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//U/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//1f8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9b/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//X/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//0P8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9H/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//S/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//0/8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9T/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//Z	21.1837	105.7196	0	CHECKED_OUT	Điểm danh ca sáng - Khoảng cách 20m	2026-09-09 04:18:42.866
be540ab6-b54f-4442-abd3-467d6ab404ca	driver-03	hub-hn-01	2026-09-18 04:33:21.392	\N	data:image/jpeg;base64,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	21.1837	105.7196	0	CHECKED_IN	Điểm danh ca sáng - Khoảng cách 20m	2026-09-18 04:33:21.392
\.


--
-- Data for Name: Hub; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."Hub" (id, code, name, address, province, district, ward, latitude, longitude, type, status, "createdAt", "updatedAt") FROM stdin;
hub-hcm-01	HCM01	Kho Tổng Tân Bình SOC	123 Trường Chinh, P. 15	Hồ Chí Minh	Quận Tân Bình	\N	10.8014	106.6538	SORTING_CENTER	ACTIVE	2026-08-21 15:00:36.447	2026-08-21 15:00:36.447
hub-dn-01	DN01	Bưu Cục Giao Hàng Biên Hòa Hub	45 Phạm Văn Thuận, Tân Phong	Đồng Nai	TP. Biên Hòa	\N	10.9574	106.8427	DESTINATION_HUB	ACTIVE	2026-08-21 15:00:36.447	2026-08-21 15:00:36.447
hub-hn-01	HN01	Kho Trung Chuyển Mê Linh SOC	Khu Công Nghiệp Quang Minh	Hà Nội	Huyện Mê Linh	\N	21.1837	105.7196	SORTING_CENTER	ACTIVE	2026-08-21 15:00:36.447	2026-08-21 15:00:36.447
\.


--
-- Data for Name: HubScan; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."HubScan" (id, "shipmentId", "hubId", "scanType", "staffId", note, "createdAt") FROM stdin;
020180b2-2177-43d3-964a-05a4e798ec76	95d0d3b7-3825-464f-9cb4-a3923a233df5	hub-hcm-01	AT_ORIGIN_HUB	\N	\N	2026-08-21 16:07:03.973
3ebc0594-37ed-46e9-9155-afae2306e722	95d0d3b7-3825-464f-9cb4-a3923a233df5	hub-hcm-01	AT_ORIGIN_HUB	\N	\N	2026-08-26 09:41:58.955
a51aacba-153b-484f-bbfc-85c1cff8dda0	95d0d3b7-3825-464f-9cb4-a3923a233df5	hub-hcm-01	AT_ORIGIN_HUB	\N	\N	2026-08-26 09:42:57.132
ea01bd21-9f2b-41a8-93ab-d155111e68bc	95d0d3b7-3825-464f-9cb4-a3923a233df5	hub-hcm-01	IN_TRANSIT	\N	\N	2026-08-26 09:43:44.756
1e57fa7f-fa25-4dd3-a7a9-3a5d184ec06e	8979fa95-6a8a-4cdb-9496-966a22f771e9	hub-hn-01	AT_ORIGIN_HUB	\N	\N	2026-09-09 08:37:05.938
cbad0417-ca5d-4edf-b13e-7b7027462db2	8979fa95-6a8a-4cdb-9496-966a22f771e9	hub-hn-01	IN_TRANSIT	\N	Xuất xe Linehaul: [29C-888.99] • Bác tài: Nguyễn Văn Tuấn • Seal: SEAL-HN01-HCM01-1544	2026-09-09 09:44:02.01
b30d4912-6d9e-4d09-8f20-55e64a578cd1	8979fa95-6a8a-4cdb-9496-966a22f771e9	hub-hcm-01	AT_DESTINATION_HUB	\N	Xe tải [29C-888.99] đã đến. Nhân viên bưu cục [Trần Văn Kho (Tân Bình SOC)] đã đối soát & nhập bưu cục phát Kho Tổng Tân Bình SOC	2026-09-09 09:52:04.189
90c6b20f-03ab-460e-a29c-905a57ba5636	a88c7940-36be-48c6-a429-42215f186b40	hub-hn-01	AT_ORIGIN_HUB	\N	\N	2026-09-18 05:10:58.994
e192406a-8b1d-4451-956d-380163cfcb1b	b39b0699-86e0-485d-8ee3-ef70809438ff	hub-hn-01	AT_ORIGIN_HUB	\N	Nhân viên kho [Phạm Minh Bắc (Mê Linh SOC)] đã quét nhận bàn giao từ Shipper về Kho Trung Chuyển Mê Linh SOC	2026-09-18 05:51:02.006
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
b532604d-d8ac-4ce6-a14d-ba85113dfb35	61a394df-8186-4681-b7b6-cc87a9d05726	0.5	15	10	10	STANDARD	677400	f	f	f	\N	cuong x1, giày sneaker x5
1334d499-7e49-4fc0-8466-74695b93181c	8979fa95-6a8a-4cdb-9496-966a22f771e9	0.5	15	10	10	STANDARD	39700	f	f	f	\N	test89 x1
058788cc-4fa2-4e7b-ada0-590a8fe28f8c	92c43042-2b74-4b27-9071-5be36c0fc6c5	0.5	15	10	10	STANDARD	47700	f	f	f	\N	test 4/9 x1
93f0b8e7-3990-4b51-a251-8fcaa7682fd1	a88c7940-36be-48c6-a429-42215f186b40	0.5	15	10	10	STANDARD	26000	f	f	f	\N	test 179 x2
8a59420a-00fd-4fd7-93bb-15da0f2ca541	b39b0699-86e0-485d-8ee3-ef70809438ff	0.5	15	10	10	STANDARD	59000	f	f	f	\N	test 189 x1, test 179 x1
\.


--
-- Data for Name: Return; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."Return" (id, "orderId", "shipmentId", "sellerId", "buyerId", reason, status, "returnShippingFee", "createdAt", "completedAt", "buyerShipDeadline", "csAgentId", "csNote", "reasonDetail", "refundAmount", resolution, "returnMethod", "returnNumber", "returnTrackingNumber", "sellerDeadline", "sellerInspectDeadline", "sellerNote", "sellerShippingCharge", "updatedAt") FROM stdin;
f6729851-11e9-4e2e-a7b8-bc80132e6bb4	26082903365823351	61a394df-8186-4681-b7b6-cc87a9d05726	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	Hàng bể vỡ do vận chuyển	COMPLETED	0	2026-09-16 16:40:52.578	2026-09-16 16:44:16.788	2026-09-22 16:41:34.921	\N	\N	Kiện hàng mở ra bị móp méo và vỡ góc.	122000	RETURN_REFUND	ZMX_PICKUP	RTN2609165259	RTX2609165573	2026-09-18 16:40:52.559	2026-09-18 16:43:50.03	Hàng còn nguyên đai nguyên kiện, cho phép nhập lại kho	0	2026-09-16 16:44:16.788
3282f978-6518-4cc2-8366-03a349a20a59	26081408390084529	2a2bace0-c5d1-4463-9f79-45054ec59b87	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	3150f691-6e58-47c7-ad4c-acbd52f027c5	Hàng không đúng mô tả	REJECTED	0	2026-09-16 16:46:03.633	2026-09-16 16:46:56.136	2026-09-22 16:46:03.706	CS_SPECIALIST_ZERO	Shop cung cấp video mở hộp nguyên seal vận đơn RTX, bên trong thực tế là đồ rác. Phán quyết người bán thắng kiện.	Màu sắc thực tế không giống trên hình chụp	320000	RETURN_REFUND	ZMX_PICKUP	RTN2609168707	RTX2609161349	2026-09-18 16:46:03.629	2026-09-18 16:46:03.749	Người mua tráo kiện hàng, bên trong là áo rách cũ chứ không phải chiếc váy của shop!	0	2026-09-16 16:46:56.136
\.


--
-- Data for Name: ReturnEvidence; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."ReturnEvidence" (id, "returnId", "uploadedBy", "fileUrl", "fileType", description, "createdAt") FROM stdin;
271cc6ef-594a-4e64-a471-7fcecc8b699e	f6729851-11e9-4e2e-a7b8-bc80132e6bb4	BUYER	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	IMAGE	Ảnh chụp góc vỡ	2026-09-16 16:40:52.578
b164fc36-a763-46be-9392-a4cd1a46c17c	3282f978-6518-4cc2-8366-03a349a20a59	SELLER	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	IMAGE	Người mua tráo kiện hàng, bên trong là áo rách cũ chứ không phải chiếc váy của shop!	2026-09-16 16:46:03.761
\.


--
-- Data for Name: ReturnItem; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."ReturnItem" (id, "returnId", "orderItemId", "productId", "productName", "productImage", variant, price, quantity, "refundAmount") FROM stdin;
f7839b75-7107-462f-99b2-b2c8fc68bbe1	f6729851-11e9-4e2e-a7b8-bc80132e6bb4	80af33cb-c757-46bb-83b7-f20f528ac935	130c82e3-a2ef-437e-8e77-a6da1ab4af5b	cuong	\N	\N	2000	1	2000
88c741b6-d764-4f93-9c1a-522816f81b39	3282f978-6518-4cc2-8366-03a349a20a59	a2d336d5-791a-46dc-85a0-fc08ecf881f0	bcba9294-1540-4629-a1f4-21ea531b21d8	Váy Tay Bồng Dáng Xòe	\N	\N	320000	1	320000
\.


--
-- Data for Name: ReturnNegotiation; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."ReturnNegotiation" (id, "returnId", "proposedBy", "proposedAmount", message, status, "createdAt") FROM stdin;
\.


--
-- Data for Name: SellerAddress; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."SellerAddress" (id, "sellerId", name, "contactName", phone, address, province, district, ward, latitude, longitude, "isDefault", "createdAt", "updatedAt") FROM stdin;
addr-shop-fashion	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Kho Thời Trang Biên Hòa	Chủ Shop Fashion	0964579675	2D-6 Đường Trần Công An, Phường Tân Phong, Thành Phố Biên Hòa, Tỉnh Đồng Nai	Đồng Nai	Biên Hòa	Tân Phong	\N	\N	t	2026-08-23 11:53:29.785	2026-08-23 11:53:29.785
addr-shop-home	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	Kho Gia Dụng Phú Nhuận	Chủ Shop Gia Dụng	0912345678	Quán Anh Đạt, 34 Hẻm 30 Đoàn Thị Điểm, Phường 1, Quận Phú Nhuận, Thành Phố Hồ Chí Minh	Hồ Chí Minh	Phú Nhuận	Phường 1	\N	\N	t	2026-08-23 11:53:29.785	2026-08-23 11:53:29.785
f5cf820e-d76f-4413-86eb-d77e30eec403	75c99eae-6bb1-4865-9f04-3b928b656b3f	Zero mall	Nguyên Minh Anh	0964579675	Đường không tên, Đa Kao, Quận 1, Thành phố Hồ Chí Minh	Hồ Chí Minh	Quận 1	Đa Kao	10.788609160075174	106.69440006585029	t	2026-09-04 02:54:33.487	2026-09-04 02:54:33.487
e4d6de24-bdef-4f5d-b2d6-7aa6804d171a	d9be6bae-681d-4b47-8e4f-aa95eac1ce49	Shop good HLE	Minh Anh	0344461922	Nhà C, 4, Nguyễn Văn Bảo, Gò Vấp, Hồ Chí Minh	Hồ Chí Minh	Gò Vấp	Phường 4	10.821944687846669	106.68726426981377	t	2026-09-09 02:34:35.463	2026-09-09 02:34:35.463
990eb0c3-171c-4170-a23d-fc32a1374427	26ccb7f3-909f-4523-aee7-8a9a1db54990	test 4/9	cuong	0964579675	ealy	Phú Yên	Huyện Sông Hinh	Xã Ealy	\N	\N	t	2026-09-09 08:39:00.872	2026-09-09 08:39:00.872
15ed8b31-edcf-4199-ba09-9dd3feac1912	eec3f3ba-bf12-4643-bff5-580a5d6087b4	test89	ha noi	0100000000	hanoi	Hà Nội	Huyện Ba Vì	Thị trấn Tây Đằng	21.15	105.38	t	2026-09-08 11:40:53.842	2026-09-08 11:40:53.842
77cb3e4d-3211-4940-b2ea-257e96984207	2331d6e1-a082-45e7-8cc8-c2d497ba6832	test179	test179	0179179179	123	Hà Nội	Huyện Mê Linh	Thị trấn Quang Minh	\N	\N	t	2026-09-17 13:44:03.558	2026-09-17 13:44:03.558
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
92c43042-2b74-4b27-9071-5be36c0fc6c5	260908110231416377915	26ccb7f3-909f-4523-aee7-8a9a1db54990	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2609096075	990eb0c3-171c-4170-a23d-fc32a1374427	es, Thạnh Mỹ Tây, , Thành phố Hồ Chí Minh	c	11111111111	47700	47700	25000	ZMX	WAITING_PICKUP	hub-hcm-01	\N	\N	2026-09-09 08:39:00.878	2026-09-09 08:39:00.9
a88c7940-36be-48c6-a429-42215f186b40	260917134355381382706	2331d6e1-a082-45e7-8cc8-c2d497ba6832	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	ZMX2609185743	77cb3e4d-3211-4940-b2ea-257e96984207	Trường Đại học Công nghiệp TP.HCM, Nguyễn Văn Bảo, Phường 4, Gò Vấp, Thành phố Hồ Chí Minh, Phường 4, Quận Gò Vấp, Thành phố Hồ Chí Minh	cuong mua 179	1231231231	26000	0	22000	ZMX	AT_ORIGIN_HUB	hub-hn-01	2026-09-18 04:33:47.923	\N	2026-09-18 04:19:32.449	2026-09-18 05:10:58.984
3f223856-b214-4732-9cf3-b9256ed74e85	TEST-SPX-001	seller-test-01	buyer-test-01	ZMX2608217824	\N	Số 120 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh	Trần Thị Lan	0988776655	350000	350000	25000	ZMX	AT_DESTINATION_HUB	hub-hcm-01	\N	2026-08-21 15:05:05.684	2026-08-21 15:04:30.39	2026-08-23 11:29:00.373
5469cdb7-8233-4ed3-999f-f01060e8b288	26081408234506930	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	3150f691-6e58-47c7-ad4c-acbd52f027c5	ZMX2608142751	addr-shop-fashion	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	minhanh	0344461922	241500	0	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-08-14 08:23:45.082	2026-08-14 08:23:45.082
17091b7c-bb40-40dc-8e87-7397c0073e74	260620102938	0a2c2409-6fcc-4582-9b98-e622e37c6774	e9cd2310-7eb9-4ce5-ba8e-7e9e1f815d2d	ZMX2606204751	\N	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	457700	0	25000	ZMX	PICKUP_ASSIGNED	hub-hcm-01	\N	\N	2026-06-20 12:03:02.146	2026-09-09 04:03:01.188
67247e2c-ca42-4f28-8393-c1cf59fd01f5	260629591100	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	3150f691-6e58-47c7-ad4c-acbd52f027c5	ZMX2606291588	addr-shop-home	Đường không tên, Phú Lâm, An Giang, Phú Lâm, Phú Tân, An Giang	Quang Hiệp	(+84) 964 579 875	450000	450000	25000	ZMX	WAITING_PICKUP	hub-hcm-01	\N	\N	2026-06-29 05:59:11.677	2026-06-29 05:59:11.677
2c8263db-829e-4668-a686-587b92094626	260719011826	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2607197067	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	4700	0	25000	ZMX	PICKUP_ASSIGNED	hub-hcm-01	\N	\N	2026-07-19 01:18:26.99	2026-09-09 04:03:01.196
c7061a81-17bf-4560-8e1c-faab69f42942	260717053934	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2607176584	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	487700	0	25000	ZMX	CREATED	hub-hcm-01	\N	\N	2026-07-17 05:39:34.039	2026-07-17 05:39:34.039
0dbda82e-4218-4519-9f70-3f72a131db4d	260717060418	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2607172323	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	4700	0	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-07-17 06:04:18.517	2026-07-17 06:04:18.517
455b88b8-ed1b-4c68-a3d9-ad1186e6d911	260717060402	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2607172269	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	4700	4700	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-07-17 06:04:02.428	2026-07-17 06:04:02.428
f9fc945f-ee73-40df-a1bf-41bc76bc522b	260629060925	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	3150f691-6e58-47c7-ad4c-acbd52f027c5	ZMX2606298706	addr-shop-home	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	617700	0	25000	ZMX	PICKUP_ASSIGNED	hub-hcm-01	\N	\N	2026-06-29 06:09:25.89	2026-09-09 04:03:01.206
b39b0699-86e0-485d-8ee3-ef70809438ff	260918053648198398587	2331d6e1-a082-45e7-8cc8-c2d497ba6832	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	ZMX2609188249	77cb3e4d-3211-4940-b2ea-257e96984207	Trường Đại học Công nghiệp TP.HCM, Nguyễn Văn Bảo, Phường 4, Gò Vấp, Thành phố Hồ Chí Minh, Phường 4, Quận Gò Vấp, Thành phố Hồ Chí Minh	cuong mua 179	1231231231	59000	0	37000	ZMX	AT_ORIGIN_HUB	hub-hn-01	2026-09-18 05:50:15.834	\N	2026-09-18 05:48:55.075	2026-09-18 05:51:01.995
a9b157d2-b499-48f8-9630-711b52f731c7	260717060050	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2607172059	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	4700	0	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-07-17 06:00:50.241	2026-07-17 06:00:50.241
9f7c1701-38e8-4724-aa28-60b974b97cf6	260630113938	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2606304262	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	487700	487700	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-06-30 11:39:38.796	2026-06-30 11:39:38.796
aff4ed4a-5d1d-4d28-91d7-30dd4c395409	260629061107	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	3150f691-6e58-47c7-ad4c-acbd52f027c5	ZMX2606298304	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	487700	0	25000	ZMX	OUT_FOR_DELIVERY	hub-hcm-01	\N	\N	2026-06-29 06:11:07.962	2026-08-21 15:52:04.78
56a0ba85-7207-45ff-924a-38504685b7f8	260717055639	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2607178865	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	39700	0	25000	ZMX	PICKED_UP	hub-hcm-01	2026-08-23 11:06:03.742	\N	2026-07-17 05:56:39.131	2026-08-23 11:06:03.748
686f6a7d-702d-454e-a648-cc198efff031	26081219054531939	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	3150f691-6e58-47c7-ad4c-acbd52f027c5	ZMX2608128386	addr-shop-fashion	151 Nguyễn Kim, Phường 7, Quận 10, Hồ Chí Minh, Phường 7, Quận 10, Hồ Chí Minh	minhanh	0344461922	450000	450000	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-08-12 19:05:45.329	2026-08-12 19:05:45.329
95d0d3b7-3825-464f-9cb4-a3923a233df5	260717055720	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2607175882	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	4700	0	25000	ZMX	IN_TRANSIT	hub-hcm-01	2026-08-21 16:03:20.73	\N	2026-07-17 05:57:20.525	2026-08-26 09:43:44.751
b3dbe83e-d8ff-4c73-9e8f-5bc4dcf7305e	26081602571961548	d9be6bae-681d-4b47-8e4f-aa95eac1ce49	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2608167312	e4d6de24-bdef-4f5d-b2d6-7aa6804d171a	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	237700	237700	25000	ZMX	PICKUP_ASSIGNED	hub-hcm-01	\N	\N	2026-08-16 02:57:19.664	2026-09-09 04:03:01.202
6963ca7b-efef-4c35-a1f7-a96ef7252d4b	26081219040078621	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	3150f691-6e58-47c7-ad4c-acbd52f027c5	ZMX2608125741	addr-shop-fashion	151 Nguyễn Kim, Phường 7, Quận 10, Hồ Chí Minh, Phường 7, Quận 10, Hồ Chí Minh	minhanh	0344461922	250000	0	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-08-12 19:04:00.797	2026-08-12 19:04:00.797
3ce0a0fc-f266-4161-9f63-044b795e5d44	26081219201633973	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	3150f691-6e58-47c7-ad4c-acbd52f027c5	ZMX2608122053	addr-shop-fashion	151 Nguyễn Kim, Phường 7, Quận 10, Hồ Chí Minh, Phường 7, Quận 10, Hồ Chí Minh	minhanh	0344461922	18500	18500	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-08-12 19:20:16.354	2026-08-12 19:20:16.354
edd8f689-0329-48d6-906c-f0b7349d3b9e	26081218460363381	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	3150f691-6e58-47c7-ad4c-acbd52f027c5	ZMX2608128411	addr-shop-fashion	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	minhanh	0344461922	2000	2000	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-08-12 18:46:03.711	2026-08-12 18:46:03.711
bcb26c4f-4551-49db-bb0a-4c6f632f2e6f	260717060031	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2607174341	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	4700	4700	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-07-17 06:00:31.751	2026-07-17 06:00:31.751
3a348910-2a6f-4d0c-a7e3-dd611bbf193f	260629600135	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	3150f691-6e58-47c7-ad4c-acbd52f027c5	ZMX2606299259	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	487700	487700	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-06-29 06:00:13.561	2026-06-29 06:00:13.561
7a789292-f96b-4683-b460-5aadfd80b713	26081407384657547	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	3150f691-6e58-47c7-ad4c-acbd52f027c5	ZMX2608147050	addr-shop-fashion	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	minhanh	0344461922	216500	0	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-08-14 07:38:46.666	2026-08-14 07:38:46.666
2a2bace0-c5d1-4463-9f79-45054ec59b87	26081408390084529	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	3150f691-6e58-47c7-ad4c-acbd52f027c5	ZMX2608148679	addr-shop-fashion	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	minhanh	0344461922	286500	286500	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-08-14 08:39:00.856	2026-08-14 08:39:00.856
eb726f71-1af4-412a-8bab-fc1637c2e001	26081415590264558	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	880a2880-43c0-4506-b25a-86dc34299f7b	ZMX2608142776	addr-shop-fashion	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	minhanh	0344461922	91500	0	25000	ZMX	DELIVERED	hub-hcm-01	\N	\N	2026-08-14 15:59:02.658	2026-08-14 15:59:02.658
a1a5c840-4da4-4568-8ba0-c191a4f0da0a	26081613042232789	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2608161782	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	39700	0	25000	ZMX	WAITING_PICKUP	hub-hcm-01	\N	\N	2026-08-16 13:04:22.343	2026-08-16 13:04:22.343
5f103e88-7d37-4a3b-bbb2-4f187461a9fd	26081613051819386	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2608162333	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	39700	0	25000	ZMX	OUT_FOR_DELIVERY	hub-hcm-01	\N	\N	2026-08-16 13:05:18.217	2026-08-16 13:05:18.217
8e1c93a2-e180-4ef7-9be0-5c36e7fa3dd3	26082311485056556	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2608236199	addr-shop-fashion	3D Lê Lợi, Phường 4, Gò Vấp, Thành phố Hồ Chí Minh	Minh Anh	0964579675	215500	0	25000	ZMX	PICKUP_ASSIGNED	hub-hcm-01	\N	\N	2026-08-23 11:49:23.906	2026-08-23 11:49:23.906
1f3f1d51-d488-4724-9b8b-2c8b106f58ff	26081415440545296	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	880a2880-43c0-4506-b25a-86dc34299f7b	ZMX2608142083	addr-shop-fashion	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	minhanh	0344461922	2000	0	25000	ZMX	PICKUP_ASSIGNED	hub-hcm-01	\N	\N	2026-08-14 15:44:05.515	2026-09-09 04:03:01.193
555a421f-3db0-40e5-aca5-8ca4e6c29092	26081415522442674	f6a2e22d-1654-48cb-a55b-7ac58e0fa78a	880a2880-43c0-4506-b25a-86dc34299f7b	ZMX2608148644	addr-shop-home	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	minhanh	0344461922	256500	256500	25000	ZMX	PICKUP_ASSIGNED	hub-hcm-01	\N	\N	2026-08-14 15:52:24.44	2026-09-09 04:03:01.199
8979fa95-6a8a-4cdb-9496-966a22f771e9	260908110231387250250	eec3f3ba-bf12-4643-bff5-580a5d6087b4	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2609085688	15ed8b31-edcf-4199-ba09-9dd3feac1912	es, Thạnh Mỹ Tây, , Thành phố Hồ Chí Minh	c	11111111111	39700	39700	37700	ZMX	OUT_FOR_DELIVERY	hub-hcm-01	2026-09-09 04:46:15.455	\N	2026-09-08 11:40:53.856	2026-09-09 09:52:50.452
61a394df-8186-4681-b7b6-cc87a9d05726	26082903365823351	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	ZMX2608294344	addr-shop-fashion	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	Vũ quốc cường	(+84) 964 579 875	677400	0	25000	ZMX	PICKUP_ASSIGNED	hub-dn-01	\N	\N	2026-08-29 03:39:17.255	2026-09-04 02:48:57.2
\.


--
-- Data for Name: ShipmentTracking; Type: TABLE DATA; Schema: delivery; Owner: postgres
--

COPY delivery."ShipmentTracking" (id, "shipmentId", status, "hubId", "driverId", latitude, longitude, title, description, location, "timestamp", "proofImage") FROM stdin;
ebac4663-d172-4327-9e07-870887eddf2e	3f223856-b214-4732-9cf3-b9256ed74e85	CREATED	\N	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608217824 được khởi tạo thành công. Hệ thống Shopee Express (ZMX) đang chờ phân công tài xế lấy hàng.	Kênh Người Bán ZeroMall	2026-08-21 15:04:30.39	\N
26a6b2d5-bdeb-4718-97ec-47759ee91073	3f223856-b214-4732-9cf3-b9256ed74e85	PICKUP_ASSIGNED	\N	driver-01	\N	\N	Đã điều phối tài xế lấy hàng	Tài xế Nguyễn Văn Giao (ZMX 01) (0908123456 - 59-A1 123.45) đang trên đường đến địa chỉ người bán để lấy kiện hàng.	59-A1 123.45	2026-08-21 15:05:01.446	\N
dd390266-af4a-439b-b1f4-a43141694f33	3f223856-b214-4732-9cf3-b9256ed74e85	DELIVERED	hub-hcm-01	\N	\N	\N	Giao hàng thành công	Giao hàng thành công. Tài xế đã thu COD: 350.000đ. Khách hàng đã ký nhận.	Số 120 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh	2026-08-21 15:05:05.686	\N
d46186a1-7cf9-47ae-8425-739512082426	17091b7c-bb40-40dc-8e87-7397c0073e74	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2606204751 đã được đồng bộ từ đơn hàng #260620102938	Kho người bán	2026-06-20 12:03:02.146	\N
c0e3e930-0b9e-4414-b982-cd528136505b	67247e2c-ca42-4f28-8393-c1cf59fd01f5	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2606291588 đã được đồng bộ từ đơn hàng #260629591100	Kho người bán	2026-06-29 05:59:11.677	\N
1b32d06e-c8e6-4bc8-aa5b-95cf7fc52357	f9fc945f-ee73-40df-a1bf-41bc76bc522b	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2606298706 đã được đồng bộ từ đơn hàng #260629060925	Kho người bán	2026-06-29 06:09:25.89	\N
737c8dda-2557-4fe2-87cc-b58b7a89a74a	aff4ed4a-5d1d-4d28-91d7-30dd4c395409	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2606298304 đã được đồng bộ từ đơn hàng #260629061107	Kho người bán	2026-06-29 06:11:07.962	\N
66dfdb50-0312-4d78-8303-d45aa147a6e4	c7061a81-17bf-4560-8e1c-faab69f42942	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2607176584 đã được đồng bộ từ đơn hàng #260717053934	Kho người bán	2026-07-17 05:39:34.039	\N
793a31f3-11a8-4d76-aac5-3d419222d6e6	56a0ba85-7207-45ff-924a-38504685b7f8	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2607178865 đã được đồng bộ từ đơn hàng #260717055639	Kho người bán	2026-07-17 05:56:39.131	\N
1d031a78-2fe2-49eb-8cb5-f5992adc6f1c	95d0d3b7-3825-464f-9cb4-a3923a233df5	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2607175882 đã được đồng bộ từ đơn hàng #260717055720	Kho người bán	2026-07-17 05:57:20.525	\N
8c24fde5-45d7-4112-82f7-8d62ec6af543	2c8263db-829e-4668-a686-587b92094626	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2607197067 đã được đồng bộ từ đơn hàng #260719011826	Kho người bán	2026-07-19 01:18:26.99	\N
d8a2ae50-e67a-49ba-b61a-910b76a45eea	0dbda82e-4218-4519-9f70-3f72a131db4d	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2607172323 đã được đồng bộ từ đơn hàng #260717060418	Kho người bán	2026-07-17 06:04:18.517	\N
999a9cb2-e4d4-4cc5-8c36-1b02c218d09f	455b88b8-ed1b-4c68-a3d9-ad1186e6d911	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2607172269 đã được đồng bộ từ đơn hàng #260717060402	Kho người bán	2026-07-17 06:04:02.428	\N
ef78a1bb-511f-471e-8d63-a2816ccb1ded	a9b157d2-b499-48f8-9630-711b52f731c7	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2607172059 đã được đồng bộ từ đơn hàng #260717060050	Kho người bán	2026-07-17 06:00:50.241	\N
bd19b690-7e41-4522-a9b3-b4c0ae6510af	9f7c1701-38e8-4724-aa28-60b974b97cf6	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2606304262 đã được đồng bộ từ đơn hàng #260630113938	Kho người bán	2026-06-30 11:39:38.796	\N
306c532b-4aca-4e69-91a6-4e6690b928d4	686f6a7d-702d-454e-a648-cc198efff031	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608128386 đã được đồng bộ từ đơn hàng #26081219054531939	Kho người bán	2026-08-12 19:05:45.329	\N
98972d63-d164-40c5-bff3-bfcee2541e21	6963ca7b-efef-4c35-a1f7-a96ef7252d4b	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608125741 đã được đồng bộ từ đơn hàng #26081219040078621	Kho người bán	2026-08-12 19:04:00.797	\N
c601750e-ed12-444c-992f-a27977032bb2	3ce0a0fc-f266-4161-9f63-044b795e5d44	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608122053 đã được đồng bộ từ đơn hàng #26081219201633973	Kho người bán	2026-08-12 19:20:16.354	\N
249a1e16-6f43-4c30-82d6-734c3f29f4f1	edd8f689-0329-48d6-906c-f0b7349d3b9e	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608128411 đã được đồng bộ từ đơn hàng #26081218460363381	Kho người bán	2026-08-12 18:46:03.711	\N
a3236a25-e172-41c0-99b7-41149aad5839	bcb26c4f-4551-49db-bb0a-4c6f632f2e6f	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2607174341 đã được đồng bộ từ đơn hàng #260717060031	Kho người bán	2026-07-17 06:00:31.751	\N
033b8f97-b013-458b-8be7-ade59f392574	3a348910-2a6f-4d0c-a7e3-dd611bbf193f	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2606299259 đã được đồng bộ từ đơn hàng #260629600135	Kho người bán	2026-06-29 06:00:13.561	\N
5108d805-a13a-4b18-a5e5-975623ba43b8	5469cdb7-8233-4ed3-999f-f01060e8b288	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608142751 đã được đồng bộ từ đơn hàng #26081408234506930	Kho người bán	2026-08-14 08:23:45.082	\N
24dee188-419d-4173-a4da-8435f293b838	7a789292-f96b-4683-b460-5aadfd80b713	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608147050 đã được đồng bộ từ đơn hàng #26081407384657547	Kho người bán	2026-08-14 07:38:46.666	\N
a1a2ce44-0040-47a4-959f-d15c9226d6aa	2a2bace0-c5d1-4463-9f79-45054ec59b87	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608148679 đã được đồng bộ từ đơn hàng #26081408390084529	Kho người bán	2026-08-14 08:39:00.856	\N
3807fa77-2292-42ff-a19c-87e570a68644	1f3f1d51-d488-4724-9b8b-2c8b106f58ff	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608142083 đã được đồng bộ từ đơn hàng #26081415440545296	Kho người bán	2026-08-14 15:44:05.515	\N
1da51835-1749-424b-aa00-4b6a1197264d	555a421f-3db0-40e5-aca5-8ca4e6c29092	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608148644 đã được đồng bộ từ đơn hàng #26081415522442674	Kho người bán	2026-08-14 15:52:24.44	\N
e9456cdb-08d6-4b6f-818f-4ca8967dcc41	eb726f71-1af4-412a-8bab-fc1637c2e001	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608142776 đã được đồng bộ từ đơn hàng #26081415590264558	Kho người bán	2026-08-14 15:59:02.658	\N
f249be19-3390-4d7d-b1c5-dc5fb573360d	b3dbe83e-d8ff-4c73-9e8f-5bc4dcf7305e	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608167312 đã được đồng bộ từ đơn hàng #26081602571961548	Kho người bán	2026-08-16 02:57:19.664	\N
2262b333-ceed-43d3-af91-f5ed2fae8ab4	a1a5c840-4da4-4568-8ba0-c191a4f0da0a	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608161782 đã được đồng bộ từ đơn hàng #26081613042232789	Kho người bán	2026-08-16 13:04:22.343	\N
5661a285-b068-435e-9831-1a5c66976c8e	5f103e88-7d37-4a3b-bbb2-4f187461a9fd	CREATED	hub-hcm-01	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608162333 đã được đồng bộ từ đơn hàng #26081613051819386	Kho người bán	2026-08-16 13:05:18.217	\N
cb29185e-d57a-4420-a5ab-a9a94a50da06	aff4ed4a-5d1d-4d28-91d7-30dd4c395409	OUT_FOR_DELIVERY	\N	driver-02	\N	\N	Đang tiến hành giao hàng	Tài xế Trần Đình Phát (SPX 02) đã nhận kiện hàng và bắt đầu lộ trình giao đến bạn.	60-F2 888.99	2026-08-21 15:52:04.78	\N
21e38c66-7b47-4b52-a332-e4a9f04d45f2	95d0d3b7-3825-464f-9cb4-a3923a233df5	PICKING_UP	\N	driver-02	\N	\N	Tài xế đang đến lấy hàng	Tài xế Trần Đình Phát (SPX 02) đã chấp nhận đơn và đang di chuyển đến địa chỉ người bán.	60-F2 888.99	2026-08-21 16:03:15.783	\N
155ea6ef-cd03-4c4a-9a45-96925c8cc95e	95d0d3b7-3825-464f-9cb4-a3923a233df5	PICKED_UP	hub-hcm-01	\N	\N	\N	Tài xế đã lấy hàng thành công	Kiện hàng đã được tài xế tiếp nhận từ người bán và đang trên đường nhập kho xuất phát.	Kho người bán	2026-08-21 16:03:20.736	\N
74f1736a-44ee-4d10-a9b5-0613b4c80994	95d0d3b7-3825-464f-9cb4-a3923a233df5	AT_ORIGIN_HUB	hub-hcm-01	\N	\N	\N	Đơn hàng đã đến kho xuất phát	Bưu kiện đã nhập kho Kho Tổng Tân Bình SOC. Đang chuẩn bị quét mã vạch và phân loại.	Kho Tổng Tân Bình SOC	2026-08-21 16:07:03.964	\N
a1dc7f35-1e0a-4ac6-b2c8-b2f8209c7b08	56a0ba85-7207-45ff-924a-38504685b7f8	PICKING_UP	\N	driver-02	\N	\N	Tài xế đang đến lấy hàng	Tài xế Trần Đình Phát (SPX 02) đã chấp nhận đơn và đang di chuyển đến địa chỉ người bán.	60-F2 888.99	2026-08-23 11:05:57.002	\N
78526dff-0688-4a47-abdb-19474575de2c	56a0ba85-7207-45ff-924a-38504685b7f8	PICKED_UP	hub-hcm-01	\N	\N	\N	Tài xế đã lấy hàng thành công	Kiện hàng đã được tài xế tiếp nhận từ người bán và đang trên đường nhập kho xuất phát.	Kho người bán	2026-08-23 11:06:03.748	\N
4f16a99b-8b80-4da4-b239-d3a1f5979231	3f223856-b214-4732-9cf3-b9256ed74e85	REASSIGNING	\N	\N	\N	\N	Đang điều phối lại tài xế	Tài xế Nguyễn Văn Giao (SPX 01) bận, hệ thống SPX đang tự động điều phối tài xế khác.	\N	2026-08-23 11:29:00.373	\N
c3137c4b-8cc3-4a93-b9d6-10cfd344123b	8e1c93a2-e180-4ef7-9be0-5c36e7fa3dd3	CREATED	\N	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608236199 được khởi tạo thành công. Hệ thống ZeroMall Express (ZMX) đang chờ phân công tài xế lấy hàng.	Kênh Người Bán ZeroMall	2026-08-23 11:49:23.906	\N
23830b3c-3152-4950-9c06-a47454e1b6fc	95d0d3b7-3825-464f-9cb4-a3923a233df5	AT_ORIGIN_HUB	hub-hcm-01	\N	\N	\N	Đơn hàng đã đến kho xuất phát	Bưu kiện đã nhập kho Kho Tổng Tân Bình SOC. Đang chuẩn bị quét mã vạch và phân loại.	Kho Tổng Tân Bình SOC	2026-08-26 09:41:58.949	\N
14b1df39-694b-4ad6-91c8-366824f4f58f	95d0d3b7-3825-464f-9cb4-a3923a233df5	AT_ORIGIN_HUB	hub-hcm-01	\N	\N	\N	Đơn hàng đã đến kho xuất phát	Bưu kiện đã nhập kho Kho Tổng Tân Bình SOC. Đang chuẩn bị quét mã vạch và phân loại.	Kho Tổng Tân Bình SOC	2026-08-26 09:42:57.125	\N
7aba7a57-1107-407e-9cf8-69fa6037c85b	95d0d3b7-3825-464f-9cb4-a3923a233df5	IN_TRANSIT	hub-hcm-01	\N	\N	\N	Đang luân chuyển giữa các Hub	Bưu kiện đã rời kho xuất phát và đang trên xe tải trung chuyển đến Bưu cục phát hàng địa phương.	Xe trung chuyển SPX	2026-08-26 09:43:44.751	\N
6174635d-81df-423a-9024-cdca321fb11f	61a394df-8186-4681-b7b6-cc87a9d05726	CREATED	\N	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2608294344 được khởi tạo thành công. Hệ thống ZeroMall Express (ZMX) đang chờ phân công tài xế lấy hàng.	Kênh Người Bán ZeroMall	2026-08-29 03:39:17.255	\N
999fb142-c2f3-4e6a-b2c2-6b776cfdc5c9	61a394df-8186-4681-b7b6-cc87a9d05726	PICKUP_ASSIGNED	\N	driver-01	\N	\N	Đã điều phối tài xế lấy hàng	Tài xế Nguyễn Văn Giao (SPX 01) (SĐT: 0908123456 - Xe: 59-A1 123.45 - Tuyến: Quận Tân Bình, Quận 10, Quận Phú Nhuận) đang trên đường đến địa chỉ người bán để lấy kiện hàng.	Nguyễn Văn Giao (SPX 01) (59-A1 123.45)	2026-09-04 02:48:57.2	\N
a6e10c81-62ed-4f35-987b-5feb170b4cdc	8979fa95-6a8a-4cdb-9496-966a22f771e9	CREATED	\N	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2609085688 được khởi tạo thành công. Hệ thống ZeroMall Express (ZMX) đang chờ phân công tài xế lấy hàng.	Kênh Người Bán ZeroMall	2026-09-08 11:40:53.856	\N
45de7b22-81b9-40e8-a00f-33800541e240	8979fa95-6a8a-4cdb-9496-966a22f771e9	PICKUP_ASSIGNED	\N	driver-01	\N	\N	Đã điều phối tài xế lấy hàng	Tài xế Nguyễn Văn Giao (SPX 01) (SĐT: 0908123456 - Xe: 59-A1 123.45 - Tuyến: Quận Tân Bình, Quận 10, Quận Phú Nhuận) đang trên đường đến địa chỉ người bán để lấy kiện hàng.	Nguyễn Văn Giao (SPX 01) (59-A1 123.45)	2026-09-08 11:40:53.894	\N
6678b6bb-b41a-4fa1-97fc-3bb060cec1cf	17091b7c-bb40-40dc-8e87-7397c0073e74	WAITING_PICKUP	\N	\N	\N	\N	Đang trong Hàng Đợi Bưu Cục	Đơn hàng đang chờ tại Kho Tổng Tân Bình SOC. Hiện chưa có tài xế trong ca làm việc tại khu vực này. Hệ thống sẽ tự động gán ngay khi tài xế điểm danh vào ca.	Kho Tổng Tân Bình SOC	2026-09-09 04:01:44.39	\N
ca508f56-fc98-4cf2-841b-442fd6029e2a	17091b7c-bb40-40dc-8e87-7397c0073e74	PICKUP_ASSIGNED	\N	driver-01	\N	\N	Đã điều phối tài xế lấy hàng	Tài xế Nguyễn Văn Giao (SPX 01) (SĐT: 0908123456 - Xe: 59-A1 123.45 - Tuyến: Quận Tân Bình, Quận 10, Quận Phú Nhuận) đang trên đường đến địa chỉ người bán để lấy kiện hàng.	Nguyễn Văn Giao (SPX 01) (59-A1 123.45)	2026-09-09 04:03:01.188	\N
6650a84a-6e38-4acf-876c-d072b9acc4cc	1f3f1d51-d488-4724-9b8b-2c8b106f58ff	PICKUP_ASSIGNED	\N	driver-01	\N	\N	Đã điều phối tài xế lấy hàng	Tài xế Nguyễn Văn Giao (SPX 01) (SĐT: 0908123456 - Xe: 59-A1 123.45 - Tuyến: Quận Tân Bình, Quận 10, Quận Phú Nhuận) đang trên đường đến địa chỉ người bán để lấy kiện hàng.	Nguyễn Văn Giao (SPX 01) (59-A1 123.45)	2026-09-09 04:03:01.193	\N
de1d2d0a-2a21-46a1-a597-b30e1e77cf14	2c8263db-829e-4668-a686-587b92094626	PICKUP_ASSIGNED	\N	driver-01	\N	\N	Đã điều phối tài xế lấy hàng	Tài xế Nguyễn Văn Giao (SPX 01) (SĐT: 0908123456 - Xe: 59-A1 123.45 - Tuyến: Quận Tân Bình, Quận 10, Quận Phú Nhuận) đang trên đường đến địa chỉ người bán để lấy kiện hàng.	Nguyễn Văn Giao (SPX 01) (59-A1 123.45)	2026-09-09 04:03:01.196	\N
cacf8259-d5ae-4b3f-986b-3483a6993289	555a421f-3db0-40e5-aca5-8ca4e6c29092	PICKUP_ASSIGNED	\N	driver-01	\N	\N	Đã điều phối tài xế lấy hàng	Tài xế Nguyễn Văn Giao (SPX 01) (SĐT: 0908123456 - Xe: 59-A1 123.45 - Tuyến: Quận Tân Bình, Quận 10, Quận Phú Nhuận) đang trên đường đến địa chỉ người bán để lấy kiện hàng.	Nguyễn Văn Giao (SPX 01) (59-A1 123.45)	2026-09-09 04:03:01.199	\N
d95c5ae3-3778-4fe0-9fac-cad03ab1f4ff	b3dbe83e-d8ff-4c73-9e8f-5bc4dcf7305e	PICKUP_ASSIGNED	\N	driver-01	\N	\N	Đã điều phối tài xế lấy hàng	Tài xế Nguyễn Văn Giao (SPX 01) (SĐT: 0908123456 - Xe: 59-A1 123.45 - Tuyến: Quận Tân Bình, Quận 10, Quận Phú Nhuận) đang trên đường đến địa chỉ người bán để lấy kiện hàng.	Nguyễn Văn Giao (SPX 01) (59-A1 123.45)	2026-09-09 04:03:01.202	\N
f428b594-b992-48ee-a974-03a45f37e295	f9fc945f-ee73-40df-a1bf-41bc76bc522b	PICKUP_ASSIGNED	\N	driver-01	\N	\N	Đã điều phối tài xế lấy hàng	Tài xế Nguyễn Văn Giao (SPX 01) (SĐT: 0908123456 - Xe: 59-A1 123.45 - Tuyến: Quận Tân Bình, Quận 10, Quận Phú Nhuận) đang trên đường đến địa chỉ người bán để lấy kiện hàng.	Nguyễn Văn Giao (SPX 01) (59-A1 123.45)	2026-09-09 04:03:01.206	\N
805b2f37-80f6-48f7-92e8-8b877e272b1c	8979fa95-6a8a-4cdb-9496-966a22f771e9	PICKUP_ASSIGNED	\N	driver-03	\N	\N	Đã điều phối tài xế lấy hàng	Tài xế Lê Hữu Tải (ZMX Van) (SĐT: 0987654321 - Xe: 51D-999.88 - Tuyến: Huyện Mê Linh, Quận Cầu Giấy, Hà Nội) đang trên đường đến địa chỉ người bán để lấy kiện hàng.	Lê Hữu Tải (ZMX Van) (51D-999.88)	2026-09-09 04:18:42.902	\N
428fc1e5-5b44-4ce1-b8a4-b3b1356a8078	8979fa95-6a8a-4cdb-9496-966a22f771e9	PICKED_UP	hub-hn-01	\N	\N	\N	Tài xế đã lấy hàng thành công	Kiện hàng đã được tài xế tiếp nhận từ người bán và đang trên đường nhập kho xuất phát.	Kho người bán	2026-09-09 04:46:15.476	data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QBMRXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAACgKADAAQAAAABAAAB4AAAAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/8AAEQgB4AKAAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/bAEMAAQEBAQEBAgEBAgMCAgIDBAMDAwMEBgQEBAQEBgcGBgYGBgYHBwcHBwcHBwgICAgICAkJCQkJCwsLCwsLCwsLC//bAEMBAgICAwMDBQMDBQsIBggLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLC//dAAQAKP/aAAwDAQACEQMRAD8A/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//0P8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9H/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//S/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//0/8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9T/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//V/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//1v8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9f/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//Q/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//0f8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9L/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//T/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//1P8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9X/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//W/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//1/8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9D/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//R/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//0v8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9P/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//U/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//1f8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9b/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//X/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//0P8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9H/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//S/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//0/8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9T/AD/6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP//Z
51d8596f-6000-4107-b7a8-2a3b88efcaad	8979fa95-6a8a-4cdb-9496-966a22f771e9	AT_ORIGIN_HUB	hub-hn-01	\N	\N	\N	Đơn hàng đã đến kho xuất phát	Bưu kiện đã nhập kho Kho Trung Chuyển Mê Linh SOC. Đang chuẩn bị quét mã vạch và phân loại.	Kho Trung Chuyển Mê Linh SOC	2026-09-09 08:37:05.934	hub-hn-01
dc925c90-f225-489a-8393-4a4dc9adb64b	92c43042-2b74-4b27-9071-5be36c0fc6c5	CREATED	\N	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2609096075 được khởi tạo thành công. Hệ thống ZeroMall Express (ZMX) đang chờ phân công tài xế lấy hàng.	Kênh Người Bán ZeroMall	2026-09-09 08:39:00.878	\N
40d0f609-89ae-4109-96fd-fce37504bec7	92c43042-2b74-4b27-9071-5be36c0fc6c5	WAITING_PICKUP	\N	\N	\N	\N	Đang trong Hàng Đợi Bưu Cục	Đơn hàng đang chờ tại Kho Tổng Tân Bình SOC. Hiện chưa có tài xế trong ca làm việc tại khu vực này. Hệ thống sẽ tự động gán ngay khi tài xế điểm danh vào ca.	Kho Tổng Tân Bình SOC	2026-09-09 08:39:00.901	\N
dcfaf07a-5dd1-4395-9731-afe49e17454a	8979fa95-6a8a-4cdb-9496-966a22f771e9	IN_TRANSIT	hub-hn-01	\N	\N	\N	Đang vận chuyển liên tỉnh (Xe tải trung chuyển)	Bưu kiện đã được xếp lên Xe tải Linehaul [29C-888.99] • Bác tài: Nguyễn Văn Tuấn (0912.345.678) • Niêm phong Seal: [SEAL-HN01-HCM01-1544]. Xe đang vận chuyển trên tuyến liên tỉnh đến bưu cục phát.	Xe tải 29C-888.99	2026-09-09 09:44:02.006	\N
324d85c8-ab0a-43e3-881b-c791ea3c4d10	8979fa95-6a8a-4cdb-9496-966a22f771e9	AT_DESTINATION_HUB	hub-hcm-01	\N	\N	\N	Đã đến bưu cục phát hàng địa phương	Bưu kiện đã đến bưu cục khu vực người nhận và sẵn sàng phân chia tuyến phát cho shipper.	Kho Trung Chuyển Mê Linh SOC	2026-09-09 09:52:04.181	\N
f0263191-f528-4ee2-9ee1-3935967a2a10	8979fa95-6a8a-4cdb-9496-966a22f771e9	OUT_FOR_DELIVERY	\N	driver-01	\N	\N	Đã phân công tài xế giao hàng	Tài xế Nguyễn Văn Giao (SPX 01) (SĐT: 0908123456 - Xe: 59-A1 123.45) đang tiến hành giao hàng đến địa chỉ người nhận.	Nguyễn Văn Giao (SPX 01) (59-A1 123.45)	2026-09-09 09:52:50.452	\N
884b8888-6544-4c48-a422-cde6f7aada87	61a394df-8186-4681-b7b6-cc87a9d05726	RETURN_IN_TRANSIT	\N	\N	\N	\N	Bưu kiện hoàn trả đang được vận chuyển về Người Bán	Mã vận đơn hoàn: RTX2609165573 (SPX lấy tận nơi).	Hệ thống vận chuyển SPX	2026-09-16 16:42:34.212	\N
034a6261-6e3a-4aa4-b61e-2a67ec209341	61a394df-8186-4681-b7b6-cc87a9d05726	DELIVERED_TO_SELLER	\N	\N	\N	\N	Hàng hoàn đã được giao đến Người Bán	Người bán có 48 giờ để kiểm tra tình trạng hàng hóa trước khi hệ thống tự động hoàn tiền cho Người mua.	Kho người bán	2026-09-16 16:43:50.033	\N
25b339bb-33ef-485d-9e84-4944c9b0a0a0	2a2bace0-c5d1-4463-9f79-45054ec59b87	RETURN_IN_TRANSIT	\N	\N	\N	\N	Bưu kiện hoàn trả đang được vận chuyển về Người Bán	Mã vận đơn hoàn: RTX2609161349 (SPX lấy tận nơi).	Hệ thống vận chuyển SPX	2026-09-16 16:46:03.732	\N
7d6bb3d8-b366-4431-ba30-197179264d33	2a2bace0-c5d1-4463-9f79-45054ec59b87	DELIVERED_TO_SELLER	\N	\N	\N	\N	Hàng hoàn đã được giao đến Người Bán	Người bán có 48 giờ để kiểm tra tình trạng hàng hóa trước khi hệ thống tự động hoàn tiền cho Người mua.	Kho người bán	2026-09-16 16:46:03.75	\N
9b94b6fd-bc24-4835-a994-ac71d4f153cf	a88c7940-36be-48c6-a429-42215f186b40	CREATED	\N	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2609185743 được khởi tạo thành công. Hệ thống ZeroMall Express (ZMX) đang chờ phân công tài xế lấy hàng.	Kênh Người Bán ZeroMall	2026-09-18 04:19:32.449	\N
e5333788-db88-4764-b3c9-a6cb03dae241	a88c7940-36be-48c6-a429-42215f186b40	WAITING_PICKUP	\N	\N	\N	\N	Đang trong Hàng Đợi Bưu Cục	Đơn hàng đang chờ tại Kho Trung Chuyển Mê Linh SOC. Hiện chưa có tài xế trong ca làm việc tại khu vực này. Hệ thống sẽ tự động gán ngay khi tài xế điểm danh vào ca.	Kho Trung Chuyển Mê Linh SOC	2026-09-18 04:19:32.495	\N
57a74d0d-3442-4d92-b784-42b1af73bfb9	a88c7940-36be-48c6-a429-42215f186b40	PICKUP_ASSIGNED	\N	driver-03	\N	\N	Đã điều phối tài xế lấy hàng	Tài xế Lê Hữu Tải (ZMX Van) (SĐT: 0987654321 - Xe: 51D-999.88 - Tuyến: Huyện Mê Linh, Quận Cầu Giấy, Hà Nội) đang trên đường đến địa chỉ người bán để lấy kiện hàng.	Lê Hữu Tải (ZMX Van) (51D-999.88)	2026-09-18 04:33:21.425	\N
429b7642-6f32-4497-ba49-f6213117382d	a88c7940-36be-48c6-a429-42215f186b40	PICKED_UP	hub-hn-01	\N	\N	\N	Tài xế đã lấy hàng thành công	Kiện hàng đã được tài xế tiếp nhận từ người bán và đang trên đường nhập kho xuất phát.	Kho người bán	2026-09-18 04:33:47.927	data:image/jpeg;base64,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
8f464ab3-df1a-4860-bde4-03e27a582cd3	a88c7940-36be-48c6-a429-42215f186b40	AT_ORIGIN_HUB	hub-hn-01	\N	\N	\N	Đơn hàng đã đến kho xuất phát	Bưu kiện đã nhập kho Kho Trung Chuyển Mê Linh SOC. Đang chuẩn bị quét mã vạch và phân loại.	Kho Trung Chuyển Mê Linh SOC	2026-09-18 05:10:58.984	\N
15747d66-1d78-4dd8-9191-17b9c4ea3932	b39b0699-86e0-485d-8ee3-ef70809438ff	CREATED	\N	\N	\N	\N	Người bán đã tạo đơn vận chuyển	Vận đơn ZMX2609188249 được khởi tạo thành công. Hệ thống ZeroMall Express (ZMX) đang chờ phân công tài xế lấy hàng.	Kênh Người Bán ZeroMall	2026-09-18 05:48:55.075	\N
077818e2-04ee-4f0e-ab58-9e5746a1db63	b39b0699-86e0-485d-8ee3-ef70809438ff	PICKUP_ASSIGNED	\N	driver-03	\N	\N	Đã điều phối tài xế lấy hàng	Tài xế Lê Hữu Tải (ZMX Van) (SĐT: 0987654321 - Xe: 51D-999.88 - Tuyến: Huyện Mê Linh, Quận Cầu Giấy, Hà Nội) đang trên đường đến địa chỉ người bán để lấy kiện hàng.	Lê Hữu Tải (ZMX Van) (51D-999.88)	2026-09-18 05:48:55.112	\N
6cf8535e-e3a6-48e0-891e-9aa74817aa74	b39b0699-86e0-485d-8ee3-ef70809438ff	PICKED_UP	hub-hn-01	\N	\N	\N	Tài xế đã lấy hàng thành công	Kiện hàng đã được tài xế tiếp nhận từ người bán và đang trên đường nhập kho xuất phát.	Kho người bán	2026-09-18 05:50:15.835	data:image/jpeg;base64,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
d32bc686-236e-44c7-8114-6236837c414e	b39b0699-86e0-485d-8ee3-ef70809438ff	AT_ORIGIN_HUB	hub-hn-01	\N	\N	\N	Đơn hàng đã đến kho xuất phát	Bưu kiện đã nhập kho Kho Trung Chuyển Mê Linh SOC. Đang chuẩn bị quét mã vạch và phân loại.	Kho Trung Chuyển Mê Linh SOC	2026-09-18 05:51:01.995	\N
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
710b22fd-4d36-419c-a770-95a03ed5664f	4dff03a8-0e89-4b08-a254-c3bef5c53a78	shop	SHOP	percentage	10	100000	5000	100	0	2026-06-20 04:02:00	2027-12-31 23:59:59	2026-06-20 04:02:56.809	2026-06-20 04:02:56.809	\N
1a6e976f-fff2-456a-83df-80831f105e9e	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	minhanh	SHOP50	fixed	20000	100000	\N	100	0	2026-08-14 08:29:00	2027-12-31 23:59:59	2026-08-14 08:33:06.078	2026-08-14 08:33:06.078	\N
7b04fed5-be81-477e-96c3-58e0b92a4365	26ccb7f3-909f-4523-aee7-8a9a1db54990	Giảm 2.000đ đơn từ 5k	TEST49_2K	fixed	2000	5000	\N	500	0	2026-09-08 08:53:26.341	2027-12-31 00:00:00	2026-09-08 08:53:26.341	2026-09-08 08:53:26.341	\N
fc78c0d4-0ec8-43bc-addf-fe2180391e72	26ccb7f3-909f-4523-aee7-8a9a1db54990	Giảm 10% cho đơn từ 10k	TEST49_10P	percentage	10	10000	5000	500	0	2026-09-08 08:53:26.341	2027-12-31 00:00:00	2026-09-08 08:53:26.341	2026-09-08 08:53:26.341	\N
2aab69b4-d862-4d71-a899-9aae6e62401e	eec3f3ba-bf12-4643-bff5-580a5d6087b4	Giảm 500đ đơn từ 1k	TEST89_500	fixed	500	1000	\N	500	0	2026-09-08 08:53:26.341	2027-12-31 00:00:00	2026-09-08 08:53:26.341	2026-09-08 08:53:26.341	\N
6d00402b-3d1c-4455-997e-3073eea198a2	PLATFORM	Voucher Toàn Sàn ZeroMall Giảm 10.000đ	ZEROMALL10K	fixed	10000	50000	\N	1000	0	2026-09-08 08:53:26.341	2027-12-31 00:00:00	2026-09-08 08:53:26.341	2026-09-08 08:53:26.341	\N
8d91f633-6f39-492e-bb80-dd5d3ddc7600	PLATFORM	Voucher Toàn Sàn ZeroMall Giảm 20%	ZEROPROMO20	percentage	20	100000	50000	1000	0	2026-09-08 08:53:26.341	2027-12-31 00:00:00	2026-09-08 08:53:26.341	2026-09-08 08:53:26.341	\N
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
25b6745c-c08f-44c5-9f1a-b27843df65f7	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	📦 Đơn hàng được cập nhật	Đơn hàng #26071705 của bạn đã chuyển sang trạng thái: SHIPPED.	ORDER	f	{"action": "VIEW_ORDER", "status": "SHIPPED", "orderId": "260717055720"}	2026-08-26 09:43:44.848	2026-08-26 09:43:44.848
c6f42880-594d-4639-980c-a0aca39cdce1	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	Đặt hàng thành công 🛒	Đơn hàng #26082903 trị giá 677.400đ đã được khởi tạo thành công.	ORDER	f	{"action": "VIEW_ORDER", "orderId": "26082903365823351"}	2026-08-29 03:36:58.319	2026-08-29 03:36:58.319
5eed0f98-ab05-473e-a6fd-81a8618c4898	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Đơn hàng mới từ Khách hàng 📦	Shop có 1 đơn hàng mới #26082903 từ khách hàng Vũ quốc cường. Vui lòng kiểm tra và chuẩn bị hàng.	ORDER	f	{"action": "VIEW_ORDER", "orderId": "26082903365823351"}	2026-08-29 03:36:58.327	2026-08-29 03:36:58.327
852d0f5b-fa52-40df-8295-74eaf2d20b7d	75c99eae-6bb1-4865-9f04-3b928b656b3f	Đơn hàng mới từ Khách hàng 📦	Shop có 1 đơn hàng mới #26082903 từ khách hàng Vũ quốc cường. Vui lòng kiểm tra và chuẩn bị hàng.	ORDER	f	{"action": "VIEW_ORDER", "orderId": "26082903365823351"}	2026-08-29 03:36:58.329	2026-08-29 03:36:58.329
bb92600e-7e99-4a8e-a3e9-99c4c9d4ada4	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	⚙️ Đơn hàng được cập nhật	Đơn hàng #26082903 của bạn đã chuyển sang trạng thái: Đang xử lý.	ORDER	f	{"action": "VIEW_ORDER", "status": "PROCESSING", "orderId": "26082903365823351"}	2026-08-29 03:36:58.344	2026-08-29 03:36:58.344
3549a77a-6ef8-4dbc-a65b-8b6d60c7b66b	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	🚚 Đơn hàng được cập nhật	Đơn hàng #26082903 của bạn đã chuyển sang trạng thái: Đang giao hàng.	ORDER	f	{"action": "VIEW_ORDER", "status": "SHIPPING", "orderId": "26082903365823351"}	2026-08-29 03:39:01.837	2026-08-29 03:39:01.837
9141df37-9c97-45cb-b54b-6c8dd3b049af	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	📦 Đơn hàng được cập nhật	Đơn hàng #26082903 của bạn đã chuyển sang trạng thái: SHIPPED.	ORDER	f	{"action": "VIEW_ORDER", "status": "SHIPPED", "orderId": "26082903365823351"}	2026-08-29 03:39:17.272	2026-08-29 03:39:17.272
416e3def-94a2-48f7-a187-be900d2dfeeb	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	🎉 Đơn hàng được cập nhật	Đơn hàng #26082903 của bạn đã chuyển sang trạng thái: Đã giao hàng.	ORDER	f	{"action": "VIEW_ORDER", "status": "DELIVERED", "orderId": "26082903365823351"}	2026-08-29 03:50:12.114	2026-08-29 03:50:12.114
f74a6d5e-7dce-4ac2-996b-60f99c612bdc	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	📦 Đơn hàng được cập nhật	Đơn hàng #26082903 của bạn đã chuyển sang trạng thái: COMPLETED.	ORDER	f	{"action": "VIEW_ORDER", "status": "COMPLETED", "orderId": "26082903365823351"}	2026-08-29 03:50:42.251	2026-08-29 03:50:42.251
9c36a691-bdcc-4c49-9077-71c92d8d6374	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	Đặt hàng thành công 🛒	Đơn hàng #26090811 trị giá 39.700đ đã được khởi tạo thành công.	ORDER	f	{"action": "VIEW_ORDER", "orderId": "260908110231387250250"}	2026-09-08 11:02:31.449	2026-09-08 11:02:31.449
662f1f56-868e-4c7e-9900-30e784b1952b	eec3f3ba-bf12-4643-bff5-580a5d6087b4	Đơn hàng mới từ Khách hàng 📦	Shop có 1 đơn hàng mới #26090811 từ khách hàng c. Vui lòng kiểm tra và chuẩn bị hàng.	ORDER	f	{"action": "VIEW_ORDER", "orderId": "260908110231387250250"}	2026-09-08 11:02:31.456	2026-09-08 11:02:31.456
5ede2ede-c500-48ff-a9a1-0acd7065eab8	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	Đặt hàng thành công 🛒	Đơn hàng #26090811 trị giá 47.700đ đã được khởi tạo thành công.	ORDER	f	{"action": "VIEW_ORDER", "orderId": "260908110231416377915"}	2026-09-08 11:02:31.467	2026-09-08 11:02:31.467
07a6330c-1120-4d2b-8409-c7460855bcb5	26ccb7f3-909f-4523-aee7-8a9a1db54990	Đơn hàng mới từ Khách hàng 📦	Shop có 1 đơn hàng mới #26090811 từ khách hàng c. Vui lòng kiểm tra và chuẩn bị hàng.	ORDER	f	{"action": "VIEW_ORDER", "orderId": "260908110231416377915"}	2026-09-08 11:02:31.468	2026-09-08 11:02:31.468
cec9e3d1-346a-449c-a5ae-074b8c5abb58	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	⚙️ Đơn hàng được cập nhật	Đơn hàng #26090811 của bạn đã chuyển sang trạng thái: Đang xử lý.	ORDER	f	{"action": "VIEW_ORDER", "status": "PROCESSING", "orderId": "260908110231387250250"}	2026-09-08 11:40:41.611	2026-09-08 11:40:41.611
ee04390b-5c58-4857-95ca-231ac6f8a438	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	📦 Đơn hàng được cập nhật	Đơn hàng #26090811 của bạn đã chuyển sang trạng thái: SHIPPED.	ORDER	f	{"action": "VIEW_ORDER", "status": "SHIPPED", "orderId": "260908110231387250250"}	2026-09-08 11:40:53.873	2026-09-08 11:40:53.873
9113165e-d313-4744-86ce-3084c284e2b1	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	🚚 Đơn hàng được cập nhật	Đơn hàng #26090811 của bạn đã chuyển sang trạng thái: Đang giao hàng.	ORDER	f	{"action": "VIEW_ORDER", "status": "SHIPPING", "orderId": "260908110231387250250"}	2026-09-08 11:40:56.927	2026-09-08 11:40:56.927
7ed5be37-b314-4b73-9cea-408141dd551b	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	📦 Đơn hàng được cập nhật	Đơn hàng #26090811 của bạn đã chuyển sang trạng thái: SHIPPED.	ORDER	f	{"action": "VIEW_ORDER", "status": "SHIPPED", "orderId": "260908110231387250250"}	2026-09-09 04:46:15.503	2026-09-09 04:46:15.503
aa44cf94-349e-44d0-9cda-f849020cad98	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	📦 Đơn hàng được cập nhật	Đơn hàng #26090811 của bạn đã chuyển sang trạng thái: SHIPPED.	ORDER	f	{"action": "VIEW_ORDER", "status": "SHIPPED", "orderId": "260908110231416377915"}	2026-09-09 08:39:00.896	2026-09-09 08:39:00.896
2afcbb19-8590-46d1-9bed-c9142608b258	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	📦 Đơn hàng được cập nhật	Đơn hàng #26090811 của bạn đã chuyển sang trạng thái: SHIPPED.	ORDER	f	{"action": "VIEW_ORDER", "status": "SHIPPED", "orderId": "260908110231387250250"}	2026-09-09 09:44:02.03	2026-09-09 09:44:02.03
a999face-3a34-46b5-9fdc-757a4b06279b	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	📦 Đơn hàng được cập nhật	Đơn hàng #26082903 của bạn đã chuyển sang trạng thái: RETURN_REQUESTED.	ORDER	f	{"action": "VIEW_ORDER", "status": "RETURN_REQUESTED", "orderId": "26082903365823351"}	2026-09-16 16:40:52.702	2026-09-16 16:40:52.702
4d913264-5622-4055-a981-98998b39ddb2	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	📦 Đơn hàng được cập nhật	Đơn hàng #26082903 của bạn đã chuyển sang trạng thái: RETURN_APPROVED.	ORDER	f	{"action": "VIEW_ORDER", "status": "RETURN_APPROVED", "orderId": "26082903365823351"}	2026-09-16 16:41:34.942	2026-09-16 16:41:34.942
5cb2ab5b-8b83-4b55-83f3-7e8fcbe4ddd0	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	📦 Đơn hàng được cập nhật	Đơn hàng #26082903 của bạn đã chuyển sang trạng thái: RETURN_SHIPPING.	ORDER	f	{"action": "VIEW_ORDER", "status": "RETURN_SHIPPING", "orderId": "26082903365823351"}	2026-09-16 16:42:34.226	2026-09-16 16:42:34.226
01561bf7-fee1-4c85-8136-f7f5c83c00c7	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	💸 Đơn hàng được cập nhật	Đơn hàng #26082903 của bạn đã chuyển sang trạng thái: Đã hoàn tiền.	ORDER	f	{"action": "VIEW_ORDER", "status": "REFUNDED", "orderId": "26082903365823351"}	2026-09-16 16:44:16.825	2026-09-16 16:44:16.825
cd1e12fa-f9ca-4ba8-9938-4812c9ea7495	3150f691-6e58-47c7-ad4c-acbd52f027c5	📦 Đơn hàng được cập nhật	Đơn hàng #26081408 của bạn đã chuyển sang trạng thái: RETURN_REQUESTED.	ORDER	f	{"action": "VIEW_ORDER", "status": "RETURN_REQUESTED", "orderId": "26081408390084529"}	2026-09-16 16:46:03.654	2026-09-16 16:46:03.654
26d31db2-0f8a-4823-912d-32779c2805c4	3150f691-6e58-47c7-ad4c-acbd52f027c5	📦 Đơn hàng được cập nhật	Đơn hàng #26081408 của bạn đã chuyển sang trạng thái: RETURN_APPROVED.	ORDER	f	{"action": "VIEW_ORDER", "status": "RETURN_APPROVED", "orderId": "26081408390084529"}	2026-09-16 16:46:03.721	2026-09-16 16:46:03.721
66d879c5-8d84-4a96-9aa0-6c525fa1175b	3150f691-6e58-47c7-ad4c-acbd52f027c5	📦 Đơn hàng được cập nhật	Đơn hàng #26081408 của bạn đã chuyển sang trạng thái: RETURN_SHIPPING.	ORDER	f	{"action": "VIEW_ORDER", "status": "RETURN_SHIPPING", "orderId": "26081408390084529"}	2026-09-16 16:46:03.739	2026-09-16 16:46:03.739
754d726a-477d-4cd7-b91d-d3b27db92ddd	3150f691-6e58-47c7-ad4c-acbd52f027c5	📦 Đơn hàng được cập nhật	Đơn hàng #26081408 của bạn đã chuyển sang trạng thái: RETURN_DISPUTED.	ORDER	f	{"action": "VIEW_ORDER", "status": "RETURN_DISPUTED", "orderId": "26081408390084529"}	2026-09-16 16:46:03.771	2026-09-16 16:46:03.771
25a81aee-046b-427f-a13e-7756658f88d1	3150f691-6e58-47c7-ad4c-acbd52f027c5	📦 Đơn hàng được cập nhật	Đơn hàng #26081408 của bạn đã chuyển sang trạng thái: COMPLETED.	ORDER	f	{"action": "VIEW_ORDER", "status": "COMPLETED", "orderId": "26081408390084529"}	2026-09-16 16:46:56.162	2026-09-16 16:46:56.162
f3f413bf-dbe8-477f-8959-cf7f859a21b4	2160bae9-7f85-44ab-bd25-e051f42ff047	Người theo dõi mới 🎉	Người dùng vqc142 vừa nhấn Theo dõi shop của bạn. Hãy đăng thêm sản phẩm mới để tiếp cận khách hàng!	SYSTEM	f	{"action": "VIEW_SHOP", "shopId": "2331d6e1-a082-45e7-8cc8-c2d497ba6832"}	2026-09-17 10:40:48.601	2026-09-17 10:40:48.601
ebeb49e3-7abc-4041-8f65-b50917652704	2331d6e1-a082-45e7-8cc8-c2d497ba6832	Người theo dõi mới 🎉	Người dùng vqc142 vừa nhấn Theo dõi shop của bạn. Hãy đăng thêm sản phẩm mới để tiếp cận khách hàng!	SYSTEM	t	{"action": "VIEW_SHOP", "shopId": "2331d6e1-a082-45e7-8cc8-c2d497ba6832"}	2026-09-17 10:40:48.601	2026-09-17 10:41:00.002
e153c486-8ed0-47fa-aa2a-21791e13290b	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	Đặt hàng thành công 🛒	Đơn hàng #26091713 trị giá 26.000đ đã được khởi tạo thành công.	ORDER	f	{"action": "VIEW_ORDER", "orderId": "260917134355381382706"}	2026-09-17 13:43:55.431	2026-09-17 13:43:55.431
de726136-aeda-46e4-abf2-0c0a75d14666	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	⚙️ Đơn hàng được cập nhật	Đơn hàng #26091713 của bạn đã chuyển sang trạng thái: Đang xử lý.	ORDER	f	{"action": "VIEW_ORDER", "status": "PROCESSING", "orderId": "260917134355381382706"}	2026-09-17 13:43:55.469	2026-09-17 13:43:55.469
404da3fa-b2a1-4766-b20f-b4c37f30afa6	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	📦 Đơn hàng được cập nhật	Đơn hàng #26091713 của bạn đã chuyển sang trạng thái: SHIPPED.	ORDER	f	{"action": "VIEW_ORDER", "status": "SHIPPED", "orderId": "260917134355381382706"}	2026-09-17 13:44:03.577	2026-09-17 13:44:03.577
71e25031-c653-4c1d-b99d-e7f08d294138	2331d6e1-a082-45e7-8cc8-c2d497ba6832	Đơn hàng mới từ Khách hàng 📦	Shop có 1 đơn hàng mới #26091713 từ khách hàng cuong mua 179. Vui lòng kiểm tra và chuẩn bị hàng.	ORDER	t	{"action": "VIEW_ORDER", "orderId": "260917134355381382706"}	2026-09-17 13:43:55.436	2026-09-17 13:44:36.513
a1e3aa22-2743-401a-aa46-7637a0a07619	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	⚙️ Đơn hàng được cập nhật	Đơn hàng #26091713 của bạn đã chuyển sang trạng thái: Đang xử lý.	ORDER	f	{"action": "VIEW_ORDER", "status": "PROCESSING", "orderId": "260917134355381382706"}	2026-09-18 04:18:01.411	2026-09-18 04:18:01.411
f85127ba-27f4-42c3-ae93-d03da4f662f9	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	📦 Đơn hàng được cập nhật	Đơn hàng #26091713 của bạn đã chuyển sang trạng thái: SHIPPED.	ORDER	f	{"action": "VIEW_ORDER", "status": "SHIPPED", "orderId": "260917134355381382706"}	2026-09-18 04:19:32.477	2026-09-18 04:19:32.477
fb803b1a-4c85-42c1-9b3d-a86ab87b9cbe	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	🚚 Đơn hàng được cập nhật	Đơn hàng #26091713 của bạn đã chuyển sang trạng thái: Đang giao hàng.	ORDER	f	{"action": "VIEW_ORDER", "status": "SHIPPING", "orderId": "260917134355381382706"}	2026-09-18 04:19:37.353	2026-09-18 04:19:37.353
042a6d8e-a252-4630-aaed-e3a78be031f1	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	📦 Đơn hàng được cập nhật	Đơn hàng #26091713 của bạn đã chuyển sang trạng thái: SHIPPED.	ORDER	f	{"action": "VIEW_ORDER", "status": "SHIPPED", "orderId": "260917134355381382706"}	2026-09-18 04:33:47.956	2026-09-18 04:33:47.956
740aa241-9656-4f1c-a081-f03dc77a133d	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	Đặt hàng thành công 🛒	Đơn hàng #26091805 trị giá 59.000đ đã được khởi tạo thành công.	ORDER	f	{"action": "VIEW_ORDER", "orderId": "260918053648198398587"}	2026-09-18 05:36:48.215	2026-09-18 05:36:48.215
a942d722-9f0c-4a57-8143-b6436b3f9fc8	2331d6e1-a082-45e7-8cc8-c2d497ba6832	Đơn hàng mới từ Khách hàng 📦	Shop có 1 đơn hàng mới #26091805 từ khách hàng cuong mua 179. Vui lòng kiểm tra và chuẩn bị hàng.	ORDER	f	{"action": "VIEW_ORDER", "orderId": "260918053648198398587"}	2026-09-18 05:36:48.22	2026-09-18 05:36:48.22
ebbdbe48-2b70-469e-8c0f-13fc945fd8a2	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	⚙️ Đơn hàng được cập nhật	Đơn hàng #26091805 của bạn đã chuyển sang trạng thái: Đang xử lý.	ORDER	f	{"action": "VIEW_ORDER", "status": "PROCESSING", "orderId": "260918053648198398587"}	2026-09-18 05:36:48.228	2026-09-18 05:36:48.228
ab912c8a-0246-479e-9927-3ca444b779fb	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	📦 Đơn hàng được cập nhật	Đơn hàng #26091805 của bạn đã chuyển sang trạng thái: SHIPPED.	ORDER	f	{"action": "VIEW_ORDER", "status": "SHIPPED", "orderId": "260918053648198398587"}	2026-09-18 05:48:55.104	2026-09-18 05:48:55.104
1ad1a1f1-8a79-479c-8cfb-8229a25d9e05	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	🚚 Đơn hàng được cập nhật	Đơn hàng #26091805 của bạn đã chuyển sang trạng thái: Đang giao hàng.	ORDER	f	{"action": "VIEW_ORDER", "status": "SHIPPING", "orderId": "260918053648198398587"}	2026-09-18 05:48:56.121	2026-09-18 05:48:56.121
059523a4-9acc-4195-a2a5-f787e350cde1	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	📦 Đơn hàng được cập nhật	Đơn hàng #26091805 của bạn đã chuyển sang trạng thái: SHIPPED.	ORDER	f	{"action": "VIEW_ORDER", "status": "SHIPPED", "orderId": "260918053648198398587"}	2026-09-18 05:50:15.858	2026-09-18 05:50:15.858
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: order; Owner: postgres
--

COPY "order"."Order" (id, "buyerId", "buyerEmail", "buyerName", "buyerPhone", "shippingAddress", "totalAmount", "shippingFee", "paymentMethod", status, "createdAt", "updatedAt", "ghnDistrictId", "ghnOrderCode", "ghnWardCode", "refundDescription", "refundEmail", "refundReason", "refundProofImages", "shopDiscountAmount", "platformDiscountAmount", "shopVoucherCode", "platformVoucherCode", "appliedVoucherIds", "commissionRate", "checkoutGroupId", "shopId") FROM stdin;
260620102938	e9cd2310-7eb9-4ce5-ba8e-7e9e1f815d2d	hhshh@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	457700	37700	zeropay	PROCESSING	2026-06-20 12:03:02.146	2026-06-20 12:03:02.197	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5	\N	\N
260629591100	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	Quang Hiệp	(+84) 964 579 875	Đường không tên, Phú Lâm, An Giang, Phú Lâm, Phú Tân, An Giang	450000	30000	cod	PROCESSING	2026-06-29 05:59:11.677	2026-06-29 05:59:11.743	1756	\N	510505	\N	\N	\N	\N	0	0	\N	\N	\N	5	\N	\N
260629060925	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	617700	37700	sepay	CANCELLED	2026-06-29 06:09:25.89	2026-07-19 01:39:46.144	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5	\N	\N
260629061107	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	487700	37700	sepay	CANCELLED	2026-06-29 06:11:07.962	2026-07-19 01:39:46.147	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5	\N	\N
260717053934	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	487700	37700	sepay	CANCELLED	2026-07-17 05:39:34.039	2026-07-19 01:39:46.148	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5	\N	\N
260719011826	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	4700	2700	sepay	REFUNDED	2026-07-19 01:18:26.99	2026-07-24 06:00:19.339	\N	GHN-MOCK-1784425771427	\N		vqc141@gmail.com	[Đã nhận hàng nhưng hàng có vấn đề (bể vỡ, sai mẫu, hàng lỗi, khác mô tả...) - Miễn ship hoàn về] Lý do: Gửi sai hàng / khác phân loại đã đặt	\N	0	0	\N	\N	\N	5	\N	\N
260717060418	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	4700	2700	sepay	COMPLETED	2026-07-17 06:04:18.517	2026-07-24 06:00:34.787	\N	GHN-VN-492465584	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5	\N	\N
260717060402	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	4700	2700	cod	COMPLETED	2026-07-17 06:04:02.428	2026-07-24 11:26:47.827	\N	GHN-VN-564473242	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5	\N	\N
260717060050	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	4700	2700	sepay	COMPLETED	2026-07-17 06:00:50.241	2026-07-24 11:04:04.023	\N	GHN-VN-188272803	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5	\N	\N
260630113938	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	487700	37700	cod	COMPLETED	2026-06-30 11:39:38.796	2026-08-12 19:08:58.383	\N	GHN-VN-555795992	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5	\N	\N
26081219054531939	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	minhanh	0344461922	151 Nguyễn Kim, Phường 7, Quận 10, Hồ Chí Minh, Phường 7, Quận 10, Hồ Chí Minh	450000	0	cod	COMPLETED	2026-08-12 19:05:45.329	2026-08-12 19:08:56.278	1452	GHN-VN-324051310	21007	\N	\N	\N	\N	0	0	\N	FREESHIP	\N	5	\N	\N
26081219040078621	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	minhanh	0344461922	151 Nguyễn Kim, Phường 7, Quận 10, Hồ Chí Minh, Phường 7, Quận 10, Hồ Chí Minh	250000	0	zeropay	COMPLETED	2026-08-12 19:04:00.797	2026-08-12 19:08:57.55	1452	GHN-VN-118142242	21007	\N	\N	\N	\N	0	0	\N	FREESHIP	\N	5	\N	\N
26081219201633973	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	minhanh	0344461922	151 Nguyễn Kim, Phường 7, Quận 10, Hồ Chí Minh, Phường 7, Quận 10, Hồ Chí Minh	18500	16500	cod	COMPLETED	2026-08-12 19:20:16.354	2026-08-12 19:20:56.709	1452	GHN-VN-878703231	21007	\N	\N	\N	\N	0	0	\N	\N	\N	5	\N	\N
26081218460363381	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	minhanh	0344461922	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	2000	0	cod	COMPLETED	2026-08-12 18:46:03.711	2026-08-12 19:08:57.974	1452	GHN-VN-960283895	21007	\N	\N	\N	\N	0	0	\N	FREESHIP	\N	5	\N	\N
260717060031	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	4700	2700	cod	COMPLETED	2026-07-17 06:00:31.751	2026-08-12 19:08:58.175	\N	GHN-VN-590528621	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5	\N	\N
260629600135	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	487700	37700	cod	COMPLETED	2026-06-29 06:00:13.561	2026-08-14 07:33:43.672	\N	GHN-VN-756998021	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5	\N	\N
26081408234506930	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	minhanh	0344461922	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	241500	16500	zeropay	COMPLETED	2026-08-14 08:23:45.082	2026-08-14 08:29:09.792	1452	GHN-VN-975045629	21007	\N	\N	\N	\N	0	25000	\N	DISCOUNT10	\N	5	\N	\N
26081407384657547	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	minhanh	0344461922	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	216500	16500	zeropay	COMPLETED	2026-08-14 07:38:46.666	2026-08-14 08:13:02.508	1452	GHN-VN-560834385	21007	\N	\N	\N	\N	0	50000	\N	DISCOUNT50K	\N	5	\N	\N
26081415440545296	880a2880-43c0-4506-b25a-86dc34299f7b	minhanh@zeromall.com	minhanh	0344461922	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	2000	0	zeropay	REFUNDED	2026-08-14 15:44:05.515	2026-08-14 15:50:35.475	1452	GHN-VN-487424201	21007	m , ,m,ml	minhanh@zeromall.com	[Chưa nhận hàng hoặc nhận thiếu hàng] Lý do: Chưa nhận được hàng sau thời gian dài	\N	0	0	\N	FREESHIP	\N	5	\N	\N
260717055639	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	39700	37700	sepay	SHIPPED	2026-07-17 05:56:39.131	2026-08-23 11:06:03.789	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5	\N	\N
260717055720	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	4700	2700	sepay	SHIPPED	2026-07-17 05:57:20.525	2026-08-26 09:43:44.81	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5	\N	\N
26081415522442674	880a2880-43c0-4506-b25a-86dc34299f7b	minhanh@zeromall.com	minhanh	0344461922	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	256500	16500	cod	PROCESSING	2026-08-14 15:52:24.44	2026-08-14 15:52:24.474	1452	\N	21007	\N	\N	\N	\N	0	50000	\N	DISCOUNT50K	\N	5	\N	\N
26081415590264558	880a2880-43c0-4506-b25a-86dc34299f7b	minhanh@zeromall.com	minhanh	0344461922	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	91500	16500	zeropay	COMPLETED	2026-08-14 15:59:02.658	2026-08-14 16:01:21.666	1452	GHN-VN-697013339	21007	\N	\N	\N	\N	0	0	\N	\N	\N	5	\N	\N
26081602571961548	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	237700	37700	cod	PROCESSING	2026-08-16 02:57:19.664	2026-08-16 02:57:19.71	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5	\N	\N
26082903365823351	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	677400	75400	zeropay	REFUNDED	2026-08-29 03:36:58.281	2026-09-16 16:44:16.821	\N	ZMX2608294344	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5	\N	\N
26081613042232789	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	39700	37700	sepay	PROCESSING	2026-08-16 13:04:22.343	2026-08-20 07:38:41.878	\N	\N	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5	\N	\N
26081613051819386	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Vũ quốc cường	(+84) 964 579 875	Số 9d, Đường Trần Công An, Khu Phố 6, Tân Phong, Biên Hòa, Tỉnh Đồng Nai	39700	37700	zeropay	SHIPPED	2026-08-16 13:05:18.217	2026-08-21 11:09:16.474	\N	ZMX-VN-490311514	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5	\N	\N
26082311481046083	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Minh Anh	0964579675	3D Lê Lợi, Phường 4, Gò Vấp, Thành phố Hồ Chí Minh	216500	16500	zeropay	PROCESSING	2026-08-23 11:48:10.503	2026-08-23 11:48:10.531	1461	\N	21303	\N	\N	\N	\N	0	0	\N	\N	\N	5	\N	\N
26082311485056556	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	Minh Anh	0964579675	3D Lê Lợi, Phường 4, Gò Vấp, Thành phố Hồ Chí Minh	215500	16500	zeropay	SHIPPED	2026-08-23 11:48:50.583	2026-08-23 11:49:23.919	1461	ZMX2608236199	21303	\N	\N	\N	\N	0	0	\N	\N	\N	5	\N	\N
26081408390084529	3150f691-6e58-47c7-ad4c-acbd52f027c5	buyer.nh@zeromall.com	minhanh	0344461922	Bến xe Nhật Tảo, Đường Nhật Tảo, phường 7, Quận 10, Sài Gòn, Phường 7, Quận 10, Hồ Chí Minh	286500	16500	cod	COMPLETED	2026-08-14 08:39:00.856	2026-09-16 16:46:56.146	1452	GHN-VN-889275153	21007	\N	\N	\N	\N	0	50000	\N	DISCOUNT50K	\N	5	\N	\N
260908110231416377915	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	c	11111111111	es, Thạnh Mỹ Tây, , Thành phố Hồ Chí Minh	47700	37700	cod	SHIPPED	2026-09-08 11:02:31.419	2026-09-09 08:39:00.887	\N	ZMX2609096075	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5	c0110ad7-f4af-4b55-8602-58dc57cd1a98	26ccb7f3-909f-4523-aee7-8a9a1db54990
260908110231387250250	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	vqc141@gmail.com	c	11111111111	es, Thạnh Mỹ Tây, , Thành phố Hồ Chí Minh	39700	37700	cod	SHIPPED	2026-09-08 11:02:31.409	2026-09-09 09:44:02.021	\N	ZMX2609085688	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5	c0110ad7-f4af-4b55-8602-58dc57cd1a98	eec3f3ba-bf12-4643-bff5-580a5d6087b4
260917134355381382706	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	vqc142@gmail.com	cuong mua 179	1231231231	Trường Đại học Công nghiệp TP.HCM, Nguyễn Văn Bảo, Phường 4, Gò Vấp, Thành phố Hồ Chí Minh, Phường 4, Quận Gò Vấp, Thành phố Hồ Chí Minh	26000	22000	zeropay	SHIPPED	2026-09-17 13:43:55.4	2026-09-18 04:33:47.948	\N	ZMX2609185743	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5	77359ee5-685b-4cbf-97ce-245d5d6cafec	2331d6e1-a082-45e7-8cc8-c2d497ba6832
260918053648198398587	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	vqc142@gmail.com	cuong mua 179	1231231231	Trường Đại học Công nghiệp TP.HCM, Nguyễn Văn Bảo, Phường 4, Gò Vấp, Thành phố Hồ Chí Minh, Phường 4, Quận Gò Vấp, Thành phố Hồ Chí Minh	59000	37000	zeropay	SHIPPED	2026-09-18 05:36:48.205	2026-09-18 05:50:15.852	\N	ZMX2609188249	\N	\N	\N	\N	\N	0	0	\N	\N	\N	5	dccf5d6c-1fac-42b3-ae6d-91d308205d1a	2331d6e1-a082-45e7-8cc8-c2d497ba6832
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
80af33cb-c757-46bb-83b7-f20f528ac935	26082903365823351	130c82e3-a2ef-437e-8e77-a6da1ab4af5b	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	cuong	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	\N	2000	1
c25f94a8-1d13-4663-9800-bf33686ac2f1	26082903365823351	a9aea6bc-04dd-4377-8f67-02c68a29f74f	75c99eae-6bb1-4865-9f04-3b928b656b3f	giày sneaker	https://res.cloudinary.com/dxkfusgxs/image/upload/v1787974241/xlz46ls4hkb6qklnjvbg.jpg	\N	120000	5
ba434f4a-1167-4cf2-8eb8-9a6def7ddd99	260908110231387250250	9c18aa62-4c3f-49f0-bd69-31a53f92d35e	eec3f3ba-bf12-4643-bff5-580a5d6087b4	test89	https://res.cloudinary.com/dxkfusgxs/image/upload/v1788856453/f4tcctnio5rgavlbheyu.jpg	\N	2000	1
505ba55c-d9a6-4055-a933-4ebd86014b0e	260908110231416377915	4c224cb7-0bb4-4514-b7d5-566c798ecf4b	26ccb7f3-909f-4523-aee7-8a9a1db54990	test 4/9	https://res.cloudinary.com/dxkfusgxs/image/upload/v1788492967/dtyqnxefmncfinmc7fgq.png	\N	10000	1
b68e932d-599f-457a-8211-2997c63db3f1	260917134355381382706	e05fd8f7-cc71-4393-bcdd-8aa206eadc21	2331d6e1-a082-45e7-8cc8-c2d497ba6832	test 179	https://res.cloudinary.com/dxkfusgxs/image/upload/v1789640853/rmbwt7dy9iaapnlzwfqe.png	\N	2000	2
2960e71d-f9ae-44df-a3d3-2c3b0c8d1218	260918053648198398587	6f9ac050-3ab0-4333-9e14-59f29f15802e	2331d6e1-a082-45e7-8cc8-c2d497ba6832	test 189	https://res.cloudinary.com/dxkfusgxs/image/upload/v1789708502/ryt4pmkaccexcynz3kpy.png	\N	20000	1
3cb35174-79a6-47a2-a04c-9b933415a82c	260918053648198398587	e05fd8f7-cc71-4393-bcdd-8aa206eadc21	2331d6e1-a082-45e7-8cc8-c2d497ba6832	test 179	https://res.cloudinary.com/dxkfusgxs/image/upload/v1789640853/rmbwt7dy9iaapnlzwfqe.png	\N	2000	1
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
31b884af-96b5-445c-b3e1-9c0786204664	26082903365823351	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	2000	5	RELEASED	2026-09-01 03:50:12.112	2026-08-29 03:50:12.114	2026-08-29 03:50:42.261
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
1e941e11-fdc5-4a38-86da-a17de3c191fd	26082903365823351	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	677400	zeropay	SUCCESS	ZPAY-404da709-974d-418c-8c03-b5ac86b366c1	2026-08-29 03:36:58.306	2026-08-29 03:36:58.316
8b812639-b6ba-44d2-99f0-b6a8b0c6bcf9	260908110231387250250	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	39700	cod	PENDING	\N	2026-09-08 11:02:31.447	2026-09-08 11:02:31.447
21fca071-7bd3-48c3-aaef-a5196dc387a3	260908110231416377915	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	47700	cod	PENDING	\N	2026-09-08 11:02:31.457	2026-09-08 11:02:31.457
1cef3be9-4b84-434b-91e4-ebdcdffe5a64	260917134355381382706	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	26000	zeropay	SUCCESS	ZPAY-ec472832-8fc3-404d-a2e0-e41e1ec3c66c	2026-09-17 13:43:55.429	2026-09-17 13:43:55.439
0c8875b4-b9b1-46b3-bf27-91075fe6a1d5	260918053648198398587	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	59000	zeropay	SUCCESS	ZPAY-3ff294e9-c20b-4d97-a7ae-df401a4ce1e8	2026-09-18 05:36:48.216	2026-09-18 05:36:48.219
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
bfaf82a2-6e57-4770-95df-bf122b405f5d	75c99eae-6bb1-4865-9f04-3b928b656b3f	5000000	2026-08-29 03:52:39.146	2026-08-29 03:52:39.146	0
1ec2e675-1528-48bb-a4f1-33096c3ba62b	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	7259450	2026-07-19 02:44:45.73	2026-09-16 16:44:16.803	0
bf52b83a-1ad7-417b-b68d-9a48da080744	f1ba7a53-b5cd-48b9-a270-6ad7f40001f1	4289600	2026-06-30 11:09:54.308	2026-09-16 16:44:16.811	0
c119dbea-af00-41a1-a483-cb5c97d91e90	PLATFORM	119450	2026-07-24 06:01:36.15	2026-09-16 16:44:16.812	0
1ce551c8-53cb-4501-9fdc-f8cb71ce5788	2331d6e1-a082-45e7-8cc8-c2d497ba6832	5000000	2026-09-17 09:53:12.931	2026-09-17 09:53:12.931	0
00961be2-642d-4685-831b-2b7c5ad32f66	b98d1128-a7b7-4437-9b8c-d71035c0c6c9	4915000	2026-09-17 09:48:15.073	2026-09-18 05:36:48.218	0
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
08276eef-e8c6-45b8-9087-de5de259ce83	bf52b83a-1ad7-417b-b68d-9a48da080744	677400	PAYMENT	Thanh toán đơn hàng #26082903365823351	SUCCESS	2026-08-29 03:36:58.314
a695144a-cd85-416b-850c-be9609695b6d	1ec2e675-1528-48bb-a4f1-33096c3ba62b	1900	REVENUE	Giải ngân doanh thu đơn hàng #26082903365823351 (sau chiết khấu 5%)	SUCCESS	2026-08-29 03:50:42.264
67ae6faa-f144-41ed-851b-1464c73782d0	c119dbea-af00-41a1-a483-cb5c97d91e90	100	COMMISSION	Chiết khấu sàn 5% đơn hàng #26082903365823351 từ Shop 6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	SUCCESS	2026-08-29 03:50:42.266
86cd454f-1bd0-4424-bb14-cc44564f0d23	1ec2e675-1528-48bb-a4f1-33096c3ba62b	122000	CLAWBACK	Thu hồi tiền do đơn hàng #26082903365823351 bị trả hàng/hoàn tiền sau khi đã giải ngân (Số dư ví: 7.259.450đ)	SUCCESS	2026-09-16 16:44:16.81
291cc8f5-4585-4998-b899-aed4f10dfb5e	bf52b83a-1ad7-417b-b68d-9a48da080744	122000	REFUND	Hoàn tiền trả hàng cho đơn hàng #26082903365823351 (Hàng bể vỡ do vận chuyển)	SUCCESS	2026-09-16 16:44:16.811
5ed5a07d-7c77-4803-bdbc-7ba84804fc5a	00961be2-642d-4685-831b-2b7c5ad32f66	26000	PAYMENT	Thanh toán đơn hàng #260917134355381382706	SUCCESS	2026-09-17 13:43:55.438
6ba0588b-1430-4824-9c3b-aa30bb88ab8e	00961be2-642d-4685-831b-2b7c5ad32f66	59000	PAYMENT	Thanh toán đơn hàng #260918053648198398587	SUCCESS	2026-09-18 05:36:48.218
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
3c702f7b-4759-4c96-bdb5-a0440aac1140	906d2fca-6704-4bd3-ae19-0557cc57de07	75c99eae-6bb1-4865-9f04-3b928b656b3f	62999.99999999999	50	NK-INIT-144424	Lô hàng ban đầu	Ghi nhận giá nhập khởi tạo theo tồn kho ban đầu	Chủ cửa hàng	2026-08-29 03:29:04.425	2026-08-29 03:29:04.425
39fb350c-865b-45a6-9a32-32f67d32f9f7	a9aea6bc-04dd-4377-8f67-02c68a29f74f	75c99eae-6bb1-4865-9f04-3b928b656b3f	84000	50	NK-INIT-281594	Lô hàng ban đầu	Ghi nhận giá nhập khởi tạo theo tồn kho ban đầu	Chủ cửa hàng	2026-08-29 03:31:21.595	2026-08-29 03:31:21.595
ecdc19fb-a4df-4f3d-a7ee-fe346a522f50	6b711a5c-61ab-4aa8-93f7-f2bd13b61d10	75c99eae-6bb1-4865-9f04-3b928b656b3f	125999.99999999999	50	NK-INIT-322600	Lô hàng ban đầu	Ghi nhận giá nhập khởi tạo theo tồn kho ban đầu	Chủ cửa hàng	2026-08-29 03:32:02.601	2026-08-29 03:32:02.601
6e51c1ff-8b93-44a6-94f0-18f34fdd7025	4c224cb7-0bb4-4514-b7d5-566c798ecf4b	26ccb7f3-909f-4523-aee7-8a9a1db54990	7000	50	NK-INIT-009304	Lô hàng ban đầu	Ghi nhận giá nhập khởi tạo theo tồn kho ban đầu	Chủ cửa hàng	2026-09-04 03:36:49.304	2026-09-04 03:36:49.304
3b06d611-aafe-49a5-b50f-1baef10faf0f	9c18aa62-4c3f-49f0-bd69-31a53f92d35e	eec3f3ba-bf12-4643-bff5-580a5d6087b4	1400	22	NK-INIT-491800	Lô hàng ban đầu	Ghi nhận giá nhập khởi tạo theo tồn kho ban đầu	Chủ cửa hàng	2026-09-08 08:34:51.801	2026-09-08 08:34:51.801
67ebf6e4-58a7-4870-a4bc-9bbfc1617488	e05fd8f7-cc71-4393-bcdd-8aa206eadc21	2331d6e1-a082-45e7-8cc8-c2d497ba6832	1400	20	NK-INIT-033824	Lô hàng ban đầu	Ghi nhận giá nhập khởi tạo theo tồn kho ban đầu	Chủ cửa hàng	2026-09-17 10:30:33.824	2026-09-17 10:30:33.824
f17c63d5-0cc0-467b-ba4b-a844fda0e501	6f9ac050-3ab0-4333-9e14-59f29f15802e	2331d6e1-a082-45e7-8cc8-c2d497ba6832	14000	20	NK-INIT-514774	Lô hàng ban đầu	Ghi nhận giá nhập khởi tạo theo tồn kho ban đầu	Chủ cửa hàng	2026-09-18 05:15:14.775	2026-09-18 05:15:14.775
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
92f6a715-5750-42a9-892e-f1c6fbe73425	906d2fca-6704-4bd3-ae19-0557cc57de07	75c99eae-6bb1-4865-9f04-3b928b656b3f	90000	90000	INITIAL	Hệ thống / Khởi tạo	SELLER	Khởi tạo giá niêm yết ban đầu khi tạo sản phẩm	2026-08-29 03:29:04.423
31e095c7-c57d-4c98-9104-0272d1b8bcc2	a9aea6bc-04dd-4377-8f67-02c68a29f74f	75c99eae-6bb1-4865-9f04-3b928b656b3f	120000	120000	INITIAL	Hệ thống / Khởi tạo	SELLER	Khởi tạo giá niêm yết ban đầu khi tạo sản phẩm	2026-08-29 03:31:21.592
79f13ba8-80b4-4bfd-a6eb-41c7b7415bb4	6b711a5c-61ab-4aa8-93f7-f2bd13b61d10	75c99eae-6bb1-4865-9f04-3b928b656b3f	180000	180000	INITIAL	Hệ thống / Khởi tạo	SELLER	Khởi tạo giá niêm yết ban đầu khi tạo sản phẩm	2026-08-29 03:32:02.599
9f590879-ded9-4357-bcc5-e81815a56364	4c224cb7-0bb4-4514-b7d5-566c798ecf4b	26ccb7f3-909f-4523-aee7-8a9a1db54990	10000	10000	INITIAL	Hệ thống / Khởi tạo	SELLER	Khởi tạo giá niêm yết ban đầu khi tạo sản phẩm	2026-09-04 03:36:49.302
9060ec2f-020e-4b6d-ae58-c57cd5c87563	9c18aa62-4c3f-49f0-bd69-31a53f92d35e	eec3f3ba-bf12-4643-bff5-580a5d6087b4	2000	2000	INITIAL	Hệ thống / Khởi tạo	SELLER	Khởi tạo giá niêm yết ban đầu khi tạo sản phẩm	2026-09-08 08:34:51.799
3c364562-4cef-40f8-aeda-1a5242b73b9b	e05fd8f7-cc71-4393-bcdd-8aa206eadc21	2331d6e1-a082-45e7-8cc8-c2d497ba6832	2000	2000	INITIAL	Hệ thống / Khởi tạo	SELLER	Khởi tạo giá niêm yết ban đầu khi tạo sản phẩm	2026-09-17 10:30:33.823
3b34a3b9-8b7e-451d-8617-c8673d3516f3	6f9ac050-3ab0-4333-9e14-59f29f15802e	2331d6e1-a082-45e7-8cc8-c2d497ba6832	20000	20000	INITIAL	Hệ thống / Khởi tạo	SELLER	Khởi tạo giá niêm yết ban đầu khi tạo sản phẩm	2026-09-18 05:15:14.774
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
7d707a15-9b2d-413f-9064-21e60c61ec61	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	Balo Thời Trang Học Sinh Sinh Viên Chống Nước	https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80	Túi Ví Nữ	No Brand	Balo thời trang đựng vừa laptop 15.6 inch, chất vải oxford chống thấm nước tốt, nhiều ngăn tiện lợi đi học hay du lịch ngắn ngày.	199000	79	1	active	BP-GRY-05	\N	f	[]	[]	600	\N	\N	\N	new	f	7	2026-06-29 04:38:06.933	2026-08-23 11:48:50.61	\N	\N	280000	f	0	\N	825d4683-d05c-47a4-8cac-3f54890a2d75	0
130c82e3-a2ef-437e-8e77-a6da1ab4af5b	6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c	cuong	https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg	Phụ Kiện Nữ	2	2	2000	0	3	active			f	[{"name":"Màu sắc","options":[]}]	[]	2	2	2	2	new	f	7	2026-07-17 05:56:09.202	2026-09-16 16:44:16.879	["https://res.cloudinary.com/dxkfusgxs/image/upload/v1784267742/zeromall/products/qq3md30ockv8wdtvkvka.jpg"]		20000	f	0	\N	fdf7905e-c3bd-4fe7-b979-5f0c2acc4f8a	0
7039c315-059c-4cdb-b53d-24175ee21b11	d9be6bae-681d-4b47-8e4f-aa95eac1ce49	HLE GUMAYUSI FANMEETING SEOUL	https://res.cloudinary.com/dxkfusgxs/image/upload/v1786723668/vko8e4q8yqblfv2fsev7.jpg	Sức Khỏe & Sắc Đẹp	HLE	bé trai biết làm nũng	200000	8	2	active	\N	\N	f	[]	[]	1	10	8	0.1	new	f	2	2026-08-14 16:09:16.647	2026-08-23 11:48:10.558	["https://res.cloudinary.com/dxkfusgxs/image/upload/v1786723668/vko8e4q8yqblfv2fsev7.jpg"]	https://www.youtube.com/watch?v=69ZDBWoj5YM&list=RDl_uzEREOKfo&index=9	200000	f	0	\N	\N	0
906d2fca-6704-4bd3-ae19-0557cc57de07	75c99eae-6bb1-4865-9f04-3b928b656b3f	sách giáo khoa 	https://res.cloudinary.com/dxkfusgxs/image/upload/v1787974056/s4ok2yluoey2qwlwmlmx.jpg	Nhà Cửa & Đời Sống	Sách	sách tốt	90000	50	0	active	\N	\N	f	[]	[]	50	50	50	50	new	f	2	2026-08-29 03:29:04.416	2026-08-29 03:29:04.416	["https://res.cloudinary.com/dxkfusgxs/image/upload/v1787974056/s4ok2yluoey2qwlwmlmx.jpg","https://res.cloudinary.com/dxkfusgxs/image/upload/v1787974057/jseahlr06ud96m0sokc0.jpg"]	\N	100000	f	0	\N	\N	62999.99999999999
6b711a5c-61ab-4aa8-93f7-f2bd13b61d10	75c99eae-6bb1-4865-9f04-3b928b656b3f	dép mwc	https://res.cloudinary.com/dxkfusgxs/image/upload/v1787974288/gzqsfv0tl6jbyasbn10j.png	Thời Trang Nam	mwc	dép tốt	180000	50	0	active	\N	\N	f	[]	[]	50	50	50	50	new	f	2	2026-08-29 03:32:02.592	2026-08-29 03:32:02.592	["https://res.cloudinary.com/dxkfusgxs/image/upload/v1787974288/gzqsfv0tl6jbyasbn10j.png","https://res.cloudinary.com/dxkfusgxs/image/upload/v1787974290/ami7zwl7gnswa6wd8bue.png"]	\N	200000	f	0	\N	\N	125999.99999999999
a9aea6bc-04dd-4377-8f67-02c68a29f74f	75c99eae-6bb1-4865-9f04-3b928b656b3f	giày sneaker	https://res.cloudinary.com/dxkfusgxs/image/upload/v1787974241/xlz46ls4hkb6qklnjvbg.jpg	Thời Trang Nam	sneaker	giày tốt	120000	45	5	active	\N	\N	f	[]	[]	50	50	50	50	new	f	2	2026-08-29 03:31:21.58	2026-08-29 03:36:58.351	["https://res.cloudinary.com/dxkfusgxs/image/upload/v1787974241/xlz46ls4hkb6qklnjvbg.jpg","https://res.cloudinary.com/dxkfusgxs/image/upload/v1787974243/dvnnbcyxtosbu8krqrge.jpg"]	\N	150000	f	0	\N	\N	84000
4c224cb7-0bb4-4514-b7d5-566c798ecf4b	26ccb7f3-909f-4523-aee7-8a9a1db54990	test 4/9	https://res.cloudinary.com/dxkfusgxs/image/upload/v1788492967/dtyqnxefmncfinmc7fgq.png	Điện Thoại & Phụ Kiện	kkk	ngon 	10000	50	0	active	\N	\N	f	[]	[]	1	1	1	1	new	f	2	2026-09-04 03:36:49.289	2026-09-04 03:36:49.289	["https://res.cloudinary.com/dxkfusgxs/image/upload/v1788492967/dtyqnxefmncfinmc7fgq.png"]	\N	100000	f	0	\N	\N	7000
9c18aa62-4c3f-49f0-bd69-31a53f92d35e	eec3f3ba-bf12-4643-bff5-580a5d6087b4	test89	https://res.cloudinary.com/dxkfusgxs/image/upload/v1788856453/f4tcctnio5rgavlbheyu.jpg	Thời Trang Nam	test	123	2000	22	0	active	\N	\N	f	[]	[]	20	12	12	21	new	f	2	2026-09-08 08:34:51.789	2026-09-08 08:34:51.789	["https://res.cloudinary.com/dxkfusgxs/image/upload/v1788856453/f4tcctnio5rgavlbheyu.jpg"]	\N	2000	f	0	\N	\N	1400
6f9ac050-3ab0-4333-9e14-59f29f15802e	2331d6e1-a082-45e7-8cc8-c2d497ba6832	test 189	https://res.cloudinary.com/dxkfusgxs/image/upload/v1789708502/ryt4pmkaccexcynz3kpy.png	Thời Trang Nam	1111	1111	20000	19	1	active	\N	\N	f	[]	[]	20	20	20	20	new	f	2	2026-09-18 05:15:14.767	2026-09-18 05:36:48.195	["https://res.cloudinary.com/dxkfusgxs/image/upload/v1789708502/ryt4pmkaccexcynz3kpy.png"]	\N	20000	f	0	\N	\N	14000
e05fd8f7-cc71-4393-bcdd-8aa206eadc21	2331d6e1-a082-45e7-8cc8-c2d497ba6832	test 179	https://res.cloudinary.com/dxkfusgxs/image/upload/v1789640853/rmbwt7dy9iaapnlzwfqe.png	Điện Thoại & Phụ Kiện	test 179	test179	2000	17	3	active	\N	\N	f	[]	[]	5	5	5	5	new	f	2	2026-09-17 10:30:33.815	2026-09-18 05:36:48.196	["https://res.cloudinary.com/dxkfusgxs/image/upload/v1789640853/rmbwt7dy9iaapnlzwfqe.png"]	\N	2000	f	0	\N	\N	1400
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
-- Name: UserAddress UserAddress_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth."UserAddress"
    ADD CONSTRAINT "UserAddress_pkey" PRIMARY KEY (id);


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
-- Name: DriverAttendance DriverAttendance_pkey; Type: CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."DriverAttendance"
    ADD CONSTRAINT "DriverAttendance_pkey" PRIMARY KEY (id);


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
-- Name: ReturnEvidence ReturnEvidence_pkey; Type: CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."ReturnEvidence"
    ADD CONSTRAINT "ReturnEvidence_pkey" PRIMARY KEY (id);


--
-- Name: ReturnItem ReturnItem_pkey; Type: CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."ReturnItem"
    ADD CONSTRAINT "ReturnItem_pkey" PRIMARY KEY (id);


--
-- Name: ReturnNegotiation ReturnNegotiation_pkey; Type: CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."ReturnNegotiation"
    ADD CONSTRAINT "ReturnNegotiation_pkey" PRIMARY KEY (id);


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
-- Name: UserAddress_userId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "UserAddress_userId_idx" ON auth."UserAddress" USING btree ("userId");


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
-- Name: Return_returnNumber_key; Type: INDEX; Schema: delivery; Owner: postgres
--

CREATE UNIQUE INDEX "Return_returnNumber_key" ON delivery."Return" USING btree ("returnNumber");


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
-- Name: EscrowTransaction_orderId_shopId_key; Type: INDEX; Schema: payment; Owner: postgres
--

CREATE UNIQUE INDEX "EscrowTransaction_orderId_shopId_key" ON payment."EscrowTransaction" USING btree ("orderId", "shopId");


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
-- Name: UserAddress UserAddress_userId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth."UserAddress"
    ADD CONSTRAINT "UserAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: DriverAttendance DriverAttendance_driverId_fkey; Type: FK CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."DriverAttendance"
    ADD CONSTRAINT "DriverAttendance_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES delivery."Driver"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: ReturnEvidence ReturnEvidence_returnId_fkey; Type: FK CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."ReturnEvidence"
    ADD CONSTRAINT "ReturnEvidence_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES delivery."Return"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReturnItem ReturnItem_returnId_fkey; Type: FK CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."ReturnItem"
    ADD CONSTRAINT "ReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES delivery."Return"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReturnNegotiation ReturnNegotiation_returnId_fkey; Type: FK CONSTRAINT; Schema: delivery; Owner: postgres
--

ALTER TABLE ONLY delivery."ReturnNegotiation"
    ADD CONSTRAINT "ReturnNegotiation_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES delivery."Return"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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

\unrestrict nlH6ZDsgYPceMRgmTVTgQBElL6b3b0L0u38KA5INcWx0FqoBA7YuU94yPfKN6AM

