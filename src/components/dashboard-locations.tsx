import type { LocationStats } from "@/types/analytics";

interface DashboardLocationsProps {
	data: LocationStats[];
}

function countryCodeToFlag(code: string): string {
	return [...code.toUpperCase()]
		.map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
		.join("");
}

/**
 * Returns a stone bar color class that fades from stone-800 (#1) down to
 * stone-400 for lower ranks. The 8-step Tailwind stone scale maps to the
 * 15-entry list cleanly: ranks 1–3 → 800, 4–6 → 700, 7–9 → 600, 10–12 → 500,
 * 13–15 → 400.
 */
function barColorClass(rank: number): string {
	if (rank <= 3) return "bg-stone-800";
	if (rank <= 6) return "bg-stone-700";
	if (rank <= 9) return "bg-stone-600";
	if (rank <= 12) return "bg-stone-500";
	return "bg-stone-400";
}

export function DashboardLocations({ data }: DashboardLocationsProps) {
	if (data.length === 0) {
		return (
			<div className="bg-white rounded-xl border border-stone-200 p-6">
				<p className="text-sm text-stone-500 text-center py-4">
					No location data yet
				</p>
			</div>
		);
	}

	const top = data.slice(0, 15);
	const maxCount = Math.max(...top.map((l) => l.count), 1);

	return (
		<div className="bg-white rounded-xl border border-stone-200 p-6">
			<div className="space-y-3">
				{top.map((location, index) => {
					const rank = index + 1;
					const barWidth = Math.max(
						2,
						Math.round((location.count / maxCount) * 100),
					);
					const label = location.city
						? `${location.country} \u2014 ${location.city}`
						: location.country;

					return (
						<div
							key={`${location.countryCode}-${location.city ?? ""}`}
							className="flex items-center gap-3"
						>
							{/* Rank */}
							<span className="w-6 text-xs text-stone-400 text-right shrink-0 tabular-nums">
								#{rank}
							</span>

							{/* Flag */}
							<span
								className="text-base leading-none shrink-0"
								aria-hidden="true"
							>
								{countryCodeToFlag(location.countryCode)}
							</span>

							{/* Location name */}
							<span className="w-36 sm:w-48 text-sm text-stone-700 truncate shrink-0">
								{label}
							</span>

							{/* Bar */}
							<div className="flex-1 bg-stone-100 rounded-full h-3 overflow-hidden min-w-0">
								<div
									className={`h-full ${barColorClass(rank)} rounded-full transition-all`}
									style={{ width: `${barWidth}%` }}
								/>
							</div>

							{/* Count and percentage */}
							<div className="flex items-center gap-2 shrink-0 text-right">
								<span className="w-10 text-sm text-stone-700 tabular-nums">
									{location.count.toLocaleString()}
								</span>
								<span className="w-10 text-xs text-stone-500 tabular-nums">
									{location.percentage.toFixed(1)}%
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
