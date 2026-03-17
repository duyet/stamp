/**
 * Extract the client IP from request headers using Cloudflare's
 * cf-connecting-ip header only.
 *
 * IMPORTANT: We do NOT fall back to x-forwarded-for as it can be spoofed.
 * Cloudflare's cf-connecting-ip is the only trusted source behind their proxy.
 */
export function getClientIp(headers: Headers, fallback?: string): string;
export function getClientIp(headers: Headers, fallback: null): string | null;
export function getClientIp(
	headers: Headers,
	fallback: string | null = "unknown",
): string | null {
	return headers.get("cf-connecting-ip") || fallback;
}
