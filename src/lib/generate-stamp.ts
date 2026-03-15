import { GoogleGenAI } from "@google/genai";
import { buildStampPrompt, type StampStyle } from "./stamp-prompts";

interface GenerateStampResult {
	imageData: Uint8Array;
	mimeType: string;
}

/**
 * Generate a stamp image using Gemini 2.0 Flash (image generation).
 * Uses the Gemini API's native image generation capability.
 */
export async function generateStamp(
	apiKey: string,
	userPrompt: string,
	style: StampStyle = "vintage",
): Promise<GenerateStampResult> {
	const ai = new GoogleGenAI({ apiKey });

	const fullPrompt = buildStampPrompt(userPrompt, style);

	const response = await ai.models.generateContent({
		model: "gemini-2.0-flash-exp",
		contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
		config: {
			responseModalities: ["IMAGE", "TEXT"],
		},
	});

	const parts = response.candidates?.[0]?.content?.parts;
	if (!parts) {
		throw new Error("No response from Gemini");
	}

	for (const part of parts) {
		if (part.inlineData) {
			const imageBytes = Buffer.from(part.inlineData.data!, "base64");
			return {
				imageData: new Uint8Array(imageBytes),
				mimeType: part.inlineData.mimeType || "image/png",
			};
		}
	}

	throw new Error("No image generated. Gemini returned text only.");
}
