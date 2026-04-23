import { waitUntil } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { events } from "@/db/schema";
import { handleCorsPreflight, jsonResponse } from "@/lib/api-utils";
import { getClientIp } from "@/lib/get-client-ip";
import { hashIp } from "@/lib/hash-ip";
import { checkTrackRateLimit } from "@/lib/rate-limit";
import { trackRequestSchema } from "@/lib/schemas";

export const ALLOWED_EVENTS = [
	"page_view",
	"generation",
	"download",
	"share",
	"copy_link",
	"stamp_view",
] as const;

export type EventType = (typeof ALLOWED_EVENTS)[number];

export const ALLOWED_EVENTS_SET = new Set<string>(ALLOWED_EVENTS);

const MAX_METADATA_LENGTH = 1024;

export async function POST(request: Request): Promise<Response> {
	try {
		const rawBody = await request.json();
		const parsed = trackRequestSchema.safeParse(rawBody);
		if (!parsed.success) {
			return jsonResponse(
				{ error: "Invalid request body", details: parsed.error.flatten() },
				400,
			);
		}
		const { event, metadata } = parsed.data;

		const metadataStr = metadata ? JSON.stringify(metadata) : null;
		if (metadataStr && metadataStr.length > MAX_METADATA_LENGTH) {
			return jsonResponse({ error: "Metadata too large" }, 400);
		}

		const rawIp = getClientIp(request.headers, null);
		const userIp = rawIp ? await hashIp(rawIp) : "anonymous";

		// Rate limit: 100 events per minute per IP
		const db = getDb();
		const { allowed } = await checkTrackRateLimit(db, userIp);
		if (!allowed) {
			return jsonResponse(
				{ error: "Rate limit exceeded", retryAfter: 60 },
				429,
			);
		}

		// Use waitUntil to keep Worker alive until DB insert completes
		// This prevents lost tracking events on Workers runtime
		waitUntil(
			db
				.insert(events)
				.values({
					id: nanoid(12),
					event,
					metadata: metadataStr,
					userIp,
					createdAt: Date.now(),
				})
				.catch((err) => {
					console.error("Track event failed:", err);
				}),
		);

		return jsonResponse({ ok: true });
	} catch (error) {
		console.error("Track event failed:", error);
		return jsonResponse({ error: "Failed to track event" }, 500);
	}
}

export const Route = createFileRoute("/api/track")({
	server: {
		handlers: {
			OPTIONS: ({ request }) => handleCorsPreflight(request),
			POST: ({ request }) => POST(request),
		},
	},
});
