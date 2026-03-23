import Link from "next/link";

export function Footer() {
	return (
		<footer className="border-t border-gray-200 mt-auto">
			<div className="max-w-5xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
				<nav className="flex items-center justify-center gap-6 mb-4">
					<Link href="/generate" className="hover:text-gray-900 transition">
						Create
					</Link>
					<Link href="/collections" className="hover:text-gray-900 transition">
						Collections
					</Link>
					<Link href="/privacy" className="hover:text-gray-900 transition">
						Privacy
					</Link>
					<Link href="/terms" className="hover:text-gray-900 transition">
						Terms
					</Link>
				</nav>
				<a
					href="https://stamp.duyet.net"
					className="hover:text-gray-700 transition"
					style={{ fontFamily: "var(--font-stamp, Georgia, serif)" }}
				>
					stamp.builders
				</a>
			</div>
		</footer>
	);
}
