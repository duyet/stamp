const BASE_URL = "https://agentstate.app/api/v1";

export interface AgentStateMessage {
	role: "system" | "user" | "assistant" | "tool";
	content: string;
	metadata?: Record<string, unknown>;
}

export interface AgentStateConversation {
	id: string;
	external_id: string | null;
	title: string;
	metadata: Record<string, unknown>;
	message_count: number;
	token_count: number;
	created_at: number;
	updated_at: number;
	messages?: Array<{
		id: string;
		role: string;
		content: string;
		metadata: Record<string, unknown> | null;
		created_at: number;
	}>;
}

export interface AgentStateSearchResult {
	id: string;
	title: string;
	snippet: string;
	message_count: number;
}

async function agentStateFetch(
	url: string,
	apiKey: string,
	init?: RequestInit,
): Promise<Response> {
	const res = await fetch(url, {
		...init,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
			...init?.headers,
		},
	});
	if (!res.ok) {
		const body = await res.text().catch(() => "");
		throw new Error(
			`AgentState ${init?.method ?? "GET"} ${url} → ${res.status}: ${body.slice(0, 200)}`,
		);
	}
	return res;
}

export async function createConversation(
	apiKey: string,
	params: {
		external_id?: string;
		title?: string;
		metadata?: Record<string, unknown>;
		messages: AgentStateMessage[];
	},
): Promise<AgentStateConversation> {
	const res = await agentStateFetch(`${BASE_URL}/conversations`, apiKey, {
		method: "POST",
		body: JSON.stringify(params),
	});
	return res.json() as Promise<AgentStateConversation>;
}

export async function appendMessages(
	apiKey: string,
	conversationId: string,
	messages: AgentStateMessage[],
): Promise<void> {
	await agentStateFetch(
		`${BASE_URL}/conversations/${conversationId}/messages`,
		apiKey,
		{
			method: "POST",
			body: JSON.stringify({ messages }),
		},
	);
}

export async function listConversations(
	apiKey: string,
	params?: { limit?: number; cursor?: string; tag?: string },
): Promise<{
	data: AgentStateConversation[];
	pagination: { next_cursor: string | null };
}> {
	const url = new URL(`${BASE_URL}/conversations`);
	if (params?.limit) url.searchParams.set("limit", String(params.limit));
	if (params?.cursor) url.searchParams.set("cursor", params.cursor);
	if (params?.tag) url.searchParams.set("tag", params.tag);
	const res = await agentStateFetch(url.toString(), apiKey);
	return res.json() as Promise<{
		data: AgentStateConversation[];
		pagination: { next_cursor: string | null };
	}>;
}

export async function getConversation(
	apiKey: string,
	id: string,
): Promise<AgentStateConversation> {
	const res = await agentStateFetch(`${BASE_URL}/conversations/${id}`, apiKey);
	return res.json() as Promise<AgentStateConversation>;
}

export async function searchConversations(
	apiKey: string,
	query: string,
	limit = 20,
	tag?: string,
): Promise<{ data: AgentStateSearchResult[] }> {
	const url = new URL(`${BASE_URL}/conversations/search`);
	url.searchParams.set("q", query);
	url.searchParams.set("limit", String(limit));
	if (tag) url.searchParams.set("tag", tag);
	const res = await agentStateFetch(url.toString(), apiKey);
	return res.json() as Promise<{ data: AgentStateSearchResult[] }>;
}

export async function addTags(
	apiKey: string,
	conversationId: string,
	tags: string[],
): Promise<void> {
	await agentStateFetch(
		`${BASE_URL}/conversations/${conversationId}/tags`,
		apiKey,
		{
			method: "POST",
			body: JSON.stringify({ tags }),
		},
	);
}
