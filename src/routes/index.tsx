import { createFileRoute } from "@tanstack/react-router";
import { HomeContent } from "@/components/home-content";

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{
				title: "stamp.builders — AI Stamp Generator",
			},
			{
				name: "description",
				content:
					"Create unique vintage postage stamps with AI. Describe your vision and get beautiful folk art stamp illustrations. Free, no account needed.",
			},
		],
	}),
	component: HomePage,
});

function HomePage() {
	return <HomeContent />;
}
