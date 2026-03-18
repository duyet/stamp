/**
 * Constants for image validation.
 */
import { IMAGE_CONSTANTS } from "./constants";

const MAX_REFERENCE_IMAGE_SIZE = IMAGE_CONSTANTS.MAX_UPLOAD_SIZE_BYTES; // 5MB
const MAX_BASE64_INPUT_LENGTH = 10 * 1024 * 1024; // 10MB base64 (inflated)

// PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
const PNG_MAGIC_BYTES = new Uint8Array([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
// JPEG magic bytes: FF D8 FF
const JPEG_MAGIC_BYTES = new Uint8Array([0xff, 0xd8, 0xff]);

import { base64ToUint8Array } from "./base64-utils";

/**
 * Validate and decode a base64 reference image.
 * Returns Uint8Array of image data or throws on error.
 *
 * @param referenceImageData - Base64-encoded image data (with or without data URL prefix)
 * @returns Uint8Array of decoded image data
 * @throws Error if validation fails (size, format, magic bytes, MIME type)
 */
export function validateReferenceImage(referenceImageData: string): Uint8Array {
	// Validate input length before decoding (base64 inflates by ~33%)
	if (referenceImageData.length > MAX_BASE64_INPUT_LENGTH) {
		throw new Error(
			`Reference image too large. Maximum size is ${MAX_REFERENCE_IMAGE_SIZE / 1024 / 1024}MB.`,
		);
	}

	// Extract base64 data from data URL if present
	let base64Data: string;
	let expectedMimeType: string | null = null;

	if (referenceImageData.includes(",")) {
		const [prefix, data] = referenceImageData.split(",", 2);
		base64Data = data;
		// Extract MIME type from data URL prefix (e.g., "data:image/png;base64")
		const mimeMatch = prefix.match(/data:([^;]+);base64/);
		if (mimeMatch) {
			expectedMimeType = mimeMatch[1];
		}
	} else {
		base64Data = referenceImageData;
	}

	// Validate base64 format (only valid base64 characters, minimum length)
	// Fixed: Empty string "" matches /[A-Za-z0-9+/]*={0,2}/ so we require minimum length
	if (!/^[A-Za-z0-9+/]{8,}={0,2}$/.test(base64Data)) {
		throw new Error("Invalid base64 format in reference image.");
	}

	// Decode base64 with error handling
	const binaryString = atob(base64Data);

	// Check decoded size
	if (binaryString.length > MAX_REFERENCE_IMAGE_SIZE) {
		throw new Error(
			`Reference image too large (${Math.round(binaryString.length / 1024 / 1024)}MB). Maximum size is ${MAX_REFERENCE_IMAGE_SIZE / 1024 / 1024}MB.`,
		);
	}

	// Validate image magic bytes for security
	const firstBytes = new Uint8Array(8);
	for (let i = 0; i < Math.min(8, binaryString.length); i++) {
		firstBytes[i] = binaryString.charCodeAt(i);
	}

	// Check PNG magic bytes (all 8 bytes: 89 50 4E 47 0D 0A 1A 0A)
	const isPng =
		firstBytes.length >= 8 &&
		firstBytes[0] === PNG_MAGIC_BYTES[0] &&
		firstBytes[1] === PNG_MAGIC_BYTES[1] &&
		firstBytes[2] === PNG_MAGIC_BYTES[2] &&
		firstBytes[3] === PNG_MAGIC_BYTES[3] &&
		firstBytes[4] === PNG_MAGIC_BYTES[4] &&
		firstBytes[5] === PNG_MAGIC_BYTES[5] &&
		firstBytes[6] === PNG_MAGIC_BYTES[6] &&
		firstBytes[7] === PNG_MAGIC_BYTES[7];

	// Check JPEG magic bytes (FF D8 FF)
	const isJpeg =
		firstBytes.length >= 3 &&
		firstBytes[0] === JPEG_MAGIC_BYTES[0] &&
		firstBytes[1] === JPEG_MAGIC_BYTES[1] &&
		firstBytes[2] === JPEG_MAGIC_BYTES[2];

	if (!isPng && !isJpeg) {
		throw new Error("Reference image must be a valid PNG or JPEG file.");
	}

	// Validate MIME type if provided in data URL
	if (expectedMimeType) {
		const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg"];
		if (!allowedMimeTypes.includes(expectedMimeType)) {
			throw new Error(
				`Invalid image type: ${expectedMimeType}. Allowed types: PNG, JPEG`,
			);
		}
	}

	// Convert to Uint8Array using shared utility
	return base64ToUint8Array(base64Data);
}
