import { useEffect, useState } from "react";

interface GenerateLoadingProps {
	reference?: boolean;
}

const STAGES = {
	reference: [
		{ id: "ref-1", text: "Analyzing your photo...", duration: 1500 },
		{ id: "ref-2", text: "Extracting key elements...", duration: 1500 },
		{ id: "ref-3", text: "Preparing stamp design...", duration: 1500 },
		{ id: "ref-4", text: "Almost there...", duration: 1000 },
	],
	prompt: [
		{ id: "prompt-1", text: "Understanding your vision...", duration: 1500 },
		{ id: "prompt-2", text: "Enhancing your prompt...", duration: 1500 },
		{ id: "prompt-3", text: "Generating artwork...", duration: 2000 },
		{ id: "prompt-4", text: "Adding final touches...", duration: 1500 },
	],
} as const;

/**
 * Loading state component for stamp generation.
 * Shows animated progress stages with context-appropriate messaging.
 */
export function GenerateLoading({ reference = false }: GenerateLoadingProps) {
	const [stageIndex, setStageIndex] = useState(0);

	useEffect(() => {
		const stages = reference ? STAGES.reference : STAGES.prompt;
		const timeouts: NodeJS.Timeout[] = [];
		let currentIndex = 0;

		stages.forEach((stage, index) => {
			const timeout = setTimeout(() => {
				setStageIndex(index);
			}, currentIndex);
			timeouts.push(timeout);
			currentIndex += stage.duration;
		});

		return () => {
			for (const t of timeouts) {
				clearTimeout(t);
			}
		};
	}, [reference]); // Only re-run when reference prop changes

	const stages = reference ? STAGES.reference : STAGES.prompt;

	const currentStage = stages[stageIndex] ?? stages[stages.length - 1];
	const progress = ((stageIndex + 1) / stages.length) * 100;

	return (
		<div className="mt-6 p-6 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 animate-form-enter">
			<div className="flex items-center justify-center gap-3 mb-4">
				<div className="animate-spin h-5 w-5 border-2 border-stone-900 dark:border-stone-100 border-t-transparent rounded-full" />
				<div className="text-sm text-stone-600 dark:text-stone-400 font-medium">
					{currentStage.text}
				</div>
			</div>

			{/* Progress bar */}
			<div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2 overflow-hidden">
				<div
					className="bg-stamp-blue dark:bg-stamp-blue h-full rounded-full transition-all duration-500 ease-out"
					style={{ width: `${progress}%` }}
				/>
			</div>

			{/* Stage dots */}
			<div className="flex justify-center gap-2 mt-3">
				{stages.map((stage, index) => (
					<div
						key={stage.id}
						className={`h-1.5 rounded-full transition-all duration-300 ${
							index <= stageIndex
								? "bg-stamp-blue dark:bg-stamp-blue w-6"
								: "bg-stone-300 dark:bg-stone-600 w-3"
						}`}
					/>
				))}
			</div>
		</div>
	);
}
