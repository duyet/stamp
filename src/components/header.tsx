import { Show, SignInButton, UserButton } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";

export function Header() {
	return (
		<header className="px-4 pt-4 sm:px-6">
			<nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-1 py-3 sm:px-0">
				<Link to="/" className="min-w-0 shrink-0 text-stone-950">
					<span className="block font-stamp text-base leading-none tracking-tight sm:text-lg">
						stamp.builders
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
								className="rounded-full bg-stone-950 px-3 py-1.5 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-stone-800 sm:px-4 sm:py-2"
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
