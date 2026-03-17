/**
 * Prompt templates for generating postage stamps with AI.
 *
 * Style reference: naive folk art stamps with stippled shading,
 * bold black outlines, simple dot eyes, limited 2-3 color palette,
 * cross-hatched textures, perforated edges, cream paper texture.
 */

export const STAMP_BASE_STYLE = `naive folk art illustration on a postage stamp, bold black outlines, stippled dotted shading technique, cream off-white paper background, perforated serrated stamp edges, slightly aged paper texture, hand-drawn feel, limited 2-3 color palette, small decorative elements, square format, stamp fills the entire image, no padding outside stamp edges, no background frame, no border outside the stamp`;

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
		prompt: `watercolor postage stamp illustration, soft pastel color washes, bleeding watercolor edges, wet-on-wet technique, delicate brushwork, muted translucent tones, cream paper background, perforated serrated stamp edges, slightly aged paper texture, loose organic shapes, limited 2-3 color palette, square format, stamp fills the entire image, no padding outside stamp edges, no background frame`,
		thumbnail: "/styles/watercolor.jpg",
	},
	woodcut: {
		name: "Woodcut",
		prompt: `woodcut print postage stamp, bold black and white, carved wood texture, strong parallel hatching lines, medieval woodblock print feel, high contrast, cream paper background, perforated serrated stamp edges, hand-carved feel, dramatic shadows, limited to black ink on cream, square format, stamp fills the entire image, no padding outside stamp edges, no background frame`,
		thumbnail: "/styles/woodcut.jpg",
	},
	engraved: {
		name: "Engraved",
		prompt: `engraved postage stamp illustration, fine parallel line hatching, classic currency engraving style, detailed stippling and cross-hatching, monochrome steel blue ink on cream paper, perforated serrated stamp edges, formal composition, intricate fine lines, banknote illustration quality, square format, stamp fills the entire image, no padding outside stamp edges, no background frame`,
		thumbnail: "/styles/engraved.jpg",
	},
	pixel: {
		name: "Pixel",
		prompt: `pixel art postage stamp, 8-bit retro game style, blocky pixel shapes, limited 4-color palette, nostalgic video game aesthetic, crisp pixel edges, cream background, perforated serrated stamp edges, dithering patterns, square format, stamp fills the entire image, no padding outside stamp edges, no background frame`,
		thumbnail: "/styles/pixel.jpg",
	},
	risograph: {
		name: "Risograph",
		prompt: `risograph print postage stamp, overlapping semi-transparent neon colors, grainy ink texture, slight misregistration between color layers, bold flat graphic shapes, cream paper background, perforated serrated stamp edges, modern print aesthetic, fluorescent pink and blue ink, square format, stamp fills the entire image, no padding outside stamp edges, no background frame`,
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
	return `${preset.prompt}. Subject: ${userPrompt}. No text, no words, no letters, no numbers on the stamp. The stamp fills the entire image with no outer padding or frame.`;
}

export interface PromptGroup {
	label?: string;
	style?: StampStyle;
	className: string;
	hoverClassName: string;
	prompts: readonly string[];
}

/**
 * Large pool of prompts for quick-pick inspiration.
 * Each page load shows a random subset to keep suggestions fresh.
 */

// Individual prompt pools by category
const ANIMALS = [
	"A cat sitting on a windowsill",
	"A wise owl with big round eyes",
	"A fox in an autumn forest",
	"A playful dog chasing a ball",
	"A fluffy bunny with floppy ears",
	"A majestic lion with a flowing mane",
	"A colorful parrot on a branch",
	"A curious squirrel with an acorn",
	"A graceful deer in a meadow",
	"A sleepy panda in a tree",
	"A loyal golden retriever",
	"A tiny hummingbird at a flower",
	"A proud rooster",
	"A gentle cow in a pasture",
	"A sleek black cat",
	"A friendly dolphin jumping",
	"A quirky penguin waddling",
	"A majestic eagle soaring",
	"A colorful butterfly",
	"A busy bee on a flower",
	"A slow turtle crossing",
	"A happy pig",
	"A fluffy sheep",
	"A majestic whale",
	"A clever raccoon",
];

