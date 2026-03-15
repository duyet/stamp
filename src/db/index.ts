import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { cache } from "react";
import * as schema from "./schema";

/**
 * Get a per-request Drizzle DB instance.
 * Uses React cache() to deduplicate within a single request.
 * Never create a global DB client on Workers — each request gets its own.
 */
export const getDb = cache(() => {
	const { env } = getCloudflareContext();
	return drizzle(env.DB as unknown as D1Database, { schema });
});

export type Database = ReturnType<typeof getDb>;
