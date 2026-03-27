import { Link } from "@tanstack/react-router";

export function Footer() {
	return (
		<footer className="border-t border-gray-200 mt-auto">
			<div className="max-w-5xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
				<nav className="flex items-center justify-center gap-6 mb-4">
					<Link to="/generate" className="hover:text-gray-900 transition">
						Create
					</Link>
					<Link to="/collections" className="hover:text-gray-900 transition">
						Collections
					</Link>
					<Link to="/privacy" className="hover:text-gray-900 transition">
						Privacy
					</Link>
					<Link to="/terms" className="hover:text-gray-900 transition">
						Terms
					</Link>
				</nav>
				<a
					href="https://stamp.duyet.net"
					className="hover:text-gray-700 transition font-stamp"
				>
					stamp.builders
				</a>
			</div>
		</footer>
	);
}
