"use client";

import Link from "next/link";
import { Button } from "@/components/button";

// biome-ignore lint/suspicious/noShadowRestrictedNames: Next.js error page convention
export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	console.error("Error boundary caught:", error);

	return (
		<div className="min-h-screen flex items-center justify-center px-4">
			<div className="text-center max-w-md">
				<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-stone-100 mb-6 shadow-sm text-stone-400">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={1.5}
						className="w-10 h-10"
						aria-hidden="true"
					>
						<rect x="3" y="3" width="18" height="18" rx="2" />
						<circle cx="8" cy="8" r="1.5" />
						<circle cx="16" cy="8" r="1.5" />
					</svg>
				</div>
				<h2 className="text-2xl font-semibold text-stone-900 mb-3">
					Something went wrong
				</h2>
				<p className="text-stone-600 text-base mb-8">
					An unexpected error occurred. Please try again.
				</p>
				<div className="flex flex-col sm:flex-row gap-3 justify-center">
					<Button onClick={reset}>Try again</Button>
					<Link
						href="/"
						className="inline-flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all duration-200"
					>
						Go home
					</Link>
				</div>
				{error.digest && (
					<p className="text-xs text-stone-500 mt-6">
						Error code: {error.digest}
					</p>
				)}
			</div>
		</div>
	);
}
