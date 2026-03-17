/**
 * Describe an uploaded image using CF Workers AI vision models.
 * Primary: Llama 3.2 Vision. Fallback: LLaVA.
 */

export const VISION_PROMPT =
	"Describe this image in detail for recreating it as a postage stamp illustration. Focus on: the main subject, colors, composition, mood, and key visual elements. Be specific about shapes, patterns, and spatial relationships. Keep under 200 words.";

export async function describeImage(
	ai: Ai,
	imageData: Uint8Array,
	_mimeType: string,
): Promise<string> {
	const imageArray = [...imageData];

	// Primary: Llama 3.2 Vision
	try {
		const response = (await ai.run("@cf/meta/llama-3.2-11b-vision-instruct", {
			messages: [{ role: "user", content: VISION_PROMPT }],
			image: imageArray,
			max_tokens: 300,
			temperature: 0.3,
		})) as { response?: string };

		const text = response.response?.trim();
		if (text && text.length > 0) {
			return text;
		}
	} catch {
		// Fall through to fallback
	}

	// Fallback: LLaVA
	try {
		const response = (await ai.run("@cf/llava-hf/llava-1.5-7b-hf", {
			image: imageArray,
			prompt: VISION_PROMPT,
			max_tokens: 300,
		})) as { description?: string };

		const text = response.description?.trim();
		if (text && text.length > 0) {
			return text;
		}
	} catch {
		// Fall through to error
	}

	throw new Error(
		"Could not analyze image. Both vision models failed. Try a different photo.",
	);
}
