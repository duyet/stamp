import { SignInButton } from "@clerk/nextjs";
import { ErrorState } from "@/components/error-state";
import { DAILY_CREDIT_LIMITS } from "@/lib/constants";
import { formatCountdown } from "@/lib/date-utils";

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
	const additionalContent = isRateLimited && (
		<>
			{countdown > 0 && (
				<p className="mt-1 text-xs text-gray-500">
					Resets in {formatCountdown(countdown)}
				</p>
			)}
			{!isSignedIn && (
				<div className="mt-2 pt-2 border-t border-red-100 flex items-center justify-between">
					<p className="text-gray-600">
						Sign in for {DAILY_CREDIT_LIMITS.AUTHENTICATED} free stamps per day
					</p>
					<SignInButton mode="modal">
						<button
							type="button"
							className="px-3 py-1 bg-gray-900 text-white rounded text-xs font-medium hover:bg-gray-800 transition"
						>
							Sign in
						</button>
					</SignInButton>
				</div>
			)}
		</>
	);

	return (
		<ErrorState
			message={error}
			onRetry={onRetry}
			loading={loading}
			countdown={countdown}
			additionalContent={additionalContent}
			className="mt-4"
		/>
	);
}
