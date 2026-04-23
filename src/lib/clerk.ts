/**
 * Clerk authentication helpers for TanStack Start.
 *
 * Uses @clerk/tanstack-react-start/server which reads auth state
 * from the clerkMiddleware() context automatically.
 */

import { auth } from "@clerk/tanstack-react-start/server";

/**
 * Get the authenticated userId from the current request context.
 *
 * Relies on clerkMiddleware() configured in src/start.ts.
 * The middleware verifies the session token and makes auth state
 * available via async context.
 *
 * @returns Object with userId (null if unauthenticated)
 */
export async function getAuthUserId(): Promise<{ userId: string | null }> {
	const session = await auth();
	return { userId: session.userId ?? null };
}
