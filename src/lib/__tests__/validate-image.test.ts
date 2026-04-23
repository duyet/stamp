import { describe, expect, it } from "vitest";
import { validateReferenceImage } from "../validate-image";

// Helper: create a minimal valid PNG (8-byte header + minimal chunks)
function createMinimalPngBase64(): string {
	const signature = new Uint8Array([
		0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
	]);
	const ihdr = new Uint8Array([
		0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01,
		0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
		0xde,
	]);
	const iend = new Uint8Array([
		0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
	]);
	const combined = new Uint8Array(signature.length + ihdr.length + iend.length);
	combined.set(signature, 0);
	combined.set(ihdr, signature.length);
	combined.set(iend, signature.length + ihdr.length);
	return btoa(String.fromCharCode(...combined));
}

// Helper: create a minimal valid JPEG (starts with FF D8 FF)
function createMinimalJpegBase64(): string {
	const data = new Uint8Array([
		0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
		0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
	]);
	return btoa(String.fromCharCode(...data));
}

// Helper: convert Uint8Array to base64 without stack overflow
function uint8ArrayToBase64(arr: Uint8Array): string {
	let binary = "";
	for (let i = 0; i < arr.length; i += 8192) {
		const chunk = arr.subarray(i, Math.min(i + 8192, arr.length));
		for (let j = 0; j < chunk.length; j++) {
			binary += String.fromCharCode(chunk[j]);
		}
	}
	return btoa(binary);
}

describe("validateReferenceImage", () => {
	describe("valid images", () => {
		it("accepts a valid PNG image as raw base64", () => {
			const result = validateReferenceImage(createMinimalPngBase64());
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBeGreaterThan(0);
		});

		it("accepts a valid JPEG image as raw base64", () => {
			const result = validateReferenceImage(createMinimalJpegBase64());
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBeGreaterThan(0);
		});

		it("accepts a valid PNG with data URL prefix", () => {
			const dataUrl = `data:image/png;base64,${createMinimalPngBase64()}`;
			const result = validateReferenceImage(dataUrl);
			expect(result).toBeInstanceOf(Uint8Array);
		});

		it("accepts a valid JPEG with data URL prefix", () => {
			const dataUrl = `data:image/jpeg;base64,${createMinimalJpegBase64()}`;
			const result = validateReferenceImage(dataUrl);
			expect(result).toBeInstanceOf(Uint8Array);
		});

		it("accepts image/jpg MIME type", () => {
			const dataUrl = `data:image/jpg;base64,${createMinimalJpegBase64()}`;
			const result = validateReferenceImage(dataUrl);
			expect(result).toBeInstanceOf(Uint8Array);
		});
	});

	describe("size validation", () => {
		it("rejects input exceeding max base64 length", () => {
			const hugeInput = "A".repeat(10 * 1024 * 1024 + 1);
			expect(() => validateReferenceImage(hugeInput)).toThrow(
				/Reference image too large/,
			);
		});
	});

	describe("format validation", () => {
		it("rejects invalid base64 characters", () => {
			expect(() => validateReferenceImage("not!valid@base64#data")).toThrow(
				/Invalid base64 format/,
			);
		});

		it("rejects empty base64", () => {
			expect(() => validateReferenceImage("")).toThrow(/Invalid base64 format/);
		});

		it("rejects non-PNG non-JPEG magic bytes (GIF)", () => {
			const gifData = new Uint8Array([
				0x47, 0x49, 0x46, 0x38, 0x37, 0x61, 0x00, 0x00,
			]);
			const base64 = uint8ArrayToBase64(gifData);
			expect(() => validateReferenceImage(base64)).toThrow(
				/must be a valid PNG or JPEG/,
			);
		});

		it("rejects non-PNG non-JPEG magic bytes (BMP)", () => {
			const bmpData = new Uint8Array([
				0x42, 0x4d, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			]);
			const base64 = uint8ArrayToBase64(bmpData);
			expect(() => validateReferenceImage(base64)).toThrow(
				/must be a valid PNG or JPEG/,
			);
		});

		it("rejects random bytes", () => {
			const randomData = new Uint8Array([
				0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
			]);
			const base64 = uint8ArrayToBase64(randomData);
			expect(() => validateReferenceImage(base64)).toThrow(
				/must be a valid PNG or JPEG/,
			);
		});
	});

	describe("MIME type validation", () => {
		it("rejects invalid MIME type in data URL", () => {
			const dataUrl = `data:image/gif;base64,${createMinimalPngBase64()}`;
			expect(() => validateReferenceImage(dataUrl)).toThrow(
				/Invalid image type: image\/gif/,
			);
		});

		it("rejects video MIME type", () => {
			const dataUrl = `data:video/mp4;base64,${createMinimalJpegBase64()}`;
			expect(() => validateReferenceImage(dataUrl)).toThrow(
				/Invalid image type/,
			);
		});
	});
});
