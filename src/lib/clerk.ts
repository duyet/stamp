/**
 * Clerk session verification for Cloudflare Workers.
 *
 * Next.js middleware doesn't work with OpenNext + Cloudflare Workers.
 * Instead, we verify Clerk sessions directly using the Backend SDK.
 */

import { verifyToken } from "@clerk/backend";
import { getClerkSecretKey } from "@/lib/clerk-config";
import { sanitizeErrorForLogging } from "@/lib/sanitize-error";

/**
 * Verify a Clerk session token and return the userId.
 *
 * @param token - The session token from __session cookie or Authorization header
 * @returns The userId if valid, null otherwise
 */
export async function verifySessionToken(
	token: string,
): Promise<string | null> {
	try {
		const secretKey = getClerkSecretKey();
		if (!secretKey) {
			throw new Error("CLERK_SECRET_KEY is not set");
		}
		const payload = await verifyToken(token, { secretKey });
		return payload.sub as string;
	} catch (error) {
		console.error(
			"Clerk session verification failed",
			sanitizeErrorForLogging(error),
		);
		return null;
	}
}

/**
 * Extract the session token from a request.
 *
 * Looks for:
 * 1. Authorization header: "Bearer <token>"
 * 2. __session cookie
 *
 * @param requestHeaders - Headers from the incoming request
 * @returns The session token or null
 */
export function extractSessionToken(requestHeaders: Headers): string | null {
	// Try Authorization header first
	const authHeader = requestHeaders.get("authorization");
	if (authHeader?.startsWith("Bearer ")) {
		return authHeader.slice(7);
	}

	// Try __session cookie (Clerk's default session cookie name)
	const cookieHeader = requestHeaders.get("cookie");
	if (cookieHeader) {
		const cookies = cookieHeader.split(";").map((c) => c.trim());
		for (const cookie of cookies) {
			if (cookie.startsWith("__session=")) {
				return cookie.slice("__session=".length);
			}
		}
	}

	return null;
}

/**
 * Get the authenticated userId from a request.
 *
 * This is a drop-in replacement for Clerk's Next.js auth() function
 * that works in Cloudflare Workers without middleware.
 *
 * @param requestHeaders - Headers from the incoming request
 * @returns Object with userId (null if unauthenticated)
 */
export async function getAuthUserId(
	requestHeaders: Headers,
): Promise<{ userId: string | null }> {
	const token = extractSessionToken(requestHeaders);
	if (!token) {
		return { userId: null };
	}

	const userId = await verifySessionToken(token);
	return { userId };
}
