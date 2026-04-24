import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { HomeContent } from "@/components/home-content";
import { fetchPublicStamps } from "@/lib/public-stamps";

const HOME_STAMP_LIMIT = 30;

const fetchHomeStamps = createServerFn({ method: "GET" }).handler(() =>
	fetchPublicStamps({ limit: HOME_STAMP_LIMIT }),
);

export const Route = createFileRoute("/")({
	loader: async () => {
		try {
			return await fetchHomeStamps();
		} catch (error) {
			console.error("Failed to load home stamps:", error);
			return undefined;
		}
	},
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
	const data = Route.useLoaderData();

	return <HomeContent initialData={data} />;
}
