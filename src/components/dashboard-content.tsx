"use client";

import { useEffect, useState } from "react";

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
			<p className="text-3xl font-bold text-stone-900">{value}</p>
		</div>
	);
}

export function DashboardContent() {
	const [data, setData] = useState<Analytics | null>(null);

	useEffect(() => {
		async function load() {
			try {
				const r = await fetch("/api/analytics");
				const d = (await r.json()) as Analytics;
				setData(d);
			} catch {}
		}
		load();
	}, []);

	if (!data) {
		return (
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{Array.from({ length: 4 }, (_, i) => `sk-${i}`).map((id) => (
					<div
						key={id}
						className="h-24 rounded-xl bg-stone-100 animate-pulse"
					/>
				))}
			</div>
		);
	}

	const maxStyleCount = Math.max(...data.popularStyles.map((s) => s.count), 1);
	const maxDayCount = Math.max(...data.dailyTrend.map((d) => d.count), 1);
	const maxEventCount = Math.max(...data.eventBreakdown.map((e) => e.count), 1);
	const maxPageViewCount = Math.max(
		...data.pageViewBreakdown.map((p) => p.count),
		1,
	);

	return (
		<>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
				<StatCard label="Total stamps" value={data.totalStamps} />
				<StatCard label="Today" value={data.stampsToday} />
				<StatCard label="This week" value={data.stampsThisWeek} />
				<StatCard label="This month" value={data.stampsThisMonth} />
			</div>

			<div className="grid grid-cols-2 gap-4 mb-8">
				<StatCard label="Page views" value={data.totalPageViews} />
				<StatCard label="Unique visitors" value={data.uniqueVisitors} />
			</div>

			<div className="grid grid-cols-2 gap-4 mb-10">
				<StatCard label="Downloads" value={data.totalDownloads} />
				<StatCard label="Link copies" value={data.totalShares} />
			</div>

			{data.popularStyles.length > 0 && (
				<section className="mb-8">
					<h2 className="text-xs font-medium text-stone-600 mb-4 uppercase tracking-wide">
						Popular styles
					</h2>
					<div className="bg-white rounded-xl border border-stone-200 p-6 space-y-3">
						{data.popularStyles.map((s) => (
							<div key={s.style} className="flex items-center gap-3">
								<span className="w-20 text-sm text-stone-700 capitalize shrink-0">
									{s.style}
								</span>
								<div className="flex-1 bg-stone-100 rounded-full h-4 overflow-hidden">
									<div
										className="h-full bg-stone-800 rounded-full transition-all"
										style={{
											width: `${Math.round((s.count / maxStyleCount) * 100)}%`,
										}}
									/>
								</div>
								<span className="w-10 text-sm text-stone-600 text-right shrink-0">
									{s.count}
								</span>
							</div>
						))}
					</div>
				</section>
			)}

			{data.eventBreakdown.length > 0 && (
				<section className="mb-8">
					<h2 className="text-xs font-medium text-stone-600 mb-4 uppercase tracking-wide">
						Event breakdown
					</h2>
					<div className="bg-white rounded-xl border border-stone-200 p-6 space-y-3">
						{data.eventBreakdown.map((e) => (
							<div key={e.event} className="flex items-center gap-3">
								<span className="w-24 text-sm text-stone-700 shrink-0">
									{e.event.replace(/_/g, " ")}
								</span>
								<div className="flex-1 bg-stone-100 rounded-full h-4 overflow-hidden">
									<div
										className="h-full bg-stone-800 rounded-full transition-all"
										style={{
											width: `${Math.round((e.count / maxEventCount) * 100)}%`,
										}}
									/>
								</div>
								<span className="w-10 text-sm text-stone-600 text-right shrink-0">
									{e.count}
								</span>
							</div>
						))}
					</div>
				</section>
			)}

			{data.pageViewBreakdown.length > 0 && (
				<section className="mb-8">
					<h2 className="text-xs font-medium text-stone-600 mb-4 uppercase tracking-wide">
						Top pages
					</h2>
					<div className="bg-white rounded-xl border border-stone-200 p-6 space-y-3">
						{data.pageViewBreakdown.map((p) => (
							<div key={p.path} className="flex items-center gap-3">
								<span className="w-32 text-sm text-stone-700 truncate shrink-0">
									{p.path}
								</span>
								<div className="flex-1 bg-stone-100 rounded-full h-4 overflow-hidden">
									<div
										className="h-full bg-stone-800 rounded-full transition-all"
										style={{
											width: `${Math.round((p.count / maxPageViewCount) * 100)}%`,
										}}
									/>
								</div>
								<span className="w-10 text-sm text-stone-600 text-right shrink-0">
									{p.count}
								</span>
							</div>
						))}
					</div>
				</section>
			)}

			{data.dailyTrend.length > 0 && (
				<section className="mb-10">
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

			{data.popularStyles.length === 0 && data.dailyTrend.length === 0 && (
				<div className="text-center text-stone-600 py-16 text-sm">
					No data yet. Generate some stamps first.
				</div>
			)}
		</>
	);
}
