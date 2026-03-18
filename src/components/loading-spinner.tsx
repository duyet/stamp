/**
 * Loading spinner component for consistent loading states
 */

interface LoadingSpinnerProps {
	size?: "sm" | "md";
	label?: string;
	className?: string;
}

const SIZE_STYLES = {
	sm: "h-3.5 w-3.5",
	md: "h-5 w-5",
} as const;

export function LoadingSpinner({
	size = "md",
	label = "Loading",
	className = "",
}: LoadingSpinnerProps) {
	return (
		<>
			<svg
				className={`animate-spin ${SIZE_STYLES[size]} ${className}`}
				viewBox="0 0 24 24"
				fill="none"
				aria-hidden="true"
			>
				<title>{label}</title>
				<circle
					className="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					strokeWidth={4}
				/>
				<path
					className="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 8 2.627 8 5.92v10.16c0 3.293 2.627 6 5.92 6h5.086c3.355 0 6.082-2.627 6.082-6V12c0-3.293-2.627-6-5.92-6h-4zm2 8a2 2 0 100-4 2 2v4a2 2 0 002 2h4a2 2 0 002-2v-4z"
				/>
			</svg>
			<span className="sr-only">{label}</span>
		</>
	);
}
