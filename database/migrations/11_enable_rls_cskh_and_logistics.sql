-- Migration: 11_enable_rls_cskh_and_logistics.sql
-- Description: Thiết lập Row Level Security (RLS) & Chính sách kiểm soát truy cập cho Phân hệ CSKH (Disputes/Returns/Claims) và Logistics Fleet (SPX).
-- Áp dụng quy chuẩn: supabase-postgres-best-practices (security-rls-basics.md, security-rls-performance.md, security-privileges.md).

-- ============================================================================
-- 1. Helper Schema & Session Functions cho CSKH và Logistics
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS app;

-- 1.1 Lấy Hub ID của phiên hiện tại (Bưu cục / Trung tâm phân loại Mega SOC)
CREATE OR REPLACE FUNCTION app.current_hub_id() 
RETURNS text 
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_hub_id', true), '');
$$;

-- 1.2 Lấy Driver ID của phiên hiện tại
-- Hỗ trợ set trực tiếp app.current_driver_id hoặc tự động tra cứu từ app.current_user_id()
CREATE OR REPLACE FUNCTION app.current_driver_id() 
RETURNS text 
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_driver_id text;
  v_user_id text;
BEGIN
  v_driver_id := NULLIF(current_setting('app.current_driver_id', true), '');
  IF v_driver_id IS NOT NULL THEN
    RETURN v_driver_id;
  END IF;

  v_user_id := NULLIF(current_setting('app.current_user_id', true), '');
  IF v_user_id IS NOT NULL THEN
    SELECT d.id INTO v_driver_id
    FROM delivery."Driver" d
    WHERE d."userId" = v_user_id
    LIMIT 1;
    RETURN v_driver_id;
  END IF;

  RETURN NULL;
END;
$$;

-- 1.3 Kiểm tra quyền CSKH (Customer Support / PLATFORM_SUPPORT / Arbitrator)
CREATE OR REPLACE FUNCTION app.is_cskh() 
RETURNS boolean 
LANGUAGE sql STABLE
AS $$
  SELECT (
    (SELECT app.is_admin())
    OR LOWER(COALESCE(current_setting('app.current_user_role', true), '')) IN ('platform_support', 'cskh', 'support')
  );
$$;

-- 1.4 Kiểm tra quyền Tháp điều hành Logistics (Control Tower / Logistics Operator)
CREATE OR REPLACE FUNCTION app.is_logistics_operator() 
RETURNS boolean 
LANGUAGE sql STABLE
AS $$
  SELECT (
    (SELECT app.is_admin())
    OR LOWER(COALESCE(current_setting('app.current_user_role', true), '')) IN ('logistics_operator', 'spx_admin', 'control_tower')
  );
$$;

-- 1.5 Kiểm tra quyền Trưởng bưu cục / Thu ngân Hub (Hub Operator / Hub Cashier)
CREATE OR REPLACE FUNCTION app.is_hub_operator() 
RETURNS boolean 
LANGUAGE sql STABLE
AS $$
  SELECT (
    (SELECT app.is_logistics_operator())
    OR LOWER(COALESCE(current_setting('app.current_user_role', true), '')) IN ('hub_operator', 'hub_cashier')
  );
$$;

-- ============================================================================
-- 2. Đánh Index bổ sung cho các trường tra cứu trong RLS
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_driver_userid ON delivery."Driver"("userId");
CREATE INDEX IF NOT EXISTS idx_driverattendance_hubid ON delivery."DriverAttendance"("hubId");
CREATE INDEX IF NOT EXISTS idx_claim_sellerid ON delivery."Claim"("sellerId");
CREATE INDEX IF NOT EXISTS idx_claim_buyerid ON delivery."Claim"("buyerId");

-- ============================================================================
-- 3. Phân hệ CSKH: Khiếu nại, Trả hàng & Đổi trả (Returns & Claims)
-- ============================================================================

-- A. Yêu cầu đổi trả (delivery."Return")
ALTER TABLE delivery."Return" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_return_cskh_admin ON delivery."Return";
CREATE POLICY p_return_cskh_admin ON delivery."Return"
  FOR ALL
  USING ((SELECT app.is_cskh()));

