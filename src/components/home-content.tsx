"use client";

import Link from "next/link";
import { useState } from "react";
import { GenerateForm } from "@/components/generate-form";
import { StampFan } from "@/components/stamp-fan";
import { StampModal } from "@/components/stamp-modal";
import type { Stamp } from "@/db/schema";
import { EXAMPLE_PROMPTS } from "@/lib/stamp-prompts";

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

			{/* How it works */}
			<section className="py-16 border-t border-stone-200/50">
				<h2 className="text-3xl font-bold text-stone-800 text-center mb-12">
					How it works
				</h2>
				<div className="grid md:grid-cols-3 gap-8 font-sans">
					<div className="text-center">
						<div className="text-4xl mb-4">✍️</div>
						<h3 className="text-lg font-semibold text-stone-800 mb-2">
							1. Describe
						</h3>
						<p className="text-stone-500">
							Write a prompt describing what you want on your stamp.
						</p>
					</div>
					<div className="text-center">
						<div className="text-4xl mb-4">🎨</div>
						<h3 className="text-lg font-semibold text-stone-800 mb-2">
							2. Generate
						</h3>
						<p className="text-stone-500">
							AI creates a unique stamp illustration in your chosen style.
						</p>
					</div>
					<div className="text-center">
						<div className="text-4xl mb-4">📬</div>
						<h3 className="text-lg font-semibold text-stone-800 mb-2">
							3. Share
						</h3>
						<p className="text-stone-500">
							Download your stamp or share it in the public collection.
						</p>
					</div>
				</div>
			</section>

			{/* Example prompts */}
			<section className="py-16 border-t border-stone-200/50">
				<h2 className="text-3xl font-bold text-stone-800 text-center mb-8">
					Get inspired
				</h2>
				<div className="flex flex-wrap justify-center gap-3 font-sans">
					{EXAMPLE_PROMPTS.map((prompt) => (
						<Link
							key={prompt}
							href={`/generate?prompt=${encodeURIComponent(prompt)}`}
							className="px-4 py-2 bg-white/60 text-stone-600 rounded-full border border-stone-200 hover:bg-white hover:border-stone-300 transition text-sm"
						>
							{prompt}
						</Link>
					))}
				</div>
			</section>

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
