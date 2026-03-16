/**
 * Prompt templates for generating postage stamps with AI.
 *
 * Style reference: naive folk art portrait stamps with stippled shading,
 * bold black outlines, simple dot eyes, limited 2-3 color palette,
 * cross-hatched textures, perforated edges, cream paper texture.
 */

export const STAMP_BASE_STYLE = `naive folk art portrait illustration on a postage stamp, bold black outlines, stippled dotted shading technique, simple minimalist face with dot eyes and thin line nose, cream off-white paper background, perforated serrated stamp edges, slightly aged paper texture, hand-drawn feel, limited 2-3 color palette, cross-hatched clothing patterns, small decorative elements, square format`;

export const STAMP_STYLE_PRESETS = {
	vintage: {
		name: "Vintage",
		prompt: `${STAMP_BASE_STYLE}, blue-grey and cream color palette, delicate floral accents, stippled blue background`,
	},
	folk: {
		name: "Folk Art",
		prompt: `${STAMP_BASE_STYLE}, warm mustard yellow and black palette, bold graphic shapes, geometric decorative borders`,
	},
	modern: {
		name: "Modern",
		prompt: `${STAMP_BASE_STYLE}, clean flat colors, bold single accent color, geometric composition, minimal decoration`,
	},
	botanical: {
		name: "Botanical",
		prompt: `${STAMP_BASE_STYLE}, detailed plant or flower as subject, fine crosshatching, muted green and cream palette, scientific illustration feel`,
	},
	portrait: {
		name: "Portrait",
		prompt: `${STAMP_BASE_STYLE}, close-up face portrait, stippled shading on skin, expressive simple eyes, blue-grey background with subtle texture`,
	},
	anime: {
		name: "Anime",
		prompt: `${STAMP_BASE_STYLE}, anime manga inspired style, big expressive eyes, dynamic pose, bold linework, vibrant accent color, chibi proportions, kawaii aesthetic`,
	},
} as const;

export type StampStyle = keyof typeof STAMP_STYLE_PRESETS;

/**
 * Build the full prompt for stamp generation.
 */
export function buildStampPrompt(
	userPrompt: string,
	style: StampStyle = "vintage",
): string {
	const preset = STAMP_STYLE_PRESETS[style];
	return `${preset.prompt}. Subject: ${userPrompt}. No text, no words, no letters, no numbers on the stamp.`;
}

/**
 * Example prompts for the landing page / inspiration.
 */
export const EXAMPLE_PROMPTS = [
	"A girl with glasses and black hair",
	"A cat sitting on a windowsill",
	"A lighthouse on a rocky coast",
	"A wise owl with big round eyes",
	"A cozy coffee cup with steam",
	"An astronaut in a spacesuit",
	"A fox in an autumn forest",
	"A sunflower in a garden",
];

/**
 * Funny anime character prompts for quick-pick inspiration.
 */
export const ANIME_PROMPTS = [
	"A bald superhero with a cape looking bored after one punch",
	"A spiky-haired warrior screaming and powering up with golden aura",
	"A rubber pirate boy with a straw hat grinning wide",
	"A ninja kid with whisker marks eating a giant bowl of ramen",
	"A pink-haired girl punching through a wall with fury",
	"A sleepy tanuki raccoon spirit wearing a leaf on its head",
	"A tiny blue cat robot pulling gadgets from a belly pocket",
	"A tall skeleton musician with an afro sipping tea elegantly",
	"A serious potato-shaped detective with a bowtie and glasses",
	"A grumpy green-haired swordsman lost and holding three swords",
	"A cheerful slime blob bouncing happily in a fantasy meadow",
	"A dramatic villain laughing on a throne eating potato chips",
];
