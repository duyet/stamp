import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
	getEnv: vi.fn(),
}));

vi.mock("@/lib/describe-image", () => ({
	describeImage: vi.fn(),
}));

vi.mock("nanoid", () => ({
	nanoid: vi.fn(() => "abc123def456"),
}));

import { describeImage } from "@/lib/describe-image";
import { getEnv } from "@/lib/env";
import { POST } from "../route";

type NextRequest = import("next/server").NextRequest;

function createFormDataRequest(file?: File): NextRequest {
	const formData = new FormData();
	if (file) formData.append("image", file);
	return new Request("http://localhost/api/upload-reference", {
		method: "POST",
		body: formData,
	}) as unknown as NextRequest;
}

function createFile(name: string, type: string, sizeBytes = 100): File {
	const data = new Uint8Array(sizeBytes);
	return new File([data], name, { type });
}

describe("POST /api/upload-reference", () => {
	const mockBucket = {
		put: vi.fn().mockResolvedValue(undefined),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getEnv).mockReturnValue({
			AI: { run: vi.fn() },
			STAMPS_BUCKET: mockBucket,
		} as never);
		vi.mocked(describeImage).mockResolvedValue(
			"A golden retriever sitting on a sandy beach",
		);
	});

	it("returns 400 when image field is missing", async () => {
		const req = createFormDataRequest();
		const res = await POST(req);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(400);
		expect(data.error).toContain("Missing 'image' field");
	});

	it("returns 400 for invalid file type", async () => {
		const file = createFile("test.txt", "text/plain");
		const req = createFormDataRequest(file);
		const res = await POST(req);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(400);
		expect(data.error).toContain("Invalid file type");
	});

	it("returns 400 for file too large", async () => {
		const file = createFile("big.jpg", "image/jpeg", 6 * 1024 * 1024);
		const req = createFormDataRequest(file);
		const res = await POST(req);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(400);
		expect(data.error).toContain("File too large");
	});

	it("accepts file at exactly 5 MB", async () => {
		const file = createFile("ok.jpg", "image/jpeg", 5 * 1024 * 1024);
		const req = createFormDataRequest(file);
		const res = await POST(req);

		expect(res.status).toBe(200);
	});

	it("returns 503 when AI binding is missing", async () => {
		vi.mocked(getEnv).mockReturnValue({
			AI: null,
			STAMPS_BUCKET: mockBucket,
		} as never);

		const file = createFile("test.jpg", "image/jpeg");
		const req = createFormDataRequest(file);
		const res = await POST(req);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(503);
		expect(data.error).toContain("AI binding not configured");
	});

	it("returns 500 when describeImage fails", async () => {
		vi.mocked(describeImage).mockRejectedValue(
			new Error("Vision model failed"),
		);

		const file = createFile("test.jpg", "image/jpeg");
		const req = createFormDataRequest(file);
		const res = await POST(req);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(500);
		expect(data.error).toContain("Could not analyze image");
	});

	it("returns referenceId, URL, and description on success", async () => {
		const file = createFile("photo.jpg", "image/jpeg");
		const req = createFormDataRequest(file);
		const res = await POST(req);
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(200);
		expect(data.referenceId).toBe("abc123def456");
		expect(data.referenceImageUrl).toBe("/api/stamps/ref_abc123def456/image");
		expect(data.referenceDescription).toBe(
			"A golden retriever sitting on a sandy beach",
		);
	});

	it("stores image in R2 with correct key and content type", async () => {
		const file = createFile("photo.png", "image/png");
		const req = createFormDataRequest(file);
		await POST(req);

		expect(mockBucket.put).toHaveBeenCalledWith(
			"references/abc123def456.png",
			expect.any(Uint8Array),
			{ httpMetadata: { contentType: "image/png" } },
		);
	});

	it("uses webp extension for webp images", async () => {
		const file = createFile("photo.webp", "image/webp");
		const req = createFormDataRequest(file);
		await POST(req);

		expect(mockBucket.put).toHaveBeenCalledWith(
			"references/abc123def456.webp",
			expect.any(Uint8Array),
			{ httpMetadata: { contentType: "image/webp" } },
		);
	});

	it("uses jpg extension for jpeg images", async () => {
		const file = createFile("photo.jpg", "image/jpeg");
		const req = createFormDataRequest(file);
		await POST(req);

		expect(mockBucket.put).toHaveBeenCalledWith(
			"references/abc123def456.jpg",
			expect.any(Uint8Array),
			{ httpMetadata: { contentType: "image/jpeg" } },
		);
	});

	it("accepts all valid image types", async () => {
		for (const type of ["image/jpeg", "image/png", "image/webp"]) {
			vi.clearAllMocks();
			vi.mocked(getEnv).mockReturnValue({
				AI: { run: vi.fn() },
				STAMPS_BUCKET: mockBucket,
			} as never);
			vi.mocked(describeImage).mockResolvedValue("description");

			const file = createFile("test", type);
			const req = createFormDataRequest(file);
			const res = await POST(req);

			expect(res.status).toBe(200);
		}
	});

	it("passes correct args to describeImage", async () => {
		const file = createFile("photo.jpg", "image/jpeg", 50);
		const req = createFormDataRequest(file);
		await POST(req);

		expect(describeImage).toHaveBeenCalledWith(
			expect.anything(),
			expect.any(Uint8Array),
			"image/jpeg",
		);
	});
});
