"use client";

import { useEffect, useMemo, useState } from "react";

interface GenerateLoadingProps {
	reference?: boolean;
}

const FADE_DURATION_MS = 200;

const STAGES = [
	{ text: "Analyzing your prompt...", duration: 500 },
	{ text: "Sketching composition...", duration: 1000 },
	{ text: "Adding details...", duration: 1000 },
	{ text: "Finalizing...", duration: 0 }, // Remaining time
];

const REFERENCE_STAGES = [
	{ text: "Scanning your photo...", duration: 500 },
	{ text: "Extracting features...", duration: 1000 },
	{ text: "Applying style...", duration: 1000 },
	{ text: "Finalizing...", duration: 0 },
];

/**
 * Loading state component for stamp generation.
 * Shows a spinner with animated progress stages for emotional engagement.
 */
export function GenerateLoading({ reference = false }: GenerateLoadingProps) {
	const [stageIndex, setStageIndex] = useState(0);
	const [isFading, setIsFading] = useState(false);

	// Memoize stages to prevent effect re-renders
	const stages = useMemo(
		() => (reference ? REFERENCE_STAGES : STAGES),
		[reference],
	);

	useEffect(() => {
		const currentStage = stages[stageIndex];
		if (currentStage.duration === 0) return; // Stay on final stage

		// Fade out current text
		setIsFading(true);

		// Change stage and fade in
		const fadeTimeout = setTimeout(() => {
			setStageIndex((prev) => prev + 1);
			setIsFading(false);
		}, FADE_DURATION_MS);

		// Schedule next stage change
		const stageTimeout = setTimeout(() => {
			setIsFading(true);
		}, currentStage.duration - FADE_DURATION_MS);

		return () => {
			clearTimeout(fadeTimeout);
			clearTimeout(stageTimeout);
		};
	}, [stageIndex, stages]);

	return (
		<div className="mt-6 p-6 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 animate-form-enter">
			<div className="flex items-center justify-center gap-3">
				<div className="animate-spin h-5 w-5 border-2 border-stone-900 dark:border-stone-100 border-t-transparent rounded-full" />
				<div className="text-sm text-stone-600 dark:text-stone-400">
					<span
						className={`transition-opacity duration-200 ${
							isFading ? "opacity-0" : "opacity-100"
						}`}
					>
						{stages[stageIndex]?.text}
					</span>
					<span className="block text-xs text-stone-400 dark:text-stone-500 mt-1">
						This takes 3-5 seconds
					</span>
				</div>
			</div>
		</div>
	);
}
