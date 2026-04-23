import { Show, SignInButton, UserButton } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";

export function Header() {
	return (
		<header className="sticky top-0 z-50 px-3 pt-3 sm:px-4">
			<nav className="mx-auto flex max-w-6xl items-center justify-between rounded-full bg-[rgba(252,248,242,0.78)] px-4 py-3 shadow-[0_12px_30px_-28px_rgba(63,43,20,0.55)] backdrop-blur-md sm:px-5">
				<Link
					to="/"
					className="shrink-0 text-base text-stone-950 font-stamp tracking-tight"
				>
					stamp.builders
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
								className="rounded-full bg-white/90 px-4 py-2 text-stone-700 transition-all duration-200 hover:-translate-y-0.5 hover:text-stone-950"
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