DROP POLICY IF EXISTS p_return_buyer_select ON delivery."Return";
CREATE POLICY p_return_buyer_select ON delivery."Return"
  FOR SELECT
  USING ("buyerId" = (SELECT app.current_user_id()));

DROP POLICY IF EXISTS p_return_buyer_insert ON delivery."Return";
CREATE POLICY p_return_buyer_insert ON delivery."Return"
  FOR INSERT
  WITH CHECK ("buyerId" = (SELECT app.current_user_id()));

DROP POLICY IF EXISTS p_return_buyer_update ON delivery."Return";
CREATE POLICY p_return_buyer_update ON delivery."Return"
  FOR UPDATE
  USING ("buyerId" = (SELECT app.current_user_id()))
  WITH CHECK ("buyerId" = (SELECT app.current_user_id()));

DROP POLICY IF EXISTS p_return_seller_select ON delivery."Return";
CREATE POLICY p_return_seller_select ON delivery."Return"
  FOR SELECT
  USING ("sellerId" = (SELECT app.current_shop_id()));

DROP POLICY IF EXISTS p_return_seller_update ON delivery."Return";
CREATE POLICY p_return_seller_update ON delivery."Return"
  FOR UPDATE
  USING ("sellerId" = (SELECT app.current_shop_id()))
  WITH CHECK ("sellerId" = (SELECT app.current_shop_id()));

-- B. Bằng chứng đổi trả (delivery."ReturnEvidence")
ALTER TABLE delivery."ReturnEvidence" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_return_evidence_cskh_admin ON delivery."ReturnEvidence";
CREATE POLICY p_return_evidence_cskh_admin ON delivery."ReturnEvidence"
  FOR ALL
  USING ((SELECT app.is_cskh()));

DROP POLICY IF EXISTS p_return_evidence_parties_select ON delivery."ReturnEvidence";
CREATE POLICY p_return_evidence_parties_select ON delivery."ReturnEvidence"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM delivery."Return" r
      WHERE r.id = "returnId"
        AND (r."buyerId" = (SELECT app.current_user_id()) OR r."sellerId" = (SELECT app.current_shop_id()))
    )
  );

DROP POLICY IF EXISTS p_return_evidence_parties_insert ON delivery."ReturnEvidence";
CREATE POLICY p_return_evidence_parties_insert ON delivery."ReturnEvidence"
  FOR INSERT
  WITH CHECK (
    "uploadedBy" = (SELECT app.current_user_id())
    AND EXISTS (
      SELECT 1 FROM delivery."Return" r
      WHERE r.id = "returnId"
        AND (r."buyerId" = (SELECT app.current_user_id()) OR r."sellerId" = (SELECT app.current_shop_id()))
    )
  );

-- C. Lịch sử thương lượng đổi trả (delivery."ReturnNegotiation")
ALTER TABLE delivery."ReturnNegotiation" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_return_neg_cskh_admin ON delivery."ReturnNegotiation";
CREATE POLICY p_return_neg_cskh_admin ON delivery."ReturnNegotiation"
  FOR ALL
  USING ((SELECT app.is_cskh()));

DROP POLICY IF EXISTS p_return_neg_parties_select ON delivery."ReturnNegotiation";
CREATE POLICY p_return_neg_parties_select ON delivery."ReturnNegotiation"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM delivery."Return" r
      WHERE r.id = "returnId"
        AND (r."buyerId" = (SELECT app.current_user_id()) OR r."sellerId" = (SELECT app.current_shop_id()))
    )
  );

DROP POLICY IF EXISTS p_return_neg_parties_insert ON delivery."ReturnNegotiation";
CREATE POLICY p_return_neg_parties_insert ON delivery."ReturnNegotiation"
  FOR INSERT
  WITH CHECK (
    "proposedBy" = (SELECT app.current_user_id())
    AND EXISTS (
      SELECT 1 FROM delivery."Return" r
      WHERE r.id = "returnId"
        AND (r."buyerId" = (SELECT app.current_user_id()) OR r."sellerId" = (SELECT app.current_shop_id()))
    )
  );

