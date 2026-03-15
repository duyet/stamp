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
					<StampFan images={recentStamps.slice(0, 3).map((s) => s.imageUrl)} />
				</div>

				<h1
					className="text-4xl md:text-6xl font-bold text-neutral-900 tracking-tight"
					style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
				>
					Stamps, builders
				</h1>
				<p className="mt-4 text-base text-neutral-500 max-w-lg mx-auto leading-relaxed">
					Create unique postage stamps with AI. Describe your vision and watch
					it transform into a beautiful vintage stamp.
				</p>
			</section>

			{/* Generate form — right on the homepage */}
			<section className="py-10 border-t border-neutral-200">
				<div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 max-w-2xl mx-auto">
					<GenerateForm onGenerated={handleGenerated} />
				</div>
			</section>

			{/* Latest stamps — updates in real-time when new stamps are generated */}
			{recentStamps.length > 0 && (
				<section className="py-12 border-t border-neutral-200">
					<div className="flex items-center justify-between mb-8">
						<h2 className="text-xl font-semibold text-neutral-900">
							Latest stamps
						</h2>
						<Link
							href="/collections"
							className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
						>
							View all
						</Link>
					</div>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
						{recentStamps.map((stamp) => (
							<button
								key={stamp.id}
								type="button"
								className="group relative text-left cursor-pointer rounded-xl overflow-hidden border border-neutral-200 hover:border-neutral-300 transition-colors"
								onClick={() => setSelectedStamp(stamp)}
							>
								<img
									src={stamp.imageUrl}
									alt={stamp.prompt}
									className="w-full aspect-square object-cover"
									loading="lazy"
								/>
								<div className="p-3">
									<p className="text-sm text-neutral-600 truncate">
										{stamp.prompt}
									</p>
								</div>
							</button>
						))}
					</div>
				</section>
			)}

			{/* Free tier */}
			<section className="py-12 border-t border-neutral-200 text-center">
				<p className="text-sm text-neutral-400">
					Generate up to 5 stamps per day for free. No account needed.
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
