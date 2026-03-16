"use client";

import { useCallback } from "react";
import type { EventType } from "@/app/api/track/route";

type Metadata = Record<string, unknown>;

export function useTrack() {
	const track = useCallback(async (event: EventType, metadata?: Metadata) => {
		// Only track in production
		if (process.env.NODE_ENV !== "production") {
			return;
		}

		// Fire-and-forget tracking
		fetch("/api/track", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ event, metadata }),
		}).catch((error) => {
			// Silent fail - don't block UI
			console.error("Track failed:", error);
		});
	}, []);

	return { track };
}
