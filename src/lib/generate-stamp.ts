import { uint8ArrayToDataUrl } from "./base64-utils";
import { STAMP_STYLE_PRESETS, type StampStyle } from "./stamp-prompts";

interface GenerateStampResult {
	imageData: Uint8Array;
	mimeType: string;
	enhancedPrompt: string;
	description: string;
}

/**
 * Enhance a user's rough prompt into a detailed stamp illustration prompt.
 * Uses CF Workers AI Qwen3 30B-A3B (free) to auto-tune the prompt.
 */
async function enhancePrompt(
	ai: Ai,
	userPrompt: string,
	style: StampStyle,
): Promise<string> {
	const preset = STAMP_STYLE_PRESETS[style];

	const systemPrompt = `You are a prompt engineer for an AI image generator that creates postage stamp illustrations.
Your job: take the user's rough idea and output a single, detailed image generation prompt that faithfully represents what the user asked for.

Base aesthetic: naive folk art illustration on a postage stamp, bold black outlines, stippled/dotted shading, cream paper background, perforated stamp edges, limited 2-3 color palette (blue-grey, mustard yellow, cream, black), hand-drawn feel.

Rules:
- Output ONLY the prompt text, no explanation
- Keep it under 150 words
- PRESERVE the user's intent — if they ask for a flag, generate a flag; if they ask for a landscape, generate a landscape; if they ask for a person, generate a person
- Always include these style keywords: "naive folk art", "postage stamp", "stippled shading", "bold black outlines", "perforated edges"
- Use the specific style variation: ${preset.prompt}
- Only include "dot eyes", "facial features", "pose", "expression", or "clothing" if the subject is a person or character
- For non-figure subjects (flags, objects, landscapes, buildings, animals, symbols), describe shapes, patterns, colors, and composition instead
- Do NOT add background elements the user did not ask for — follow the style preset faithfully
- The stamp must fill the entire image — no padding, margin, or decorative frame outside the stamp edges
- NEVER include any text, words, letters, numbers, or calligraphy
- Keep the composition centered`;

	const response = (await ai.run("@cf/qwen/qwen3-30b-a3b-fp8", {
		messages: [
			{ role: "system", content: systemPrompt },
			{ role: "user", content: userPrompt },
		],
		max_tokens: 300,
		temperature: 0.7,
	})) as { response?: string };

	return response.response?.trim() || buildFallbackPrompt(userPrompt, style);
}

/**
 * Fallback prompt builder if LLM enhancement fails.
 */
function buildFallbackPrompt(userPrompt: string, style: StampStyle): string {
	const preset = STAMP_STYLE_PRESETS[style];
	const subject = userPrompt.trim() || "a decorative design";
	return `${preset.prompt}. Subject: ${subject}. No text, no words, no letters, no numbers. The stamp fills the entire image with no outer padding or frame.`;
}

/**
 * Generate a short human-friendly description of what a stamp depicts.
 * Uses CF Workers AI Qwen3 30B-A3B (free) with low temperature for consistency.
 */
export async function generateDescription(
	ai: Ai,
	userPrompt: string,
	enhancedPrompt: string,
): Promise<string> {
	const systemPrompt = `You generate short 1-sentence descriptions (max 10-15 words) of what a stamp illustration depicts.
The description should be human-friendly display text, not a generation prompt.
Output ONLY the description, no quotes, no explanation.

Examples:
- "Folk art cat lounging on a sunny windowsill"
- "Vintage botanical rose garden illustration"
- "Whimsical owl perched on a moonlit branch"`;

	try {
		const response = (await ai.run("@cf/qwen/qwen3-30b-a3b-fp8", {
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: enhancedPrompt },
			],
			max_tokens: 50,
			temperature: 0.3,
		})) as { response?: string };

		const result = response.response?.trim();
		if (result && result.length > 0) {
			// Strip surrounding quotes if the model added them
			return result.replace(/^["']|["']$/g, "");
		}
	} catch {
		// Fall through to fallback
	}

	// Fallback: capitalize and trim the user prompt
	const trimmed = userPrompt.trim();
	return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Build multipart form data for Flux 2 models.
 * Supports reference images via input_image_0, input_image_1, etc.
 * All reference images must be ≤512x512 pixels.
 */
async function buildMultipartInput(
	params: Record<string, string>,
	referenceImageData?: Uint8Array,
): Promise<FormData> {
	const form = new FormData();
	for (const [key, value] of Object.entries(params)) {
		form.append(key, value);
	}
	// Add reference image if provided (for img2img with FLUX.2)
	if (referenceImageData) {
		// Convert Uint8Array to data URL
		const dataUrl = uint8ArrayToDataUrl(referenceImageData, "image/png");
		// Fetch as Blob to get proper BlobPart type
		const response = await fetch(dataUrl);
		const blob = await response.blob();
		form.append("input_image_0", blob as unknown as File);
	}
	return form;
}

/**
 * Generate a stamp using CF Workers AI (free).
 * Two-stage: LLM enhances prompt → image model generates image.
 *
 * @param hd - Use Flux 2 Klein 9B (1024x1024, 4 steps) instead of Flux 1 Schnell.
 * @param referenceImageData - Reference image for img2img (requires hd=true, must be ≤512x512).
 */
export async function generateStamp(
	ai: Ai,
	userPrompt: string,
	style: StampStyle = "vintage",
	hd = false,
	referenceImageData?: Uint8Array,
): Promise<GenerateStampResult> {
	// Reference images only supported with FLUX.2 (HD mode)
	if (referenceImageData && !hd) {
		throw new Error("Reference images require HD generation (FLUX.2 model).");
	}

	// Stage 1: Auto-enhance prompt with LLM
	let enhancedPrompt: string;
	try {
		enhancedPrompt = await enhancePrompt(ai, userPrompt, style);
	} catch {
		enhancedPrompt = buildFallbackPrompt(userPrompt, style);
	}

	// Stage 2 & 3: Run image generation and description in parallel
	// Description only needs enhancedPrompt, not the image, so they can run concurrently
	const [imageResult, description] = await Promise.all([
		// Image generation
		(async () => {
			let response: { image?: string };
			if (hd) {
				// Flux 2 Klein 9B — 1024x1024, fixed 4 steps, supports reference images
				const form = await buildMultipartInput(
					{
						prompt: enhancedPrompt,
						width: "1024",
						height: "1024",
					},
					referenceImageData,
				);
				// FormData must be wrapped in Response to get body stream and content-type
				const formResponse = new Response(form);
				response = (await ai.run(
					// @ts-expect-error — model name valid at runtime
					"@cf/black-forest-labs/flux-2-klein-9b",
					{
						multipart: {
							body: formResponse.body,
							contentType:
								formResponse.headers.get("content-type") ??
								"multipart/form-data",
						},
					},
				)) as { image?: string };
			} else {
				// Flux 1 Schnell — default, fast, 8 steps (no reference image support)
				response = (await ai.run("@cf/black-forest-labs/flux-1-schnell", {
					prompt: enhancedPrompt,
					steps: 8,
				})) as { image?: string };
			}

			if (!response.image) {
				throw new Error(
					hd
						? "No image generated by Flux 2 Klein."
						: "No image generated by Flux Schnell.",
				);
			}

			const imageBytes = Uint8Array.from(atob(response.image), (c) =>
				c.charCodeAt(0),
			);

			return imageBytes;
		})(),
		// Description generation (parallel with image generation)
		generateDescription(ai, userPrompt, enhancedPrompt),
	]);

	return {
		imageData: imageResult,
		mimeType: "image/jpeg",
		enhancedPrompt,
		description,
	};
}
