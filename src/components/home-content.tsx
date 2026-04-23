import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/button";
import { GenerateForm } from "@/components/generate-form";
import { StampImage } from "@/components/stamp-image";
import { StampModal } from "@/components/stamp-modal";
import type { PublicStamp } from "@/db/schema";
import { useStamps } from "@/hooks/use-stamps";

export function HomeContent() {
	const { stamps: recentStamps, setStamps: setRecentStamps } = useStamps(30);
	const [selectedStamp, setSelectedStamp] = useState<PublicStamp | null>(null);
	const [featuredStamp, ...supportingStamps] = recentStamps;
	const heroStamps = supportingStamps.slice(0, 4);

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
		<div className="mx-auto max-w-6xl px-4 pb-18 sm:px-6 lg:px-8">
			<section className="relative pt-6 pb-10 sm:pt-8">
				<div className="pointer-events-none absolute inset-x-10 top-4 h-40 bg-[radial-gradient(circle_at_top,rgba(109,79,47,0.14),transparent_68%)] blur-2xl" />
				<div className="grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(340px,0.98fr)] lg:items-end">
					<div className="order-2 max-w-2xl lg:order-1">
						<p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">
							Public showcase
						</p>
						<h1 className="mt-5 max-w-xl font-stamp text-5xl leading-[0.93] tracking-tight text-stone-950 sm:text-6xl lg:text-7xl">
							Design collectible stamps from a single prompt.
						</h1>
						<p className="mt-5 max-w-xl text-base leading-7 text-stone-700 sm:text-lg">
							Turn travel memories, mascots, city scenes, and fictional places
							into tactile postage art. The homepage now leads with the work
							itself instead of UI chrome, so the newest public stamps become
							the first thing you feel.
						</p>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
							<a href="#generate">
								<Button variant="cta" size="lg" className="w-full sm:w-auto">
									Start a new stamp
								</Button>
							</a>
							<Link
								to="/collections"
								className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white/80 px-6 py-3 text-sm font-medium text-stone-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-400 hover:bg-white"
							>
								Browse collections
								<span aria-hidden="true">&rarr;</span>
							</Link>
						</div>
						<div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-stone-600">
							<span>20 free stamps each day</span>
							<span className="text-stone-400">/</span>
							<span>Public gallery cleaned to live images only</span>
							<span className="text-stone-400">/</span>
							<span>Reference images supported</span>
						</div>
					</div>

					<div className="order-1 lg:order-2">
						{featuredStamp ? (
							<div className="relative mx-auto w-full max-w-[560px]">
								<button
									type="button"
									className="group relative block w-full text-left"
									onClick={() => setSelectedStamp(featuredStamp)}
								>
									<div className="relative mx-auto aspect-[1/1] w-[min(100%,420px)] overflow-hidden rounded-[2.6rem] bg-stone-200 shadow-[0_36px_90px_-42px_rgba(58,39,21,0.58)]">
										<StampImage
											src={featuredStamp.imageUrl}
											alt={featuredStamp.prompt}
											width={720}
											height={720}
											fetchPriority="high"
											className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
										/>
										<div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(18,14,11,0.72))] px-6 py-6 text-stone-50">
											<p className="text-[10px] uppercase tracking-[0.24em] text-stone-200/80">
												Latest public stamp
											</p>
											<p className="mt-2 max-w-sm font-stamp text-2xl leading-tight">
												{featuredStamp.description || featuredStamp.prompt}
											</p>
										</div>
									</div>
								</button>
								{heroStamps[0] && (
									<button
										type="button"
										className="absolute -left-2 top-[7%] hidden w-[120px] rotate-[-10deg] overflow-hidden rounded-[1.5rem] shadow-[0_24px_45px_-32px_rgba(58,39,21,0.55)] md:block"
										onClick={() => setSelectedStamp(heroStamps[0])}
									>
										<StampImage
											src={heroStamps[0].imageUrl}
											alt={heroStamps[0].prompt}
											width={240}
											height={240}
											className="aspect-square h-full w-full object-cover"
										/>
									</button>
								)}
								{heroStamps[1] && (
									<button
										type="button"
										className="absolute -right-2 top-[12%] hidden w-[132px] rotate-[9deg] overflow-hidden rounded-[1.6rem] shadow-[0_24px_45px_-32px_rgba(58,39,21,0.55)] md:block"
										onClick={() => setSelectedStamp(heroStamps[1])}
									>
										<StampImage
											src={heroStamps[1].imageUrl}
											alt={heroStamps[1].prompt}
											width={264}
											height={264}
											className="aspect-square h-full w-full object-cover"
										/>
									</button>
								)}
								{heroStamps[2] && (
									<button
										type="button"
										className="absolute left-[8%] bottom-2 hidden w-[112px] rotate-[7deg] overflow-hidden rounded-[1.4rem] shadow-[0_24px_45px_-32px_rgba(58,39,21,0.5)] lg:block"
										onClick={() => setSelectedStamp(heroStamps[2])}
									>
										<StampImage
											src={heroStamps[2].imageUrl}
											alt={heroStamps[2].prompt}
											width={224}
											height={224}
											className="aspect-square h-full w-full object-cover"
										/>
									</button>
								)}
								{heroStamps[3] && (
									<button
										type="button"
										className="absolute right-[10%] bottom-0 hidden w-[124px] rotate-[-8deg] overflow-hidden rounded-[1.5rem] shadow-[0_24px_45px_-32px_rgba(58,39,21,0.5)] lg:block"
										onClick={() => setSelectedStamp(heroStamps[3])}
									>
										<StampImage
											src={heroStamps[3].imageUrl}
											alt={heroStamps[3].prompt}
											width={248}
											height={248}
											className="aspect-square h-full w-full object-cover"
										/>
									</button>
								)}
							</div>
						) : (
							<div className="mx-auto max-w-[500px] py-10">
								<p className="text-sm text-stone-500">
									New public stamps will appear here as soon as the first ones
									are generated.
								</p>
							</div>
						)}
					</div>
				</div>
			</section>

			{recentStamps.length > 0 && (
				<section className="pb-10">
					<div className="flex items-end justify-between gap-6">
						<div>
							<p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
								Fresh from the press
							</p>
							<h2 className="mt-3 font-stamp text-3xl text-stone-950 sm:text-4xl">
								A moving wall of newly generated stamps.
							</h2>
						</div>
						<Link
							to="/collections"
							className="hidden text-sm text-stone-600 transition-colors hover:text-stone-950 sm:inline-flex"
						>
							View all &rarr;
						</Link>
					</div>
					<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{recentStamps.slice(0, 6).map((stamp, index) => (
							<button
								key={`showcase-${stamp.id}`}
								type="button"
								className={`group block text-left ${index === 0 ? "sm:col-span-2 lg:col-span-2" : ""}`}
								onClick={() => setSelectedStamp(stamp)}
							>
								<div className="relative overflow-hidden rounded-[2rem] bg-stone-200 shadow-[0_24px_60px_-42px_rgba(58,39,21,0.5)]">
									<StampImage
										src={stamp.imageUrl}
										alt={stamp.prompt}
										width={720}
										height={720}
										loading="lazy"
										className={`w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] ${
											index === 0 ? "aspect-[1.65/1]" : "aspect-square"
										}`}
									/>
								</div>
								<div className="px-1 pt-3">
									<div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.24em] text-stone-400">
										<span>{stamp.style || "stamp"}</span>
										<span>
											{new Date(stamp.createdAt).toLocaleDateString("en-US", {
												month: "short",
												day: "numeric",
											})}
										</span>
									</div>
									<p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-700">
										{stamp.description || stamp.prompt}
									</p>
								</div>
							</button>
						))}
					</div>
				</section>
			)}

			<section
				id="generate"
				className="scroll-mt-24 grid gap-10 border-t border-stone-200/80 py-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]"
			>
				<div className="max-w-md">
					<p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-stone-500">
						Workbench
					</p>
					<h2 className="mt-4 font-stamp text-4xl leading-tight text-stone-950">
						Make the next stamp, not another dashboard tile.
					</h2>
					<p className="mt-4 text-sm leading-7 text-stone-600">
						Write a scene, attach a reference if you need more control, pick a
						style, and let the image carry the page. This section stays lighter
						on framing so the output can do more of the visual work.
					</p>
					<div className="mt-8 space-y-4 text-sm leading-6 text-stone-600">
						<p>
							Strong prompts usually combine subject, setting, and texture in
							one breath.
						</p>
						<p className="font-stamp text-xl leading-8 text-stone-900">
							“Rainy Saigon alley with scooters, warm window light, engraved
							stamp texture.”
						</p>
						<p>You get 20 free stamps per day, or 100 when signed in.</p>
					</div>
				</div>
				<div className="min-w-0">
					<GenerateForm onGenerated={handleGenerated} />
				</div>
			</section>

			<section className="border-t border-stone-200/80 py-14">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
							Credits
						</p>
						<p className="mt-3 font-stamp text-3xl text-stone-900">
							20 free stamps per day. Sign in for 100.
						</p>
					</div>
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
						<a href="#generate">
							<Button variant="cta">Make another stamp</Button>
						</a>
						<Link
							to="/collections"
							className="text-sm text-stone-600 transition-colors hover:text-stone-950"
						>
							See the full gallery &rarr;
						</Link>
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
