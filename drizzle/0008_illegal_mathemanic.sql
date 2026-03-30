CREATE TABLE `track_rate_limits` (
	`user_ip` text PRIMARY KEY NOT NULL,
	`event_count` integer DEFAULT 1 NOT NULL,
	`window_start` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_track_rate_limits_ip` ON `track_rate_limits` (`user_ip`);