-- D. Danh mục sản phẩm yêu cầu đổi trả (delivery."ReturnItem")
ALTER TABLE delivery."ReturnItem" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_return_item_cskh_admin ON delivery."ReturnItem";
CREATE POLICY p_return_item_cskh_admin ON delivery."ReturnItem"
  FOR ALL
  USING ((SELECT app.is_cskh()));

DROP POLICY IF EXISTS p_return_item_parties_select ON delivery."ReturnItem";
CREATE POLICY p_return_item_parties_select ON delivery."ReturnItem"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM delivery."Return" r
      WHERE r.id = "returnId"
        AND (r."buyerId" = (SELECT app.current_user_id()) OR r."sellerId" = (SELECT app.current_shop_id()))
    )
  );

DROP POLICY IF EXISTS p_return_item_buyer_insert ON delivery."ReturnItem";
CREATE POLICY p_return_item_buyer_insert ON delivery."ReturnItem"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM delivery."Return" r
      WHERE r.id = "returnId"
        AND r."buyerId" = (SELECT app.current_user_id())
    )
  );

-- E. Khiếu nại đền bù bưu kiện (delivery."Claim")
ALTER TABLE delivery."Claim" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_claim_cskh_admin ON delivery."Claim";
CREATE POLICY p_claim_cskh_admin ON delivery."Claim"
  FOR ALL
  USING ((SELECT app.is_cskh()));

DROP POLICY IF EXISTS p_claim_seller_select ON delivery."Claim";
CREATE POLICY p_claim_seller_select ON delivery."Claim"
  FOR SELECT
  USING ("sellerId" = (SELECT app.current_shop_id()));

DROP POLICY IF EXISTS p_claim_seller_insert ON delivery."Claim";
CREATE POLICY p_claim_seller_insert ON delivery."Claim"
  FOR INSERT
  WITH CHECK ("sellerId" = (SELECT app.current_shop_id()));

DROP POLICY IF EXISTS p_claim_seller_update ON delivery."Claim";
CREATE POLICY p_claim_seller_update ON delivery."Claim"
  FOR UPDATE
  USING ("sellerId" = (SELECT app.current_shop_id()))
  WITH CHECK ("sellerId" = (SELECT app.current_shop_id()));

DROP POLICY IF EXISTS p_claim_buyer_select ON delivery."Claim";
CREATE POLICY p_claim_buyer_select ON delivery."Claim"
  FOR SELECT
  USING ("buyerId" = (SELECT app.current_user_id()));

-- F. Bằng chứng khiếu nại đền bù (delivery."ClaimEvidence")
ALTER TABLE delivery."ClaimEvidence" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_claim_evidence_cskh_admin ON delivery."ClaimEvidence";
CREATE POLICY p_claim_evidence_cskh_admin ON delivery."ClaimEvidence"
  FOR ALL
  USING ((SELECT app.is_cskh()));

DROP POLICY IF EXISTS p_claim_evidence_parties_select ON delivery."ClaimEvidence";
CREATE POLICY p_claim_evidence_parties_select ON delivery."ClaimEvidence"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM delivery."Claim" c
      WHERE c.id = "claimId"
        AND (c."sellerId" = (SELECT app.current_shop_id()) OR c."buyerId" = (SELECT app.current_user_id()))
    )
  );

DROP POLICY IF EXISTS p_claim_evidence_parties_insert ON delivery."ClaimEvidence";
CREATE POLICY p_claim_evidence_parties_insert ON delivery."ClaimEvidence"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM delivery."Claim" c
      WHERE c.id = "claimId"
        AND (c."sellerId" = (SELECT app.current_shop_id()) OR c."buyerId" = (SELECT app.current_user_id()))
    )
  );

-- ============================================================================
-- 4. Phân hệ Logistics SPX: Tài xế, Bưu cục, Quét kiện & Dòng tiền COD
-- ============================================================================

-- G. Hồ sơ & Đội ngũ Tài xế (delivery."Driver")
ALTER TABLE delivery."Driver" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_driver_admin_logistics ON delivery."Driver";
CREATE POLICY p_driver_admin_logistics ON delivery."Driver"
  FOR ALL
  USING ((SELECT app.is_logistics_operator()));

