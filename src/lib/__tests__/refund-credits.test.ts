import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/db";
import { RATE_LIMIT_WINDOW_MS } from "../constants";
import { refundCredits } from "../refund-credits";

const FIXED_NOW = 1718452800000; // 2024-06-15T12:00:00Z

function createMockRefundDb() {
	const mockPrepare = vi.fn().mockImplementation((sql: string) => {
		return {
			bind: vi.fn().mockImplementation((..._args: unknown[]) => ({
				run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
			})),
		};
	});

	return {
		db: {
			$client: { prepare: mockPrepare },
		} as unknown as Database,
		mockPrepare,
	};
}

describe("refundCredits", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(FIXED_NOW);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("authenticated user refunds", () => {
		it("refunds to daily credits by default", async () => {
			const { db, mockPrepare } = createMockRefundDb();

			await refundCredits(db, "user_123", "1.2.3.4", 1);

			expect(mockPrepare).toHaveBeenCalledWith(
				expect.stringContaining("daily_used = daily_used -"),
			);
		});

		it("refunds to purchased credits when source is 'purchased'", async () => {
			const { db, mockPrepare } = createMockRefundDb();

			await refundCredits(db, "user_123", "1.2.3.4", 1, "purchased");

			expect(mockPrepare).toHaveBeenCalledWith(
				expect.stringContaining("purchased_credits = purchased_credits +"),
			);
		});

		it("refunds to daily credits when source is explicitly 'daily'", async () => {
			const { db, mockPrepare } = createMockRefundDb();

			await refundCredits(db, "user_123", "1.2.3.4", 1, "daily");

			expect(mockPrepare).toHaveBeenCalledWith(
				expect.stringContaining("daily_used = daily_used -"),
			);
		});

		it("binds correct values for daily refund", async () => {
			const { db, mockPrepare } = createMockRefundDb();

			await refundCredits(db, "user_123", "1.2.3.4", 3, "daily");

			const bindCall = mockPrepare.mock.results[0].value.bind;
			expect(bindCall).toHaveBeenCalledWith(3, FIXED_NOW, "user_123");
		});

		it("binds correct values for purchased refund", async () => {
			const { db, mockPrepare } = createMockRefundDb();

			await refundCredits(db, "user_123", "1.2.3.4", 5, "purchased");

			const bindCall = mockPrepare.mock.results[0].value.bind;
			expect(bindCall).toHaveBeenCalledWith(5, FIXED_NOW, "user_123");
		});
	});

	describe("anonymous user refunds", () => {
		it("refunds via rate_limits table when userId is null", async () => {
			const { db, mockPrepare } = createMockRefundDb();

			await refundCredits(db, null, "1.2.3.4", 1);

			expect(mockPrepare).toHaveBeenCalledWith(
				expect.stringContaining("rate_limits"),
			);
		});

		it("uses correct SQL for anonymous refund", async () => {
			const { db, mockPrepare } = createMockRefundDb();

			await refundCredits(db, null, "10.0.0.1", 1);

			expect(mockPrepare).toHaveBeenCalledWith(
				expect.stringContaining("generations_count = generations_count - 1"),
			);
			expect(mockPrepare).toHaveBeenCalledWith(
				expect.stringContaining("generations_count > 0"),
			);
		});

		it("binds IP and window start for anonymous refund", async () => {
			const { db, mockPrepare } = createMockRefundDb();

			await refundCredits(db, null, "10.0.0.1", 1);

			// The anonymous path uses the last prepare call
			const lastCall =
				mockPrepare.mock.results[mockPrepare.mock.results.length - 1];
			const bindCall = lastCall.value.bind;
			const windowStartMs = FIXED_NOW - RATE_LIMIT_WINDOW_MS;
			expect(bindCall).toHaveBeenCalledWith(
				"10.0.0.1",
				new Date(windowStartMs),
			);
		});
	});
});
