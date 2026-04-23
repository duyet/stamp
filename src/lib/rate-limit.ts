import type { Database } from "@/db";
import { DAILY_CREDIT_LIMITS, RATE_LIMIT_WINDOW_MS } from "./constants";

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetAt?: number;
}

interface RateLimitConfig {
	/** D1 table name */
	tableName: string;
	/** Column storing the request count */
	countColumn: string;
	/** Max requests per window */
	maxRequests: number;
	/** Window duration in ms */
	windowMs: number;
	/** True if table has a separate `id` column (set to userIp on insert) */
	hasIdColumn?: boolean;
}

/**
 * Create a rate limiter for a given config.
 *
 * Uses atomic UPDATE + INSERT ON CONFLICT for race-condition safety on D1.
 * All tables use `user_ip` as the lookup/conflict key and integer ms timestamps.
 */
export function createRateLimiter(config: RateLimitConfig) {
	const { tableName, countColumn, maxRequests, windowMs } = config;
	const hasId = config.hasIdColumn ?? false;

	// Build INSERT SQL once — ON CONFLICT handles both "no record" and "expired window"
	const idCols = hasId ? "id, user_ip" : "user_ip";
	const idPlaceholders = hasId ? "?, ?" : "?";
	const insertSql = `
		INSERT INTO ${tableName} (${idCols}, ${countColumn}, window_start)
		VALUES (${idPlaceholders}, 1, ?)
		ON CONFLICT (user_ip) DO UPDATE SET
			${countColumn} = CASE
				WHEN window_start < ? THEN 1
				ELSE ${countColumn}
			END,
			window_start = CASE
				WHEN window_start < ? THEN ?
				ELSE window_start
			END
		RETURNING ${countColumn}, window_start`;

	return async (db: Database, userIp: string): Promise<RateLimitResult> => {
		const now = Date.now();
		const windowStart = now - windowMs;

		// Step 1: Atomic UPDATE — only succeeds if count < limit AND window valid
		const updateResult = await db.$client
			.prepare(
				`UPDATE ${tableName}
				 SET ${countColumn} = ${countColumn} + 1
				 WHERE user_ip = ? AND ${countColumn} < ? AND window_start >= ?
				 RETURNING ${countColumn}`,
			)
			.bind(userIp, maxRequests, windowStart)
			.first<Record<string, number>>();

		if (updateResult) {
			return {
				allowed: true,
				remaining: maxRequests - updateResult[countColumn],
			};
		}

		// Step 2: Upsert — handles no-record, expired-window, and at-limit cases
		const bindings = hasId
			? [userIp, userIp, now, windowStart, windowStart, now]
			: [userIp, now, windowStart, windowStart, now];

		const upsertResult = await db.$client
			.prepare(insertSql)
			.bind(...bindings)
			.first<Record<string, number>>();

		if (upsertResult) {
			const count = upsertResult[countColumn];
			if (count < maxRequests) {
				return { allowed: true, remaining: maxRequests - count };
			}
			// Count >= max: at limit in a valid window
			return {
				allowed: false,
				remaining: 0,
				resetAt: upsertResult.window_start + windowMs,
			};
		}

		// Upsert returned null — fail safe
		return { allowed: false, remaining: 0, resetAt: now + windowMs };
	};
}

/**
 * Stamp generation rate limit: 20/day for anonymous users.
 * `rate_limits` table has a separate `id` column set to userIp.
 */
export const checkRateLimit = createRateLimiter({
	tableName: "rate_limits",
	countColumn: "generations_count",
	maxRequests: DAILY_CREDIT_LIMITS.ANONYMOUS,
	windowMs: RATE_LIMIT_WINDOW_MS,
	hasIdColumn: true,
});

/**
 * Track event rate limit: 100 events/minute per IP.
 */
export const checkTrackRateLimit = createRateLimiter({
	tableName: "track_rate_limits",
	countColumn: "event_count",
	maxRequests: 100,
	windowMs: 60 * 1000,
});

/**
 * Analytics query rate limit: 10 requests/15min per IP.
 */
export const checkAnalyticsRateLimit = createRateLimiter({
	tableName: "analytics_rate_limits",
	countColumn: "generations_count",
	maxRequests: 10,
	windowMs: 15 * 60 * 1000,
});
