import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/button";
import { GenerateForm } from "@/components/generate-form";
import { StampImage } from "@/components/stamp-image";
import { StampModal } from "@/components/stamp-modal";
import type { PublicStamp } from "@/db/schema";
import { useStamps } from "@/hooks/use-stamps";
import { capitalize } from "@/lib/text-utils";

const LOADING_CARD_KEYS = ["first", "second", "third"] as const;

function formatStampDate(date: Date | number) {
	return new Date(date).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
}

export function HomeContent() {
	const {
		stamps: recentStamps,
		setStamps: setRecentStamps,
		loading,
		error,
	} = useStamps(30);
	const [selectedStamp, setSelectedStamp] = useState<PublicStamp | null>(null);
	const [featuredStamp, ...remainingStamps] = recentStamps;
	const heroSideStamps = remainingStamps.slice(0, 2);
	const showcaseStamps = recentStamps.slice(0, 5);
	const spotlightStamps = recentStamps.slice(5, 8);
	const styleChips = [
		...new Set(recentStamps.map((stamp) => stamp.style || "vintage")),
	]
		.slice(0, 6)
		.map((style) => capitalize(style));

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
			<section className="relative pt-6 pb-8 sm:pt-8 sm:pb-10">
				<div className="paper-panel paper-grid overflow-hidden rounded-[2.5rem] px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
					<div className="relative grid gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(320px,1.02fr)] lg:items-center">
						<div className="max-w-2xl">
							<p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-stone-500">
								Live stamp wall
							</p>
							<h1 className="mt-5 max-w-2xl font-stamp text-5xl leading-[0.92] tracking-tight text-stone-950 sm:text-6xl lg:text-[5.25rem]">
								A homepage that starts with the stamps, not the controls.
							</h1>
							<p className="mt-5 max-w-xl text-base leading-7 text-stone-700 sm:text-lg">
								Browse the latest public editions first, open any piece for a
								closer look, then head into the studio when you are ready to
								make your own.
							</p>
							<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
								<Link
									to="/collections"
									className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white/80 px-6 py-3 text-sm font-medium text-stone-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-400 hover:bg-white"
								>
									Explore the wall
									<span aria-hidden="true">&rarr;</span>
								</Link>
								<a href="#generate">
									<Button variant="cta" size="lg" className="w-full sm:w-auto">
										Start a new edition
									</Button>
								</a>
							</div>
							<div className="mt-8 grid gap-3 sm:grid-cols-3">
								<div className="rounded-[1.4rem] border border-stone-200/80 bg-white/75 px-4 py-4">
									<p className="text-[10px] uppercase tracking-[0.26em] text-stone-500">
										Daily run
									</p>
									<p className="mt-2 font-stamp text-2xl text-stone-950">
										20 free
									</p>
									<p className="mt-1 text-sm leading-6 text-stone-600">
										New stamps each day without signing in.
									</p>
								</div>
								<div className="rounded-[1.4rem] border border-stone-200/80 bg-white/75 px-4 py-4">
									<p className="text-[10px] uppercase tracking-[0.26em] text-stone-500">
										Public wall
									</p>
									<p className="mt-2 font-stamp text-2xl text-stone-950">
										{loading ? "Loading" : `${recentStamps.length}+`}
									</p>
									<p className="mt-1 text-sm leading-6 text-stone-600">
										Recent pieces ready to open and study.
									</p>
								</div>
								<div className="rounded-[1.4rem] border border-stone-200/80 bg-white/75 px-4 py-4">
									<p className="text-[10px] uppercase tracking-[0.26em] text-stone-500">
										Inputs
									</p>
									<p className="mt-2 font-stamp text-2xl text-stone-950">
										Prompt + photo
									</p>
									<p className="mt-1 text-sm leading-6 text-stone-600">
										Reference images help guide layout and mood.
									</p>
								</div>
							</div>
							{styleChips.length > 0 && (
								<div className="mt-7 flex flex-wrap gap-2">
									{styleChips.map((style) => (
										<span
											key={style}
											className="rounded-full border border-stone-300/90 bg-white/70 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-stone-600"
										>
											{style}
										</span>
									))}
								</div>
							)}
						</div>

						<div className="min-w-0">
							{featuredStamp ? (
								<div className="space-y-4">
									<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_170px]">
										<button
											type="button"
											className="group relative overflow-hidden rounded-[2.2rem] border border-stone-200/80 bg-stone-200 text-left shadow-[0_30px_80px_-48px_rgba(58,39,21,0.58)]"
											onClick={() => setSelectedStamp(featuredStamp)}
										>
											<StampImage
												src={featuredStamp.imageUrl}
												alt={featuredStamp.prompt}
												width={960}
												height={960}
												fetchPriority="high"
												className="aspect-[1.08/1] h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
											/>
											<div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(20,14,9,0.82))] px-5 py-5 text-stone-50 sm:px-6 sm:py-6">
												<div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] uppercase tracking-[0.24em] text-stone-200/85">
													<span>Featured edition</span>
													<span>
														{capitalize(featuredStamp.style || "vintage")}
													</span>
													<span>
														{formatStampDate(featuredStamp.createdAt)}
													</span>
												</div>
												<p className="mt-3 max-w-lg font-stamp text-2xl leading-tight sm:text-[2rem]">
													{featuredStamp.description || featuredStamp.prompt}
												</p>
											</div>
										</button>

										<div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
											{heroSideStamps.map((stamp) => (
												<button
													key={stamp.id}
													type="button"
													className="group overflow-hidden rounded-[1.6rem] border border-stone-200/80 bg-stone-200 text-left shadow-[0_24px_60px_-44px_rgba(58,39,21,0.5)]"
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
												<div className="rounded-[1.6rem] border border-dashed border-stone-300 bg-white/70 p-5 text-sm leading-6 text-stone-500">
													New public stamps appear here as soon as they are
													generated.
												</div>
											)}
										</div>
									</div>

									<div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
										<div className="rounded-[1.6rem] border border-stone-200/80 bg-white/78 px-5 py-5">
											<p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">
												Curator note
											</p>
											<p className="mt-3 font-stamp text-2xl leading-tight text-stone-950">
												{featuredStamp.description || featuredStamp.prompt}
											</p>
											<p className="mt-3 text-sm leading-6 text-stone-600">
												Open the piece to inspect it full-size, then keep moving
												through the wall. The homepage now works like a small
												exhibit before it works like a tool.
											</p>
										</div>
										<div className="rounded-[1.6rem] border border-stone-200/80 bg-[#231a14] px-5 py-5 text-stone-100">
											<p className="text-[10px] uppercase tracking-[0.28em] text-stone-300">
												Next stop
											</p>
											<p className="mt-3 font-stamp text-2xl leading-tight">
												Go from showcase to studio.
											</p>
											<p className="mt-3 text-sm leading-6 text-stone-300">
												When something on the wall sparks an idea, jump straight
												into making another edition.
											</p>
											<a
												href="#generate"
												className="mt-5 inline-flex text-sm font-medium text-white transition hover:text-stone-200"
											>
												Open the generator &rarr;
											</a>
										</div>
									</div>
								</div>
							) : (
								<div className="rounded-[2rem] border border-dashed border-stone-300 bg-white/70 px-6 py-12 text-center text-stone-600">
									The showcase will fill with public stamps as soon as the next
									editions arrive.
								</div>
							)}
						</div>
					</div>
				</div>
			</section>

			<section className="py-10">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div className="max-w-2xl">
						<p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
							Stamp showcase
						</p>
						<h2 className="mt-3 font-stamp text-3xl leading-tight text-stone-950 sm:text-4xl">
							The latest public editions, arranged like a gallery wall.
						</h2>
					</div>
					<Link
						to="/collections"
						className="text-sm text-stone-600 transition-colors hover:text-stone-950"
					>
						Open the full collection &rarr;
					</Link>
				</div>

				{error ? (
					<div className="mt-6 rounded-[1.8rem] border border-amber-200 bg-amber-50/80 px-5 py-4 text-sm leading-6 text-amber-900">
						The public wall could not load just now. You can still make a new
						stamp below while the feed catches up.
					</div>
				) : loading && recentStamps.length === 0 ? (
					<div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
						<div className="animate-pulse rounded-[2rem] bg-white/70 p-3">
							<div className="aspect-[1.2/1] rounded-[1.6rem] bg-stone-200/80" />
						</div>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
							{LOADING_CARD_KEYS.map((key) => (
								<div
									key={key}
									className="animate-pulse rounded-[1.7rem] bg-white/70 p-3"
								>
									<div className="aspect-square rounded-[1.3rem] bg-stone-200/80" />
								</div>
							))}
						</div>
					</div>
				) : showcaseStamps.length > 0 ? (
					<div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
						<div className="grid gap-4">
							{showcaseStamps[0] && (
								<button
									type="button"
									className="group overflow-hidden rounded-[2rem] border border-stone-200/80 bg-stone-200 text-left shadow-[0_24px_60px_-46px_rgba(58,39,21,0.46)]"
									onClick={() => setSelectedStamp(showcaseStamps[0])}
								>
									<StampImage
										src={showcaseStamps[0].imageUrl}
										alt={showcaseStamps[0].prompt}
										width={960}
										height={720}
										loading="lazy"
										className="aspect-[1.24/1] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
									/>
									<div className="bg-white/92 px-5 py-4">
										<div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] uppercase tracking-[0.24em] text-stone-400">
											<span>
												{capitalize(showcaseStamps[0].style || "vintage")}
											</span>
											<span>
												{formatStampDate(showcaseStamps[0].createdAt)}
											</span>
										</div>
										<p className="mt-2 font-stamp text-2xl leading-tight text-stone-950">
											{showcaseStamps[0].description ||
												showcaseStamps[0].prompt}
										</p>
									</div>
								</button>
							)}

							<div className="grid gap-4 sm:grid-cols-2">
								{showcaseStamps.slice(1, 5).map((stamp) => (
									<button
										key={stamp.id}
										type="button"
										className="group overflow-hidden rounded-[1.7rem] border border-stone-200/80 bg-white/78 text-left shadow-[0_18px_50px_-42px_rgba(58,39,21,0.4)]"
										onClick={() => setSelectedStamp(stamp)}
									>
										<div className="overflow-hidden bg-stone-200">
											<StampImage
												src={stamp.imageUrl}
												alt={stamp.prompt}
												width={520}
												height={520}
												loading="lazy"
												className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
											/>
										</div>
										<div className="px-4 py-4">
											<div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] uppercase tracking-[0.24em] text-stone-400">
												<span>{capitalize(stamp.style || "vintage")}</span>
												<span>{formatStampDate(stamp.createdAt)}</span>
											</div>
											<p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-700">
												{stamp.description || stamp.prompt}
											</p>
										</div>
									</button>
								))}
							</div>
						</div>

						<div className="space-y-4">
							<div className="paper-panel rounded-[2rem] px-5 py-5">
								<p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">
									Wall notes
								</p>
								<p className="mt-3 font-stamp text-2xl leading-tight text-stone-950">
									Every prompt becomes a small collectible scene.
								</p>
								<p className="mt-3 text-sm leading-6 text-stone-600">
									The homepage is meant to feel browseable first: click into a
									piece, compare styles, then drift into the studio with better
									visual context.
								</p>
							</div>

							{spotlightStamps.map((stamp) => (
								<button
									key={`spotlight-${stamp.id}`}
									type="button"
									className="flex w-full items-center gap-4 rounded-[1.5rem] border border-stone-200/80 bg-white/80 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-300"
									onClick={() => setSelectedStamp(stamp)}
								>
									<div className="h-20 w-20 shrink-0 overflow-hidden rounded-[1.1rem] bg-stone-200">
										<StampImage
											src={stamp.imageUrl}
											alt={stamp.prompt}
											width={160}
											height={160}
											loading="lazy"
											className="h-full w-full object-cover"
										/>
									</div>
									<div className="min-w-0">
										<p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">
											{capitalize(stamp.style || "vintage")} /{" "}
											{formatStampDate(stamp.createdAt)}
										</p>
										<p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-700">
											{stamp.description || stamp.prompt}
										</p>
									</div>
								</button>
							))}
						</div>
					</div>
				) : (
					<div className="mt-6 rounded-[1.8rem] border border-dashed border-stone-300 bg-white/70 px-6 py-10 text-center text-stone-500">
						The public wall is still empty. Create the first stamp and the
						showcase will begin here.
					</div>
				)}
			</section>

			<section
				id="generate"
				className="scroll-mt-24 border-t border-stone-200/80 py-12"
			>
				<div className="grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-start">
					<div className="max-w-md">
						<p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-stone-500">
							Studio desk
						</p>
						<h2 className="mt-4 font-stamp text-4xl leading-tight text-stone-950">
							Make the next edition once the wall has done its work.
						</h2>
						<p className="mt-4 text-sm leading-7 text-stone-600">
							Keep the generator quieter and more focused: one prompt, an
							optional reference image, and a style direction strong enough to
							feel like a printed keepsake.
						</p>
						<div className="paper-panel mt-8 rounded-[1.8rem] px-5 py-5">
							<p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">
								Prompt recipe
							</p>
							<div className="mt-4 space-y-4 text-sm leading-6 text-stone-600">
								<p>Name the subject, the setting, and the print mood.</p>
								<p className="font-stamp text-xl leading-8 text-stone-900">
									“Rainy Saigon alley, scooters, amber windows, engraved blue
									ink, quiet midnight mood.”
								</p>
								<p>
									Reference images help tighten framing when you already know
									the scene.
								</p>
							</div>
						</div>
					</div>

					<div className="paper-panel rounded-[2.25rem] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
						<GenerateForm onGenerated={handleGenerated} />
					</div>
				</div>
			</section>

			<section className="border-t border-stone-200/80 py-12">
				<div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
					<div className="max-w-2xl">
						<p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
							Open edition
						</p>
						<p className="mt-3 font-stamp text-3xl leading-tight text-stone-950">
							Follow the wall when you want inspiration. Enter the studio when
							you want ownership.
						</p>
					</div>
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
						<Link
							to="/collections"
							className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white/80 px-6 py-3 text-sm font-medium text-stone-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-400 hover:bg-white"
						>
							Browse collections
							<span aria-hidden="true">&rarr;</span>
						</Link>
						<a href="#generate">
							<Button variant="cta">Create a stamp</Button>
						</a>
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
