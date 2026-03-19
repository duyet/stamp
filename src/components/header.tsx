"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
	return (
		<header className="bg-white/85 dark:bg-stone-900/85 backdrop-blur-md sticky top-0 z-50 border-b border-stone-100 dark:border-stone-800 supports-[backdrop-filter]:bg-white/75 supports-[backdrop-filter]:dark:bg-stone-900/75">
			<nav className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
				<Link
					href="/"
					className="text-base font-medium text-stone-900 dark:text-stone-100 shrink-0"
				>
					stamp.builders
				</Link>
				<div className="flex items-center gap-2 sm:gap-6 text-sm">
					<Link
						href="/generate"
						className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors link-hover-underline text-xs sm:text-sm"
					>
						Create
					</Link>
					<Link
						href="/pricing"
						className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors flex items-center gap-1.5 link-hover-underline"
					>
						<span className="hidden sm:inline">Pricing</span>
						<span className="text-xs font-medium bg-stamp-green/15 text-stamp-green px-1.5 py-0.5 rounded-full">
							Free
						</span>
					</Link>
					<Link
						href="/collections"
						className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors link-hover-underline hidden sm:block"
					>
						Collections
					</Link>
					<ThemeToggle />
					<Show when="signed-out">
						<SignInButton mode="modal">
							<button
								type="button"
								className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors link-hover-underline hidden sm:block"
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
