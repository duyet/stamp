import { waitUntil } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { nanoid } from "nanoid";
import type { Database } from "@/db";
import { getDb } from "@/db";
import { events, stamps } from "@/db/schema";
import { addTags, createConversation } from "@/lib/agentstate";
import { handleCorsPreflight, jsonResponse } from "@/lib/api-utils";
import { getAuthUserId } from "@/lib/clerk";
import {
	checkAndDeductCredit,
	HD_CREDIT_COST,
	STANDARD_CREDIT_COST,
} from "@/lib/credits";
import { getEnv } from "@/lib/env";
import { generateStamp } from "@/lib/generate-stamp";
import { getClientIp } from "@/lib/get-client-ip";
import { hashIp } from "@/lib/hash-ip";
import { checkRateLimit } from "@/lib/rate-limit";
import { refundCredits } from "@/lib/refund-credits";
import { sanitizeErrorForLogging } from "@/lib/sanitize-error";
import { generateRequestSchema } from "@/lib/schemas";
import {
	buildSetCookieHeader,
	createSessionToken,
	getSessionToken,
} from "@/lib/session-cookie";
import type { StampStyle } from "@/lib/stamp-prompts";
import { validateReferenceImage } from "@/lib/validate-image";

// --- Types ---

interface ValidatedInput {
	prompt: string | undefined;
	style: string;
	stampStyle: StampStyle;
	isPublic: boolean;
	hd: boolean;
	timezone: string | undefined;
	referenceImageBytes: Uint8Array | undefined;
}

interface CreditInfo {
	allowed: boolean;
	remaining: number;
	resetAt: number | undefined;
	creditCost: number;
	source: "daily" | "purchased";
}

interface GenerationResult {
	imageData: Uint8Array;
	mimeType: string;
	enhancedPrompt: string;
	description: string;
	generationTimeMs: number;
}

interface StampPersistParams {
	stampId: string;
	prompt: string | undefined;
	enhancedPrompt: string;
	description: string;
	imageData: Uint8Array;
	mimeType: string;
	style: string;
	isPublic: boolean;
	userIp: string;
	sessionToken: string;
	userId: string | null;
	locationCity?: string;
	locationCountry?: string;
	locationLat?: number;
	locationLng?: number;
	userTimezone?: string;
	userAgent?: string;
	referrer?: string;
}

interface BackgroundEventParams {
	stampId: string;
	prompt: string | undefined;
	enhancedPrompt: string;
	description: string;
	style: string;
	hd: boolean;
	userId: string | null;
	userIp: string;
	generationTimeMs: number;
	imageUrl: string;
	locationCountry?: string;
	locationCity?: string;
	timezone?: string;
	hasReference: boolean;
}

const UPSTREAM_AI_LIMIT_CODE = "UPSTREAM_AI_LIMIT";
const UPSTREAM_AI_LIMIT_MESSAGE =
	"The image generator has reached its upstream free allocation for today. Please try again later.";

// --- Extracted Functions ---

function extractLocation(headers: Headers) {
	return {
		country: headers.get("cf-ipcountry") ?? undefined,
		city: headers.get("cf-ipcity") ?? undefined,
		lat: headers.get("cf-iplatitude")
			? Number(headers.get("cf-iplatitude"))
			: undefined,
		lng: headers.get("cf-iplongitude")
			? Number(headers.get("cf-iplongitude"))
			: undefined,
	};
}

