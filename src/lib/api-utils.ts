/**
 * API utilities for consistent response handling
 */

/** Allowed origins for CORS — only the production domain and Workers dev URL. */
const ALLOWED_ORIGINS = new Set([
	"https://stamp.duyet.net",
	"https://stamp.duyet.workers.dev",
]);

/**
 * Resolve the allowed origin from the request Origin header.
 * Returns the origin if it's in our allowlist, otherwise null.
 */
function getAllowedOrigin(request: Request): string | null {
	const origin = request.headers.get("Origin");
	if (origin && ALLOWED_ORIGINS.has(origin)) {
		return origin;
	}
	return null;
}

/** Maximum request body size (15 MB) — checked before parsing JSON. */
export const MAX_REQUEST_BODY_SIZE = 15 * 1024 * 1024;

/**
 * Reject requests with bodies that exceed the size limit.
 * Call this *before* `request.json()` to avoid buffering huge payloads.
 */
export function checkBodySize(request: Request): Response | null {
	const contentLength = Number(request.headers.get("content-length") || 0);
	if (contentLength > MAX_REQUEST_BODY_SIZE) {
		return jsonResponse({ error: "Request too large" }, 413);
	}
	return null;
}

const SECURITY_HEADERS: Record<string, string> = {
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"Referrer-Policy": "strict-origin",
	"Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
	"Content-Security-Policy": [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://clerk.stamp.duyet.net",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"font-src 'self' https://fonts.gstatic.com",
		"img-src 'self' data: blob: https://img.clerk.com https://*.clerk.com https://images.unsplash.com",
		"connect-src 'self' https://agentstate.app https://*.clerk.com https://clerk.stamp.duyet.net https://challenges.cloudflare.com",
		"frame-src https://challenges.cloudflare.com https://*.clerk.com",
	].join("; "),
	"Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
};

/**
 * Add standard security + CORS headers to an existing Response.
 * If an Origin header is present and matches our allowlist, CORS headers are added.
 */
export function withSecurityHeaders(
	response: Response,
	request?: Request,
): Response {
	for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
		response.headers.set(key, value);
	}

	if (request) {
		const allowedOrigin = getAllowedOrigin(request);
		if (allowedOrigin) {
			response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
			response.headers.set(
				"Access-Control-Allow-Methods",
				"GET, POST, PATCH, OPTIONS",
			);
			response.headers.set(
				"Access-Control-Allow-Headers",
				"Content-Type, Authorization",
			);
			response.headers.set("Access-Control-Max-Age", "86400");
		}
	}

	return response;
}

/**
 * Handle CORS preflight (OPTIONS) requests.
 * Returns 204 with CORS headers if the origin is allowed, 403 otherwise.
 */
export function handleCorsPreflight(request: Request): Response {
	const allowedOrigin = getAllowedOrigin(request);
	if (!allowedOrigin) {
		return new Response(null, { status: 403 });
	}
	return withSecurityHeaders(
		new Response(null, {
			status: 204,
			headers: {
				"Access-Control-Allow-Origin": allowedOrigin,
				"Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type, Authorization",
				"Access-Control-Max-Age": "86400",
			},
		}),
	);
}

/**
 * Create a JSON response with security + CORS headers.
 * Consolidates the per-route jsonResponse helpers into one shared function.
 *
 * @param data - Response data to return to client
 * @param status - HTTP status code (default: 200)
 * @param headers - Optional headers to add
 * @param request - Optional request for CORS origin resolution
 * @returns Response with security + CORS headers
 */
export function jsonResponse(
	data: unknown,
	status = 200,
	headers?: HeadersInit,
	request?: Request,
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
		request,
	);
}
