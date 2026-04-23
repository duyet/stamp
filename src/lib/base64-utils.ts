/**
 * Base64 encoding/decoding utilities
 * Shared across client and server for consistent data handling
 */

/**
 * Convert base64 string to Uint8Array
 * Handles standard base64 without data URL prefix
 */
export function base64ToUint8Array(base64: string): Uint8Array {
	const binaryString = atob(base64);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes;
}
