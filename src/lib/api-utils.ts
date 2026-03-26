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
 * Create a standardized error response
 * Provides consistent error format across all API routes
 *
 * @param message - Error message to return to client
 * @param status - HTTP status code (default: 400)
 * @returns NextResponse with error payload
 */
export function apiErrorResponse(
	message: string,
	status: number = 400,
): Response {
	return Response.json({ error: message }, { status });
}

/**
 * Create a success response with data
 * Provides consistent success format across all API routes
 *
 * @param data - Response data to return to client
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with data payload
 */
export function apiSuccessResponse(
	data: unknown,
	status: number = 200,
): Response {
	return Response.json(data, { status });
}

/**
 * Create a JSON response with security headers.
 * Consolidates the per-route jsonResponse helpers into one shared function.
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
