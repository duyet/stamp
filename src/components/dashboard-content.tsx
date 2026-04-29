import { Link } from "@tanstack/react-router";
import { memo, useEffect, useState } from "react";
import { DashboardLocations } from "@/components/dashboard-locations";
import { DashboardMap } from "@/components/dashboard-map";
import { StyleShowcase } from "@/components/dashboard-style-showcase";
import { DashboardTimezoneTimeline } from "@/components/dashboard-timezone-timeline";
import { HorizontalBarChart } from "@/components/horizontal-bar-chart";
import { MetricTable } from "@/components/metric-table";
import { MetricTrendChart } from "@/components/metric-trend-chart";
import { StampGridMemo } from "@/components/stamp-grid";
import { StatCard } from "@/components/stat-card";
import { DASHBOARD } from "@/lib/constants";
import type {
	CountItem,
	CreditOverview,
	CreditTransactionTrendDay,
	DailyStampCount,
	EventTrendDay,
	LocationStats,
	MapData,
	RateLimitOverview,
	TimezoneStats,
	WorkersAiCredits,
} from "@/types/analytics";

interface StyleCount {
	style: string;
	count: number;
}

interface EventCount {
	event: string;
	count: number;
}

interface PageViewCount {
	path: string;
	count: number;
}

interface LocationCity {
	city: string;
	count: number;
}

interface LocationWithCities extends LocationStats {
	topCities: LocationCity[];
}

interface Analytics {
	totalStamps: number;
	stampsToday: number;
	stampsThisWeek: number;
	stampsThisMonth: number;
	popularStyles: StyleCount[];
	dailyTrend: DailyStampCount[];
	totalPageViews: number;
	uniqueVisitors: number;
	totalDownloads: number;
	totalShares: number;
	eventBreakdown: EventCount[];
	pageViewBreakdown: PageViewCount[];
	locations: LocationWithCities[];
	timezones: TimezoneStats[];
	mapData: MapData[];
	stampVisibility: {
		public: number;
		private: number;
		publicPercentage: number;
	};
	stampInputs: {
		withReference: number;
		withoutReference: number;
		withDescription: number;
		withLocation: number;
	};
	ownership: {
		authenticated: number;
		anonymous: number;
		sessionOwned: number;
		distinctUsers: number;
	};
	referrerBreakdown: CountItem[];
	userAgentBreakdown: CountItem[];
	eventTrend: EventTrendDay[];
	generationPerformance: {
		generations: number;
		averageMs: number;
		maxMs: number;
		averagePromptLength: number;
		hdGenerations: number;
		referenceGenerations: number;
	};
	creditOverview: CreditOverview;
	creditTransactionBreakdown: Array<{
		type: string;
		count: number;
		totalAmount: number;
	}>;
	creditTransactionTrend: CreditTransactionTrendDay[];
	rateLimitOverview: RateLimitOverview;
	rateLimitPressure: CountItem[];
	workersAiCredits: WorkersAiCredits;
}

function formatDuration(ms: number): string {
	if (ms <= 0) return "0 ms";
	if (ms < 1000) return `${ms.toLocaleString()} ms`;
	return `${(ms / 1000).toFixed(1)} s`;
}

function formatPercent(value: number, total: number): string {
	if (total <= 0) return "0%";
	return `${Math.round((value / total) * 100)}%`;
}

function formatWorkersAiReset(resetAt: string): string {
	const date = new Date(resetAt);
	if (Number.isNaN(date.getTime())) return "resets 00:00 UTC";
	return `resets ${date.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		timeZoneName: "short",
	})}`;
}

