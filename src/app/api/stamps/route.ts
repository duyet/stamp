import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { stamps } from "@/db/schema";

export async function GET(request: Request) {
	try {
		const db = getDb();

		const url = new URL(request.url);
		const limit = Math.min(Number(url.searchParams.get("limit") || 50), 100);
		const offset = Number(url.searchParams.get("offset") || 0);
		const style = url.searchParams.get("style");

		const whereClause = style
			? and(eq(stamps.isPublic, true), eq(stamps.style, style))
			: eq(stamps.isPublic, true);

		const results = await db
			.select()
			.from(stamps)
			.where(whereClause)
			.orderBy(desc(stamps.createdAt))
			.limit(limit)
			.offset(offset);

		// Cache for 60 seconds, stale for 300 seconds (5 min)
		// This allows quick page loads while still getting fresh data
		return NextResponse.json(
			{ stamps: results },
			{
				headers: {
					"Cache-Control":
						"public, max-age=60, stale-while-revalidate=300, stale-if-error=86400",
				},
			},
		);
	} catch (error) {
		console.error("Failed to fetch stamps:", error);
		return NextResponse.json(
			{ error: "Failed to fetch stamps." },
			{ status: 500 },
		);
	}
}
