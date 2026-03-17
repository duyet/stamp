import { eq } from "drizzle-orm";
import type { Database } from "@/db";
import { rateLimits } from "@/db/schema";
import { DAILY_CREDIT_LIMITS, RATE_LIMIT_WINDOW_MS } from "./constants";

const MAX_GENERATIONS_PER_DAY = DAILY_CREDIT_LIMITS.ANONYMOUS;

export async function checkRateLimit(
	db: Database,
	userIp: string,
): Promise<{ allowed: boolean; remaining: number }> {
	const now = new Date();
	const existing = await db.query.rateLimits.findFirst({
		where: eq(rateLimits.userIp, userIp),
	});

	if (!existing) {
		await db.insert(rateLimits).values({
			id: userIp,
			userIp,
			generationsCount: 1,
			windowStart: now,
		});
		return { allowed: true, remaining: MAX_GENERATIONS_PER_DAY - 1 };
	}

	const windowExpired =
		now.getTime() - existing.windowStart.getTime() > RATE_LIMIT_WINDOW_MS;

	if (windowExpired) {
		await db
			.update(rateLimits)
			.set({ generationsCount: 1, windowStart: now })
			.where(eq(rateLimits.userIp, userIp));
		return { allowed: true, remaining: MAX_GENERATIONS_PER_DAY - 1 };
	}

	if (existing.generationsCount >= MAX_GENERATIONS_PER_DAY) {
		return { allowed: false, remaining: 0 };
	}

	await db
		.update(rateLimits)
		.set({ generationsCount: existing.generationsCount + 1 })
		.where(eq(rateLimits.userIp, userIp));

	return {
		allowed: true,
		remaining: MAX_GENERATIONS_PER_DAY - existing.generationsCount - 1,
	};
}
