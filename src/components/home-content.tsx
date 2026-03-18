"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { GenerateForm } from "@/components/generate-form";
import { ArrowDownIcon } from "@/components/icons";
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
			<section className="pt-6 pb-8 text-center">
				<div className="flex justify-center mb-5">
					<StampFan
						images={recentStamps.slice(0, 5).map((s) => s.imageUrl)}
						onClickStamp={(idx) => {
							const stamp = recentStamps[idx];
							if (stamp) setSelectedStamp(stamp);
						}}
					/>
				</div>
				<h1
					className="text-5xl md:text-7xl font-bold tracking-tight mb-3 hero-gradient"
					style={{ fontFamily: "var(--font-stamp)" }}
				>
					Stamps, builders
				</h1>
				<p className="text-base text-stone-600 max-w-md mx-auto leading-relaxed mb-6">
					Describe anything and get a unique AI-generated postage stamp in
					seconds.{" "}
					<span className="text-stamp-blue font-medium">Free to create.</span>
				</p>
				<Link
					href="#generate"
					className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-full font-medium text-base hover:bg-stone-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
				>
					<span>Create your stamp</span>
					<ArrowDownIcon />
				</Link>
			</section>

			{/* Generate form */}
			<section id="generate" className="pb-10 scroll-mt-8">
				<GenerateForm onGenerated={handleGenerated} />
			</section>

			{/* Latest stamps — full width breakout */}
			{recentStamps.length > 0 && (
				<section className="mb-12 relative left-1/2 -translate-x-1/2 w-screen px-4 sm:px-6">
					<div className="flex items-baseline justify-between mb-6 max-w-5xl mx-auto">
						<h2 className="text-xl font-semibold text-stone-900">
							Latest stamps
						</h2>
						<Link
							href="/collections"
							className="text-sm text-stone-600 hover:text-stamp-blue transition-colors font-medium"
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
									/>
									<div className="absolute inset-0 bg-stamp-navy/0 group-hover:bg-stamp-navy/10 transition-colors duration-200" />
								</div>
								<p className="px-3 py-2.5 text-xs text-stone-600 truncate">
									{stamp.description || stamp.prompt}
								</p>
							</button>
						))}
					</div>
				</section>
			)}

			{/* Free tier note */}
			<section className="py-10 text-center">
				<p className="text-xs text-stone-500">
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
