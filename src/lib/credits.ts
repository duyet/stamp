import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { Database } from "@/db";
import { creditTransactions, userCredits } from "@/db/schema";

export const DEFAULT_DAILY_LIMIT = 100;
export const ANONYMOUS_DAILY_LIMIT = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get or create a user's credit record.
 * Auto-resets daily credits when the 24h window has expired.
 */
export async function getUserCredits(db: Database, userId: string) {
	const now = Date.now();
	const existing = await db.query.userCredits.findFirst({
		where: eq(userCredits.userId, userId),
	});

	if (!existing) {
		const record = {
			userId,
			dailyLimit: DEFAULT_DAILY_LIMIT,
			dailyUsed: 0,
			dailyResetAt: now + WINDOW_MS,
			purchasedCredits: 0,
			createdAt: now,
			updatedAt: now,
		};
		await db.insert(userCredits).values(record);
		return record;
	}

	// Reset daily credits if window has expired
	if (now >= existing.dailyResetAt) {
		const resetFields = {
			dailyUsed: 0,
			dailyResetAt: now + WINDOW_MS,
			updatedAt: now,
		};
		await db
			.update(userCredits)
			.set(resetFields)
			.where(eq(userCredits.userId, userId));
		return { ...existing, ...resetFields };
	}

	return existing;
}

/**
 * Check if a user has credits available and deduct one.
 * Deducts from daily credits first, then purchased credits.
 */
export async function checkAndDeductCredit(
	db: Database,
	userId: string,
): Promise<{
	allowed: boolean;
	remaining: number;
	source: "daily" | "purchased";
}> {
	const credits = await getUserCredits(db, userId);
	const now = Date.now();

	const dailyRemaining = credits.dailyLimit - credits.dailyUsed;

	// Try daily credits first
	if (dailyRemaining > 0) {
		const newDailyUsed = credits.dailyUsed + 1;
		await db
			.update(userCredits)
			.set({ dailyUsed: newDailyUsed, updatedAt: now })
			.where(eq(userCredits.userId, userId));

		const remaining =
			credits.dailyLimit - newDailyUsed + credits.purchasedCredits;
		return { allowed: true, remaining, source: "daily" };
	}

	// Try purchased credits
	if (credits.purchasedCredits > 0) {
		const newPurchased = credits.purchasedCredits - 1;
		await db
			.update(userCredits)
			.set({ purchasedCredits: newPurchased, updatedAt: now })
			.where(eq(userCredits.userId, userId));

		await db.insert(creditTransactions).values({
			id: nanoid(12),
			userId,
			type: "deduct_purchased",
			amount: -1,
			balanceAfter: newPurchased,
			metadata: null,
			createdAt: now,
		});

		return { allowed: true, remaining: newPurchased, source: "purchased" };
	}

	// No credits available
	return { allowed: false, remaining: 0, source: "daily" };
}

/**
 * Add purchased credits to a user's account.
 */
export async function addCredits(
	db: Database,
	userId: string,
	amount: number,
	type: string,
): Promise<void> {
	const credits = await getUserCredits(db, userId);
	const now = Date.now();
	const newPurchased = credits.purchasedCredits + amount;

	await db
		.update(userCredits)
		.set({ purchasedCredits: newPurchased, updatedAt: now })
		.where(eq(userCredits.userId, userId));

	await db.insert(creditTransactions).values({
		id: nanoid(12),
		userId,
		type,
		amount,
		balanceAfter: newPurchased,
		metadata: null,
		createdAt: now,
	});
}

/**
 * Get full credit state for API response.
 */
export async function getCreditsInfo(db: Database, userId: string) {
	const credits = await getUserCredits(db, userId);
	const dailyRemaining = credits.dailyLimit - credits.dailyUsed;

	return {
		dailyLimit: credits.dailyLimit,
		dailyUsed: credits.dailyUsed,
		dailyRemaining,
		purchasedCredits: credits.purchasedCredits,
		totalRemaining: dailyRemaining + credits.purchasedCredits,
		resetAt: credits.dailyResetAt,
	};
}
