import { describe, expect, it } from "vitest";
import { EXAMPLE_PROMPTS, STAMP_STYLE_PRESETS } from "../stamp-prompts";

describe("STAMP_STYLE_PRESETS", () => {
	it("has all 5 styles", () => {
		const keys = Object.keys(STAMP_STYLE_PRESETS);
		expect(keys).toEqual([
			"vintage",
			"folk",
			"modern",
			"botanical",
			"portrait",
		]);
	});

	it("each style has name and prompt", () => {
		for (const [, preset] of Object.entries(STAMP_STYLE_PRESETS)) {
			expect(preset.name).toBeTruthy();
			expect(preset.prompt).toBeTruthy();
			expect(preset.prompt).toContain("perforated");
		}
	});

	it("each style includes the base style keywords", () => {
		for (const [, preset] of Object.entries(STAMP_STYLE_PRESETS)) {
			expect(preset.prompt).toContain("naive folk art");
			expect(preset.prompt).toContain("bold black outlines");
			expect(preset.prompt).toContain("dot eyes");
		}
	});
});

describe("EXAMPLE_PROMPTS", () => {
	it("has at least 5 examples", () => {
		expect(EXAMPLE_PROMPTS.length).toBeGreaterThanOrEqual(5);
	});

	it("each prompt is non-empty", () => {
		for (const prompt of EXAMPLE_PROMPTS) {
			expect(prompt.trim().length).toBeGreaterThan(0);
		}
	});

	it("no duplicates", () => {
		const unique = new Set(EXAMPLE_PROMPTS);
		expect(unique.size).toBe(EXAMPLE_PROMPTS.length);
	});
});
