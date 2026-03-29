import { waitUntil } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { events } from "@/db/schema";
import { jsonResponse } from "@/lib/api-utils";
import { getClientIp } from "@/lib/get-client-ip";

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
		const body = await request.json();
		const { event, metadata } = body as {
			event: string;
			metadata?: Record<string, unknown>;
		};

		if (!event || typeof event !== "string" || !ALLOWED_EVENTS_SET.has(event)) {
			return jsonResponse({ error: "Invalid event type" }, 400);
		}

		const metadataStr = metadata ? JSON.stringify(metadata) : null;
		if (metadataStr && metadataStr.length > MAX_METADATA_LENGTH) {
			return jsonResponse({ error: "Metadata too large" }, 400);
		}

		const userIp = getClientIp(request.headers, null);

		// Use waitUntil to keep Worker alive until DB insert completes
		// This prevents lost tracking events on Workers runtime
		const db = getDb();
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
			POST: ({ request }) => POST(request),
		},
	},
});
