/**
 * Shared Button component with consistent styling variants
 */

import { LoadingSpinner } from "./loading-spinner";

const VARIANT_STYLES = {
	primary:
		"bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 hover:-translate-y-0.5 active:scale-[0.98] button-shine-effect",
	pill: "rounded-full text-sm hover:scale-105",
	cta: "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full hover:bg-stone-800 dark:hover:bg-stone-200 hover:-translate-y-1 hover:scale-105 button-shine-effect",
	ghost:
		"text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 hover:scale-105",
} as const;

const SIZE_STYLES = {
	sm: "px-4 py-1.5 text-xs",
	md: "px-6 py-2 text-sm",
	lg: "px-8 py-3 text-base",
} as const;

export interface ButtonProps extends React.ComponentProps<"button"> {
	variant?: keyof typeof VARIANT_STYLES;
	size?: keyof typeof SIZE_STYLES;
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
		"inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed button-ripple";

	return (
		<button
			className={`${baseStyles} ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`}
			disabled={disabled || loading}
			{...props}
		>
			{loading ? <LoadingSpinner size="sm" /> : children}
		</button>
	);
}
