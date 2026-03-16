"use client";

import { Show, SignInButton } from "@clerk/nextjs";
import { DashboardContent } from "@/components/dashboard-content";

export function DashboardPageClient() {
	return (
		<div className="max-w-4xl mx-auto px-6 py-20">
			<div className="mb-12">
				<h1
					className="text-2xl font-semibold text-stamp-navy"
					style={{ fontFamily: "var(--font-stamp)" }}
				>
					Dashboard
				</h1>
				<p className="text-stone-500 mt-2 text-sm">
					stamp.builders — internal analytics
				</p>
			</div>
			<Show when="signed-in">
				<DashboardContent />
			</Show>
			<Show when="signed-out">
				<div className="text-center py-16">
					<p className="text-stone-600 text-sm mb-4">
						Sign in to view analytics
					</p>
					<SignInButton>
						<button
							type="button"
							className="px-4 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-700 transition-colors"
						>
							Sign in
						</button>
					</SignInButton>
				</div>
			</Show>
		</div>
	);
}
