CREATE TABLE `credit_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`balance_after` integer NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_credit_transactions_user` ON `credit_transactions` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`event` text NOT NULL,
	`metadata` text,
	`user_ip` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`user_ip` text NOT NULL,
	`generations_count` integer DEFAULT 0 NOT NULL,
	`window_start` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stamps` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt` text NOT NULL,
	`enhanced_prompt` text,
	`description` text,
	`image_url` text NOT NULL,
	`thumbnail_url` text,
	`reference_image_url` text,
	`style` text DEFAULT 'vintage',
	`is_public` integer DEFAULT true,
	`user_ip` text,
	`user_id` text,
	`location_city` text,
	`location_country` text,
	`location_lat` real,
	`location_lng` real,
	`user_timezone` text,
	`user_agent` text,
	`referrer` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_stamps_user` ON `stamps` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_credits` (
	`user_id` text PRIMARY KEY NOT NULL,
	`daily_limit` integer DEFAULT 100 NOT NULL,
	`daily_used` integer DEFAULT 0 NOT NULL,
	`daily_reset_at` integer NOT NULL,
	`purchased_credits` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
