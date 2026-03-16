import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { events } from "@/db/schema";

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

		const userIp =
			request.headers.get("cf-connecting-ip") ||
			request.headers.get("x-forwarded-for") ||
			null;

		const db = getDb();
		await db.insert(events).values({
			id: nanoid(12),
			event,
			metadata: metadataStr,
			userIp,
			createdAt: Date.now(),
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
