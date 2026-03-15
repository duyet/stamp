import type { Metadata } from "next";
import { DashboardContent } from "@/components/dashboard-content";

export const metadata: Metadata = {
	title: "Dashboard — stamp.builders",
};

export default function DashboardPage() {
	return (
		<div className="max-w-4xl mx-auto px-4 py-12">
			<div className="mb-10">
				<h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
				<p className="text-neutral-500 mt-1 text-sm">
					stamp.builders — internal analytics
				</p>
			</div>
			<DashboardContent />
		</div>
	);
}
