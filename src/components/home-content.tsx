"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GenerateForm } from "@/components/generate-form";
import { StampFan } from "@/components/stamp-fan";
import { StampModal } from "@/components/stamp-modal";
import type { Stamp } from "@/db/schema";

export function HomeContent() {
	const [recentStamps, setRecentStamps] = useState<Stamp[]>([]);
	const [selectedStamp, setSelectedStamp] = useState<Stamp | null>(null);

	useEffect(() => {
		async function load() {
			try {
				const r = await fetch("/api/stamps?limit=8");
				const data = (await r.json()) as { stamps?: Stamp[] };
				setRecentStamps(data.stamps ?? []);
			} catch {}
		}
		load();
	}, []);

	function handleGenerated(stamp: {
		id: string;
		imageUrl: string;
		prompt: string;
	}) {
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
		<div className="max-w-5xl mx-auto px-6">
			{/* Hero */}
			<section className="pt-16 pb-20 text-center">
				<div className="flex justify-center mb-10">
					<StampFan
						images={recentStamps.slice(0, 3).map((s) => s.imageUrl)}
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
					className="mt-6 text-lg text-neutral-400 max-w-md mx-auto leading-relaxed"
					style={{ fontFamily: "var(--font-stamp)" }}
				>
					Create vintage postage stamps with AI.
					<br />
					Describe your vision. We do the rest.
				</p>
			</section>

			{/* Generate form */}
			<section className="pb-20">
				<GenerateForm onGenerated={handleGenerated} />
			</section>

			{/* Latest stamps */}
			{recentStamps.length > 0 && (
				<section className="py-20">
					<div className="flex items-baseline justify-between mb-10">
						<h2
							className="text-2xl font-semibold text-stamp-navy"
							style={{ fontFamily: "var(--font-stamp)" }}
						>
							Latest stamps
						</h2>
						<Link
							href="/collections"
							className="text-sm text-neutral-400 hover:text-stamp-navy transition-colors"
						>
							View all &rarr;
						</Link>
					</div>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-8">
						{recentStamps.map((stamp) => (
							<button
								key={stamp.id}
								type="button"
								className="group text-left cursor-pointer hover:opacity-80 transition"
								onClick={() => setSelectedStamp(stamp)}
							>
								<div className="relative aspect-square">
									<Image
										src={stamp.imageUrl}
										alt={stamp.prompt}
										fill
										sizes="(max-width: 768px) 50vw, 25vw"
										className="object-cover rounded-xl"
									/>
								</div>
								<p className="mt-3 text-xs text-neutral-400 truncate">
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
					className="text-sm text-neutral-400"
					style={{ fontFamily: "var(--font-stamp)" }}
				>
					5 free stamps per day. No account needed.
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
