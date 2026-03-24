CREATE TABLE `daily_stats` (
	`date` text PRIMARY KEY NOT NULL,
	`total_stamps` integer DEFAULT 0 NOT NULL,
	`new_stamps` integer DEFAULT 0 NOT NULL,
	`page_views` integer DEFAULT 0 NOT NULL,
	`unique_visitors` integer DEFAULT 0 NOT NULL,
	`downloads` integer DEFAULT 0 NOT NULL,
	`shares` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
