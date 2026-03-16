import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRateLimitDb } from "@/test-utils";
import { checkRateLimit } from "../rate-limit";

const FIXED_NOW = new Date("2025-06-15T12:00:00Z");
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

describe("checkRateLimit edge cases", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(FIXED_NOW);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("handles exact 24h boundary (not expired)", async () => {
		const exactlyAt24h = new Date(FIXED_NOW.getTime() - DAY_MS);
		const { db } = createMockRateLimitDb({
			userIp: "1.2.3.4",
			generationsCount: 5,
			windowStart: exactlyAt24h,
		});

		const result = await checkRateLimit(db, "1.2.3.4");

		// At exactly 24h, now - windowStart === WINDOW_MS, which is NOT > WINDOW_MS
		expect(result.allowed).toBe(false);
		expect(result.remaining).toBe(0);
	});

	it("handles window at 1ms past 24h (expired)", async () => {
		const justPast24h = new Date(FIXED_NOW.getTime() - DAY_MS - 1);
		const { db } = createMockRateLimitDb({
			userIp: "1.2.3.4",
			generationsCount: 5,
			windowStart: justPast24h,
		});

		const result = await checkRateLimit(db, "1.2.3.4");

		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(4);
	});

	it("correctly reports remaining count at each generation", async () => {
		for (let count = 0; count < 5; count++) {
			const { db } = createMockRateLimitDb({
				userIp: "1.2.3.4",
				generationsCount: count,
				windowStart: FIXED_NOW,
			});

			const result = await checkRateLimit(db, "1.2.3.4");
			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(4 - count); // 5 - count - 1
		}
	});

	it("handles IPv6 addresses", async () => {
		const { db, insertValues } = createMockRateLimitDb(null);
		const ipv6 = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";

		const result = await checkRateLimit(db, ipv6);

		expect(result.allowed).toBe(true);
		expect(insertValues).toHaveBeenCalledWith(
			expect.objectContaining({ userIp: ipv6 }),
		);
	});

	it("handles very old window start", async () => {
		const veryOld = new Date(0); // epoch
		const { db } = createMockRateLimitDb({
			userIp: "1.2.3.4",
			generationsCount: 5,
			windowStart: veryOld,
		});

		const result = await checkRateLimit(db, "1.2.3.4");

		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(4);
	});

	it("increments count correctly for allowed users", async () => {
		const { db, updateSet } = createMockRateLimitDb({
			userIp: "1.2.3.4",
			generationsCount: 3,
			windowStart: FIXED_NOW,
		});

		await checkRateLimit(db, "1.2.3.4");

		expect(updateSet).toHaveBeenCalledWith(
			expect.objectContaining({ generationsCount: 4 }),
		);
	});
});
