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
			<h2 className="text-2xl font-semibold text-stone-900 mb-3">
				Something went wrong
			</h2>
			<p className="text-stone-600 text-sm mb-6">
				{error.message || "An unexpected error occurred."}
			</p>
			<button
				type="button"
				onClick={reset}
				className="px-5 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition text-sm"
			>
				Try again
			</button>
		</div>
	);
}
