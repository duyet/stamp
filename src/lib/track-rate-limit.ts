import type { Database } from "@/db";

const TRACK_RATE_LIMIT = 100; // 100 events per window
const TRACK_RATE_WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Check and increment track rate limit using atomic D1 operations.
 * Limits each IP to 100 tracking events per minute.
 */
export async function checkTrackRateLimit(
	db: Database,
	userIp: string,
): Promise<{ allowed: boolean; remaining: number }> {
	const now = Date.now();
	const windowStart = now - TRACK_RATE_WINDOW_MS;

	// Try atomic UPDATE — only increments if under limit and window is valid
	const updateResult = await db.$client
		.prepare(
			`UPDATE track_rate_limits
			 SET event_count = event_count + 1
			 WHERE user_ip = ?
			 AND event_count < ?
			 AND window_start >= ?
			 RETURNING event_count`,
		)
		.bind(userIp, TRACK_RATE_LIMIT, windowStart)
		.first<{ event_count: number }>();

	if (updateResult) {
		return {
			allowed: true,
			remaining: TRACK_RATE_LIMIT - updateResult.event_count,
		};
	}

	// Check if record exists but exceeded limit or window expired
	const existing = await db.$client
		.prepare(
			`SELECT event_count, window_start FROM track_rate_limits WHERE user_ip = ?`,
		)
		.bind(userIp)
		.first<{ event_count: number; window_start: number }>();

	if (existing) {
		if (existing.window_start < windowStart) {
			// Window expired — reset
			await db.$client
				.prepare(
					`UPDATE track_rate_limits
					 SET event_count = 1, window_start = ?
					 WHERE user_ip = ?`,
				)
				.bind(now, userIp)
				.run();
			return { allowed: true, remaining: TRACK_RATE_LIMIT - 1 };
		}
		// Limit reached
		return { allowed: false, remaining: 0 };
	}

	// No record — insert
	await db.$client
		.prepare(
			`INSERT INTO track_rate_limits (user_ip, event_count, window_start) VALUES (?, 1, ?)`,
		)
		.bind(userIp, now)
		.run();

	return { allowed: true, remaining: TRACK_RATE_LIMIT - 1 };
}
