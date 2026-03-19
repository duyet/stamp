import { sql } from "drizzle-orm";
import type { Database } from "@/db";
import { stamps } from "@/db/schema";

/**
 * Batch fetch stamps by IDs to prevent N+1 queries.
 * Returns a Map<id, stamp> for O(1) lookups.
 *
 * Usage:
 * const stampsMap = await batchFetchStamps(db, stampIds);
 * const stamp = stampsMap.get(stampId);
 */
export async function batchFetchStamps(
	db: Database,
	ids: string[],
): Promise<Map<string, { id: string; imageUrl: string; prompt: string }>> {
	if (ids.length === 0) return new Map();

	// Batch query: fetch all stamps in single DB call
	const results = await db.query.stamps.findMany({
		where:
			ids.length > 0
				? sql`${stamps.id} IN ${sql.raw(`('${ids.join("','")}')`)}`
				: undefined,
		columns: {
			id: true,
			imageUrl: true,
			prompt: true,
		},
	});

	// Return as Map for O(1) lookups
	return new Map(results.map((stamp) => [stamp.id, stamp]));
}