DROP POLICY IF EXISTS p_driver_hub_operator ON delivery."Driver";
CREATE POLICY p_driver_hub_operator ON delivery."Driver"
  FOR SELECT
  USING (
    (SELECT app.is_hub_operator())
    AND ("hubId" = (SELECT app.current_hub_id()) OR (SELECT app.is_logistics_operator()))
  );

DROP POLICY IF EXISTS p_driver_self_select ON delivery."Driver";
CREATE POLICY p_driver_self_select ON delivery."Driver"
  FOR SELECT
  USING (
    id = (SELECT app.current_driver_id())
    OR "userId" = (SELECT app.current_user_id())
  );

DROP POLICY IF EXISTS p_driver_self_update ON delivery."Driver";
CREATE POLICY p_driver_self_update ON delivery."Driver"
  FOR UPDATE
  USING (
    id = (SELECT app.current_driver_id())
    OR "userId" = (SELECT app.current_user_id())
  )
  WITH CHECK (
    id = (SELECT app.current_driver_id())
    OR "userId" = (SELECT app.current_user_id())
  );

-- H. Điểm danh tài xế & GPS (delivery."DriverAttendance")
ALTER TABLE delivery."DriverAttendance" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_attendance_admin_logistics ON delivery."DriverAttendance";
CREATE POLICY p_attendance_admin_logistics ON delivery."DriverAttendance"
  FOR ALL
  USING ((SELECT app.is_logistics_operator()));

DROP POLICY IF EXISTS p_attendance_hub_operator ON delivery."DriverAttendance";
CREATE POLICY p_attendance_hub_operator ON delivery."DriverAttendance"
  FOR ALL
  USING (
    (SELECT app.is_hub_operator())
    AND "hubId" = (SELECT app.current_hub_id())
  );

DROP POLICY IF EXISTS p_attendance_driver_select ON delivery."DriverAttendance";
CREATE POLICY p_attendance_driver_select ON delivery."DriverAttendance"
  FOR SELECT
  USING ("driverId" = (SELECT app.current_driver_id()));

DROP POLICY IF EXISTS p_attendance_driver_insert ON delivery."DriverAttendance";
CREATE POLICY p_attendance_driver_insert ON delivery."DriverAttendance"
  FOR INSERT
  WITH CHECK ("driverId" = (SELECT app.current_driver_id()));

DROP POLICY IF EXISTS p_attendance_driver_update ON delivery."DriverAttendance";
CREATE POLICY p_attendance_driver_update ON delivery."DriverAttendance"
  FOR UPDATE
  USING ("driverId" = (SELECT app.current_driver_id()))
  WITH CHECK ("driverId" = (SELECT app.current_driver_id()));

-- I. Quét mã luân chuyển tại Hub (delivery."HubScan")
ALTER TABLE delivery."HubScan" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_hubscan_admin_logistics ON delivery."HubScan";
CREATE POLICY p_hubscan_admin_logistics ON delivery."HubScan"
  FOR ALL
  USING ((SELECT app.is_logistics_operator()));

DROP POLICY IF EXISTS p_hubscan_hub_operator ON delivery."HubScan";
CREATE POLICY p_hubscan_hub_operator ON delivery."HubScan"
  FOR ALL
  USING (
    (SELECT app.is_hub_operator())
    AND "hubId" = (SELECT app.current_hub_id())
  );

DROP POLICY IF EXISTS p_hubscan_driver_select ON delivery."HubScan";
CREATE POLICY p_hubscan_driver_select ON delivery."HubScan"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM delivery."DeliveryAssignment" da
      WHERE da."shipmentId" = "HubScan"."shipmentId"
        AND da."driverId" = (SELECT app.current_driver_id())
    )
  );

-- J. Giao dịch thu hộ tiền mặt (delivery."CodTransaction")
ALTER TABLE delivery."CodTransaction" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_cod_admin_logistics ON delivery."CodTransaction";
CREATE POLICY p_cod_admin_logistics ON delivery."CodTransaction"
  FOR ALL
  USING ((SELECT app.is_logistics_operator()));

DROP POLICY IF EXISTS p_cod_hub_operator ON delivery."CodTransaction";
CREATE POLICY p_cod_hub_operator ON delivery."CodTransaction"
  FOR ALL
  USING (
    (SELECT app.is_hub_operator())
    AND EXISTS (
      SELECT 1 FROM delivery."Shipment" s
      WHERE s.id = "shipmentId"
        AND s."currentHubId" = (SELECT app.current_hub_id())
    )
  );

