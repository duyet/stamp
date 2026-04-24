import { Show, SignInButton, UserButton } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";

export function Header() {
	return (
		<header className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
			<nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 bg-[rgba(251,247,239,0.62)] px-1 py-2 backdrop-blur-md">
				<Link to="/" className="min-w-0 shrink-0 text-stone-950">
					<span className="block font-stamp text-lg leading-none tracking-tight">
						stamp.builders
					</span>
					<span className="mt-1 hidden text-[10px] uppercase tracking-[0.28em] text-stone-500 sm:block">
						Prompted postage atelier
					</span>
				</Link>
				<div className="flex items-center gap-3 text-sm sm:gap-5">
					<Link
						to="/generate"
						className="text-stone-600 transition-colors hover:text-stone-950"
					>
						Create
					</Link>
					<Link
						to="/collections"
						className="hidden text-stone-600 transition-colors hover:text-stone-950 sm:inline-flex"
					>
						Collections
					</Link>
					<Show when="signed-out">
						<SignInButton mode="modal">
							<button
								type="button"
								className="rounded-full bg-white/70 px-4 py-2 text-stone-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-stone-950"
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
