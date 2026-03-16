"use client";

import { PageTracker } from "./page-tracker";

export function LayoutClient({ children }: { children: React.ReactNode }) {
	return (
		<>
			{children}
			<PageTracker />
		</>
	);
}
