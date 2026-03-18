import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { stamps } from "@/db/schema";
import { STAMP_STYLES } from "@/lib/constants";

export async function GET(request: Request) {
	try {
		const db = getDb();

		const url = new URL(request.url);
		const limitParam = Number(url.searchParams.get("limit") || 50);
		const offsetParam = Number(url.searchParams.get("offset") || 0);
		const styleParam = url.searchParams.get("style");

		// Validate pagination parameters
		const limit = Math.max(
			1,
			Math.min(Number.isFinite(limitParam) ? limitParam : 50, 100),
		);
		const offset = Math.max(
			0,
			Number.isFinite(offsetParam) ? offsetParam : 0,
		);

		// Validate style parameter against allowlist
		const style =
			styleParam && STAMP_STYLES.includes(styleParam as any)
				? styleParam
				: undefined;

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
