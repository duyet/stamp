import { createFileRoute } from "@tanstack/react-router";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { stamps } from "@/db/schema";
import { withSecurityHeaders } from "@/lib/api-utils";

const FALLBACK_FAVICON = "/stamp.png";

function faviconRedirect(location: string): Response {
	return withSecurityHeaders(
		new Response(null, {
			status: 302,
			headers: {
				Location: location,
				"Cache-Control": "public, max-age=300, stale-while-revalidate=600",
			},
		}),
	);
}

export async function GET(_request: Request): Promise<Response> {
	try {
		const db = getDb();
		const [latest] = await db
			.select({ id: stamps.id })
			.from(stamps)
			.where(eq(stamps.isPublic, true))
			.orderBy(desc(stamps.createdAt))
			.limit(1);

		if (!latest?.id) {
			return faviconRedirect(FALLBACK_FAVICON);
		}

		return faviconRedirect(
			`/api/stamps/${encodeURIComponent(latest.id)}/image`,
		);
	} catch (error) {
		console.error("Failed to resolve favicon stamp:", error);
		return faviconRedirect(FALLBACK_FAVICON);
	}
}

export const Route = createFileRoute("/api/favicon")({
	server: {
		handlers: {
			GET: ({ request }) => GET(request),
		},
	},
});
