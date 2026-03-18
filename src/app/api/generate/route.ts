import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { events, stamps } from "@/db/schema";
import { addTags, createConversation } from "@/lib/agentstate";
import { getAuthUserId } from "@/lib/clerk";
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

/**
 * Sanitize error messages for logging to prevent leaking sensitive information.
 * Removes potential API keys, tokens, and other sensitive patterns.
 */
function sanitizeErrorForLogging(error: unknown): string {
	if (error instanceof Error) {
		// Remove common sensitive patterns from error messages
		const sanitized = error.message
			.replace(/api[_-]?key["\s:=]+[^\s,}]*/gi, "api_key=***")
			.replace(/token["\s:=]+[^\s,}]*/gi, "token=***")
			.replace(/secret["\s:=]+[^\s,}]*/gi, "secret=***")
			.replace(/password["\s:=]+[^\s,}]*/gi, "password=***")
			.replace(/bearer["\s:=]+[^\s,}]*/gi, "bearer=***")
			.replace(/sk-[a-zA-Z0-9]{20,}/g, "sk-***")
			.replace(/["\s:]([^"\\]{10,})["\\]/g, (match) => {
				// Truncate long strings that might be sensitive
				const content = match.slice(1, -1);
				if (content.length > 50) {
					return `"${content.slice(0, 20)}...${content.slice(-10)}"`;
				}
				return match;
			});
		return sanitized;
	}
	return String(error);
}

export async function POST(request: NextRequest) {
	try {
		const env = getEnv();
		const db = getDb();

		const { userId } = await getAuthUserId(request.headers);
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
		// Maximum decoded size: 5MB (to prevent DoS)
		const MAX_REFERENCE_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
		let referenceImageBytes: Uint8Array | undefined;
		if (referenceImageData) {
			try {
				// Validate input length before decoding (base64 inflates by ~33%)
				if (referenceImageData.length > 10 * 1024 * 1024) {
					// 10MB base64 is approximately 7.5MB decoded - reject early
					return NextResponse.json(
						{ error: "Reference image too large. Maximum size is 5MB." },
						{ status: 413 },
					);
				}

				// Extract base64 data from data URL if present
				let base64Data: string;
				let expectedMimeType: string | null = null;

				if (referenceImageData.includes(",")) {
					const [prefix, data] = referenceImageData.split(",", 2);
					base64Data = data;
					// Extract MIME type from data URL prefix (e.g., "data:image/png;base64")
					const mimeMatch = prefix.match(/data:([^;]+);base64/);
					if (mimeMatch) {
						expectedMimeType = mimeMatch[1];
					}
				} else {
					base64Data = referenceImageData;
				}

				// Validate base64 format (only valid base64 characters)
				if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
					return NextResponse.json(
						{ error: "Invalid base64 format in reference image." },
						{ status: 400 },
					);
				}

				// Decode base64 with error handling
				const binaryString = atob(base64Data);

				// Check decoded size
				if (binaryString.length > MAX_REFERENCE_IMAGE_SIZE) {
					return NextResponse.json(
						{
							error: `Reference image too large (${Math.round(binaryString.length / 1024 / 1024)}MB). Maximum size is 5MB.`,
						},
						{ status: 413 },
					);
				}

				// Validate image magic bytes for security
				const firstBytes = new Uint8Array(8);
				for (let i = 0; i < Math.min(8, binaryString.length); i++) {
					firstBytes[i] = binaryString.charCodeAt(i);
				}

				// PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
				const isPng =
					firstBytes[0] === 0x89 &&
					firstBytes[1] === 0x50 &&
					firstBytes[2] === 0x4e &&
					firstBytes[3] === 0x47;

				// JPEG magic bytes: FF D8 FF
				const isJpeg =
					firstBytes[0] === 0xff &&
					firstBytes[1] === 0xd8 &&
					firstBytes[2] === 0xff;

				if (!isPng && !isJpeg) {
					return NextResponse.json(
						{ error: "Reference image must be a valid PNG or JPEG file." },
						{ status: 400 },
					);
				}

				// Convert to Uint8Array
				referenceImageBytes = new Uint8Array(binaryString.length);
				for (let i = 0; i < binaryString.length; i++) {
					referenceImageBytes[i] = binaryString.charCodeAt(i);
				}

				// Validate MIME type if provided in data URL
				if (expectedMimeType) {
					const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg"];
					if (!allowedMimeTypes.includes(expectedMimeType)) {
						return NextResponse.json(
							{
								error: `Invalid image type: ${expectedMimeType}. Allowed types: PNG, JPEG`,
							},
							{ status: 400 },
						);
					}
				}
			} catch (error) {
				// atob() throws on invalid base64
				return NextResponse.json(
					{
						error:
							"Failed to decode reference image. Please ensure it's a valid base64-encoded image.",
					},
					{ status: 400 },
				);
			}
		}

		const { imageData, mimeType, enhancedPrompt, description } =
			await generateStamp(ai, prompt || "", style, hd, referenceImageBytes);

		const generationTimeMs = Date.now() - genStart;

		// Upload to R2
		const stampId = nanoid(12);
		const ext = mimeType.includes("png") ? "png" : "jpg";
		const key = `stamps/${stampId}.${ext}`;

		// Log generation metrics for monitoring
		const model = hd ? "flux-2-klein" : "flux-1-schnell";
		const slowThreshold = 30000; // 30 seconds
		const isSlow = generationTimeMs > slowThreshold;

		console.log(
			`[Generate] stamp=${stampId} model=${model} style=${style} hd=${hd} time=${generationTimeMs}ms${isSlow ? " SLOW!" : ""} prompt_length=${prompt?.length ?? 0}`,
		);

		if (isSlow) {
			console.warn(
				`[Generate] SLOW GENERATION DETECTED: ${generationTimeMs}ms for stamp=${stampId} model=${model} style=${style}`,
			);
		}

		await (env.STAMPS_BUCKET as unknown as R2Bucket).put(key, imageData, {
			httpMetadata: { contentType: mimeType },
		});

		const imageUrl = `/api/stamps/${stampId}/image`;

		await db.insert(stamps).values({
			id: stampId,
			prompt: prompt?.trim() || "Generated from reference image",
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
						`[AgentState] FAILED stamp=${stampId} error=${sanitizeErrorForLogging(err)}`,
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
		// Log sanitized error for debugging, but don't leak details to client
		console.error("Stamp generation failed:", sanitizeErrorForLogging(error));
		return NextResponse.json(
			{ error: "Failed to generate stamp. Please try again." },
			{ status: 500 },
		);
	}
}
