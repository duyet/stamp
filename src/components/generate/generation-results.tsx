import {
	CheckIcon,
	ClipboardIcon,
	DownloadIcon,
	HeartIcon,
} from "@/components/icons";
import { Toggle } from "@/components/toggle";
import { useFavorites } from "@/hooks/use-favorites";

interface GeneratedStamp {
	id: string;
	imageUrl: string;
	prompt: string;
}

interface GenerationResultsProps {
	results: GeneratedStamp[];
	remaining?: number;
	generationTimeMs?: number;
	copied: boolean;
	onCopy: (url: string) => void;
	onVisibilityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	isPublic: boolean;
}

export function GenerationResults({
	results,
	remaining,
	generationTimeMs,
	copied,
	onCopy,
	onVisibilityChange,
	isPublic,
}: GenerationResultsProps) {
	const { isFavorite, toggleFavorite } = useFavorites();

	return (
		<div className="mt-10 animate-form-enter">
			{/* Controls for latest stamp */}
			<div className="text-center mb-4 space-y-2">
				<div className="inline-flex">
					<Toggle
						checked={isPublic}
						onChange={(checked) =>
							onVisibilityChange({
								target: { checked: checked } as HTMLInputElement,
							} as React.ChangeEvent<HTMLInputElement>)
						}
						label="Public collection"
					/>
				</div>
				<p className="text-xs text-gray-400">
					{remaining} remaining today
					{generationTimeMs && (
						<span className="ml-1">
							· {(generationTimeMs / 1000).toFixed(1)}s
						</span>
					)}
				</p>
			</div>

			{/* Stamp grid — newest first */}
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
				{results.map((r, idx) => (
					<div
						key={r.id}
						className={`text-center ${idx === 0 ? "animate-stamp-appear" : idx === 1 ? "animate-form-enter" : ""}`}
						style={
							idx > 1
								? {
										animation: `form-enter 0.4s ease-out ${idx * 0.05}s forwards`,
										opacity: 0,
									}
								: undefined
						}
					>
						<div className="stamp-border stamp-modal-shadow inline-block relative">
							<button
								type="button"
								onClick={() => toggleFavorite(r.id)}
								className="absolute -top-3 -right-3 z-10 p-2.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
								aria-label={
									isFavorite(r.id)
										? "Remove from favorites"
										: "Add to favorites"
								}
							>
								<HeartIcon filled={isFavorite(r.id)} />
							</button>
							<img src={r.imageUrl} alt={r.prompt} className="object-cover" />
						</div>
						<div className="mt-2 flex justify-center gap-1.5">
							<a
								href={r.imageUrl}
								download={`stamp-${r.id}.png`}
								className="inline-flex items-center gap-1 px-4 py-2 bg-gray-900 text-white rounded-full text-xs hover:bg-gray-800 transition min-h-[44px]"
							>
								<DownloadIcon />
								Download
							</a>
							<button
								type="button"
								onClick={() =>
									onCopy(`${window.location.origin}/api/stamps/${r.id}/image`)
								}
								className="inline-flex items-center gap-1 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-full text-xs hover:bg-gray-50 transition min-h-[44px]"
							>
								{copied ? (
									<>
										<CheckIcon />
										Copied
									</>
								) : (
									<>
										<ClipboardIcon />
										Copy
									</>
								)}
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
