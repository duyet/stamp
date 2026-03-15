import { describe, expect, it, vi } from "vitest";
import { generateStamp } from "../generate-stamp";

// Mock the Ai binding
function createMockAi(llmResponse: string, imageBase64: string | null): Ai {
	return {
		run: vi.fn().mockImplementation((model: string) => {
			if (model.includes("llama")) {
				return Promise.resolve({ response: llmResponse });
			}
			if (model.includes("flux")) {
				return Promise.resolve({ image: imageBase64 });
			}
			return Promise.reject(new Error(`Unknown model: ${model}`));
		}),
	} as unknown as Ai;
}

describe("generateStamp", () => {
	it("returns image data and enhanced prompt", async () => {
		const mockAi = createMockAi(
			"A detailed vintage postage stamp illustration of a cat",
			btoa("fake-image-data"),
		);

		const result = await generateStamp(mockAi, "a cat", "vintage");

		expect(result.imageData).toBeInstanceOf(Uint8Array);
		expect(result.imageData.length).toBeGreaterThan(0);
		expect(result.mimeType).toBe("image/jpeg");
		expect(result.enhancedPrompt).toContain("vintage postage stamp");
	});

	it("uses fallback prompt when LLM fails", async () => {
		const mockAi = {
			run: vi.fn().mockImplementation((model: string) => {
				if (model.includes("llama")) {
					return Promise.reject(new Error("LLM unavailable"));
				}
				if (model.includes("flux")) {
					return Promise.resolve({ image: btoa("image") });
				}
			}),
		} as unknown as Ai;

		const result = await generateStamp(mockAi, "a dog", "modern");

		expect(result.enhancedPrompt).toContain("Postage stamp illustration");
		expect(result.enhancedPrompt).toContain("a dog");
	});

	it("throws when Flux returns no image", async () => {
		const mockAi = createMockAi("enhanced prompt", null);

		await expect(generateStamp(mockAi, "test", "vintage")).rejects.toThrow(
			"No image generated",
		);
	});

	it("works with all style presets", async () => {
		const styles = [
			"vintage",
			"modern",
			"botanical",
			"pop",
			"japanese",
		] as const;

		for (const style of styles) {
			const mockAi = createMockAi(`A ${style} stamp`, btoa("img"));
			const result = await generateStamp(mockAi, "subject", style);
			expect(result.imageData).toBeInstanceOf(Uint8Array);
		}
	});
});
