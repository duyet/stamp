DROP INDEX `idx_rate_limits_ip`;--> statement-breakpoint
CREATE UNIQUE INDEX `rate_limits_user_ip_unique` ON `rate_limits` (`user_ip`);