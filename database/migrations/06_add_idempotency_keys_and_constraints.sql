-- Migration: 06_add_idempotency_keys_and_constraints.sql
-- Description: Thêm cột idempotencyKey và ràng buộc UNIQUE để chống nhân đôi giao dịch (Duplicate Order & Double Charge Prevention).
-- Áp dụng quy chuẩn: supabase-postgres-best-practices (schema-constraints.md, data-upsert.md).

-- 1. Schema "order": Bảng "Order"
ALTER TABLE "order"."Order" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_order_idempotency_key'
    AND conrelid = '"order"."Order"'::regclass
  ) THEN
    ALTER TABLE "order"."Order"
    ADD CONSTRAINT uq_order_idempotency_key UNIQUE ("idempotencyKey");
  END IF;
END $$;

-- 2. Schema "payment": Bảng "WithdrawRequest"
ALTER TABLE payment."WithdrawRequest" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_withdraw_idempotency_key'
    AND conrelid = 'payment."WithdrawRequest"'::regclass
  ) THEN
    ALTER TABLE payment."WithdrawRequest"
    ADD CONSTRAINT uq_withdraw_idempotency_key UNIQUE ("idempotencyKey");
  END IF;
END $$;
