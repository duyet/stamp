/// <reference types="@cloudflare/workers-types" />

declare global {
	interface CloudflareEnv {
		DB: D1Database;
		STAMPS_BUCKET: R2Bucket;
		GEMINI_API_KEY: string;
	}
}

export {};
