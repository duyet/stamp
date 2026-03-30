import { createFileRoute } from "@tanstack/react-router";
import { desc, gte, sql } from "drizzle-orm";
import type { z } from "zod";
import type { Database } from "@/db";
import { getDb } from "@/db";
import { dailyStats, events, stamps } from "@/db/schema";
import { jsonResponse } from "@/lib/api-utils";
import { isAdmin } from "@/lib/auth";
import { getAuthUserId } from "@/lib/clerk";
import { getEnv } from "@/lib/env";
import { getClientIp } from "@/lib/get-client-ip";
import { hashIp } from "@/lib/hash-ip";
import { checkAnalyticsRateLimit } from "@/lib/rate-limit";
import { eventMetricsSchema, stampCountsSchema } from "@/lib/schemas";
import { COUNTRY_NAMES } from "@/lib/world-map-data";

// Type aliases derived from zod schemas
type StampCountsResult = z.infer<typeof stampCountsSchema>;
type EventMetricsResult = z.infer<typeof eventMetricsSchema>;
/**
 * Fetch pre-aggregated daily stats for performance optimization.
 * Returns data from daily_stats table if available, falling back to raw queries.
 *
 * Performance: Single query vs 8 parallel queries (~300ms savings for large datasets)
 *
 * @param db - Database instance
 * @param daysAgo - Number of days to fetch (default: 30 for monthly trends)
 * @returns Array of daily stats records
 */
async function getDailyStats(
	db: Database,
	daysAgo: number = 30,
): Promise<
	Array<{
		date: string;
		total_stamps: number;
		new_stamps: number;
		page_views: number;
		unique_visitors: number;
		downloads: number;
		shares: number;
	}>
> {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
	const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

	try {
		const stats = await db
			.select({
				date: dailyStats.date,
				total_stamps: sql<number>`${dailyStats.totalStamps}`,
				new_stamps: sql<number>`${dailyStats.newStamps}`,
				page_views: sql<number>`${dailyStats.pageViews}`,
				unique_visitors: sql<number>`${dailyStats.uniqueVisitors}`,
				downloads: sql<number>`${dailyStats.downloads}`,
				shares: sql<number>`${dailyStats.shares}`,
			})
			.from(dailyStats)
			.where(gte(dailyStats.date, cutoffDateStr))
			.orderBy(desc(dailyStats.date));

		if (stats.length > 0) {
			return stats;
		}
	} catch (error) {
		console.warn(
			"[Analytics] daily_stats query failed, falling back to raw queries:",
			error,
		);
	}

	return [];
}

// Time constants for analytics calculations
const SECONDS_PER_DAY = 86_400;
const WEEK_DAYS = 7;
const MONTH_DAYS = 30;

