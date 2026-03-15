import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { stamps } from "@/db/schema";
import { getEnv } from "@/lib/env";
import { generateStampFree, generateStampPremium } from "@/lib/generate-stamp";
import { checkRateLimit } from "@/lib/rate-limit";
import type { StampStyle } from "@/lib/stamp-prompts";

export async function POST(request: NextRequest) {
	try {
		const env = getEnv();
		const db = getDb();

		const userIp =
			request.headers.get("cf-connecting-ip") ||
			request.headers.get("x-forwarded-for") ||
			"unknown";

		const { allowed, remaining } = await checkRateLimit(db, userIp);
		if (!allowed) {
			return NextResponse.json(
				{
					error:
						"Rate limit exceeded. You can generate 5 stamps per day for free.",
					remaining: 0,
				},
				{ status: 429 },
			);
		}

		const body = await request.json();
		const {
			prompt,
			style = "vintage",
			isPublic = true,
		} = body as {
			prompt: string;
			style?: StampStyle;
			isPublic?: boolean;
		};

		if (!prompt || prompt.length > 500) {
			return NextResponse.json(
				{ error: "Prompt is required and must be under 500 characters." },
				{ status: 400 },
			);
		}

		// Generate stamp: free (CF AI) or premium (Imagen 4)
		const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
		const ai = env.AI;

		let imageData: Uint8Array;
		let mimeType: string;
		let enhancedPrompt: string;

		if (geminiKey) {
			// Premium: Imagen 4 Fast with LLM prompt enhancement
			({ imageData, mimeType, enhancedPrompt } = await generateStampPremium(
				geminiKey,
				prompt,
				style,
				ai,
			));
		} else if (ai) {
			// Free: CF Workers AI (Flux Schnell + LLM enhancement)
			({ imageData, mimeType, enhancedPrompt } = await generateStampFree(
				ai,
				prompt,
				style,
			));
		} else {
			return NextResponse.json(
				{ error: "No image generation provider configured." },
				{ status: 503 },
			);
		}

		// Upload to R2
		const stampId = nanoid(12);
		const ext = mimeType.includes("png") ? "png" : "jpg";
		const key = `stamps/${stampId}.${ext}`;

		await (env.STAMPS_BUCKET as unknown as R2Bucket).put(key, imageData, {
			httpMetadata: { contentType: mimeType },
		});

		const imageUrl = `/api/stamps/${stampId}/image`;

		await db.insert(stamps).values({
			id: stampId,
			prompt,
			imageUrl,
			style,
			isPublic,
			userIp,
		});

		return NextResponse.json({
			id: stampId,
			imageUrl,
			prompt,
			enhancedPrompt,
			style,
			remaining,
		});
	} catch (error) {
		console.error("Stamp generation failed:", error);
		return NextResponse.json(
			{ error: "Failed to generate stamp. Please try again." },
			{ status: 500 },
		);
	}
}
