/**
 * Authorization utilities for stamp operations.
 */

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
