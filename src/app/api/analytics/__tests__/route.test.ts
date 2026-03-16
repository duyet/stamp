import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSelectChain } from "@/test-utils";

vi.mock("@/db", () => ({
	getDb: vi.fn(),
}));

import { getDb } from "@/db";
import { GET } from "../route";

describe("GET /api/analytics", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns analytics data with correct shape", async () => {
		let callCount = 0;
		const selectResults = [
			[{ count: 100 }], // total stamps
			[{ count: 5 }], // stamps today
			[{ count: 25 }], // stamps this week
			[{ count: 80 }], // stamps this month
			[
				{ style: "vintage", count: 50 },
				{ style: "modern", count: 30 },
			], // popular styles
			[
				{ day: 1710460800000, count: 3 },
				{ day: 1710547200000, count: 5 },
			], // daily trend
			[{ count: 500 }], // total page views
			[{ count: 42 }], // unique visitors
		];

		const mockSelect = vi.fn().mockImplementation(() => {
			const result = selectResults[callCount] || [];
			callCount++;
			return createSelectChain(result);
		});

		vi.mocked(getDb).mockReturnValue({
			select: mockSelect,
		} as never);

		const res = await GET();
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
	});

	it("returns defaults when queries return empty results", async () => {
		const mockSelect = vi.fn().mockImplementation(() => createSelectChain([]));

		vi.mocked(getDb).mockReturnValue({
			select: mockSelect,
		} as never);

		const res = await GET();
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(200);
		expect(data.totalStamps).toBe(0);
		expect(data.stampsToday).toBe(0);
		expect(data.popularStyles).toEqual([]);
		expect(data.dailyTrend).toEqual([]);
		expect(data.totalPageViews).toBe(0);
		expect(data.uniqueVisitors).toBe(0);
	});

	it("returns 500 on database error", async () => {
		const mockSelect = vi.fn().mockReturnValue({
			from: vi.fn().mockRejectedValue(new Error("DB connection failed")),
		});

		vi.mocked(getDb).mockReturnValue({
			select: mockSelect,
		} as never);

		const res = await GET();
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(500);
		expect(data.error).toContain("Failed to fetch analytics");
	});

	it("handles null style in popular styles gracefully", async () => {
		let callCount = 0;
		const selectResults = [
			[{ count: 10 }],
			[{ count: 1 }],
			[{ count: 5 }],
			[{ count: 8 }],
			[{ style: null, count: 3 }], // null style
			[],
			[{ count: 20 }],
			[{ count: 5 }],
		];

		const mockSelect = vi.fn().mockImplementation(() => {
			const result = selectResults[callCount] || [];
			callCount++;
			return createSelectChain(result);
		});

		vi.mocked(getDb).mockReturnValue({
			select: mockSelect,
		} as never);

		const res = await GET();
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(200);
		// null style should default to "vintage"
		const styles = data.popularStyles as Array<{
			style: string;
			count: number;
		}>;
		expect(styles[0]?.style).toBe("vintage");
	});
});
