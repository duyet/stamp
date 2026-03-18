import { SignInButton } from "@clerk/nextjs";

interface GenerateErrorProps {
	error: string;
	isRateLimited: boolean;
	countdown: number;
	isSignedIn: boolean | undefined;
	onRetry: () => void;
	loading: boolean;
}

/**
 * Error state component for stamp generation failures.
 * Shows error message with retry button and optional countdown timer.
 */
export function GenerateError({
	error,
	isRateLimited,
	countdown,
	isSignedIn,
	onRetry,
	loading,
}: GenerateErrorProps) {
	// Format countdown as MM:SS
	function formatCountdown(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	}

	return (
		<div
			role="alert"
			aria-live="polite"
			className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
		>
			<div className="flex items-start justify-between gap-3">
				<div className="flex-1">
					<p className="text-sm text-red-700 font-medium">{error}</p>
					{isRateLimited && countdown > 0 && (
						<p className="mt-1 text-xs text-stone-500">
							Resets in {formatCountdown(countdown)}
						</p>
					)}
					{isRateLimited && !isSignedIn && (
						<div className="mt-2 pt-2 border-t border-red-100 flex items-center justify-between">
							<p className="text-stone-600">
								Sign in for 100 free stamps per day
							</p>
							<SignInButton mode="modal">
								<button
									type="button"
									className="px-3 py-1 bg-stone-900 text-white rounded text-xs font-medium hover:bg-stone-800 transition"
								>
									Sign in
								</button>
							</SignInButton>
						</div>
					)}
				</div>
				<button
					type="button"
					onClick={() => onRetry()}
					className="shrink-0 px-3 py-1.5 bg-stone-900 text-white text-xs font-medium rounded hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={loading || countdown > 0}
				>
					{loading ? "Retrying..." : countdown > 0 ? "Wait..." : "Try again"}
				</button>
			</div>
		</div>
	);
}
