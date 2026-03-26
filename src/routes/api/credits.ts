import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "@/db";
import { withSecurityHeaders } from "@/lib/api-utils";
import { getAuthUserId } from "@/lib/clerk";
import { getCreditsInfo } from "@/lib/credits";

function jsonResponse(
	data: unknown,
	status = 200,
	headers?: Record<string, string>,
): Response {
	return withSecurityHeaders(
		new Response(JSON.stringify(data), {
			status,
			headers: { "Content-Type": "application/json", ...headers },
		}),
	);
}

export async function GET(_request: Request): Promise<Response> {
	const { userId } = await getAuthUserId();

	if (!userId) {
		return jsonResponse({ error: "Authentication required." }, 401);
	}

	const db = getDb();
	const credits = await getCreditsInfo(db, userId);

	// Private cache only — credits are per-user, public/s-maxage would let CDN
	// serve User A's balance to User B on the same edge node.
	return jsonResponse(credits, 200, {
		"Cache-Control": "private, max-age=30, stale-while-revalidate=60",
	});
}

export const Route = createFileRoute("/api/credits")({
	server: {
		handlers: {
			GET: ({ request }) => GET(request),
		},
	},
});
