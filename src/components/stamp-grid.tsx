"use client";

import { nanoid } from "nanoid";
import Link from "next/link";
import { memo } from "react";
import { StampIcon } from "@/components/icons";
import { StampCardMemo } from "@/components/stamp-card";
import { useStamps } from "@/hooks/use-stamps";
import { STAMPS_PER_PAGE } from "@/lib/constants";

function StampGrid() {
	const { stamps, loading } = useStamps(STAMPS_PER_PAGE);

	if (loading) {
		return (
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{Array.from({ length: 8 }, () => (
					<div
						key={nanoid()}
						className="aspect-square rounded-xl bg-stone-100 animate-shimmer"
						role="presentation"
						aria-hidden="true"
					/>
				))}
			</div>
		);
	}

	if (stamps.length === 0) {
		return (
			<div className="text-center py-20 px-4">
				<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-stone-100 mb-6 shadow-sm text-stone-400">
					<span className="w-10 h-10 inline-block">
						<StampIcon />
					</span>
				</div>
				<h3 className="text-xl font-semibold text-stone-900 mb-2">
					No stamps yet
				</h3>
				<p className="text-stone-600 text-base mb-6 max-w-sm mx-auto">
					Be the first to create a unique AI-generated postage stamp.
				</p>
				<Link
					href="/generate"
					className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-stone-900 text-white rounded-full font-medium text-base hover:bg-stone-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 button-ripple"
				>
					Create your first stamp
				</Link>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
			{stamps.map((stamp) => (
				<StampCardMemo key={stamp.id} stamp={stamp} />
			))}
		</div>
	);
}

// Memoize StampGrid to prevent unnecessary re-renders
// Only re-renders when stamps data or loading state changes
export const StampGridMemo = memo(StampGrid);
