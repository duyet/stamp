import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGetRequest } from "@/test-utils";

vi.mock("@/db", () => ({
	getDb: vi.fn(),
}));

import { getDb } from "@/db";
import { GET } from "../route";

const URL = "http://localhost/api/stamps";

describe("GET /api/stamps", () => {
	const mockResults = [
		{
			id: "stamp1",
			prompt: "a cat",
			imageUrl: "/api/stamps/stamp1/image",
			style: "vintage",
			isPublic: true,
		},
		{
			id: "stamp2",
			prompt: "a dog",
			imageUrl: "/api/stamps/stamp2/image",
			style: "modern",
			isPublic: true,
		},
	];

	let mockChain: {
		select: ReturnType<typeof vi.fn>;
		from: ReturnType<typeof vi.fn>;
		where: ReturnType<typeof vi.fn>;
		orderBy: ReturnType<typeof vi.fn>;
		limit: ReturnType<typeof vi.fn>;
		offset: ReturnType<typeof vi.fn>;
	};

	beforeEach(() => {
		vi.clearAllMocks();

		mockChain = {
			select: vi.fn(),
			from: vi.fn(),
			where: vi.fn(),
			orderBy: vi.fn(),
			limit: vi.fn(),
			offset: vi.fn().mockResolvedValue(mockResults),
		};
		mockChain.select.mockReturnValue(mockChain);
		mockChain.from.mockReturnValue(mockChain);
		mockChain.where.mockReturnValue(mockChain);
		mockChain.orderBy.mockReturnValue(mockChain);
		mockChain.limit.mockReturnValue(mockChain);

		vi.mocked(getDb).mockReturnValue(mockChain as never);
	});

	it("returns stamps with default pagination", async () => {
		const res = await GET(createGetRequest(URL));
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(200);
		expect(data.stamps).toEqual(mockResults);
	});

	it("uses default limit of 50", async () => {
		await GET(createGetRequest(URL));
		expect(mockChain.limit).toHaveBeenCalledWith(50);
	});

	it("uses default offset of 0", async () => {
		await GET(createGetRequest(URL));
		expect(mockChain.offset).toHaveBeenCalledWith(0);
	});

	it("respects custom limit and offset", async () => {
		await GET(createGetRequest(URL, { limit: "20", offset: "10" }));

		expect(mockChain.limit).toHaveBeenCalledWith(20);
		expect(mockChain.offset).toHaveBeenCalledWith(10);
	});

	it("caps limit at 100", async () => {
		await GET(createGetRequest(URL, { limit: "200" }));
		expect(mockChain.limit).toHaveBeenCalledWith(100);
	});

	it("returns empty array when no stamps", async () => {
		mockChain.offset.mockResolvedValue([]);

		const res = await GET(createGetRequest(URL));
		const data = (await res.json()) as Record<string, unknown>;

		expect(data.stamps).toEqual([]);
	});

	it("returns 500 on database error", async () => {
		mockChain.offset.mockRejectedValue(new Error("DB error"));

		const res = await GET(createGetRequest(URL));
		const data = (await res.json()) as Record<string, unknown>;

		expect(res.status).toBe(500);
		expect(data.error).toContain("Failed to fetch stamps");
	});
});
