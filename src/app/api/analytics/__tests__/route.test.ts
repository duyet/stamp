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

// Dynamic import to allow stubEnv to take effect before route module loads
let GET: typeof import("../route")["GET"];

describe("GET /api/analytics", () => {
	const request = createGetRequest("http://localhost/api/analytics");

	beforeEach(async () => {
		// Set ADMIN_USERS before route module is loaded
		vi.stubEnv("ADMIN_USERS", "user_admin,user_other");
		vi.clearAllMocks();
		vi.mocked(getAuthUserId).mockResolvedValue({ userId: "user_admin" });
		vi.mocked(getEnv).mockReturnValue({} as never);
		// Import route after env is set
		GET = (await import("../route")).GET;
	});

	it("returns 401 when not authenticated", async () => {
		vi.mocked(getAuthUserId).mockResolvedValue({ userId: null });

		const res = await GET(request);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(401);
		expect(data.error).toBe("Unauthorized");
	});

	it("returns analytics data with correct shape", async () => {
		// Mock $client.prepare for rate limiting
		const mockPrepare = createMockRateLimitPrepare();

		// All possible query results - mock will return these cyclically
		// Using cyclic approach since Promise.all calls queries in parallel
		const allResults = [
			// popular styles
			[
				{ style: "vintage", count: 50 },
				{ style: "modern", count: 30 },
			],
			// daily trend
			[
				{ day: 1710460800000, count: 3 },
				{ day: 1710547200000, count: 5 },
			],
			// unique visitors
			[{ count: 42 }],
			// event breakdown
			[
				{ event: "page_view", count: 500 },
				{ event: "download", count: 15 },
			],
			// page view breakdown
			[
				{ path: "/", count: 300 },
				{ path: "/generate", count: 150 },
			],
			// location country
			[{ countrycode: "US", count: 25 }],
			// location city
			[{ countrycode: "US", city: "New York", count: 10 }],
			// timezone
			[{ timezone: "America/New_York", hour: 14, count: 5 }],
			// map data
			[{ countrycode: "US", count: 25 }],
		];

		let resultIndex = 0;
		const mockSelect = vi.fn().mockImplementation(() => {
			const result = allResults[resultIndex % allResults.length];
			resultIndex++;
			return createSelectChain(result);
		});

		// Mock db.all() for consolidated queries (2 calls: stamp counts + event metrics)
		let allCallCount = 0;
		const mockAll = vi.fn().mockImplementation(() => {
			if (allCallCount === 0) {
				allCallCount++;
				return Promise.resolve([
					{
						total_stamps: 100,
						stamps_today: 5,
						stamps_week: 25,
						stamps_month: 80,
					},
				]);
			}
			// Event metrics consolidated query
			return Promise.resolve([
				{
					total_page_views: 500,
					total_downloads: 15,
					total_shares: 8,
				},
			]);
		});

		vi.mocked(getDb).mockReturnValue({
			$client: { prepare: mockPrepare },
			select: mockSelect,
			all: mockAll,
		} as never);

		const res = await GET(request);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(200);
		expect(data.totalStamps).toBe(100);
		expect(data.stampsToday).toBe(5);
		expect(data.stampsThisWeek).toBe(25);
		expect(data.stampsThisMonth).toBe(80);
		expect(data.popularStyles).toEqual([
			{ style: "vintage", count: 50 },
			{ style: "modern", count: 30 },
		]);
		expect(data.dailyTrend).toHaveLength(2);
		expect(data.totalPageViews).toBe(500);
		expect(data.uniqueVisitors).toBe(42);
		expect(data.totalDownloads).toBe(15);
		expect(data.totalShares).toBe(8);
		expect(data.eventBreakdown).toEqual([
			{ event: "page_view", count: 500 },
			{ event: "download", count: 15 },
		]);
		expect(data.pageViewBreakdown).toEqual([
			{ path: "/", count: 300 },
			{ path: "/generate", count: 150 },
		]);
	});

	it("returns defaults when queries return empty results", async () => {
		const mockPrepare = createMockRateLimitPrepare();
		const mockSelect = vi.fn().mockImplementation(() => createSelectChain([]));
		let allCallCount = 0;
		const mockAll = vi.fn().mockImplementation(() => {
			if (allCallCount === 0) {
				allCallCount++;
				return Promise.resolve([
					{
						total_stamps: 0,
						stamps_today: 0,
						stamps_week: 0,
						stamps_month: 0,
					},
				]);
			}
			// Event metrics consolidated query
			return Promise.resolve([
				{
					total_page_views: 0,
					total_downloads: 0,
					total_shares: 0,
				},
			]);
		});

		vi.mocked(getDb).mockReturnValue({
			$client: { prepare: mockPrepare },
			select: mockSelect,
			all: mockAll,
		} as never);

		const res = await GET(request);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(200);
		expect(data.totalStamps).toBe(0);
		expect(data.stampsToday).toBe(0);
		expect(data.popularStyles).toEqual([]);
		expect(data.dailyTrend).toEqual([]);
		expect(data.totalPageViews).toBe(0);
		expect(data.uniqueVisitors).toBe(0);
		expect(data.totalDownloads).toBe(0);
		expect(data.totalShares).toBe(0);
		expect(data.eventBreakdown).toEqual([]);
		expect(data.pageViewBreakdown).toEqual([]);
	});

	it("returns 500 on database error", async () => {
		const mockPrepare = createMockRateLimitPrepare();
		const mockSelect = vi.fn().mockReturnValue({
			from: vi.fn().mockRejectedValue(new Error("DB connection failed")),
		});

		vi.mocked(getDb).mockReturnValue({
			$client: { prepare: mockPrepare },
			select: mockSelect,
		} as never);

		const res = await GET(request);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(500);
		expect(data.error).toContain("Failed to fetch analytics");
	});

	it("handles null style in popular styles gracefully", async () => {
		const mockPrepare = createMockRateLimitPrepare();
		let callCount = 0;
		const selectResults = [
			[{ style: null, count: 3 }], // null style
			[],
			[{ count: 20 }], // unique visitors
			[], // event breakdown
			[], // page view breakdown
			[], // location country
			[], // location city
			[], // timezone
		];

		const mockSelect = vi.fn().mockImplementation(() => {
			const result = selectResults[callCount] || [];
			callCount++;
			return createSelectChain(result);
		});

		let allCallCount = 0;
		const mockAll = vi.fn().mockImplementation(() => {
			if (allCallCount === 0) {
				allCallCount++;
				return Promise.resolve([
					{
						total_stamps: 10,
						stamps_today: 1,
						stamps_week: 5,
						stamps_month: 8,
					},
				]);
			}
			// Event metrics consolidated query
			return Promise.resolve([
				{
					total_page_views: 20,
					total_downloads: 0,
					total_shares: 0,
				},
			]);
		});

		vi.mocked(getDb).mockReturnValue({
			$client: { prepare: mockPrepare },
			select: mockSelect,
			all: mockAll,
		} as never);

		const res = await GET(request);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(200);
		const styles = data.popularStyles as Array<{
			style: string;
			count: number;
		}>;
		expect(styles[0]?.style).toBe("vintage");
	});
});
