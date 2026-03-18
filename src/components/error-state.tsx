/**
 * ErrorState component
 * Reusable error display with retry button
 * Supports rate limit countdown and sign-in prompts
 */

interface ErrorStateProps {
	/** Error message to display */
	message: string;
	/** Optional callback for retry action */
	onRetry?: () => void;
	/** Loading state for retry button */
	loading?: boolean;
	/** Countdown for rate-limited actions */
	countdown?: number;
	/** Optional additional content to display below error */
	additionalContent?: React.ReactNode;
	/** CSS class name for custom styling */
	className?: string;
}

export function ErrorState({
	message,
	onRetry,
	loading = false,
	countdown = 0,
	additionalContent,
	className = "",
}: ErrorStateProps) {
	const disabled = loading || countdown > 0;

	return (
		<div
			role="alert"
			aria-live="polite"
			className={`p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="flex-1">
					<p className="text-sm text-red-700 dark:text-red-400 font-medium">
						{message}
					</p>
					{additionalContent}
				</div>
				{onRetry && (
					<button
						type="button"
						onClick={onRetry}
						className="shrink-0 px-3 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-medium rounded hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={disabled}
					>
						{loading ? "Retrying..." : countdown > 0 ? "Wait..." : "Try again"}
					</button>
				)}
			</div>
		</div>
	);
}
