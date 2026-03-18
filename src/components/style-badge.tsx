/**
 * Reusable style badge component.
 * Displays stamp style in a consistent pill format across the app.
 */
interface StyleBadgeProps {
	style: string;
	variant?: "default" | "compact";
	className?: string;
}

const sizeClasses = {
	default: "text-[11px] px-3 py-0.5",
	compact: "text-[10px] px-2 py-0.5",
} as const;

export function StyleBadge({
	style,
	variant = "default",
	className = "",
}: StyleBadgeProps) {
	return (
		<span
			className={`inline-block tracking-wider uppercase text-stone-600 dark:text-stone-400 bg-stone-100/80 dark:bg-stone-800/50 rounded-full ${sizeClasses[variant]} ${className}`}
		>
			{style}
		</span>
	);
}
