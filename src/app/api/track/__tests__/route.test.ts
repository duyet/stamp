import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({
	getDb: vi.fn(),
}));

vi.mock("nanoid", () => ({
	nanoid: vi.fn(() => "track_id_123"),
}));

import { getDb } from "@/db";
import { POST } from "../route";

function createRequest(
	body: Record<string, unknown>,
	headers: Record<string, string> = {},
): NextRequest {
	return new Request("http://localhost/api/track", {
		method: "POST",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify(body),
	}) as unknown as NextRequest;
}

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
		const req = createRequest({});
		const res = await POST(req);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(400);
		expect(data.error).toContain("Invalid event type");
	});

	it("returns 400 for empty event string", async () => {
		const req = createRequest({ event: "" });
		const res = await POST(req);

		expect(res.status).toBe(400);
	});

	it("returns 400 for non-string event", async () => {
		const req = createRequest({ event: 123 });
		const res = await POST(req);

		expect(res.status).toBe(400);
	});

	it("returns 400 for event not in allowlist", async () => {
		const req = createRequest({ event: "hack_attempt" });
		const res = await POST(req);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(400);
		expect(data.error).toContain("Invalid event type");
	});

	it("accepts all allowed event types", async () => {
		const allowedEvents = [
			"page_view",
			"generation",
			"download",
			"share",
			"copy_link",
		];

		for (const event of allowedEvents) {
			vi.clearAllMocks();
			vi.mocked(getDb).mockReturnValue(mockDb as never);
			mockDb.insert.mockReturnValue({
				values: vi.fn().mockResolvedValue(undefined),
			});

			const req = createRequest({ event });
			const res = await POST(req);

			expect(res.status).toBe(200);
		}
	});

	it("returns 400 when metadata exceeds 1024 bytes", async () => {
		const largeMetadata: Record<string, string> = {};
		// Create metadata that serializes to > 1024 chars
		for (let i = 0; i < 50; i++) {
			largeMetadata[`key_${i}`] = "x".repeat(30);
		}

		const req = createRequest({
			event: "page_view",
			metadata: largeMetadata,
		});
		const res = await POST(req);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(400);
		expect(data.error).toContain("Metadata too large");
	});

	it("accepts metadata within size limit", async () => {
		const req = createRequest({
			event: "page_view",
			metadata: { page: "/home", referrer: "google" },
		});
		const res = await POST(req);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(200);
		expect(data.ok).toBe(true);
	});

	it("accepts event without metadata", async () => {
		const req = createRequest({ event: "download" });
		const res = await POST(req);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(200);
		expect(data.ok).toBe(true);
	});

	it("extracts IP from cf-connecting-ip", async () => {
		const req = createRequest(
			{ event: "page_view" },
			{ "cf-connecting-ip": "1.2.3.4" },
		);
		await POST(req);

		const valuesCall =
			mockDb.insert.mock.results[0]?.value.values.mock.calls[0][0];
		expect(valuesCall.userIp).toBe("1.2.3.4");
	});

	it("falls back to x-forwarded-for", async () => {
		const req = createRequest(
			{ event: "page_view" },
			{ "x-forwarded-for": "5.6.7.8" },
		);
		await POST(req);

		const valuesCall =
			mockDb.insert.mock.results[0]?.value.values.mock.calls[0][0];
		expect(valuesCall.userIp).toBe("5.6.7.8");
	});

	it("sets null IP when no headers present", async () => {
		const req = createRequest({ event: "page_view" });
		await POST(req);

		const valuesCall =
			mockDb.insert.mock.results[0]?.value.values.mock.calls[0][0];
		expect(valuesCall.userIp).toBeNull();
	});

	it("returns 500 on database error", async () => {
		mockDb.insert.mockReturnValue({
			values: vi.fn().mockRejectedValue(new Error("DB failure")),
		});

		const req = createRequest({ event: "page_view" });
		const res = await POST(req);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(500);
		expect(data.error).toContain("Failed to track event");
	});
});
