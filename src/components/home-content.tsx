import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { GenerateForm } from "@/components/generate-form";
import { StampFan } from "@/components/stamp-fan";
import { StampImage } from "@/components/stamp-image";
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

				<h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight font-stamp">
					Stamps, builders
				</h1>
			</section>

			<section id="generate" className="pb-16 scroll-mt-8">
				<GenerateForm onGenerated={handleGenerated} />
			</section>

			{recentStamps.length > 0 && (
				<section className="mb-16 relative left-1/2 -translate-x-1/2 w-screen px-4 sm:px-6">
					<div className="flex items-baseline justify-between mb-8 max-w-5xl mx-auto">
						<h2 className="text-2xl font-semibold text-gray-900 font-stamp">
							Latest stamps
						</h2>
						<Link
							to="/collections"
							className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
						>
							View all &rarr;
						</Link>
					</div>
					<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
						{recentStamps.map((stamp) => (
							<button
								key={stamp.id}
								type="button"
								className="group text-left cursor-pointer rounded-xl overflow-hidden border border-gray-200 transition"
								onClick={() => setSelectedStamp(stamp)}
							>
								<div className="relative aspect-square">
									<StampImage
										src={stamp.imageUrl}
										alt={stamp.prompt}
										loading="lazy"
										width={150}
										height={150}
										className="object-cover w-full h-full absolute inset-0"
									/>
								</div>
								<p className="px-3 py-2.5 text-xs text-gray-600 truncate">
									{stamp.description || stamp.prompt}
								</p>
							</button>
						))}
					</div>
				</section>
			)}

			<section className="py-16 text-center">
				<p className="text-sm text-gray-600 font-stamp">
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
