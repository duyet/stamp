"use client";

import { useState } from "react";
import { StampCard } from "@/components/stamp-card";
import { StampModal } from "@/components/stamp-modal";
import type { Stamp } from "@/db/schema";
import { useStamps } from "@/hooks/use-stamps";
import { useTrack } from "@/hooks/use-track";

export function StampGrid() {
	const { stamps, loading } = useStamps(50);
	const { track } = useTrack();
	const [selected, setSelected] = useState<Stamp | null>(null);

	if (loading) {
		return (
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{["sk-1", "sk-2", "sk-3", "sk-4", "sk-5", "sk-6", "sk-7", "sk-8"].map(
					(id) => (
						<div
							key={id}
							className="aspect-square rounded-xl bg-stone-100 animate-pulse"
						/>
					),
				)}
			</div>
		);
	}

	if (stamps.length === 0) {
		return (
			<div className="text-center py-20">
				<p className="text-stone-600 text-base">No stamps yet.</p>
				<p className="text-stone-500 text-sm mt-1">
					Be the first to{" "}
					<a
						href="/generate"
						className="text-stone-700 hover:text-stone-900 underline underline-offset-2 transition"
					>
						create one
					</a>
					.
				</p>
			</div>
		);
	}

	return (
		<>
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{stamps.map((stamp) => (
					<StampCard
						key={stamp.id}
						stamp={stamp}
						onClick={() => {
							setSelected(stamp);
							track("stamp_view", { stampId: stamp.id, style: stamp.style });
						}}
					/>
				))}
			</div>
			{selected && (
				<StampModal stamp={selected} onClose={() => setSelected(null)} />
			)}
		</>
	);
}
