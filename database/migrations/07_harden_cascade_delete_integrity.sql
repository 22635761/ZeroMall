-- Migration: 07_harden_cascade_delete_integrity.sql
-- Description: Chuyển đổi các khóa ngoại phá hủy (ON DELETE CASCADE) sang ON DELETE SET NULL an toàn.
-- Ngăn chặn xóa sổ hàng loạt Tài xế và Dữ liệu quét bưu kiện (HubScan) khi thao tác với Bưu cục (Hub).
-- Áp dụng quy chuẩn: supabase-postgres-best-practices (schema-constraints.md, schema-foreign-key-indexes.md).

-- 1. Bảng delivery."Driver": hubId chuyển sang NULLable và ON DELETE SET NULL
ALTER TABLE delivery."Driver" ALTER COLUMN "hubId" DROP NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Driver_hubId_fkey'
    AND conrelid = 'delivery."Driver"'::regclass
  ) THEN
    ALTER TABLE delivery."Driver" DROP CONSTRAINT "Driver_hubId_fkey";
  END IF;

  ALTER TABLE delivery."Driver"
  ADD CONSTRAINT "Driver_hubId_fkey"
  FOREIGN KEY ("hubId") REFERENCES delivery."Hub"(id)
  ON UPDATE CASCADE ON DELETE SET NULL;
END $$;

-- 2. Bảng delivery."HubScan": hubId chuyển sang NULLable và ON DELETE SET NULL
ALTER TABLE delivery."HubScan" ALTER COLUMN "hubId" DROP NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'HubScan_hubId_fkey'
    AND conrelid = 'delivery."HubScan"'::regclass
  ) THEN
    ALTER TABLE delivery."HubScan" DROP CONSTRAINT "HubScan_hubId_fkey";
  END IF;

  ALTER TABLE delivery."HubScan"
  ADD CONSTRAINT "HubScan_hubId_fkey"
  FOREIGN KEY ("hubId") REFERENCES delivery."Hub"(id)
  ON UPDATE CASCADE ON DELETE SET NULL;
END $$;

-- 3. Bảng delivery."DriverAttendance": hubId chuyển sang NULLable
ALTER TABLE delivery."DriverAttendance" ALTER COLUMN "hubId" DROP NOT NULL;
