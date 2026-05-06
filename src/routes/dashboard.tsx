import { createFileRoute } from "@tanstack/react-router";
import { AdminTools } from "@/components/admin-tools";
import {
	DashboardContentMemo,
	RecentStampsSection,
} from "@/components/dashboard-content";

export const Route = createFileRoute("/dashboard")({
	head: () => ({
		meta: [{ title: "Dashboard — stamp.builders" }],
	}),
	component: DashboardPage,
});

function DashboardPage() {
	return (
		<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
			<div className="mb-10 flex flex-col gap-4 border-b border-stone-300 pb-8 md:flex-row md:items-end md:justify-between">
				<div>
					<p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
						stamp.builders
					</p>
					<h1 className="font-stamp text-4xl font-semibold text-stamp-navy sm:text-5xl">
						Operations dashboard
					</h1>
				</div>
				<p className="max-w-md text-sm leading-6 text-stone-600">
					Generation health, audience activity, Cloudflare AI usage, and public
					collection signals in one console.
				</p>
			</div>
			<DashboardContentMemo />
			<RecentStampsSection />
			<AdminTools />
		</div>
	);
}
