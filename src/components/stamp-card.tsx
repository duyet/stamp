import { memo } from "react";
import { StampImage } from "@/components/stamp-image";
import type { Stamp } from "@/db/schema";
import { TEXT_COLORS } from "@/lib/constants";

interface StampCardProps {
	stamp: Stamp;
	onClick?: () => void;
}

export const StampCard = memo(function StampCard({
	stamp,
	onClick,
}: StampCardProps) {
	const content = (
		<>
			<div className="stamp-border group-hover:scale-105 transition-transform duration-200">
				<div className="relative aspect-square">
					<StampImage
						src={stamp.imageUrl}
						alt={stamp.prompt}
						loading="lazy"
						className="object-cover w-full h-full absolute inset-0"
					/>
				</div>
			</div>
			<div className="p-3">
				<p className={`text-sm ${TEXT_COLORS.dark} truncate`}>
					{stamp.description || stamp.prompt}
				</p>
				<div className="mt-2 flex items-center justify-between">
					<span className={`text-xs ${TEXT_COLORS.muted} capitalize`}>
						{stamp.style}
					</span>
					<a
						href={stamp.imageUrl}
						download={`stamp-${stamp.id}.png`}
						onClick={(e) => e.stopPropagation()}
						className={`text-xs ${TEXT_COLORS.muted} hover:text-gray-800 dark:hover:text-gray-200 transition`}
					>
						Download
					</a>
				</div>
			</div>
		</>
	);

	if (onClick) {
		return (
			<button
				type="button"
				className="group relative text-left cursor-pointer rounded-xl overflow-hidden transition w-full"
				onClick={onClick}
			>
				{content}
			</button>
		);
	}

	return (
		<div className="group relative rounded-xl overflow-hidden transition">
			{content}
		</div>
	);
});
