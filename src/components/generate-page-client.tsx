import { useEffect } from "react";
import { GenerateForm } from "@/components/generate-form";
import { useTrack } from "@/hooks/use-track";
import type { StampStyle } from "@/lib/stamp-prompts";

interface GeneratePageClientProps {
	initialPrompt?: string;
	initialStyle?: StampStyle;
}

export function GeneratePageClient({
	initialPrompt,
	initialStyle,
}: GeneratePageClientProps) {
	const { track } = useTrack();

	useEffect(() => {
		track("page_view", { context: "generate" });
	}, [track]);

	return (
		<div className="mx-auto max-w-6xl animate-page-fade-in px-4 py-8 sm:px-6 sm:py-12">
			<div className="mb-7 max-w-2xl">
				<h1 className="font-stamp text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl md:text-5xl">
					Create your stamp
				</h1>
				<p className="mt-3 max-w-xl text-sm leading-6 text-stone-600 sm:text-base">
					Upload a reference image, choose a print style, then add a short
					prompt for the final stamp.
				</p>
			</div>
			<GenerateForm initialPrompt={initialPrompt} initialStyle={initialStyle} />
		</div>
	);
}
