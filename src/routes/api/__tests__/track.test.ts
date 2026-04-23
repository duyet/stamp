import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest } from "@/test-utils";

vi.mock("cloudflare:workers", () => ({
	waitUntil: vi.fn((promise: Promise<unknown>) => promise.catch(() => {})),
}));

vi.mock("@/db", () => ({
	getDb: vi.fn(),
}));

vi.mock("nanoid", () => ({
	nanoid: vi.fn(() => "track_id_123"),
}));

vi.mock("@/lib/rate-limit", () => ({
	checkTrackRateLimit: vi
		.fn()
		.mockResolvedValue({ allowed: true, remaining: 99 }),
}));

vi.mock("@/lib/hash-ip", () => ({
	hashIp: vi.fn((ip: string) => Promise.resolve(ip)),
}));

import { getDb } from "@/db";
import { checkTrackRateLimit } from "@/lib/rate-limit";
import { ALLOWED_EVENTS, POST } from "../track";

const URL = "http://localhost/api/track";
const req = (body: Record<string, unknown>, headers?: Record<string, string>) =>
	createJsonRequest(URL, "POST", body, headers);

describe("POST /api/track", () => {
	const mockDb = {
		insert: vi.fn().mockReturnValue({
			values: vi.fn().mockResolvedValue(undefined),
		}),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getDb).mockReturnValue(mockDb as never);
		mockDb.insert.mockReturnValue({
			values: vi.fn().mockResolvedValue(undefined),
		});
	});

	it("returns 400 for missing event", async () => {
		const res = await POST(req({}));
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(400);
		expect(data.error).toContain("Invalid request body");
	});

	it("returns 400 for empty event string", async () => {
		const res = await POST(req({ event: "" }));
		expect(res.status).toBe(400);
	});

	it("returns 400 for non-string event", async () => {
		const res = await POST(req({ event: 123 }));
		expect(res.status).toBe(400);
	});

	it("returns 400 for event not in allowlist", async () => {
		const res = await POST(req({ event: "hack_attempt" }));
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(400);
		expect(data.error).toContain("Invalid request body");
	});

	it.each([...ALLOWED_EVENTS])("accepts event type '%s'", async (event) => {
		const res = await POST(req({ event }));
		expect(res.status).toBe(200);
	});

	it("returns 400 when metadata exceeds 1024 bytes", async () => {
		const largeMetadata: Record<string, string> = {};
		// Create metadata that serializes to > 1024 chars
		for (let i = 0; i < 50; i++) {
			largeMetadata[`key_${i}`] = "x".repeat(30);
		}

		const res = await POST(
			req({ event: "page_view", metadata: largeMetadata }),
		);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(400);
		expect(data.error).toContain("Metadata too large");
	});

	it("accepts metadata within size limit", async () => {
		const res = await POST(
			req({
				event: "page_view",
				metadata: { page: "/home", referrer: "google" },
			}),
		);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(200);
		expect(data.ok).toBe(true);
	});

	it("accepts event without metadata", async () => {
		const res = await POST(req({ event: "download" }));
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(200);
		expect(data.ok).toBe(true);
	});

	it("extracts IP from cf-connecting-ip", async () => {
		await POST(req({ event: "page_view" }, { "cf-connecting-ip": "1.2.3.4" }));

		const valuesCall =
			mockDb.insert.mock.results[0]?.value.values.mock.calls[0][0];
		expect(valuesCall.userIp).toBe("1.2.3.4");
	});

	it("ignores x-forwarded-for (spoofable)", async () => {
		await POST(req({ event: "page_view" }, { "x-forwarded-for": "5.6.7.8" }));

		const valuesCall =
			mockDb.insert.mock.results[0]?.value.values.mock.calls[0][0];
		expect(valuesCall.userIp).toBe("anonymous");
	});

	it("sets 'anonymous' IP when no headers present", async () => {
		await POST(req({ event: "page_view" }));

		const valuesCall =
			mockDb.insert.mock.results[0]?.value.values.mock.calls[0][0];
		expect(valuesCall.userIp).toBe("anonymous");
	});

	it("returns 200 even on database error (fire-and-forget)", async () => {
		mockDb.insert.mockReturnValue({
			values: vi.fn().mockRejectedValue(new Error("DB failure")),
		});

		const res = await POST(req({ event: "page_view" }));

		// Since tracking is now fire-and-forget, errors don't affect the response
		expect(res.status).toBe(200);
		const data = (await res.json()) as { ok: boolean };
		expect(data.ok).toBe(true);

		// Wait a tick for the async error to be logged
		await new Promise((resolve) => setTimeout(resolve, 0));
	});
	it("returns 429 when rate limit is exceeded", async () => {
		vi.mocked(checkTrackRateLimit).mockResolvedValueOnce({
			allowed: false,
			remaining: 0,
		});

		const res = await POST(req({ event: "page_view" }));
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(429);
		expect(data.error).toContain("Rate limit exceeded");
		expect(data.retryAfter).toBe(60);
	});
});
