import Link from "next/link";

export function Header() {
	return (
		<header className="bg-white sticky top-0 z-50">
			<nav className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
				<Link
					href="/"
					className="text-lg font-semibold text-neutral-900 tracking-tight"
					style={{ fontFamily: "var(--font-serif)" }}
				>
					stamp.builders
				</Link>
				<div className="flex items-center gap-8 text-sm">
					<Link
						href="/generate"
						className="text-neutral-500 hover:text-neutral-900 transition-colors"
					>
						Create
					</Link>
					<Link
						href="/pricing"
						className="text-neutral-500 hover:text-neutral-900 transition-colors"
					>
						Free
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
