"use client";

import Image from "next/image";
import type { Stamp } from "@/db/schema";

interface StampCardProps {
	stamp: Stamp;
	onClick?: () => void;
}

export function StampCard({ stamp, onClick }: StampCardProps) {
	const content = (
		<>
			<div className="relative aspect-square">
				<Image
					src={stamp.imageUrl}
					alt={stamp.prompt}
					fill
					sizes="(max-width: 768px) 50vw, 25vw"
					className="object-cover"
				/>
			</div>
			<div className="p-3">
				<p className="text-sm text-stone-700 truncate">{stamp.prompt}</p>
				<div className="mt-2 flex items-center justify-between">
					<span className="text-xs text-stone-500 capitalize">
						{stamp.style}
					</span>
					<a
						href={stamp.imageUrl}
						download={`stamp-${stamp.id}.png`}
						onClick={(e) => e.stopPropagation()}
						className="text-xs text-stone-500 hover:text-stone-800 transition"
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
				className="group relative text-left cursor-pointer rounded-xl overflow-hidden bg-stone-200/60 hover:bg-stone-200 transition w-full"
				onClick={onClick}
			>
				{content}
			</button>
		);
	}

	return (
		<div className="group relative rounded-xl overflow-hidden bg-stone-200/60 hover:bg-stone-200 transition">
			{content}
		</div>
	);
}