DROP POLICY IF EXISTS p_cod_seller_select ON delivery."CodTransaction";
CREATE POLICY p_cod_seller_select ON delivery."CodTransaction"
  FOR SELECT
  USING ("sellerId" = (SELECT app.current_shop_id()));

DROP POLICY IF EXISTS p_cod_driver_select ON delivery."CodTransaction";
CREATE POLICY p_cod_driver_select ON delivery."CodTransaction"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM delivery."DeliveryAssignment" da
      WHERE da."shipmentId" = "CodTransaction"."shipmentId"
        AND da."driverId" = (SELECT app.current_driver_id())
    )
  );

-- K. Bảng đối soát tài chính người bán (delivery."Settlement")
ALTER TABLE delivery."Settlement" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_settlement_admin ON delivery."Settlement";
CREATE POLICY p_settlement_admin ON delivery."Settlement"
  FOR ALL
  USING ((SELECT app.is_admin()));

DROP POLICY IF EXISTS p_settlement_seller_select ON delivery."Settlement";
CREATE POLICY p_settlement_seller_select ON delivery."Settlement"
  FOR SELECT
  USING ("sellerId" = (SELECT app.current_shop_id()));

-- L. Vận đơn bưu kiện (delivery."Shipment")
ALTER TABLE delivery."Shipment" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_shipment_admin_logistics_cskh ON delivery."Shipment";
CREATE POLICY p_shipment_admin_logistics_cskh ON delivery."Shipment"
  FOR ALL
  USING ((SELECT app.is_logistics_operator()) OR (SELECT app.is_cskh()));

DROP POLICY IF EXISTS p_shipment_hub_operator ON delivery."Shipment";
CREATE POLICY p_shipment_hub_operator ON delivery."Shipment"
  FOR SELECT
  USING (
    (SELECT app.is_hub_operator())
    AND "currentHubId" = (SELECT app.current_hub_id())
  );

DROP POLICY IF EXISTS p_shipment_driver_select ON delivery."Shipment";
CREATE POLICY p_shipment_driver_select ON delivery."Shipment"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM delivery."DeliveryAssignment" da
      WHERE da."shipmentId" = "Shipment".id
        AND da."driverId" = (SELECT app.current_driver_id())
    )
  );

DROP POLICY IF EXISTS p_shipment_seller_select ON delivery."Shipment";
CREATE POLICY p_shipment_seller_select ON delivery."Shipment"
  FOR SELECT
  USING ("sellerId" = (SELECT app.current_shop_id()));

DROP POLICY IF EXISTS p_shipment_buyer_select ON delivery."Shipment";
CREATE POLICY p_shipment_buyer_select ON delivery."Shipment"
  FOR SELECT
  USING ("buyerId" = (SELECT app.current_user_id()));

-- M. Lịch sử hành trình vận đơn (delivery."ShipmentTracking")
ALTER TABLE delivery."ShipmentTracking" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_tracking_admin_logistics_cskh ON delivery."ShipmentTracking";
CREATE POLICY p_tracking_admin_logistics_cskh ON delivery."ShipmentTracking"
  FOR ALL
  USING ((SELECT app.is_logistics_operator()) OR (SELECT app.is_cskh()));

DROP POLICY IF EXISTS p_tracking_stakeholders_select ON delivery."ShipmentTracking";
CREATE POLICY p_tracking_stakeholders_select ON delivery."ShipmentTracking"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM delivery."Shipment" s
      WHERE s.id = "shipmentId"
        AND (
          s."buyerId" = (SELECT app.current_user_id())
          OR s."sellerId" = (SELECT app.current_shop_id())
          OR (s."currentHubId" = (SELECT app.current_hub_id()) AND (SELECT app.is_hub_operator()))
          OR EXISTS (
            SELECT 1 FROM delivery."DeliveryAssignment" da
            WHERE da."shipmentId" = s.id
              AND da."driverId" = (SELECT app.current_driver_id())
          )
        )
    )
  );
