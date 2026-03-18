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
import { refundCredits } from "@/lib/refund-credits";
import { sanitizeErrorForLogging } from "@/lib/sanitize-error";
import { STAMP_STYLE_PRESETS, type StampStyle } from "@/lib/stamp-prompts";
import { validateReferenceImage } from "@/lib/validate-image";

export async function POST(request: NextRequest) {
	// Track whether credits were deducted for refund in catch block
	let creditsDeducted = false;
	let dbForRefund: Database | undefined;
	let userIdForRefund: string | null = null;
	let userIpForRefund = "";
	let creditCostForRefund = 1;
	let creditSourceForRefund: "daily" | "purchased" = "daily";

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
		const creditResult = userId
			? await checkAndDeductCredit(db, userId, creditCost)
			: await checkRateLimit(db, userIp);

		const { allowed, remaining } = creditResult;
		const resetAt =
			"resetAt" in creditResult ? creditResult.resetAt : undefined;
		const creditSource =
			"source" in creditResult &&
			(creditResult.source === "daily" || creditResult.source === "purchased")
				? creditResult.source
				: "daily";

		if (!allowed) {
			return NextResponse.json(
				{
					error: userId
						? "Credit limit exceeded. Purchase more credits to continue."
						: "Rate limit exceeded. Sign in for 100 stamps per day, or try again tomorrow.",
					remaining: 0,
					resetAt,
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
		creditSourceForRefund = creditSource;

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
				await refundCredits(db, userId, userIp, creditCost, creditSource);
				// Mark credits as refunded to prevent double refund in outer catch
				creditsDeducted = false;
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

		// Upload to R2 first (we'll clean up if DB insert fails)
		await (env.STAMPS_BUCKET as unknown as R2Bucket).put(key, imageData, {
			httpMetadata: { contentType: mimeType },
		});

		const imageUrl = `/api/stamps/${stampId}/image`;

		// Insert into database with cleanup on failure
		try {
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
		} catch (dbError) {
			// DB insert failed - clean up orphaned R2 object
			try {
				await (env.STAMPS_BUCKET as unknown as R2Bucket).delete(key);
				console.error(
					`[Generate] DB insert failed, cleaned up R2 object: ${key}`,
					dbError,
				);
			} catch (r2Error) {
				console.error(
					`[Generate] Failed to clean up R2 object after DB failure: ${key}`,
					r2Error,
				);
			}
			// Re-throw DB error to trigger refund in outer catch
			throw dbError;
		}

		// Detached fire-and-forget operations (event tracking + AgentState)
		// These run asynchronously and don't block the response
		Promise.resolve().then(async () => {
			try {
				// Event tracking
				await db.insert(events).values({
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
				});
			} catch (err: unknown) {
				console.error("Failed to track generation event:", err);
			}

			// AgentState conversation logging
			const agentStateKey = env.AGENTSTATE_API_KEY;
			if (agentStateKey) {
				try {
					const agentStateStart = Date.now();
					const conv = await createConversation(agentStateKey, {
						external_id: `stamp-${stampId}`,
						title: prompt?.slice(0, 100) ?? "Stamp generation",
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
								content: prompt ?? "",
								metadata: { style, hd: !!hd },
							},
							{
								role: "assistant",
								content: description ?? enhancedPrompt ?? prompt ?? "",
								metadata: {
									enhanced_prompt: enhancedPrompt,
									image_url: imageUrl,
									stamp_id: stampId,
								},
							},
						],
					});

					const tags = ["stamp"];
					if (userId) tags.push(`user:${userId}`);
					if (style) tags.push(`style:${style}`);
					if (locationCountry) tags.push(`country:${locationCountry}`);

					await addTags(agentStateKey, conv.id, tags);

					console.log(
						`[AgentState] logged stamp=${stampId} conv=${conv.id} tags=${tags.join(",")} ${Date.now() - agentStateStart}ms`,
					);
				} catch (err: unknown) {
					console.error(
						`[AgentState] FAILED stamp=${stampId} error=${sanitizeErrorForLogging(err)}`,
					);
				}
			} else {
				console.warn(
					"[AgentState] AGENTSTATE_API_KEY not set, skipping conversation log",
				);
			}
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
		// Refund credits if generation fails after deduction
		// This handles failures in generateStamp() or R2 upload
		if (creditsDeducted && dbForRefund) {
			try {
				await refundCredits(
					dbForRefund,
					userIdForRefund,
					userIpForRefund,
					creditCostForRefund,
					creditSourceForRefund,
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
