import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockCreditsDb } from "@/test-utils";
import {
	addCredits,
	checkAndDeductCredit,
	DEFAULT_DAILY_LIMIT,
	getCreditsInfo,
	getUserCredits,
} from "../credits";

vi.mock("nanoid", () => ({
	nanoid: vi.fn(() => "txn_abc12345"),
}));

const FIXED_NOW = 1718452800000; // 2024-06-15T12:00:00Z
const WINDOW_MS = 24 * 60 * 60 * 1000;

describe("credits", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(FIXED_NOW);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("getUserCredits", () => {
		it("creates a new record for unknown user", async () => {
			const { db, insertValues } = createMockCreditsDb(null);

			const result = await getUserCredits(db, "user_123");

			expect(result.userId).toBe("user_123");
			expect(result.dailyLimit).toBe(DEFAULT_DAILY_LIMIT);
			expect(result.dailyUsed).toBe(0);
			expect(result.purchasedCredits).toBe(0);
			expect(insertValues).toHaveBeenCalledWith(
				expect.objectContaining({
					userId: "user_123",
					dailyLimit: DEFAULT_DAILY_LIMIT,
					dailyUsed: 0,
				}),
			);
		});

		it("returns existing record when window is still active", async () => {
			const { db } = createMockCreditsDb({
				userId: "user_123",
				dailyLimit: 100,
				dailyUsed: 5,
				dailyResetAt: FIXED_NOW + WINDOW_MS,
				purchasedCredits: 10,
				createdAt: FIXED_NOW - 1000,
				updatedAt: FIXED_NOW - 1000,
			});

			const result = await getUserCredits(db, "user_123");

			expect(result.dailyUsed).toBe(5);
			expect(result.purchasedCredits).toBe(10);
		});

		it("resets daily credits when window has expired", async () => {
			const { db, updateSet } = createMockCreditsDb({
				userId: "user_123",
				dailyLimit: 100,
				dailyUsed: 90,
				dailyResetAt: FIXED_NOW - 1, // expired
				purchasedCredits: 5,
				createdAt: FIXED_NOW - WINDOW_MS,
				updatedAt: FIXED_NOW - WINDOW_MS,
			});

			const result = await getUserCredits(db, "user_123");

			expect(result.dailyUsed).toBe(0);
			expect(result.dailyResetAt).toBe(FIXED_NOW + WINDOW_MS);
			expect(updateSet).toHaveBeenCalledWith(
				expect.objectContaining({
					dailyUsed: 0,
					dailyResetAt: FIXED_NOW + WINDOW_MS,
				}),
			);
		});
	});

	describe("checkAndDeductCredit", () => {
		it("deducts from daily credits when available", async () => {
			const { db, updateSet } = createMockCreditsDb({
				userId: "user_123",
				dailyLimit: 100,
				dailyUsed: 5,
				dailyResetAt: FIXED_NOW + WINDOW_MS,
				purchasedCredits: 10,
				createdAt: FIXED_NOW,
				updatedAt: FIXED_NOW,
			});

			const result = await checkAndDeductCredit(db, "user_123");

			expect(result.allowed).toBe(true);
			expect(result.source).toBe("daily");
			expect(result.remaining).toBe(100 - 6 + 10); // 104
			expect(updateSet).toHaveBeenCalledWith(
				expect.objectContaining({ dailyUsed: 6 }),
			);
		});

		it("returns correct remaining count", async () => {
			const { db } = createMockCreditsDb({
				userId: "user_123",
				dailyLimit: 100,
				dailyUsed: 98,
				dailyResetAt: FIXED_NOW + WINDOW_MS,
				purchasedCredits: 0,
				createdAt: FIXED_NOW,
				updatedAt: FIXED_NOW,
			});

			const result = await checkAndDeductCredit(db, "user_123");

			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(1); // 100 - 99 + 0
		});

		it("falls through to purchased credits when daily exhausted", async () => {
			const { db } = createMockCreditsDb({
				userId: "user_123",
				dailyLimit: 100,
				dailyUsed: 100,
				dailyResetAt: FIXED_NOW + WINDOW_MS,
				purchasedCredits: 5,
				createdAt: FIXED_NOW,
				updatedAt: FIXED_NOW,
			});

			const result = await checkAndDeductCredit(db, "user_123");

			expect(result.allowed).toBe(true);
			expect(result.source).toBe("purchased");
			expect(result.remaining).toBe(4);
		});

		it("blocks when both daily and purchased exhausted", async () => {
			const { db } = createMockCreditsDb({
				userId: "user_123",
				dailyLimit: 100,
				dailyUsed: 100,
				dailyResetAt: FIXED_NOW + WINDOW_MS,
				purchasedCredits: 0,
				createdAt: FIXED_NOW,
				updatedAt: FIXED_NOW,
			});

			const result = await checkAndDeductCredit(db, "user_123");

			expect(result.allowed).toBe(false);
			expect(result.remaining).toBe(0);
		});

		it("resets daily credits and allows generation after window expires", async () => {
			const { db } = createMockCreditsDb({
				userId: "user_123",
				dailyLimit: 100,
				dailyUsed: 100,
				dailyResetAt: FIXED_NOW - 1, // expired
				purchasedCredits: 0,
				createdAt: FIXED_NOW - WINDOW_MS,
				updatedAt: FIXED_NOW - WINDOW_MS,
			});

			const result = await checkAndDeductCredit(db, "user_123");

			expect(result.allowed).toBe(true);
			expect(result.source).toBe("daily");
			expect(result.remaining).toBe(99); // 100 - 1 + 0
		});
	});

	describe("addCredits", () => {
		it("adds purchased credits and creates transaction", async () => {
			const { db, updateSet, insertValues } = createMockCreditsDb({
				userId: "user_123",
				dailyLimit: 100,
				dailyUsed: 50,
				dailyResetAt: FIXED_NOW + WINDOW_MS,
				purchasedCredits: 10,
				createdAt: FIXED_NOW,
				updatedAt: FIXED_NOW,
			});

			await addCredits(db, "user_123", 50, "purchase");

			// Should update purchased credits
			expect(updateSet).toHaveBeenCalledWith(
				expect.objectContaining({ purchasedCredits: 60 }),
			);

			// Should insert a transaction record
			expect(insertValues).toHaveBeenCalledWith(
				expect.objectContaining({
					userId: "user_123",
					type: "purchase",
					amount: 50,
					balanceAfter: 60,
				}),
			);
		});
	});

	describe("getCreditsInfo", () => {
		it("returns full credit state", async () => {
			const { db } = createMockCreditsDb({
				userId: "user_123",
				dailyLimit: 100,
				dailyUsed: 30,
				dailyResetAt: FIXED_NOW + WINDOW_MS,
				purchasedCredits: 15,
				createdAt: FIXED_NOW,
				updatedAt: FIXED_NOW,
			});

			const info = await getCreditsInfo(db, "user_123");

			expect(info.dailyLimit).toBe(100);
			expect(info.dailyUsed).toBe(30);
			expect(info.dailyRemaining).toBe(70);
			expect(info.purchasedCredits).toBe(15);
			expect(info.totalRemaining).toBe(85);
			expect(info.resetAt).toBe(FIXED_NOW + WINDOW_MS);
		});
	});
});
