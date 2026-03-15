import { sql } from "drizzle-orm";
import type { Metadata } from "next";
import { getDb } from "@/db";
import { events, stamps } from "@/db/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Dashboard — stamp.builder",
};

interface StyleCount {
	style: string;
	count: number;
}

interface DayCount {
	day: number;
	count: number;
}

async function getAnalytics() {
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
		db.select({ count: sql<number>`count(*)` }).from(stamps),

		db
			.select({ count: sql<number>`count(*)` })
			.from(stamps)
			.where(sql`${stamps.createdAt} >= ${new Date(todayStart)}`),

		db
			.select({ count: sql<number>`count(*)` })
			.from(stamps)
			.where(sql`${stamps.createdAt} >= ${new Date(weekStart)}`),

		db
			.select({ count: sql<number>`count(*)` })
			.from(stamps)
			.where(sql`${stamps.createdAt} >= ${new Date(monthStart)}`),

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
				day: sql<number>`(${stamps.createdAt} / 86400000) * 86400000`,
				count: sql<number>`count(*)`,
			})
			.from(stamps)
			.where(sql`${stamps.createdAt} >= ${new Date(thirtyDaysAgo)}`)
			.groupBy(sql`(${stamps.createdAt} / 86400000) * 86400000`)
			.orderBy(sql`(${stamps.createdAt} / 86400000) * 86400000`),

		db
			.select({ count: sql<number>`count(*)` })
			.from(events)
			.where(sql`${events.event} = 'page_view'`),

		db
			.select({ count: sql<number>`count(distinct ${events.userIp})` })
			.from(events)
			.where(sql`${events.userIp} is not null`),
	]);

	return {
		totalStamps: totalStampsResult[0]?.count ?? 0,
		stampsToday: stampsTodayResult[0]?.count ?? 0,
		stampsThisWeek: stampsWeekResult[0]?.count ?? 0,
		stampsThisMonth: stampsMonthResult[0]?.count ?? 0,
		popularStyles: popularStylesResult.map(
			(r): StyleCount => ({
				style: r.style ?? "vintage",
				count: Number(r.count),
			}),
		),
		dailyTrend: dailyTrendResult.map(
			(r): DayCount => ({
				day: Number(r.day),
				count: Number(r.count),
			}),
		),
		totalPageViews: totalPageViewsResult[0]?.count ?? 0,
		uniqueVisitors: uniqueVisitorsResult[0]?.count ?? 0,
	};
}

function formatDate(ts: number): string {
	return new Date(ts).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
}

export default async function DashboardPage() {
	const data = await getAnalytics();

	const maxStyleCount = Math.max(...data.popularStyles.map((s) => s.count), 1);
	const maxDayCount = Math.max(...data.dailyTrend.map((d) => d.count), 1);

	return (
		<div className="max-w-4xl mx-auto px-4 py-12">
			<div className="mb-10">
				<h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
				<p className="text-neutral-500 mt-1 text-sm">
					stamp.builder — internal analytics
				</p>
			</div>

			{/* Key metrics */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
				<StatCard label="Total stamps" value={data.totalStamps} />
				<StatCard label="Today" value={data.stampsToday} />
				<StatCard label="This week" value={data.stampsThisWeek} />
				<StatCard label="This month" value={data.stampsThisMonth} />
			</div>

			<div className="grid grid-cols-2 gap-4 mb-10">
				<StatCard label="Page views" value={data.totalPageViews} />
				<StatCard label="Unique visitors" value={data.uniqueVisitors} />
			</div>

			{/* Popular styles */}
			{data.popularStyles.length > 0 && (
				<section className="mb-8">
					<h2 className="text-xs font-medium text-neutral-500 mb-4 uppercase tracking-wide">
						Popular styles
					</h2>
					<div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-3">
						{data.popularStyles.map((s) => (
							<div key={s.style} className="flex items-center gap-3">
								<span className="w-20 text-sm text-neutral-600 capitalize shrink-0">
									{s.style}
								</span>
								<div className="flex-1 bg-neutral-100 rounded-full h-4 overflow-hidden">
									<div
										className="h-full bg-neutral-900 rounded-full transition-all"
										style={{
											width: `${Math.round((s.count / maxStyleCount) * 100)}%`,
										}}
									/>
								</div>
								<span className="w-10 text-sm text-neutral-400 text-right shrink-0">
									{s.count}
								</span>
							</div>
						))}
					</div>
				</section>
			)}

			{/* Daily trend */}
			{data.dailyTrend.length > 0 && (
				<section className="mb-10">
					<h2 className="text-xs font-medium text-neutral-500 mb-4 uppercase tracking-wide">
						Generations per day (last 30 days)
					</h2>
					<div className="bg-white rounded-xl border border-neutral-200 p-6">
						<div className="flex items-end gap-1 h-32">
							{data.dailyTrend.map((d) => (
								<div
									key={d.day}
									className="flex-1 flex flex-col items-center justify-end gap-1 group"
									title={`${formatDate(d.day)}: ${d.count}`}
								>
									<div
										className="w-full bg-neutral-900 rounded-t opacity-40 group-hover:opacity-80 transition-opacity"
										style={{
											height: `${Math.max(
												4,
												Math.round((d.count / maxDayCount) * 112),
											)}px`,
										}}
									/>
								</div>
							))}
						</div>
						<div className="flex justify-between mt-2 text-xs text-neutral-400">
							{data.dailyTrend.length > 0 && (
								<>
									<span>{formatDate(data.dailyTrend[0].day)}</span>
									<span>
										{formatDate(
											data.dailyTrend[data.dailyTrend.length - 1].day,
										)}
									</span>
								</>
							)}
						</div>
					</div>
				</section>
			)}

			{data.popularStyles.length === 0 && data.dailyTrend.length === 0 && (
				<div className="text-center text-neutral-400 py-16 text-sm">
					No data yet. Generate some stamps first.
				</div>
			)}
		</div>
	);
}

function StatCard({ label, value }: { label: string; value: number }) {
	return (
		<div className="bg-white rounded-xl p-5 border border-neutral-200">
			<p className="text-xs text-neutral-400 uppercase tracking-wide mb-2">
				{label}
			</p>
			<p className="text-3xl font-bold text-neutral-900">{value}</p>
		</div>
	);
}