export async function GET(request: Request): Promise<Response> {
	const _env = getEnv();
	const db = getDb();

	const { userId } = await getAuthUserId();
	const rawIp = getClientIp(request.headers);
	const userIp = rawIp ? await hashIp(rawIp) : "anonymous";

	// Require authentication
	if (!userId) {
		return jsonResponse({ error: "Unauthorized" }, 401);
	}

	// Fail-closed admin check: no admin list configured = 403
	if (!isAdmin(userId)) {
		return jsonResponse({ error: "Forbidden" }, 403);
	}

	// Rate limit expensive analytics queries
	const { allowed, remaining: _remaining } = await checkAnalyticsRateLimit(
		db,
		userIp,
	);
	if (!allowed) {
		return jsonResponse(
			{ error: "Rate limit exceeded. Please try again later." },
			429,
		);
	}

	try {
		// Timestamps in seconds (matching integer "created_at" column with mode: "timestamp")
		const nowSec = Math.floor(Date.now() / 1000);
		const todayStart = nowSec - (nowSec % SECONDS_PER_DAY);
		const weekStart = todayStart - (WEEK_DAYS - 1) * SECONDS_PER_DAY;
		const monthStart = todayStart - (MONTH_DAYS - 1) * SECONDS_PER_DAY;
		const thirtyDaysAgo = nowSec - MONTH_DAYS * SECONDS_PER_DAY;

		// Try pre-aggregated daily_stats first (performance optimization: 8 queries → 1 query)
		const dailyStatsData = await getDailyStats(db, 30);

		let stampCountsResult: StampCountsResult;
		let eventMetricsResult: EventMetricsResult;
		let dailyTrendResult: Array<{ day: number; count: number }>;

		if (dailyStatsData.length > 0) {
			// Use pre-aggregated data from daily_stats table
			const latest = dailyStatsData[0];
			const todayDate = new Date().toISOString().split("T")[0];
			const today = dailyStatsData.find((s) => s.date === todayDate);
			const weekData = dailyStatsData.slice(0, WEEK_DAYS);
			const monthData = dailyStatsData.slice(0, MONTH_DAYS);

			stampCountsResult = {
				total_stamps: latest.total_stamps,
				stamps_today: today?.new_stamps ?? 0,
				stamps_week: weekData.reduce((sum, s) => sum + s.new_stamps, 0),
				stamps_month: monthData.reduce((sum, s) => sum + s.new_stamps, 0),
			};

			eventMetricsResult = {
				total_page_views: dailyStatsData.reduce(
					(sum, s) => sum + s.page_views,
					0,
				),
				total_downloads: dailyStatsData.reduce(
					(sum, s) => sum + s.downloads,
					0,
				),
				total_shares: dailyStatsData.reduce((sum, s) => sum + s.shares, 0),
			};

			// Build daily trend from daily_stats
			dailyTrendResult = dailyStatsData.map((s) => {
				const date = new Date(s.date);
				const dayTimestamp = Math.floor(date.getTime() / 1000);
				return { day: dayTimestamp, count: s.new_stamps };
			});
		} else {
			// Fallback to raw queries if daily_stats is empty (first run or migration issue)
			console.warn("[Analytics] daily_stats empty, using raw queries");

			// Consolidated stamp count query (4 aggregations → 1 query)
			const stampRows = await db.all(
				sql`
					SELECT
						count(*) as total_stamps,
						count(CASE WHEN created_at >= ${todayStart} THEN 1 END) as stamps_today,
						count(CASE WHEN created_at >= ${weekStart} THEN 1 END) as stamps_week,
						count(CASE WHEN created_at >= ${monthStart} THEN 1 END) as stamps_month
					FROM stamps
				`,
			);
			const parsedStamps = stampCountsSchema.safeParse(stampRows[0]);
			stampCountsResult = parsedStamps.success
				? parsedStamps.data
				: { total_stamps: 0, stamps_today: 0, stamps_week: 0, stamps_month: 0 };

			// Consolidated event metrics query (3 aggregations → 1 query)
			const eventRows = await db.all(
				sql`
					SELECT
						count(CASE WHEN event = 'page_view' THEN 1 END) as total_page_views,
						count(CASE WHEN event = 'download' THEN 1 END) as total_downloads,
						count(CASE WHEN event IN ('copy_link', 'share') THEN 1 END) as total_shares
					FROM events
				`,
			);
			const parsedEvents = eventMetricsSchema.safeParse(eventRows[0]);
			eventMetricsResult = parsedEvents.success
				? parsedEvents.data
				: { total_page_views: 0, total_downloads: 0, total_shares: 0 };

			// Daily trend query
			const trendData = await db
				.select({
					day: sql<number>`(${stamps.createdAt} / 86400) * 86400`,
					count: sql<number>`count(*)`,
				})
				.from(stamps)
				.where(sql`${stamps.createdAt} >= ${thirtyDaysAgo}`)
				.groupBy(sql`(${stamps.createdAt} / 86400) * 86400`)
				.orderBy(sql`(${stamps.createdAt} / 86400) * 86400`);
			dailyTrendResult = trendData as Array<{ day: number; count: number }>;
		}

		// Parallel queries for remaining analytics (not in daily_stats yet)
		const [
			popularStylesResult,
			uniqueVisitorsResult,
			eventBreakdownResult,
			pageViewBreakdownResult,
			locationCountryResult,
			locationCityResult,
			timezoneResult,
		] = await Promise.all([
			db
				.select({
					style: stamps.style,
					count: sql<number>`count(*) as count`,
				})
				.from(stamps)
				.groupBy(stamps.style)
				.orderBy(sql`count(*) desc`),

			// Use daily_stats if available, otherwise query raw
			dailyStatsData.length > 0
				? db
						.select({
							count: sql<number>`cast(sum(${dailyStats.uniqueVisitors}) as integer)`,
						})
						.from(dailyStats)
				: db
						.select({ count: sql<number>`count(distinct ${events.userIp})` })
						.from(events)
						.where(sql`${events.userIp} is not null`),

			db
				.select({
					event: events.event,
					count: sql<number>`count(*) as count`,
				})
				.from(events)
				.groupBy(events.event)
				.orderBy(sql`count(*) desc`)
				.limit(50),

			db
				.select({
					path: sql<string>`json_extract(${events.metadata}, '$.path')`,
					count: sql<number>`count(*) as count`,
				})
				.from(events)
				.where(
					sql`${events.event} = 'page_view' and json_extract(${events.metadata}, '$.path') is not null`,
				)
				.groupBy(sql`json_extract(${events.metadata}, '$.path')`)
				.orderBy(sql`count(*) desc`)
				.limit(50),

			// Location: top countries
			db
				.select({
					countryCode: stamps.locationCountry,
					count: sql<number>`count(*) as count`,
				})
				.from(stamps)
				.where(sql`${stamps.locationCountry} is not null`)
				.groupBy(stamps.locationCountry)
				.orderBy(sql`count(*) desc`)
				.limit(30),

			// Location: top cities (with country)
			db
				.select({
					countryCode: stamps.locationCountry,
					city: stamps.locationCity,
					count: sql<number>`count(*) as count`,
				})
				.from(stamps)
				.where(
					sql`${stamps.locationCity} is not null and ${stamps.locationCountry} is not null`,
				)
				.groupBy(stamps.locationCountry, stamps.locationCity)
				.orderBy(sql`count(*) desc`)
				.limit(20),

			// Timezone: activity by timezone and hour
			db
				.select({
					timezone: stamps.userTimezone,
					hour: sql<number>`cast((${stamps.createdAt} % 86400) / 3600 as integer)`,
					count: sql<number>`count(*)`,
				})
				.from(stamps)
				.where(sql`${stamps.userTimezone} is not null`)
				.groupBy(
					stamps.userTimezone,
					sql`cast((${stamps.createdAt} % 86400) / 3600 as integer)`,
				)
				.orderBy(sql`count(*) desc`)
				.limit(500),
		]);

		const totalWithLocation = locationCountryResult.reduce(
			(sum, r) => sum + r.count,
			0,
		);

		// Build timezone hourly data
		const tzMap = new Map<string, { hourly: number[]; total: number }>();
		for (const row of timezoneResult) {
			if (!row.timezone) continue;
			if (!tzMap.has(row.timezone)) {
				tzMap.set(row.timezone, { hourly: new Array(24).fill(0), total: 0 });
			}
			const entry = tzMap.get(row.timezone);
			if (!entry) continue;
			const h = Math.min(23, Math.max(0, row.hour));
			entry.hourly[h] += row.count;
			entry.total += row.count;
		}
		const timezones = [...tzMap.entries()]
			.sort((a, b) => b[1].total - a[1].total)
			.slice(0, 10)
			.map(([tz, data]) => ({
				timezone: tz,
				hourlyData: data.hourly,
				total: data.total,
			}));

		// Build location stats (merging country + city data)
		const locations = locationCountryResult.map((r) => ({
			country: COUNTRY_NAMES[r.countryCode ?? ""] ?? r.countryCode ?? "Unknown",
			countryCode: r.countryCode ?? "XX",
			count: r.count,
			percentage:
				totalWithLocation > 0
					? Math.round((r.count / totalWithLocation) * 100)
					: 0,
			topCities: locationCityResult
				.filter((c) => c.countryCode === r.countryCode)
				.slice(0, 3)
				.map((c) => ({ city: c.city ?? "Unknown", count: c.count })),
		}));

		const mapData = locationCountryResult.map((r) => ({
			countryCode: r.countryCode ?? "XX",
			count: r.count,
		}));

		return jsonResponse(
			{
				totalStamps: stampCountsResult.total_stamps,
				stampsToday: stampCountsResult.stamps_today,
				stampsThisWeek: stampCountsResult.stamps_week,
				stampsThisMonth: stampCountsResult.stamps_month,
				popularStyles: popularStylesResult.map((r) => ({
					style: r.style ?? "vintage",
					count: r.count,
				})),
				dailyTrend: dailyTrendResult,
				totalPageViews: eventMetricsResult.total_page_views,
				uniqueVisitors: uniqueVisitorsResult[0]?.count ?? 0,
				totalDownloads: eventMetricsResult.total_downloads,
				totalShares: eventMetricsResult.total_shares,
				eventBreakdown: eventBreakdownResult.map((r) => ({
					event: r.event,
					count: r.count,
				})),
				pageViewBreakdown: pageViewBreakdownResult.map((r) => ({
					path: r.path,
					count: r.count,
				})),
				locations,
				timezones,
				mapData,
			},
			200,
			{
				// Private cache — admin-only endpoint, public would bypass auth at CDN edge
				"Cache-Control": "private, max-age=300, stale-while-revalidate=600",
				// Enable Brotli compression (handled by CF Workers)
				Vary: "Accept-Encoding",
			},
		);
	} catch (error) {
		console.error("Analytics query failed:", error);
		return jsonResponse({ error: "Failed to fetch analytics" }, 500);
	}
}

export const Route = createFileRoute("/api/analytics")({
	server: {
		handlers: {
			GET: ({ request }) => GET(request),
		},
	},
});
