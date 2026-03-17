/// <reference types="@cloudflare/workers-types" />

declare global {
	interface CloudflareEnv {
		DB: D1Database;
		STAMPS_BUCKET: R2Bucket;
		AI: Ai;
		AGENTSTATE_API_KEY?: string;
	}
}

export {};
