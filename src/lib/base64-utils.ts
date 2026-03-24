/**
 * Base64 encoding/decoding utilities
 * Shared across client and server for consistent data handling
 */

/**
 * Convert Uint8Array to base64 string
 * Handles large arrays without stack overflow
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
	// Use direct loop to avoid intermediate array allocation for large images
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

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

/**
 * Convert base64 data URL to Uint8Array
 * Handles "data:image/png;base64," prefix
 */
export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
	const base64 = dataUrl.split(",", 2)[1];
	if (!base64) {
		throw new Error("Invalid data URL format");
	}
	return base64ToUint8Array(base64);
}

/**
 * Convert Blob to base64 data URL
 * Uses FileReader API
 */
export function blobToBase64(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result;
			if (typeof result === "string") {
				resolve(result);
			} else {
				reject(new Error("Failed to convert blob to base64"));
			}
		};
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(blob);
	});
}

/**
 * Convert Uint8Array to data URL
 * Requires mimeType parameter
 */
export function uint8ArrayToDataUrl(
	bytes: Uint8Array,
	mimeType: string,
): string {
	const base64 = uint8ArrayToBase64(bytes);
	return `data:${mimeType};base64,${base64}`;
}
