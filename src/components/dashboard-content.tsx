"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardLocations } from "@/components/dashboard-locations";
import { DashboardMap } from "@/components/dashboard-map";
import { StyleShowcase } from "@/components/dashboard-style-showcase";
import { DashboardTimezoneTimeline } from "@/components/dashboard-timezone-timeline";
import { StampGrid } from "@/components/stamp-grid";
import type { LocationStats, MapData, TimezoneStats } from "@/types/analytics";

interface StyleCount {
	style: string;
	count: number;
}

interface DayCount {
	day: number;
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
	dailyTrend: DayCount[];
	totalPageViews: number;
	uniqueVisitors: number;
	totalDownloads: number;
	totalShares: number;
	eventBreakdown: EventCount[];
	pageViewBreakdown: PageViewCount[];
	locations: LocationWithCities[];
	timezones: TimezoneStats[];
	mapData: MapData[];
}

function formatDate(ts: number): string {
	return new Date(ts).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
}

function StatCard({ label, value }: { label: string; value: number }) {
	return (
		<div className="bg-white rounded-xl p-5 border border-stone-200">
			<p className="text-xs text-stone-600 uppercase tracking-wide mb-2">
				{label}
			</p>
			<p className="text-3xl font-bold text-stone-900">
				{value.toLocaleString()}
			</p>
		</div>
	);
}

function HorizontalBarChart({
	title,
	items,
	labelWidth = "w-20",
	formatLabel,
}: {
	title: string;
	items: Array<{ label: string; count: number }>;
	labelWidth?: string;
	formatLabel?: (val: string) => string;
}) {
	if (items.length === 0) return null;
	const maxCount = Math.max(...items.map((item) => item.count), 1);

	return (
		<section>
			<h2 className="text-xs font-medium text-stone-600 mb-4 uppercase tracking-wide">
				{title}
			</h2>
			<div className="bg-white rounded-xl border border-stone-200 p-6 space-y-3">
				{items.map((item) => {
					const label = item.label;
					const count = item.count;
					return (
						<div key={label} className="flex items-center gap-3">
							<span
								className={`${labelWidth} text-sm text-stone-700 capitalize shrink-0 truncate`}
							>
								{formatLabel ? formatLabel(label) : label}
							</span>
							<div className="flex-1 bg-stone-100 rounded-full h-4 overflow-hidden">
								<div
									className="h-full bg-stone-800 rounded-full transition-all"
									style={{
										width: `${Math.round((count / maxCount) * 100)}%`,
									}}
								/>
							</div>
							<span className="w-10 text-sm text-stone-600 text-right shrink-0">
								{count}
							</span>
						</div>
					);
				})}
			</div>
		</section>
	);
}

export function DashboardContent() {
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
						d.popularStyles.slice(0, 6).map(async (s) => {
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
					{Array.from({ length: 4 }, (_, i) => `sk-${i}`).map((id) => (
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

	const maxDayCount = Math.max(...data.dailyTrend.map((d) => d.count), 1);

	return (
		<div className="space-y-12">
			{/* Overview Stats */}
			<section>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
					<StatCard label="Total stamps" value={data.totalStamps} />
					<StatCard label="Today" value={data.stampsToday} />
					<StatCard label="This week" value={data.stampsThisWeek} />
					<StatCard label="This month" value={data.stampsThisMonth} />
				</div>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<StatCard label="Page views" value={data.totalPageViews} />
					<StatCard label="Unique visitors" value={data.uniqueVisitors} />
					<StatCard label="Downloads" value={data.totalDownloads} />
					<StatCard label="Shares & copies" value={data.totalShares} />
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
					<h2
						className="text-2xl font-semibold text-stamp-navy mb-6"
						style={{ fontFamily: "var(--font-stamp)" }}
					>
						Style Showcase
					</h2>
					<StyleShowcase styles={styleStamps} />
				</section>
			)}

			{/* Daily Trend Chart */}
			{data.dailyTrend.length > 0 && (
				<section>
					<h2 className="text-xs font-medium text-stone-600 mb-4 uppercase tracking-wide">
						Generations per day (last 30 days)
					</h2>
					<div className="bg-white rounded-xl border border-stone-200 p-6">
						<div className="flex items-end gap-1 h-32">
							{data.dailyTrend.map((d) => (
								<div
									key={d.day}
									className="flex-1 flex flex-col items-center justify-end gap-1 group"
									title={`${formatDate(d.day)}: ${d.count}`}
								>
									<div
										className="w-full bg-stone-800 rounded-t opacity-40 group-hover:opacity-80 transition-opacity"
										style={{
											height: `${Math.max(4, Math.round((d.count / maxDayCount) * 112))}px`,
										}}
									/>
								</div>
							))}
						</div>
						<div className="flex justify-between mt-2 text-xs text-stone-600">
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

			{data.pageViewBreakdown.length > 0 && (
				<HorizontalBarChart
					title="Top pages"
					items={data.pageViewBreakdown.map((p) => ({
						label: p.path,
						count: p.count,
					}))}
					labelWidth="w-32"
				/>
			)}

			{data.popularStyles.length === 0 && data.dailyTrend.length === 0 && (
				<div className="text-center text-stone-600 py-16 text-sm">
					No data yet. Generate some stamps first.
				</div>
			)}
		</div>
	);
}

export function RecentStampsSection() {
	return (
		<section className="py-12">
			<div className="flex items-baseline justify-between mb-8">
				<h2
					className="text-2xl font-semibold text-stamp-navy"
					style={{ fontFamily: "var(--font-stamp)" }}
				>
					Recent Stamps
				</h2>
				<Link
					href="/collections"
					className="text-sm text-stone-600 hover:text-stamp-navy transition-colors"
				>
					View all &rarr;
				</Link>
			</div>
			<StampGrid />
		</section>
	);
}
