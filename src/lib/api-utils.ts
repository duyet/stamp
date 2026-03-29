/**
 * API utilities for consistent response handling
 */

const SECURITY_HEADERS: Record<string, string> = {
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
	"Content-Security-Policy": [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://clerk.stamp.duyet.net",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"font-src 'self' https://fonts.gstatic.com",
		"img-src 'self' data: blob: https://img.clerk.com https://*.clerk.com https://images.unsplash.com",
		"connect-src 'self' https: https://agentstate.app https://*.clerk.com https://clerk.stamp.duyet.net https://challenges.cloudflare.com",
		"frame-src https://challenges.cloudflare.com https://*.clerk.com",
	].join("; "),
	"Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
};

/**
 * Add standard security headers to an existing Response.
 */
export function withSecurityHeaders(response: Response): Response {
	for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
		response.headers.set(key, value);
	}
	return response;
}

/**
 * Create a JSON response with security headers.
 * Consolidates the per-route jsonResponse helpers into one shared function.
 *
 * @param data - Response data to return to client
 * @param status - HTTP status code (default: 200)
 * @param headers - Optional headers to add
 * @returns Response with security headers
 */
export function jsonResponse(
	data: unknown,
	status = 200,
	headers?: HeadersInit,
): Response {
	const responseHeaders = new Headers(headers);
	if (!responseHeaders.has("Content-Type")) {
		responseHeaders.set("Content-Type", "application/json");
	}

	return withSecurityHeaders(
		new Response(JSON.stringify(data), {
			status,
			headers: responseHeaders,
		}),
	);
}
