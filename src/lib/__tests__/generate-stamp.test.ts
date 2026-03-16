import { describe, expect, it, vi } from "vitest";
import { createMockAi } from "@/test-utils";
import { generateStamp } from "../generate-stamp";
import { STAMP_STYLE_PRESETS } from "../stamp-prompts";

describe("generateStamp", () => {
	it("returns image data and enhanced prompt", async () => {
		const mockAi = createMockAi(
			"A naive folk art postage stamp of a cat with stippled shading",
			btoa("fake-image-data"),
		);

		const result = await generateStamp(mockAi, "a cat", "vintage");

		expect(result.imageData).toBeInstanceOf(Uint8Array);
		expect(result.imageData.length).toBeGreaterThan(0);
		expect(result.mimeType).toBe("image/jpeg");
		expect(result.enhancedPrompt).toContain("folk art");
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

		expect(result.enhancedPrompt).toContain("naive folk art");
		expect(result.enhancedPrompt).toContain("a dog");
	});

	it("throws when Flux returns no image", async () => {
		const mockAi = createMockAi("enhanced prompt", null);

		await expect(generateStamp(mockAi, "test", "vintage")).rejects.toThrow(
			"No image generated",
		);
	});

	it("works with all style presets", async () => {
		const styles = Object.keys(STAMP_STYLE_PRESETS) as Array<
			keyof typeof STAMP_STYLE_PRESETS
		>;

		for (const style of styles) {
			const mockAi = createMockAi(`A ${style} stamp`, btoa("img"));
			const result = await generateStamp(mockAi, "subject", style);
			expect(result.imageData).toBeInstanceOf(Uint8Array);
		}
	});
});
