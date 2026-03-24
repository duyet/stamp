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
							// Check if within limit (20 is max per day)
							// If count is already at limit, don't increment
							if (currentState && currentState.generationsCount < 20) {
								currentState.generationsCount += 1;
								return { meta: { changes: 1 } };
							}
							return { meta: { changes: 0 } };
						}
						return { meta: { changes: 0 } };
					}),
					first: vi.fn().mockImplementation(() => {
						// Simulate RETURNING clause
						if (
							sql.includes("UPDATE rate_limits") &&
							sql.includes("RETURNING generations_count")
						) {
							if (currentState && currentState.generationsCount < 20) {
								currentState.generationsCount += 1;
								return Promise.resolve({
									generations_count: currentState.generationsCount,
								});
							}
							return Promise.resolve(null);
						}
						return Promise.resolve(null);
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

	// Mock D1 client for raw SQL (prepare().bind().run()/.first())
	const mockPrepare = vi.fn().mockImplementation((sql: string) => {
		// Simulate atomic UPDATE by modifying state directly
		return {
			bind: vi.fn().mockImplementation((...args: unknown[]) => {
				return {
					run: vi.fn().mockImplementation(() => {
						// Parse the SQL to simulate the UPDATE
						if (sql.includes("UPDATE user_credits")) {
							let changes = 0;
							if (sql.includes("daily_used = daily_used +")) {
								// Daily credit deduction
								const cost = args[0] as number;
								if (
									currentState &&
									currentState.dailyUsed + cost <= currentState.dailyLimit
								) {
									currentState.dailyUsed += cost;
									currentState.updatedAt = args[1] as number;
									changes = 1;
								}
							} else if (
								sql.includes("purchased_credits = purchased_credits -")
							) {
								// Purchased credit deduction
								const cost = args[0] as number;
								if (currentState && currentState.purchasedCredits >= cost) {
									currentState.purchasedCredits -= cost;
									currentState.updatedAt = args[1] as number;
									changes = 1;
								}
							}
							return { meta: { changes } };
						}
						return { meta: { changes: 0 } };
					}),
					first: vi.fn().mockImplementation(() => {
						// Simulate INSERT ... ON CONFLICT ... RETURNING
						if (
							sql.includes("INSERT INTO user_credits") &&
							sql.includes("ON CONFLICT")
						) {
							// For new user
							if (!currentState) {
								const newRecord = {
									daily_limit: args[1] as number,
									daily_used: 1,
									daily_reset_at: args[2] as number,
									purchased_credits: 0,
								};
								currentState = {
									userId: args[0] as string,
									dailyLimit: newRecord.daily_limit,
									dailyUsed: newRecord.daily_used,
									dailyResetAt: newRecord.daily_reset_at,
									purchasedCredits: newRecord.purchased_credits,
									createdAt: args[3] as number,
									updatedAt: args[4] as number,
								};
								return Promise.resolve(newRecord);
							}

							// For existing user - simulate the complex CASE logic
							// Args: userId, dailyLimit, now+window, now, now, windowStart, cost, cost, cost, cost, cost, cost, windowStart, now+window, now
							const windowStart = args[5] as number;
							const cost = args[6] as number;
							const now = args[16] as number;

							// Simulate the SQL CASE logic
							let newDailyUsed = currentState.dailyUsed;
							let newPurchased = currentState.purchasedCredits;
							let newResetAt = currentState.dailyResetAt;

							// Auto-reset check: WHEN user_credits.daily_reset_at < ?
							if (currentState.dailyResetAt < windowStart) {
								newDailyUsed = 1;
								newResetAt = now + 86400000;
							}
							// Daily increment check: WHEN user_credits.daily_used + ? <= user_credits.daily_limit
							else if (
								currentState.dailyUsed + cost <=
								currentState.dailyLimit
							) {
								newDailyUsed = currentState.dailyUsed + cost;
							}
							// Purchased decrement check happens in second CASE
							// WHEN user_credits.daily_used + ? > user_credits.daily_limit AND user_credits.purchased_credits >= ?
							else if (
								currentState.dailyUsed + cost > currentState.dailyLimit &&
								currentState.purchasedCredits >= cost
							) {
								newPurchased = currentState.purchasedCredits - cost;
							}

							// Update state
							currentState.dailyUsed = newDailyUsed;
							currentState.purchasedCredits = newPurchased;
							currentState.dailyResetAt = newResetAt;
							currentState.updatedAt = now;

							// Return in snake_case (matching SQL RETURNING clause)
							return Promise.resolve({
								daily_limit: currentState.dailyLimit,
								daily_used: currentState.dailyUsed,
								daily_reset_at: currentState.dailyResetAt,
								purchased_credits: currentState.purchasedCredits,
							});
						}
						return Promise.resolve(null);
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
