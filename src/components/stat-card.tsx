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
		<div className="bg-white dark:bg-stone-900 rounded-xl p-5 border border-stone-200 dark:border-stone-700">
			<p className="text-xs text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-2">
				{label}
			</p>
			<p className="text-3xl font-bold text-stone-900 dark:text-stone-100">
				{value.toLocaleString()}
			</p>
		</div>
	);
}
