/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
	DB: D1Database;
	STAMPS_BUCKET: R2Bucket;
	AI: Ai;
	AGENTSTATE_API_KEY?: string;
	ADMIN_EMAILS?: string;
	ADMIN_USER_IDS?: string;
	CLOUDFLARE_ACCOUNT_ID?: string;
	CLOUDFLARE_API_TOKEN?: string;
}

declare namespace Cloudflare {
	interface Env extends CloudflareEnv {}
}

interface AiModels {
	"@cf/qwen/qwen3-4b-fp8": AiModels["@cf/qwen/qwen3-30b-a3b-fp8"];
}