function validateGenerateRequest(
	rawBody: unknown,
	userId: string | null,
): { data: ValidatedInput } | { error: Response } {
	const parsed = generateRequestSchema.safeParse(rawBody);
	if (!parsed.success) {
		return {
			error: jsonResponse(
				{ error: "Invalid request body", details: parsed.error.flatten() },
				400,
			),
		};
	}
	const { prompt, style, isPublic, hd, timezone, referenceImageData } =
		parsed.data;
	const stampStyle = style as StampStyle;

	const hasReference =
		referenceImageData &&
		typeof referenceImageData === "string" &&
		referenceImageData.trim().length > 0;

	if (!userId && isPublic === false) {
		return {
			error: jsonResponse(
				{ error: "Public visibility is required when generating anonymously." },
				400,
			),
		};
	}

	if (!userId && hasReference) {
		return {
			error: jsonResponse(
				{ error: "Reference image generation requires HD and sign-in." },
				401,
			),
		};
	}

	if (hasReference && !hd) {
		return {
			error: jsonResponse(
				{ error: "Reference images require HD generation." },
				400,
			),
		};
	}

	if (
		!hasReference &&
		(!prompt ||
			typeof prompt !== "string" ||
			prompt.trim().length === 0 ||
			prompt.length > 500)
	) {
		return {
			error: jsonResponse(
				{ error: "Prompt is required and must be under 500 characters." },
				400,
			),
		};
	}

	let referenceImageBytes: Uint8Array | undefined;
	if (referenceImageData) {
		try {
			referenceImageBytes = validateReferenceImage(referenceImageData);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Invalid reference image.";
			return {
				error: jsonResponse(
					{ error: errorMessage },
					errorMessage.includes("too large") ? 413 : 400,
				),
			};
		}
	}

	return {
		data: {
			prompt,
			style,
			stampStyle,
			isPublic,
			hd,
			timezone,
			referenceImageBytes,
		},
	};
}

async function resolveCredits(
	db: Database,
	userId: string | null,
	userIp: string,
	hd: boolean,
): Promise<CreditInfo> {
	const creditCost = hd ? HD_CREDIT_COST : STANDARD_CREDIT_COST;
	const creditResult = userId
		? await checkAndDeductCredit(db, userId, creditCost)
		: await checkRateLimit(db, userIp);
	const { allowed, remaining } = creditResult;
	const resetAt = "resetAt" in creditResult ? creditResult.resetAt : undefined;
	const source =
		"source" in creditResult &&
		(creditResult.source === "daily" || creditResult.source === "purchased")
			? creditResult.source
			: "daily";
	return { allowed, remaining, resetAt, creditCost, source };
}

async function performGeneration(
	ai: Parameters<typeof generateStamp>[0],
	prompt: string | undefined,
	style: StampStyle,
	hd: boolean,
	referenceImageBytes?: Uint8Array,
): Promise<GenerationResult> {
	const genStart = Date.now();
	const { imageData, mimeType, enhancedPrompt, description } =
		await generateStamp(ai, prompt || "", style, hd, referenceImageBytes);
	return {
		imageData,
		mimeType,
		enhancedPrompt,
		description,
		generationTimeMs: Date.now() - genStart,
	};
}

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function isWorkersAiDailyAllocationError(error: unknown): boolean {
	const message = getErrorMessage(error).toLowerCase();
	return (
		message.includes("4006") &&
		message.includes("daily free allocation") &&
		message.includes("neurons")
	);
}

function logGenerationMetrics(
	gen: GenerationResult,
	style: string,
	hd: boolean,
	prompt: string | undefined,
	stampId: string,
): void {
	const model = hd ? "flux-2-klein" : "flux-1-schnell";
	const isSlow = gen.generationTimeMs > 30_000;
	if (process.env.NODE_ENV === "development" || isSlow) {
		console.log(
			`[Generate] stamp=${stampId} model=${model} style=${style} hd=${hd} time=${gen.generationTimeMs}ms${isSlow ? " SLOW!" : ""} prompt_length=${prompt?.length ?? 0}`,
		);
	}
	if (isSlow) {
		console.warn(
			`[Generate] SLOW GENERATION DETECTED: ${gen.generationTimeMs}ms for stamp=${stampId} model=${model} style=${style}`,
		);
	}
}

async function persistStamp(
	env: ReturnType<typeof getEnv>,
	db: Database,
	params: StampPersistParams,
): Promise<{ imageUrl: string }> {
	const ext = params.mimeType.includes("png") ? "png" : "jpg";
	const key = `stamps/${params.stampId}.${ext}`;

	await (env.STAMPS_BUCKET as unknown as R2Bucket).put(key, params.imageData, {
		httpMetadata: { contentType: params.mimeType },
	});

	const imageUrl = `/api/stamps/${params.stampId}/image`;

	try {
		await db.insert(stamps).values({
			id: params.stampId,
			prompt: params.prompt?.trim() || "Generated from reference image",
			enhancedPrompt: params.enhancedPrompt,
			description: params.description,
			imageUrl,
			imageExt: ext,
			style: params.style,
			isPublic: params.isPublic,
			userIp: params.userIp,
			sessionToken: params.sessionToken,
			userId: params.userId,
			locationCity: params.locationCity,
			locationCountry: params.locationCountry,
			locationLat: params.locationLat,
			locationLng: params.locationLng,
			userTimezone: params.userTimezone,
			userAgent: params.userAgent,
			referrer: params.referrer,
		});
	} catch (dbError) {
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
		throw dbError;
	}

	return { imageUrl };
}

