/**
 * Date formatting utilities
 * Centralized date formatting for consistency across the application
 */

type DateInput = Date | number;

/**
 * Convert Date or timestamp to Date object
 */
function toDate(input: DateInput): Date {
	return input instanceof Date ? input : new Date(input);
}

/**
 * Format a timestamp as a short date (e.g., "Jan 15")
 * @param ts - Unix timestamp in milliseconds or Date object
 * @returns Formatted date string
 */
export function formatDateShort(ts: DateInput): string {
	return toDate(ts).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
}

/**
 * Format a timestamp as a long date (e.g., "January 15, 2024")
 * @param ts - Unix timestamp in milliseconds or Date object
 * @returns Formatted date string
 */
export function formatDateLong(ts: DateInput): string {
	return toDate(ts).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

/**
 * Format a timestamp as a relative time (e.g., "2 hours ago")
 * @param ts - Unix timestamp in milliseconds or Date object
 * @returns Relative time string
 */
export function formatRelativeTime(ts: DateInput): string {
	const now = Date.now();
	const timestamp = toDate(ts).getTime();
	const diff = now - timestamp;
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) {
		return `${days} day${days > 1 ? "s" : ""} ago`;
	}
	if (hours > 0) {
		return `${hours} hour${hours > 1 ? "s" : ""} ago`;
	}
	if (minutes > 0) {
		return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
	}
	return "Just now";
}

/**
 * Format seconds as MM:SS countdown
 * @param seconds - Number of seconds
 * @returns Formatted time string (e.g., "02:30")
 */
export function formatCountdown(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}
