import type { Metadata } from "next";
import {
	DashboardContentMemo,
	RecentStampsSection,
} from "@/components/dashboard-content";

export const metadata: Metadata = {
	title: "Dashboard — stamp.builders",
};

export default function DashboardPage() {
	return (
		<div className="max-w-6xl mx-auto px-6 py-20">
			<div className="mb-12">
				<h1
					className="text-3xl font-semibold text-stamp-navy"
					style={{ fontFamily: "var(--font-stamp)" }}
				>
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
