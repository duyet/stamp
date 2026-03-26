import { createFileRoute } from "@tanstack/react-router";
import { GeneratePageClient } from "@/app/generate/generate-page-client";

export const Route = createFileRoute("/generate")({
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
	return <GeneratePageClient />;
}
