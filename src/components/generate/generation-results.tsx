"use client";

import Image from "next/image";
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
		<div className="mt-10">
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
				<p className="text-xs text-stone-400 dark:text-stone-500">
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
						className={`text-center ${idx === 0 ? "animate-stamp-appear" : ""}`}
					>
						<div className="stamp-border stamp-modal-shadow inline-block relative">
							<button
								type="button"
								onClick={() => toggleFavorite(r.id)}
								className="absolute -top-3 -right-3 z-10 p-2.5 bg-white dark:bg-stone-800 rounded-full shadow-md hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
								aria-label={
									isFavorite(r.id)
										? "Remove from favorites"
										: "Add to favorites"
								}
							>
								<HeartIcon filled={isFavorite(r.id)} />
							</button>
							<Image
								src={r.imageUrl}
								alt={r.prompt}
								width={256}
								height={256}
								className="object-cover"
								unoptimized
							/>
						</div>
						<div className="mt-2 flex justify-center gap-1.5">
							<a
								href={r.imageUrl}
								download={`stamp-${r.id}.png`}
								className="inline-flex items-center gap-1 px-4 py-2 bg-stamp-navy text-white rounded-full text-xs hover:bg-stone-800 dark:hover:bg-stone-700 transition min-h-[44px]"
							>
								<DownloadIcon />
								Download
							</a>
							<button
								type="button"
								onClick={() =>
									onCopy(`${window.location.origin}/api/stamps/${r.id}/image`)
								}
								className="inline-flex items-center gap-1 px-4 py-2 text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full text-xs hover:bg-stone-50 dark:hover:bg-stone-700 transition min-h-[44px]"
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
