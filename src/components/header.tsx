import Link from "next/link";

export function Header() {
	return (
		<header className="border-b border-stone-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
			<nav className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
				<Link href="/" className="flex items-center gap-2">
					<span className="text-2xl">📮</span>
					<span className="text-xl font-bold text-stone-800">
						stamp.builder
					</span>
				</Link>
				<div className="flex items-center gap-6 font-sans text-sm">
					<Link
						href="/generate"
						className="text-stone-600 hover:text-stone-900 transition"
					>
						Create
					</Link>
					<Link
						href="/pricing"
						className="text-stamp-green font-medium hover:text-stamp-green/80 transition"
					>
						Free
					</Link>
					<Link
						href="/collections"
						className="text-stone-600 hover:text-stone-900 transition"
					>
						Collections
					</Link>
				</div>
			</nav>
		</header>
	);
}
