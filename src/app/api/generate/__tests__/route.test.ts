import { beforeEach, describe, expect, it, vi } from "vitest";
import { STAMP_STYLE_PRESETS } from "@/lib/stamp-prompts";
import { createJsonRequest } from "@/test-utils";

// Mock dependencies before importing the route
vi.mock("@/db", () => ({
	getDb: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
	getEnv: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
	checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/credits", () => ({
	checkAndDeductCredit: vi.fn(),
	STANDARD_CREDIT_COST: 1,
	HD_CREDIT_COST: 5,
}));

vi.mock("@/lib/generate-stamp", () => ({
	generateStamp: vi.fn(),
}));

vi.mock("nanoid", () => ({
	nanoid: vi.fn(() => "abc123def456"),
}));

vi.mock("@clerk/nextjs/server", () => ({
	auth: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/db";
import { checkAndDeductCredit } from "@/lib/credits";
import { getEnv } from "@/lib/env";
import { generateStamp } from "@/lib/generate-stamp";
import { checkRateLimit } from "@/lib/rate-limit";
import { POST } from "../route";

const URL = "http://localhost/api/generate";
const req = (body: Record<string, unknown>, headers?: Record<string, string>) =>
	createJsonRequest(URL, "POST", body, headers);

describe("POST /api/generate", () => {
	const mockDb = {
		insert: vi.fn().mockReturnValue({
			values: vi.fn().mockResolvedValue(undefined),
			catch: vi.fn(),
		}),
	};

	const mockBucket = {
		put: vi.fn().mockResolvedValue(undefined),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		// Default: anonymous user (no userId)
		vi.mocked(auth).mockResolvedValue({ userId: null } as never);
		vi.mocked(getDb).mockReturnValue(mockDb as never);
		vi.mocked(getEnv).mockReturnValue({
			AI: { run: vi.fn() },
			STAMPS_BUCKET: mockBucket,
		} as never);
		vi.mocked(checkRateLimit).mockResolvedValue({
			allowed: true,
			remaining: 2,
		});
		vi.mocked(checkAndDeductCredit).mockResolvedValue({
			allowed: true,
			remaining: 99,
			source: "daily",
		});
		vi.mocked(generateStamp).mockResolvedValue({
			imageData: new Uint8Array([1, 2, 3]),
			mimeType: "image/jpeg",
			enhancedPrompt: "enhanced prompt text",
			description: "A folk art cat on a stamp",
		});

		// Make insert().values() chainable and also support fire-and-forget .catch()
		const valuesResult = Promise.resolve(undefined);
		(valuesResult as unknown as Record<string, unknown>).catch = vi.fn();
		mockDb.insert.mockReturnValue({
			values: vi.fn().mockReturnValue(valuesResult),
		});
	});

	describe("anonymous user (IP-based rate limit)", () => {
		it("returns 429 when rate limited", async () => {
			vi.mocked(checkRateLimit).mockResolvedValue({
				allowed: false,
				remaining: 0,
			});

			const res = await POST(req({ prompt: "a cat" }));
			const data = (await res.json()) as Record<string, unknown>;

			expect(res.status).toBe(429);
			expect(data.error).toContain("Rate limit exceeded");
			expect(data.remaining).toBe(0);
		});

		it("uses checkRateLimit for anonymous users", async () => {
			await POST(req({ prompt: "a cat" }, { "cf-connecting-ip": "1.2.3.4" }));

			expect(checkRateLimit).toHaveBeenCalledWith(expect.anything(), "1.2.3.4");
			expect(checkAndDeductCredit).not.toHaveBeenCalled();
		});

		it("extracts IP from cf-connecting-ip header", async () => {
			await POST(req({ prompt: "a cat" }, { "cf-connecting-ip": "1.2.3.4" }));
			expect(checkRateLimit).toHaveBeenCalledWith(expect.anything(), "1.2.3.4");
		});

		it("falls back to x-forwarded-for header", async () => {
			await POST(req({ prompt: "a cat" }, { "x-forwarded-for": "5.6.7.8" }));
			expect(checkRateLimit).toHaveBeenCalledWith(expect.anything(), "5.6.7.8");
		});

		it("uses 'unknown' when no IP headers present", async () => {
			await POST(req({ prompt: "a cat" }));
			expect(checkRateLimit).toHaveBeenCalledWith(expect.anything(), "unknown");
		});
	});

	describe("authenticated user (credits-based)", () => {
		beforeEach(() => {
			vi.mocked(auth).mockResolvedValue({
				userId: "user_abc123",
			} as never);
		});

		it("uses checkAndDeductCredit for authenticated users", async () => {
			await POST(req({ prompt: "a cat" }));

			expect(checkAndDeductCredit).toHaveBeenCalledWith(
				expect.anything(),
				"user_abc123",
				1,
			);
			expect(checkRateLimit).not.toHaveBeenCalled();
		});

		it("returns 429 when credits exhausted", async () => {
			vi.mocked(checkAndDeductCredit).mockResolvedValue({
				allowed: false,
				remaining: 0,
				source: "daily",
			});

			const res = await POST(req({ prompt: "a cat" }));
			const data = (await res.json()) as Record<string, unknown>;

			expect(res.status).toBe(429);
			expect(data.error).toContain("Credit limit exceeded");
		});

		it("returns stamp data with remaining credits", async () => {
			vi.mocked(checkAndDeductCredit).mockResolvedValue({
				allowed: true,
				remaining: 50,
				source: "daily",
			});

			const res = await POST(req({ prompt: "a cat" }));
			const data = (await res.json()) as Record<string, unknown>;

			expect(res.status).toBe(200);
			expect(data.remaining).toBe(50);
		});
	});

	describe("validation", () => {
		it("returns 400 when prompt is missing", async () => {
			const res = await POST(req({}));
			const data = (await res.json()) as Record<string, unknown>;

			expect(res.status).toBe(400);
			expect(data.error).toContain("Prompt is required");
		});

		it("returns 400 when prompt is empty string", async () => {
			const res = await POST(req({ prompt: "" }));
			expect(res.status).toBe(400);
		});

		it("returns 400 when prompt is only whitespace", async () => {
			const res = await POST(req({ prompt: "   " }));
			expect(res.status).toBe(400);
		});

		it("returns 400 when prompt exceeds 500 characters", async () => {
			const res = await POST(req({ prompt: "x".repeat(501) }));

			expect(res.status).toBe(400);
			const data = (await res.json()) as Record<string, unknown>;
			expect(data.error).toContain("under 500 characters");
		});

		it("accepts prompt at exactly 500 characters", async () => {
			const res = await POST(req({ prompt: "x".repeat(500) }));
			expect(res.status).toBe(200);
		});

		it("returns 400 when prompt is not a string", async () => {
			const res = await POST(req({ prompt: 123 }));
			expect(res.status).toBe(400);
		});

		it("returns 400 for invalid style", async () => {
			const res = await POST(req({ prompt: "a cat", style: "invalid_style" }));
			const data = (await res.json()) as Record<string, unknown>;

			expect(res.status).toBe(400);
			expect(data.error).toContain("Invalid style");
		});

		it.each(
			Object.keys(STAMP_STYLE_PRESETS),
		)("accepts style '%s'", async (style) => {
			const res = await POST(req({ prompt: "a cat", style }));
			expect(res.status).toBe(200);
		});
	});

	describe("generation", () => {
		it("returns 503 when AI binding is missing", async () => {
			vi.mocked(getEnv).mockReturnValue({
				AI: null,
				STAMPS_BUCKET: mockBucket,
			} as never);

			const res = await POST(req({ prompt: "a cat" }));
			const data = (await res.json()) as Record<string, unknown>;

			expect(res.status).toBe(503);
			expect(data.error).toContain("AI binding not configured");
		});

		it("returns stamp data on success", async () => {
			const res = await POST(
				req(
					{ prompt: "a cat", style: "vintage", isPublic: true },
					{ "cf-connecting-ip": "1.2.3.4" },
				),
			);
			const data = (await res.json()) as Record<string, unknown>;

			expect(res.status).toBe(200);
			expect(data.id).toBe("abc123def456");
			expect(data.imageUrl).toBe("/api/stamps/abc123def456/image");
			expect(data.prompt).toBe("a cat");
			expect(data.enhancedPrompt).toBe("enhanced prompt text");
			expect(data.style).toBe("vintage");
			expect(data.remaining).toBe(2);
		});

		it("uploads image to R2 with correct key", async () => {
			await POST(req({ prompt: "a cat" }));

			expect(mockBucket.put).toHaveBeenCalledWith(
				"stamps/abc123def456.jpg",
				expect.any(Uint8Array),
				{ httpMetadata: { contentType: "image/jpeg" } },
			);
		});

		it("uses png extension for png mime type", async () => {
			vi.mocked(generateStamp).mockResolvedValue({
				imageData: new Uint8Array([1, 2, 3]),
				mimeType: "image/png",
				enhancedPrompt: "enhanced",
				description: "A folk art cat on a stamp",
			});

			await POST(req({ prompt: "a cat" }));

			expect(mockBucket.put).toHaveBeenCalledWith(
				"stamps/abc123def456.png",
				expect.any(Uint8Array),
				expect.any(Object),
			);
		});

		it("inserts stamp record into database", async () => {
			await POST(
				req(
					{ prompt: "a cat", style: "folk", isPublic: false },
					{ "cf-connecting-ip": "5.6.7.8" },
				),
			);

			const insertCall = mockDb.insert.mock.calls[0];
			expect(insertCall).toBeDefined();
		});

		it("defaults style to vintage and hd to false", async () => {
			await POST(req({ prompt: "a cat" }));

			expect(generateStamp).toHaveBeenCalledWith(
				expect.anything(),
				"a cat",
				"vintage",
				false,
				undefined,
			);
		});

		it("returns 500 when generation throws", async () => {
			vi.mocked(generateStamp).mockRejectedValue(new Error("AI failure"));

			const res = await POST(req({ prompt: "a cat" }));
			const data = (await res.json()) as Record<string, unknown>;

			expect(res.status).toBe(500);
			expect(data.error).toContain("Failed to generate stamp");
		});
	});

	describe("reference-based generation", () => {
		it("requires HD mode when reference image is provided", async () => {
			const res = await POST(
				req({
					prompt: "a cat",
					referenceImageData: btoa("fake-image-data"),
				}),
			);
			expect(res.status).toBe(400);
			const data = (await res.json()) as Record<string, unknown>;
			expect(data.error).toContain("Reference images require HD");
		});

		it("accepts request with reference image and empty prompt when HD is true", async () => {
			vi.mocked(auth).mockResolvedValue({
				userId: "user_abc123",
			} as never);

			const res = await POST(
				req({
					prompt: "",
					hd: true,
					referenceImageData: btoa("fake-image-data"),
				}),
			);
			expect(res.status).toBe(200);
		});

		it("passes reference image data to generateStamp", async () => {
			vi.mocked(auth).mockResolvedValue({
				userId: "user_abc123",
			} as never);
			const base64Image = btoa("fake-image-data");

			await POST(
				req({
					prompt: "make it vintage",
					hd: true,
					referenceImageData: base64Image,
				}),
			);

			expect(generateStamp).toHaveBeenCalledWith(
				expect.anything(),
				"make it vintage",
				"vintage",
				true,
				expect.any(Uint8Array),
			);
		});

		it("still requires prompt when no reference image", async () => {
			const res = await POST(req({ prompt: "" }));
			expect(res.status).toBe(400);
		});
	});

	describe("HD generation", () => {
		it("returns 401 when anonymous user requests HD", async () => {
			const res = await POST(req({ prompt: "a cat", hd: true }));
			const data = (await res.json()) as Record<string, unknown>;

			expect(res.status).toBe(401);
			expect(data.error).toContain("HD generation requires sign-in");
		});

		it("passes hd=true to generateStamp for authenticated users", async () => {
			vi.mocked(auth).mockResolvedValue({
				userId: "user_abc123",
			} as never);

			await POST(req({ prompt: "a cat", hd: true }));

			expect(generateStamp).toHaveBeenCalledWith(
				expect.anything(),
				"a cat",
				"vintage",
				true,
				undefined,
			);
		});

		it("deducts HD credit cost for authenticated HD requests", async () => {
			vi.mocked(auth).mockResolvedValue({
				userId: "user_abc123",
			} as never);

			await POST(req({ prompt: "a cat", hd: true }));

			expect(checkAndDeductCredit).toHaveBeenCalledWith(
				expect.anything(),
				"user_abc123",
				5,
			);
		});

		it("deducts standard credit cost for non-HD requests", async () => {
			vi.mocked(auth).mockResolvedValue({
				userId: "user_abc123",
			} as never);

			await POST(req({ prompt: "a cat", hd: false }));

			expect(checkAndDeductCredit).toHaveBeenCalledWith(
				expect.anything(),
				"user_abc123",
				1,
			);
		});

		it("includes hd flag in response", async () => {
			vi.mocked(auth).mockResolvedValue({
				userId: "user_abc123",
			} as never);

			const res = await POST(req({ prompt: "a cat", hd: true }));
			const data = (await res.json()) as Record<string, unknown>;

			expect(res.status).toBe(200);
			expect(data.hd).toBe(true);
		});

		it("returns hd=false in response for standard generation", async () => {
			const res = await POST(req({ prompt: "a cat" }));
			const data = (await res.json()) as Record<string, unknown>;

			expect(res.status).toBe(200);
			expect(data.hd).toBe(false);
		});
	});
});
