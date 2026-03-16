import Link from "next/link";

export function Header() {
	return (
		<header className="border-b border-neutral-200 bg-white sticky top-0 z-50">
			<nav className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
				<Link
					href="/"
					className="text-base font-medium text-neutral-900 shrink-0"
				>
					stamp.builders
				</Link>
				<div className="flex items-center gap-3 sm:gap-6 text-sm">
					<Link
						href="/generate"
						className="text-neutral-500 hover:text-neutral-900 transition-colors hidden sm:block"
					>
						Create
					</Link>
					<Link
						href="/pricing"
						className="text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-1.5"
					>
						<span className="hidden sm:inline">Pricing</span>
						<span className="text-xs font-medium bg-stamp-green/15 text-stamp-green px-1.5 py-0.5 rounded-full">
							Free
						</span>
					</Link>
					<Link
						href="/collections"
						className="text-neutral-500 hover:text-neutral-900 transition-colors"
					>
						Collections
					</Link>
				</div>
			</nav>
		</header>
	);
}
