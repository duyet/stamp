import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { StampDetailClient } from "@/components/stamp-detail-client";
import { getDb } from "@/db";
import { type PublicStamp, stamps } from "@/db/schema";

// Explicit column selection — never expose PII fields (userIp, userAgent, referrer, location)
const publicStampColumns = {
	id: stamps.id,
	prompt: stamps.prompt,
	enhancedPrompt: stamps.enhancedPrompt,
	description: stamps.description,
	imageUrl: stamps.imageUrl,
	style: stamps.style,
	isPublic: stamps.isPublic,
	createdAt: stamps.createdAt,
} as const;

const fetchStamp = createServerFn({ method: "GET" })
	.inputValidator((id: string) => id)
	.handler(async ({ data: id }): Promise<PublicStamp | null> => {
		const db = getDb();
		const stamp = await db
			.select(publicStampColumns)
			.from(stamps)
			.where(and(eq(stamps.id, id), eq(stamps.isPublic, true)))
			.get();
		return stamp ?? null;
	});

export const Route = createFileRoute("/stamps/$id")({
	loader: async ({ params }) => {
		const stamp = await fetchStamp({ data: params.id });
		if (!stamp) {
			throw notFound();
		}
		return { stamp };
	},
	head: ({ loaderData }) => {
		if (!loaderData?.stamp) {
			return { meta: [{ title: "Stamp Not Found" }] };
		}
		const { stamp } = loaderData;
		const title = stamp.description || stamp.prompt;
		const description = `AI-generated postage stamp: ${stamp.prompt} (${stamp.style} style)`;
		return {
			meta: [
				{ title: `${title} — Stamp` },
				{ name: "description", content: description },
				{ property: "og:title", content: title },
				{ property: "og:description", content: description },
				{
					property: "og:image",
					content: stamp.imageUrl,
				},
				{ name: "twitter:card", content: "summary_large_image" },
				{ name: "twitter:title", content: title },
				{ name: "twitter:description", content: description },
				{ name: "twitter:image", content: stamp.imageUrl },
			],
		};
	},
	component: StampDetailPage,
	notFoundComponent: StampNotFound,
});

function StampDetailPage() {
	const { stamp } = Route.useLoaderData();
	return <StampDetailClient stamp={stamp} />;
}

function StampNotFound() {
	return (
		<div className="max-w-md mx-auto px-4 py-20 text-center">
			<h2 className="text-2xl font-semibold text-stone-900 mb-3">
				Stamp not found
			</h2>
			<p className="text-stone-600 text-sm mb-6">
				This stamp may have been removed or made private.
			</p>
		</div>
	);
}
