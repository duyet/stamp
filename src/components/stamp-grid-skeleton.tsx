import { nanoid } from "nanoid";

/**
 * Loading skeleton for stamp grid.
 * Used during data fetching to provide visual feedback.
 */
interface StampGridSkeletonProps {
	count?: number;
	className?: string;
}

export function StampGridSkeleton({
	count = 8,
	className = "",
}: StampGridSkeletonProps) {
	return (
		<div
			className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}
			aria-hidden="true"
			role="presentation"
		>
			{Array.from({ length: count }, () => (
				<div
					key={nanoid()}
					className="aspect-square rounded-xl bg-stone-100 animate-shimmer"
					role="presentation"
				/>
			))}
		</div>
	);
}
