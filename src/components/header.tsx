"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function Header() {
	return (
		<header className="bg-white sticky top-0 z-50 border-b border-gray-200">
			<nav className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
				<Link
					href="/"
					className="text-base text-black shrink-0"
					style={{ fontFamily: "var(--font-stamp, Georgia, serif)" }}
				>
					stamp.builders
				</Link>
				<div className="flex items-center gap-3 sm:gap-6 text-sm">
					<Link
						href="/generate"
						className="text-gray-600 hover:text-black transition-colors"
					>
						Create
					</Link>
					<Link
						href="/collections"
						className="text-gray-600 hover:text-black transition-colors"
					>
						Collections
					</Link>
					<Show when="signed-out">
						<SignInButton mode="modal">
							<button
								type="button"
								className="text-gray-600 hover:text-black transition-colors"
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
