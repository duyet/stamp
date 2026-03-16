import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({
	getDb: vi.fn(),
}));

import { getDb } from "@/db";
import { PATCH } from "../route";

function createRequest(
	body: Record<string, unknown>,
	headers: Record<string, string> = {},
): NextRequest {
	return new Request("http://localhost/api/stamps/abc123def456/visibility", {
		method: "PATCH",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify(body),
	}) as unknown as NextRequest;
}

function createParams(id: string) {
	return { params: Promise.resolve({ id }) };
}

describe("PATCH /api/stamps/[id]/visibility", () => {
	const mockUpdate = vi.fn().mockReturnValue({
		set: vi.fn().mockReturnValue({
			where: vi.fn().mockResolvedValue(undefined),
		}),
	});

	const mockDb = {
		query: {
			stamps: {
				findFirst: vi.fn(),
			},
		},
		update: mockUpdate,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getDb).mockReturnValue(mockDb as never);
		mockDb.query.stamps.findFirst.mockResolvedValue({
			id: "abc123def456",
			prompt: "a cat",
			userIp: "1.2.3.4",
			isPublic: true,
		});
		mockUpdate.mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue(undefined),
			}),
		});
	});

	it("returns 400 for invalid ID length", async () => {
		const req = createRequest({ isPublic: false });
		const res = await PATCH(req, createParams("short"));
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(400);
		expect(data.error).toContain("Invalid stamp ID");
	});

	it("returns 400 for empty ID", async () => {
		const req = createRequest({ isPublic: false });
		const res = await PATCH(req, createParams(""));
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(400);
		expect(data.error).toContain("Invalid stamp ID");
	});

	it("returns 400 when isPublic is not a boolean", async () => {
		const req = createRequest({ isPublic: "yes" });
		const res = await PATCH(req, createParams("abc123def456"));
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(400);
		expect(data.error).toContain("isPublic must be a boolean");
	});

	it("returns 400 when isPublic is missing", async () => {
		const req = createRequest({});
		const res = await PATCH(req, createParams("abc123def456"));

		expect(res.status).toBe(400);
	});

	it("returns 400 when isPublic is a number", async () => {
		const req = createRequest({ isPublic: 1 });
		const res = await PATCH(req, createParams("abc123def456"));

		expect(res.status).toBe(400);
	});

	it("returns 404 when stamp not found", async () => {
		mockDb.query.stamps.findFirst.mockResolvedValue(null);

		const req = createRequest(
			{ isPublic: false },
			{ "cf-connecting-ip": "1.2.3.4" },
		);
		const res = await PATCH(req, createParams("abc123def456"));
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(404);
		expect(data.error).toContain("Stamp not found");
	});

	it("returns 403 when IP does not match creator", async () => {
		mockDb.query.stamps.findFirst.mockResolvedValue({
			id: "abc123def456",
			userIp: "1.2.3.4",
		});

		const req = createRequest(
			{ isPublic: false },
			{ "cf-connecting-ip": "9.9.9.9" },
		);
		const res = await PATCH(req, createParams("abc123def456"));
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(403);
		expect(data.error).toContain("Not authorized");
	});

	it("allows toggle when IP matches creator", async () => {
		const req = createRequest(
			{ isPublic: false },
			{ "cf-connecting-ip": "1.2.3.4" },
		);
		const res = await PATCH(req, createParams("abc123def456"));
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(200);
		expect(data.ok).toBe(true);
	});

	it("allows toggle when stamp has no userIp", async () => {
		mockDb.query.stamps.findFirst.mockResolvedValue({
			id: "abc123def456",
			userIp: null,
		});

		const req = createRequest(
			{ isPublic: true },
			{ "cf-connecting-ip": "9.9.9.9" },
		);
		const res = await PATCH(req, createParams("abc123def456"));
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(200);
		expect(data.ok).toBe(true);
	});

	it("allows toggle when requester has no IP", async () => {
		const req = createRequest({ isPublic: true });
		const res = await PATCH(req, createParams("abc123def456"));
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(200);
		expect(data.ok).toBe(true);
	});

	it("uses x-forwarded-for as fallback IP", async () => {
		mockDb.query.stamps.findFirst.mockResolvedValue({
			id: "abc123def456",
			userIp: "5.6.7.8",
		});

		const req = createRequest(
			{ isPublic: false },
			{ "x-forwarded-for": "5.6.7.8" },
		);
		const res = await PATCH(req, createParams("abc123def456"));

		expect(res.status).toBe(200);
	});

	it("returns 500 on database error", async () => {
		mockDb.query.stamps.findFirst.mockRejectedValue(new Error("DB down"));

		const req = createRequest(
			{ isPublic: false },
			{ "cf-connecting-ip": "1.2.3.4" },
		);
		const res = await PATCH(req, createParams("abc123def456"));
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(500);
		expect(data.error).toContain("Failed to update");
	});
});
