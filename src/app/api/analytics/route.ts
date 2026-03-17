import { sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { events, stamps } from "@/db/schema";
import { getAuthUserId } from "@/lib/clerk";

interface StampCountsResult {
	total_stamps: number;
	stamps_today: number;
	stamps_week: number;
	stamps_month: number;
}

export async function GET(request: NextRequest) {
	const { userId } = await getAuthUserId(request.headers);
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const db = getDb();

		// Timestamps in seconds (matching integer "created_at" column with mode: "timestamp")
		const nowSec = Math.floor(Date.now() / 1000);
		const daySec = 86_400;
		const todayStart = nowSec - (nowSec % daySec);
		const weekStart = todayStart - 6 * daySec;
		const monthStart = todayStart - 29 * daySec;
		const thirtyDaysAgo = nowSec - 30 * daySec;

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
			mapDataResult,
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

			// Map data: country codes with counts
			db
				.select({
					countryCode: stamps.locationCountry,
					count: sql<number>`count(*) as count`,
				})
				.from(stamps)
				.where(sql`${stamps.locationCountry} is not null`)
				.groupBy(stamps.locationCountry)
				.orderBy(sql`count(*) desc`),
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

		const mapData = mapDataResult.map((r) => ({
			countryCode: r.countryCode ?? "XX",
			count: r.count,
		}));

		return NextResponse.json({
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
		});
	} catch (error) {
		console.error("Analytics query failed:", error);
		return NextResponse.json(
			{ error: "Failed to fetch analytics" },
			{ status: 500 },
		);
	}
}
