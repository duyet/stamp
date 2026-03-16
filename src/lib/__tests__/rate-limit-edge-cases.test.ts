import { describe, expect, it, vi } from "vitest";
import type { Database } from "@/db";
import { checkRateLimit } from "../rate-limit";

function createMockDb(
	existing: {
		userIp: string;
		generationsCount: number;
		windowStart: Date;
	} | null,
) {
	const insertValues = vi.fn().mockResolvedValue(undefined);
	const updateSet = vi.fn().mockReturnValue({
		where: vi.fn().mockResolvedValue(undefined),
	});

	return {
		db: {
			query: {
				rateLimits: {
					findFirst: vi.fn().mockResolvedValue(existing),
				},
			},
			insert: vi.fn().mockReturnValue({ values: insertValues }),
			update: vi.fn().mockReturnValue({ set: updateSet }),
		} as unknown as Database,
		insertValues,
		updateSet,
	};
}

describe("checkRateLimit edge cases", () => {
	it("handles exact 24h boundary (not expired)", async () => {
		const exactlyAt24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
		const { db } = createMockDb({
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
		const justPast24h = new Date(Date.now() - 24 * 60 * 60 * 1000 - 1);
		const { db } = createMockDb({
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
			const { db } = createMockDb({
				userIp: "1.2.3.4",
				generationsCount: count,
				windowStart: new Date(),
			});

			const result = await checkRateLimit(db, "1.2.3.4");
			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(4 - count); // 5 - count - 1
		}
	});

	it("handles IPv6 addresses", async () => {
		const { db, insertValues } = createMockDb(null);
		const ipv6 = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";

		const result = await checkRateLimit(db, ipv6);

		expect(result.allowed).toBe(true);
		expect(insertValues).toHaveBeenCalledWith(
			expect.objectContaining({ userIp: ipv6 }),
		);
	});

	it("handles very old window start", async () => {
		const veryOld = new Date(0); // epoch
		const { db } = createMockDb({
			userIp: "1.2.3.4",
			generationsCount: 5,
			windowStart: veryOld,
		});

		const result = await checkRateLimit(db, "1.2.3.4");

		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(4);
	});

	it("increments count correctly for allowed users", async () => {
		const { db, updateSet } = createMockDb({
			userIp: "1.2.3.4",
			generationsCount: 3,
			windowStart: new Date(),
		});

		await checkRateLimit(db, "1.2.3.4");

		expect(updateSet).toHaveBeenCalledWith(
			expect.objectContaining({ generationsCount: 4 }),
		);
	});
});
