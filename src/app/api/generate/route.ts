import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { events, stamps } from "@/db/schema";
import { getEnv } from "@/lib/env";
import { generateStamp } from "@/lib/generate-stamp";
import { checkRateLimit } from "@/lib/rate-limit";
import { STAMP_STYLE_PRESETS, type StampStyle } from "@/lib/stamp-prompts";

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

		const ai = env.AI;
		if (!ai) {
			return NextResponse.json(
				{ error: "AI binding not configured." },
				{ status: 503 },
			);
		}

		const { imageData, mimeType, enhancedPrompt } = await generateStamp(
			ai,
			prompt,
			style,
		);

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
			imageUrl,
			style,
			isPublic,
			userIp,
		});

		// Fire-and-forget event tracking — do not await to avoid slowing response
		db.insert(events)
			.values({
				id: nanoid(12),
				event: "generation",
				metadata: JSON.stringify({
					style,
					prompt_length: prompt.length,
					stamp_id: stampId,
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
