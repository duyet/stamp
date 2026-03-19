"use client";

import Image from "next/image";
import { memo } from "react";
import { HeartIcon } from "@/components/icons";
import { TiltCard } from "@/components/tilt-card";
import type { Stamp } from "@/db/schema";
import { useFavorites } from "@/hooks/use-favorites";

interface StampCardProps {
	stamp: Stamp;
	onClick?: () => void;
}

function StampCard({ stamp, onClick }: StampCardProps) {
	const { isFavorite, toggleFavorite } = useFavorites();
	const favorite = isFavorite(stamp.id);

	const content = (
		<>
			<div className="relative aspect-square">
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						toggleFavorite(stamp.id);
					}}
					className="absolute top-2 right-2 z-10 p-2.5 bg-white/90 dark:bg-stone-800/90 backdrop-blur rounded-full shadow-sm hover:bg-white dark:hover:bg-stone-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
					aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
				>
					<span className={favorite ? "animate-heart-pop" : ""}>
						<HeartIcon filled={favorite} />
					</span>
				</button>
				<Image
					src={stamp.imageUrl}
					alt={stamp.prompt}
					fill
					sizes="(max-width: 768px) 50vw, 25vw"
					className="object-cover"
					loading="lazy"
					unoptimized
				/>
			</div>
			<div className="p-3">
				<p className="text-sm text-stone-700 dark:text-stone-300 truncate">
					{stamp.description || stamp.prompt}
				</p>
				<div className="mt-2 flex items-center justify-between">
					<span className="text-xs text-stone-500 dark:text-stone-400 capitalize">
						{stamp.style}
					</span>
					<a
						href={stamp.imageUrl}
						download={`stamp-${stamp.id}.png`}
						onClick={(e) => e.stopPropagation()}
						className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stamp-blue/50 focus-visible:ring-offset-1 rounded inline-flex items-center justify-center min-h-[44px] px-2"
					>
						Download
					</a>
				</div>
			</div>
		</>
	);

	if (onClick) {
		return (
			<TiltCard
				intensity={1.2}
				className="group relative text-left cursor-pointer rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-stamp-blue/20 transition-shadow duration-300"
			>
				<button type="button" className="w-full" onClick={onClick}>
					{content}
					{/* Quick view overlay */}
					<div className="absolute inset-0 bg-gradient-to-t from-stamp-navy/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
					<div className="absolute bottom-3 left-3 right-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
						<span className="text-sm font-medium">Click to view</span>
					</div>
				</button>
			</TiltCard>
		);
	}

	return (
		<div className="group relative rounded-xl overflow-hidden transition-all duration-300 ease-out hover:shadow-xl hover:shadow-stamp-blue/10 hover:-translate-y-1 hover:scale-[1.03]">
			{content}
		</div>
	);
}

// Memoize StampCard to prevent unnecessary re-renders when favorites change
export const StampCardMemo = memo(StampCard, (prev, next) => {
	return (
		prev.stamp.id === next.stamp.id &&
		prev.stamp.imageUrl === next.stamp.imageUrl &&
		prev.stamp.isPublic === next.stamp.isPublic &&
		prev.onClick === next.onClick
	);
});
