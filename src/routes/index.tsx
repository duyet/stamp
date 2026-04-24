import { createFileRoute } from "@tanstack/react-router";
import { HomeContent } from "@/components/home-content";

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{
				title: "stamp.builders — AI Stamp Showcase and Generator",
			},
			{
				name: "description",
				content:
					"Browse a live wall of AI-made postage stamps, then write your own prompt to turn memory, place, or mood into a collectible print.",
			},
		],
	}),
	component: HomePage,
});

function HomePage() {
	return <HomeContent />;
}
