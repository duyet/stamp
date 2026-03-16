/**
 * Shared test helpers for API route and unit tests.
 */
import type { NextRequest } from "next/server";
import { vi } from "vitest";
import type { Database } from "@/db";

/**
 * Create a JSON POST/PATCH/PUT request for testing API route handlers.
 */
export function createJsonRequest(
	url: string,
	method: string,
	body: Record<string, unknown>,
	headers: Record<string, string> = {},
): NextRequest {
	return new Request(url, {
		method,
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify(body),
	}) as unknown as NextRequest;
}

/**
 * Create a GET request with optional query params for testing API route handlers.
 */
export function createGetRequest(
	url: string,
	params: Record<string, string> = {},
): NextRequest {
	const parsed = new URL(url);
	for (const [key, value] of Object.entries(params)) {
		parsed.searchParams.set(key, value);
	}
	return new Request(parsed.toString()) as unknown as NextRequest;
}

/**
 * Create a Next.js dynamic route `params` object (Promise-based, as of Next 15+).
 */
export function createRouteParams<T extends Record<string, string>>(
	params: T,
): { params: Promise<T> } {
	return { params: Promise.resolve(params) };
}

/**
 * Create a mock Drizzle database for rate-limit tests.
 * Returns the mock db plus references to the insert/update spies for assertions.
 */
export function createMockRateLimitDb(
	existing: {
		userIp: string;
		generationsCount: number;
		windowStart: Date;
	} | null,
) {
	const insertValues = vi.fn().mockResolvedValue(undefined);
	const updateSet = vi.fn().mockReturnValue({
		where: vi.fn().mockResolvedValue(undefined),
	});

	return {
		db: {
			query: {
				rateLimits: {
					findFirst: vi.fn().mockResolvedValue(existing),
				},
			},
			insert: vi.fn().mockReturnValue({ values: insertValues }),
			update: vi.fn().mockReturnValue({ set: updateSet }),
		} as unknown as Database,
		insertValues,
		updateSet,
	};
}

/**
 * Create a mock drizzle select() chain that resolves to the given results.
 *
 * Models the chain: db.select().from().where().groupBy().orderBy()
 * Each method returns a promise that is also chainable — this mirrors how
 * drizzle queries work (they are thenables at every point in the chain).
 *
 * Uses `Object.assign(Promise, methods)` so the result is a real Promise
 * (natively awaitable) with chain methods attached, avoiding custom
 * thenable hacks or Proxy traps.
 */
export function createSelectChain(result: unknown[]) {
	type ChainLink = Promise<unknown[]> & {
		from: ReturnType<typeof vi.fn>;
		where: ReturnType<typeof vi.fn>;
		groupBy: ReturnType<typeof vi.fn>;
		orderBy: ReturnType<typeof vi.fn>;
	};

	function makeLink(): ChainLink {
		const methods = {
			from: vi.fn().mockImplementation(() => makeLink()),
			where: vi.fn().mockImplementation(() => makeLink()),
			groupBy: vi.fn().mockImplementation(() => makeLink()),
			orderBy: vi.fn().mockImplementation(() => Promise.resolve(result)),
		};
		return Object.assign(Promise.resolve(result), methods);
	}

	return makeLink();
}
