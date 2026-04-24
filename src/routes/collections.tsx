import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import CollectionsPage, {
	COLLECTIONS_PAGE_SIZE,
} from "@/components/collections-page";
import { fetchPublicStamps } from "@/lib/public-stamps";
import { STAMP_STYLE_PRESETS, type StampStyle } from "@/lib/stamp-prompts";

interface CollectionsSearch {
	style?: StampStyle;
}

const fetchCollectionStamps = createServerFn({ method: "GET" })
	.inputValidator((style?: StampStyle) => style)
	.handler(({ data: style }) =>
		fetchPublicStamps({ limit: COLLECTIONS_PAGE_SIZE, style }),
	);

function isStampStyle(value: unknown): value is StampStyle {
	return typeof value === "string" && Object.hasOwn(STAMP_STYLE_PRESETS, value);
}

export const Route = createFileRoute("/collections")({
	validateSearch: (search: Record<string, unknown>): CollectionsSearch => ({
		style: isStampStyle(search.style) ? search.style : undefined,
	}),
	loaderDeps: ({ search: { style } }) => ({ style }),
	loader: ({ deps: { style } }) => fetchCollectionStamps({ data: style }),
	head: () => ({
		meta: [
			{ title: "Collections — stamp.builders" },
			{
				name: "description",
				content: "Browse AI-generated postage stamps created by the community.",
			},
		],
	}),
	component: CollectionsRoute,
});

function CollectionsRoute() {
	const search = Route.useSearch();
	const data = Route.useLoaderData();

	return (
		<CollectionsPage initialStyle={search.style ?? "all"} initialData={data} />
	);
}
