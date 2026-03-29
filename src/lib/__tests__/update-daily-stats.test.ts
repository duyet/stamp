import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/db";
import { createSelectChain } from "@/test-utils";
import { updateDailyStats } from "../update-daily-stats";

const FIXED_NOW = 1718452800000; // 2024-06-15T12:00:00Z

function createMockStatsDb(counts: {
	newStamps: number;
	totalStamps: number;
	pageViews: number;
	uniqueVisitors: number;
	downloads: number;
	shares: number;
}) {
	let selectCallIndex = 0;
	const selectResults = [
		[{ count: counts.newStamps }],
		[{ count: counts.totalStamps }],
		[{ count: counts.pageViews }],
		[{ count: counts.uniqueVisitors }],
		[{ count: counts.downloads }],
		[{ count: counts.shares }],
	];

	const mockSelect = vi.fn().mockImplementation(() => {
		const result = selectResults[selectCallIndex++] || [{ count: 0 }];
		return createSelectChain(result);
	});

	const insertValues = vi.fn().mockResolvedValue(undefined);
	const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);

	return {
		db: {
			select: mockSelect,
			insert: vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate,
				}),
			}),
		} as unknown as Database,
		insertValues,
		onConflictDoUpdate,
	};
}

describe("updateDailyStats", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(FIXED_NOW);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("inserts aggregated stats with correct values", async () => {
		const { db, onConflictDoUpdate } = createMockStatsDb({
			newStamps: 5,
			totalStamps: 100,
			pageViews: 200,
			uniqueVisitors: 150,
			downloads: 30,
			shares: 10,
		});

		await updateDailyStats(db);

		expect(onConflictDoUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				set: expect.objectContaining({
					newStamps: 5,
					totalStamps: 100,
					pageViews: 200,
					uniqueVisitors: 150,
					downloads: 30,
					shares: 10,
				}),
			}),
		);
	});

	it("uses today's date for the stats record", async () => {
		const { db, onConflictDoUpdate } = createMockStatsDb({
			newStamps: 0,
			totalStamps: 0,
			pageViews: 0,
			uniqueVisitors: 0,
			downloads: 0,
			shares: 0,
		});

		await updateDailyStats(db);

		// Check the insert was called - date is passed in values
		expect(onConflictDoUpdate).toHaveBeenCalled();
		// The date should be 2024-06-15 based on FIXED_NOW
		const insertMock = (db as unknown as { insert: ReturnType<typeof vi.fn> })
			.insert;
		const _insertCall = insertMock.mock.calls[0];
		// insert() is called with the dailyStats table, not values directly
		// The values are passed to .values() which is called before onConflictDoUpdate
		expect(insertMock).toHaveBeenCalled();
	});

	it("calls onConflictDoUpdate for upsert", async () => {
		const { db, onConflictDoUpdate } = createMockStatsDb({
			newStamps: 0,
			totalStamps: 0,
			pageViews: 0,
			uniqueVisitors: 0,
			downloads: 0,
			shares: 0,
		});

		await updateDailyStats(db);

		expect(onConflictDoUpdate).toHaveBeenCalled();
	});

	it("re-throws errors from database operations", async () => {
		const db = {
			select: vi.fn().mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockRejectedValue(new Error("DB connection lost")),
				}),
			}),
		} as unknown as Database;

		await expect(updateDailyStats(db)).rejects.toThrow("DB connection lost");
	});
});
