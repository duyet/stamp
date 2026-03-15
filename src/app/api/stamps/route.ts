import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { stamps } from "@/db/schema";

export async function GET(request: Request) {
	try {
		const db = getDb();

		const url = new URL(request.url);
		const limit = Math.min(Number(url.searchParams.get("limit") || 50), 100);
		const offset = Number(url.searchParams.get("offset") || 0);

		const results = await db
			.select()
			.from(stamps)
			.where(eq(stamps.isPublic, true))
			.orderBy(desc(stamps.createdAt))
			.limit(limit)
			.offset(offset);

		return NextResponse.json({ stamps: results });
	} catch (error) {
		console.error("Failed to fetch stamps:", error);
		return NextResponse.json(
			{ error: "Failed to fetch stamps." },
			{ status: 500 },
		);
	}
}
