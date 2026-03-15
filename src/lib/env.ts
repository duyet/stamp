import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Get Cloudflare bindings in server components/route handlers.
 * Synchronous for dynamic routes (the common case).
 */
export function getEnv(): CloudflareEnv {
	const { env } = getCloudflareContext();
	return env as unknown as CloudflareEnv;
}
