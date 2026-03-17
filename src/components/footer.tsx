import Link from "next/link";

export function Footer() {
	return (
		<footer className="mt-auto bg-stone-50">
			<div className="max-w-5xl mx-auto px-6 py-16">
				<nav className="flex items-center justify-center gap-10 text-sm mb-10">
					<Link
						href="/generate"
						className="text-stone-600 hover:text-stone-800 transition-colors"
					>
						Create
					</Link>
					<Link
						href="/collections"
						className="text-stone-600 hover:text-stone-800 transition-colors"
					>
						Collections
					</Link>
					<Link
						href="/pricing"
						className="text-stone-600 hover:text-stone-800 transition-colors"
					>
						Pricing
					</Link>
				</nav>
				<div className="text-center">
					<a
						href="https://stamp.duyet.net"
						className="text-sm text-stone-600 hover:text-stone-800 transition-colors"
						style={{ fontFamily: "var(--font-stamp)" }}
					>
						stamp.builders
					</a>
					<p className="text-xs text-stone-500 mt-3">Built on Cloudflare</p>
				</div>
			</div>
		</footer>
	);
}
