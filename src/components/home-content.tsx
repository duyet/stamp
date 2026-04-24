import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/button";
import { GenerateForm } from "@/components/generate-form";
import { SectionHeading } from "@/components/section-heading";
import { StampCard } from "@/components/stamp-card";
import { StampImage } from "@/components/stamp-image";
import { StampModal } from "@/components/stamp-modal";
import { StyleFilterChips } from "@/components/style-filter-chips";
import type { PublicStamp } from "@/db/schema";
import { useStamps } from "@/hooks/use-stamps";
import { STAMP_STYLE_PRESETS, type StampStyle } from "@/lib/stamp-prompts";
import { capitalize } from "@/lib/text-utils";

const LOADING_CARD_KEYS = ["first", "second", "third"] as const;
const ALL_STYLES = "all" as const;
type HomeStyleFilter = StampStyle | typeof ALL_STYLES;

function formatStampDate(date: Date | number) {
	return new Date(date).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
}

function isStampStyle(style: string): style is StampStyle {
	return Object.hasOwn(STAMP_STYLE_PRESETS, style);
}

export function HomeContent() {
	const {
		stamps: recentStamps,
		setStamps: setRecentStamps,
		loading,
		error,
	} = useStamps(30);
	const [selectedStamp, setSelectedStamp] = useState<PublicStamp | null>(null);
	const [selectedStyle, setSelectedStyle] =
		useState<HomeStyleFilter>(ALL_STYLES);
	const [featuredStamp, ...remainingStamps] = recentStamps;
	const heroSideStamps = remainingStamps.slice(0, 4);

	const availableStyles = useMemo<StampStyle[]>(
		() => [
			...new Set(
				recentStamps
					.map((stamp) => stamp.style)
					.filter(
						(style): style is StampStyle => !!style && isStampStyle(style),
					),
			),
		],
		[recentStamps],
	);

	const filterOptions = useMemo<
		Array<{ value: HomeStyleFilter; label: string }>
	>(
		() => [
			{ value: ALL_STYLES, label: "All" },
			...availableStyles.map((style) => ({
				value: style,
				label: STAMP_STYLE_PRESETS[style].name,
			})),
		],
		[availableStyles],
	);

	const filteredStamps =
		selectedStyle === ALL_STYLES
			? recentStamps
			: recentStamps.filter((stamp) => stamp.style === selectedStyle);
	const showcaseStamps = filteredStamps.slice(0, 8);

	function handleGenerated(stamp: {
		id: string;
		imageUrl: string;
		prompt: string;
		style?: string;
		enhancedPrompt?: string;
		description?: string;
	}) {
		const newStamp: PublicStamp = {
			id: stamp.id,
			prompt: stamp.prompt,
			enhancedPrompt: stamp.enhancedPrompt ?? null,
			description: stamp.description ?? null,
			imageUrl: stamp.imageUrl,
			style: stamp.style ?? "vintage",
			isPublic: true,
			createdAt: new Date(),
		};
		setRecentStamps((prev) => [newStamp, ...prev]);
	}

	return (
		<div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
			<section className="relative pt-4 pb-8 sm:pt-6 sm:pb-10">
				<div className="paper-panel paper-grid overflow-hidden rounded-[2.3rem] px-5 py-5 sm:px-7 sm:py-7 lg:px-8 lg:py-8">
					<div className="relative grid gap-6 lg:grid-cols-[minmax(260px,0.34fr)_minmax(0,0.66fr)] lg:items-start">
						<div className="max-w-sm">
							<p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-stone-500">
								Public collections
							</p>
							<h1 className="mt-3 font-stamp text-[2.5rem] leading-[0.96] tracking-tight text-stone-950 sm:text-[3.2rem]">
								Start with the wall.
							</h1>
							<p className="mt-3 max-w-xs text-sm leading-6 text-stone-600">
								Browse recent stamps, open a favorite, then create your own.
							</p>
							<div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
								<a href="#generate">
									<Button variant="cta" className="w-full sm:w-auto">
										Create a stamp
									</Button>
								</a>
								<Link
									to="/collections"
									className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white/80 px-5 py-2.5 text-sm font-medium text-stone-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-400 hover:bg-white"
								>
									Open collections
									<span aria-hidden="true">&rarr;</span>
								</Link>
							</div>
							<p className="mt-5 text-[11px] uppercase tracking-[0.24em] text-stone-500">
								{loading
									? "Loading recent editions"
									: `${recentStamps.length} recent public stamps`}
							</p>
						</div>

						<div className="min-w-0">
							{featuredStamp ? (
								<div className="grid gap-3 sm:grid-cols-[minmax(0,1.28fr)_minmax(0,0.92fr)]">
									<div>
										<button
											type="button"
											className="group relative h-full w-full overflow-hidden rounded-[2rem] border border-stone-200/80 bg-stone-200 text-left shadow-[0_30px_80px_-52px_rgba(58,39,21,0.48)]"
											onClick={() => setSelectedStamp(featuredStamp)}
										>
											<StampImage
												src={featuredStamp.imageUrl}
												alt={featuredStamp.prompt}
												width={960}
												height={960}
												fetchPriority="high"
												className="aspect-[1.02/1] h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
											/>
											<div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(20,14,9,0.82))] px-4 py-4 text-stone-50 sm:px-5 sm:py-5">
												<div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] uppercase tracking-[0.24em] text-stone-200/85">
													<span>Latest edition</span>
													<span>
														{capitalize(featuredStamp.style || "vintage")}
													</span>
													<span>
														{formatStampDate(featuredStamp.createdAt)}
													</span>
												</div>
												<p className="mt-2 max-w-lg font-stamp text-[1.7rem] leading-tight sm:text-[2rem]">
													{featuredStamp.description || featuredStamp.prompt}
												</p>
											</div>
										</button>
									</div>

									<div className="grid grid-cols-2 gap-3">
										{heroSideStamps.map((stamp) => (
											<button
												key={stamp.id}
												type="button"
												className="group overflow-hidden rounded-[1.45rem] border border-stone-200/80 bg-stone-200 text-left shadow-[0_20px_52px_-44px_rgba(58,39,21,0.4)]"
												onClick={() => setSelectedStamp(stamp)}
											>
												<StampImage
													src={stamp.imageUrl}
													alt={stamp.prompt}
													width={320}
													height={320}
													className="aspect-square h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
												/>
											</button>
										))}
										{heroSideStamps.length === 0 && (
											<div className="col-span-2 rounded-[1.6rem] border border-dashed border-stone-300 bg-white/70 p-5 text-sm leading-6 text-stone-500">
												New public stamps will appear here as soon as they are
												generated.
											</div>
										)}
									</div>
								</div>
							) : (
								<div className="rounded-[2rem] border border-dashed border-stone-300 bg-white/70 px-6 py-12 text-center text-stone-600">
									The wall will fill with public stamps as soon as the next
									editions arrive.
								</div>
							)}
						</div>
					</div>
				</div>
			</section>

			<section className="py-4 sm:py-6">
				<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<SectionHeading
						eyebrow="Collections"
						title="Recent public editions"
						description="A compact view of the community wall, organized by style."
					/>
					<Link
						to="/collections"
						className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-950"
					>
						View the full wall &rarr;
					</Link>
				</div>

				{filterOptions.length > 1 ? (
					<StyleFilterChips<HomeStyleFilter>
						options={filterOptions}
						selectedValue={selectedStyle}
						onChange={setSelectedStyle}
						className="mt-5"
					/>
				) : null}

				{error ? (
					<div className="mt-6 rounded-[1.8rem] border border-amber-200 bg-amber-50/80 px-5 py-4 text-sm leading-6 text-amber-900">
						The public wall could not load just now. You can still make a new
						stamp below while the feed catches up.
					</div>
				) : loading && recentStamps.length === 0 ? (
					<div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						{LOADING_CARD_KEYS.map((key) => (
							<div
								key={key}
								className="animate-pulse rounded-[1.7rem] bg-white/70 p-3"
							>
								<div className="aspect-square rounded-[1.3rem] bg-stone-200/80" />
							</div>
						))}
						{LOADING_CARD_KEYS.map((key) => (
							<div
								key={`${key}-second`}
								className="animate-pulse rounded-[1.7rem] bg-white/70 p-3"
							>
								<div className="aspect-square rounded-[1.3rem] bg-stone-200/80" />
							</div>
						))}
					</div>
				) : showcaseStamps.length > 0 ? (
					<div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
						{showcaseStamps.map((stamp) => (
							<StampCard
								key={stamp.id}
								stamp={stamp}
								showDownload={false}
								onClick={() => setSelectedStamp(stamp)}
							/>
						))}
					</div>
				) : (
					<div className="mt-6 rounded-[1.8rem] border border-dashed border-stone-300 bg-white/70 px-6 py-10 text-center text-stone-500">
						No stamps are available for this style yet.
					</div>
				)}
			</section>

			<section
				id="generate"
				className="scroll-mt-20 border-t border-stone-200/80 py-10 sm:py-12"
			>
				<div className="grid gap-6 lg:grid-cols-[minmax(260px,0.34fr)_minmax(0,0.66fr)] lg:items-start">
					<SectionHeading
						eyebrow="Create"
						title="Make a new stamp"
						description="Write a prompt, add a reference image if you want, and generate the next edition."
						className="max-w-sm"
					/>

					<div className="paper-panel rounded-[2.1rem] px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
						<GenerateForm onGenerated={handleGenerated} />
					</div>
				</div>
			</section>

			{selectedStamp && (
				<StampModal
					stamp={selectedStamp}
					onClose={() => setSelectedStamp(null)}
				/>
			)}
		</div>
	);
}
