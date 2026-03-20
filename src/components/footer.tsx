import Link from "next/link";

export function Footer() {
	return (
		<footer className="mt-auto bg-gradient-to-b from-stone-50 to-stone-100 border-t border-stone-200/50">
			{/* Decorative stamp pattern */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
				<div className="absolute top-4 left-10 w-16 h-16 rounded-full border-4 border-current" />
				<div className="absolute top-4 right-10 w-16 h-16 rounded-full border-4 border-current" />
				<div className="absolute bottom-4 left-1/4 w-12 h-12 rounded-full border-4 border-current" />
				<div className="absolute bottom-4 right-1/4 w-12 h-12 rounded-full border-4 border-current" />
			</div>

			<div className="max-w-5xl mx-auto px-6 py-16 relative">
				<nav className="flex items-center justify-center gap-10 text-sm mb-10">
					<Link
						href="/generate"
						className="text-stone-600 hover:text-stone-800 transition-all duration-200 font-medium relative group"
					>
						Create
						<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current group-hover:w-full transition-all duration-300" />
					</Link>
					<Link
						href="/collections"
						className="text-stone-600 hover:text-stone-800 transition-all duration-200 font-medium relative group"
					>
						Collections
						<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current group-hover:w-full transition-all duration-300" />
					</Link>
					<Link
						href="/pricing"
						className="text-stone-600 hover:text-stone-800 transition-all duration-200 font-medium relative group"
					>
						Pricing
						<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current group-hover:w-full transition-all duration-300" />
					</Link>
				</nav>
				<nav className="flex items-center justify-center gap-6 text-xs text-stone-400 mb-6">
					<Link
						href="/privacy"
						className="hover:text-stone-600 transition-all duration-200 relative group"
					>
						Privacy
						<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current group-hover:w-full transition-all duration-300" />
					</Link>
					<Link
						href="/terms"
						className="hover:text-stone-600 transition-all duration-200 relative group"
					>
						Terms
						<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current group-hover:w-full transition-all duration-300" />
					</Link>
				</nav>
				<div className="text-center">
					<a
						href="https://stamp.duyet.net"
						className="text-base text-stone-700 hover:text-stone-900 transition-all duration-200 font-semibold relative group inline-block"
						style={{ fontFamily: "var(--font-stamp)" }}
					>
						<span className="relative">
							stamp.builders
							<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-stamp-blue group-hover:w-full transition-all duration-300" />
						</span>
					</a>
					<p className="text-xs text-stone-500 mt-4 mb-2 font-medium">
						🚀 Built on Cloudflare
					</p>
					<p className="text-xs text-stone-400">
						Made with creativity by the community ✨
					</p>
				</div>
			</div>
		</footer>
	);
}
