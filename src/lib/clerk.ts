/**
 * Clerk authentication helpers for TanStack Start.
 *
 * Uses @clerk/tanstack-react-start/server which reads auth state
 * from the clerkMiddleware() context automatically.
 */

import { auth, clerkClient } from "@clerk/tanstack-react-start/server";

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

function getEmailFromClaims(claims: unknown): string | null {
	if (!claims || typeof claims !== "object") return null;
	const record = claims as Record<string, unknown>;
	const email =
		record.email ??
		record.primary_email_address ??
		record.primaryEmailAddress ??
		record.email_address;
	return typeof email === "string" && email.trim().length > 0 ? email : null;
}

/**
 * Get the authenticated user's stable admin-check identifiers.
 *
 * The normal session token may not include email claims, so this falls back to
 * Clerk's backend user API only when an authenticated route needs email auth.
 */
export async function getAuthUserIdentity(): Promise<{
	userId: string | null;
	email: string | null;
}> {
	const session = await auth();
	const userId = session.userId ?? null;
	if (!userId) {
		return { userId: null, email: null };
	}

	const claimEmail = getEmailFromClaims(session.sessionClaims);
	if (claimEmail) {
		return { userId, email: claimEmail };
	}

	const user = await clerkClient().users.getUser(userId);
	return {
		userId,
		email:
			user.primaryEmailAddress?.emailAddress ??
			user.emailAddresses[0]?.emailAddress ??
			null,
	};
}
