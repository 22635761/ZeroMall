-- Migration: 14_add_uuid_defaults_to_ledger_tables.sql
-- Description: Bổ sung DEFAULT gen_random_uuid()::text cho các bảng tài chính / giao dịch.
-- Áp dụng quy chuẩn: supabase-postgres-best-practices (data-integrity, default primary key generation).

ALTER TABLE payment."WalletTransaction" 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE payment."Wallet" 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE payment."EscrowTransaction" 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE payment."Transaction" 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
