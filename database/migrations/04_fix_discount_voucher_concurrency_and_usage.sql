-- Migration: 04_fix_discount_voucher_concurrency_and_usage.sql
-- Description: Thêm ràng buộc toàn vẹn cho Voucher và chống lạm dụng mã giảm giá.
-- Áp dụng quy chuẩn: supabase-postgres-best-practices (schema-constraints.md).

DO $$
BEGIN
  -- 1. Ràng buộc Số lượt đã dùng không vượt quá Hạn mức tối đa
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_voucher_used_limit'
    AND conrelid = 'discount."Voucher"'::regclass
  ) THEN
    ALTER TABLE discount."Voucher"
    ADD CONSTRAINT chk_voucher_used_limit CHECK ("usedCount" <= "usageLimit");
  END IF;

  -- 2. Ràng buộc Số lượt đã dùng không âm
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_voucher_used_non_negative'
    AND conrelid = 'discount."Voucher"'::regclass
  ) THEN
    ALTER TABLE discount."Voucher"
    ADD CONSTRAINT chk_voucher_used_non_negative CHECK ("usedCount" >= 0);
  END IF;

  -- 3. Ràng buộc Mức giảm giá phải lớn hơn 0
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_voucher_value_positive'
    AND conrelid = 'discount."Voucher"'::regclass
  ) THEN
    ALTER TABLE discount."Voucher"
    ADD CONSTRAINT chk_voucher_value_positive CHECK (value > 0);
  END IF;

  -- 4. Ràng buộc Giá trị đơn tối thiểu không âm
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_voucher_min_spend_non_negative'
    AND conrelid = 'discount."Voucher"'::regclass
  ) THEN
    ALTER TABLE discount."Voucher"
    ADD CONSTRAINT chk_voucher_min_spend_non_negative CHECK ("minSpend" >= 0);
  END IF;

  -- 5. Ràng buộc Thời gian bắt đầu phải trước thời gian kết thúc
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_voucher_dates_valid'
    AND conrelid = 'discount."Voucher"'::regclass
  ) THEN
    ALTER TABLE discount."Voucher"
    ADD CONSTRAINT chk_voucher_dates_valid CHECK ("startDate" < "endDate");
  END IF;
END $$;
