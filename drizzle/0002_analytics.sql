CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`event` text NOT NULL,
	`metadata` text,
	`user_ip` text,
	`created_at` integer NOT NULL
);

CREATE INDEX `idx_events_event_created` ON `events` (`event`, `created_at`);
