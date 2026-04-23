import { createFileRoute } from "@tanstack/react-router";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { stamps } from "@/db/schema";
import { jsonResponse } from "@/lib/api-utils";
import { getEnv } from "@/lib/env";
import { hasRenderableStampImage } from "@/lib/stamp-image";
import { STAMP_STYLE_PRESETS } from "@/lib/stamp-prompts";

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
	nextCursor?: string;
	hasMore: boolean;
}

function buildWhereClause(style?: string, cursorDate?: Date) {
	if (style) {
		return cursorDate
			? and(
					eq(stamps.isPublic, true),
					eq(stamps.style, style),
					sql`${stamps.createdAt} < ${cursorDate.getTime() / 1000}`,
				)
			: and(eq(stamps.isPublic, true), eq(stamps.style, style));
	}

	return cursorDate
		? and(
				eq(stamps.isPublic, true),
				sql`${stamps.createdAt} < ${cursorDate.getTime() / 1000}`,
			)
		: eq(stamps.isPublic, true);
}

export async function GET(request: Request): Promise<Response> {
	try {
		const db = getDb();
		const env = getEnv();
		const bucket = env.STAMPS_BUCKET as unknown as R2Bucket;

		const url = new URL(request.url);
		const limitParam = Number(url.searchParams.get("limit") || 50);
		const cursorParam = url.searchParams.get("cursor");
		const styleParam = url.searchParams.get("style");

		const limit = Math.max(
			1,
			Math.min(Number.isFinite(limitParam) ? limitParam : 50, 100),
		);

		let cursorDate: Date | undefined;
		if (cursorParam) {
			const parsed = new Date(cursorParam);
			if (!Number.isNaN(parsed.getTime())) {
				cursorDate = parsed;
			}
		}

		const style =
			styleParam &&
			(Object.keys(STAMP_STYLE_PRESETS) as readonly string[]).includes(
				styleParam,
			)
				? styleParam
				: undefined;

		const validStamps: Array<{
			id: string;
			prompt: string;
			imageUrl: string;
			thumbnailUrl: string | null;
			style: string | null;
			isPublic: boolean | null;
			createdAt: Date;
			description: string | null;
			imageExt: string | null;
		}> = [];

		let batchCursor = cursorDate;

		while (validStamps.length < limit + 1) {
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
					imageExt: stamps.imageExt,
				})
				.from(stamps)
				.where(buildWhereClause(style, batchCursor))
				.orderBy(desc(stamps.createdAt))
				.limit(limit + 1);

			if (queryResults.length === 0) {
				break;
			}

			const availability = await Promise.all(
				queryResults.map(async (stamp) => ({
					stamp,
					isRenderable: await hasRenderableStampImage(
						bucket,
						stamp.id,
						stamp.imageExt,
					),
				})),
			);

			for (const { stamp, isRenderable } of availability) {
				if (!isRenderable) {
					continue;
				}

				validStamps.push(stamp);
				if (validStamps.length >= limit + 1) {
					break;
				}
			}

			if (queryResults.length < limit + 1) {
				break;
			}

			const lastStamp = queryResults[queryResults.length - 1];
			batchCursor = new Date(lastStamp.createdAt.getTime() - 1);
		}

		const hasMore = validStamps.length > limit;
		const paginatedStamps = hasMore ? validStamps.slice(0, limit) : validStamps;

		const nextCursor =
			hasMore && paginatedStamps.length > 0
				? new Date(
						paginatedStamps[paginatedStamps.length - 1].createdAt.getTime() - 1,
					).toISOString()
				: undefined;

		const responseData: StampsApiResponse = {
			stamps: paginatedStamps.map(({ imageExt: _imageExt, ...stamp }) => stamp),
			nextCursor,
			hasMore,
		};

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
