import { createFileRoute } from "@tanstack/react-router";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { stamps } from "@/db/schema";
import { withSecurityHeaders } from "@/lib/api-utils";
import { STAMP_STYLES } from "@/lib/constants";

interface StampsApiResponse {
	stamps: Array<{
		id: string;
		prompt: string;
		imageUrl: string;
		thumbnailUrl: string | null;
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
			styleParam && (STAMP_STYLES as readonly string[]).includes(styleParam)
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

		// Select only columns needed for stamp listing (reduces data transfer by ~60%)
		// Fetch limit + 1 to determine if there are more results
		const queryResults = await db
			.select({
				id: stamps.id,
				prompt: stamps.prompt,
				imageUrl: stamps.imageUrl,
				thumbnailUrl: stamps.thumbnailUrl,
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
		return withSecurityHeaders(
			new Response(JSON.stringify(responseData), {
				headers: {
					"Content-Type": "application/json",
					"Cache-Control":
						"public, max-age=60, stale-while-revalidate=300, stale-if-error=86400",
				},
			}),
		);
	} catch (error) {
		console.error("Failed to fetch stamps:", error);
		return withSecurityHeaders(
			new Response(JSON.stringify({ error: "Failed to fetch stamps." }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			}),
		);
	}
}

export const Route = createFileRoute("/api/stamps")({
	server: {
		handlers: {
			GET: ({ request }) => GET(request),
		},
	},
});
