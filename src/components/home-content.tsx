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
		enhancedPrompt?: string;
	}) {
		const newStamp: Stamp = {
			id: stamp.id,
			prompt: stamp.prompt,
			enhancedPrompt: stamp.enhancedPrompt ?? null,
			imageUrl: stamp.imageUrl,
			thumbnailUrl: null,
			style: "vintage",
			isPublic: true,
			userIp: null,
			userId: null,
			createdAt: new Date(),
		};
		setRecentStamps((prev) => [newStamp, ...prev].slice(0, 12));
	}

	return (
		<div className="max-w-5xl mx-auto px-6">
			{/* Hero */}
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
					className="text-5xl md:text-7xl font-bold text-stamp-navy tracking-tight"
					style={{ fontFamily: "var(--font-stamp)" }}
				>
					Stamps, builders
				</h1>
			</section>

			{/* Generate form */}
			<section id="generate" className="pb-20 scroll-mt-8">
				<GenerateForm onGenerated={handleGenerated} />
			</section>

			{/* Latest stamps — full width breakout */}
			{recentStamps.length > 0 && (
				<section className="mb-16 relative left-1/2 -translate-x-1/2 w-screen px-4 sm:px-6">
					<div className="flex items-baseline justify-between mb-8 max-w-5xl mx-auto">
						<h2
							className="text-2xl font-semibold text-stamp-navy"
							style={{ fontFamily: "var(--font-stamp)" }}
						>
							Latest stamps
						</h2>
						<Link
							href="/collections"
							className="text-sm text-stone-600 hover:text-stamp-navy transition-colors"
						>
							View all &rarr;
						</Link>
					</div>
					<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
						{recentStamps.map((stamp) => (
							<button
								key={stamp.id}
								type="button"
								className="group text-left cursor-pointer rounded-xl overflow-hidden transition"
								onClick={() => setSelectedStamp(stamp)}
							>
								<div className="relative aspect-square">
									<Image
										src={stamp.imageUrl}
										alt={stamp.prompt}
										fill
										sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 16vw, 10vw"
										className="object-cover"
									/>
								</div>
								<p className="px-3 py-2.5 text-xs text-stone-600 truncate">
									{stamp.prompt}
								</p>
							</button>
						))}
					</div>
				</section>
			)}

			{/* Free tier note */}
			<section className="py-16 text-center">
				<p
					className="text-sm text-stone-600"
					style={{ fontFamily: "var(--font-stamp)" }}
				>
					20 free stamps per day. Sign in for 100.
				</p>
			</section>

			{/* Stamp overlay modal */}
			{selectedStamp && (
				<StampModal
					stamp={selectedStamp}
					onClose={() => setSelectedStamp(null)}
				/>
			)}
		</div>
	);
}