const PEOPLE = [
	"A girl with glasses and black hair",
	"A boy with a red cap",
	"A grandmother knitting",
	"A fisherman by the lake",
	"A baker with bread",
	"A musician playing guitar",
	"A dancer in motion",
	"A painter at an easel",
	"A scientist with a microscope",
	"A teacher with a book",
	"A farmer with a pitchfork",
	"A chef with a hat",
	"A doctor with a stethoscope",
	"A pilot with goggles",
	"A cowboy with a lasso",
	"A knight in armor",
	"A pirate with a telescope",
	"A wizard with a staff",
	"A fairy with wings",
	"A superhero with a cape",
	"A astronaut in a spacesuit",
	"A scuba diver",
	"A mountain climber",
	"A skier going downhill",
	"A surfer riding a wave",
	"A cyclist on a path",
];

const NATURE = [
	"A lighthouse on a rocky coast",
	"A sunflower in a garden",
	"A mighty oak tree",
	"A weeping willow",
	"A pine forest",
	"A desert cactus",
	"A tropical palm",
	"A cherry blossom tree",
	"A maple tree in autumn",
	"A snowy mountain peak",
	"A winding river",
	"A calm lake at dawn",
	"A waterfall cascading",
	"A volcano erupting",
	"A rainbow after rain",
	"A lightning storm",
	"A peaceful meadow",
	"A sandy beach",
	"A coral reef",
	"A field of lavender",
	"A mossy rock",
	"A babbling brook",
	"A northern lights display",
	"A starry night sky",
	"A full moon rising",
	"A sunset over the ocean",
];

const OBJECTS = [
	"A cozy coffee cup with steam",
	"A vintage camera",
	"A classic bicycle",
	"A hot air balloon",
	"A sailing ship",
	"A steam locomotive",
	"A vintage car",
	"A wooden sailboat",
	"A red barn",
	"A covered bridge",
	"A stone cottage",
	"A lighthouse beacon",
	"A windmill",
	"A water wheel",
	"A grandfather clock",
	"A pocket watch",
	"A old book",
	"A quill pen",
	"A oil lamp",
	"A treasure chest",
	"A crystal ball",
	"A magic wand",
	"A knight's shield",
	"A pirate map",
	"A compass",
	"A telescope",
	"A music box",
];

const FOOD = [
	"A fresh loaf of bread",
	"A slice of watermelon",
	"A bunch of grapes",
	"A strawberry patch",
	"A pumpkin for Halloween",
	"A Christmas cookie",
	"A birthday cake",
	"A steaming bowl of soup",
	"A plate of spaghetti",
	"A sushi roll",
	"A taco with toppings",
	"A cheeseburger",
	"A pizza slice",
	"A ice cream cone",
	"A chocolate bar",
	"A cup of tea",
	"A honey jar",
	"A basket of apples",
	"A wedge of cheese",
	"A loaf of sourdough",
	"A croissant",
	"A muffin",
	"A pancake stack",
	"A waffle with berries",
	"A bowl of cereal",
];

// All prompts combined (100+ pool)
const ALL_PROMPTS = [...ANIMALS, ...PEOPLE, ...NATURE, ...OBJECTS, ...FOOD];

/**
 * Get a random subset of prompts for display.
 * Shuffles on each call to provide variety on page reload.
 */
export function getRandomPrompts(count: number = 12): string[] {
	const shuffled = [...ALL_PROMPTS];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Prompt groups for quick-pick inspiration on the generate form.
 * Shows a random subset from the full prompt pool on each page load.
 */
export const PROMPT_GROUPS: readonly PromptGroup[] = [
	{
		label: "Ideas",
		className: "text-stone-600",
		hoverClassName: "hover:text-stone-800 hover:bg-stone-100",
		prompts: getRandomPrompts(12),
	},
	{
		label: "Animals",
		className: "text-stone-600",
		hoverClassName: "hover:text-stone-800 hover:bg-stone-100",
		prompts: getRandomPrompts(8),
	},
	{
		label: "Nature",
		className: "text-stone-600",
		hoverClassName: "hover:text-stone-800 hover:bg-stone-100",
		prompts: getRandomPrompts(8),
	},
] as const;
