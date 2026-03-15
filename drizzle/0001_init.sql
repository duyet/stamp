CREATE TABLE `stamps` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt` text NOT NULL,
	`image_url` text NOT NULL,
	`thumbnail_url` text,
	`style` text DEFAULT 'vintage',
	`is_public` integer DEFAULT 1,
	`user_ip` text,
	`created_at` integer NOT NULL
);

CREATE TABLE `rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`user_ip` text NOT NULL,
	`generations_count` integer DEFAULT 0 NOT NULL,
	`window_start` integer NOT NULL
);

CREATE INDEX `idx_stamps_public_created` ON `stamps` (`is_public`, `created_at`);
CREATE INDEX `idx_rate_limits_ip` ON `rate_limits` (`user_ip`);
