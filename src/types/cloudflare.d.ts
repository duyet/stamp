/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
	DB: D1Database;
	STAMPS_BUCKET: R2Bucket;
	AI: Ai;
	AGENTSTATE_API_KEY?: string;
	ADMIN_USER_IDS?: string;
}

declare namespace Cloudflare {
	interface Env extends CloudflareEnv {}
}
