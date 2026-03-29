import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createGetRequest,
	createMockRateLimitPrepare,
	createSelectChain,
} from "@/test-utils";

vi.mock("@/lib/clerk", () => ({
	getAuthUserId: vi.fn(),
}));

vi.mock("@/db", () => ({
	getDb: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
	getEnv: vi.fn(),
}));

import { getDb } from "@/db";
import { getAuthUserId } from "@/lib/clerk";
import { getEnv } from "@/lib/env";

let GET: typeof import("../analytics")["GET"];

describe("Analytics rate limiting (checkAnalyticsRateLimit)", () => {
	const request = createGetRequest("http://localhost/api/analytics");

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.mocked(getAuthUserId).mockResolvedValue({ userId: "user_admin" });
		vi.mocked(getEnv).mockReturnValue({
			ADMIN_USER_IDS: "user_admin",
		} as never);
		GET = (await import("../analytics")).GET;
	});

	/**
	 * Helper: create a mock prepare that simulates analytics rate limit behavior.
	 * The analytics route uses `checkAnalyticsRateLimit` which runs 1-3 prepare calls:
	 *   1. UPDATE ... RETURNING (increment if under limit)
	 *   2. SELECT ... (check existing record)
	 *   3. UPDATE ... SET generations_count = 1 (reset expired window)
	 *      OR INSERT ... (new record)
	 */
	function createAnalyticsRateLimitMock(options: {
		existingCount?: number;
		windowStart?: number;
		exceedLimit?: boolean;
	}) {
		const { existingCount, windowStart, exceedLimit } = options;
		const ANALYTICS_RATE_LIMIT = 10;
		const ANALYTICS_RATE_WINDOW = 15 * 60 * 1000;
		const now = Date.now();
		const windowStartThreshold = now - ANALYTICS_RATE_WINDOW;

		return vi.fn().mockImplementation((sql: string) => ({
			bind: vi.fn().mockImplementation((...args: unknown[]) => ({
				first: vi.fn().mockImplementation(() => {
					// UPDATE ... RETURNING: atomically increment if under limit
					if (
						sql.includes("UPDATE analytics_rate_limits") &&
						sql.includes("RETURNING generations_count")
					) {
						if (
							existingCount !== undefined &&
							existingCount < ANALYTICS_RATE_LIMIT
						) {
							return Promise.resolve({
								generations_count: existingCount + 1,
							});
						}
						return Promise.resolve(null); // limit reached or no record
					}
					// SELECT: check existing record
					if (sql.includes("SELECT generations_count")) {
						if (existingCount !== undefined) {
							return Promise.resolve({
								generations_count: existingCount,
								window_start: windowStart ?? now,
							});
						}
						return Promise.resolve(null); // no record
					}
					return Promise.resolve(null);
				}),
				run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
			})),
		}));
	}

	/**
	 * Helper: minimal mock for successful analytics response.
	 */
	function mockSuccessfulAnalytics(mockPrepare: ReturnType<typeof vi.fn>) {
		const mockSelect = vi.fn().mockReturnValue(createSelectChain([]));
		const mockAll = vi
			.fn()
			.mockResolvedValueOnce([
				{
					total_stamps: 10,
					stamps_today: 1,
					stamps_week: 5,
					stamps_month: 8,
				},
			])
			.mockResolvedValueOnce([
				{
					total_page_views: 20,
					total_downloads: 0,
					total_shares: 0,
				},
			]);

		vi.mocked(getDb).mockReturnValue({
			$client: { prepare: mockPrepare },
			select: mockSelect,
			all: mockAll,
		} as never);
	}

	it("allows request when under rate limit (new user)", async () => {
		const mockPrepare = createAnalyticsRateLimitMock({});

		mockSuccessfulAnalytics(mockPrepare);

		const res = await GET(request);

		expect(res.status).toBe(200);
		// Should have attempted the UPDATE path (first prepare call)
		expect(mockPrepare).toHaveBeenCalled();
	});

	it("allows request when under rate limit (existing user, count < 10)", async () => {
		const mockPrepare = createAnalyticsRateLimitMock({
			existingCount: 5,
			windowStart: Date.now(),
		});

		mockSuccessfulAnalytics(mockPrepare);

		const res = await GET(request);

		expect(res.status).toBe(200);
	});

	it("allows request when at count 9 (one more left)", async () => {
		const mockPrepare = createAnalyticsRateLimitMock({
			existingCount: 9,
			windowStart: Date.now(),
		});

		mockSuccessfulAnalytics(mockPrepare);

		const res = await GET(request);

		expect(res.status).toBe(200);
	});

	it("blocks request when rate limit exceeded (count >= 10)", async () => {
		const mockPrepare = createAnalyticsRateLimitMock({
			existingCount: 10,
			windowStart: Date.now(),
			exceedLimit: true,
		});

		mockSuccessfulAnalytics(mockPrepare);

		const res = await GET(request);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(429);
		expect(data.error).toContain("Rate limit exceeded");
	});

	it("blocks request when rate limit well exceeded", async () => {
		const mockPrepare = createAnalyticsRateLimitMock({
			existingCount: 25,
			windowStart: Date.now(),
			exceedLimit: true,
		});

		mockSuccessfulAnalytics(mockPrepare);

		const res = await GET(request);

		expect(res.status).toBe(429);
	});
});
