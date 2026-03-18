import { sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/db";
import { getDb } from "@/db";
import { events, stamps } from "@/db/schema";
import { getAuthUserId } from "@/lib/clerk";
import { getEnv } from "@/lib/env";
import { getClientIp } from "@/lib/get-client-ip";

interface StampCountsResult {
	total_stamps: number;
	stamps_today: number;
	stamps_week: number;
	stamps_month: number;
}

// Rate limit for expensive analytics queries (10 requests per 15 minutes)
const ANALYTICS_RATE_LIMIT = 10;
const ANALYTICS_RATE_WINDOW = 15 * 60 * 1000; // 15 minutes

// Time constants for analytics calculations
const SECONDS_PER_DAY = 86_400;
const WEEK_DAYS = 7;
const MONTH_DAYS = 30;

async function checkAnalyticsRateLimit(
	db: Database,
	userIp: string,
): Promise<{ allowed: boolean; remaining: number }> {
	const now = Date.now();
	const windowStart = now - ANALYTICS_RATE_WINDOW;

	// First, try atomic UPDATE with WHERE clause
	// Only increments if current count is below limit AND window is still valid
	const updateResult = await db.$client
		.prepare(
			`UPDATE analytics_rate_limits SET generations_count = generations_count + 1 WHERE user_ip = ? AND generations_count < ? AND window_start >= ?`,
		)
		.bind(userIp, ANALYTICS_RATE_LIMIT, windowStart)
		.run();

	// Check if the UPDATE succeeded by reading the current state
	const result = await db.$client
		.prepare(
			`SELECT generations_count FROM analytics_rate_limits WHERE user_ip = ?`,
		)
		.bind(userIp)
		.first<{ generations_count: number }>();

	if (result) {
		// Existing record - check if UPDATE succeeded and window is valid
		// Use strict inequality to prevent exceeding limit by 1
		if (
			result.generations_count < ANALYTICS_RATE_LIMIT &&
			result.generations_count > 0 &&
			updateResult.meta.changes > 0
		) {
			return {
				allowed: true,
				remaining: ANALYTICS_RATE_LIMIT - result.generations_count,
			};
		}
		return { allowed: false, remaining: 0 };
	}

	// No existing record - do atomic insert
	await db.$client
		.prepare(
			`INSERT INTO analytics_rate_limits (user_ip, generations_count, window_start) VALUES (?, 1, ?)`,
		)
		.bind(userIp, now)
		.run();

	return { allowed: true, remaining: ANALYTICS_RATE_LIMIT - 1 };
}

export async function GET(request: NextRequest) {
	const env = getEnv();
	const db = getDb();

	const { userId } = await getAuthUserId(request.headers);
	const userIp = getClientIp(request.headers);

	// Require authentication
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// Simple admin allowlist - can be configured via wrangler.toml or environment variables
	// In development, allow all authenticated users for testing
	const ADMIN_USERS = new Set(
		(env.ADMIN_USERS as string | undefined)?.split(",").filter(Boolean) || [],
	);

	// In production with no admin list configured, allow all authenticated users
	const isAdmin = ADMIN_USERS.size === 0 || ADMIN_USERS.has(userId);
	if (!isAdmin) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	// Rate limit expensive analytics queries
	const { allowed, remaining: _remaining } = await checkAnalyticsRateLimit(
		db,
		userIp,
	);
	if (!allowed) {
		return NextResponse.json(
			{ error: "Rate limit exceeded. Please try again later." },
			{ status: 429 },
		);
	}

	try {
		// Timestamps in seconds (matching integer "created_at" column with mode: "timestamp")
		const nowSec = Math.floor(Date.now() / 1000);
		const todayStart = nowSec - (nowSec % SECONDS_PER_DAY);
		const weekStart = todayStart - (WEEK_DAYS - 1) * SECONDS_PER_DAY;
		const monthStart = todayStart - (MONTH_DAYS - 1) * SECONDS_PER_DAY;
		const thirtyDaysAgo = nowSec - MONTH_DAYS * SECONDS_PER_DAY;

		// Consolidated stamp count query (4 aggregations → 1 query)
		const [stampCountsResult] = (await db.all(
			sql`
				SELECT
					count(*) as total_stamps,
					count(CASE WHEN created_at >= ${todayStart} THEN 1 END) as stamps_today,
					count(CASE WHEN created_at >= ${weekStart} THEN 1 END) as stamps_week,
					count(CASE WHEN created_at >= ${monthStart} THEN 1 END) as stamps_month
				FROM stamps
			`,
		)) as [StampCountsResult];

		const [
			popularStylesResult,
			dailyTrendResult,
			totalPageViewsResult,
			uniqueVisitorsResult,
			totalDownloadsResult,
			totalSharesResult,
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

			db
				.select({
					day: sql<number>`(${stamps.createdAt} / 86400) * 86400`,
					count: sql<number>`count(*)`,
				})
				.from(stamps)
				.where(sql`${stamps.createdAt} >= ${thirtyDaysAgo}`)
				.groupBy(sql`(${stamps.createdAt} / 86400) * 86400`)
				.orderBy(sql`(${stamps.createdAt} / 86400) * 86400`),

			db
				.select({ count: sql<number>`count(*)` })
				.from(events)
				.where(sql`${events.event} = 'page_view'`),

			db
				.select({ count: sql<number>`count(distinct ${events.userIp})` })
				.from(events)
				.where(sql`${events.userIp} is not null`),

			db
				.select({ count: sql<number>`count(*)` })
				.from(events)
				.where(sql`${events.event} = 'download'`),

			db
				.select({ count: sql<number>`count(*)` })
				.from(events)
				.where(sql`${events.event} = 'copy_link' or ${events.event} = 'share'`),

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

		// Build country name map for location stats
		const countryNames: Record<string, string> = {
			US: "United States",
			GB: "United Kingdom",
			JP: "Japan",
			DE: "Germany",
			FR: "France",
			IN: "India",
			BR: "Brazil",
			AU: "Australia",
			CA: "Canada",
			CN: "China",
			KR: "South Korea",
			VN: "Vietnam",
			SG: "Singapore",
			NL: "Netherlands",
			SE: "Sweden",
			IT: "Italy",
			ES: "Spain",
			RU: "Russia",
			MX: "Mexico",
			TH: "Thailand",
			ID: "Indonesia",
			PH: "Philippines",
			MY: "Malaysia",
			TW: "Taiwan",
			HK: "Hong Kong",
			PL: "Poland",
			CH: "Switzerland",
			AT: "Austria",
			BE: "Belgium",
			IE: "Ireland",
			NO: "Norway",
			DK: "Denmark",
			FI: "Finland",
			PT: "Portugal",
			NZ: "New Zealand",
			IL: "Israel",
			AE: "UAE",
			ZA: "South Africa",
			AR: "Argentina",
			CL: "Chile",
			CO: "Colombia",
		};

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
			country: countryNames[r.countryCode ?? ""] ?? r.countryCode ?? "Unknown",
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

		return NextResponse.json(
			{
				totalStamps: (stampCountsResult?.total_stamps as number) ?? 0,
				stampsToday: (stampCountsResult?.stamps_today as number) ?? 0,
				stampsThisWeek: (stampCountsResult?.stamps_week as number) ?? 0,
				stampsThisMonth: (stampCountsResult?.stamps_month as number) ?? 0,
				popularStyles: popularStylesResult.map((r) => ({
					style: r.style ?? "vintage",
					count: r.count,
				})),
				dailyTrend: dailyTrendResult.map((r) => ({
					day: r.day,
					count: r.count,
				})),
				totalPageViews: totalPageViewsResult[0]?.count ?? 0,
				uniqueVisitors: uniqueVisitorsResult[0]?.count ?? 0,
				totalDownloads: totalDownloadsResult[0]?.count ?? 0,
				totalShares: totalSharesResult[0]?.count ?? 0,
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
			{
				headers: {
					// Cache for 5 minutes with stale-while-revalidate for 10 minutes
					// Reduces D1 query load by ~90% for cached requests
					"Cache-Control": "public, max-age=300, stale-while-revalidate=600",
				},
			},
		);
	} catch (error) {
		console.error("Analytics query failed:", error);
		return NextResponse.json(
			{ error: "Failed to fetch analytics" },
			{ status: 500 },
		);
	}
}
