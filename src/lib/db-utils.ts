import type { Database } from "@/db";

/**
 * Execute a SQL query with parameters using prepared statement pattern.
 * Wrapper around db.$client.prepare().bind().run() for D1 queries.
 *
 * @param db - Database instance
 * @param sql - SQL query string with ? placeholders
 * @param params - Parameters to bind to placeholders
 * @returns Result from D1 execution
 *
 * @example
 * ```ts
 * await executeSql(db, "UPDATE users SET name = ? WHERE id = ?", "Alice", "user-123")
 * ```
 */
export async function executeSql(
	db: Database,
	sql: string,
	...params: unknown[]
): Promise<D1Result> {
	return db.$client
		.prepare(sql)
		.bind(...params)
		.run();
}

/**
 * Execute a SQL query and get the first result row.
 * Wrapper around db.$client.prepare().bind().first().
 *
 * @param db - Database instance
 * @param sql - SQL query string with ? placeholders
 * @param params - Parameters to bind to placeholders
 * @returns First result row or null
 *
 * @example
 * ```ts
 * const user = await executeSqlFirst(db, "SELECT * FROM users WHERE id = ?", "user-123")
 * ```
 */
export async function executeSqlFirst<T>(
	db: Database,
	sql: string,
	...params: unknown[]
): Promise<T | null> {
	return db.$client
		.prepare(sql)
		.bind(...params)
		.first<T | null>();
}
