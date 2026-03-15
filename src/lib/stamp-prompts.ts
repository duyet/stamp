/**
 * Prompt templates for generating postage stamps with AI.
 *
 * Style reference: vintage postage stamps with illustrated portraits,
 * perforated edges, woodcut/linocut illustration style, limited color palette.
 */

export const STAMP_SYSTEM_PROMPT = `You are an expert stamp illustrator. Generate a single postage stamp image with these characteristics:
- Classic postage stamp format with perforated/serrated edges
- Illustration style: woodcut, linocut, or vintage engraving aesthetic
- Limited color palette (2-4 colors max): cream/off-white background, with accent colors like navy blue, mustard yellow, terracotta red, or sage green
- Portrait or subject centered in the stamp frame
- Small decorative floral or geometric elements in corners
- Slight paper texture and aged look
- No text or numbers on the stamp (keep it clean)
- Square or slightly rectangular format
- The illustration should feel hand-crafted and artistic`;

export const STAMP_STYLE_PRESETS = {
	vintage: {
		name: "Vintage Portrait",
		prompt:
			"vintage postage stamp style, woodcut illustration, limited colors, cream background, perforated edges, hand-crafted feel",
	},
	modern: {
		name: "Modern Minimal",
		prompt:
			"modern minimalist postage stamp, clean lines, flat illustration, bold single accent color, geometric shapes, perforated edges",
	},
	botanical: {
		name: "Botanical",
		prompt:
			"botanical illustration postage stamp, detailed plant/flower drawing, vintage scientific illustration style, muted natural colors, perforated edges",
	},
	pop: {
		name: "Pop Art",
		prompt:
			"pop art style postage stamp, bold colors, graphic illustration, Ben-Day dots, comic book aesthetic, perforated edges",
	},
	japanese: {
		name: "Japanese Woodblock",
		prompt:
			"Japanese ukiyo-e woodblock print style postage stamp, traditional composition, muted earth tones, perforated edges",
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
	return `Generate a single postage stamp image. ${preset.prompt}. Subject: ${userPrompt}. ${STAMP_SYSTEM_PROMPT}`;
}

/**
 * Example prompts for the landing page / inspiration.
 */
export const EXAMPLE_PROMPTS = [
	"A girl with glasses and black hair, holding flowers",
	"A cat sitting on a windowsill watching rain",
	"A lighthouse on a rocky coast at sunset",
	"A vintage bicycle with a basket of wildflowers",
	"A wise owl perched on old books",
	"A cozy coffee shop on a rainy day",
	"An astronaut floating among stars",
	"A fox in an autumn forest",
];
