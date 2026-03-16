"use client";

// biome-ignore lint/suspicious/noShadowRestrictedNames: Next.js error page convention
export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="max-w-md mx-auto px-4 py-20 text-center">
			<h2 className="text-2xl font-semibold text-neutral-900 mb-3">
				Something went wrong
			</h2>
			<p className="text-neutral-500 text-sm mb-6">
				{error.message || "An unexpected error occurred."}
			</p>
			<button
				type="button"
				onClick={reset}
				className="px-5 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition text-sm"
			>
				Try again
			</button>
		</div>
	);
}
