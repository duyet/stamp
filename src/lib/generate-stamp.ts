import { STAMP_STYLE_PRESETS, type StampStyle } from "./stamp-prompts";

interface GenerateStampResult {
	imageData: Uint8Array;
	mimeType: string;
	enhancedPrompt: string;
	description: string;
}

type Flux2KleinModel = {
	inputs: {
		multipart: {
			body: ReadableStream<Uint8Array> | null;
			contentType: string;
		};
	};
	postProcessedOutputs: { image?: string };
};

type StampAi = Ai<
	AiModels & {
		"@cf/black-forest-labs/flux-2-klein-9b": Flux2KleinModel;
	}
>;

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

CRITICAL COMPOSITION RULES — HIGHEST PRIORITY:
- The stamp design MUST fill 95%+ of the entire canvas — zoom in extremely tight, near-zero white space
- The subject must be LARGE and dominant, filling the frame edge-to-edge
- NO empty background space, NO wide margins, NO tiny stamp floating in white space
- Think "extreme close-up crop" — the stamp bleeds almost to the image edges
- Every prompt you output MUST end with: "zoomed in tight crop, subject fills 95% of canvas, zero margin, no white space"

Rules:
- Output ONLY the prompt text, no explanation
- Keep it under 150 words
- PRESERVE the user's intent — if they ask for a flag, generate a flag; if they ask for a landscape, generate a landscape; if they ask for a person, generate a person
- Always include these style keywords: "naive folk art", "postage stamp", "stippled shading", "bold black outlines", "perforated edges"
- Use the specific style variation: ${preset.prompt}
- Only include "dot eyes", "facial features", "pose", "expression", or "clothing" if the subject is a person or character
- For non-figure subjects (flags, objects, landscapes, buildings, animals, symbols), describe shapes, patterns, colors, and composition instead
- Do NOT add background elements the user did not ask for — follow the style preset faithfully
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
	return `${preset.prompt}. Subject: ${subject}. No text, no words, no letters, no numbers. Zoomed in tight crop, subject fills 95% of canvas edge-to-edge, zero margin, no white space, the stamp fills the entire image with NO outer padding or frame - ONLY the stamp itself visible, NOTHING else.`;
}

export async function describeStamp(
	ai: Ai,
	userPrompt: string,
	enhancedPrompt: string,
	style: StampStyle,
): Promise<string> {
	const preset = STAMP_STYLE_PRESETS[style];
	const sourcePrompt = userPrompt.trim() || enhancedPrompt.trim();
	const fallback = `${preset.name} stamp of ${sourcePrompt || "a reference image"}`;

	try {
		const response = (await ai.run("@cf/qwen/qwen3-30b-a3b-fp8", {
			messages: [
				{
					role: "system",
					content: `You are an art critic writing a caption for a postage stamp illustration in the ${preset.name} style. Write one evocative sentence (max 20 words) that captures what the stamp depicts and its artistic feel. Describe the subject and mood — NOT the prompt or technique. Be poetic but concrete. Examples:
- "A watchful cat rendered in muted blue-grey stipple, gazing serenely from a cream-colored stamp."
- "A solitary lighthouse stands against a stippled sky, its beam cutting through soft blue-grey haze."
- "Bold black outlines frame a sunflower in golden mustard, its petals radiating against a cream ground."
Never start with "A stamp of" or mention the style name. Output only the caption text.`,
				},
				{
					role: "user",
					content: `Subject: ${userPrompt || "a reference image"}\nStyle: ${preset.name}`,
				},
			],
			max_tokens: 60,
			temperature: 0.5,
		})) as { response?: string };

		const description = response.response?.trim().replace(/^["']|["']$/g, "");
		return description || fallback;
	} catch (err) {
		console.warn(
			"[Generate] Description generation failed, using fallback:",
			err instanceof Error ? err.message : String(err),
		);
		return fallback;
	}
}

/**
 * Build multipart form data for Flux 2 models.
 * Supports reference images via input_image_0, input_image_1, etc.
 * All reference images must be ≤512x512 pixels.
 */
function buildMultipartInput(
	params: Record<string, string>,
	referenceImageData?: Uint8Array,
): FormData {
	const form = new FormData();
	for (const [key, value] of Object.entries(params)) {
		form.append(key, value);
	}
	// Add reference image if provided (for img2img with FLUX.2)
	// Convert to ArrayBuffer for Blob construction (avoid data URL fetch overhead)
	if (referenceImageData) {
		// Create a copy of the ArrayBuffer to avoid SharedArrayBuffer type issues
		const arrayBuffer = new ArrayBuffer(referenceImageData.byteLength);
		const view = new Uint8Array(arrayBuffer);
		view.set(referenceImageData);
		const isJpeg =
			referenceImageData[0] === 0xff &&
			referenceImageData[1] === 0xd8 &&
			referenceImageData[2] === 0xff;
		const mimeType = isJpeg ? "image/jpeg" : "image/png";
		const file = new File(
			[arrayBuffer],
			`reference.${isJpeg ? "jpg" : "png"}`,
			{
				type: mimeType,
			},
		);
		form.append("input_image_0", file);
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
	} catch (err) {
		console.warn(
			"[Generate] Prompt enhancement failed, using fallback:",
			err instanceof Error ? err.message : String(err),
		);
		enhancedPrompt = buildFallbackPrompt(userPrompt, style);
	}

	// Stage 2: Generate image
	const imageResult = await (async () => {
		let response: { image?: string };
		if (hd) {
			const stampAi = ai as StampAi;
			// Flux 2 Klein 9B — 1024x1024, fixed 4 steps, supports reference images
			const form = buildMultipartInput(
				{
					prompt: enhancedPrompt,
					width: "1024",
					height: "1024",
				},
				referenceImageData,
			);
			// FormData must be wrapped in Response to get body stream and content-type
			const formResponse = new Response(form);
			response = await stampAi.run("@cf/black-forest-labs/flux-2-klein-9b", {
				multipart: {
					body: formResponse.body,
					contentType:
						formResponse.headers.get("content-type") ?? "multipart/form-data",
				},
			});
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

		return Uint8Array.from(atob(response.image), (c) => c.charCodeAt(0));
	})();

	const description = await describeStamp(
		ai,
		userPrompt,
		enhancedPrompt,
		style,
	);

	return {
		imageData: imageResult,
		mimeType: "image/jpeg",
		enhancedPrompt,
		description,
	};
}
