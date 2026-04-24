import { createFileRoute } from "@tanstack/react-router";
import { GeneratePageClient } from "@/components/generate-page-client";
import { STAMP_STYLE_PRESETS, type StampStyle } from "@/lib/stamp-prompts";

interface GenerateSearch {
	prompt?: string;
	style?: StampStyle;
}

function isStampStyle(value: unknown): value is StampStyle {
	return typeof value === "string" && Object.hasOwn(STAMP_STYLE_PRESETS, value);
}

export const Route = createFileRoute("/generate")({
	validateSearch: (search: Record<string, unknown>): GenerateSearch => ({
		prompt: typeof search.prompt === "string" ? search.prompt : undefined,
		style: isStampStyle(search.style) ? search.style : undefined,
	}),
	head: () => ({
		meta: [
			{ title: "Create a Stamp — stamp.builders" },
			{
				name: "description",
				content: "Generate a unique AI-powered postage stamp illustration.",
			},
		],
	}),
	component: GeneratePage,
});

function GeneratePage() {
	const search = Route.useSearch();

	return (
		<GeneratePageClient
			initialPrompt={search.prompt}
			initialStyle={search.style}
		/>
	);
}
