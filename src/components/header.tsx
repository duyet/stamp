import { Show, SignInButton, UserButton } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";

export function Header() {
	return (
		<header className="px-4 pt-4 sm:px-6">
			<nav className="paper-panel paper-grid mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-[1.75rem] px-4 py-3 sm:px-5">
				<Link to="/" className="min-w-0 shrink-0 text-stone-950">
					<span className="block font-stamp text-base leading-none tracking-tight sm:text-lg">
						stamp.builders
					</span>
					<span className="mt-1 hidden text-[10px] uppercase tracking-[0.24em] text-stone-500 sm:block">
						Public wall and studio
					</span>
				</Link>
				<div className="flex items-center gap-2 text-xs sm:gap-4 sm:text-sm">
					<Link
						to="/collections"
						className="inline-flex text-stone-600 transition-colors hover:text-stone-950"
					>
						Collections
					</Link>
					<Link
						to="/generate"
						className="inline-flex text-stone-600 transition-colors hover:text-stone-950"
					>
						Create
					</Link>
					<Show when="signed-out">
						<SignInButton mode="modal">
							<button
								type="button"
								className="rounded-full border border-stone-300 bg-white/80 px-3 py-1.5 text-stone-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-400 hover:bg-white hover:text-stone-950 sm:px-4 sm:py-2"
							>
								Sign in
							</button>
						</SignInButton>
					</Show>
					<Show when="signed-in">
						<UserButton />
					</Show>
				</div>
			</nav>
		</header>
	);
}
