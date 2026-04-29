import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "@/db";
import { createGetRequest, createSelectChain } from "@/test-utils";
import { GET } from "../favicon";

vi.mock("@/db", () => ({
	getDb: vi.fn(),
}));

const URL = "http://localhost/api/favicon";

describe("GET /api/favicon", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("redirects to the latest public stamp image", async () => {
		const chain = createSelectChain([{ id: "latest_stamp" }]);
		vi.mocked(getDb).mockReturnValue({
			select: vi.fn().mockReturnValue(chain),
		} as never);

		const res = await GET(createGetRequest(URL));

		expect(res.status).toBe(302);
		expect(res.headers.get("Location")).toBe("/api/stamps/latest_stamp/image");
		expect(res.headers.get("Cache-Control")).toContain("max-age=300");
		expect(chain.where).toHaveBeenCalled();
		expect(chain.orderBy).toHaveBeenCalled();
		expect(chain.limit).toHaveBeenCalledWith(1);
	});

	it("falls back to the static favicon when no public stamp exists", async () => {
		const chain = createSelectChain([]);
		vi.mocked(getDb).mockReturnValue({
			select: vi.fn().mockReturnValue(chain),
		} as never);

		const res = await GET(createGetRequest(URL));

		expect(res.status).toBe(302);
		expect(res.headers.get("Location")).toBe("/stamp.png");
	});

	it("falls back to the static favicon when the query fails", async () => {
		vi.mocked(getDb).mockReturnValue({
			select: vi.fn().mockImplementation(() => {
				throw new Error("DB unavailable");
			}),
		} as never);

		const res = await GET(createGetRequest(URL));

		expect(res.status).toBe(302);
		expect(res.headers.get("Location")).toBe("/stamp.png");
	});
});
