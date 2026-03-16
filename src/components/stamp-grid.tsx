"use client";

import { StampCard } from "@/components/stamp-card";
import { useStamps } from "@/hooks/use-stamps";

export function StampGrid() {
	const { stamps, loading } = useStamps(50);

	if (loading) {
		return (
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{["sk-1", "sk-2", "sk-3", "sk-4", "sk-5", "sk-6", "sk-7", "sk-8"].map(
					(id) => (
						<div
							key={id}
							className="aspect-square rounded-xl bg-neutral-100 animate-pulse"
						/>
					),
				)}
			</div>
		);
	}

	if (stamps.length === 0) {
		return (
			<div className="text-center py-20">
				<p className="text-neutral-500 text-base">No stamps yet.</p>
				<p className="text-neutral-400 text-sm mt-1">
					Be the first to{" "}
					<a
						href="/generate"
						className="text-neutral-700 hover:text-neutral-900 underline underline-offset-2 transition"
					>
						create one
					</a>
					.
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
			{stamps.map((stamp) => (
				<StampCard key={stamp.id} stamp={stamp} />
			))}
		</div>
	);
}
