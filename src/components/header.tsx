import { Show, SignInButton, UserButton } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";

export function Header() {
	return (
		<header className="sticky top-0 z-50 bg-white">
			<nav className="max-w-4xl mx-auto px-6 h-12 flex items-center justify-between">
				<Link
					to="/"
					className="text-[13px] tracking-wide text-stone-900 font-stamp"
				>
					stamp
				</Link>
				<div className="flex items-center gap-5 text-[12px] text-stone-500">
					<Link
						to="/generate"
						className="hover:text-stone-900 transition-colors"
					>
						Create
					</Link>
					<Link
						to="/collections"
						className="hover:text-stone-900 transition-colors"
					>
						Collection
					</Link>
					<Show when="signed-out">
						<SignInButton mode="modal">
							<button
								type="button"
								className="hover:text-stone-900 transition-colors"
							>
								Sign in
							</button>
						</SignInButton>
					</Show>
					<Show when="signed-in">
						<UserButton
							appearance={{ elements: { userButtonAvatarBox: "w-6 h-6" } }}
						/>
					</Show>
				</div>
			</nav>
		</header>
	);
}
