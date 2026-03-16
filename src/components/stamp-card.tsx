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
				<p className="text-sm text-neutral-600 truncate">{stamp.prompt}</p>
				<div className="mt-2 flex items-center justify-between">
					<span className="text-xs bg-neutral-100 text-neutral-400 rounded-full px-2 py-0.5 capitalize">
						{stamp.style}
					</span>
					<a
						href={stamp.imageUrl}
						download={`stamp-${stamp.id}.png`}
						onClick={(e) => e.stopPropagation()}
						className="text-xs text-neutral-500 hover:text-neutral-700 transition"
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
				className="group relative text-left cursor-pointer rounded-xl overflow-hidden border border-neutral-200 hover:border-neutral-300 transition-colors w-full"
				onClick={onClick}
			>
				{content}
			</button>
		);
	}

	return (
		<div className="group relative rounded-xl overflow-hidden border border-neutral-200 hover:border-neutral-300 transition-colors">
			{content}
		</div>
	);
}
