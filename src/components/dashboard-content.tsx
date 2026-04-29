import { Link } from "@tanstack/react-router";
import { memo, type ReactNode, useEffect, useState } from "react";
import { DashboardLocations } from "@/components/dashboard-locations";
import { DashboardMap } from "@/components/dashboard-map";
import { StyleShowcase } from "@/components/dashboard-style-showcase";
import { DashboardTimezoneTimeline } from "@/components/dashboard-timezone-timeline";
import { HorizontalBarChart } from "@/components/horizontal-bar-chart";
import { MetricTable } from "@/components/metric-table";
import { MetricTrendChart } from "@/components/metric-trend-chart";
import { StampGridMemo } from "@/components/stamp-grid";
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

function clampPercent(value: number, total: number): number {
	if (total <= 0) return 0;
	return Math.min(100, Math.max(0, Math.round((value / total) * 100)));
}

function formatValue(value: number | string): string {
	return typeof value === "number" ? value.toLocaleString() : value;
}

function Panel({
	children,
	className = "",
	stamp = false,
}: {
	children: ReactNode;
	className?: string;
	stamp?: boolean;
}) {
	const borderClass = stamp
		? "stamp-border border border-stone-900 bg-white"
		: "border border-stone-300 bg-white/90";
	return <div className={`${borderClass} p-5 ${className}`}>{children}</div>;
}

function SectionHeader({
	label,
	title,
	description,
}: {
	label: string;
	title: string;
	description?: string;
}) {
	return (
		<div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
					{label}
				</p>
				<h2 className="font-stamp text-2xl font-semibold text-stone-900">
					{title}
				</h2>
			</div>
			{description ? (
				<p className="max-w-lg text-sm leading-6 text-stone-600">
					{description}
				</p>
			) : null}
		</div>
	);
}

function MetricBlock({
	label,
	value,
	detail,
	accent = "border-stone-300",
}: {
	label: string;
	value: number | string;
	detail?: string;
	accent?: string;
}) {
	return (
		<div className={`border-l-2 ${accent} py-1 pl-4`}>
			<p className="text-xs font-medium uppercase tracking-wide text-stone-500">
				{label}
			</p>
			<p className="mt-2 text-3xl font-semibold leading-none text-stone-950">
				{formatValue(value)}
			</p>
			{detail ? (
				<p className="mt-2 text-xs leading-5 text-stone-500">{detail}</p>
			) : null}
		</div>
	);
}

function ProgressBar({
	value,
	total,
	className = "bg-stone-900",
}: {
	value: number;
	total: number;
	className?: string;
}) {
	return (
		<div className="h-3 overflow-hidden border border-stone-300 bg-stone-100">
			<div
				className={`h-full transition-all ${className}`}
				style={{ width: `${clampPercent(value, total)}%` }}
			/>
		</div>
	);
}

function CloudflareUsagePanel({ credits }: { credits: WorkersAiCredits }) {
	const percentUsed = clampPercent(
		credits.usedNeuronsToday,
		credits.dailyFreeNeurons,
	);
	const statusDetail =
		credits.status === "ok"
			? `${credits.remainingNeuronsToday.toLocaleString()} free neurons left, ${formatWorkersAiReset(credits.resetAt)}`
			: credits.status === "unconfigured"
				? "Cloudflare token not configured"
				: "Cloudflare usage unavailable";

	return (
		<Panel stamp className="space-y-5">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
						Cloudflare AI
					</p>
					<h3 className="mt-2 font-stamp text-2xl font-semibold text-stone-950">
						Free credit usage
					</h3>
				</div>
				<span className="border border-stone-900 px-2 py-1 text-xs font-semibold text-stone-900">
					{credits.status === "ok" ? `${percentUsed}% used` : credits.status}
				</span>
			</div>
			{credits.status === "ok" ? (
				<>
					<div>
						<div className="mb-2 flex items-baseline justify-between gap-4">
							<p className="text-sm font-medium text-stone-700">
								{credits.usedNeuronsToday.toLocaleString()} /{" "}
								{credits.dailyFreeNeurons.toLocaleString()} neurons
							</p>
							<p className="text-xs text-stone-500">
								{credits.requestsToday.toLocaleString()} requests
							</p>
						</div>
						<ProgressBar
							value={credits.usedNeuronsToday}
							total={credits.dailyFreeNeurons}
						/>
					</div>
					<p className="text-sm leading-6 text-stone-600">{statusDetail}</p>
				</>
			) : (
				<p className="text-sm leading-6 text-stone-600">{statusDetail}</p>
			)}
		</Panel>
	);
}

function CreditUsagePanel({ overview }: { overview: CreditOverview }) {
	return (
		<Panel className="space-y-5">
			<div>
				<p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
					App credits
				</p>
				<h3 className="mt-2 font-stamp text-2xl font-semibold text-stone-950">
					Daily pool
				</h3>
			</div>
			<div>
				<div className="mb-2 flex items-baseline justify-between gap-4">
					<p className="text-sm font-medium text-stone-700">
						{overview.totalDailyUsed.toLocaleString()} used
					</p>
					<p className="text-xs text-stone-500">
						{overview.totalDailyLimit.toLocaleString()} total
					</p>
				</div>
				<ProgressBar
					value={overview.totalDailyUsed}
					total={overview.totalDailyLimit}
					className="bg-emerald-800"
				/>
			</div>
			<div className="grid grid-cols-2 gap-4 border-t border-stone-200 pt-4">
				<MetricBlock label="Remaining" value={overview.totalDailyRemaining} />
				<MetricBlock label="Purchased" value={overview.purchasedCredits} />
			</div>
		</Panel>
	);
}

