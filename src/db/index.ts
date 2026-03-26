import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/**
 * Get a per-request Drizzle DB instance.
 * Each call creates a new instance — do NOT cache at module level on Workers.
 */
export function getDb() {
	return drizzle(env.DB as unknown as D1Database, { schema });
}

export type Database = ReturnType<typeof getDb>;
