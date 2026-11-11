-- Migration: 01_fix_product_stock_concurrency_and_constraints.sql
-- Description: Thêm ràng buộc toàn vẹn dữ liệu cho tồn kho, giá và doanh số sản phẩm.
-- Triệt tiêu hoàn toàn rủi ro bán vượt tồn kho (Overselling) và tồn kho âm.

DO $$
BEGIN
  -- 1. Ràng buộc Tồn kho không âm
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_product_stock_non_negative'
    AND conrelid = 'product."Product"'::regclass
  ) THEN
    ALTER TABLE product."Product"
    ADD CONSTRAINT chk_product_stock_non_negative CHECK (stock >= 0);
  END IF;

  -- 2. Ràng buộc Doanh số không âm
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_product_sales_non_negative'
    AND conrelid = 'product."Product"'::regclass
  ) THEN
    ALTER TABLE product."Product"
    ADD CONSTRAINT chk_product_sales_non_negative CHECK (sales >= 0);
  END IF;

  -- 3. Ràng buộc Giá bán không âm
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_product_price_non_negative'
    AND conrelid = 'product."Product"'::regclass
  ) THEN
    ALTER TABLE product."Product"
    ADD CONSTRAINT chk_product_price_non_negative CHECK (price >= 0);
  END IF;
END $$;
