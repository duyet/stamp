ALTER TABLE `stamps` ADD `session_token` text;--> statement-breakpoint
CREATE INDEX `idx_stamps_session_token` ON `stamps` (`session_token`);