import { env } from "cloudflare:workers";

/**
 * Get Cloudflare bindings in server context.
 */
export function getEnv(): CloudflareEnv {
	return env as unknown as CloudflareEnv;
}
