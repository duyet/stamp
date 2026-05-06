import {
	CheckIcon,
	ClipboardIcon,
	DownloadIcon,
	HeartIcon,
} from "@/components/icons";
import { StampImage } from "@/components/stamp-image";
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
	canEditVisibility?: boolean;
}

export function GenerationResults({
	results,
	remaining,
	generationTimeMs,
	copied,
	onCopy,
	onVisibilityChange,
	isPublic,
	canEditVisibility = true,
}: GenerationResultsProps) {
	const { isFavorite, toggleFavorite } = useFavorites();
	const [featuredResult, ...archiveResults] = results;

	if (!featuredResult) {
		return null;
	}

	return (
		<section className="mt-12 animate-form-enter border-t border-stone-200/80 pt-10">
			<div className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(280px,0.92fr)] lg:items-start">
				<div>
					<div className="relative mx-auto max-w-3xl">
						{archiveResults[0] && (
							<div className="absolute left-[6%] top-8 hidden w-[30%] -rotate-[9deg] overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,#f5ede0,#efe5d5)] p-3 shadow-[0_22px_60px_-40px_rgba(58,39,21,0.45)] sm:block">
								<div className="stamp-border">
									<StampImage
										src={archiveResults[0].imageUrl}
										alt={archiveResults[0].prompt}
										width={360}
										height={360}
										className="aspect-square w-full object-cover"
									/>
								</div>
							</div>
						)}
						<div className="relative ml-auto w-full max-w-[34rem] rounded-[2.5rem] bg-[linear-gradient(180deg,rgba(255,252,246,0.92),rgba(245,236,223,0.92))] p-4 shadow-[0_42px_100px_-56px_rgba(58,39,21,0.58)] sm:p-5">
							<div className="stamp-border">
								<StampImage
									src={featuredResult.imageUrl}
									alt={featuredResult.prompt}
									width={900}
									height={900}
									className="aspect-square w-full object-cover"
								/>
							</div>
						</div>
					</div>

					<div className="mx-auto mt-6 max-w-3xl">
						<div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
							<span>Fresh print</span>
							<span className="text-stone-300">/</span>
							<span>{isPublic ? "Public edition" : "Private study"}</span>
							{generationTimeMs && (
								<>
									<span className="text-stone-300">/</span>
									<span>{(generationTimeMs / 1000).toFixed(1)}s render</span>
								</>
							)}
						</div>
						<p className="mt-3 max-w-2xl font-stamp text-3xl leading-tight text-stone-950 sm:text-[2.45rem]">
							{featuredResult.prompt}
						</p>
						<div className="mt-5 flex flex-wrap gap-2.5">
							<a
								href={featuredResult.imageUrl}
								download={`stamp-${featuredResult.id}.png`}
								className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-stone-950 px-5 py-2.5 text-sm text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-stone-800"
							>
								<DownloadIcon />
								Download print
							</a>
							<button
								type="button"
								onClick={() =>
									onCopy(
										`${window.location.origin}/api/stamps/${featuredResult.id}/image`,
									)
								}
								className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white/78 px-5 py-2.5 text-sm text-stone-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white"
							>
								{copied ? (
									<>
										<CheckIcon />
										Link copied
									</>
								) : (
									<>
										<ClipboardIcon />
										Copy image link
									</>
								)}
							</button>
							<button
								type="button"
								onClick={() => toggleFavorite(featuredResult.id)}
								className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white/70 px-5 py-2.5 text-sm text-stone-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white"
								aria-label={
									isFavorite(featuredResult.id)
										? "Remove from favorites"
										: "Add to favorites"
								}
							>
								<HeartIcon filled={isFavorite(featuredResult.id)} />
								{isFavorite(featuredResult.id) ? "Saved" : "Save"}
							</button>
						</div>
					</div>
				</div>

				<div className="space-y-5 lg:pt-8">
					<div>
						<p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
							Edition notes
						</p>
						<p className="mt-3 font-stamp text-3xl leading-tight text-stone-950">
							The newest stamp takes the wall.
						</p>
						<p className="mt-3 text-sm leading-7 text-stone-600">
							Each new generation is treated like a finished print first, with
							the rest of the run kept as smaller studies below.
						</p>
					</div>
					<div className="space-y-3 rounded-[2rem] bg-white/45 p-5">
						<div className="inline-flex">
							<Toggle
								checked={isPublic}
								onChange={(checked) =>
									onVisibilityChange({
										target: { checked: checked } as HTMLInputElement,
									} as React.ChangeEvent<HTMLInputElement>)
								}
								label="Public collection"
								disabled={!canEditVisibility}
							/>
						</div>
						<p className="text-xs leading-6 text-stone-500">
							{canEditVisibility
								? `${remaining} remaining today after this print.`
								: "Anonymous generations stay in the public collection."}
						</p>
					</div>
				</div>
			</div>

			{archiveResults.length > 0 && (
				<div className="mt-10">
					<div className="mb-4 flex items-end justify-between gap-6">
						<div>
							<p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
								Proofs
							</p>
							<p className="mt-2 text-sm leading-6 text-stone-600">
								Other fresh variations from this session.
							</p>
						</div>
					</div>
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{archiveResults.map((result, index) => (
							<div
								key={result.id}
								className="group"
								style={{
									animation: `form-enter 0.4s ease-out ${(index + 1) * 0.06}s forwards`,
									opacity: 0,
								}}
							>
								<div className="rounded-[1.8rem] bg-[linear-gradient(180deg,rgba(255,252,247,0.8),rgba(243,234,220,0.8))] p-3 transition-transform duration-300 group-hover:-translate-y-1">
									<div className="stamp-border">
										<StampImage
											src={result.imageUrl}
											alt={result.prompt}
											width={480}
											height={480}
											className="aspect-square w-full object-cover"
										/>
									</div>
								</div>
								<div className="mt-3 flex items-start justify-between gap-3">
									<p className="line-clamp-2 text-sm leading-6 text-stone-600">
										{result.prompt}
									</p>
									<button
										type="button"
										onClick={() => toggleFavorite(result.id)}
										className="mt-0.5 shrink-0 rounded-full bg-white/70 p-2 text-stone-500 transition-colors hover:bg-white hover:text-stone-800"
										aria-label={
											isFavorite(result.id)
												? "Remove from favorites"
												: "Add to favorites"
										}
									>
										<HeartIcon filled={isFavorite(result.id)} />
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</section>
	);
}
