CREATE INDEX `idx_stamps_country` ON `stamps` (`location_country`);--> statement-breakpoint
CREATE INDEX `idx_stamps_city_country` ON `stamps` (`location_city`,`location_country`);--> statement-breakpoint
CREATE INDEX `idx_stamps_timezone` ON `stamps` (`user_timezone`);