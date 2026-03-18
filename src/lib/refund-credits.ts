import type { Database } from "@/db";
import { RATE_LIMIT_WINDOW_MS } from "./constants";

/**
 * Refund credits if generation fails after deduction.
 * Uses atomic SQL to safely increment the credit counter.
 * Refunds to the correct bucket (daily or purchased) based on source.
 *
 * @param db - Database instance
 * @param userId - User ID (null for anonymous users)
 * @param userIp - User IP address (for anonymous rate limit refunds)
 * @param creditCost - Number of credits to refund
 * @param source - Which credit bucket to refund to ("daily" or "purchased")
 */
export async function refundCredits(
	db: Database,
	userId: string | null,
	userIp: string,
	creditCost: number,
	source: "daily" | "purchased" = "daily",
): Promise<void> {
	if (userId) {
		// Refund to the correct credit bucket based on deduction source
		const now = Date.now();
		if (source === "purchased") {
			// Refund to purchased credits
			await db.$client
				.prepare(
					`UPDATE user_credits SET purchased_credits = purchased_credits + ?, updated_at = ? WHERE user_id = ?`,
				)
				.bind(creditCost, now, userId)
				.run();
		} else {
			// Refund to daily credits
			await db.$client
				.prepare(
					`UPDATE user_credits SET daily_used = daily_used - ?, updated_at = ? WHERE user_id = ? AND daily_used > 0`,
				)
				.bind(creditCost, now, userId)
				.run();
		}
	} else {
		// Refund anonymous rate limit
		// CRITICAL: Only refund if the window hasn't expired to prevent
		// manipulating new window counts with refunds from expired windows
		const nowMs = Date.now();
		const windowStartMs = nowMs - RATE_LIMIT_WINDOW_MS;
		await db.$client
			.prepare(
				`UPDATE rate_limits SET generations_count = generations_count - 1 WHERE user_ip = ? AND generations_count > 0 AND window_start >= ?`,
			)
			.bind(userIp, new Date(windowStartMs))
			.run();
	}
}
