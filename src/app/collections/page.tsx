"use client";

import { useMemo, useState } from "react";
import { StampCardMemo } from "@/components/stamp-card";
import { useStamps } from "@/hooks/use-stamps";
import { STAMP_STYLE_PRESETS, type StampStyle } from "@/lib/stamp-prompts";

const ALL_STYLES = "all" as const;
type StyleFilter = StampStyle | typeof ALL_STYLES;

export default function CollectionsPage() {
	const [selectedStyle, setSelectedStyle] = useState<StyleFilter>(ALL_STYLES);
	const { stamps, loading } = useStamps(100);

	// Memoized filter to avoid re-computation on every render
	const filteredStamps = useMemo(
		() =>
			selectedStyle === ALL_STYLES
				? stamps
				: stamps.filter((s) => s.style === selectedStyle),
		[stamps, selectedStyle],
	);

	return (
		<div className="max-w-5xl mx-auto px-6 py-20 animate-page-fade-in">
			<div className="text-center mb-8">
				<h1
					className="text-4xl font-bold text-stamp-navy tracking-tight mb-3"
					style={{ fontFamily: "var(--font-stamp)" }}
				>
					Collections
				</h1>
				<p className="text-stone-600">Stamps created by the community</p>
			</div>

			{/* Style filter buttons */}
			<div className="flex flex-wrap justify-center gap-2 mb-8">
				<button
					type="button"
					onClick={() => setSelectedStyle(ALL_STYLES)}
					className={`px-4 py-2 rounded-full text-sm font-medium transition ${
						selectedStyle === ALL_STYLES
							? "bg-stone-900 text-white"
							: "bg-stone-100 text-stone-700 hover:bg-stone-200"
					}`}
				>
					All Styles
				</button>
				{Object.entries(STAMP_STYLE_PRESETS).map(([key, { name }]) => (
					<button
						key={key}
						type="button"
						onClick={() => setSelectedStyle(key as StampStyle)}
						className={`px-4 py-2 rounded-full text-sm font-medium transition ${
							selectedStyle === key
								? "bg-stone-900 text-white"
								: "bg-stone-100 text-stone-700 hover:bg-stone-200"
						}`}
					>
						{name}
					</button>
				))}
			</div>

			{/* Stamps grid */}
			{loading ? (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{Array.from({ length: 8 }, (_, i) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton placeholders never change order
							key={`skeleton-${i}`}
							className="aspect-square rounded-xl bg-stone-100 animate-pulse"
						/>
					))}
				</div>
			) : filteredStamps.length === 0 ? (
				<div className="text-center py-20">
					<p className="text-stone-600">No stamps found.</p>
				</div>
			) : (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{filteredStamps.map((stamp) => (
						<StampCardMemo key={stamp.id} stamp={stamp} />
					))}
				</div>
			)}
		</div>
	);
}
