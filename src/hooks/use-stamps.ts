"use client";

import { useEffect, useState } from "react";
import type { Stamp } from "@/db/schema";

/**
 * Fetch public stamps on mount and return { stamps, loading, error }.
 * @param limit - Maximum number of stamps to fetch
 * @param retryKey - Optional key that changes to trigger a refetch
 */
export function useStamps(limit: number, retryKey = 0) {
	const [stamps, setStamps] = useState<Stamp[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: retryKey triggers refetch on retry
	useEffect(() => {
		async function load() {
			try {
				setLoading(true);
				const r = await fetch(`/api/stamps?limit=${limit}`);
				const data = (await r.json()) as { stamps?: Stamp[]; error?: string };
				if (!r.ok) {
					throw new Error(data.error ?? "Failed to fetch stamps");
				}
				// Only clear error on success
				setError(null);
				setStamps(data.stamps ?? []);
			} catch (err) {
				console.error("Failed to fetch stamps:", err);
				setError(err instanceof Error ? err.message : "Failed to load stamps");
			} finally {
				setLoading(false);
			}
		}
		load();
	}, [limit, retryKey]);

	return { stamps, setStamps, loading, error };
}
