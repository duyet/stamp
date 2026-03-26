import { createFileRoute } from "@tanstack/react-router";
import { listConversations, searchConversations } from "@/lib/agentstate";
import { getAuthUserId } from "@/lib/clerk";
import { getEnv } from "@/lib/env";

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

export async function GET(request: Request): Promise<Response> {
	const { userId } = await getAuthUserId(request.headers);
	if (!userId) {
		return jsonResponse({ error: "Unauthorized" }, 401);
	}

	const env = getEnv();
	const apiKey = env.AGENTSTATE_API_KEY;
	if (!apiKey) {
		return jsonResponse({ error: "AgentState not configured" }, 503);
	}

	const url = new URL(request.url);
	const query = url.searchParams.get("q");
	const limit = Number(url.searchParams.get("limit") || "20");
	const cursor = url.searchParams.get("cursor") ?? undefined;

	try {
		if (query) {
			const result = await searchConversations(apiKey, query, limit);
			return jsonResponse(result);
		}

		const result = await listConversations(apiKey, {
			limit,
			cursor,
			tag: `user:${userId}`,
		});
		return jsonResponse(result);
	} catch (error) {
		console.error("Conversations fetch failed:", error);
		return jsonResponse({ error: "Failed to fetch conversations" }, 500);
	}
}

export const Route = createFileRoute("/api/conversations")({
	server: {
		handlers: {
			GET: ({ request }) => GET(request),
		},
	},
});
