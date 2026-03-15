import { describe, expect, it } from "vitest";
import {
	buildStampPrompt,
	EXAMPLE_PROMPTS,
	STAMP_BASE_STYLE,
	STAMP_STYLE_PRESETS,
} from "../stamp-prompts";

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

	it("each style includes the base style", () => {
		for (const [, preset] of Object.entries(STAMP_STYLE_PRESETS)) {
			expect(preset.prompt).toContain("naive folk art");
		}
	});
});

describe("STAMP_BASE_STYLE", () => {
	it("includes key style elements", () => {
		expect(STAMP_BASE_STYLE).toContain("stippled");
		expect(STAMP_BASE_STYLE).toContain("bold black outlines");
		expect(STAMP_BASE_STYLE).toContain("dot eyes");
		expect(STAMP_BASE_STYLE).toContain("perforated");
	});
});

describe("buildStampPrompt", () => {
	it("includes user prompt in output", () => {
		const result = buildStampPrompt("a cat on a roof");
		expect(result).toContain("a cat on a roof");
	});

	it("defaults to vintage style", () => {
		const result = buildStampPrompt("test");
		expect(result).toContain("blue-grey");
	});

	it("uses specified style", () => {
		const result = buildStampPrompt("test", "folk");
		expect(result).toContain("mustard yellow");
	});

	it("includes no-text instruction", () => {
		const result = buildStampPrompt("test");
		expect(result).toContain("No text");
	});

	it("works for all styles", () => {
		for (const style of Object.keys(STAMP_STYLE_PRESETS)) {
			const result = buildStampPrompt(
				"subject",
				style as keyof typeof STAMP_STYLE_PRESETS,
			);
			expect(result).toContain("subject");
			expect(result.length).toBeGreaterThan(50);
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
