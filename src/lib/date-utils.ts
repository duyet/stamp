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
 * Format seconds as MM:SS countdown
 * @param seconds - Number of seconds
 * @returns Formatted time string (e.g., "02:30")
 */
export function formatCountdown(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}
