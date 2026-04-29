interface MetricTableColumn<T> {
	key: string;
	label: string;
	align?: "left" | "right";
	render: (item: T) => string | number;
}

interface MetricTableProps<T> {
	title: string;
	items: T[];
	columns: Array<MetricTableColumn<T>>;
	emptyLabel?: string;
	getKey: (item: T, index: number) => string;
}

export function MetricTable<T>({
	title,
	items,
	columns,
	emptyLabel = "No data yet",
	getKey,
}: MetricTableProps<T>) {
	return (
		<section>
			<h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-stone-600">
				{title}
			</h2>
			<div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
				{items.length === 0 ? (
					<div className="flex h-28 items-center justify-center text-sm text-stone-400">
						{emptyLabel}
					</div>
				) : (
					<table className="w-full text-sm">
						<thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
							<tr>
								{columns.map((column) => (
									<th
										key={column.key}
										scope="col"
										className={`px-4 py-3 font-medium ${
											column.align === "right" ? "text-right" : "text-left"
										}`}
									>
										{column.label}
									</th>
								))}
							</tr>
						</thead>
						<tbody className="divide-y divide-stone-100">
							{items.map((item, index) => (
								<tr key={getKey(item, index)}>
									{columns.map((column) => (
										<td
											key={column.key}
											className={`px-4 py-3 text-stone-700 ${
												column.align === "right"
													? "text-right tabular-nums"
													: "text-left"
											}`}
										>
											{column.render(item)}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</section>
	);
}
