import { describe, expect, it } from "vitest";
import {
	buildStampPrompt,
	EXAMPLE_PROMPTS,
	PROMPT_GROUPS,
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

	it("each style has name, prompt, and thumbnail", () => {
		for (const [, preset] of Object.entries(STAMP_STYLE_PRESETS)) {
			expect(preset.name).toBeTruthy();
			expect(preset.prompt).toBeTruthy();
			expect(preset.thumbnail).toBeTruthy();
			expect(preset.prompt).toContain("perforated");
		}
	});

	it("each style includes the base style keywords", () => {
		for (const [, preset] of Object.entries(STAMP_STYLE_PRESETS)) {
			expect(preset.prompt).toContain("naive folk art");
			expect(preset.prompt).toContain("dot eyes");
			expect(preset.prompt).toContain("bold black outlines");
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

describe("PROMPT_GROUPS", () => {
	it("has at least one group", () => {
		expect(PROMPT_GROUPS.length).toBeGreaterThanOrEqual(1);
	});

	it("each group has at least 5 prompts", () => {
		for (const group of PROMPT_GROUPS) {
			expect(group.prompts.length).toBeGreaterThanOrEqual(5);
		}
	});

	it("each prompt is non-empty", () => {
		for (const group of PROMPT_GROUPS) {
			for (const prompt of group.prompts) {
				expect(prompt.trim().length).toBeGreaterThan(0);
			}
		}
	});

	it("no duplicates within each group", () => {
		for (const group of PROMPT_GROUPS) {
			const unique = new Set(group.prompts);
			expect(unique.size).toBe(group.prompts.length);
		}
	});

	it("groups with a style reference a valid style key", () => {
		const validStyles = Object.keys(STAMP_STYLE_PRESETS);
		for (const group of PROMPT_GROUPS) {
			if (group.style) {
				expect(validStyles).toContain(group.style);
			}
		}
	});

	it("each group has className and hoverClassName", () => {
		for (const group of PROMPT_GROUPS) {
			expect(group.className).toBeTruthy();
			expect(group.hoverClassName).toBeTruthy();
		}
	});
});
