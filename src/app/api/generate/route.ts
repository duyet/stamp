import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { events, stamps } from "@/db/schema";
import { addTags, createConversation } from "@/lib/agentstate";
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

		// Extract location data from Cloudflare headers
		const locationCountry = request.headers.get("cf-ipcountry") ?? undefined;
		const locationCity = request.headers.get("cf-ipcity") ?? undefined;
		const locationLat = request.headers.get("cf-iplatitude")
			? Number(request.headers.get("cf-iplatitude"))
			: undefined;
		const locationLng = request.headers.get("cf-iplongitude")
			? Number(request.headers.get("cf-iplongitude"))
			: undefined;

		const body = await request.json();
		const {
			prompt,
			style = "vintage",
			isPublic = true,
			hd = false,
			timezone,
			referenceImageData, // base64 string from client
		} = body as {
			prompt: string;
			style?: StampStyle;
			isPublic?: boolean;
			hd?: boolean;
			timezone?: string;
			referenceImageData?: string; // base64-encoded PNG
		};

		// Validate input before deducting credits
		const hasReference =
			referenceImageData &&
			typeof referenceImageData === "string" &&
			referenceImageData.trim().length > 0;

		// Reference images require HD mode (FLUX.2)
		if (hasReference && !hd) {
			return NextResponse.json(
				{ error: "Reference images require HD generation." },
				{ status: 400 },
			);
		}

		if (
			!hasReference &&
			(!prompt ||
				typeof prompt !== "string" ||
				prompt.trim().length === 0 ||
				prompt.length > 500)
		) {
			return NextResponse.json(
				{ error: "Prompt is required and must be under 500 characters." },
				{ status: 400 },
			);
		}

		// Still validate prompt length if provided even with reference
		if (prompt && typeof prompt === "string" && prompt.length > 500) {
			return NextResponse.json(
				{ error: "Prompt must be under 500 characters." },
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

		// Convert base64 reference image to Uint8Array if provided
		let referenceImageBytes: Uint8Array | undefined;
		if (referenceImageData) {
			// Remove data URL prefix if present
			const base64Data = referenceImageData.includes(",")
				? referenceImageData.split(",")[1]
				: referenceImageData;
			const binaryString = atob(base64Data);
			referenceImageBytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				referenceImageBytes[i] = binaryString.charCodeAt(i);
			}
		}

		const { imageData, mimeType, enhancedPrompt, description } =
			await generateStamp(ai, prompt || "", style, hd, referenceImageBytes);

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
			locationCity,
			locationCountry,
			locationLat,
			locationLng,
			userTimezone: timezone,
			userAgent: request.headers.get("user-agent") ?? undefined,
			referrer: request.headers.get("referer") ?? undefined,
		});

		// Fire-and-forget event tracking
		db.insert(events)
			.values({
				id: nanoid(12),
				event: "generation",
				metadata: JSON.stringify({
					style,
					hd,
					prompt_length: prompt?.length ?? 0,
					stamp_id: stampId,
					generation_time_ms: generationTimeMs,
					has_reference: !!referenceImageData,
				}),
				userIp,
				createdAt: Date.now(),
			})
			.catch((err: unknown) => {
				console.error("Failed to track generation event:", err);
			});

		// Fire-and-forget AgentState conversation logging
		const agentStateKey = env.AGENTSTATE_API_KEY;
		if (agentStateKey) {
			const agentStateStart = Date.now();
			createConversation(agentStateKey, {
				external_id: `stamp-${stampId}`,
				title: prompt.slice(0, 100),
				metadata: {
					stamp_id: stampId,
					style,
					hd: !!hd,
					user_id: userId ?? null,
					user_ip: userIp,
					generation_time_ms: generationTimeMs,
					location_country: locationCountry ?? null,
					location_city: locationCity ?? null,
					timezone: timezone ?? null,
				},
				messages: [
					{
						role: "user",
						content: prompt,
						metadata: { style, hd: !!hd },
					},
					{
						role: "assistant",
						content: description ?? enhancedPrompt ?? prompt,
						metadata: {
							enhanced_prompt: enhancedPrompt,
							image_url: imageUrl,
							stamp_id: stampId,
						},
					},
				],
			})
				.then((conv) => {
					const tags = ["stamp"];
					if (userId) tags.push(`user:${userId}`);
					if (style) tags.push(`style:${style}`);
					if (locationCountry) tags.push(`country:${locationCountry}`);
					return addTags(agentStateKey, conv.id, tags).then(() => {
						console.log(
							`[AgentState] logged stamp=${stampId} conv=${conv.id} tags=${tags.join(",")} ${Date.now() - agentStateStart}ms`,
						);
					});
				})
				.catch((err: unknown) => {
					console.error(
						`[AgentState] FAILED stamp=${stampId} error=${err instanceof Error ? err.message : String(err)}`,
					);
				});
		} else {
			console.warn(
				"[AgentState] AGENTSTATE_API_KEY not set, skipping conversation log",
			);
		}

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
