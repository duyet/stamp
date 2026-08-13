import { beforeEach, describe, expect, it, vi } from "vitest";

const selectMock = vi.fn();

vi.mock("@/db", () => ({
	getDb: () => ({ select: selectMock }),
}));

vi.mock("@/lib/env", () => ({
	getEnv: () => ({ STAMPS_BUCKET: { head: async () => null } }),
}));

import { fetchPublicStamps } from "../public-stamps";

interface FakeRow {
	id: string;
	createdAt: Date;
	imageExt: string | null;
}

function row(id: string, createdAt: number, imageExt: string | null): FakeRow {
	return { id, createdAt: new Date(createdAt), imageExt };
}

/**
 * Stubs the drizzle fluent chain so each call to `db.select()` resolves to the
 * next batch in `batches`.
 */
function stubBatches(batches: FakeRow[][]) {
	let call = 0;
	selectMock.mockImplementation(() => {
		const results = batches[call] ?? [];
		call += 1;

		const chain = {
			from: () => chain,
			where: () => chain,
			orderBy: () => chain,
			limit: () => Promise.resolve(results),
		};

		return chain;
	});

	return () => call;
}

beforeEach(() => {
	selectMock.mockReset();
});

describe("fetchPublicStamps", () => {
	it("returns a cursor pointing past the last shown stamp on a full page", async () => {
		stubBatches([[row("a", 3000, "jpg"), row("b", 2000, "jpg")]]);

		const result = await fetchPublicStamps({ limit: 1 });

		expect(result.stamps.map((s) => s.id)).toEqual(["a"]);
		expect(result.hasMore).toBe(true);
		expect(result.nextCursor).toBe(new Date(2999).toISOString());
	});

	it("reports the end of the list when a batch comes back short", async () => {
		stubBatches([[row("a", 3000, "jpg")]]);

		const result = await fetchPublicStamps({ limit: 5 });

		expect(result.stamps.map((s) => s.id)).toEqual(["a"]);
		expect(result.hasMore).toBe(false);
		expect(result.nextCursor).toBeUndefined();
	});

	// Regression: the refill cap must not be reported as "no more results".
	// Unrenderable rows (no extension, and the stubbed bucket has no object)
	// exhaust the budget while renderable rows may still exist further back.
	it("keeps paginating when the refill budget runs out", async () => {
		const unrenderable = [row("x", 9000, null), row("y", 8000, null)];
		const countCalls = stubBatches([
			unrenderable,
			unrenderable,
			unrenderable,
			unrenderable,
			unrenderable,
			unrenderable,
		]);

		const result = await fetchPublicStamps({ limit: 1 });

		expect(result.stamps).toEqual([]);
		expect(result.hasMore).toBe(true);
		// Continues from the last scanned raw row rather than stopping.
		expect(result.nextCursor).toBe(new Date(7999).toISOString());
		// The cap held: it did not walk the whole table.
		expect(countCalls()).toBe(5);
	});
});
