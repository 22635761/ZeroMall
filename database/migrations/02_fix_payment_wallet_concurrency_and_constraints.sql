-- Migration: 02_fix_payment_wallet_concurrency_and_constraints.sql
-- Description: Thêm ràng buộc toàn vẹn cho Ví người dùng, giao dịch thanh toán và Escrow.
-- Triệt tiêu hoàn toàn rủi ro trừ âm số dư ví (Double Spending) và giao dịch âm.

DO $$
BEGIN
  -- 1. Ràng buộc Số dư ví không âm
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_wallet_balance_non_negative'
    AND conrelid = 'payment."Wallet"'::regclass
  ) THEN
    ALTER TABLE payment."Wallet"
    ADD CONSTRAINT chk_wallet_balance_non_negative CHECK (balance >= 0);
  END IF;

  -- 2. Ràng buộc Số dư đóng băng không âm
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_wallet_onhold_non_negative'
    AND conrelid = 'payment."Wallet"'::regclass
  ) THEN
    ALTER TABLE payment."Wallet"
    ADD CONSTRAINT chk_wallet_onhold_non_negative CHECK ("onHoldBalance" >= 0);
  END IF;

  -- 3. Ràng buộc Số tiền giao dịch thanh toán không âm
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_transaction_amount_positive'
    AND conrelid = 'payment."Transaction"'::regclass
  ) THEN
    ALTER TABLE payment."Transaction"
    ADD CONSTRAINT chk_transaction_amount_positive CHECK (amount >= 0);
  END IF;

  -- 4. Ràng buộc Số tiền biến động ví không âm
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_wallet_tx_amount_positive'
    AND conrelid = 'payment."WalletTransaction"'::regclass
  ) THEN
    ALTER TABLE payment."WalletTransaction"
    ADD CONSTRAINT chk_wallet_tx_amount_positive CHECK (amount >= 0);
  END IF;

  -- 5. Ràng buộc Số tiền yêu cầu rút phải lớn hơn 0
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_withdraw_amount_positive'
    AND conrelid = 'payment."WithdrawRequest"'::regclass
  ) THEN
    ALTER TABLE payment."WithdrawRequest"
    ADD CONSTRAINT chk_withdraw_amount_positive CHECK (amount > 0);
  END IF;

  -- 6. Ràng buộc Số tiền ký quỹ Escrow không âm
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_escrow_amount_positive'
    AND conrelid = 'payment."EscrowTransaction"'::regclass
  ) THEN
    ALTER TABLE payment."EscrowTransaction"
    ADD CONSTRAINT chk_escrow_amount_positive CHECK (amount >= 0);
  END IF;
END $$;
