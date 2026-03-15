import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { events } from "@/db/schema";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { event, metadata } = body as {
			event: string;
			metadata?: Record<string, unknown>;
		};

		if (!event || typeof event !== "string") {
			return NextResponse.json({ error: "event is required" }, { status: 400 });
		}

		const userIp =
			request.headers.get("cf-connecting-ip") ||
			request.headers.get("x-forwarded-for") ||
			null;

		const db = getDb();
		await db.insert(events).values({
			id: nanoid(12),
			event,
			metadata: metadata ? JSON.stringify(metadata) : null,
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
