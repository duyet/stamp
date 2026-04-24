import { Link } from "@tanstack/react-router";

export function Footer() {
	return (
		<footer className="mt-auto">
			<div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between text-[11px] text-stone-400">
				<a
					href="https://stamp.duyet.net"
					className="font-stamp hover:text-stone-700 transition-colors"
				>
					stamp.duyet.net
				</a>
				<nav className="flex items-center gap-4">
					<Link
						to="/privacy"
						className="hover:text-stone-700 transition-colors"
					>
						Privacy
					</Link>
					<Link to="/terms" className="hover:text-stone-700 transition-colors">
						Terms
					</Link>
				</nav>
			</div>
		</footer>
	);
}
