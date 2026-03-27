/**
 * API utilities for consistent response handling
 */

const SECURITY_HEADERS: Record<string, string> = {
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"Referrer-Policy": "strict-origin-when-cross-origin",
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
	return withSecurityHeaders(
		new Response(JSON.stringify(data), {
			status,
			headers: { "Content-Type": "application/json", ...headers },
		}),
	);
}
