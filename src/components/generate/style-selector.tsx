"use client";

import Image from "next/image";
import type { StampStyle } from "@/lib/stamp-prompts";
import { STAMP_STYLE_PRESETS } from "@/lib/stamp-prompts";

interface StyleSelectorProps {
	currentStyle: StampStyle;
	onStyleChange: (style: StampStyle) => void;
}

export function StyleSelector({
	currentStyle,
	onStyleChange,
}: StyleSelectorProps) {
	return (
		<div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 p-2">
			{Object.entries(STAMP_STYLE_PRESETS).map(([key, preset]) => (
				<button
					key={key}
					type="button"
					onClick={() => onStyleChange(key as StampStyle)}
					className="shrink-0 p-2 cursor-pointer transition"
					aria-label={`Select ${preset.name} style`}
					aria-pressed={currentStyle === key}
				>
					<div
						className={`w-12 h-12 rounded transition-all duration-200 ${
							currentStyle === key
								? "ring-2 ring-stone-900 dark:ring-stone-100 ring-offset-1 dark:ring-offset-stone-900 shadow-lg shadow-stamp-blue/20 scale-105"
								: "opacity-50 hover:opacity-80"
						}`}
					>
						<Image
							src={preset.thumbnail}
							alt={preset.name}
							width={48}
							height={48}
							className="object-cover w-full h-full"
							unoptimized
						/>
					</div>
					<p
						className={`text-[10px] mt-0.5 text-center transition-colors ${
							currentStyle === key
								? "text-stone-900 dark:text-stone-100 font-medium"
								: "text-stone-400 dark:text-stone-600"
						}`}
					>
						{preset.name}
					</p>
				</button>
			))}
		</div>
	);
}
