import { useMemo, useState } from "react";
import { Button } from "@/components/button";
import { RefreshIcon } from "@/components/icons";
import { StampCard } from "@/components/stamp-card";
import { StampGridSkeleton } from "@/components/stamp-grid-skeleton";
import { StampModal } from "@/components/stamp-modal";
import type { PublicStamp } from "@/db/schema";
import { useStamps } from "@/hooks/use-stamps";
import { STAMP_STYLE_PRESETS, type StampStyle } from "@/lib/stamp-prompts";

const ALL_STYLES = "all" as const;
type StyleFilter = StampStyle | typeof ALL_STYLES;

const PAGE_SIZE = 20;

// Filter button className helper to eliminate duplication
const getFilterButtonClass = (isActive: boolean) =>
	`px-3 py-1.5 rounded-full text-xs transition-colors duration-200 ${
		isActive
			? "bg-stone-900 text-white"
			: "bg-white text-stone-500 hover:text-stone-900 border border-stone-200"
	}`;

export default function CollectionsPage() {
	const [selectedStyle, setSelectedStyle] = useState<StyleFilter>(ALL_STYLES);
	const [retryKey, setRetryKey] = useState(0);
	const [selectedStamp, setSelectedStamp] = useState<PublicStamp | null>(null);
	const { stamps, loading, loadingMore, error, setStamps, hasMore, loadMore } =
		useStamps(
			PAGE_SIZE,
			retryKey,
			selectedStyle === ALL_STYLES ? undefined : selectedStyle,
		);

	// Display stamps directly — server-side filtering handles style selection

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
	function handleRegenerate(newStamp: PublicStamp) {
		setSelectedStamp(newStamp);
		setStamps((prev) => {
			const filtered = prev.filter((s) => s.id !== newStamp.id);
			return [newStamp, ...filtered];
		});
	}

	return (
		<div className="max-w-4xl mx-auto px-6 py-12 bg-white">
			<div className="text-center mb-8">
				<p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">
					Collection
				</p>
				<h1 className="mt-1 text-2xl font-normal text-stone-900 tracking-tight font-stamp">
					Stamps by the community
				</h1>
			</div>

			{/* Style filter buttons */}
			<div className="flex flex-wrap justify-center gap-1.5 mb-8">
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
			) : stamps.length === 0 ? (
				<div className="text-center py-20">
					<div className="max-w-sm mx-auto">
						<p className="text-gray-700 mb-2 text-base font-medium">
							No stamps found.
						</p>
						<p className="text-sm text-gray-500 mb-6">{emptyStateMessage}</p>
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
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-6">
						{stamps.map((stamp) => (
							<StampCard
								key={stamp.id}
								stamp={stamp}
								onClick={() => setSelectedStamp(stamp)}
							/>
						))}
					</div>
					{hasMore && (
						<div className="flex justify-center mt-10">
							<button
								type="button"
								onClick={loadMore}
								disabled={loadingMore}
								className="px-4 py-2 text-xs text-stone-500 hover:text-stone-900 border border-stone-200 rounded-full transition-colors duration-200 disabled:opacity-50"
							>
								{loadingMore ? "Loading..." : "Load more"}
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