function MiniDistribution({
	title,
	items,
}: {
	title: string;
	items: Array<{ label: string; value: number; color: string }>;
}) {
	const total = items.reduce((sum, item) => sum + item.value, 0);
	return (
		<Panel className="space-y-4">
			<h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
				{title}
			</h3>
			<div className="flex h-4 overflow-hidden border border-stone-300 bg-stone-100">
				{items.map((item) => (
					<div
						key={item.label}
						className={item.color}
						style={{ width: `${clampPercent(item.value, total)}%` }}
						title={`${item.label}: ${item.value.toLocaleString()}`}
					/>
				))}
			</div>
			<div className="space-y-2">
				{items.map((item) => (
					<div
						key={item.label}
						className="flex items-center justify-between gap-3 text-sm"
					>
						<span className="flex min-w-0 items-center gap-2 text-stone-600">
							<span className={`h-2.5 w-2.5 shrink-0 ${item.color}`} />
							<span className="truncate">{item.label}</span>
						</span>
						<span className="font-medium tabular-nums text-stone-900">
							{item.value.toLocaleString()}
						</span>
					</div>
				))}
			</div>
		</Panel>
	);
}

function DashboardContent() {
	const [data, setData] = useState<Analytics | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loadedAt, setLoadedAt] = useState<Date | null>(null);
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
				setLoadedAt(new Date());

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
			<div className="space-y-6">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<div className="h-56 animate-pulse bg-stone-100" />
					<div className="h-56 animate-pulse bg-stone-100" />
					<div className="h-56 animate-pulse bg-stone-100" />
				</div>
				<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
					{Array.from(
						{ length: DASHBOARD.STATS_PER_ROW },
						(_, i) => `sk-${i}`,
					).map((id) => (
						<div key={id} className="h-24 animate-pulse bg-stone-100" />
					))}
				</div>
				<div className="h-72 animate-pulse bg-stone-100" />
			</div>
		);
	}

	const creditUsagePercent = formatPercent(
		data.creditOverview.totalDailyUsed,
		data.creditOverview.totalDailyLimit,
	);
	const generationCount = data.generationPerformance.generations;

	return (
		<div className="space-y-14">
			<section>
				<div className="mb-5 flex items-center justify-between gap-4">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
						Live summary
					</p>
					<p className="text-xs text-stone-500">
						{loadedAt
							? `Updated ${loadedAt.toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
								})}`
							: "Loaded"}
					</p>
				</div>
				<div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
					<Panel stamp className="lg:col-span-2">
						<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
							<MetricBlock
								label="Total stamps"
								value={data.totalStamps}
								detail={`${data.stampsToday.toLocaleString()} today`}
								accent="border-stone-900"
							/>
							<MetricBlock
								label="This week"
								value={data.stampsThisWeek}
								detail={`${data.stampsThisMonth.toLocaleString()} this month`}
								accent="border-emerald-800"
							/>
							<MetricBlock
								label="Page views"
								value={data.totalPageViews}
								detail={`${data.uniqueVisitors.toLocaleString()} visitors`}
								accent="border-sky-800"
							/>
							<MetricBlock
								label="Shares"
								value={data.totalShares}
								detail={`${data.totalDownloads.toLocaleString()} downloads`}
								accent="border-amber-800"
							/>
						</div>
					</Panel>
					<Panel stamp>
						<div className="space-y-6">
							<MetricBlock
								label="Avg generation"
								value={formatDuration(data.generationPerformance.averageMs)}
								detail={`Max ${formatDuration(data.generationPerformance.maxMs)}`}
								accent="border-stone-900"
							/>
							<div className="grid grid-cols-2 gap-4 border-t border-stone-300 pt-5">
								<MetricBlock
									label="HD"
									value={data.generationPerformance.hdGenerations}
									detail={formatPercent(
										data.generationPerformance.hdGenerations,
										generationCount,
									)}
								/>
								<MetricBlock
									label="Reference"
									value={data.generationPerformance.referenceGenerations}
									detail={formatPercent(
										data.generationPerformance.referenceGenerations,
										generationCount,
									)}
								/>
							</div>
						</div>
					</Panel>
				</div>
			</section>

			<section>
				<SectionHeader
					label="Limits"
					title="Credits and capacity"
					description="Cloudflare free-neuron usage sits beside the app credit pool and rate-limit pressure."
				/>
				<div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
					<CloudflareUsagePanel credits={data.workersAiCredits} />
					<CreditUsagePanel overview={data.creditOverview} />
					<Panel className="space-y-5">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
								Pressure
							</p>
							<h3 className="mt-2 font-stamp text-2xl font-semibold text-stone-950">
								Rate buckets
							</h3>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<MetricBlock
								label="Active"
								value={data.rateLimitOverview.totalRows}
								detail="tracked buckets"
							/>
							<MetricBlock
								label="Track max"
								value={data.rateLimitOverview.maxTrackEventCount}
								detail="events in one bucket"
							/>
						</div>
						<p className="border-t border-stone-200 pt-4 text-xs leading-5 text-stone-500">
							Daily app credits used: {creditUsagePercent} of{" "}
							{data.creditOverview.totalDailyLimit.toLocaleString()}.
						</p>
					</Panel>
				</div>
			</section>

			<section>
				<SectionHeader
					label="Trends"
					title="Growth and activity"
					description="Daily generation, engagement, and credit activity over the recent reporting window."
				/>
				<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
					<div className="xl:col-span-1">
						<MetricTrendChart
							title={`Generations per day (last ${DASHBOARD.DAILY_TREND_DAYS} days)`}
							data={data.dailyTrend}
							metrics={[
								{ key: "count", label: "Stamps", className: "bg-stone-800" },
							]}
							valueFor={(item, key) => (key === "count" ? item.count : 0)}
						/>
					</div>
					<div className="xl:col-span-2">
						<MetricTrendChart
							title="Events per day"
							data={data.eventTrend}
							metrics={[
								{
									key: "pageViews",
									label: "Views",
									className: "bg-stone-800",
								},
								{
									key: "generations",
									label: "Generations",
									className: "bg-emerald-700",
								},
								{
									key: "downloads",
									label: "Downloads",
									className: "bg-sky-700",
								},
								{ key: "shares", label: "Shares", className: "bg-amber-700" },
							]}
							valueFor={(item, key) =>
								item[key as keyof EventTrendDay] as number
							}
						/>
					</div>
					<div className="xl:col-span-3">
						<MetricTrendChart
							title="Credit transactions per day"
							data={data.creditTransactionTrend}
							metrics={[
								{
									key: "count",
									label: "Transactions",
									className: "bg-stone-800",
								},
								{
									key: "totalAmount",
									label: "Credits",
									className: "bg-emerald-700",
								},
							]}
							valueFor={(item, key) =>
								key === "totalAmount" ? Math.abs(item.totalAmount) : item.count
							}
						/>
					</div>
				</div>
			</section>

			<section>
				<SectionHeader
					label="Composition"
					title="Generation mix"
					description="How the collection is being produced, owned, and shared."
				/>
				<div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
					<MiniDistribution
						title="Stamp visibility"
						items={[
							{
								label: "Public",
								value: data.stampVisibility.public,
								color: "bg-stone-900",
							},
							{
								label: "Private",
								value: data.stampVisibility.private,
								color: "bg-stone-400",
							},
						]}
					/>
					<MiniDistribution
						title="Generation inputs"
						items={[
							{
								label: "Reference image",
								value: data.stampInputs.withReference,
								color: "bg-sky-800",
							},
							{
								label: "Text only",
								value: data.stampInputs.withoutReference,
								color: "bg-stone-500",
							},
							{
								label: "With location",
								value: data.stampInputs.withLocation,
								color: "bg-emerald-800",
							},
						]}
					/>
					<MiniDistribution
						title="Ownership"
						items={[
							{
								label: "Authenticated",
								value: data.ownership.authenticated,
								color: "bg-stone-900",
							},
							{
								label: "Anonymous",
								value: data.ownership.anonymous,
								color: "bg-amber-700",
							},
							{
								label: "Session owned",
								value: data.ownership.sessionOwned,
								color: "bg-stone-400",
							},
						]}
					/>
				</div>
			</section>

			{data.mapData.length > 0 && (
				<section>
					<SectionHeader
						label="Geography"
						title="Where stamps are being made"
						description="Country, city, and timezone activity from Cloudflare request metadata."
					/>
					<DashboardMap data={data.mapData} />
				</section>
			)}

			<section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<div>
					<SectionHeader label="Location" title="Top places" />
					<DashboardLocations data={data.locations} />
				</div>
				<div>
					<DashboardTimezoneTimeline data={data.timezones} />
				</div>
			</section>

			{styleStamps.length > 0 && (
				<section>
					<SectionHeader
						label="Styles"
						title="Style showcase"
						description="Top visual styles with one recent public stamp per style."
					/>
					<StyleShowcase styles={styleStamps} />
				</section>
			)}

			<section>
				<SectionHeader
					label="Traffic"
					title="Acquisition and behavior"
					description="The lower console keeps operational lists dense but readable."
				/>
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
					<HorizontalBarChart
						title="Browsers"
						items={data.userAgentBreakdown}
						labelWidth="w-28"
					/>
					<HorizontalBarChart
						title="Rate-limit pressure"
						items={data.rateLimitPressure}
						labelWidth="w-40"
					/>
				</div>
			</section>

			<section>
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
		<section className="py-14">
			<div className="mb-8 flex items-baseline justify-between border-t border-stone-300 pt-8">
				<h2 className="font-stamp text-3xl font-semibold text-stamp-navy">
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
