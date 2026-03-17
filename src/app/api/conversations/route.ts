import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { listConversations, searchConversations } from "@/lib/agentstate";
import { getEnv } from "@/lib/env";

export async function GET(request: Request) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const env = getEnv();
	const apiKey = env.AGENTSTATE_API_KEY;
	if (!apiKey) {
		return NextResponse.json(
			{ error: "AgentState not configured" },
			{ status: 503 },
		);
	}

	const url = new URL(request.url);
	const query = url.searchParams.get("q");
	const limit = Number(url.searchParams.get("limit") || "20");
	const cursor = url.searchParams.get("cursor") ?? undefined;

	try {
		if (query) {
			const result = await searchConversations(apiKey, query, limit);
			return NextResponse.json(result);
		}

		const result = await listConversations(apiKey, {
			limit,
			cursor,
			tag: `user:${userId}`,
		});
		return NextResponse.json(result);
	} catch (error) {
		console.error("Conversations fetch failed:", error);
		return NextResponse.json(
			{ error: "Failed to fetch conversations" },
			{ status: 500 },
		);
	}
}
