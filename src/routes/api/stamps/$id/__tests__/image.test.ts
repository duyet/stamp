import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
	getEnv: vi.fn(),
}));

vi.mock("@/db", () => ({
	getDb: vi.fn(),
}));

vi.mock("@/lib/clerk", () => ({
	getAuthUserId: vi.fn(),
}));

vi.mock("@/lib/get-client-ip", () => ({
	getClientIp: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
	canModifyStamp: vi.fn(),
}));

import { getDb } from "@/db";
import { canModifyStamp } from "@/lib/auth";
import { getAuthUserId } from "@/lib/clerk";
import { getEnv } from "@/lib/env";
import { getClientIp } from "@/lib/get-client-ip";
import { GET } from "../image";

function mockR2Object(data: ArrayBuffer) {
	return {
		body: new ReadableStream({
			start(controller) {
				controller.enqueue(new Uint8Array(data));
				controller.close();
			},
		}),
		arrayBuffer: () => Promise.resolve(data),
	};
}

function mockRequest(): Request {
	return new Request("https://example.com/api/stamps/test/image");
}

describe("GET /api/stamps/$id/image", () => {
	const mockBucket = {
		get: vi.fn(),
	};

	const mockDb = {
		query: {
			stamps: {
				findFirst: vi.fn(),
			},
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getEnv).mockReturnValue({
			STAMPS_BUCKET: mockBucket,
		} as never);
		vi.mocked(getDb).mockReturnValue(mockDb as never);
		vi.mocked(getAuthUserId).mockResolvedValue({ userId: null });
		vi.mocked(getClientIp).mockReturnValue(null);
		vi.mocked(canModifyStamp).mockReturnValue(false);
	});

	it("returns png image when found in DB", async () => {
		const imageData = new ArrayBuffer(8);
		mockDb.query.stamps.findFirst.mockResolvedValue({
			imageExt: "png",
			isPublic: true,
			userId: null,
			userIp: null,
		});
		mockBucket.get.mockResolvedValueOnce(mockR2Object(imageData));

		const res = await GET(mockRequest(), "abc123def456");

		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toBe("image/png");
		expect(res.headers.get("Cache-Control")).toContain("immutable");
		expect(res.headers.get("Cache-Control")).toContain("max-age=31536000");
		expect(mockBucket.get).toHaveBeenCalledWith("stamps/abc123def456.png");
	});

	it("returns 404 when DB has no imageExt and object not found", async () => {
		mockDb.query.stamps.findFirst.mockResolvedValue({
			imageExt: null,
			isPublic: true,
			userId: null,
			userIp: null,
		});
		mockBucket.get.mockResolvedValue(null);

		const res = await GET(mockRequest(), "abc123def456");
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(404);
		expect(data.error).toContain("Image not found");
	});

	it("returns 404 when neither png nor jpg exists", async () => {
		mockDb.query.stamps.findFirst.mockResolvedValue({
			imageExt: null,
			isPublic: true,
			userId: null,
			userIp: null,
		});
		mockBucket.get.mockResolvedValue(null);

		const res = await GET(mockRequest(), "abc123def456");
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(404);
		expect(data.error).toContain("Image not found");
	});

	it("uses correct R2 key with stamp ID", async () => {
		mockDb.query.stamps.findFirst.mockResolvedValue({
			imageExt: "png",
			isPublic: true,
			userId: null,
			userIp: null,
		});
		mockBucket.get.mockResolvedValueOnce(mockR2Object(new ArrayBuffer(4)));

		await GET(mockRequest(), "xyz789abc012");

		expect(mockBucket.get).toHaveBeenCalledWith("stamps/xyz789abc012.png");
	});

	it("returns 500 on unexpected DB error", async () => {
		mockDb.query.stamps.findFirst.mockRejectedValue(
			new Error("DB unavailable"),
		);

		const res = await GET(mockRequest(), "abc123def456");
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(500);
		expect(data.error).toContain("Failed to load image");
	});

	it("returns image body as binary", async () => {
		const imageBytes = new Uint8Array([137, 80, 78, 71]); // PNG magic bytes
		mockDb.query.stamps.findFirst.mockResolvedValue({
			imageExt: "png",
			isPublic: true,
			userId: null,
			userIp: null,
		});
		mockBucket.get.mockResolvedValueOnce(mockR2Object(imageBytes.buffer));

		const res = await GET(mockRequest(), "abc123def456");
		const body = await res.arrayBuffer();

		expect(body.byteLength).toBe(4);
	});

	it("handles reference images with ref_ prefix", async () => {
		const imageData = new ArrayBuffer(8);
		mockBucket.get.mockResolvedValueOnce(mockR2Object(imageData));

		const res = await GET(mockRequest(), "ref_abc123");

		expect(res.status).toBe(200);
		expect(mockDb.query.stamps.findFirst).not.toHaveBeenCalled();
		// Reference images try webp first (newer format) before falling back to png
		expect(mockBucket.get).toHaveBeenCalledWith("references/abc123.webp");
	});

	describe("private stamp access control", () => {
		it("allows access to public stamps without auth", async () => {
			mockDb.query.stamps.findFirst.mockResolvedValue({
				imageExt: "png",
				isPublic: true,
				userId: "user-123",
				userIp: "1.2.3.4",
			});
			mockBucket.get.mockResolvedValueOnce(mockR2Object(new ArrayBuffer(4)));

			const res = await GET(mockRequest(), "abc123def456");

			expect(res.status).toBe(200);
			// should NOT check auth for public stamps
			expect(getAuthUserId).not.toHaveBeenCalled();
		});

		it("allows access to private stamp when userId matches owner", async () => {
			mockDb.query.stamps.findFirst.mockResolvedValue({
				imageExt: "png",
				isPublic: false,
				userId: "user-123",
				userIp: null,
			});
			vi.mocked(getAuthUserId).mockResolvedValue({ userId: "user-123" });
			vi.mocked(canModifyStamp).mockReturnValue(true);
			mockBucket.get.mockResolvedValueOnce(mockR2Object(new ArrayBuffer(4)));

			const res = await GET(mockRequest(), "abc123def456");

			expect(res.status).toBe(200);
			expect(canModifyStamp).toHaveBeenCalledWith(
				expect.objectContaining({ userId: "user-123", isPublic: false }),
				expect.objectContaining({ userId: "user-123" }),
			);
		});

		it("allows access to private stamp when IP matches anonymous creator", async () => {
			mockDb.query.stamps.findFirst.mockResolvedValue({
				imageExt: "png",
				isPublic: false,
				userId: null,
				userIp: "5.6.7.8",
			});
			vi.mocked(getAuthUserId).mockResolvedValue({ userId: null });
			vi.mocked(getClientIp).mockReturnValue("5.6.7.8");
			vi.mocked(canModifyStamp).mockReturnValue(true);
			mockBucket.get.mockResolvedValueOnce(mockR2Object(new ArrayBuffer(4)));

			const res = await GET(mockRequest(), "abc123def456");

			expect(res.status).toBe(200);
			expect(canModifyStamp).toHaveBeenCalledWith(
				expect.objectContaining({ userIp: "5.6.7.8", isPublic: false }),
				expect.objectContaining({ userIp: "5.6.7.8" }),
			);
		});

		it("returns 403 for private stamp with no auth", async () => {
			mockDb.query.stamps.findFirst.mockResolvedValue({
				imageExt: "png",
				isPublic: false,
				userId: "user-123",
				userIp: null,
			});
			vi.mocked(getAuthUserId).mockResolvedValue({ userId: null });
			vi.mocked(getClientIp).mockReturnValue(null);
			vi.mocked(canModifyStamp).mockReturnValue(false);

			const res = await GET(mockRequest(), "abc123def456");
			const data = (await res.json()) as Record<string, unknown>;

			expect(res.status).toBe(403);
			expect(data.error).toContain("Not authorized");
			expect(mockBucket.get).not.toHaveBeenCalled();
		});

		it("returns 403 for private stamp with wrong userId", async () => {
			mockDb.query.stamps.findFirst.mockResolvedValue({
				imageExt: "png",
				isPublic: false,
				userId: "user-123",
				userIp: null,
			});
			vi.mocked(getAuthUserId).mockResolvedValue({ userId: "user-456" });
			vi.mocked(canModifyStamp).mockReturnValue(false);

			const res = await GET(mockRequest(), "abc123def456");
			const data = (await res.json()) as Record<string, unknown>;

			expect(res.status).toBe(403);
			expect(data.error).toContain("Not authorized");
		});

		it("returns 403 for private stamp with wrong IP", async () => {
			mockDb.query.stamps.findFirst.mockResolvedValue({
				imageExt: "png",
				isPublic: false,
				userId: null,
				userIp: "5.6.7.8",
			});
			vi.mocked(getAuthUserId).mockResolvedValue({ userId: null });
			vi.mocked(getClientIp).mockReturnValue("9.9.9.9");
			vi.mocked(canModifyStamp).mockReturnValue(false);

			const res = await GET(mockRequest(), "abc123def456");

			expect(res.status).toBe(403);
		});

		it("allows access when stamp record is null (legacy: no DB match)", async () => {
			mockDb.query.stamps.findFirst.mockResolvedValue(null);
			mockBucket.get.mockResolvedValueOnce(mockR2Object(new ArrayBuffer(4)));

			const res = await GET(mockRequest(), "abc123def456");

			// No stamp record = no ownership check, proceed to legacy fallback
			expect(res.status).toBe(200);
			expect(getAuthUserId).not.toHaveBeenCalled();
		});
	});
});
