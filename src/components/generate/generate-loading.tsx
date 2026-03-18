interface GenerateLoadingProps {
	reference?: boolean;
}

/**
 * Loading state component for stamp generation.
 * Shows a spinner with context-appropriate messaging.
 */
export function GenerateLoading({ reference = false }: GenerateLoadingProps) {
	return (
		<div className="mt-6 p-6 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 animate-form-enter">
			<div className="flex items-center justify-center gap-3">
				<div className="animate-spin h-5 w-5 border-2 border-stone-900 dark:border-stone-100 border-t-transparent rounded-full" />
				<div className="text-sm text-stone-600 dark:text-stone-400">
					{reference ? "Analyzing your photo" : "Designing your stamp"}
					...
					<span className="block text-xs text-stone-400 dark:text-stone-500 mt-1">
						This takes 3-5 seconds
					</span>
				</div>
			</div>
		</div>
	);
}
