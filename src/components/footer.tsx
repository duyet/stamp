import Link from "next/link";

export function Footer() {
	return (
		<footer className="mt-auto bg-stone-50">
			<div className="max-w-5xl mx-auto px-6 py-16">
				<nav className="flex items-center justify-center gap-10 text-sm mb-10">
					<Link
						href="/generate"
						className="text-stone-600 hover:text-stone-800 transition-colors link-hover-underline"
					>
						Create
					</Link>
					<Link
						href="/collections"
						className="text-stone-600 hover:text-stone-800 transition-colors link-hover-underline"
					>
						Collections
					</Link>
					<Link
						href="/pricing"
						className="text-stone-600 hover:text-stone-800 transition-colors link-hover-underline"
					>
						Pricing
					</Link>
				</nav>
				<nav className="flex items-center justify-center gap-6 text-xs text-stone-400 mb-6">
					<Link
						href="/privacy"
						className="hover:text-stone-600 transition-colors link-hover-underline"
					>
						Privacy
					</Link>
					<Link
						href="/terms"
						className="hover:text-stone-600 transition-colors link-hover-underline"
					>
						Terms
					</Link>
				</nav>
				<div className="text-center">
					<a
						href="https://stamp.duyet.net"
						className="text-sm text-stone-600 hover:text-stone-800 transition-colors link-hover-underline"
						style={{ fontFamily: "var(--font-stamp)" }}
					>
						stamp.builders
					</a>
					<p className="text-xs text-stone-500 mt-3 mb-1">
						Built on Cloudflare
					</p>
					<p className="text-xs text-stone-400">
						Made with creativity by the community
					</p>
				</div>
			</div>
		</footer>
	);
}
