/**
 * Session cookie utilities for anonymous stamp ownership.
 *
 * Cookie name: stamp_session
 * Flags: HttpOnly, Secure, SameSite=Lax, Path=/
 * Max-Age: 1 year (31536000 seconds)
 */

export const SESSION_COOKIE_NAME = "stamp_session";
const SESSION_MAX_AGE = 31536000; // 1 year in seconds

/** Shared cookie attributes for Set-Cookie header. */
export const sessionCookieAttributes = [
	`Max-Age=${SESSION_MAX_AGE}`,
	"Path=/",
	"HttpOnly",
	"Secure",
	"SameSite=Lax",
].join("; ");

/**
 * Generate a new session token using crypto.randomUUID().
 * 128-bit entropy, cryptographically random.
 */
export function createSessionToken(): string {
	return crypto.randomUUID();
}

/**
 * Read the stamp_session cookie from a Request.
 * Returns the token string or null if not present.
 */
export function getSessionToken(request: Request): string | null {
	const cookieHeader = request.headers.get("cookie");
	if (!cookieHeader) return null;

	const cookies = cookieHeader.split(";");
	for (const cookie of cookies) {
		const trimmed = cookie.trim();
		if (trimmed.startsWith(`${SESSION_COOKIE_NAME}=`)) {
			return trimmed.slice(SESSION_COOKIE_NAME.length + 1) || null;
		}
	}
	return null;
}

/**
 * Build a Set-Cookie header value for the session token.
 */
export function buildSetCookieHeader(token: string): string {
	return `${SESSION_COOKIE_NAME}=${token}; ${sessionCookieAttributes}`;
}
