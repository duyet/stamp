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

export async function createConversation(
	apiKey: string,
	params: {
		external_id?: string;
		title?: string;
		metadata?: Record<string, unknown>;
		messages: AgentStateMessage[];
	},
): Promise<AgentStateConversation> {
	const res = await fetch(`${BASE_URL}/conversations`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify(params),
	});
	if (!res.ok) throw new Error(`AgentState error: ${res.status}`);
	return res.json() as Promise<AgentStateConversation>;
}

export async function appendMessages(
	apiKey: string,
	conversationId: string,
	messages: AgentStateMessage[],
): Promise<void> {
	const res = await fetch(
		`${BASE_URL}/conversations/${conversationId}/messages`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({ messages }),
		},
	);
	if (!res.ok) throw new Error(`AgentState error: ${res.status}`);
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
	const res = await fetch(url.toString(), {
		headers: { Authorization: `Bearer ${apiKey}` },
	});
	if (!res.ok) throw new Error(`AgentState error: ${res.status}`);
	return res.json() as Promise<{
		data: AgentStateConversation[];
		pagination: { next_cursor: string | null };
	}>;
}

export async function getConversation(
	apiKey: string,
	id: string,
): Promise<AgentStateConversation> {
	const res = await fetch(`${BASE_URL}/conversations/${id}`, {
		headers: { Authorization: `Bearer ${apiKey}` },
	});
	if (!res.ok) throw new Error(`AgentState error: ${res.status}`);
	return res.json() as Promise<AgentStateConversation>;
}

export async function searchConversations(
	apiKey: string,
	query: string,
	limit = 20,
): Promise<{ data: AgentStateSearchResult[] }> {
	const url = new URL(`${BASE_URL}/conversations/search`);
	url.searchParams.set("q", query);
	url.searchParams.set("limit", String(limit));
	const res = await fetch(url.toString(), {
		headers: { Authorization: `Bearer ${apiKey}` },
	});
	if (!res.ok) throw new Error(`AgentState error: ${res.status}`);
	return res.json() as Promise<{ data: AgentStateSearchResult[] }>;
}

export async function addTags(
	apiKey: string,
	conversationId: string,
	tags: string[],
): Promise<void> {
	const res = await fetch(`${BASE_URL}/conversations/${conversationId}/tags`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({ tags }),
	});
	if (!res.ok) throw new Error(`AgentState error: ${res.status}`);
}
