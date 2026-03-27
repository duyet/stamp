import { createFileRoute } from "@tanstack/react-router";
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
		<div className="max-w-6xl mx-auto px-6 py-20">
			<div className="mb-12">
				<h1 className="text-3xl font-semibold text-stamp-navy font-stamp">
					Dashboard
				</h1>
				<p className="text-stone-500 mt-2 text-sm">
					stamp.builders — analytics &amp; insights
				</p>
			</div>
			<DashboardContentMemo />
			<RecentStampsSection />
		</div>
	);
}
