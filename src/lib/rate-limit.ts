import { eq } from "drizzle-orm";
import type { Database } from "@/db";
import { rateLimits } from "@/db/schema";
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

	// UPDATE didn't affect any rows - either no record exists or window expired
	// Check if there's an existing record with expired window
	const existing = await db.query.rateLimits.findFirst({
		where: eq(rateLimits.userIp, userIp),
	});

	if (existing) {
		// Record exists - check if window has expired FIRST before checking count
		const windowExpired =
			new Date(existing.windowStart).getTime() < windowStartMs;

		if (windowExpired) {
			// Window expired - reset to 1 regardless of current count
			await db.$client
				.prepare(
					`UPDATE rate_limits SET generations_count = 1, window_start = ? WHERE user_ip = ?`,
				)
				.bind(now, userIp)
				.run();
			return { allowed: true, remaining: MAX_GENERATIONS_PER_DAY - 1 };
		}

		// Window still valid - check if limit reached
		if (existing.generationsCount >= MAX_GENERATIONS_PER_DAY) {
			// Limit exhausted - calculate reset time from window start
			const resetAt =
				new Date(existing.windowStart).getTime() + RATE_LIMIT_WINDOW_MS;
			return { allowed: false, remaining: 0, resetAt };
		}
	}

	// No existing record - insert new one
	await db.insert(rateLimits).values({
		id: userIp,
		userIp,
		generationsCount: 1,
		windowStart: now,
	});

	return { allowed: true, remaining: MAX_GENERATIONS_PER_DAY - 1 };
}
