import {
	Show,
	SignInButton,
	SignUpButton,
	UserButton,
} from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";
import { CreditBalance } from "@/components/credit-balance";
import { getClerkPublishableKey } from "@/lib/clerk-config";

export function Header() {
	const clerkPublishableKey = getClerkPublishableKey();

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
					{clerkPublishableKey ? (
						<>
							<Show when="signed-out">
								<SignUpButton mode="modal">
									<button
										type="button"
										className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-stone-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-400 hover:text-stone-950 sm:px-4 sm:py-2"
									>
										Sign up
									</button>
								</SignUpButton>
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
								<CreditBalance />
								<UserButton
									appearance={{
										elements: {
											avatarBox:
												"h-9 w-9 rounded-full border border-stone-200 shadow-none",
										},
									}}
								/>
							</Show>
						</>
					) : (
						<button
							type="button"
							disabled
							className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-stone-400 sm:px-4 sm:py-2"
							title="Clerk is not configured in this environment"
						>
							Sign in
						</button>
					)}
				</div>
			</nav>
		</header>
	);
}
