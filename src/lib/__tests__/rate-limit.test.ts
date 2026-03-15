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

describe("checkRateLimit", () => {
	it("allows new user and creates record", async () => {
		const { db, insertValues } = createMockDb(null);

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
		const { db } = createMockDb({
			userIp: "1.2.3.4",
			generationsCount: 2,
			windowStart: new Date(), // current window
		});

		const result = await checkRateLimit(db, "1.2.3.4");

		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(2); // 5 - 2 - 1 = 2
	});

	it("allows user at count 4 (one more left)", async () => {
		const { db } = createMockDb({
			userIp: "1.2.3.4",
			generationsCount: 4,
			windowStart: new Date(),
		});

		const result = await checkRateLimit(db, "1.2.3.4");

		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(0); // 5 - 4 - 1 = 0
	});

	it("blocks user at the limit (5 generations)", async () => {
		const { db } = createMockDb({
			userIp: "1.2.3.4",
			generationsCount: 5,
			windowStart: new Date(),
		});

		const result = await checkRateLimit(db, "1.2.3.4");

		expect(result.allowed).toBe(false);
		expect(result.remaining).toBe(0);
	});

	it("blocks user over the limit", async () => {
		const { db } = createMockDb({
			userIp: "1.2.3.4",
			generationsCount: 10,
			windowStart: new Date(),
		});

		const result = await checkRateLimit(db, "1.2.3.4");

		expect(result.allowed).toBe(false);
		expect(result.remaining).toBe(0);
	});

	it("resets when window has expired", async () => {
		const expiredWindow = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
		const { db, updateSet } = createMockDb({
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
		const barelyExpired = new Date(Date.now() - 24 * 60 * 60 * 1000 - 1);
		const { db } = createMockDb({
			userIp: "1.2.3.4",
			generationsCount: 5,
			windowStart: barelyExpired,
		});

		const result = await checkRateLimit(db, "1.2.3.4");

		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(4);
	});

	it("does NOT reset window just under 24 hours", async () => {
		const notExpired = new Date(Date.now() - 23 * 60 * 60 * 1000);
		const { db } = createMockDb({
			userIp: "1.2.3.4",
			generationsCount: 5,
			windowStart: notExpired,
		});

		const result = await checkRateLimit(db, "1.2.3.4");

		expect(result.allowed).toBe(false);
		expect(result.remaining).toBe(0);
	});
});
