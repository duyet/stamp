import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGetRequest } from "@/test-utils";

vi.mock("@/lib/clerk", () => ({
	getAuthUserIdentity: vi.fn(),
}));

vi.mock("@/db", () => ({
	getDb: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
	getEnv: vi.fn(),
}));

import { getDb } from "@/db";
import { getAuthUserIdentity } from "@/lib/clerk";
import { getEnv } from "@/lib/env";

let GET: typeof import("../analytics")["GET"];

describe("Analytics rate limiting (checkAnalyticsRateLimit)", () => {
	const request = createGetRequest("http://localhost/api/analytics");

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.mocked(getAuthUserIdentity).mockResolvedValue({
			email: "admin@example.com",
			userId: "user_admin",
		});
		vi.mocked(getEnv).mockReturnValue({
			ADMIN_USER_IDS: "user_admin",
		} as never);
		GET = (await import("../analytics")).GET;
	});

	/**
	 * Helper: create a mock prepare that simulates analytics rate limit behavior.
	 * Matches the factory-created rate limiter (UPDATE + INSERT ON CONFLICT).
	 */
	function createAnalyticsRateLimitMock(options: {
		existingCount?: number;
		windowStart?: number;
		exceedLimit?: boolean;
	}) {
		const { existingCount, windowStart } = options;
		const ANALYTICS_RATE_LIMIT = 10;
		const ANALYTICS_RATE_WINDOW = 15 * 60 * 1000;
		const now = Date.now();

		return vi.fn().mockImplementation((sql: string) => ({
			bind: vi.fn().mockImplementation((..._args: unknown[]) => ({
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
					// INSERT ... ON CONFLICT DO UPDATE ... RETURNING (new user or expired window)
					if (
						sql.includes("INSERT INTO analytics_rate_limits") &&
						sql.includes("ON CONFLICT")
					) {
						if (existingCount === undefined) {
							// New record — allowed
							return Promise.resolve({
								generations_count: 1,
								window_start: now,
							});
						}
						// Existing record — check if window expired
						const windowStartThreshold = now - ANALYTICS_RATE_WINDOW;
						const ws = windowStart ?? now;
						if (ws < windowStartThreshold) {
							// Window expired — reset
							return Promise.resolve({
								generations_count: 1,
								window_start: now,
							});
						}
						// Window valid, at limit
						return Promise.resolve({
							generations_count: existingCount,
							window_start: ws,
						});
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
		const mockAll = vi
			.fn()
			.mockResolvedValueOnce([])
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
			])
			.mockResolvedValueOnce([])
			.mockResolvedValue([]);

		vi.mocked(getDb).mockReturnValue({
			$client: { prepare: mockPrepare },
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
