"use client";

import { useEffect, useState } from "react";
import type { Stamp } from "@/db/schema";

/**
 * Fetch public stamps on mount and return { stamps, loading, error }.
 */
export function useStamps(limit: number) {
	const [stamps, setStamps] = useState<Stamp[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function load() {
			try {
				setError(null);
				const r = await fetch(`/api/stamps?limit=${limit}`);
				const data = (await r.json()) as { stamps?: Stamp[]; error?: string };
				if (!r.ok) {
					throw new Error(data.error ?? "Failed to fetch stamps");
				}
				setStamps(data.stamps ?? []);
			} catch (err) {
				console.error("Failed to fetch stamps:", err);
				setError(err instanceof Error ? err.message : "Failed to load stamps");
			} finally {
				setLoading(false);
			}
		}
		load();
	}, [limit]);

	return { stamps, setStamps, loading, error };
}
