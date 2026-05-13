import { describe, expect, it } from "vitest";
import {
	PROMPT_GROUPS,
	STAMP_BASE_STYLE,
	STAMP_STYLE_PRESETS,
} from "../stamp-prompts";

describe("STAMP_STYLE_PRESETS", () => {
	it("has all 10 styles", () => {
		const keys = Object.keys(STAMP_STYLE_PRESETS);
		expect(keys).toEqual([
			"vintage",
			"folk",
			"modern",
			"botanical",
			"portrait",
			"watercolor",
			"woodcut",
			"engraved",
			"pixel",
			"risograph",
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

	it("base styles include universal stamp keywords", () => {
		const baseStyles = ["vintage", "folk", "modern", "botanical", "portrait"];
		for (const key of baseStyles) {
			const preset =
				STAMP_STYLE_PRESETS[key as keyof typeof STAMP_STYLE_PRESETS];
			expect(preset.prompt).toContain("naive folk art");
			expect(preset.prompt).toContain("bold black outlines");
			expect(preset.prompt).toContain("perforated");
		}
	});

	it("portrait style includes figure-specific elements", () => {
		const portrait = STAMP_STYLE_PRESETS.portrait;
		expect(portrait.prompt).toContain("dot eyes");
		expect(portrait.prompt).toContain("face portrait");
	});

	it("custom styles include perforated in their prompt", () => {
		const customStyles = [
			"watercolor",
			"woodcut",
			"engraved",
			"pixel",
			"risograph",
		];
		for (const key of customStyles) {
			const preset =
				STAMP_STYLE_PRESETS[key as keyof typeof STAMP_STYLE_PRESETS];
			expect(preset.prompt).toContain("perforated");
		}
	});

	it("all styles include no-padding constraint", () => {
		for (const [, preset] of Object.entries(STAMP_STYLE_PRESETS)) {
			expect(preset.prompt).toMatch(/NO padding outside stamp edges/i);
			expect(preset.prompt).toMatch(/NO background frame/i);
		}
	});
});

describe("STAMP_BASE_STYLE", () => {
	it("includes key style elements", () => {
		expect(STAMP_BASE_STYLE).toContain("stippled");
		expect(STAMP_BASE_STYLE).toContain("bold black outlines");
		expect(STAMP_BASE_STYLE).toContain("perforated");
		expect(STAMP_BASE_STYLE).toContain("square format");
	});

	it("includes anti-padding and no-frame constraints", () => {
		expect(STAMP_BASE_STYLE).toContain("fills the entire image");
		expect(STAMP_BASE_STYLE).toMatch(/NO padding outside stamp edges/i);
		expect(STAMP_BASE_STYLE).toMatch(/NO background frame/i);
	});

	it("does not force portrait-specific elements in base style", () => {
		expect(STAMP_BASE_STYLE).not.toContain("portrait");
		expect(STAMP_BASE_STYLE).not.toContain("dot eyes");
		expect(STAMP_BASE_STYLE).not.toContain("clothing");
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
