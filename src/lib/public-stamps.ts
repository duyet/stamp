import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { stamps } from "@/db/schema";
import { getEnv } from "@/lib/env";
import { hasRenderableStampImage } from "@/lib/stamp-image";
import { STAMP_STYLE_PRESETS } from "@/lib/stamp-prompts";

export interface PublicStampResult {
	stamps: Array<{
		id: string;
		prompt: string;
		enhancedPrompt: string | null;
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

interface PublicStampQuery {
	limit?: number;
	cursor?: string | null;
	style?: string | null;
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

function normalizeStyle(style: string | null | undefined) {
	return style &&
		(Object.keys(STAMP_STYLE_PRESETS) as readonly string[]).includes(style)
		? style
		: undefined;
}

function normalizeCursor(cursor: string | null | undefined) {
	if (!cursor) return undefined;

	const parsed = new Date(cursor);
	return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function fetchPublicStamps({
	limit: rawLimit = 50,
	cursor,
	style,
}: PublicStampQuery = {}): Promise<PublicStampResult> {
	const db = getDb();
	const env = getEnv();
	const bucket = env.STAMPS_BUCKET as unknown as R2Bucket;

	const limit = Math.max(
		1,
		Math.min(Number.isFinite(rawLimit) ? rawLimit : 50, 100),
	);
	const normalizedStyle = normalizeStyle(style);
	let batchCursor = normalizeCursor(cursor);

	const validStamps: Array<
		PublicStampResult["stamps"][number] & { imageExt: string | null }
	> = [];

	while (validStamps.length < limit + 1) {
		const queryResults = await db
			.select({
				id: stamps.id,
				prompt: stamps.prompt,
				enhancedPrompt: stamps.enhancedPrompt,
				imageUrl: stamps.imageUrl,
				thumbnailUrl: stamps.thumbnailUrl,
				style: stamps.style,
				isPublic: stamps.isPublic,
				createdAt: stamps.createdAt,
				description: stamps.description,
				imageExt: stamps.imageExt,
			})
			.from(stamps)
			.where(buildWhereClause(normalizedStyle, batchCursor))
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

	return {
		stamps: paginatedStamps.map(({ imageExt: _imageExt, ...stamp }) => stamp),
		nextCursor,
		hasMore,
	};
}