async function trackBackgroundEvents(
	db: Database,
	env: ReturnType<typeof getEnv>,
	p: BackgroundEventParams,
): Promise<void> {
	try {
		await db.insert(events).values({
			id: nanoid(12),
			event: "generation",
			metadata: JSON.stringify({
				style: p.style,
				hd: p.hd,
				prompt_length: p.prompt?.length ?? 0,
				stamp_id: p.stampId,
				generation_time_ms: p.generationTimeMs,
				has_reference: p.hasReference,
			}),
			userIp: p.userIp,
			createdAt: Date.now(),
		});
	} catch (err: unknown) {
		console.error(
			"[Analytics] Failed to track:",
			JSON.stringify(
				{
					operation: "track_generation_event",
					stampId: p.stampId,
					userId: p.userId ?? "anonymous",
					error: err instanceof Error ? err.message : String(err),
					timestamp: Date.now(),
				},
				null,
				2,
			),
		);
	}

	const agentStateKey = env.AGENTSTATE_API_KEY;
	if (agentStateKey) {
		try {
			const agentStateStart = Date.now();
			const conv = await createConversation(agentStateKey, {
				external_id: `stamp-${p.stampId}`,
				title: p.prompt?.slice(0, 100) ?? "Stamp generation",
				metadata: {
					stamp_id: p.stampId,
					style: p.style,
					hd: !!p.hd,
					user_id: p.userId,
					user_ip: p.userIp,
					generation_time_ms: p.generationTimeMs,
					location_country: p.locationCountry ?? null,
					location_city: p.locationCity ?? null,
					timezone: p.timezone ?? null,
				},
				messages: [
					{
						role: "user",
						content: p.prompt ?? "",
						metadata: { style: p.style, hd: !!p.hd },
					},
					{
						role: "assistant",
						content: p.description ?? p.enhancedPrompt ?? p.prompt ?? "",
						metadata: {
							enhanced_prompt: p.enhancedPrompt,
							image_url: p.imageUrl,
							stamp_id: p.stampId,
						},
					},
				],
			});

			const tags = ["stamp"];
			if (p.userId) tags.push(`user:${p.userId}`);
			if (p.style) tags.push(`style:${p.style}`);
			if (p.locationCountry) tags.push(`country:${p.locationCountry}`);
			await addTags(agentStateKey, conv.id, tags);

			if (process.env.NODE_ENV === "development") {
				console.log(
					`[AgentState] logged stamp=${p.stampId} conv=${conv.id} tags=${tags.join(",")} ${Date.now() - agentStateStart}ms`,
				);
			}
		} catch (err: unknown) {
			console.error(
				`[AgentState] FAILED stamp=${p.stampId} error=${sanitizeErrorForLogging(err)}`,
				JSON.stringify(
					{
						operation: "log_agentstate_conversation",
						stampId: p.stampId,
						userId: p.userId ?? "anonymous",
						error: err instanceof Error ? err.message : String(err),
						timestamp: Date.now(),
					},
					null,
					2,
				),
			);
		}
	} else if (process.env.NODE_ENV === "development") {
		console.warn(
			"[AgentState] AGENTSTATE_API_KEY not set, skipping conversation log",
		);
	}
}

// --- POST Handler ---

