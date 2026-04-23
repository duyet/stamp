import { z } from "zod";
import { STAMP_STYLE_PRESETS } from "./stamp-prompts";

const styleKeys = Object.keys(STAMP_STYLE_PRESETS) as [string, ...string[]];
export const generateRequestSchema = z.object({
	prompt: z.string().max(500).optional(),
	style: z.enum(styleKeys).default("vintage"),
	isPublic: z.boolean().default(true),
	hd: z.boolean().default(false),
	timezone: z.string().optional(),
	referenceImageData: z.string().min(1).optional(),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

export const trackRequestSchema = z.object({
	event: z.enum([
		"page_view",
		"generation",
		"download",
		"share",
		"copy_link",
		"stamp_view",
	]),
	metadata: z.record(z.string(), z.unknown()).optional(),
});

export type TrackRequest = z.infer<typeof trackRequestSchema>;

// Zod schemas for analytics raw query results (replaces unsafe `as` casts)
export const stampCountsSchema = z.object({
	total_stamps: z.number(),
	stamps_today: z.number(),
	stamps_week: z.number(),
	stamps_month: z.number(),
});

export const eventMetricsSchema = z.object({
	total_page_views: z.number(),
	total_downloads: z.number(),
	total_shares: z.number(),
});
