CREATE INDEX `idx_events_event` ON `events` (`event`);--> statement-breakpoint
CREATE INDEX `idx_events_event_created` ON `events` (`event`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_stamps_public_style_created` ON `stamps` (`is_public`,`style`,`created_at`);