/**
 * API utilities for consistent response handling
 */

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
