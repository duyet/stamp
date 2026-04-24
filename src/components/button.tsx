/**
 * Shared Button component with consistent styling variants
 */

import { LoadingSpinner } from "./loading-spinner";

const VARIANT_STYLES = {
	primary:
		"rounded-full bg-stone-950 text-white shadow-[0_16px_40px_-28px_rgba(49,31,14,0.78)] hover:-translate-y-0.5 hover:bg-stone-800 active:scale-[0.98]",
	pill: "rounded-full text-sm hover:scale-[1.03]",
	cta: "rounded-full bg-[linear-gradient(180deg,#26201a,#16110d)] text-white shadow-[0_18px_42px_-28px_rgba(49,31,14,0.8)] hover:-translate-y-0.5 hover:bg-stone-900 active:scale-[0.98]",
	ghost: "rounded-full text-stone-600 hover:bg-white/70 hover:text-stone-900",
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
		"inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30";

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
