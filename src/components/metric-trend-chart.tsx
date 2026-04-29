import { formatDateShort } from "@/lib/date-utils";

interface TrendMetric {
	key: string;
	label: string;
	className: string;
}

interface MetricTrendChartProps<T extends { day: number }> {
	title: string;
	data: T[];
	metrics: TrendMetric[];
	valueFor: (item: T, key: string) => number;
	formatValue?: (value: number) => string;
	emptyLabel?: string;
}

export function MetricTrendChart<T extends { day: number }>({
	title,
	data,
	metrics,
	valueFor,
	formatValue = (value) => value.toLocaleString(),
	emptyLabel = "No trend data yet",
}: MetricTrendChartProps<T>) {
	const maxValue = Math.max(
		...data.flatMap((item) =>
			metrics.map((metric) => valueFor(item, metric.key)),
		),
		1,
	);

	return (
		<section>
			<div className="mb-4 flex items-center justify-between gap-4">
				<h2 className="text-xs font-semibold text-stone-600 uppercase tracking-[0.18em]">
					{title}
				</h2>
				<div className="flex flex-wrap justify-end gap-3">
					{metrics.map((metric) => (
						<span
							key={metric.key}
							className="inline-flex items-center gap-1.5 text-xs text-stone-500"
						>
							<span className={`h-2 w-2 rounded-full ${metric.className}`} />
							{metric.label}
						</span>
					))}
				</div>
			</div>
			<div className="border border-stone-300 bg-white/90 p-5">
				{data.length === 0 ? (
					<div className="flex h-32 items-center justify-center text-sm text-stone-400">
						{emptyLabel}
					</div>
				) : (
					<>
						<div className="flex h-40 items-end gap-1 border-b border-stone-200 pb-2">
							{data.map((item) => (
								<div
									key={item.day}
									className="flex min-w-0 flex-1 items-end justify-center gap-0.5"
									title={`${formatDateShort(item.day)}: ${metrics
										.map(
											(metric) =>
												`${metric.label} ${formatValue(valueFor(item, metric.key))}`,
										)
										.join(", ")}`}
								>
									{metrics.map((metric) => {
										const value = valueFor(item, metric.key);
										const height =
											value > 0 ? Math.max(4, (value / maxValue) * 128) : 0;
										return (
											<div
												key={metric.key}
												className={`w-full opacity-75 transition-opacity hover:opacity-100 ${metric.className}`}
												style={{ height: `${height}px` }}
											/>
										);
									})}
								</div>
							))}
						</div>
						<div className="mt-2 flex justify-between text-xs text-stone-500">
							<span>{formatDateShort(data[0].day)}</span>
							<span>{formatDateShort(data[data.length - 1].day)}</span>
						</div>
					</>
				)}
			</div>
		</section>
	);
}
