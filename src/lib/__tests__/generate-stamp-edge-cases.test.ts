import { describe, expect, it, vi } from "vitest";
import { createMockAi } from "@/test-utils";
import { generateStamp } from "../generate-stamp";

const FAKE_IMAGE = btoa("image-data");

describe("generateStamp edge cases", () => {
	it("handles empty string prompt", async () => {
		const mockAi = createMockAi("enhanced prompt", FAKE_IMAGE);
		const result = await generateStamp(mockAi, "", "vintage");

		expect(result.imageData).toBeInstanceOf(Uint8Array);
		expect(result.mimeType).toBe("image/jpeg");
	});

	it("handles very long prompt", async () => {
		const longPrompt = "a ".repeat(250); // 500 chars
		const mockAi = createMockAi("enhanced prompt", FAKE_IMAGE);
		const result = await generateStamp(mockAi, longPrompt, "vintage");

		expect(result.imageData).toBeInstanceOf(Uint8Array);
	});

	it("handles prompt with special characters", async () => {
		const specialPrompt = 'A cat with <script>alert("xss")</script> & "quotes"';
		const mockAi = createMockAi("enhanced prompt", FAKE_IMAGE);
		const result = await generateStamp(mockAi, specialPrompt, "vintage");

		expect(result.imageData).toBeInstanceOf(Uint8Array);
	});

	it("handles prompt with unicode characters", async () => {
		const unicodePrompt = "A girl with glasses ";
		const mockAi = createMockAi("enhanced prompt", FAKE_IMAGE);
		const result = await generateStamp(mockAi, unicodePrompt, "vintage");

		expect(result.imageData).toBeInstanceOf(Uint8Array);
	});

	it("uses fallback when LLM returns empty response", async () => {
		const mockAi = createMockAi("", FAKE_IMAGE);
		const result = await generateStamp(mockAi, "a cat", "folk");

		// Fallback prompt should contain the user prompt and style keywords
		expect(result.enhancedPrompt).toContain("a cat");
		expect(result.enhancedPrompt).toContain("No text");
	});

	it("uses fallback when LLM returns undefined response", async () => {
		const mockAi = {
			run: vi.fn().mockImplementation((model: string) => {
				if (model.includes("llama")) {
					return Promise.resolve({}); // no response field
				}
				if (model.includes("flux")) {
					return Promise.resolve({ image: FAKE_IMAGE });
				}
			}),
		} as unknown as Ai;

		const result = await generateStamp(mockAi, "a dog", "modern");
		expect(result.enhancedPrompt).toContain("a dog");
	});

	it("always returns image/jpeg mime type", async () => {
		const mockAi = createMockAi("prompt", btoa("data"));
		const result = await generateStamp(mockAi, "test", "botanical");

		expect(result.mimeType).toBe("image/jpeg");
	});

	it("correctly decodes base64 image data", async () => {
		const originalData = "Hello World";
		const mockAi = createMockAi("prompt", btoa(originalData));
		const result = await generateStamp(mockAi, "test", "vintage");

		const decoded = String.fromCharCode(...result.imageData);
		expect(decoded).toBe(originalData);
	});

	it("defaults to vintage style when no style provided", async () => {
		const mockAi = createMockAi("enhanced", btoa("img"));
		const result = await generateStamp(mockAi, "a cat");

		expect(result.imageData).toBeInstanceOf(Uint8Array);
	});
});
