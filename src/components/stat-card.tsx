/**
 * StatCard component
 * Displays a single statistic with label and value
 * Used in dashboard and analytics views
 */

interface StatCardProps {
	/** Label describing the statistic */
	label: string;
	/** Numeric value to display */
	value: number;
}

export function StatCard({ label, value }: StatCardProps) {
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
