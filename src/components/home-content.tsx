import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/button";
import { GenerateForm } from "@/components/generate-form";
import { StampFan } from "@/components/stamp-fan";
import { StampImage } from "@/components/stamp-image";
import { StampModal } from "@/components/stamp-modal";
import type { PublicStamp } from "@/db/schema";
import { useStamps } from "@/hooks/use-stamps";

const WORKBENCH_STEPS = [
	{
		label: "Write the scene",
		copy: "Describe a memory, a place, or a wild postcard idea in one line.",
	},
	{
		label: "Pick a stamp style",
		copy: "Lean vintage, ornate, playful, or let the prompt guide the art.",
	},
	{
		label: "Publish or keep it private",
		copy: "Save a public gallery piece or generate quietly for yourself.",
	},
] as const;

const GALLERY_FACTS = [
	{ value: "20", label: "free stamps each day" },
	{ value: "1 click", label: "to open the public gallery" },
	{ value: "R2-backed", label: "images now checked before display" },
] as const;

export function HomeContent() {
	const { stamps: recentStamps, setStamps: setRecentStamps } = useStamps(30);
	const [selectedStamp, setSelectedStamp] = useState<PublicStamp | null>(null);

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
			<section className="relative overflow-hidden rounded-[2.5rem] border border-stone-300/70 bg-[linear-gradient(135deg,rgba(255,251,245,0.96)_0%,rgba(249,243,232,0.94)_42%,rgba(242,234,221,0.92)_100%)] px-5 py-8 shadow-[0_28px_90px_-48px_rgba(68,44,22,0.45)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
				<div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(109,79,47,0.16),transparent_70%)]" />
				<div className="pointer-events-none absolute -right-12 bottom-0 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(164,126,80,0.18),transparent_70%)] blur-2xl" />
				<div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:items-center">
					<div className="max-w-2xl">
						<div className="inline-flex items-center gap-2 rounded-full border border-stone-300/80 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-600">
							<span className="h-2 w-2 rounded-full bg-stone-700" />
							Mailroom edition
						</div>
						<h1 className="mt-6 max-w-xl font-stamp text-5xl leading-[0.95] tracking-tight text-stone-950 sm:text-6xl lg:text-7xl">
							Design collectible stamps from a single prompt.
						</h1>
						<p className="mt-5 max-w-xl text-base leading-7 text-stone-700 sm:text-lg">
							Turn travel memories, inside jokes, mascots, city scenes, and
							fictional places into tactile-looking postage art. The workbench
							lives up front, and the freshest public stamps stay on display
							below it.
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
						<div className="mt-8 grid gap-3 sm:grid-cols-3">
							{GALLERY_FACTS.map((fact) => (
								<div
									key={fact.label}
									className="rounded-[1.4rem] border border-stone-300/75 bg-white/65 px-4 py-4 backdrop-blur-sm"
								>
									<p className="font-stamp text-2xl text-stone-950">
										{fact.value}
									</p>
									<p className="mt-1 text-sm leading-5 text-stone-600">
										{fact.label}
									</p>
								</div>
							))}
						</div>
					</div>

					<div className="relative mx-auto w-full max-w-[440px]">
						<div className="rounded-[2rem] border border-stone-300/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,242,233,0.9))] p-4 shadow-[0_24px_50px_-38px_rgba(60,42,24,0.5)] sm:p-6">
							<div className="rounded-[1.6rem] border border-stone-200 bg-[linear-gradient(180deg,#f9f4eb_0%,#fffdf9_100%)] px-2 py-6 sm:px-4">
								<StampFan
									images={recentStamps.slice(0, 5).map((s) => s.imageUrl)}
									onClickStamp={(idx) => {
										const stamp = recentStamps[idx];
										if (stamp) setSelectedStamp(stamp);
									}}
								/>
							</div>
							<div className="mt-4 rounded-[1.4rem] border border-stone-200 bg-white/85 px-4 py-4">
								<p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500">
									What this page is built for
								</p>
								<p className="mt-2 text-sm leading-6 text-stone-700">
									Quick generations in the center, stronger gallery curation,
									and enough visual texture to feel like a stamp atelier instead
									of a placeholder app shell.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="grid gap-4 py-8 sm:grid-cols-3">
				{WORKBENCH_STEPS.map((step, index) => (
					<div
						key={step.label}
						className="rounded-[1.7rem] border border-stone-200/80 bg-white/75 px-5 py-5 shadow-[0_18px_40px_-38px_rgba(61,40,18,0.65)]"
					>
						<div className="flex items-center gap-3">
							<span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-stone-950 text-sm font-semibold text-stone-50">
								{index + 1}
							</span>
							<h2 className="text-lg font-semibold text-stone-900">
								{step.label}
							</h2>
						</div>
						<p className="mt-4 text-sm leading-6 text-stone-600">{step.copy}</p>
					</div>
				))}
			</section>

			<section
				id="generate"
				className="scroll-mt-24 rounded-[2.2rem] border border-stone-300/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,239,230,0.95))] px-4 py-5 shadow-[0_28px_65px_-48px_rgba(58,39,21,0.5)] sm:px-6 sm:py-6 lg:px-8 lg:py-8"
			>
				<div className="grid gap-8 lg:grid-cols-[290px_minmax(0,1fr)]">
					<div className="rounded-[1.8rem] border border-stone-200 bg-stone-950 px-5 py-6 text-stone-100">
						<p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-stone-300">
							Workbench
						</p>
						<h2 className="mt-3 font-stamp text-3xl leading-tight text-white">
							Build a stamp worth keeping.
						</h2>
						<p className="mt-4 text-sm leading-6 text-stone-300">
							Start with a sentence, add a reference image if you want more
							control, and let the generator handle the framing, texture, and
							folk-art feel.
						</p>
						<div className="mt-6 space-y-3">
							<div className="rounded-[1.2rem] border border-stone-700 bg-white/5 px-4 py-3">
								<p className="text-[10px] uppercase tracking-[0.25em] text-stone-400">
									Good prompts
								</p>
								<p className="mt-2 text-sm leading-6 text-stone-200">
									“Rainy Saigon alley with scooters and warm window light”
								</p>
							</div>
							<div className="rounded-[1.2rem] border border-stone-700 bg-white/5 px-4 py-3">
								<p className="text-[10px] uppercase tracking-[0.25em] text-stone-400">
									Best use
								</p>
								<p className="mt-2 text-sm leading-6 text-stone-200">
									Souvenir-style art, event graphics, tiny posters, and playful
									collection pieces.
								</p>
							</div>
						</div>
					</div>
					<div className="rounded-[1.8rem] border border-stone-200/80 bg-white/70 px-2 py-3 sm:px-4 sm:py-4">
						<GenerateForm onGenerated={handleGenerated} />
					</div>
				</div>
			</section>

			{recentStamps.length > 0 && (
				<section className="relative left-1/2 mt-10 mb-18 w-screen -translate-x-1/2 px-4 sm:px-6">
					<div className="mx-auto overflow-hidden rounded-[2.4rem] border border-stone-200/80 bg-[linear-gradient(180deg,#fffaf2_0%,#fff_24%,#f3eee4_100%)] shadow-[0_24px_70px_-42px_rgba(72,52,23,0.5)]">
						<div className="grid gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
							<div className="border-b border-stone-200/70 px-6 py-6 lg:border-r lg:border-b-0 lg:px-8 lg:py-8">
								<p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">
									Fresh from the press
								</p>
								<h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl font-stamp">
									Latest stamps
								</h2>
								<p className="mt-3 text-sm leading-6 text-stone-600 sm:text-base">
									A rolling shelf of the newest public creations, filtered so
									only stamps with live artwork appear in the showcase.
								</p>
								<div className="mt-6 space-y-3">
									{recentStamps.slice(0, 3).map((stamp) => (
										<button
											key={`feature-${stamp.id}`}
											type="button"
											className="block w-full rounded-[1.2rem] border border-stone-200 bg-white/85 px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-300"
											onClick={() => setSelectedStamp(stamp)}
										>
											<p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">
												{new Date(stamp.createdAt).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
												})}
											</p>
											<p className="mt-2 line-clamp-2 text-sm leading-5 text-stone-700">
												{stamp.description || stamp.prompt}
											</p>
										</button>
									))}
								</div>
								<div className="mt-6 flex items-center gap-5">
									<div className="rounded-full border border-stone-300 bg-white/80 px-4 py-2 shadow-sm">
										<p className="text-[10px] uppercase tracking-[0.25em] text-stone-500">
											On display
										</p>
										<p className="mt-1 text-lg font-semibold text-stone-900">
											{recentStamps.length}
										</p>
									</div>
									<Link
										to="/collections"
										className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-stone-950 px-4 py-2 text-sm font-medium text-stone-50 transition-all duration-200 hover:bg-stone-800 hover:shadow-lg"
									>
										View all
										<span aria-hidden="true">&rarr;</span>
									</Link>
								</div>
							</div>
							<div className="px-3 py-4 sm:px-5 sm:py-6">
								<div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
									{recentStamps.map((stamp) => (
										<button
											key={stamp.id}
											type="button"
											className="group w-[184px] shrink-0 snap-start text-left rounded-[1.6rem] border border-stone-200 bg-white/90 p-2 shadow-[0_18px_35px_-30px_rgba(47,34,16,0.55)] transition-all duration-200 hover:-translate-y-1 hover:border-stone-300 hover:shadow-[0_24px_45px_-28px_rgba(47,34,16,0.6)] sm:w-[196px] lg:w-[220px]"
											onClick={() => setSelectedStamp(stamp)}
										>
											<div className="relative aspect-square overflow-hidden rounded-[1.15rem] bg-stone-100">
												<StampImage
													src={stamp.imageUrl}
													alt={stamp.prompt}
													loading="lazy"
													width={220}
													height={220}
													className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
												/>
											</div>
											<div className="px-1 pb-1 pt-3">
												<div className="flex items-center justify-between gap-2">
													<span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
														{stamp.style || "stamp"}
													</span>
													<span className="text-[10px] uppercase tracking-[0.22em] text-stone-400">
														{new Date(stamp.createdAt).toLocaleDateString(
															"en-US",
															{
																month: "short",
																day: "numeric",
															},
														)}
													</span>
												</div>
												<p className="mt-3 line-clamp-2 text-sm leading-5 text-stone-700">
													{stamp.description || stamp.prompt}
												</p>
											</div>
										</button>
									))}
								</div>
							</div>
						</div>
					</div>
				</section>
			)}

			<section className="py-16">
				<div className="rounded-[2rem] border border-stone-200/80 bg-white/70 px-6 py-6 text-center shadow-[0_22px_55px_-45px_rgba(65,42,20,0.55)] sm:px-8">
					<p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">
						Credits
					</p>
					<p className="mt-3 font-stamp text-3xl text-stone-900">
						20 free stamps per day. Sign in for 100.
					</p>
					<p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-stone-600">
						Enough room for quick experiments, moodboards, city scenes, and
						weird tiny commissions. Sign in when you want a deeper daily
						allowance and persistent account history.
					</p>
					<div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
						<a href="#generate">
							<Button variant="cta">Make another stamp</Button>
						</a>
						<Link
							to="/collections"
							className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-400"
						>
							See the gallery
							<span aria-hidden="true">&rarr;</span>
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
