import type { Database } from "@/db";
import { DAILY_CREDIT_LIMITS, RATE_LIMIT_WINDOW_MS } from "./constants";

const MAX_GENERATIONS_PER_DAY = DAILY_CREDIT_LIMITS.ANONYMOUS;

/**
 * Check and increment rate limit using atomic operations.
 *
 * Uses INSERT ... ON CONFLICT DO UPDATE for atomic upsert.
 * Uses UPDATE with WHERE clause for atomic increment with limit check.
 *
 * This prevents race conditions where multiple concurrent requests
 * could all pass the limit check before any increment happens.
 */
export async function checkRateLimit(
	db: Database,
	userIp: string,
): Promise<{ allowed: boolean; remaining: number; resetAt?: number }> {
	const now = new Date();
	const nowMs = now.getTime();
	const windowStartMs = nowMs - RATE_LIMIT_WINDOW_MS;

	// Try atomic UPDATE with RETURNING clause
	// Only increments if current count is below limit AND window is still valid
	// Returns the updated generations_count directly, eliminating the need for a separate SELECT
	const updateResult = await db.$client
		.prepare(
			`UPDATE rate_limits SET generations_count = generations_count + 1 WHERE user_ip = ? AND generations_count < ? AND window_start >= ? RETURNING generations_count`,
		)
		.bind(userIp, MAX_GENERATIONS_PER_DAY, new Date(windowStartMs))
		.first<{ generations_count: number }>();

	// Check if UPDATE succeeded (updateResult exists means rows were modified)
	if (updateResult) {
		// UPDATE succeeded - existing record was incremented within limit
		// Use the returned generations_count to calculate remaining
		return {
			allowed: true,
			remaining: MAX_GENERATIONS_PER_DAY - updateResult.generations_count,
		};
	}

	// UPDATE didn't affect any rows - either no record exists, window expired, or limit reached.
	// Use atomic INSERT ... ON CONFLICT DO UPDATE to handle all cases in one statement.
	// This resets the window if expired, or inserts a new record if none exists.
	const upsertResult = await db.$client
		.prepare(
			`INSERT INTO rate_limits (id, user_ip, generations_count, window_start)
			 VALUES (?, ?, 1, ?)
			 ON CONFLICT (user_ip) DO UPDATE SET
				generations_count = CASE
					WHEN window_start < ? THEN 1
					ELSE generations_count
				END,
				window_start = CASE
					WHEN window_start < ? THEN ?
					ELSE window_start
				END
			 RETURNING generations_count, window_start`,
		)
		.bind(
			userIp,
			userIp,
			now,
			new Date(windowStartMs),
			new Date(windowStartMs),
			now,
		)
		.first<{ generations_count: number; window_start: string }>();

	if (upsertResult) {
		const count = upsertResult.generations_count;
		// The upsert only resets count to 1 (expired window) or keeps it unchanged
		// (valid window, at limit). Count < MAX means we just reset or inserted new.
		if (count < MAX_GENERATIONS_PER_DAY) {
			return {
				allowed: true,
				remaining: MAX_GENERATIONS_PER_DAY - count,
			};
		}
		// count >= MAX: limit reached in a valid window
		const resetAt =
			new Date(upsertResult.window_start).getTime() + RATE_LIMIT_WINDOW_MS;
		return { allowed: false, remaining: 0, resetAt };
	}

	// Upsert returned null — should not happen, but treat as rate limited
	return {
		allowed: false,
		remaining: 0,
		resetAt: nowMs + RATE_LIMIT_WINDOW_MS,
	};
}
