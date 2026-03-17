import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { events, stamps } from "@/db/schema";
import {
	checkAndDeductCredit,
	HD_CREDIT_COST,
	STANDARD_CREDIT_COST,
} from "@/lib/credits";
import { getEnv } from "@/lib/env";
import { generateStamp } from "@/lib/generate-stamp";
import { getClientIp } from "@/lib/get-client-ip";
import { checkRateLimit } from "@/lib/rate-limit";
import { STAMP_STYLE_PRESETS, type StampStyle } from "@/lib/stamp-prompts";

export async function POST(request: NextRequest) {
	try {
		const env = getEnv();
		const db = getDb();

		const { userId } = await auth();
		const userIp = getClientIp(request.headers);

		const body = await request.json();
		const {
			prompt,
			style = "vintage",
			isPublic = true,
			hd = false,
		} = body as {
			prompt: string;
			style?: StampStyle;
			isPublic?: boolean;
			hd?: boolean;
		};

		// Validate input before deducting credits
		if (
			!prompt ||
			typeof prompt !== "string" ||
			prompt.trim().length === 0 ||
			prompt.length > 500
		) {
			return NextResponse.json(
				{ error: "Prompt is required and must be under 500 characters." },
				{ status: 400 },
			);
		}

		const validStyles = Object.keys(STAMP_STYLE_PRESETS);
		if (!validStyles.includes(style)) {
			return NextResponse.json(
				{ error: `Invalid style. Must be one of: ${validStyles.join(", ")}` },
				{ status: 400 },
			);
		}

		// HD generation requires authentication
		if (hd && !userId) {
			return NextResponse.json(
				{ error: "HD generation requires sign-in." },
				{ status: 401 },
			);
		}

		const creditCost = hd ? HD_CREDIT_COST : STANDARD_CREDIT_COST;
		const { allowed, remaining } = userId
			? await checkAndDeductCredit(db, userId, creditCost)
			: await checkRateLimit(db, userIp);

		if (!allowed) {
			return NextResponse.json(
				{
					error: userId
						? "Credit limit exceeded. Purchase more credits to continue."
						: "Rate limit exceeded. Sign in for 100 stamps per day, or try again tomorrow.",
					remaining: 0,
				},
				{ status: 429 },
			);
		}

		const ai = env.AI;
		if (!ai) {
			return NextResponse.json(
				{ error: "AI binding not configured." },
				{ status: 503 },
			);
		}

		// Time the generation (LLM enhancement + image generation)
		const genStart = Date.now();

		const { imageData, mimeType, enhancedPrompt, description } =
			await generateStamp(ai, prompt, style, hd);

		const generationTimeMs = Date.now() - genStart;

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
			enhancedPrompt,
			description,
			imageUrl,
			style,
			isPublic,
			userIp,
			userId: userId ?? null,
		});

		// Fire-and-forget event tracking
		db.insert(events)
			.values({
				id: nanoid(12),
				event: "generation",
				metadata: JSON.stringify({
					style,
					hd,
					prompt_length: prompt.length,
					stamp_id: stampId,
					generation_time_ms: generationTimeMs,
				}),
				userIp,
				createdAt: Date.now(),
			})
			.catch((err: unknown) => {
				console.error("Failed to track generation event:", err);
			});

		return NextResponse.json({
			id: stampId,
			imageUrl,
			prompt,
			enhancedPrompt,
			description,
			style,
			hd,
			remaining,
			generationTimeMs,
		});
	} catch (error) {
		console.error("Stamp generation failed:", error);
		return NextResponse.json(
			{ error: "Failed to generate stamp. Please try again." },
			{ status: 500 },
		);
	}
}