export async function POST(request: Request): Promise<Response> {
	const contentLength = Number(request.headers.get("content-length") || 0);
	if (contentLength > 15 * 1024 * 1024) {
		return jsonResponse({ error: "Request too large" }, 413);
	}

	const env = getEnv();
	const db = getDb();
	let userId: string | null = null;
	let userIp = "anonymous";
	let credits: CreditInfo | undefined;

	try {
		const auth = await getAuthUserId();
		userId = auth.userId;
		const rawIp = getClientIp(request.headers);
		userIp = rawIp ? await hashIp(rawIp) : "anonymous";
		const location = extractLocation(request.headers);

		// 1. Validate input (no side effects)
		const rawBody = await request.json();
		const validation = validateGenerateRequest(rawBody, userId);
		if ("error" in validation) return validation.error;
		const {
			prompt,
			stampStyle,
			isPublic,
			hd,
			timezone,
			referenceImageBytes,
			style,
		} = validation.data;

		// 2. Check AI binding before deducting credits
		const ai = env.AI;
		if (!ai) return jsonResponse({ error: "AI binding not configured." }, 503);

		// 2b. Anonymous HD limit: 1 per day
		if (hd && !userId) {
			const hdCount = await db.$client
				.prepare(
					"SELECT COUNT(*) as cnt FROM stamps WHERE user_ip = ? AND hd = 1 AND created_at > ?",
				)
				.bind(userIp, Date.now() - 24 * 60 * 60 * 1000)
				.first<{ cnt: number }>();
			if (hdCount && hdCount.cnt >= 1) {
				return jsonResponse(
					{
						error:
							"Sign in for unlimited HD stamps. Anonymous users get 1 HD per day.",
						code: "ANON_HD_LIMIT",
					},
					403,
				);
			}
		}

		// 3. Deduct credits
		credits = await resolveCredits(db, userId, userIp, hd);
		if (!credits.allowed) {
			return jsonResponse(
				{
					error: userId
						? "Credit limit exceeded. Purchase more credits to continue."
						: "Rate limit exceeded. Sign in for 100 stamps per day, or try again tomorrow.",
					remaining: 0,
					resetAt: credits.resetAt,
				},
				429,
			);
		}

		const stampId = nanoid(12);
		const existingSessionToken = getSessionToken(request);
		const sessionToken = existingSessionToken || createSessionToken();

		// 4. Generate
		const gen = await performGeneration(
			ai,
			prompt,
			stampStyle,
			hd,
			referenceImageBytes,
		);
		logGenerationMetrics(gen, style, hd, prompt, stampId);

		// 5. Persist (R2 upload + DB insert)
		const { imageUrl } = await persistStamp(env, db, {
			stampId,
			prompt,
			enhancedPrompt: gen.enhancedPrompt,
			description: gen.description,
			imageData: gen.imageData,
			mimeType: gen.mimeType,
			style,
			isPublic,
			userIp,
			sessionToken,
			userId,
			locationCity: location.city,
			locationCountry: location.country,
			locationLat: location.lat,
			locationLng: location.lng,
			userTimezone: timezone,
			userAgent: request.headers.get("user-agent") ?? undefined,
			referrer: request.headers.get("referer") ?? undefined,
		});

		// 6. Background events
		waitUntil(
			trackBackgroundEvents(db, env, {
				stampId,
				prompt,
				enhancedPrompt: gen.enhancedPrompt,
				description: gen.description,
				style,
				hd,
				userId,
				userIp,
				generationTimeMs: gen.generationTimeMs,
				imageUrl,
				locationCountry: location.country,
				locationCity: location.city,
				timezone,
				hasReference: !!referenceImageBytes,
			}),
		);

		// 7. Response
		const headers = new Headers();
		if (!existingSessionToken)
			headers.set("Set-Cookie", buildSetCookieHeader(sessionToken));
		return jsonResponse(
			{
				id: stampId,
				imageUrl,
				prompt,
				enhancedPrompt: gen.enhancedPrompt,
				description: gen.description,
				style,
				hd,
				remaining: credits.remaining,
				generationTimeMs: gen.generationTimeMs,
			},
			200,
			headers,
		);
	} catch (error) {
		if (credits?.allowed) {
			try {
				await refundCredits(
					db,
					userId,
					userIp,
					credits.creditCost,
					credits.source,
				);
			} catch (refundError) {
				console.error(
					"[Generate] Failed to refund credits:",
					sanitizeErrorForLogging(refundError),
				);
			}
		}
		console.error("Stamp generation failed:", sanitizeErrorForLogging(error));
		if (isWorkersAiDailyAllocationError(error)) {
			return jsonResponse(
				{
					error: UPSTREAM_AI_LIMIT_MESSAGE,
					code: UPSTREAM_AI_LIMIT_CODE,
				},
				429,
			);
		}
		return jsonResponse(
			{
				error: "Failed to generate stamp. Please try again.",
				_debug: sanitizeErrorForLogging(error),
			},
			500,
		);
	}
}

export const Route = createFileRoute("/api/generate")({
	server: {
		handlers: {
			OPTIONS: ({ request }) => handleCorsPreflight(request),
			POST: ({ request }) => POST(request),
		},
	},
});
