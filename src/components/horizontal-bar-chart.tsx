/**
 * HorizontalBarChart component
 * Displays horizontal bar charts for analytics data
 * Supports custom label formatting and widths
 */

interface BarChartItem {
	/** Label for the bar */
	label: string;
	/** Count/value for the bar */
	count: number;
}

interface HorizontalBarChartProps {
	/** Chart title */
	title: string;
	/** Data items to display */
	items: Array<BarChartItem>;
	/** CSS width class for label column (default: w-20) */
	labelWidth?: string;
	/** Optional label formatter function */
	formatLabel?: (label: string) => string;
}

export function HorizontalBarChart({
	title,
	items,
	labelWidth = "w-20",
	formatLabel,
}: HorizontalBarChartProps) {
	if (items.length === 0) return null;
	const maxCount = Math.max(...items.map((item) => item.count), 1);

	return (
		<section>
			<h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
				{title}
			</h2>
			<div className="space-y-3 border border-stone-300 bg-white/90 p-5">
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
							<div className="h-3 flex-1 overflow-hidden border border-stone-200 bg-stone-100">
								<div
									className="h-full bg-stone-800 transition-all"
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
