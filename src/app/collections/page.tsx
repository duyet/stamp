"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/button";
import { RefreshIcon } from "@/components/icons";
import { StampCard } from "@/components/stamp-card";
import { StampGridSkeleton } from "@/components/stamp-grid-skeleton";
import { StampModal } from "@/components/stamp-modal";
import type { Stamp } from "@/db/schema";
import { useStamps } from "@/hooks/use-stamps";
import { GRID_LAYOUTS } from "@/lib/constants";
import { STAMP_STYLE_PRESETS, type StampStyle } from "@/lib/stamp-prompts";

const ALL_STYLES = "all" as const;
type StyleFilter = StampStyle | typeof ALL_STYLES;

// Filter button className helper to eliminate duplication
const getFilterButtonClass = (isActive: boolean) =>
	`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
		isActive
			? "bg-stone-900 text-white shadow-md"
			: "bg-stone-100 text-stone-700 hover:bg-stone-200"
	}`;

export default function CollectionsPage() {
	const [selectedStyle, setSelectedStyle] = useState<StyleFilter>(ALL_STYLES);
	const [retryKey, setRetryKey] = useState(0);
	const [selectedStamp, setSelectedStamp] = useState<Stamp | null>(null);
	const [visibleCount, setVisibleCount] = useState(20);
	const { stamps, loading, error, setStamps } = useStamps(
		GRID_LAYOUTS.MAX_STAMP_LIMIT,
		retryKey,
	);

	// Memoized filter to avoid re-computation on every render
	const filteredStamps = useMemo(
		() =>
			selectedStyle === ALL_STYLES
				? stamps
				: stamps.filter((s) => s.style === selectedStyle),
		[stamps, selectedStyle],
	);

	// Paginate visible stamps
	const visibleStamps = useMemo(
		() => filteredStamps.slice(0, visibleCount),
		[filteredStamps, visibleCount],
	);

	const hasMore = visibleCount < filteredStamps.length;

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

	// Load more stamps
	function handleLoadMore() {
		setVisibleCount((prev) => prev + 20);
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
					className={getFilterButtonClass(selectedStyle === ALL_STYLES)}
				>
					All Styles
				</button>
				{Object.entries(STAMP_STYLE_PRESETS).map(([key, { name }]) => (
					<button
						key={key}
						type="button"
						onClick={() => setSelectedStyle(key as StampStyle)}
						className={getFilterButtonClass(selectedStyle === key)}
					>
						{name}
					</button>
				))}
			</div>

			{/* Stamps grid */}
			{error ? (
				<div className="text-center py-20">
					<div className="max-w-md mx-auto">
						<p className="text-red-600 mb-4">{error}</p>
						<Button onClick={handleRetry} size="sm">
							<RefreshIcon />
							Try again
						</Button>
					</div>
				</div>
			) : loading ? (
				<StampGridSkeleton count={8} />
			) : filteredStamps.length === 0 ? (
				<div className="text-center py-20">
					<div className="max-w-sm mx-auto">
						{/* Empty state stamp illustration */}
						<div className="mb-6 relative inline-block">
							<div className="w-24 h-24 mx-auto relative opacity-40">
								<div className="absolute inset-0 border-4 border-dashed border-stone-300 rounded-lg transform rotate-6" />
								<div className="absolute inset-2 bg-stone-100 rounded flex items-center justify-center">
									<span className="text-4xl" role="img" aria-label="Empty">
										📮
									</span>
								</div>
								<div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-stone-200 rounded-full" />
								<div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-stone-200 rounded-full" />
								<div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-stone-200 rounded-full" />
								<div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-stone-200 rounded-full" />
							</div>
						</div>

						<p className="text-stone-600 mb-2 text-base font-medium">
							No stamps found.
						</p>
						<p className="text-sm text-stone-500 mb-6">{emptyStateMessage}</p>
						<Button
							variant="cta"
							onClick={() => (window.location.href = "/generate")}
						>
							Create your stamp
						</Button>
					</div>
				</div>
			) : (
				<>
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
						{visibleStamps.map((stamp) => (
							<StampCard
								key={stamp.id}
								stamp={stamp}
								onClick={() => setSelectedStamp(stamp)}
							/>
						))}
					</div>
					{hasMore && (
						<div className="flex justify-center mt-8">
							<button
								type="button"
								onClick={handleLoadMore}
								className="px-6 py-3 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl"
							>
								Load more stamps
							</button>
						</div>
					)}
				</>
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
