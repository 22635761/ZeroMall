-- Migration: 05_optimize_composite_and_partial_indexes.sql
-- Description: Tạo Composite Indexes và Partial Indexes cho các bảng nghiệp vụ có tần suất truy vấn cao.
-- Mục tiêu: Triệt tiêu thao tác Sort trong RAM (Quicksort/Top-N heapsort), tăng tốc truy vấn phân trang từ 5x - 5000x.
-- Áp dụng quy chuẩn: supabase-postgres-best-practices (query-composite-indexes.md, query-partial-indexes.md).

-- 1. Schema "order": Đơn hàng & Lịch sử mua hàng
CREATE INDEX IF NOT EXISTS idx_order_buyer_created_composite 
  ON "order"."Order" ("buyerId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_order_shop_status_created_composite 
  ON "order"."Order" ("shopId", status, "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_order_pending_payment_partial 
  ON "order"."Order" ("createdAt") 
  WHERE status = 'PENDING_PAYMENT';

-- 2. Schema "product": Sản phẩm, Đánh giá, Lịch sử giá
CREATE INDEX IF NOT EXISTS idx_product_trending_partial 
  ON product."Product" (sales DESC, "createdAt" DESC) 
  WHERE status != 'hidden' AND stock > 0;

CREATE INDEX IF NOT EXISTS idx_product_shop_created_composite 
  ON product."Product" ("shopId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_review_product_created_composite 
  ON product."Review" ("productId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_pricehistory_product_created_composite 
  ON product."PriceHistory" ("productId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_costhistory_product_import_composite 
  ON product."CostPriceHistory" ("productId", "importDate" DESC);

-- 3. Schema "payment": Ví điện tử & Ký quỹ
CREATE INDEX IF NOT EXISTS idx_wtx_wallet_created_composite 
  ON payment."WalletTransaction" ("walletId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_escrow_shop_status_composite 
  ON payment."EscrowTransaction" ("shopId", status);

CREATE INDEX IF NOT EXISTS idx_withdraw_shop_status_composite 
  ON payment."WithdrawRequest" ("shopId", status);

-- 4. Schema "delivery": Giao vận & COD
CREATE INDEX IF NOT EXISTS idx_assignment_driver_status_composite 
  ON delivery."DeliveryAssignment" ("driverId", status);

CREATE INDEX IF NOT EXISTS idx_settlement_seller_created_composite 
  ON delivery."Settlement" ("sellerId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_cod_seller_status_composite 
  ON delivery."CodTransaction" ("sellerId", status);

CREATE INDEX IF NOT EXISTS idx_shipment_pending_dispatch_partial 
  ON delivery."Shipment" ("currentHubId", "createdAt" DESC) 
  WHERE status IN ('WAITING_PICKUP', 'CREATED');
