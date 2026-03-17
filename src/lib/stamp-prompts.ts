/**
 * Prompt templates for generating postage stamps with AI.
 *
 * Style reference: naive folk art stamps with stippled shading,
 * bold black outlines, simple dot eyes, limited 2-3 color palette,
 * cross-hatched textures, perforated edges, cream paper texture.
 */

export const STAMP_BASE_STYLE = `naive folk art illustration on a postage stamp, bold black outlines, stippled dotted shading technique, cream off-white paper background, perforated serrated stamp edges, slightly aged paper texture, hand-drawn feel, limited 2-3 color palette, small decorative elements, square format`;

export const STAMP_STYLE_PRESETS = {
	vintage: {
		name: "Vintage",
		prompt: `${STAMP_BASE_STYLE}, blue-grey and cream color palette, delicate floral accents, stippled blue background`,
		thumbnail: "/styles/vintage.jpg",
	},
	folk: {
		name: "Folk Art",
		prompt: `${STAMP_BASE_STYLE}, warm mustard yellow and black palette, bold graphic shapes, geometric decorative borders`,
		thumbnail: "/styles/folk.jpg",
	},
	modern: {
		name: "Modern",
		prompt: `${STAMP_BASE_STYLE}, clean flat colors, bold single accent color, geometric composition, minimal decoration`,
		thumbnail: "/styles/modern.jpg",
	},
	botanical: {
		name: "Botanical",
		prompt: `${STAMP_BASE_STYLE}, detailed plant or flower as subject, fine crosshatching, muted green and cream palette, scientific illustration feel`,
		thumbnail: "/styles/botanical.jpg",
	},
	portrait: {
		name: "Portrait",
		prompt: `${STAMP_BASE_STYLE}, close-up face portrait, simple minimalist face with dot eyes, stippled shading on skin, expressive simple eyes, cross-hatched clothing textures, blue-grey background with subtle texture`,
		thumbnail: "/styles/portrait.jpg",
	},
	watercolor: {
		name: "Watercolor",
		prompt: `watercolor postage stamp illustration, soft pastel color washes, bleeding watercolor edges, wet-on-wet technique, delicate brushwork, muted translucent tones, cream paper background, perforated serrated stamp edges, slightly aged paper texture, loose organic shapes, limited 2-3 color palette, square format`,
		thumbnail: "/styles/watercolor.jpg",
	},
	woodcut: {
		name: "Woodcut",
		prompt: `woodcut print postage stamp, bold black and white, carved wood texture, strong parallel hatching lines, medieval woodblock print feel, high contrast, cream paper background, perforated serrated stamp edges, hand-carved feel, dramatic shadows, limited to black ink on cream, square format`,
		thumbnail: "/styles/woodcut.jpg",
	},
	engraved: {
		name: "Engraved",
		prompt: `engraved postage stamp illustration, fine parallel line hatching, classic currency engraving style, detailed stippling and cross-hatching, monochrome steel blue ink on cream paper, perforated serrated stamp edges, formal composition, intricate fine lines, banknote illustration quality, square format`,
		thumbnail: "/styles/engraved.jpg",
	},
	pixel: {
		name: "Pixel",
		prompt: `pixel art postage stamp, 8-bit retro game style, blocky pixel shapes, limited 4-color palette, nostalgic video game aesthetic, crisp pixel edges, cream background, perforated serrated stamp edges, dithering patterns, square format`,
		thumbnail: "/styles/pixel.jpg",
	},
	risograph: {
		name: "Risograph",
		prompt: `risograph print postage stamp, overlapping semi-transparent neon colors, grainy ink texture, slight misregistration between color layers, bold flat graphic shapes, cream paper background, perforated serrated stamp edges, modern print aesthetic, fluorescent pink and blue ink, square format`,
		thumbnail: "/styles/risograph.jpg",
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

export interface PromptGroup {
	label?: string;
	style?: StampStyle;
	className: string;
	hoverClassName: string;
	prompts: readonly string[];
}

/**
 * Prompt groups for quick-pick inspiration on the generate form.
 * Each group can optionally auto-select a style when clicked.
 */
export const PROMPT_GROUPS: readonly PromptGroup[] = [
	{
		className: "text-stone-600",
		hoverClassName: "hover:text-stone-800 hover:bg-stone-100",
		prompts: [
			"A girl with glasses and black hair",
			"A cat sitting on a windowsill",
			"A lighthouse on a rocky coast",
			"A wise owl with big round eyes",
			"A cozy coffee cup with steam",
			"An astronaut in a spacesuit",
			"A fox in an autumn forest",
			"A sunflower in a garden",
		],
	},
] as const;
