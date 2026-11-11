-- Migration: 10_autovacuum_tuning_and_updated_at_triggers.sql
-- Description: Cấu hình Autovacuum chuyên biệt chống phình bảng (Table Bloat) & Tự động hóa cập nhật updatedAt bằng Triggers.
-- Áp dụng quy chuẩn: supabase-postgres-best-practices (monitor-vacuum-analyze.md, schema-constraints.md).

-- 1. Hàm Trigger tự động cập nhật cột "updatedAt"
CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Gắn Trigger BEFORE UPDATE tự động cho các bảng nghiệp vụ có cột "updatedAt"
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT table_schema, table_name
    FROM information_schema.columns
    WHERE column_name = 'updatedAt'
      AND table_schema IN ('auth', 'product', 'order', 'payment', 'delivery', 'discount', 'notification', 'chat')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON %I.%I;', t.table_schema, t.table_name);
    EXECUTE format('CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON %I.%I FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();', t.table_schema, t.table_name);
  END LOOP;
END $$;

-- 3. Tinh chỉnh Autovacuum cho các bảng có tần suất giao dịch / thay đổi trạng thái cao (High-churn Tables)
-- Dọn rác khi đạt 5% dead tuples (mặc định 20%) và cập nhật thống kê khi có 2% thay đổi (mặc định 10%)

ALTER TABLE "order"."Order" SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE "order"."OrderItem" SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE payment."Wallet" SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE payment."WalletTransaction" SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE payment."EscrowTransaction" SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE product."Product" SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE delivery."Shipment" SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE delivery."ShipmentTracking" SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE delivery."DeliveryAssignment" SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE discount."Voucher" SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

-- 4. Chạy ANALYZE ngay lập tức để làm tươi mới 100% số liệu thống kê cho PostgreSQL Query Planner
ANALYZE auth."User", auth."Shop", auth."UserAddress";
ANALYZE product."Product", product."Category", product."Review";
ANALYZE "order"."Order", "order"."OrderItem";
ANALYZE payment."Wallet", payment."WalletTransaction", payment."EscrowTransaction", payment."Transaction";
ANALYZE delivery."Shipment", delivery."ShipmentTracking", delivery."DeliveryAssignment", delivery."Driver", delivery."Hub";
ANALYZE discount."Voucher", discount."VoucherUsage";
