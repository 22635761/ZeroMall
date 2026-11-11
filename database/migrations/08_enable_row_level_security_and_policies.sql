-- Migration: 08_enable_row_level_security_and_policies.sql
-- Description: Thiết lập Row Level Security (RLS) & Chính sách cách ly dữ liệu Đa người thuê (Multi-Tenant Isolation).
-- Áp dụng quy chuẩn: supabase-postgres-best-practices (security-rls-basics.md, security-rls-performance.md, security-privileges.md).

-- 1. Helper Schema & Session Functions
CREATE SCHEMA IF NOT EXISTS app;

-- Lấy User ID của phiên hiện tại (từ JWT claim hoặc application context)
CREATE OR REPLACE FUNCTION app.current_user_id() 
RETURNS text 
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '');
$$;

-- Lấy Shop ID của phiên hiện tại
CREATE OR REPLACE FUNCTION app.current_shop_id() 
RETURNS text 
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_shop_id', true), '');
$$;

-- Lấy Role của phiên hiện tại ('admin', 'seller', 'buyer', 'driver', 'anon')
CREATE OR REPLACE FUNCTION app.current_user_role() 
RETURNS text 
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(NULLIF(current_setting('app.current_user_role', true), ''), 'anon');
$$;

-- Kiểm tra xem phiên có quyền quản trị tối cao (Admin / Superuser / Service Role) hay không
CREATE OR REPLACE FUNCTION app.is_admin() 
RETURNS boolean 
LANGUAGE sql STABLE
AS $$
  SELECT (
    current_user = 'postgres' 
    OR current_setting('app.is_service_role', true) = 'true'
    OR current_setting('app.current_user_role', true) = 'admin'
  );
$$;

-- 2. Kích hoạt RLS & Tạo Chính sách Bảo mật (RLS Policies)

-- A. Sổ địa chỉ người dùng (auth."UserAddress")
ALTER TABLE auth."UserAddress" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_useraddress_admin ON auth."UserAddress";
CREATE POLICY p_useraddress_admin ON auth."UserAddress"
  FOR ALL
  USING ((SELECT app.is_admin()));

DROP POLICY IF EXISTS p_useraddress_owner ON auth."UserAddress";
CREATE POLICY p_useraddress_owner ON auth."UserAddress"
  FOR ALL
  USING ("userId" = (SELECT app.current_user_id()))
  WITH CHECK ("userId" = (SELECT app.current_user_id()));

-- B. Ví tiền điện tử (payment."Wallet")
ALTER TABLE payment."Wallet" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_wallet_admin ON payment."Wallet";
CREATE POLICY p_wallet_admin ON payment."Wallet"
  FOR ALL
  USING ((SELECT app.is_admin()));

DROP POLICY IF EXISTS p_wallet_owner ON payment."Wallet";
CREATE POLICY p_wallet_owner ON payment."Wallet"
  FOR SELECT
  USING ("buyerId" = (SELECT app.current_user_id()));

-- C. Biến động số dư ví (payment."WalletTransaction")
ALTER TABLE payment."WalletTransaction" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_wallet_tx_admin ON payment."WalletTransaction";
CREATE POLICY p_wallet_tx_admin ON payment."WalletTransaction"
  FOR ALL
  USING ((SELECT app.is_admin()));

DROP POLICY IF EXISTS p_wallet_tx_owner ON payment."WalletTransaction";
CREATE POLICY p_wallet_tx_owner ON payment."WalletTransaction"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM payment."Wallet" w
      WHERE w.id = "walletId"
        AND w."buyerId" = (SELECT app.current_user_id())
    )
  );

-- D. Đơn hàng (order."Order")
ALTER TABLE "order"."Order" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_order_admin ON "order"."Order";
CREATE POLICY p_order_admin ON "order"."Order"
  FOR ALL
  USING ((SELECT app.is_admin()));

DROP POLICY IF EXISTS p_order_buyer ON "order"."Order";
CREATE POLICY p_order_buyer ON "order"."Order"
  FOR SELECT
  USING ("buyerId" = (SELECT app.current_user_id()));

DROP POLICY IF EXISTS p_order_seller ON "order"."Order";
CREATE POLICY p_order_seller ON "order"."Order"
  FOR SELECT
  USING ("shopId" = (SELECT app.current_shop_id()));

-- E. Chi tiết đơn hàng (order."OrderItem")
ALTER TABLE "order"."OrderItem" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_orderitem_admin ON "order"."OrderItem";
CREATE POLICY p_orderitem_admin ON "order"."OrderItem"
  FOR ALL
  USING ((SELECT app.is_admin()));

DROP POLICY IF EXISTS p_orderitem_buyer ON "order"."OrderItem";
CREATE POLICY p_orderitem_buyer ON "order"."OrderItem"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "order"."Order" o
      WHERE o.id = "orderId"
        AND o."buyerId" = (SELECT app.current_user_id())
    )
  );

DROP POLICY IF EXISTS p_orderitem_seller ON "order"."OrderItem";
CREATE POLICY p_orderitem_seller ON "order"."OrderItem"
  FOR SELECT
  USING ("shopId" = (SELECT app.current_shop_id()));

-- F. Sản phẩm (product."Product")
ALTER TABLE product."Product" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_product_admin ON product."Product";
CREATE POLICY p_product_admin ON product."Product"
  FOR ALL
  USING ((SELECT app.is_admin()));

DROP POLICY IF EXISTS p_product_public ON product."Product";
CREATE POLICY p_product_public ON product."Product"
  FOR SELECT
  USING (status <> 'hidden');

DROP POLICY IF EXISTS p_product_seller ON product."Product";
CREATE POLICY p_product_seller ON product."Product"
  FOR ALL
  USING ("shopId" = (SELECT app.current_shop_id()))
  WITH CHECK ("shopId" = (SELECT app.current_shop_id()));

-- G. Phân công giao vận tài xế (delivery."DeliveryAssignment")
ALTER TABLE delivery."DeliveryAssignment" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_assignment_admin ON delivery."DeliveryAssignment";
CREATE POLICY p_assignment_admin ON delivery."DeliveryAssignment"
  FOR ALL
  USING ((SELECT app.is_admin()));

DROP POLICY IF EXISTS p_assignment_driver ON delivery."DeliveryAssignment";
CREATE POLICY p_assignment_driver ON delivery."DeliveryAssignment"
  FOR ALL
  USING ("driverId" = (SELECT app.current_user_id()))
  WITH CHECK ("driverId" = (SELECT app.current_user_id()));
