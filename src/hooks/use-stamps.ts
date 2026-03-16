"use client";

import { useEffect, useState } from "react";
import type { Stamp } from "@/db/schema";

/**
 * Fetch public stamps on mount and return { stamps, loading }.
 */
export function useStamps(limit: number) {
	const [stamps, setStamps] = useState<Stamp[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function load() {
			try {
				const r = await fetch(`/api/stamps?limit=${limit}`);
				const data = (await r.json()) as { stamps?: Stamp[] };
				setStamps(data.stamps ?? []);
			} catch {
			} finally {
				setLoading(false);
			}
		}
		load();
	}, [limit]);

	return { stamps, setStamps, loading };
}
