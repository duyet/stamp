"use client";

import Link from "next/link";
import { useState } from "react";
import { GenerateForm } from "@/components/generate-form";
import { StampFan } from "@/components/stamp-fan";
import { StampModal } from "@/components/stamp-modal";
import type { Stamp } from "@/db/schema";

interface HomeContentProps {
	initialStamps: Stamp[];
}

export function HomeContent({ initialStamps }: HomeContentProps) {
	const [recentStamps, setRecentStamps] = useState<Stamp[]>(initialStamps);
	const [selectedStamp, setSelectedStamp] = useState<Stamp | null>(null);

	function handleGenerated(stamp: {
		id: string;
		imageUrl: string;
		prompt: string;
	}) {
		// Prepend newly generated stamp to the list in real-time
		const newStamp: Stamp = {
			id: stamp.id,
			prompt: stamp.prompt,
			imageUrl: stamp.imageUrl,
			thumbnailUrl: null,
			style: "vintage",
			isPublic: true,
			userIp: null,
			createdAt: new Date(),
		};
		setRecentStamps((prev) => [newStamp, ...prev].slice(0, 12));
	}

	return (
		<div className="max-w-5xl mx-auto px-4">
			{/* Hero */}
			<section className="py-16 text-center">
				<div className="flex justify-center mb-8">
					<StampFan />
				</div>

				<h1 className="text-5xl md:text-7xl font-bold text-stone-800 tracking-tight">
					Stamps, builder
				</h1>
				<p className="mt-4 text-lg text-stone-500 max-w-xl mx-auto font-sans">
					Create unique postage stamps with AI. Describe your vision and watch
					it transform into a beautiful vintage stamp.
				</p>
			</section>

			{/* Generate form — right on the homepage */}
			<section className="py-12 border-t border-stone-200/50">
				<GenerateForm onGenerated={handleGenerated} />
			</section>

			{/* Latest stamps — updates in real-time when new stamps are generated */}
			{recentStamps.length > 0 && (
				<section className="py-12 border-t border-stone-200/50">
					<div className="flex items-center justify-between mb-8">
						<h2 className="text-3xl font-bold text-stone-800">Latest stamps</h2>
						<Link
							href="/collections"
							className="text-sm text-stamp-blue hover:underline font-sans"
						>
							View all
						</Link>
					</div>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
						{recentStamps.map((stamp) => (
							<button
								key={stamp.id}
								type="button"
								className="group relative text-left cursor-pointer"
								onClick={() => setSelectedStamp(stamp)}
							>
								<div className="stamp-border transition-transform duration-300 group-hover:scale-105">
									<img
										src={stamp.imageUrl}
										alt={stamp.prompt}
										className="w-full aspect-square object-cover"
										loading="lazy"
									/>
								</div>
								<p className="mt-3 text-sm text-stone-600 text-center italic truncate">
									{stamp.prompt}
								</p>
							</button>
						))}
					</div>
				</section>
			)}

			{/* Free tier */}
			<section className="py-16 border-t border-stone-200/50 text-center font-sans">
				<h2 className="text-3xl font-bold text-stone-800 mb-4">
					Free to start
				</h2>
				<p className="text-stone-500 max-w-md mx-auto">
					Generate up to 5 stamps per day for free. No account needed. Sign up
					later to unlock more generations.
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
