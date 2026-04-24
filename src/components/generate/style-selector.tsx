import { StampImage } from "@/components/stamp-image";
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
		<div className="group relative p-1">
			<div className="mb-3">
				<p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-stone-500">
					Style shelf
				</p>
				<p className="mt-1 text-sm text-stone-600">
					Choose a style before generating.
				</p>
			</div>
			<div className="pointer-events-none absolute top-[4.8rem] bottom-4 left-1 z-10 w-8 bg-gradient-to-r from-[rgba(246,241,231,0.95)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
			<div className="pointer-events-none absolute top-[4.8rem] right-1 bottom-4 z-10 w-8 bg-gradient-to-l from-[rgba(246,241,231,0.95)] to-transparent opacity-100 transition-opacity duration-300" />
			<div className="flex gap-3 overflow-x-auto p-1 pb-2 scrollbar-hide">
				{Object.entries(STAMP_STYLE_PRESETS).map(([key, preset]) => (
					<button
						key={key}
						type="button"
						onClick={() => onStyleChange(key as StampStyle)}
						className="shrink-0 cursor-pointer text-left transition"
						aria-label={`Select ${preset.name} style`}
						aria-pressed={currentStyle === key}
					>
						<div
							className={`w-[88px] rounded-[1.1rem] p-2 transition-all duration-200 ${
								currentStyle === key
									? "scale-[1.02] bg-stone-950 text-white shadow-[0_18px_30px_-24px_rgba(33,25,17,0.85)]"
									: "bg-[linear-gradient(180deg,#fff,#f5eee2)] text-stone-700 hover:-translate-y-0.5"
							}`}
						>
							<div className="h-[72px] overflow-hidden rounded-[0.9rem] bg-white">
								<StampImage
									src={preset.thumbnail}
									alt={preset.name}
									className="h-full w-full object-cover"
								/>
							</div>
							<p
								className={`mt-2 text-[11px] font-medium tracking-tight ${
									currentStyle === key ? "text-white" : "text-stone-700"
								}`}
							>
								{preset.name}
							</p>
						</div>
					</button>
				))}
			</div>
		</div>
	);
}
