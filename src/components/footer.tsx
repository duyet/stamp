import { Link } from "@tanstack/react-router";

export function Footer() {
	return (
		<footer className="mt-auto px-4 pb-6 pt-2 sm:px-6">
			<div className="mx-auto max-w-6xl rounded-[2rem] border border-stone-300/70 bg-[linear-gradient(180deg,rgba(255,252,247,0.92),rgba(244,237,226,0.95))] px-6 py-8 text-sm text-stone-600 shadow-[0_18px_50px_-44px_rgba(64,43,22,0.6)]">
				<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
					<div className="max-w-md">
						<p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
							stamp.builders
						</p>
						<p className="mt-3 font-stamp text-2xl text-stone-950">
							A tiny studio for turning prompts into collectible-looking postage
							art.
						</p>
					</div>
					<nav className="flex flex-wrap items-center gap-x-6 gap-y-3">
						<Link to="/generate" className="transition hover:text-stone-950">
							Create
						</Link>
						<Link to="/collections" className="transition hover:text-stone-950">
							Collections
						</Link>
						<Link to="/privacy" className="transition hover:text-stone-950">
							Privacy
						</Link>
						<Link to="/terms" className="transition hover:text-stone-950">
							Terms
						</Link>
					</nav>
				</div>
				<div className="mt-6 flex flex-col gap-2 border-t border-stone-200 pt-5 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
					<p>
						Built for quick experiments, souvenirs, and gallery-worthy oddities.
					</p>
					<a
						href="https://stamp.duyet.net"
						className="transition hover:text-stone-700 font-stamp"
					>
						stamp.duyet.net
					</a>
				</div>
			</div>
		</footer>
	);
}
