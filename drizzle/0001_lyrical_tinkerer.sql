CREATE INDEX `idx_rate_limits_ip` ON `rate_limits` (`user_ip`);--> statement-breakpoint
CREATE INDEX `idx_stamps_public_created` ON `stamps` (`is_public`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_stamps_created` ON `stamps` (`created_at`);