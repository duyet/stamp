/**
 * Extract the client IP from request headers using Cloudflare's
 * cf-connecting-ip, falling back to x-forwarded-for, then a default.
 */
export function getClientIp(headers: Headers, fallback?: string): string;
export function getClientIp(headers: Headers, fallback: null): string | null;
export function getClientIp(
	headers: Headers,
	fallback: string | null = "unknown",
): string | null {
	return (
		headers.get("cf-connecting-ip") ||
		headers.get("x-forwarded-for") ||
		fallback
	);
}
