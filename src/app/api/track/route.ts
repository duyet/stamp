import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { events } from "@/db/schema";
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

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { event, metadata } = body as {
			event: string;
			metadata?: Record<string, unknown>;
		};

		if (!event || typeof event !== "string" || !ALLOWED_EVENTS_SET.has(event)) {
			return NextResponse.json(
				{ error: "Invalid event type" },
				{ status: 400 },
			);
		}

		const metadataStr = metadata ? JSON.stringify(metadata) : null;
		if (metadataStr && metadataStr.length > MAX_METADATA_LENGTH) {
			return NextResponse.json(
				{ error: "Metadata too large" },
				{ status: 400 },
			);
		}

		const userIp = getClientIp(request.headers, null);

		// Fire-and-forget: respond immediately, track in background
		// This reduces tracking latency from ~50-100ms to ~5ms
		const db = getDb();
		Promise.resolve().then(async () => {
			try {
				await db.insert(events).values({
					id: nanoid(12),
					event,
					metadata: metadataStr,
					userIp,
					createdAt: Date.now(),
				});
			} catch (err) {
				// Silently fail - tracking is non-critical
				console.error("Track event failed (async):", err);
			}
		});

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("Track event failed:", error);
		return NextResponse.json(
			{ error: "Failed to track event" },
			{ status: 500 },
		);
	}
}
