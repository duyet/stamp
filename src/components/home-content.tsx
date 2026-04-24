import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { GenerateForm } from "@/components/generate-form";
import { StampCard } from "@/components/stamp-card";
import { StampFan } from "@/components/stamp-fan";
import { StampModal } from "@/components/stamp-modal";
import type { PublicStamp } from "@/db/schema";
import { useStamps } from "@/hooks/use-stamps";

export function HomeContent() {
	const { stamps: recentStamps, setStamps: setRecentStamps } = useStamps(24);
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
		<div className="max-w-4xl mx-auto px-6 bg-white">
			<section className="pt-10 pb-8 text-center">
				<div className="flex justify-center mb-6">
					<StampFan
						images={recentStamps.slice(0, 5).map((s) => s.imageUrl)}
						onClickStamp={(idx) => {
							const stamp = recentStamps[idx];
							if (stamp) setSelectedStamp(stamp);
						}}
					/>
				</div>

				<h1 className="text-2xl md:text-3xl font-normal text-stone-900 tracking-tight font-stamp">
					Stamps, builders
				</h1>
			</section>

			<section id="generate" className="pb-12 scroll-mt-8">
				<GenerateForm onGenerated={handleGenerated} />
			</section>

			{recentStamps.length > 0 && (
				<section className="pb-14">
					<div className="flex items-end justify-between mb-5">
						<div>
							<p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">
								Collection
							</p>
							<h2 className="mt-1 text-lg font-normal text-stone-900 font-stamp">
								Recently created
							</h2>
						</div>
						<Link
							to="/collections"
							className="text-xs text-stone-500 hover:text-stone-900 transition-colors"
						>
							View all &rarr;
						</Link>
					</div>

					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-6">
						{recentStamps.map((stamp) => (
							<StampCard
								key={stamp.id}
								stamp={stamp}
								onClick={() => setSelectedStamp(stamp)}
							/>
						))}
					</div>
				</section>
			)}

			<section className="py-10 text-center">
				<p className="text-xs text-stone-400 font-stamp">
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
