import { createFileRoute } from "@tanstack/react-router";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { stamps } from "@/db/schema";
import { jsonResponse } from "@/lib/api-utils";
import { STAMP_STYLE_PRESETS } from "@/lib/stamp-prompts";

interface StampsApiResponse {
	stamps: Array<{
		id: string;
		prompt: string;
		imageUrl: string;
		style: string | null;
		isPublic: boolean | null;
		createdAt: Date;
		description: string | null;
	}>;
	nextCursor?: string; // ISO timestamp for next page
	hasMore: boolean;
}

export async function GET(request: Request): Promise<Response> {
	try {
		const db = getDb();

		const url = new URL(request.url);
		const limitParam = Number(url.searchParams.get("limit") || 50);
		const cursorParam = url.searchParams.get("cursor");
		const styleParam = url.searchParams.get("style");

		// Validate pagination parameters
		const limit = Math.max(
			1,
			Math.min(Number.isFinite(limitParam) ? limitParam : 50, 100),
		);

		// Parse cursor (ISO timestamp)
		let cursorDate: Date | undefined;
		if (cursorParam) {
			const parsed = new Date(cursorParam);
			if (!Number.isNaN(parsed.getTime())) {
				cursorDate = parsed;
			}
		}

		// Validate style parameter against allowlist
		const style =
			styleParam &&
			(Object.keys(STAMP_STYLE_PRESETS) as readonly string[]).includes(
				styleParam,
			)
				? styleParam
				: undefined;

		// Build where clause with cursor-based pagination
		const whereClause = style
			? cursorDate
				? and(
						eq(stamps.isPublic, true),
						eq(stamps.style, style),
						// Cursor pagination: createdAt < cursorDate
						sql`${stamps.createdAt} < ${cursorDate.getTime() / 1000}`,
					)
				: and(eq(stamps.isPublic, true), eq(stamps.style, style))
			: cursorDate
				? and(
						eq(stamps.isPublic, true),
						sql`${stamps.createdAt} < ${cursorDate.getTime() / 1000}`,
					)
				: eq(stamps.isPublic, true);

		// Select only columns needed for stamp listing (reduces data transfer)
		// Fetch limit + 1 to determine if there are more results
		const queryResults = await db
			.select({
				id: stamps.id,
				prompt: stamps.prompt,
				imageUrl: stamps.imageUrl,
				style: stamps.style,
				isPublic: stamps.isPublic,
				createdAt: stamps.createdAt,
				description: stamps.description,
			})
			.from(stamps)
			.where(whereClause)
			.orderBy(desc(stamps.createdAt))
			.limit(limit + 1); // Fetch one extra to check for more results

		// Determine if there are more results
		const hasMore = queryResults.length > limit;
		const paginatedStamps = hasMore
			? queryResults.slice(0, limit)
			: queryResults;

		// Generate next cursor from the last item's createdAt timestamp
		const nextCursor =
			hasMore && paginatedStamps.length > 0
				? new Date(
						paginatedStamps[paginatedStamps.length - 1].createdAt.getTime() - 1,
					).toISOString()
				: undefined;

		const responseData: StampsApiResponse = {
			stamps: paginatedStamps,
			nextCursor,
			hasMore,
		};

		// Cache for 60 seconds, stale for 300 seconds (5 min)
		// This allows quick page loads while still getting fresh data
		return jsonResponse(responseData, 200, {
			"Cache-Control":
				"public, max-age=60, stale-while-revalidate=300, stale-if-error=86400",
		});
	} catch (error) {
		console.error("Failed to fetch stamps:", error);
		return jsonResponse({ error: "Failed to fetch stamps." }, 500);
	}
}

export const Route = createFileRoute("/api/stamps")({
	server: {
		handlers: {
			GET: ({ request }) => GET(request),
		},
	},
});
