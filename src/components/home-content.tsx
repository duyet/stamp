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
	const { stamps: recentStamps, setStamps: setRecentStamps } = useStamps(8);
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
				<p
					className="mt-6 text-lg text-stone-500 max-w-md mx-auto leading-relaxed"
					style={{ fontFamily: "var(--font-stamp)" }}
				>
					Create vintage postage stamps with AI. Describe your vision, we do the
					rest.
				</p>
			</section>

			{/* Generate form */}
			<section className="pb-20">
				<GenerateForm onGenerated={handleGenerated} />
			</section>

			{/* Latest stamps */}
			{recentStamps.length > 0 && (
				<section className="mb-16">
					<div className="flex items-baseline justify-between mb-8">
						<h2
							className="text-2xl font-semibold text-stamp-navy"
							style={{ fontFamily: "var(--font-stamp)" }}
						>
							Latest stamps
						</h2>
						<Link
							href="/collections"
							className="text-sm text-stone-500 hover:text-stamp-navy transition-colors"
						>
							View all &rarr;
						</Link>
					</div>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
										sizes="(max-width: 768px) 50vw, 25vw"
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
					className="text-sm text-stone-500"
					style={{ fontFamily: "var(--font-stamp)" }}
				>
					100 free stamps per day with an account. 3 without signing in.
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
