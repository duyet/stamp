import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJsonRequest } from "@/test-utils";

vi.mock("@/db", () => ({
	getDb: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
	getEnv: vi.fn(),
}));

vi.mock("@/lib/clerk", () => ({
	getAuthUserId: vi.fn(),
}));

vi.mock("@/lib/hash-ip", () => ({
	hashIp: vi.fn((ip: string) => Promise.resolve(ip)),
}));

import { getDb } from "@/db";
import { getAuthUserId } from "@/lib/clerk";
import { PATCH } from "../description";

const URL = "http://localhost/api/stamps/abc123def456/description";
const req = (body: Record<string, unknown>, headers?: Record<string, string>) =>
	createJsonRequest(URL, "PATCH", body, headers);

describe("PATCH /api/stamps/$id/description", () => {
	const mockUpdate = vi.fn();
	const mockSet = vi.fn();
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
		vi.mocked(getAuthUserId).mockResolvedValue({ userId: "user_abc123" });
		vi.mocked(getDb).mockReturnValue(mockDb as never);
		mockDb.query.stamps.findFirst.mockResolvedValue({
			id: "abc123def456",
			userIp: "1.2.3.4",
			userId: "user_abc123",
			sessionToken: null,
		});
		mockUpdate.mockReturnValue({
			set: mockSet.mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([
						{
							id: "abc123def456",
							description: "A tiny blue stamp.",
						},
					]),
				}),
			}),
		});
	});

	it("returns 400 for invalid ID length", async () => {
		const res = await PATCH(req({ description: "A tiny stamp." }), "short");
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(400);
		expect(data.error).toContain("Invalid stamp ID");
	});

	it("returns 400 when description is missing", async () => {
		const res = await PATCH(req({}), "abc123def456");
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(400);
		expect(data.error).toContain("description must be a string");
	});

	it("returns 400 when description is empty", async () => {
		const res = await PATCH(req({ description: "   " }), "abc123def456");
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(400);
		expect(data.error).toContain("description must be between");
	});

	it("returns 401 when the requester is not signed in", async () => {
		vi.mocked(getAuthUserId).mockResolvedValue({ userId: null });

		const res = await PATCH(
			req({ description: "A tiny stamp." }, { "cf-connecting-ip": "1.2.3.4" }),
			"abc123def456",
		);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(401);
		expect(data.error).toContain("Sign in required");
	});

	it("returns 404 when stamp is not found", async () => {
		mockDb.query.stamps.findFirst.mockResolvedValue(null);

		const res = await PATCH(
			req({ description: "A tiny stamp." }, { "cf-connecting-ip": "1.2.3.4" }),
			"abc123def456",
		);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(404);
		expect(data.error).toContain("Stamp not found");
	});

	it("returns 403 when signed-in user does not own the stamp", async () => {
		mockDb.query.stamps.findFirst.mockResolvedValue({
			id: "abc123def456",
			userIp: "1.2.3.4",
			userId: "user_other",
			sessionToken: null,
		});

		const res = await PATCH(
			req({ description: "A tiny stamp." }, { "cf-connecting-ip": "9.9.9.9" }),
			"abc123def456",
		);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(403);
		expect(data.error).toContain("Not authorized");
	});

	it("updates description when signed-in user owns the stamp", async () => {
		const res = await PATCH(
			req(
				{ description: "  A tiny blue stamp.  " },
				{ "cf-connecting-ip": "9.9.9.9" },
			),
			"abc123def456",
		);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(200);
		expect(data.ok).toBe(true);
		expect(data.stamp).toEqual({
			id: "abc123def456",
			description: "A tiny blue stamp.",
		});
		expect(mockSet).toHaveBeenCalledWith({
			description: "A tiny blue stamp.",
		});
	});
});
