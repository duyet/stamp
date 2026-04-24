import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/button";
import { RefreshIcon } from "@/components/icons";
import { SectionHeading } from "@/components/section-heading";
import { StampCard } from "@/components/stamp-card";
import { StampGridSkeleton } from "@/components/stamp-grid-skeleton";
import { StampModal } from "@/components/stamp-modal";
import { StyleFilterChips } from "@/components/style-filter-chips";
import type { PublicStamp } from "@/db/schema";
import { useStamps } from "@/hooks/use-stamps";
import type { PublicStampResult } from "@/lib/public-stamps";
import { STAMP_STYLE_PRESETS, type StampStyle } from "@/lib/stamp-prompts";

const ALL_STYLES = "all" as const;
type StyleFilter = StampStyle | typeof ALL_STYLES;

export const COLLECTIONS_PAGE_SIZE = 20;

interface CollectionsPageProps {
	initialStyle?: StyleFilter;
	initialData?: PublicStampResult;
}

export default function CollectionsPage({
	initialStyle = ALL_STYLES,
	initialData,
}: CollectionsPageProps) {
	const [selectedStyle, setSelectedStyle] = useState<StyleFilter>(initialStyle);
	const [retryKey, setRetryKey] = useState(0);
	const [selectedStamp, setSelectedStamp] = useState<PublicStamp | null>(null);
	const { stamps, loading, loadingMore, error, setStamps, hasMore, loadMore } =
		useStamps(
			COLLECTIONS_PAGE_SIZE,
			retryKey,
			selectedStyle === ALL_STYLES ? undefined : selectedStyle,
			initialData,
		);

	useEffect(() => {
		setSelectedStyle(initialStyle);
	}, [initialStyle]);

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

	const filterOptions: { value: StyleFilter; label: string }[] = [
		{ value: ALL_STYLES, label: "All" },
		...Object.entries(STAMP_STYLE_PRESETS).map(([key, { name }]) => ({
			value: key as StampStyle,
			label: name,
		})),
	];

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
		<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
			<div className="paper-panel paper-grid rounded-[2.2rem] px-5 py-6 sm:px-7 sm:py-7">
				<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<SectionHeading
						eyebrow="Collections"
						title="Public stamp collections"
						description="Browse recent community editions and filter them by style."
					/>
					<Link
						to="/generate"
						className="inline-flex items-center gap-2 text-sm font-medium text-stone-700 transition hover:text-stone-950"
					>
						Create a stamp
						<span aria-hidden="true">&rarr;</span>
					</Link>
				</div>

				<StyleFilterChips<StyleFilter>
					options={filterOptions}
					selectedValue={selectedStyle}
					onChange={setSelectedStyle}
					getHref={(value) =>
						value === ALL_STYLES
							? "/collections"
							: `/collections?style=${value}`
					}
					className="mt-5"
				/>
			</div>

			{error ? (
				<div className="py-16 text-center">
					<div className="mx-auto max-w-md">
						<p className="mb-4 text-sm leading-6 text-red-600">{error}</p>
						<Button onClick={handleRetry} size="sm">
							<RefreshIcon />
							Try again
						</Button>
					</div>
				</div>
			) : loading ? (
				<StampGridSkeleton count={8} className="mt-6" />
			) : stamps.length === 0 ? (
				<div className="py-16 text-center">
					<div className="mx-auto max-w-sm">
						<p className="mb-2 text-base font-medium text-stone-700">
							No stamps found.
						</p>
						<p className="mb-6 text-sm text-stone-500">{emptyStateMessage}</p>
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
					<div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
						{stamps.map((stamp) => (
							<StampCard
								key={stamp.id}
								stamp={stamp}
								onClick={() => setSelectedStamp(stamp)}
							/>
						))}
					</div>
					{hasMore && (
						<div className="mt-8 flex justify-center">
							<button
								type="button"
								onClick={loadMore}
								disabled={loadingMore}
								className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-stone-800 active:scale-[0.98] disabled:opacity-50"
							>
								{loadingMore ? "Loading..." : "Load more stamps"}
							</button>
						</div>
					)}
				</>
			)}

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
