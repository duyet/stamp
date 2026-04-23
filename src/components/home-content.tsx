"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { GenerateForm } from "@/components/generate-form";
import { StampFan } from "@/components/stamp-fan";
import { StampModal } from "@/components/stamp-modal";
import type { Stamp } from "@/db/schema";
import { useStamps } from "@/hooks/use-stamps";

export function HomeContent() {
	const { stamps: recentStamps, setStamps: setRecentStamps } = useStamps(30);
	const [selectedStamp, setSelectedStamp] = useState<Stamp | null>(null);

	function handleGenerated(stamp: {
		id: string;
		imageUrl: string;
		prompt: string;
		style?: string;
		enhancedPrompt?: string;
		description?: string;
	}) {
		const newStamp: Stamp = {
			id: stamp.id,
			prompt: stamp.prompt,
			enhancedPrompt: stamp.enhancedPrompt ?? null,
			description: stamp.description ?? null,
			imageUrl: stamp.imageUrl,
			thumbnailUrl: null,
			referenceImageUrl: null,
			imageExt: null,
			style: stamp.style ?? "vintage",
			isPublic: true,
			userIp: null,
			userId: null,
			locationCity: null,
			locationCountry: null,
			locationLat: null,
			locationLng: null,
			userTimezone: null,
			userAgent: null,
			referrer: null,
			createdAt: new Date(),
		};
		setRecentStamps((prev) => [newStamp, ...prev]);
	}

	return (
		<div className="max-w-5xl mx-auto px-6">
			<section className="pt-16 pb-20 text-center">
				<div className="flex justify-center mb-10">
					<StampFan
						images={recentStamps.slice(0, 5).map((s) => s.imageUrl)}
						onClickStamp={(idx) => {
							const stamp = recentStamps[idx];
							if (stamp) setSelectedStamp(stamp);
						}}
					/>
				</div>

				<h1
					className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight"
					style={{ fontFamily: "var(--font-stamp)" }}
				>
					Stamps, builders
				</h1>
			</section>

			<section id="generate" className="pb-16 scroll-mt-8">
				<GenerateForm onGenerated={handleGenerated} />
			</section>

			{recentStamps.length > 0 && (
				<section className="mb-18 relative left-1/2 -translate-x-1/2 w-screen px-4 sm:px-6">
					<div className="max-w-6xl mx-auto overflow-hidden rounded-[2rem] border border-stone-200/80 bg-[linear-gradient(180deg,#fffaf2_0%,#fff_28%,#f6f1e8_100%)] shadow-[0_22px_60px_-40px_rgba(72,52,23,0.45)]">
						<div className="flex flex-col gap-5 border-b border-stone-200/70 px-6 py-6 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
							<div className="max-w-2xl">
								<p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">
									Fresh from the press
								</p>
								<h2
									className="mt-3 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl"
									style={{ fontFamily: "var(--font-stamp)" }}
								>
									Latest stamps
								</h2>
								<p className="mt-3 max-w-xl text-sm leading-6 text-stone-600 sm:text-base">
									A rolling shelf of the newest public creations, cleaned up so
									only stamps with working artwork make it into the showcase.
								</p>
							</div>
							<div className="flex items-center gap-5">
								<div className="rounded-full border border-stone-300 bg-white/80 px-4 py-2 shadow-sm">
									<p className="text-[10px] uppercase tracking-[0.25em] text-stone-500">
										On display
									</p>
									<p className="mt-1 text-lg font-semibold text-stone-900">
										{recentStamps.length}
									</p>
								</div>
								<Link
									href="/collections"
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
										className="group shrink-0 snap-start text-left w-[168px] sm:w-[184px] lg:w-[196px] rounded-[1.5rem] border border-stone-200 bg-white/90 p-2 shadow-[0_18px_35px_-30px_rgba(47,34,16,0.55)] transition-all duration-200 hover:-translate-y-1 hover:border-stone-300 hover:shadow-[0_24px_45px_-28px_rgba(47,34,16,0.6)]"
										onClick={() => setSelectedStamp(stamp)}
									>
										<div className="relative aspect-square overflow-hidden rounded-[1.1rem] bg-stone-100">
											<Image
												src={stamp.imageUrl}
												alt={stamp.prompt}
												fill
												unoptimized
												sizes="(max-width: 640px) 45vw, (max-width: 1024px) 28vw, 196px"
												className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
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
				</section>
			)}

			<section className="py-16 text-center">
				<p
					className="text-sm text-gray-600"
					style={{ fontFamily: "var(--font-stamp)" }}
				>
					20 free stamps per day. Sign in for 100.
				</p>
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
