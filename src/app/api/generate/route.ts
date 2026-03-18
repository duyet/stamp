import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/db";
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
 * Constants for image validation.
 */
const MAX_REFERENCE_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_BASE64_INPUT_LENGTH = 10 * 1024 * 1024; // 10MB base64

// PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
const PNG_MAGIC_BYTES = new Uint8Array([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
// JPEG magic bytes: FF D8 FF
const JPEG_MAGIC_BYTES = new Uint8Array([0xff, 0xd8, 0xff]);

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

/**
 * Refund credits if generation fails after deduction.
 * Uses atomic SQL to safely decrement the credit counter.
 */
async function refundCredits(
	db: Database,
	userId: string | null,
	userIp: string,
	creditCost: number,
): Promise<void> {
	if (userId) {
		// Refund to daily credits or purchased credits atomically
		await db.$client
			.prepare(
				`UPDATE user_credits SET daily_used = daily_used - ?, updated_at = ? WHERE user_id = ? AND daily_used > 0`,
			)
			.bind(creditCost, Date.now(), userId)
			.run();
	} else {
		// Refund anonymous rate limit
		await db.$client
			.prepare(
				`UPDATE rate_limits SET generations_count = generations_count - 1 WHERE user_ip = ? AND generations_count > 0`,
			)
			.bind(userIp)
			.run();
	}
}

/**
 * Validate and decode a base64 reference image.
 * Returns Uint8Array of image data or throws on error.
 */
function validateReferenceImage(referenceImageData: string): Uint8Array {
	// Validate input length before decoding (base64 inflates by ~33%)
	if (referenceImageData.length > MAX_BASE64_INPUT_LENGTH) {
		throw new Error(
			`Reference image too large. Maximum size is ${MAX_REFERENCE_IMAGE_SIZE / 1024 / 1024}MB.`,
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

	// Validate base64 format (only valid base64 characters, minimum length)
	// Fixed: Empty string "" matches /[A-Za-z0-9+/]*={0,2}/ so we require minimum length
	if (!/^[A-Za-z0-9+/]{8,}={0,2}$/.test(base64Data)) {
		throw new Error("Invalid base64 format in reference image.");
	}

	// Decode base64 with error handling
	const binaryString = atob(base64Data);

	// Check decoded size
	if (binaryString.length > MAX_REFERENCE_IMAGE_SIZE) {
		throw new Error(
			`Reference image too large (${Math.round(binaryString.length / 1024 / 1024)}MB). Maximum size is ${MAX_REFERENCE_IMAGE_SIZE / 1024 / 1024}MB.`,
		);
	}

	// Validate image magic bytes for security
	const firstBytes = new Uint8Array(8);
	for (let i = 0; i < Math.min(8, binaryString.length); i++) {
		firstBytes[i] = binaryString.charCodeAt(i);
	}

	// Check PNG magic bytes (all 8 bytes: 89 50 4E 47 0D 0A 1A 0A)
	const isPng =
		firstBytes.length >= 8 &&
		firstBytes[0] === PNG_MAGIC_BYTES[0] &&
		firstBytes[1] === PNG_MAGIC_BYTES[1] &&
		firstBytes[2] === PNG_MAGIC_BYTES[2] &&
		firstBytes[3] === PNG_MAGIC_BYTES[3] &&
		firstBytes[4] === PNG_MAGIC_BYTES[4] &&
		firstBytes[5] === PNG_MAGIC_BYTES[5] &&
		firstBytes[6] === PNG_MAGIC_BYTES[6] &&
		firstBytes[7] === PNG_MAGIC_BYTES[7];

	// Check JPEG magic bytes (FF D8 FF)
	const isJpeg =
		firstBytes.length >= 3 &&
		firstBytes[0] === JPEG_MAGIC_BYTES[0] &&
		firstBytes[1] === JPEG_MAGIC_BYTES[1] &&
		firstBytes[2] === JPEG_MAGIC_BYTES[2];

	if (!isPng && !isJpeg) {
		throw new Error("Reference image must be a valid PNG or JPEG file.");
	}

	// Validate MIME type if provided in data URL
	if (expectedMimeType) {
		const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg"];
		if (!allowedMimeTypes.includes(expectedMimeType)) {
			throw new Error(
				`Invalid image type: ${expectedMimeType}. Allowed types: PNG, JPEG`,
			);
		}
	}

	// Convert to Uint8Array
	const uint8Array = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		uint8Array[i] = binaryString.charCodeAt(i);
	}
	return uint8Array;
}

export async function POST(request: NextRequest) {
	// Track whether credits were deducted for refund in catch block
	let creditsDeducted = false;
	let dbForRefund: Database | undefined;
	let userIdForRefund: string | null = null;
	let userIpForRefund = "";
	let creditCostForRefund = 1;

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

		// Track credit info for potential refund
		creditsDeducted = true;
		dbForRefund = db;
		userIdForRefund = userId;
		userIpForRefund = userIp;
		creditCostForRefund = creditCost;

		const ai = env.AI;
		if (!ai) {
			return NextResponse.json(
				{ error: "AI binding not configured." },
				{ status: 503 },
			);
		}

		// Time the generation (LLM enhancement + image generation)
		const genStart = Date.now();

		// Validate and decode reference image if provided (throws on error)
		let referenceImageBytes: Uint8Array | undefined;
		if (referenceImageData) {
			try {
				referenceImageBytes = validateReferenceImage(referenceImageData);
			} catch (error) {
				// Image validation failed - refund credits and return error
				await refundCredits(db, userId, userIp, creditCost);
				const errorMessage =
					error instanceof Error ? error.message : "Invalid reference image.";
				return NextResponse.json(
					{ error: errorMessage },
					{ status: errorMessage.includes("too large") ? 413 : 400 },
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
			imageExt: ext,
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
		// Refund credits if generation fails after deduction
		// This handles failures in generateStamp() or R2 upload
		if (creditsDeducted && dbForRefund) {
			try {
				await refundCredits(
					dbForRefund,
					userIdForRefund,
					userIpForRefund,
					creditCostForRefund,
				);
			} catch (refundError) {
				console.error(
					"[Generate] Failed to refund credits:",
					sanitizeErrorForLogging(refundError),
				);
			}
		}

		// Log sanitized error for debugging, but don't leak details to client
		console.error("Stamp generation failed:", sanitizeErrorForLogging(error));
		return NextResponse.json(
			{ error: "Failed to generate stamp. Please try again." },
			{ status: 500 },
		);
	}
}
