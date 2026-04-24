import { CheckIcon } from "@/components/icons";
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
		<div>
			<div className="mb-3">
				<p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
					Style
				</p>
				<p className="mt-1 text-sm leading-6 text-stone-600">
					Choose a style before generating.
				</p>
			</div>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
				{Object.entries(STAMP_STYLE_PRESETS).map(([key, preset]) => (
					<button
						key={key}
						type="button"
						onClick={() => onStyleChange(key as StampStyle)}
						className="cursor-pointer text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/25"
						aria-label={`Select ${preset.name} style`}
						aria-pressed={currentStyle === key}
					>
						<div
							className={`relative overflow-hidden rounded-[0.9rem] border p-2 transition-all duration-200 ${
								currentStyle === key
									? "border-stone-950 bg-stone-950 text-white ring-2 ring-stone-950 ring-offset-2 ring-offset-[#fffdf9]"
									: "border-stone-200 bg-white text-stone-800 hover:-translate-y-0.5 hover:border-stone-400"
							}`}
						>
							{currentStyle === key && (
								<div className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white text-stone-950 shadow-sm">
									<CheckIcon />
								</div>
							)}
							<div className="aspect-square overflow-hidden rounded-[0.65rem] bg-stone-100">
								<StampImage
									src={preset.thumbnail}
									alt={preset.name}
									className="h-full w-full object-cover"
								/>
							</div>
							<p
								className={`mt-2 truncate text-sm font-semibold ${
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
