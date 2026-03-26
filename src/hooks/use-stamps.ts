import { useCallback, useEffect, useRef, useState } from "react";
import type { Stamp } from "@/db/schema";

/**
 * Fetch public stamps with cursor-based pagination.
 * @param pageSize - Number of stamps per page
 * @param retryKey - Optional key that changes to trigger a refetch
 */
export function useStamps(pageSize: number, retryKey = 0) {
	const [stamps, setStamps] = useState<Stamp[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [hasMore, setHasMore] = useState(false);
	const nextCursorRef = useRef<string | null>(null);
	const abortRef = useRef<AbortController | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: retryKey triggers refetch on retry
	useEffect(() => {
		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;

		async function load() {
			try {
				setLoading(true);
				nextCursorRef.current = null;
				const r = await fetch(`/api/stamps?limit=${pageSize}`, {
					signal: controller.signal,
				});
				const data = (await r.json()) as {
					stamps?: Stamp[];
					error?: string;
					nextCursor?: string;
					hasMore?: boolean;
				};
				if (!r.ok) {
					throw new Error(data.error ?? "Failed to fetch stamps");
				}
				setError(null);
				setStamps(data.stamps ?? []);
				nextCursorRef.current = data.nextCursor ?? null;
				setHasMore(data.hasMore ?? false);
			} catch (err) {
				if ((err as Error).name === "AbortError") return;
				console.error("Failed to fetch stamps:", err);
				setError(err instanceof Error ? err.message : "Failed to load stamps");
			} finally {
				if (!controller.signal.aborted) {
					setLoading(false);
				}
			}
		}
		load();

		return () => controller.abort();
	}, [pageSize, retryKey]);

	// Load next page
	const loadMore = useCallback(async () => {
		if (!nextCursorRef.current || loadingMore) return;

		const controller = new AbortController();
		try {
			setLoadingMore(true);
			const r = await fetch(
				`/api/stamps?limit=${pageSize}&cursor=${nextCursorRef.current}`,
				{ signal: controller.signal },
			);
			const data = (await r.json()) as {
				stamps?: Stamp[];
				error?: string;
				nextCursor?: string;
				hasMore?: boolean;
			};
			if (!r.ok) {
				throw new Error(data.error ?? "Failed to fetch stamps");
			}
			setStamps((prev) => [...prev, ...(data.stamps ?? [])]);
			nextCursorRef.current = data.nextCursor ?? null;
			setHasMore(data.hasMore ?? false);
		} catch (err) {
			if ((err as Error).name === "AbortError") return;
			console.error("Failed to load more stamps:", err);
		} finally {
			setLoadingMore(false);
		}
	}, [pageSize, loadingMore]);

	return { stamps, setStamps, loading, loadingMore, error, hasMore, loadMore };
}
