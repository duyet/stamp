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
	referenceDescription?: string,
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
- Keep the composition centered
- If a reference image description is provided, use it as the primary subject and composition guide, then apply the user's additional instructions on top
- PRESERVE key visual elements from the reference (subject, colors, composition, mood)`;

	const userMessage = referenceDescription
		? `Reference image description: ${referenceDescription}\n\nUser's additional instructions: ${userPrompt || "Generate a stamp based on this reference image."}`
		: userPrompt;

	const response = (await ai.run("@cf/qwen/qwen3-30b-a3b-fp8", {
		messages: [
			{ role: "system", content: systemPrompt },
			{ role: "user", content: userMessage },
		],
		max_tokens: 300,
		temperature: 0.7,
	})) as { response?: string };

	return (
		response.response?.trim() ||
		buildFallbackPrompt(userPrompt, style, referenceDescription)
	);
}

/**
 * Fallback prompt builder if LLM enhancement fails.
 */
function buildFallbackPrompt(
	userPrompt: string,
	style: StampStyle,
	referenceDescription?: string,
): string {
	const preset = STAMP_STYLE_PRESETS[style];
	const subject = referenceDescription
		? `Based on reference: ${referenceDescription}.${userPrompt ? ` Additional: ${userPrompt}` : ""}`
		: `Subject: ${userPrompt}`;
	return `${preset.prompt}. ${subject}. No text, no words, no letters, no numbers. The stamp fills the entire image with no outer padding or frame.`;
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
 * Build multipart form data for Flux 2 models that require it.
 * Returns the FormData object directly (CF Workers AI expects FormData, not a stream).
 */
function buildMultipartInput(params: Record<string, string>): FormData {
	const form = new FormData();
	for (const [key, value] of Object.entries(params)) {
		form.append(key, value);
	}
	return form;
}

/**
 * Generate a stamp using CF Workers AI (free).
 * Two-stage: LLM enhances prompt → image model generates image.
 *
 * @param hd - Use Flux 2 Klein 9B (1024x1024, 4 steps) instead of Flux 1 Schnell.
 */
export async function generateStamp(
	ai: Ai,
	userPrompt: string,
	style: StampStyle = "vintage",
	hd = false,
	referenceDescription?: string,
): Promise<GenerateStampResult> {
	// Stage 1: Auto-enhance prompt with LLM
	let enhancedPrompt: string;
	try {
		enhancedPrompt = await enhancePrompt(
			ai,
			userPrompt,
			style,
			referenceDescription,
		);
	} catch {
		enhancedPrompt = buildFallbackPrompt(
			userPrompt,
			style,
			referenceDescription,
		);
	}

	// Stage 2: Model selection based on HD flag
	// Flux 2 models require multipart form data input (FormData passed directly)
	// Flux 1 Schnell can use plain object input (simpler, no multipart needed)
	let response: { image?: string };
	if (hd) {
		// Flux 2 Klein 9B — 1024x1024, fixed 4 steps
		// Uses multipart form data with FormData passed directly
		const form = buildMultipartInput({
			prompt: enhancedPrompt,
			width: "1024",
			height: "1024",
		});
		response = (await ai.run(
			// @ts-expect-error — model name valid at runtime, FormData works at runtime for multipart.body
			"@cf/black-forest-labs/flux-2-klein-9b",
			{
				multipart: {
					body: form as unknown as ReadableStream,
					contentType: "multipart/form-data",
				},
			},
		)) as { image?: string };
	} else {
		// Flux 1 Schnell — default, fast, 8 steps
		// Uses plain object input (simpler, no multipart needed)
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

	// Stage 3: Generate human-friendly description
	const description = await generateDescription(ai, userPrompt, enhancedPrompt);

	return {
		imageData: imageBytes,
		mimeType: "image/jpeg",
		enhancedPrompt,
		description,
	};
}
