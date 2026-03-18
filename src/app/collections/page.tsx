"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RefreshIcon } from "@/components/icons";
import { StampCardMemo } from "@/components/stamp-card";
import { StampGridSkeleton } from "@/components/stamp-grid-skeleton";
import { StampModal } from "@/components/stamp-modal";
import type { Stamp } from "@/db/schema";
import { useStamps } from "@/hooks/use-stamps";
import { STAMP_STYLE_PRESETS, type StampStyle } from "@/lib/stamp-prompts";

const ALL_STYLES = "all" as const;
type StyleFilter = StampStyle | typeof ALL_STYLES;

export default function CollectionsPage() {
	const [selectedStyle, setSelectedStyle] = useState<StyleFilter>(ALL_STYLES);
	const [retryKey, setRetryKey] = useState(0);
	const [selectedStamp, setSelectedStamp] = useState<Stamp | null>(null);
	const { stamps, loading, error, setStamps } = useStamps(100, retryKey);

	// Memoized filter to avoid re-computation on every render
	const filteredStamps = useMemo(
		() =>
			selectedStyle === ALL_STYLES
				? stamps
				: stamps.filter((s) => s.style === selectedStyle),
		[stamps, selectedStyle],
	);

	// Memoized empty state message for selected style
	const emptyStateMessage = useMemo(() => {
		if (selectedStyle === ALL_STYLES) {
			return "Be the first to create a stamp!";
		}
		const styleName =
			STAMP_STYLE_PRESETS[selectedStyle as StampStyle]?.name.toLowerCase();
		return styleName ? `No ${styleName} stamps yet.` : "No stamps found.";
	}, [selectedStyle]);

	// Trigger refetch on retry
	function handleRetry() {
		setRetryKey((prev) => prev + 1);
	}

	// Handle regeneration from modal
	function handleRegenerate(newStamp: Stamp) {
		setSelectedStamp(newStamp);
		setStamps((prev) => {
			const filtered = prev.filter((s) => s.id !== newStamp.id);
			return [newStamp, ...filtered];
		});
	}

	return (
		<div className="max-w-5xl mx-auto px-6 py-20 animate-page-fade-in">
			<div className="text-center mb-8">
				<h1
					className="text-4xl font-bold text-stamp-navy dark:text-stone-100 tracking-tight mb-3"
					style={{ fontFamily: "var(--font-stamp)" }}
				>
					Collections
				</h1>
				<p className="text-stone-600 dark:text-stone-400">
					Stamps created by the community
				</p>
			</div>

			{/* Style filter buttons */}
			<div className="flex flex-wrap justify-center gap-2 mb-8">
				<button
					type="button"
					onClick={() => setSelectedStyle(ALL_STYLES)}
					className={`px-4 py-2 rounded-full text-sm font-medium transition ${
						selectedStyle === ALL_STYLES
							? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
							: "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
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
								? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
								: "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
						}`}
					>
						{name}
					</button>
				))}
			</div>

			{/* Stamps grid */}
			{error ? (
				<div className="text-center py-20">
					<div className="max-w-md mx-auto">
						<p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
						<button
							type="button"
							onClick={handleRetry}
							className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg text-sm font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
						>
							<RefreshIcon />
							Try again
						</button>
					</div>
				</div>
			) : loading ? (
				<StampGridSkeleton count={8} />
			) : filteredStamps.length === 0 ? (
				<div className="text-center py-20">
					<div className="max-w-sm mx-auto">
						<p className="text-stone-600 dark:text-stone-400 mb-2">
							No stamps found.
						</p>
						<p className="text-sm text-stone-500 dark:text-stone-600 mb-6">
							{emptyStateMessage}
						</p>
						<Link
							href="/generate"
							className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-medium text-sm hover:bg-stone-800 dark:hover:bg-stone-200 hover:shadow-lg transition-all"
						>
							Create your stamp
						</Link>
					</div>
				</div>
			) : (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{filteredStamps.map((stamp) => (
						<StampCardMemo
							key={stamp.id}
							stamp={stamp}
							onClick={() => setSelectedStamp(stamp)}
						/>
					))}
				</div>
			)}

			{/* Stamp overlay modal */}
			{selectedStamp && (
				<StampModal
					stamp={selectedStamp}
					onClose={() => setSelectedStamp(null)}
					onRegenerate={handleRegenerate}
				/>
			)}
		</div>
	);
}
