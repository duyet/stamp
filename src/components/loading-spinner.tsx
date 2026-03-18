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
					fill="none"
					stroke="currentColor"
					strokeWidth={4}
					strokeLinecap="round"
					d="M4 12a8 8 0 018-8"
				/>
			</svg>
			<span className="sr-only">{label}</span>
		</>
	);
}