function DashboardContent() {
	const [data, setData] = useState<Analytics | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [styleStamps, setStyleStamps] = useState<
		Array<{
			style: string;
			count: number;
			featuredStamp?: {
				id: string;
				imageUrl: string;
				prompt: string;
				description: string | null;
			};
		}>
	>([]);

	useEffect(() => {
		async function load() {
			try {
				const r = await fetch("/api/analytics");
				if (!r.ok) {
					setError("Failed to load analytics");
					return;
				}
				const d = (await r.json()) as Analytics;
				setData(d);

				// Fetch one featured stamp per style for the showcase
				if (d.popularStyles.length > 0) {
					const styleData = await Promise.all(
						d.popularStyles
							.slice(0, DASHBOARD.POPULAR_STYLES_LIMIT)
							.map(async (s) => {
								try {
									const stampRes = await fetch(
										`/api/stamps?style=${encodeURIComponent(s.style)}&limit=1`,
									);
									if (stampRes.ok) {
										const stamps = (await stampRes.json()) as Array<{
											id: string;
											imageUrl: string;
											prompt: string;
											description: string | null;
										}>;
										return {
											style: s.style,
											count: s.count,
											featuredStamp: stamps[0] ?? undefined,
										};
									}
								} catch {
									/* ignore */
								}
								return { style: s.style, count: s.count };
							}),
					);
					setStyleStamps(styleData);
				}
			} catch (err) {
				console.error("Failed to fetch analytics:", err);
				setError("Failed to load analytics");
			}
		}
		load();
	}, []);

	if (error) {
		return (
			<div className="text-center text-stone-600 py-16 text-sm">{error}</div>
		);
	}

	if (!data) {
		return (
			<div className="space-y-8">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{Array.from(
						{ length: DASHBOARD.STATS_PER_ROW },
						(_, i) => `sk-${i}`,
					).map((id) => (
						<div
							key={id}
							className="h-24 rounded-xl bg-stone-100 animate-pulse"
						/>
					))}
				</div>
				<div className="h-64 rounded-xl bg-stone-100 animate-pulse" />
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="h-48 rounded-xl bg-stone-100 animate-pulse" />
					<div className="h-48 rounded-xl bg-stone-100 animate-pulse" />
				</div>
			</div>
		);
	}

	const creditUsagePercent = formatPercent(
		data.creditOverview.totalDailyUsed,
		data.creditOverview.totalDailyLimit,
	);
	const workersAiDetail =
		data.workersAiCredits.status === "ok"
			? `${data.workersAiCredits.usedNeuronsToday.toLocaleString()} used of ${data.workersAiCredits.dailyFreeNeurons.toLocaleString()} today`
			: data.workersAiCredits.status === "unconfigured"
				? "Cloudflare token not configured"
				: "Cloudflare usage unavailable";
	const workersAiValue =
		data.workersAiCredits.status === "ok"
			? data.workersAiCredits.remainingNeuronsToday
			: "Unavailable";

	return (
		<div className="space-y-12">
			<section>
				<h2 className="text-xs font-medium text-stone-600 mb-4 uppercase tracking-wide">
					Growth
				</h2>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
					<StatCard label="Total stamps" value={data.totalStamps} />
					<StatCard label="Today" value={data.stampsToday} />
					<StatCard label="This week" value={data.stampsThisWeek} />
					<StatCard label="This month" value={data.stampsThisMonth} />
				</div>
			</section>

			<section>
				<h2 className="text-xs font-medium text-stone-600 mb-4 uppercase tracking-wide">
					Traffic & engagement
				</h2>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<StatCard label="Page views" value={data.totalPageViews} />
					<StatCard label="Unique visitors" value={data.uniqueVisitors} />
					<StatCard label="Downloads" value={data.totalDownloads} />
					<StatCard label="Shares & copies" value={data.totalShares} />
				</div>
			</section>

			<section>
				<h2 className="text-xs font-medium text-stone-600 mb-4 uppercase tracking-wide">
					Generation quality
				</h2>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<StatCard
						label="Avg generation"
						value={formatDuration(data.generationPerformance.averageMs)}
						detail={`Max ${formatDuration(data.generationPerformance.maxMs)}`}
					/>
					<StatCard
						label="Avg prompt length"
						value={data.generationPerformance.averagePromptLength}
					/>
					<StatCard
						label="HD generations"
						value={data.generationPerformance.hdGenerations}
						detail={formatPercent(
							data.generationPerformance.hdGenerations,
							data.generationPerformance.generations,
						)}
					/>
					<StatCard
						label="Reference images"
						value={data.generationPerformance.referenceGenerations}
						detail={formatPercent(
							data.generationPerformance.referenceGenerations,
							data.generationPerformance.generations,
						)}
					/>
				</div>
			</section>

			<section>
				<h2 className="text-xs font-medium text-stone-600 mb-4 uppercase tracking-wide">
					Credits & limits
				</h2>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<StatCard
						label="CF AI free left"
						value={workersAiValue}
						detail={
							data.workersAiCredits.status === "ok"
								? `${workersAiDetail}, ${formatWorkersAiReset(data.workersAiCredits.resetAt)}`
								: workersAiDetail
						}
					/>
					<StatCard
						label="Credit users"
						value={data.creditOverview.users}
						detail={`${data.creditOverview.usersWithPurchasedCredits.toLocaleString()} with purchased credits`}
					/>
					<StatCard
						label="Daily credits used"
						value={data.creditOverview.totalDailyUsed}
						detail={`${creditUsagePercent} of ${data.creditOverview.totalDailyLimit.toLocaleString()}`}
					/>
					<StatCard
						label="Active limit buckets"
						value={data.rateLimitOverview.totalRows}
						detail={`Track max ${data.rateLimitOverview.maxTrackEventCount.toLocaleString()}`}
					/>
				</div>
			</section>

			{/* World Map */}
			{data.mapData.length > 0 && (
				<section>
					<DashboardMap data={data.mapData} />
				</section>
			)}

			{/* Location & Timezone side by side */}
			<section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div>
					<h2 className="text-xs font-medium text-stone-600 mb-4 uppercase tracking-wide">
						Top locations
					</h2>
					<DashboardLocations data={data.locations} />
				</div>
				<div>
					<DashboardTimezoneTimeline data={data.timezones} />
				</div>
			</section>

			{/* Style Showcase */}
			{styleStamps.length > 0 && (
				<section>
					<h2 className="text-2xl font-semibold text-stamp-navy mb-6 font-stamp">
						Style Showcase
					</h2>
					<StyleShowcase styles={styleStamps} />
				</section>
			)}

			<MetricTrendChart
				title={`Generations per day (last ${DASHBOARD.DAILY_TREND_DAYS} days)`}
				data={data.dailyTrend}
				metrics={[{ key: "count", label: "Stamps", className: "bg-stone-800" }]}
				valueFor={(item, key) => (key === "count" ? item.count : 0)}
			/>

			<MetricTrendChart
				title="Events per day"
				data={data.eventTrend}
				metrics={[
					{ key: "pageViews", label: "Views", className: "bg-stone-800" },
					{
						key: "generations",
						label: "Generations",
						className: "bg-emerald-700",
					},
					{ key: "downloads", label: "Downloads", className: "bg-sky-700" },
					{ key: "shares", label: "Shares", className: "bg-amber-700" },
				]}
				valueFor={(item, key) => item[key as keyof EventTrendDay] as number}
			/>

			<MetricTrendChart
				title="Credit transactions per day"
				data={data.creditTransactionTrend}
				metrics={[
					{ key: "count", label: "Transactions", className: "bg-stone-800" },
					{ key: "totalAmount", label: "Credits", className: "bg-emerald-700" },
				]}
				valueFor={(item, key) =>
					key === "totalAmount" ? Math.abs(item.totalAmount) : item.count
				}
			/>

			<section className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<HorizontalBarChart
					title="Visibility"
					items={[
						{ label: "Public", count: data.stampVisibility.public },
						{ label: "Private", count: data.stampVisibility.private },
					]}
				/>
				<HorizontalBarChart
					title="Ownership"
					items={[
						{ label: "Authenticated", count: data.ownership.authenticated },
						{ label: "Anonymous", count: data.ownership.anonymous },
						{ label: "Session owned", count: data.ownership.sessionOwned },
						{ label: "Distinct users", count: data.ownership.distinctUsers },
					]}
					labelWidth="w-32"
				/>
			</section>

			<section className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<HorizontalBarChart
					title="Stamp inputs"
					items={[
						{ label: "Reference", count: data.stampInputs.withReference },
						{ label: "No reference", count: data.stampInputs.withoutReference },
						{ label: "Description", count: data.stampInputs.withDescription },
						{ label: "Location", count: data.stampInputs.withLocation },
					]}
					labelWidth="w-32"
				/>
				<HorizontalBarChart
					title="Browsers"
					items={data.userAgentBreakdown}
					labelWidth="w-28"
				/>
			</section>

			{/* Detailed Charts Grid */}
			<section className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<HorizontalBarChart
					title="Popular styles"
					items={data.popularStyles.map((s) => ({
						label: s.style,
						count: s.count,
					}))}
				/>
				<HorizontalBarChart
					title="Event breakdown"
					items={data.eventBreakdown.map((e) => ({
						label: e.event,
						count: e.count,
					}))}
					labelWidth="w-24"
					formatLabel={(v) => v.replace(/_/g, " ")}
				/>
			</section>

			<section className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<HorizontalBarChart
					title="Top pages"
					items={data.pageViewBreakdown.map((p) => ({
						label: p.path,
						count: p.count,
					}))}
					labelWidth="w-32"
				/>
				<HorizontalBarChart
					title="Referrers"
					items={data.referrerBreakdown}
					labelWidth="w-32"
				/>
			</section>

			<section className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<HorizontalBarChart
					title="Rate-limit pressure"
					items={data.rateLimitPressure}
					labelWidth="w-40"
				/>
				<MetricTable
					title="Credit transactions"
					items={data.creditTransactionBreakdown}
					getKey={(item) => item.type}
					columns={[
						{
							key: "type",
							label: "Type",
							render: (item) => item.type.replace(/_/g, " "),
						},
						{
							key: "count",
							label: "Count",
							align: "right",
							render: (item) => item.count.toLocaleString(),
						},
						{
							key: "amount",
							label: "Credits",
							align: "right",
							render: (item) => item.totalAmount.toLocaleString(),
						},
					]}
				/>
			</section>

			{data.popularStyles.length === 0 && data.dailyTrend.length === 0 && (
				<div className="text-center py-20">
					<div className="max-w-md mx-auto">
						{/* Empty state illustration */}
						<div className="mb-6 relative inline-block">
							<div className="w-20 h-20 mx-auto relative opacity-30">
								<div className="absolute inset-0 border-4 border-dashed border-stone-300 rounded-lg transform rotate-3" />
								<div className="absolute inset-2 bg-stone-100 rounded flex items-center justify-center">
									<span className="text-3xl" role="img" aria-label="Empty">
										📊
									</span>
								</div>
							</div>
						</div>
						<p className="text-stone-700 mb-2 text-base font-medium">
							No analytics yet
						</p>
						<p className="text-sm text-stone-500 mb-6">
							Generate some stamps to see insights and trends appear here.
						</p>
						<button
							type="button"
							onClick={() => (window.location.href = "/generate")}
							className="px-6 py-3 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 active:scale-[0.98] transition-all duration-200"
						>
							Create your first stamp
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

// Memoize DashboardContent to prevent unnecessary re-renders
// Only re-renders when analytics data changes
export const DashboardContentMemo = memo(function DashboardContentMemo() {
	return <DashboardContent />;
});

export function RecentStampsSection() {
	return (
		<section className="py-12">
			<div className="flex items-baseline justify-between mb-8">
				<h2 className="text-2xl font-semibold text-stamp-navy font-stamp">
					Recent Stamps
				</h2>
				<Link
					to="/collections"
					className="text-sm text-stone-600 hover:text-stamp-navy transition-colors"
				>
					View all &rarr;
				</Link>
			</div>
			<StampGridMemo />
		</section>
	);
}
