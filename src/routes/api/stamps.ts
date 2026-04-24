import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse } from "@/lib/api-utils";
import { fetchPublicStamps } from "@/lib/public-stamps";

export async function GET(request: Request): Promise<Response> {
	try {
		const url = new URL(request.url);
		const limitParam = Number(url.searchParams.get("limit") || 50);
		const cursorParam = url.searchParams.get("cursor");
		const styleParam = url.searchParams.get("style");

		const responseData = await fetchPublicStamps({
			limit: limitParam,
			cursor: cursorParam,
			style: styleParam,
		});

		return jsonResponse(responseData, 200, {
			"Cache-Control":
				"public, max-age=60, stale-while-revalidate=300, stale-if-error=86400",
		});
	} catch (error) {
		console.error("Failed to fetch stamps:", error);
		return jsonResponse({ error: "Failed to fetch stamps." }, 500);
	}
}

export const Route = createFileRoute("/api/stamps")({
	server: {
		handlers: {
			GET: ({ request }) => GET(request),
		},
	},
});
