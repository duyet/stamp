/**
 * Authorization utilities for stamp operations.
 */

import { getEnv } from "@/lib/env";

/**
 * Check if a user is an admin. Fail-closed: if no admin allowlist is configured,
 * no one is admin. Uses ADMIN_USER_IDS and ADMIN_EMAILS env vars.
 */
export function isAdmin(userId: string, email?: string | null): boolean {
	const env = getEnv();
	const rawUserIds = (env.ADMIN_USER_IDS as string | undefined) ?? "";
	const rawEmails = (env.ADMIN_EMAILS as string | undefined) ?? "";
	const adminIds = rawUserIds
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	const adminEmails = rawEmails
		.split(",")
		.map((s) => s.trim().toLowerCase())
		.filter(Boolean);

	// Fail-closed: no admin allowlist configured = no admins
	if (adminIds.length === 0 && adminEmails.length === 0) {
		return false;
	}

	const normalizedEmail = email?.trim().toLowerCase();
	return (
		(userId.length > 0 && adminIds.includes(userId)) ||
		(!!normalizedEmail && adminEmails.includes(normalizedEmail))
	);
}

/**
 * Check if a requester is authorized to modify a stamp.
 *
 * Priority: userId match > sessionToken match > IP match (legacy fallback)
 *
 * @param stamp - The stamp to check authorization for
 * @param requester - The requester's userId, sessionToken, and/or IP
 * @returns true if the requester can modify the stamp
 */
export function canModifyStamp(
	stamp: {
		userId?: string | null;
		userIp?: string | null;
		sessionToken?: string | null;
	},
	requester: {
		userId?: string | null;
		userIp?: string | null;
		sessionToken?: string | null;
	},
): boolean {
	// Authenticated user: check userId
	if (requester.userId && stamp.userId && stamp.userId === requester.userId) {
		return true;
	}

	// Session token: per-browser ownership (more reliable than IP)
	if (
		stamp.sessionToken &&
		requester.sessionToken &&
		stamp.sessionToken === requester.sessionToken
	) {
		return true;
	}

	// Legacy fallback: hashed IP-based ownership check.
	// IPs are stored as SHA-256 hashes for privacy. Matching on hashes
	// is vulnerable to shared IPs (NAT/VPN/proxy) — session tokens preferred.
	if (stamp.userIp && requester.userIp && stamp.userIp === requester.userIp) {
		return true;
	}

	return false;
}
