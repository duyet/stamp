import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRateLimitDb } from "@/test-utils";
import { checkRateLimit } from "../rate-limit";

const FIXED_NOW = new Date("2025-06-15T12:00:00Z");

describe("checkRateLimit", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(FIXED_NOW);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("allows new user and creates record", async () => {
		const { db, insertValues } = createMockRateLimitDb(null);

		const result = await checkRateLimit(db, "1.2.3.4");

		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(4);
		expect(insertValues).toHaveBeenCalledWith(
			expect.objectContaining({
				userIp: "1.2.3.4",
				generationsCount: 1,
			}),
		);
	});

	it("allows user under the limit", async () => {
		const { db } = createMockRateLimitDb({
			userIp: "1.2.3.4",
			generationsCount: 2,
			windowStart: FIXED_NOW, // current window
		});

		const result = await checkRateLimit(db, "1.2.3.4");

		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(2); // 5 - 2 - 1 = 2
	});

	it("allows user at count 4 (one more left)", async () => {
		const { db } = createMockRateLimitDb({
			userIp: "1.2.3.4",
			generationsCount: 4,
			windowStart: FIXED_NOW,
		});

		const result = await checkRateLimit(db, "1.2.3.4");

		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(0); // 5 - 4 - 1 = 0
	});

	it("blocks user at the limit (5 generations)", async () => {
		const { db } = createMockRateLimitDb({
			userIp: "1.2.3.4",
			generationsCount: 5,
			windowStart: FIXED_NOW,
		});

		const result = await checkRateLimit(db, "1.2.3.4");

		expect(result.allowed).toBe(false);
		expect(result.remaining).toBe(0);
	});

	it("blocks user over the limit", async () => {
		const { db } = createMockRateLimitDb({
			userIp: "1.2.3.4",
			generationsCount: 10,
			windowStart: FIXED_NOW,
		});

		const result = await checkRateLimit(db, "1.2.3.4");

		expect(result.allowed).toBe(false);
		expect(result.remaining).toBe(0);
	});

	it("resets when window has expired", async () => {
		const expiredWindow = new Date(FIXED_NOW.getTime() - 25 * 60 * 60 * 1000);
		const { db, updateSet } = createMockRateLimitDb({
			userIp: "1.2.3.4",
			generationsCount: 5,
			windowStart: expiredWindow,
		});

		const result = await checkRateLimit(db, "1.2.3.4");

		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(4);
		expect(updateSet).toHaveBeenCalledWith(
			expect.objectContaining({
				generationsCount: 1,
			}),
		);
	});

	it("resets window just over 24 hours", async () => {
		const barelyExpired = new Date(
			FIXED_NOW.getTime() - 24 * 60 * 60 * 1000 - 1,
		);
		const { db } = createMockRateLimitDb({
			userIp: "1.2.3.4",
			generationsCount: 5,
			windowStart: barelyExpired,
		});

		const result = await checkRateLimit(db, "1.2.3.4");

		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(4);
	});

	it("does NOT reset window just under 24 hours", async () => {
		const notExpired = new Date(FIXED_NOW.getTime() - 23 * 60 * 60 * 1000);
		const { db } = createMockRateLimitDb({
			userIp: "1.2.3.4",
			generationsCount: 5,
			windowStart: notExpired,
		});

		const result = await checkRateLimit(db, "1.2.3.4");

		expect(result.allowed).toBe(false);
		expect(result.remaining).toBe(0);
	});
});
