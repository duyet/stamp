import type { Metadata } from "next";
import { DashboardContent } from "@/components/dashboard-content";

export const metadata: Metadata = {
	title: "Dashboard — stamp.builders",
};

export default function DashboardPage() {
	return (
		<div className="max-w-4xl mx-auto px-6 py-20">
			<div className="mb-12">
				<h1
					className="text-2xl font-semibold text-stamp-navy"
					style={{ fontFamily: "var(--font-stamp)" }}
				>
					Dashboard
				</h1>
				<p className="text-neutral-400 mt-2 text-sm">
					stamp.builders — internal analytics
				</p>
			</div>
			<DashboardContent />
		</div>
	);
}
