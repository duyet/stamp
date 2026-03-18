import Link from "next/link";

export default function NotFound() {
	return (
		<div className="max-w-md mx-auto px-4 py-20 text-center">
			{/* Stamp illustration */}
			<div className="mb-8 relative inline-block">
				<div className="w-32 h-32 mx-auto relative">
					{/* Outer stamp border */}
					<div className="absolute inset-0 border-4 border-dashed border-stone-300 dark:border-stone-700 rounded-lg transform rotate-3" />
					{/* Inner stamp content */}
					<div className="absolute inset-2 bg-stone-100 dark:bg-stone-800 rounded flex items-center justify-center">
						<span
							className="text-6xl font-bold text-stone-300 dark:text-stone-700"
							style={{ fontFamily: "var(--font-stamp)" }}
						>
							404
						</span>
					</div>
					{/* Decorative perforation dots */}
					<div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-stone-200 dark:bg-stone-800 rounded-full" />
					<div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-stone-200 dark:bg-stone-800 rounded-full" />
					<div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-stone-200 dark:bg-stone-800 rounded-full" />
					<div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-stone-200 dark:bg-stone-800 rounded-full" />
				</div>
				{/* Cancelled stamp effect */}
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="w-28 h-1 bg-red-400 dark:bg-red-600 rotate-[-30deg] rounded" />
				</div>
			</div>

			<h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-100 mb-3">
				Page not found
			</h2>
			<p className="text-stone-600 dark:text-stone-400 text-sm mb-6">
				This page got lost in the mail. Let's get you back on track.
			</p>
			<Link
				href="/"
				className="px-6 py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full hover:bg-stone-800 dark:hover:bg-stone-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 text-sm font-medium inline-flex items-center gap-2 button-shine-effect"
			>
				<span>← Back to home</span>
			</Link>
		</div>
	);
}
