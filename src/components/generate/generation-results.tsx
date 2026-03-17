"use client";

import Image from "next/image";
import {
	CheckIcon,
	ClipboardIcon,
	DownloadIcon,
	HeartIcon,
} from "@/components/icons";
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
				<label className="inline-flex items-center gap-2 cursor-pointer group">
					<div className="relative">
						<input
							type="checkbox"
							checked={isPublic}
							onChange={onVisibilityChange}
							className="peer sr-only"
						/>
						<div className="w-8 h-4 bg-stone-200 rounded-full peer-checked:bg-stone-800 transition-colors" />
						<div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
					</div>
					<span className="text-xs text-stone-500">Public collection</span>
				</label>
				<p className="text-xs text-stone-400">
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
								className="absolute -top-3 -right-3 z-10 p-2 bg-white rounded-full shadow-md hover:bg-stone-50 transition-colors"
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
								className="inline-flex items-center gap-1 px-3 py-1 bg-stamp-navy text-white rounded-full text-[10px] hover:bg-stone-800 transition"
							>
								<DownloadIcon />
								Download
							</a>
							<button
								type="button"
								onClick={() =>
									onCopy(`${window.location.origin}/api/stamps/${r.id}/image`)
								}
								className="inline-flex items-center gap-1 px-3 py-1 text-stone-600 bg-white border border-stone-200 rounded-full text-[10px] hover:bg-stone-50 transition"
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
