import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGetRequest, createMockRateLimitPrepare } from "@/test-utils";

vi.mock("@/lib/clerk", () => ({
	getAuthUserIdentity: vi.fn(),
}));

vi.mock("@/db", () => ({
	getDb: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
	getEnv: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
	checkAnalyticsRateLimit: vi
		.fn()
		.mockResolvedValue({ allowed: true, remaining: 9 }),
}));

import { getDb } from "@/db";
import { getAuthUserIdentity } from "@/lib/clerk";
import { getEnv } from "@/lib/env";

let GET: typeof import("../analytics")["GET"];

type AnalyticsResponse = Record<string, unknown>;
const FIXED_NOW = new Date("2026-04-29T12:00:00Z");

function mockDbAll(results: unknown[][]) {
	let call = 0;
	return vi.fn().mockImplementation(() => {
		const result = results[call] ?? [];
		call++;
		return Promise.resolve(result);
	});
}

describe("GET /api/analytics", () => {
	const request = createGetRequest("http://localhost/api/analytics");

	beforeEach(async () => {
		vi.useFakeTimers();
		vi.setSystemTime(FIXED_NOW);
		vi.clearAllMocks();
		vi.mocked(getAuthUserIdentity).mockResolvedValue({
			email: "admin@example.com",
			userId: "user_admin",
		});
		vi.mocked(getEnv).mockReturnValue({
			ADMIN_USER_IDS: "user_admin,user_other",
		} as never);
		GET = (await import("../analytics")).GET;
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it("returns 401 when not authenticated", async () => {
		vi.mocked(getAuthUserIdentity).mockResolvedValue({
			email: null,
			userId: null,
		});

		const res = await GET(request);
		const data = (await res.json()) as AnalyticsResponse;

		expect(res.status).toBe(401);
		expect(data.error).toBe("Unauthorized");
	});

	it("returns 403 for non-admin users", async () => {
		vi.mocked(getAuthUserIdentity).mockResolvedValue({
			email: "regular@example.com",
			userId: "user_regular",
		});

		const res = await GET(request);
		const data = (await res.json()) as AnalyticsResponse;

		expect(res.status).toBe(403);
		expect(data.error).toBe("Forbidden");
	});

	it("returns expanded analytics from raw fallback queries", async () => {
		const mockAll = mockDbAll([
			[], // daily_stats empty
			[
				{
					total_stamps: 100,
					stamps_today: 5,
					stamps_week: 25,
					stamps_month: 80,
				},
			],
			[
				{
					total_page_views: 500,
					total_downloads: 15,
					total_shares: 8,
				},
			],
			[
				{ day: 1_710_460_800, count: 3 },
				{ day: 1_710_547_200, count: 5 },
			],
			[
				{ style: "vintage", count: 50 },
				{ style: "modern", count: 30 },
			],
			[{ count: 42 }],
			[
				{ event: "page_view", count: 500 },
				{ event: "download", count: 15 },
			],
			[
				{ path: "/", count: 300 },
				{ path: "/generate", count: 150 },
			],
			[{ countryCode: "US", count: 25 }],
			[{ countryCode: "US", city: "New York", count: 10 }],
			[{ timezone: "America/New_York", hour: 14, count: 5 }],
			[
				{
					total: 100,
					public_count: 70,
					private_count: 30,
					with_reference: 12,
					without_reference: 88,
					with_description: 60,
					with_location: 25,
					authenticated: 40,
					anonymous: 60,
					session_owned: 85,
					distinct_users: 18,
				},
			],
			[
				{
					generations: 90,
					average_generation_time_ms: 1250.4,
					max_generation_time_ms: 4500,
					average_prompt_length: 64.6,
					hd_generations: 10,
					reference_generations: 12,
				},
			],
			[
				{ referrer: "https://www.google.com/search?q=stamp", count: 11 },
				{ referrer: "https://duyet.net/post", count: 4 },
			],
			[
				{ user_agent: "Mozilla/5.0 Chrome/120.0 Safari/537.36", count: 12 },
				{ user_agent: "Mozilla/5.0 Firefox/120.0", count: 3 },
			],
			[
				{ day: 1_710_460_800, event: "page_view", count: 10 },
				{ day: 1_710_460_800, event: "generation", count: 3 },
				{ day: 1_710_547_200, event: "download", count: 2 },
			],
			[
				{
					users: 7,
					total_daily_limit: 700,
					total_daily_used: 120,
					total_daily_remaining: 580,
					purchased_credits: 45,
					users_with_purchased_credits: 2,
				},
			],
			[{ type: "deduct_purchased", count: 5, total_amount: -15 }],
			[{ day: 1_710_460_800, count: 5, total_amount: -15 }],
			[
				{ label: "generation limits", rows: 3, max_count: 18, total_count: 30 },
				{ label: "analytics limits", rows: 1, max_count: 2, total_count: 2 },
				{ label: "tracking limits", rows: 4, max_count: 60, total_count: 140 },
			],
		]);

		vi.mocked(getDb).mockReturnValue({
			$client: { prepare: createMockRateLimitPrepare() },
			all: mockAll,
		} as never);

		const res = await GET(request);
		const data = (await res.json()) as AnalyticsResponse;

		expect(res.status).toBe(200);
		expect(data.totalStamps).toBe(100);
		expect(data.stampsToday).toBe(5);
		expect(data.totalPageViews).toBe(500);
		expect(data.uniqueVisitors).toBe(42);
		expect(data.popularStyles).toEqual([
			{ style: "vintage", count: 50 },
			{ style: "modern", count: 30 },
		]);
		expect(data.pageViewBreakdown).toEqual([
			{ path: "/", count: 300 },
			{ path: "/generate", count: 150 },
		]);
		expect(data.stampVisibility).toEqual({
			public: 70,
			private: 30,
			publicPercentage: 70,
		});
		expect(data.ownership).toMatchObject({
			authenticated: 40,
			anonymous: 60,
			sessionOwned: 85,
			distinctUsers: 18,
		});
		expect(data.generationPerformance).toMatchObject({
			generations: 90,
			averageMs: 1250,
			maxMs: 4500,
			averagePromptLength: 65,
			hdGenerations: 10,
			referenceGenerations: 12,
		});
		expect(data.referrerBreakdown).toEqual([
			{ label: "google.com", count: 11 },
			{ label: "duyet.net", count: 4 },
		]);
		expect(data.userAgentBreakdown).toEqual([
			{ label: "Chrome", count: 12 },
			{ label: "Firefox", count: 3 },
		]);
		expect(data.eventTrend).toEqual([
			{
				day: 1_710_460_800,
				total: 13,
				pageViews: 10,
				generations: 3,
				downloads: 0,
				shares: 0,
				copies: 0,
				stampViews: 0,
			},
			{
				day: 1_710_547_200,
				total: 2,
				pageViews: 0,
				generations: 0,
				downloads: 2,
				shares: 0,
				copies: 0,
				stampViews: 0,
			},
		]);
		expect(data.creditOverview).toMatchObject({
			users: 7,
			totalDailyUsed: 120,
			purchasedCredits: 45,
		});
		expect(data.creditTransactionBreakdown).toEqual([
			{ type: "deduct_purchased", count: 5, totalAmount: -15 },
		]);
		expect(data.rateLimitOverview).toMatchObject({
			generationRows: 3,
			analyticsRows: 1,
			trackRows: 4,
			totalRows: 8,
			maxTrackEventCount: 60,
		});
		expect(data.workersAiCredits).toMatchObject({
			status: "unconfigured",
			dailyFreeNeurons: 10_000,
			remainingNeuronsToday: 10_000,
		});
		expect(JSON.stringify(data)).not.toContain("user_admin");
		expect(JSON.stringify(data)).not.toContain("1.2.3.4");
		expect(JSON.stringify(data)).not.toContain("search?q=stamp");
	});

	it("includes remaining Cloudflare Workers AI free neurons when configured", async () => {
		vi.mocked(getEnv).mockReturnValue({
			ADMIN_USER_IDS: "user_admin",
			CLOUDFLARE_ACCOUNT_ID: "account_123",
			CLOUDFLARE_API_TOKEN: "cf_token_secret",
		} as never);
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({
				data: {
					viewer: {
						accounts: [
							{
								aiInferenceAdaptiveGroups: [
									{
										count: 12,
										sum: { totalNeurons: 7523.6 },
									},
								],
							},
						],
					},
				},
			}),
		});
		vi.stubGlobal("fetch", fetchMock);

		vi.mocked(getDb).mockReturnValue({
			$client: { prepare: createMockRateLimitPrepare() },
			all: vi.fn().mockResolvedValue([]),
		} as never);

		const res = await GET(request);
		const data = (await res.json()) as AnalyticsResponse;

		expect(res.status).toBe(200);
		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.cloudflare.com/client/v4/graphql",
			expect.objectContaining({
				method: "POST",
				headers: expect.objectContaining({
					Authorization: "Bearer cf_token_secret",
				}),
			}),
		);
		expect(data.workersAiCredits).toMatchObject({
			status: "ok",
			dailyFreeNeurons: 10_000,
			usedNeuronsToday: 7524,
			remainingNeuronsToday: 2476,
			requestsToday: 12,
		});
		expect(JSON.stringify(data)).not.toContain("cf_token_secret");
	});

	it("uses daily_stats for overview and trend data when available", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-04-29T12:00:00Z"));

		const mockAll = mockDbAll([
			[
				{
					date: "2026-04-29",
					total_stamps: 30,
					new_stamps: 6,
					page_views: 90,
					unique_visitors: 20,
					downloads: 7,
					shares: 4,
				},
				{
					date: "2026-04-28",
					total_stamps: 24,
					new_stamps: 5,
					page_views: 80,
					unique_visitors: 18,
					downloads: 3,
					shares: 2,
				},
			],
			[], // popular styles
			[{ count: 38 }], // daily_stats unique visitor sum
			[], // event breakdown
			[], // page views
			[], // countries
			[], // cities
			[], // timezones
			[{ total: 30, public_count: 20, private_count: 10 }],
			[{}], // generation metrics
			[], // referrers
			[], // user agents
			[], // event trend
			[{}], // credits
			[], // credit tx breakdown
			[], // credit tx trend
			[], // rate limits
		]);

		vi.mocked(getDb).mockReturnValue({
			$client: { prepare: createMockRateLimitPrepare() },
			all: mockAll,
		} as never);

		const res = await GET(request);
		const data = (await res.json()) as AnalyticsResponse;

		expect(res.status).toBe(200);
		expect(data.totalStamps).toBe(30);
		expect(data.stampsToday).toBe(6);
		expect(data.stampsThisWeek).toBe(11);
		expect(data.totalPageViews).toBe(170);
		expect(data.uniqueVisitors).toBe(38);
		expect(data.dailyTrend).toEqual([
			{ day: 1_777_334_400, count: 5 },
			{ day: 1_777_420_800, count: 6 },
		]);
	});

	it("returns safe defaults when aggregate queries return empty results", async () => {
		vi.mocked(getDb).mockReturnValue({
			$client: { prepare: createMockRateLimitPrepare() },
			all: vi.fn().mockResolvedValue([]),
		} as never);

		const res = await GET(request);
		const data = (await res.json()) as AnalyticsResponse;

		expect(res.status).toBe(200);
		expect(data.totalStamps).toBe(0);
		expect(data.stampsToday).toBe(0);
		expect(data.popularStyles).toEqual([]);
		expect(data.dailyTrend).toEqual([]);
		expect(data.totalPageViews).toBe(0);
		expect(data.uniqueVisitors).toBe(0);
		expect(data.eventBreakdown).toEqual([]);
		expect(data.pageViewBreakdown).toEqual([]);
		expect(data.creditOverview).toMatchObject({
			users: 0,
			totalDailyUsed: 0,
			purchasedCredits: 0,
		});
		expect(data.rateLimitOverview).toMatchObject({
			totalRows: 0,
			maxTrackEventCount: 0,
		});
		expect(data.workersAiCredits).toMatchObject({
			status: "unconfigured",
			remainingNeuronsToday: 10_000,
		});
	});

	it("returns 500 on database error", async () => {
		vi.mocked(getDb).mockReturnValue({
			$client: { prepare: createMockRateLimitPrepare() },
			all: vi.fn().mockRejectedValue(new Error("DB connection failed")),
		} as never);

		const res = await GET(request);
		const data = (await res.json()) as AnalyticsResponse;

		expect(res.status).toBe(500);
		expect(data.error).toContain("Failed to fetch analytics");
	});

	it("handles null style in popular styles gracefully", async () => {
		const mockAll = mockDbAll([
			[],
			[
				{
					total_stamps: 10,
					stamps_today: 1,
					stamps_week: 5,
					stamps_month: 8,
				},
			],
			[{ total_page_views: 20, total_downloads: 0, total_shares: 0 }],
			[],
			[{ style: null, count: 3 }],
		]);

		vi.mocked(getDb).mockReturnValue({
			$client: { prepare: createMockRateLimitPrepare() },
			all: mockAll,
		} as never);

		const res = await GET(request);
		const data = (await res.json()) as AnalyticsResponse;

		expect(res.status).toBe(200);
		expect(data.popularStyles).toEqual([{ style: "vintage", count: 3 }]);
	});
});
