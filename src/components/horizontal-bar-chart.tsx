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
