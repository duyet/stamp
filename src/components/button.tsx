/**
 * Shared Button component with consistent styling variants
 */

export interface ButtonProps extends React.ComponentProps<"button"> {
	variant?: "primary" | "pill" | "cta" | "ghost";
	size?: "sm" | "md" | "lg";
	loading?: boolean;
}

export function Button({
	variant = "primary",
	size = "md",
	loading = false,
	className = "",
	disabled,
	children,
	...props
}: ButtonProps) {
	const baseStyles =
		"inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed";

	const variantStyles = {
		primary:
			"bg-stone-900 text-white rounded-lg hover:bg-stone-800 active:scale-[0.98]",
		pill: "rounded-full text-sm hover:scale-105",
		cta: "bg-stone-900 text-white rounded-full hover:bg-stone-800 hover:shadow-lg hover:-translate-y-0.5",
		ghost: "text-stone-600 hover:text-stone-900 hover:bg-stone-100",
	};

	const sizeStyles = {
		sm: "px-4 py-1.5 text-xs",
		md: "px-6 py-2 text-sm",
		lg: "px-8 py-3 text-base",
	};

	return (
		<button
			className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
			disabled={disabled || loading}
			{...props}
		>
			{loading ? (
				<>
					<svg
						className="animate-spin h-3.5 w-3.5"
						viewBox="0 0 24 24"
						fill="none"
						aria-hidden="true"
					>
						<title>Loading</title>
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
					<span className="sr-only">Loading</span>
				</>
			) : (
				children
			)}
		</button>
	);
}
