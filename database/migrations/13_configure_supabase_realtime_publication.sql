-- Migration: 13_configure_supabase_realtime_publication.sql
-- Description: Cấu hình Supabase Realtime Publication & REPLICA IDENTITY FULL cho các bảng sự kiện trọng yếu.
-- Áp dụng quy chuẩn: supabase skill (Realtime selective subscriptions) & supabase-postgres-best-practices.

-- ============================================================================
-- 1. Bật REPLICA IDENTITY FULL trên các bảng sự kiện trọng yếu
-- Mục đích: Khi có sự kiện UPDATE / DELETE, PostgreSQL WAL và Supabase Realtime
-- sẽ gửi kèm toàn bộ dữ liệu trước và sau của dòng thay đổi (Old Record + New Record),
-- giúp Frontend và Realtime Client xử lý chính xác mà không cần truy vấn lại CSDL.
-- ============================================================================

ALTER TABLE "order"."Order" REPLICA IDENTITY FULL;
ALTER TABLE delivery."Return" REPLICA IDENTITY FULL;
ALTER TABLE delivery."Shipment" REPLICA IDENTITY FULL;
ALTER TABLE delivery."DeliveryAssignment" REPLICA IDENTITY FULL;

-- ============================================================================
-- 2. Khởi tạo & Cấu hình Publication: supabase_realtime
-- Lưu ý bảo mật & hiệu năng: KHÔNG sử dụng FOR ALL TABLES vì sẽ gây nghẽn WAL,
-- lãng phí băng thông mạng và CPU. Chỉ đăng ký các bảng có nhu cầu phát Realtime.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Bổ sung an toàn các bảng nghiệp vụ vào publication supabase_realtime (Idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'order' AND tablename = 'Order'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "order"."Order";
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'delivery' AND tablename = 'Return'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE delivery."Return";
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'delivery' AND tablename = 'Shipment'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE delivery."Shipment";
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'delivery' AND tablename = 'DeliveryAssignment'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE delivery."DeliveryAssignment";
  END IF;
END $$;
