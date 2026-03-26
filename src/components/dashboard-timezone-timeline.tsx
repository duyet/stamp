import { useEffect, useRef, useState } from "react";
import type { TimezoneStats } from "@/types/analytics";

interface DashboardTimezoneTimelineProps {
	data: TimezoneStats[];
}

/** "Asia/Tokyo" → "Tokyo", "America/New_York" → "New York", "UTC" → "UTC" */
function abbreviateTimezone(tz: string): string {
	const slash = tz.lastIndexOf("/");
	if (slash === -1) return tz;
	return tz.slice(slash + 1).replace(/_/g, " ");
}

/**
 * Map a count to a Tailwind bg class using the stone palette.
 * Thresholds are relative to the global max across the entire dataset.
 */
function intensityClass(count: number, max: number): string {
	if (count === 0 || max === 0) return "bg-stone-50";
	const ratio = count / max;
	if (ratio < 0.15) return "bg-stone-200";
	if (ratio < 0.4) return "bg-stone-400";
	if (ratio < 0.7) return "bg-stone-600";
	return "bg-stone-800";
}

/** Hour labels shown on the top axis (every 3 hours). */
const AXIS_HOURS = new Set([0, 3, 6, 9, 12, 15, 18, 21]);

/** Fixed 24-hour array — values are the actual hour numbers (0–23), not indices. */
const HOURS_24: number[] = Array.from({ length: 24 }, (_, h) => h);

/** Legend colour + label pairs. */
const LEGEND_CELLS = [
	{ cls: "bg-stone-50 border border-stone-200", label: "zero" },
	{ cls: "bg-stone-200", label: "low" },
	{ cls: "bg-stone-400", label: "medium" },
	{ cls: "bg-stone-600", label: "high" },
	{ cls: "bg-stone-800", label: "max" },
];

interface TooltipState {
	visible: boolean;
	x: number;
	y: number;
	label: string;
}

export function DashboardTimezoneTimeline({
	data,
}: DashboardTimezoneTimelineProps) {
	const [currentHour, setCurrentHour] = useState<number>(() =>
		new Date().getHours(),
	);
	const [tooltip, setTooltip] = useState<TooltipState>({
		visible: false,
		x: 0,
		y: 0,
		label: "",
	});
	const wrapperRef = useRef<HTMLDivElement>(null);

	// Refresh the "Now" indicator every minute.
	useEffect(() => {
		const id = setInterval(() => setCurrentHour(new Date().getHours()), 60_000);
		return () => clearInterval(id);
	}, []);

	if (data.length === 0) {
		return (
			<div className="bg-white rounded-xl border border-stone-200 p-6">
				<p className="text-xs text-stone-600 uppercase tracking-wide mb-4">
					Activity by timezone
				</p>
				<div className="flex items-center justify-center py-10">
					<p className="text-sm text-stone-400">No timezone data yet</p>
				</div>
			</div>
		);
	}

	// Sort by total descending, cap at 10 rows.
	const rows = [...data].sort((a, b) => b.total - a.total).slice(0, 10);

	// Global max for consistent colour scaling.
	const globalMax = rows.reduce((m, row) => {
		const rowMax = Math.max(...row.hourlyData);
		return Math.max(m, rowMax);
	}, 0);

	function handleCellMouseEnter(
		e: React.MouseEvent<HTMLTableCellElement>,
		tz: string,
		hour: number,
		count: number,
	) {
		if (!wrapperRef.current) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const containerRect = wrapperRef.current.getBoundingClientRect();
		const tzLabel = abbreviateTimezone(tz);
		const hourLabel = `${String(hour).padStart(2, "0")}:00`;
		setTooltip({
			visible: true,
			x: rect.left - containerRect.left + rect.width / 2,
			y: rect.top - containerRect.top - 8,
			label: `${tzLabel}, ${hourLabel} — ${count} stamp${count !== 1 ? "s" : ""}`,
		});
	}

	function handleCellMouseLeave() {
		setTooltip((prev) => ({ ...prev, visible: false }));
	}

	return (
		<div className="bg-white rounded-xl border border-stone-200 p-6">
			<p className="text-xs text-stone-600 uppercase tracking-wide mb-4">
				Activity by timezone
			</p>

			{/* Horizontally scrollable on mobile */}
			<div className="overflow-x-auto">
				<div ref={wrapperRef} className="relative inline-block">
					<table className="border-separate border-spacing-0.5 table-fixed">
						<thead>
							<tr>
								{/* Empty corner cell above the timezone label column */}
								<th className="w-20" scope="col" />

								{/* Hour header cells — "Now" label floats above current hour */}
								{HOURS_24.map((h) => (
									<th
										key={`th-h${h}`}
										scope="col"
										className="w-4 p-0 text-center align-bottom relative"
									>
										{h === currentHour && (
											<span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-medium text-stone-500 whitespace-nowrap leading-none">
												Now
											</span>
										)}
										<span
											className={`text-xs text-stone-500 leading-none ${AXIS_HOURS.has(h) ? "visible" : "invisible"}`}
										>
											{h}
										</span>
									</th>
								))}
							</tr>
						</thead>

						<tbody>
							{rows.map((row) => {
								const tzLabel = abbreviateTimezone(row.timezone);
								return (
									<tr key={row.timezone}>
										{/* Left axis label */}
										<td
											className="text-xs text-stone-600 truncate text-right pr-2 align-middle py-0"
											title={row.timezone}
										>
											{tzLabel}
										</td>

										{/* 24 heatmap cells — title provides tooltip fallback */}
										{HOURS_24.map((hour) => {
											const count = row.hourlyData[hour] ?? 0;
											const cellTitle = `${tzLabel}, ${String(hour).padStart(2, "0")}:00 — ${count} stamp${count !== 1 ? "s" : ""}`;
											return (
												<td
													key={`${row.timezone}-h${hour}`}
													title={cellTitle}
													className={`w-4 h-4 rounded-sm cursor-default transition-opacity hover:opacity-80 ${intensityClass(count, globalMax)} ${hour === currentHour ? "outline outline-1 outline-stone-400" : ""}`}
													onMouseEnter={(e) =>
														handleCellMouseEnter(e, row.timezone, hour, count)
													}
													onMouseLeave={handleCellMouseLeave}
												/>
											);
										})}
									</tr>
								);
							})}
						</tbody>
					</table>

					{/* Hover tooltip */}
					{tooltip.visible && (
						<div
							className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-full"
							style={{ left: tooltip.x, top: tooltip.y }}
						>
							<div className="bg-stone-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
								{tooltip.label}
							</div>
							{/* Caret */}
							<div className="flex justify-center">
								<div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-stone-900" />
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Legend */}
			<div className="flex items-center gap-2 mt-4 pt-3 border-t border-stone-100">
				<span className="text-xs text-stone-500">Less</span>
				{LEGEND_CELLS.map(({ cls, label }) => (
					<div
						key={label}
						title={label}
						className={`w-4 h-4 rounded-sm ${cls}`}
					/>
				))}
				<span className="text-xs text-stone-500">More</span>
			</div>
		</div>
	);
}
