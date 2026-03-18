/**
 * Loading spinner component for consistent loading states
 * Default: circular spinner for inline use
 * Stamp-themed: use variant="stamp" for the decorative stamp spinner
 */

interface LoadingSpinnerProps {
	size?: "sm" | "md" | "lg";
	variant?: "default" | "stamp";
	label?: string;
	className?: string;
}

const SIZE_STYLES = {
	sm: { width: "w-4 h-4", text: "text-xs" },
	md: { width: "w-5 h-5", text: "text-sm" },
	lg: { width: "w-6 h-6", text: "text-base" },
} as const;

export function LoadingSpinner({
	size = "md",
	variant = "default",
	label = "Loading",
	className = "",
}: LoadingSpinnerProps) {
	if (variant === "stamp") {
		return (
			<div className={`stamp-spinner ${className}`} aria-hidden="true">
				<div className="stamp-spinner-outer" />
				<div className="stamp-spinner-inner" />
				<div className="stamp-spinner-center" />
				<span className="sr-only">{label}</span>
			</div>
		);
	}

	return (
		<>
			<svg
				className={`animate-spin ${SIZE_STYLES[size].width} ${className}`}
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
