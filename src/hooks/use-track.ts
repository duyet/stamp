import { useCallback } from "react";

interface TrackMetadata {
	[key: string]: string | number | boolean | undefined | null;
}

export function useTrack() {
	const trackEvent = useCallback(
		async (event: string, metadata?: TrackMetadata) => {
			try {
				await fetch("/api/track", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ event, metadata }),
				});
			} catch (error) {
				// Silently fail - tracking shouldn't break UX
				console.error("Track event failed:", error);
			}
		},
		[],
	);

	return { trackEvent };
}
