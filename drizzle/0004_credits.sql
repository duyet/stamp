-- user_credits table
CREATE TABLE `user_credits` (
  `user_id` TEXT PRIMARY KEY,
  `daily_limit` INTEGER DEFAULT 100 NOT NULL,
  `daily_used` INTEGER DEFAULT 0 NOT NULL,
  `daily_reset_at` INTEGER NOT NULL,
  `purchased_credits` INTEGER DEFAULT 0 NOT NULL,
  `created_at` INTEGER NOT NULL,
  `updated_at` INTEGER NOT NULL
);

-- credit_transactions table (audit log)
CREATE TABLE `credit_transactions` (
  `id` TEXT PRIMARY KEY,
  `user_id` TEXT NOT NULL,
  `type` TEXT NOT NULL,
  `amount` INTEGER NOT NULL,
  `balance_after` INTEGER NOT NULL,
  `metadata` TEXT,
  `created_at` INTEGER NOT NULL
);
CREATE INDEX `idx_credit_transactions_user` ON `credit_transactions` (`user_id`, `created_at`);

-- Add user_id to stamps
ALTER TABLE `stamps` ADD COLUMN `user_id` TEXT;
CREATE INDEX `idx_stamps_user` ON `stamps` (`user_id`);
