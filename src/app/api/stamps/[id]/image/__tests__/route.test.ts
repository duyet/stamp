import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGetRequest, createRouteParams } from "@/test-utils";

vi.mock("@/lib/env", () => ({
	getEnv: vi.fn(),
}));

vi.mock("@/db", () => ({
	getDb: vi.fn(),
}));

import { getDb } from "@/db";
import { getEnv } from "@/lib/env";
import { GET } from "../route";

const URL = "http://localhost/api/stamps/abc123def456/image";

describe("GET /api/stamps/[id]/image", () => {
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
	});

	it("returns png image when found in DB", async () => {
		const imageData = new ArrayBuffer(8);
		mockDb.query.stamps.findFirst.mockResolvedValue({
			imageExt: "png",
		});
		mockBucket.get.mockResolvedValueOnce({
			arrayBuffer: () => Promise.resolve(imageData),
		});

		const res = await GET(
			createGetRequest(URL),
			createRouteParams({ id: "abc123def456" }),
		);

		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toBe("image/png");
		expect(res.headers.get("Cache-Control")).toContain("immutable");
		expect(res.headers.get("Cache-Control")).toContain("max-age=31536000");
		expect(mockBucket.get).toHaveBeenCalledWith("stamps/abc123def456.png");
	});

	it("falls back to extension probing when no imageExt in DB", async () => {
		const imageData = new ArrayBuffer(8);
		mockDb.query.stamps.findFirst.mockResolvedValue({
			imageExt: null,
		});
		mockBucket.get.mockResolvedValueOnce(null); // png not found
		mockBucket.get.mockResolvedValueOnce({
			// jpg found
			arrayBuffer: () => Promise.resolve(imageData),
		});

		const res = await GET(
			createGetRequest(URL),
			createRouteParams({ id: "abc123def456" }),
		);

		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toBe("image/jpeg");
	});

	it("returns 404 when neither png nor jpg exists", async () => {
		mockDb.query.stamps.findFirst.mockResolvedValue({
			imageExt: null,
		});
		mockBucket.get.mockResolvedValue(null);

		const res = await GET(
			createGetRequest(URL),
			createRouteParams({ id: "abc123def456" }),
		);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(404);
		expect(data.error).toContain("Image not found");
	});

	it("uses correct R2 key with stamp ID", async () => {
		mockDb.query.stamps.findFirst.mockResolvedValue({
			imageExt: "png",
		});
		mockBucket.get.mockResolvedValueOnce({
			arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
		});

		await GET(createGetRequest(URL), createRouteParams({ id: "xyz789abc012" }));

		expect(mockBucket.get).toHaveBeenCalledWith("stamps/xyz789abc012.png");
	});

	it("returns 500 on R2 error", async () => {
		mockDb.query.stamps.findFirst.mockResolvedValue({
			imageExt: "png",
		});
		mockBucket.get.mockRejectedValue(new Error("R2 unavailable"));

		const res = await GET(
			createGetRequest(URL),
			createRouteParams({ id: "abc123def456" }),
		);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(500);
		expect(data.error).toContain("Failed to load image");
	});

	it("returns image body as binary", async () => {
		const imageBytes = new Uint8Array([137, 80, 78, 71]); // PNG magic bytes
		mockDb.query.stamps.findFirst.mockResolvedValue({
			imageExt: "png",
		});
		mockBucket.get.mockResolvedValueOnce({
			arrayBuffer: () => Promise.resolve(imageBytes.buffer),
		});

		const res = await GET(
			createGetRequest(URL),
			createRouteParams({ id: "abc123def456" }),
		);
		const body = await res.arrayBuffer();

		expect(body.byteLength).toBe(4);
	});

	it("handles reference images with ref_ prefix", async () => {
		const imageData = new ArrayBuffer(8);
		mockBucket.get.mockResolvedValueOnce({
			arrayBuffer: () => Promise.resolve(imageData),
		});

		const res = await GET(
			createGetRequest(URL),
			createRouteParams({ id: "ref_abc123" }),
		);

		expect(res.status).toBe(200);
		expect(mockDb.query.stamps.findFirst).not.toHaveBeenCalled();
		expect(mockBucket.get).toHaveBeenCalledWith("references/abc123.png");
	});
});
