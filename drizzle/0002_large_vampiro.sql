CREATE TABLE `analytics_rate_limits` (
	`user_ip` text PRIMARY KEY NOT NULL,
	`generations_count` integer DEFAULT 1 NOT NULL,
	`window_start` integer NOT NULL
);
