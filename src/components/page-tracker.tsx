"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useTrack } from "@/hooks/use-track";

export function PageTracker() {
	const pathname = usePathname();
	const { track } = useTrack();

	useEffect(() => {
		// Track page view with referrer for traffic source analysis
		track("page_view", {
			path: pathname,
			referrer: document.referrer || null,
		});
	}, [pathname, track]);

	// This component doesn't render anything
	return null;
}
