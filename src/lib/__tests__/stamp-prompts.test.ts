import { describe, expect, it } from "vitest";
import {
	buildStampPrompt,
	EXAMPLE_PROMPTS,
	STAMP_STYLE_PRESETS,
	STAMP_SYSTEM_PROMPT,
} from "../stamp-prompts";

describe("STAMP_STYLE_PRESETS", () => {
	it("has all 5 styles", () => {
		const keys = Object.keys(STAMP_STYLE_PRESETS);
		expect(keys).toEqual(["vintage", "modern", "botanical", "pop", "japanese"]);
	});

	it("each style has name and prompt", () => {
		for (const [key, preset] of Object.entries(STAMP_STYLE_PRESETS)) {
			expect(preset.name).toBeTruthy();
			expect(preset.prompt).toBeTruthy();
			expect(preset.prompt).toContain("perforated edges");
		}
	});
});

describe("buildStampPrompt", () => {
	it("includes user prompt in output", () => {
		const result = buildStampPrompt("a cat on a roof");
		expect(result).toContain("a cat on a roof");
	});

	it("defaults to vintage style", () => {
		const result = buildStampPrompt("test");
		expect(result).toContain("woodcut illustration");
	});

	it("uses specified style", () => {
		const result = buildStampPrompt("test", "japanese");
		expect(result).toContain("ukiyo-e");
	});

	it("includes system prompt", () => {
		const result = buildStampPrompt("test");
		expect(result).toContain(STAMP_SYSTEM_PROMPT);
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

describe("STAMP_SYSTEM_PROMPT", () => {
	it("mentions perforated edges", () => {
		expect(STAMP_SYSTEM_PROMPT).toContain("perforated");
	});

	it("mentions no text", () => {
		expect(STAMP_SYSTEM_PROMPT).toContain("No text");
	});

	it("mentions limited color palette", () => {
		expect(STAMP_SYSTEM_PROMPT).toContain("Limited color palette");
	});
});
