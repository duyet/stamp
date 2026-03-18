import {
	index,
	integer,
	real,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";

export const stamps = sqliteTable(
	"stamps",
	{
		id: text("id").primaryKey(),
		prompt: text("prompt").notNull(),
		enhancedPrompt: text("enhanced_prompt"),
		description: text("description"),
		imageUrl: text("image_url").notNull(),
		thumbnailUrl: text("thumbnail_url"),
		referenceImageUrl: text("reference_image_url"),
		imageExt: text("image_ext"), // File extension: "png", "jpg", or "webp"
		style: text("style").default("vintage"),
		isPublic: integer("is_public", { mode: "boolean" }).default(true),
		userIp: text("user_ip"),
		userId: text("user_id"),
		locationCity: text("location_city"),
		locationCountry: text("location_country"),
		locationLat: real("location_lat"),
		locationLng: real("location_lng"),
		userTimezone: text("user_timezone"),
		userAgent: text("user_agent"),
		referrer: text("referrer"),
		createdAt: integer("created_at", { mode: "timestamp" })
			.$defaultFn(() => new Date())
			.notNull(),
	},
	(table) => [
		index("idx_stamps_user").on(table.userId),
		index("idx_stamps_public_created").on(table.isPublic, table.createdAt),
		index("idx_stamps_created").on(table.createdAt),
	],
);

export const rateLimits = sqliteTable(
	"rate_limits",
	{
		id: text("id").primaryKey(),
		userIp: text("user_ip").notNull(),
		generationsCount: integer("generations_count").default(0).notNull(),
		windowStart: integer("window_start", { mode: "timestamp" })
			.$defaultFn(() => new Date())
			.notNull(),
	},
	(table) => [index("idx_rate_limits_ip").on(table.userIp)],
);

export type Stamp = typeof stamps.$inferSelect;
export type NewStamp = typeof stamps.$inferInsert;

export const events = sqliteTable(
	"events",
	{
		id: text("id").primaryKey(),
		event: text("event").notNull(),
		metadata: text("metadata"),
		userIp: text("user_ip"),
		createdAt: integer("created_at").notNull(),
	},
	(table) => [
		index("idx_events_event").on(table.event),
		index("idx_events_event_created").on(table.event, table.createdAt),
	],
);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

export const userCredits = sqliteTable("user_credits", {
	userId: text("user_id").primaryKey(),
	dailyLimit: integer("daily_limit").default(100).notNull(),
	dailyUsed: integer("daily_used").default(0).notNull(),
	dailyResetAt: integer("daily_reset_at").notNull(),
	purchasedCredits: integer("purchased_credits").default(0).notNull(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export type UserCredits = typeof userCredits.$inferSelect;

export const creditTransactions = sqliteTable(
	"credit_transactions",
	{
		id: text("id").primaryKey(),
		userId: text("user_id").notNull(),
		type: text("type").notNull(),
		amount: integer("amount").notNull(),
		balanceAfter: integer("balance_after").notNull(),
		metadata: text("metadata"),
		createdAt: integer("created_at").notNull(),
	},
	(table) => [
		index("idx_credit_transactions_user").on(table.userId, table.createdAt),
	],
);

export type CreditTransaction = typeof creditTransactions.$inferSelect;

export const analyticsRateLimits = sqliteTable("analytics_rate_limits", {
	userIp: text("user_ip").primaryKey(),
	generationsCount: integer("generations_count").notNull().default(1),
	windowStart: integer("window_start").notNull(),
});
