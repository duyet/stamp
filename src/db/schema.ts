import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const stamps = sqliteTable("stamps", {
	id: text("id").primaryKey(),
	prompt: text("prompt").notNull(),
	enhancedPrompt: text("enhanced_prompt"),
	imageUrl: text("image_url").notNull(),
	thumbnailUrl: text("thumbnail_url"),
	style: text("style").default("vintage"),
	isPublic: integer("is_public", { mode: "boolean" }).default(true),
	userIp: text("user_ip"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.$defaultFn(() => new Date())
		.notNull(),
});

export const rateLimits = sqliteTable("rate_limits", {
	id: text("id").primaryKey(),
	userIp: text("user_ip").notNull(),
	generationsCount: integer("generations_count").default(0).notNull(),
	windowStart: integer("window_start", { mode: "timestamp" })
		.$defaultFn(() => new Date())
		.notNull(),
});

export type Stamp = typeof stamps.$inferSelect;
export type NewStamp = typeof stamps.$inferInsert;

export const events = sqliteTable("events", {
	id: text("id").primaryKey(),
	event: text("event").notNull(),
	metadata: text("metadata"),
	userIp: text("user_ip"),
	createdAt: integer("created_at").notNull(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
