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
	// Mutable state that gets updated by SQL operations
	let currentState = existing ? { ...existing } : null;

	const insertValues = vi.fn().mockResolvedValue(undefined);
	const updateSet = vi
		.fn()
		.mockImplementation((fields: Record<string, unknown>) => {
			// Simulate Drizzle update().set() by updating currentState directly
			if (currentState && fields.generationsCount !== undefined) {
				currentState = { ...currentState, ...fields };
			}
			return {
				where: vi.fn().mockResolvedValue(undefined),
			};
		});

	// Mock D1 client for raw SQL
	const mockPrepare = vi.fn().mockImplementation((sql: string) => {
		return {
			bind: vi.fn().mockImplementation((..._args: unknown[]) => {
				return {
					run: vi.fn().mockImplementation(() => {
						// Simulate atomic UPDATE for rate limit
						if (
							sql.includes("UPDATE rate_limits") &&
							sql.includes("generations_count = generations_count + 1")
						) {
							if (currentState && currentState.generationsCount < 100) {
								currentState.generationsCount += 1;
							}
						}
						return {};
					}),
				};
			}),
		};
	});

	return {
		db: {
			$client: {
				prepare: mockPrepare,
			},
			query: {
				rateLimits: {
					findFirst: vi.fn().mockImplementation(() => {
						return Promise.resolve(currentState ? { ...currentState } : null);
					}),
				},
			},
			insert: vi.fn().mockReturnValue({ values: insertValues }),
			update: vi.fn().mockReturnValue({ set: updateSet }),
		} as unknown as Database,
		insertValues,
		updateSet,
		mockPrepare,
	};
}

/**
 * Create a mock CF Workers AI binding for generate-stamp tests.
 */
export function createMockAi(
	llmResponse: string,
	imageBase64: string | null,
	visionResponse?: string,
): Ai {
	return {
		run: vi.fn().mockImplementation((model: string) => {
			if (model.includes("llama") && model.includes("vision")) {
				return Promise.resolve({
					response: visionResponse ?? "A described image",
				});
			}
			if (model.includes("llava")) {
				return Promise.resolve({
					description: visionResponse ?? "A described image",
				});
			}
			if (model.includes("qwen")) {
				return Promise.resolve({ response: llmResponse });
			}
			if (model.includes("flux")) {
				return Promise.resolve({ image: imageBase64 });
			}
			return Promise.reject(new Error(`Unknown model: ${model}`));
		}),
	} as unknown as Ai;
}

/**
 * Create a mock Drizzle database for credits tests.
 * Returns the mock db plus references to the insert/update spies for assertions.
 *
 * The mock simulates atomic SQL UPDATE operations by tracking state changes
 * and returning updated data on subsequent queries.
 */
export function createMockCreditsDb(
	existing: {
		userId: string;
		dailyLimit: number;
		dailyUsed: number;
		dailyResetAt: number;
		purchasedCredits: number;
		createdAt: number;
		updatedAt: number;
	} | null,
) {
	// Mutable state that gets updated by SQL operations
	let currentState = existing ? { ...existing } : null;

	const insertValues = vi.fn().mockResolvedValue(undefined);
	const updateSet = vi
		.fn()
		.mockImplementation((fields: Record<string, unknown>) => {
			// Simulate Drizzle update().set() by updating currentState directly
			if (currentState && fields.dailyUsed !== undefined) {
				currentState = { ...currentState, ...fields };
			}
			return {
				where: vi.fn().mockResolvedValue(undefined),
			};
		});

	// Mock D1 client for raw SQL (prepare().bind().run())
	const mockPrepare = vi.fn().mockImplementation((sql: string) => {
		// Simulate atomic UPDATE by modifying state directly
		return {
			bind: vi.fn().mockImplementation((...args: unknown[]) => {
				return {
					run: vi.fn().mockImplementation(() => {
						// Parse the SQL to simulate the UPDATE
						if (sql.includes("UPDATE user_credits")) {
							if (sql.includes("daily_used = daily_used +")) {
								// Daily credit deduction
								const cost = args[0] as number;
								if (
									currentState &&
									currentState.dailyUsed + cost <= currentState.dailyLimit
								) {
									currentState.dailyUsed += cost;
									currentState.updatedAt = args[1] as number;
								}
							} else if (
								sql.includes("purchased_credits = purchased_credits -")
							) {
								// Purchased credit deduction
								const cost = args[0] as number;
								if (currentState && currentState.purchasedCredits >= cost) {
									currentState.purchasedCredits -= cost;
									currentState.updatedAt = args[1] as number;
								}
							}
						}
						return {};
					}),
				};
			}),
		};
	});

	return {
		db: {
			$client: {
				prepare: mockPrepare,
			},
			query: {
				userCredits: {
					findFirst: vi.fn().mockImplementation(() => {
						// Return current state (which may have been modified by SQL UPDATE)
						return Promise.resolve(currentState ? { ...currentState } : null);
					}),
				},
			},
			insert: vi.fn().mockReturnValue({ values: insertValues }),
			update: vi.fn().mockReturnValue({ set: updateSet }),
		} as unknown as Database,
		insertValues,
		updateSet,
		mockPrepare,
	};
}

/**
 * Create a mock drizzle select() chain that resolves to the given results.
 *
 * Models the chain: db.select().from().where().groupBy().orderBy().limit().offset()
 * Each method returns a single shared chain link that is also a real Promise,
 * so it can be awaited at any point in the chain (matching drizzle behavior).
 *
 * Uses a single pre-built chain object (not recursive) to avoid unnecessary
 * mock + Promise allocations.
 */
export function createSelectChain(result: unknown[]) {
	const resolved = Promise.resolve(result);
	const chain = Object.assign(resolved, {
		from: vi.fn(),
		where: vi.fn(),
		groupBy: vi.fn(),
		orderBy: vi.fn(),
		limit: vi.fn(),
		offset: vi.fn(),
	});

	// Every method returns the same chain link
	chain.from.mockReturnValue(chain);
	chain.where.mockReturnValue(chain);
	chain.groupBy.mockReturnValue(chain);
	chain.orderBy.mockReturnValue(chain);
	chain.limit.mockReturnValue(chain);
	chain.offset.mockReturnValue(chain);

	return chain;
}

/**
 * Create a mock D1 $client.prepare for rate limit testing.
 * Returns a vi.fn() that mocks prepare().bind() with first() and run() methods.
 *
 * @param currentCount - The current generations_count to return (undefined = no existing record)
 * @param changes - Number of rows affected by UPDATE (default: 1)
 */
export function createMockRateLimitPrepare(
	currentCount?: number,
	changes = 1,
): ReturnType<typeof vi.fn> {
	return vi.fn().mockReturnValue({
		bind: vi.fn().mockReturnValue({
			first: vi
				.fn()
				.mockResolvedValue(
					currentCount === undefined
						? null
						: { generations_count: currentCount },
				),
			run: vi.fn().mockResolvedValue({ meta: { changes } }),
		}),
	});
}
