import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "@/db";
import { getEnv } from "@/lib/env";
import { createGetRequest, createSelectChain } from "@/test-utils";
import { GET } from "../../stamps";

vi.mock("@/db", () => ({
	getDb: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
	getEnv: vi.fn(),
}));

const URL = "http://localhost/api/stamps";

describe("GET /api/stamps", () => {
	const mockResults = [
		{
			id: "stamp1",
			prompt: "a cat",
			imageUrl: "/api/stamps/stamp1/image",
			thumbnailUrl: null,
			style: "vintage",
			isPublic: true,
			createdAt: new Date("2024-01-01T12:00:00Z"),
			description: null,
		},
		{
			id: "stamp2",
			prompt: "a dog",
			imageUrl: "/api/stamps/stamp2/image",
			thumbnailUrl: null,
			style: "modern",
			isPublic: true,
			createdAt: new Date("2024-01-01T11:00:00Z"),
			description: null,
		},
	];

	let mockChain: ReturnType<typeof createSelectChain>;
	const mockBucket = {
		head: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockChain = createSelectChain(mockResults);
		vi.mocked(getDb).mockReturnValue({
			select: vi.fn().mockReturnValue(mockChain),
		} as never);
		vi.mocked(getEnv).mockReturnValue({
			STAMPS_BUCKET: mockBucket,
		} as never);
		mockBucket.head.mockResolvedValue({});
	});

	it("returns stamps with default pagination", async () => {
		const res = await GET(createGetRequest(URL));
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(200);
		const expectedStamps = mockResults.map((stamp) => ({
			...stamp,
			createdAt: stamp.createdAt.toISOString(),
		}));
		expect(data.stamps).toEqual(expectedStamps);
		expect(data.hasMore).toBe(false);
		expect(data.nextCursor).toBeUndefined();
	});

	it("uses default limit of 50", async () => {
		await GET(createGetRequest(URL));
		expect(mockChain.limit).toHaveBeenCalledWith(51);
	});

	it("generates cursor when hasMore", async () => {
		const moreResults = [
			...mockResults,
			{
				id: "stamp3",
				prompt: "more",
				imageUrl: "/api/stamps/stamp3/image",
				thumbnailUrl: null,
				style: "vintage",
				isPublic: true,
				createdAt: new Date("2024-01-01T10:00:00Z"),
				description: null,
			},
		];
		const moreChain = createSelectChain(moreResults);
		vi.mocked(getDb).mockReturnValue({
			select: vi.fn().mockReturnValue(moreChain),
		} as never);

		const res = await GET(createGetRequest(URL, { limit: "2" }));
		const data = (await res.json()) as Record<string, unknown>;

		expect(Array.isArray(data.stamps)).toBe(true);
		expect(data.hasMore).toBe(true);
		expect(data.nextCursor).toBeDefined();
	});

	it("respects cursor for pagination", async () => {
		const cursor = new Date("2024-01-01T10:00:00Z").toISOString();
		await GET(createGetRequest(URL, { cursor, limit: "10" }));

		expect(mockChain.limit).toHaveBeenCalledWith(11);
	});

	it("caps limit at 100", async () => {
		await GET(createGetRequest(URL, { limit: "200" }));
		expect(mockChain.limit).toHaveBeenCalledWith(101);
	});

	it("returns empty array when no stamps", async () => {
		const emptyChain = createSelectChain([]);
		vi.mocked(getDb).mockReturnValue({
			select: vi.fn().mockReturnValue(emptyChain),
		} as never);

		const res = await GET(createGetRequest(URL));
		const data = (await res.json()) as Record<string, unknown>;

		expect(data.stamps).toEqual([]);
	});

	it("filters out stamps with missing image objects", async () => {
		mockBucket.head.mockImplementation(async (key: string) => {
			return key.startsWith("stamps/stamp1.") ? null : {};
		});

		const res = await GET(createGetRequest(URL, { limit: "2" }));
		const data = (await res.json()) as {
			stamps: Array<{ id: string }>;
			hasMore: boolean;
		};

		expect(data.stamps.map((stamp) => stamp.id)).toEqual(["stamp2"]);
		expect(data.hasMore).toBe(false);
	});

	it("returns 500 on database error", async () => {
		vi.mocked(getDb).mockReturnValue({
			select: vi.fn().mockReturnValue({
				from: vi.fn().mockRejectedValue(new Error("DB error")),
			}),
		} as never);

		const res = await GET(createGetRequest(URL));
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(500);
		expect(data.error).toContain("Failed to fetch stamps");
	});
});
