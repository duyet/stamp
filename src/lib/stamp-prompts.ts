/**
 * Prompt templates for generating postage stamps with AI.
 *
 * Style reference: naive folk art portrait stamps with stippled shading,
 * bold black outlines, simple dot eyes, limited 2-3 color palette,
 * cross-hatched textures, perforated edges, cream paper texture.
 */

const STAMP_BASE_STYLE = `naive folk art portrait illustration on a postage stamp, bold black outlines, stippled dotted shading technique, simple minimalist face with dot eyes and thin line nose, cream off-white paper background, perforated serrated stamp edges, slightly aged paper texture, hand-drawn feel, limited 2-3 color palette, cross-hatched clothing patterns, small decorative elements, square format`;

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
} as const;

export type StampStyle = keyof typeof STAMP_STYLE_PRESETS;

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
