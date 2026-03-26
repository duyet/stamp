/**
 * Authorization utilities for stamp operations.
 */

import { getEnv } from "@/lib/env";

/**
 * Check if a user is an admin. Fail-closed: if no admin list is configured,
 * no one is admin. Uses ADMIN_USER_IDS env var (comma-separated Clerk user IDs).
 */
export function isAdmin(userId: string): boolean {
	const env = getEnv();
	const raw = (env.ADMIN_USER_IDS as string | undefined) ?? "";
	const adminIds = raw
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);

	// Fail-closed: no admin list configured = no admins
	if (adminIds.length === 0) {
		return false;
	}

	return adminIds.includes(userId);
}

/**
 * Check if a requester is authorized to modify a stamp.
 *
 * Priority: userId match (most secure) > IP match (fallback for anonymous)
 *
 * @param stamp - The stamp to check authorization for
 * @param requester - The requester's userId and/or IP
 * @returns true if the requester can modify the stamp
 */
export function canModifyStamp(
	stamp: { userId?: string | null; userIp?: string | null },
	requester: { userId?: string | null; userIp?: string | null },
): boolean {
	// Authenticated user: check userId
	if (requester.userId && stamp.userId && stamp.userId === requester.userId) {
		return true;
	}

	// Anonymous: check IP (less secure, but necessary for anonymous users)
	if (
		!requester.userId &&
		stamp.userIp &&
		requester.userIp &&
		stamp.userIp === requester.userIp
	) {
		return true;
	}

	return false;
}
