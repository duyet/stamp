import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { events, stamps } from "@/db/schema";

export async function GET() {
	try {
		const db = getDb();

		const now = Date.now();
		const dayMs = 86_400_000;
		const todayStart = now - (now % dayMs);
		const weekStart = todayStart - 6 * dayMs;
		const monthStart = todayStart - 29 * dayMs;
		const thirtyDaysAgo = now - 30 * dayMs;

		const [
			totalStampsResult,
			stampsTodayResult,
			stampsWeekResult,
			stampsMonthResult,
			popularStylesResult,
			dailyTrendResult,
			totalPageViewsResult,
			uniqueVisitorsResult,
		] = await Promise.all([
			// Total stamps generated
			db.select({ count: sql<number>`count(*)` }).from(stamps),

			// Stamps today
			db
				.select({ count: sql<number>`count(*)` })
				.from(stamps)
				.where(sql`${stamps.createdAt} >= ${new Date(todayStart)}`),

			// Stamps this week
			db
				.select({ count: sql<number>`count(*)` })
				.from(stamps)
				.where(sql`${stamps.createdAt} >= ${new Date(weekStart)}`),

			// Stamps this month
			db
				.select({ count: sql<number>`count(*)` })
				.from(stamps)
				.where(sql`${stamps.createdAt} >= ${new Date(monthStart)}`),

			// Popular styles
			db
				.select({
					style: stamps.style,
					count: sql<number>`count(*) as count`,
				})
				.from(stamps)
				.groupBy(stamps.style)
				.orderBy(sql`count(*) desc`),

			// Generations per day (last 30 days) using unix timestamp math
			db
				.select({
					day: sql<number>`(${stamps.createdAt} / 86400000) * 86400000`,
					count: sql<number>`count(*)`,
				})
				.from(stamps)
				.where(sql`${stamps.createdAt} >= ${new Date(thirtyDaysAgo)}`)
				.groupBy(sql`(${stamps.createdAt} / 86400000) * 86400000`)
				.orderBy(sql`(${stamps.createdAt} / 86400000) * 86400000`),

			// Total page views
			db
				.select({ count: sql<number>`count(*)` })
				.from(events)
				.where(sql`${events.event} = 'page_view'`),

			// Unique visitors (distinct IPs across all events)
			db
				.select({ count: sql<number>`count(distinct ${events.userIp})` })
				.from(events)
				.where(sql`${events.userIp} is not null`),
		]);

		return NextResponse.json({
			totalStamps: totalStampsResult[0]?.count ?? 0,
			stampsToday: stampsTodayResult[0]?.count ?? 0,
			stampsThisWeek: stampsWeekResult[0]?.count ?? 0,
			stampsThisMonth: stampsMonthResult[0]?.count ?? 0,
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
		});
	} catch (error) {
		console.error("Analytics query failed:", error);
		return NextResponse.json(
			{ error: "Failed to fetch analytics" },
			{ status: 500 },
		);
	}
}
