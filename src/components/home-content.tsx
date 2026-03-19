"use client";

import Image from "next/image";
import Link from "next/link";
import { memo, useState } from "react";
import { GenerateForm } from "@/components/generate-form";
import { ArrowDownIcon } from "@/components/icons";
import { StampFanMemo } from "@/components/stamp-fan";
import { StampModal } from "@/components/stamp-modal";
import type { Stamp } from "@/db/schema";
import { useStamps } from "@/hooks/use-stamps";

function HomeContentInner() {
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

	function handleRegenerate(newStamp: Stamp) {
		// Update selected stamp to show new image in modal
		setSelectedStamp(newStamp);
		// Update stamps list - replace the stamp with same ID or add to front
		setRecentStamps((prev) => {
			const filtered = prev.filter((s) => s.id !== newStamp.id);
			return [newStamp, ...filtered];
		});
	}

	return (
		<div className="max-w-5xl mx-auto px-6 animate-page-fade-in">
			{/* Hero — stamp fan + compact title */}
			<section className="pt-6 pb-8 text-center relative">
				{/* Ambient background glow */}
				<div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
					<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-stamp-blue/10 dark:from-stamp-blue/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse-slow" />
					<div className="absolute top-20 right-0 w-[200px] h-[200px] bg-stamp-navy/10 dark:bg-stamp-blue/10 rounded-full blur-2xl" />
					<div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-stamp-blue/10 dark:bg-stamp-navy/10 rounded-full blur-2xl" />
				</div>

				<div className="flex justify-center mb-5">
					<StampFanMemo
						images={recentStamps.slice(0, 5).map((s) => s.imageUrl)}
						onClickStamp={(idx) => {
							const stamp = recentStamps[idx];
							if (stamp) setSelectedStamp(stamp);
						}}
					/>
				</div>
				<h1
					className="text-6xl md:text-8xl font-black tracking-tight mb-5 hero-gradient animate-gradient-shift drop-shadow-lg"
					style={{ fontFamily: "var(--font-stamp)" }}
				>
					Create. Collect. Connect.
				</h1>
				<p className="text-xl md:text-2xl text-stone-700 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed mb-10 font-semibold">
					Describe anything. Get a{" "}
					<span className="text-stamp-blue dark:text-stamp-blue font-bold">
						unique AI-generated stamp
					</span>{" "}
					in seconds.{" "}
					<span className="inline-block animate-pulse-slow">
						✨ Forever yours.
					</span>
				</p>
				<button
					type="button"
					onClick={() => {
						document.getElementById("generate")?.scrollIntoView({
							behavior: "smooth",
						});
					}}
					className="group relative inline-flex items-center gap-3 px-12 py-5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-bold text-xl overflow-hidden hover:bg-stone-800 dark:hover:bg-stone-200 hover:shadow-2xl hover:shadow-stamp-blue/40 hover:-translate-y-2 hover:scale-110 active:scale-95 transition-all duration-300 button-shine-effect"
				>
					<span className="relative z-10">Start Creating</span>
					<span className="relative z-10 group-hover:translate-y-1 transition-transform duration-300">
						<ArrowDownIcon />
					</span>
				</button>
			</section>

			{/* Generate form */}
			<section id="generate" className="pb-10 scroll-mt-8">
				<GenerateForm onGenerated={handleGenerated} />
			</section>

			{/* Latest stamps — full width breakout */}
			{recentStamps.length > 0 && (
				<section className="mb-12 relative left-1/2 -translate-x-1/2 w-screen px-4 sm:px-6">
					<div className="flex items-baseline justify-between mb-6 max-w-5xl mx-auto">
						<h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
							Latest stamps
						</h2>
						<Link
							href="/collections"
							className="text-sm text-stone-600 dark:text-stone-400 hover:text-stamp-blue dark:hover:text-stamp-blue transition-colors font-medium"
						>
							View all &rarr;
						</Link>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
						{recentStamps.map((stamp) => (
							<button
								key={stamp.id}
								type="button"
								className="group text-left cursor-pointer rounded-xl overflow-hidden transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-stamp-blue/20 hover:-translate-y-2 hover:scale-[1.02] hover:rotate-1"
								onClick={() => setSelectedStamp(stamp)}
							>
								<div className="relative aspect-square">
									<Image
										src={stamp.imageUrl}
										alt={stamp.prompt}
										fill
										sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 16vw, 10vw"
										className="object-cover"
										loading="lazy"
										unoptimized
									/>
									<div className="absolute inset-0 bg-stamp-navy/0 group-hover:bg-stamp-navy/10 transition-colors duration-200" />
								</div>
								<p className="px-3 py-2.5 text-xs text-stone-600 dark:text-stone-400 truncate">
									{stamp.description || stamp.prompt}
								</p>
							</button>
						))}
					</div>
				</section>
			)}

			{/* Free tier note */}
			<section className="py-10 text-center">
				<p className="text-xs text-stone-500 dark:text-stone-600">
					20 free stamps per day. Sign in for 100.
				</p>
			</section>

			{/* Stamp overlay modal */}
			{selectedStamp && (
				<StampModal
					stamp={selectedStamp}
					onClose={() => setSelectedStamp(null)}
					onRegenerate={handleRegenerate}
				/>
			)}
		</div>
	);
}

// Memoize to prevent unnecessary re-renders
export const HomeContent = memo(HomeContentInner);
