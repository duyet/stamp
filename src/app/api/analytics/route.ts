import { auth } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { events, stamps } from "@/db/schema";

export async function GET() {
	const { userId } = await auth();
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

		const [
			totalStampsResult,
			stampsTodayResult,
			stampsWeekResult,
			stampsMonthResult,
			popularStylesResult,
			dailyTrendResult,
			totalPageViewsResult,
			uniqueVisitorsResult,
			totalDownloadsResult,
			totalSharesResult,
			eventBreakdownResult,
			pageViewBreakdownResult,
		] = await Promise.all([
			db.select({ count: sql<number>`count(*)` }).from(stamps),

			db
				.select({ count: sql<number>`count(*)` })
				.from(stamps)
				.where(sql`${stamps.createdAt} >= ${todayStart}`),

			db
				.select({ count: sql<number>`count(*)` })
				.from(stamps)
				.where(sql`${stamps.createdAt} >= ${weekStart}`),

			db
				.select({ count: sql<number>`count(*)` })
				.from(stamps)
				.where(sql`${stamps.createdAt} >= ${monthStart}`),

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
		});
	} catch (error) {
		console.error("Analytics query failed:", error);
		return NextResponse.json(
			{ error: "Failed to fetch analytics" },
			{ status: 500 },
		);
	}
}
