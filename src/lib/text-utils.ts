/**
 * Text manipulation utilities.
 */

/**
 * Capitalize the first character of a string.
 * @param s - The string to capitalize
 * @returns The capitalized string, or empty string if input is falsy/empty
 */
export function capitalize(s: string): string {
	const trimmed = s.trim();
	if (!trimmed) return "";
	return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
