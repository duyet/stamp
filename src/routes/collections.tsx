import { createFileRoute } from "@tanstack/react-router";
import CollectionsPage from "@/components/collections-page";

export const Route = createFileRoute("/collections")({
	head: () => ({
		meta: [
			{ title: "Collections — stamp.builders" },
			{
				name: "description",
				content: "Browse AI-generated postage stamps created by the community.",
			},
		],
	}),
	component: CollectionsPage,
});
