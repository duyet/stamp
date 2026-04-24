import { Link } from "@tanstack/react-router";
import { memo } from "react";
import { StampImage } from "@/components/stamp-image";
import type { PublicStamp } from "@/db/schema";

interface StampCardProps {
	stamp: PublicStamp;
	onClick?: () => void;
	showDownload?: boolean;
}

export const StampCard = memo(function StampCard({
	stamp,
	onClick,
	showDownload = true,
}: StampCardProps) {
	const content = (
		<>
			<div className="relative overflow-hidden bg-stone-200">
				<StampImage
					src={stamp.imageUrl}
					alt={stamp.prompt}
					loading="lazy"
					className="aspect-square h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
				/>
			</div>
			<div className="px-4 py-4">
				<div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.24em] text-stone-400">
					<span className="truncate capitalize">
						{stamp.style || "vintage"}
					</span>
					{showDownload ? (
						<a
							href={stamp.imageUrl}
							download={`stamp-${stamp.id}.png`}
							onClick={(e) => e.stopPropagation()}
							className="relative z-20 text-xs normal-case tracking-normal text-stone-500 transition hover:text-stone-800"
						>
							Download
						</a>
					) : null}
				</div>
				<p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-700">
					{stamp.description || stamp.prompt}
				</p>
			</div>
		</>
	);

	if (onClick) {
		return (
			<button
				type="button"
				className="group relative w-full cursor-pointer overflow-hidden rounded-[1.6rem] border border-stone-200/80 bg-white/82 text-left shadow-[0_18px_50px_-42px_rgba(58,39,21,0.38)] transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-300"
				onClick={onClick}
			>
				{content}
			</button>
		);
	}

	return (
		<div className="group relative overflow-hidden rounded-[1.6rem] border border-stone-200/80 bg-white/82 shadow-[0_18px_50px_-42px_rgba(58,39,21,0.32)] transition hover:-translate-y-0.5 hover:border-stone-300">
			<Link
				to="/stamps/$id"
				params={{ id: stamp.id }}
				className="absolute inset-0 z-10"
				aria-label={`View stamp: ${stamp.description || stamp.prompt}`}
			/>
			{content}
		</div>
	);
});
