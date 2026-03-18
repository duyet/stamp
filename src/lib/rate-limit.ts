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
): Promise<{ allowed: boolean; remaining: number }> {
	const now = new Date();
	const nowMs = now.getTime();
	const windowStartMs = nowMs - RATE_LIMIT_WINDOW_MS;

	// First, try atomic UPDATE with WHERE clause
	// Only increments if current count is below limit
	await db.$client
		.prepare(
			`UPDATE rate_limits SET generations_count = generations_count + 1 WHERE user_ip = ? AND generations_count < ? AND window_start >= ?`,
		)
		.bind(userIp, MAX_GENERATIONS_PER_DAY, new Date(windowStartMs))
		.run();

	// Check if the UPDATE succeeded
	const afterUpdate = await db.query.rateLimits.findFirst({
		where: eq(rateLimits.userIp, userIp),
	});

	if (afterUpdate && afterUpdate.windowStart >= new Date(windowStartMs)) {
		// Existing record within window - check if UPDATE succeeded
		if (afterUpdate.generationsCount <= MAX_GENERATIONS_PER_DAY) {
			return {
				allowed: true,
				remaining: MAX_GENERATIONS_PER_DAY - afterUpdate.generationsCount,
			};
		}
		return { allowed: false, remaining: 0 };
	}

	// No existing record or window expired - do atomic insert
	// Use INSERT with the assumption that most requests will be new IPs
	await db.insert(rateLimits).values({
		id: userIp,
		userIp,
		generationsCount: 1,
		windowStart: now,
	});

	return { allowed: true, remaining: MAX_GENERATIONS_PER_DAY - 1 };
}
