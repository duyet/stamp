/**
 * Get Cloudflare bindings in server components/route handlers.
 * Uses @opennextjs/cloudflare to access D1, R2, etc.
 */
export async function getEnv(): Promise<CloudflareEnv> {
	const { getCloudflareContext } = await import("@opennextjs/cloudflare");
	const { env } = await getCloudflareContext();
	return env as unknown as CloudflareEnv;
}
