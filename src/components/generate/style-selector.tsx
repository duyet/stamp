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
		<div className="relative group">
			{/* Left fade indicator */}
			<div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
			{/* Right fade indicator */}
			<div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none opacity-100 transition-opacity duration-300 z-10" />
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
							className={`w-14 h-14 rounded-lg transition-all duration-200 ${
								currentStyle === key
									? "ring-2 ring-gray-900 ring-offset-1 shadow-lg scale-105"
									: "opacity-50 hover:opacity-100 hover:scale-105 hover:shadow-md"
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
									? "text-gray-900 font-medium"
									: "text-gray-400 hover:text-gray-700"
							}`}
						>
							{preset.name}
						</p>
					</button>
				))}
			</div>
		</div>
	);
}
