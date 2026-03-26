/**
 * Compression middleware for large JSON responses.
 * Uses Cloudflare Workers' automatic Brotli compression.
 *
 * Simply add these headers to enable compression:
 * - Content-Encoding: handled automatically by CF Workers
 * - Vary: Accept-Encoding (ensures proper caching)
 */
export function addCompressionHeaders(
	response: Response,
	contentType: "json" | "html" | "text" = "json",
): Response {
	// Cloudflare Workers automatically compress responses with these headers
	// No manual compression needed - just proper cache control
	response.headers.set("Vary", "Accept-Encoding");

	// Add content type specific optimizations
	if (contentType === "json") {
		response.headers.set(
			"Content-Type",
			response.headers.get("Content-Type") || "application/json",
		);
	}

	return response;
}

/**
 * Detect if response should be compressed based on content length.
 * Threshold: 1KB (responses smaller than this aren't worth compressing)
 */
export function shouldCompress(response: Response): boolean {
	const contentLength = response.headers.get("Content-Length");
	if (!contentLength) return true; // Unknown size, compress to be safe
	return Number.parseInt(contentLength, 10) > 1024;
}
