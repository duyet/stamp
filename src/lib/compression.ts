import type { NextResponse } from "next/server";

/**
 * Compression middleware for large JSON responses.
 * Uses Cloudflare Workers' automatic Brotli compression.
 *
 * Simply add these headers to enable compression:
 * - Content-Encoding: handled automatically by CF Workers
 * - Vary: Accept-Encoding (ensures proper caching)
 */
export function addCompressionHeaders(
	response: NextResponse,
	contentType: "json" | "html" | "text" = "json",
): NextResponse {
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
export function shouldCompress(response: NextResponse): boolean {
	const contentLength = response.headers.get("Content-Length");
	if (!contentLength) return true; // Unknown size, compress to be safe
	return Number.parseInt(contentLength, 10) > 1024;
}
