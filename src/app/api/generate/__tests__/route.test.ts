import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("@/lib/generate-stamp", () => ({
	generateStamp: vi.fn(),
}));

vi.mock("nanoid", () => ({
	nanoid: vi.fn(() => "abc123def456"),
}));

import { getDb } from "@/db";
import { getEnv } from "@/lib/env";
import { generateStamp } from "@/lib/generate-stamp";
import { checkRateLimit } from "@/lib/rate-limit";
import { POST } from "../route";

function createRequest(
	body: Record<string, unknown>,
	headers: Record<string, string> = {},
): NextRequest {
	return new Request("http://localhost/api/generate", {
		method: "POST",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify(body),
	}) as unknown as NextRequest;
}

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
		vi.mocked(getDb).mockReturnValue(mockDb as never);
		vi.mocked(getEnv).mockReturnValue({
			AI: { run: vi.fn() },
			STAMPS_BUCKET: mockBucket,
		} as never);
		vi.mocked(checkRateLimit).mockResolvedValue({
			allowed: true,
			remaining: 4,
		});
		vi.mocked(generateStamp).mockResolvedValue({
			imageData: new Uint8Array([1, 2, 3]),
			mimeType: "image/jpeg",
			enhancedPrompt: "enhanced prompt text",
		});

		// Make insert().values() chainable and also support fire-and-forget .catch()
		const valuesResult = Promise.resolve(undefined);
		(valuesResult as unknown as Record<string, unknown>).catch = vi.fn();
		mockDb.insert.mockReturnValue({
			values: vi.fn().mockReturnValue(valuesResult),
		});
	});

	it("returns 429 when rate limited", async () => {
		vi.mocked(checkRateLimit).mockResolvedValue({
			allowed: false,
			remaining: 0,
		});

		const req = createRequest({ prompt: "a cat" });
		const res = await POST(req);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(429);
		expect(data.error).toContain("Rate limit exceeded");
		expect(data.remaining).toBe(0);
	});

	it("returns 400 when prompt is missing", async () => {
		const req = createRequest({});
		const res = await POST(req);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(400);
		expect(data.error).toContain("Prompt is required");
	});

	it("returns 400 when prompt is empty string", async () => {
		const req = createRequest({ prompt: "" });
		const res = await POST(req);

		expect(res.status).toBe(400);
	});

	it("returns 400 when prompt is only whitespace", async () => {
		const req = createRequest({ prompt: "   " });
		const res = await POST(req);

		expect(res.status).toBe(400);
	});

	it("returns 400 when prompt exceeds 500 characters", async () => {
		const req = createRequest({ prompt: "x".repeat(501) });
		const res = await POST(req);

		expect(res.status).toBe(400);
		const data = (await res.json()) as Record<string, unknown>;
		expect(data.error).toContain("under 500 characters");
	});

	it("accepts prompt at exactly 500 characters", async () => {
		const req = createRequest({ prompt: "x".repeat(500) });
		const res = await POST(req);

		expect(res.status).toBe(200);
	});

	it("returns 400 when prompt is not a string", async () => {
		const req = createRequest({ prompt: 123 });
		const res = await POST(req);

		expect(res.status).toBe(400);
	});

	it("returns 400 for invalid style", async () => {
		const req = createRequest({ prompt: "a cat", style: "invalid_style" });
		const res = await POST(req);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(400);
		expect(data.error).toContain("Invalid style");
	});

	it("accepts all valid styles", async () => {
		for (const style of [
			"vintage",
			"folk",
			"modern",
			"botanical",
			"portrait",
		]) {
			vi.clearAllMocks();
			vi.mocked(getDb).mockReturnValue(mockDb as never);
			vi.mocked(getEnv).mockReturnValue({
				AI: { run: vi.fn() },
				STAMPS_BUCKET: mockBucket,
			} as never);
			vi.mocked(checkRateLimit).mockResolvedValue({
				allowed: true,
				remaining: 4,
			});
			vi.mocked(generateStamp).mockResolvedValue({
				imageData: new Uint8Array([1, 2, 3]),
				mimeType: "image/jpeg",
				enhancedPrompt: "enhanced",
			});
			const valuesResult = Promise.resolve(undefined);
			(valuesResult as unknown as Record<string, unknown>).catch = vi.fn();
			mockDb.insert.mockReturnValue({
				values: vi.fn().mockReturnValue(valuesResult),
			});

			const req = createRequest({ prompt: "a cat", style });
			const res = await POST(req);
			expect(res.status).toBe(200);
		}
	});

	it("returns 503 when AI binding is missing", async () => {
		vi.mocked(getEnv).mockReturnValue({
			AI: null,
			STAMPS_BUCKET: mockBucket,
		} as never);

		const req = createRequest({ prompt: "a cat" });
		const res = await POST(req);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(503);
		expect(data.error).toContain("AI binding not configured");
	});

	it("returns stamp data on success", async () => {
		const req = createRequest(
			{ prompt: "a cat", style: "vintage", isPublic: true },
			{ "cf-connecting-ip": "1.2.3.4" },
		);
		const res = await POST(req);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(200);
		expect(data.id).toBe("abc123def456");
		expect(data.imageUrl).toBe("/api/stamps/abc123def456/image");
		expect(data.prompt).toBe("a cat");
		expect(data.enhancedPrompt).toBe("enhanced prompt text");
		expect(data.style).toBe("vintage");
		expect(data.remaining).toBe(4);
	});

	it("uploads image to R2 with correct key", async () => {
		const req = createRequest({ prompt: "a cat" });
		await POST(req);

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
		});

		const req = createRequest({ prompt: "a cat" });
		await POST(req);

		expect(mockBucket.put).toHaveBeenCalledWith(
			"stamps/abc123def456.png",
			expect.any(Uint8Array),
			expect.any(Object),
		);
	});

	it("inserts stamp record into database", async () => {
		const req = createRequest(
			{ prompt: "a cat", style: "folk", isPublic: false },
			{ "cf-connecting-ip": "5.6.7.8" },
		);
		await POST(req);

		const insertCall = mockDb.insert.mock.calls[0];
		expect(insertCall).toBeDefined();
	});

	it("extracts IP from cf-connecting-ip header", async () => {
		const req = createRequest(
			{ prompt: "a cat" },
			{ "cf-connecting-ip": "1.2.3.4" },
		);
		await POST(req);

		expect(checkRateLimit).toHaveBeenCalledWith(expect.anything(), "1.2.3.4");
	});

	it("falls back to x-forwarded-for header", async () => {
		const req = createRequest(
			{ prompt: "a cat" },
			{ "x-forwarded-for": "5.6.7.8" },
		);
		await POST(req);

		expect(checkRateLimit).toHaveBeenCalledWith(expect.anything(), "5.6.7.8");
	});

	it("uses 'unknown' when no IP headers present", async () => {
		const req = createRequest({ prompt: "a cat" });
		await POST(req);

		expect(checkRateLimit).toHaveBeenCalledWith(expect.anything(), "unknown");
	});

	it("defaults style to vintage", async () => {
		const req = createRequest({ prompt: "a cat" });
		await POST(req);

		expect(generateStamp).toHaveBeenCalledWith(
			expect.anything(),
			"a cat",
			"vintage",
		);
	});

	it("returns 500 when generation throws", async () => {
		vi.mocked(generateStamp).mockRejectedValue(new Error("AI failure"));

		const req = createRequest({ prompt: "a cat" });
		const res = await POST(req);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(500);
		expect(data.error).toContain("Failed to generate stamp");
	});
});
