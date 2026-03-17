"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function Header() {
	return (
		<header className="bg-white/80 backdrop-blur-sm sticky top-0 z-50 border-b border-stone-100">
			<nav className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
				<Link
					href="/"
					className="text-base font-medium text-stone-900 shrink-0"
				>
					stamp.builders
				</Link>
				<div className="flex items-center gap-3 sm:gap-6 text-sm">
					<Link
						href="/generate"
						className="text-stone-600 hover:text-stone-900 transition-colors hidden sm:block"
					>
						Create
					</Link>
					<Link
						href="/pricing"
						className="text-stone-600 hover:text-stone-900 transition-colors flex items-center gap-1.5"
					>
						<span className="hidden sm:inline">Pricing</span>
						<span className="text-xs font-medium bg-stamp-green/15 text-stamp-green px-1.5 py-0.5 rounded-full">
							Free
						</span>
					</Link>
					<Link
						href="/collections"
						className="text-stone-600 hover:text-stone-900 transition-colors"
					>
						Collections
					</Link>
					<Show when="signed-out">
						<SignInButton mode="modal">
							<button
								type="button"
								className="text-stone-600 hover:text-stone-900 transition-colors"
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
