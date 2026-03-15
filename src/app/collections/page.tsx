import type { Metadata } from "next";
import { StampGrid } from "@/components/stamp-grid";

export const metadata: Metadata = {
	title: "Collections — stamp.builders",
	description:
		"Browse AI-generated postage stamps created by the community. Vintage folk art style illustrations.",
	openGraph: {
		title: "Stamp Collections — stamp.builders",
		description: "Browse AI-generated postage stamps created by the community",
		url: "https://stamp.builders/collections",
	},
};

export default function CollectionsPage() {
	return (
		<div className="max-w-5xl mx-auto px-6 py-20">
			<div className="mb-12">
				<h1
					className="text-2xl font-semibold text-stamp-navy"
					style={{ fontFamily: "var(--font-stamp)" }}
				>
					Collections
				</h1>
				<p className="mt-2 text-sm text-neutral-400">
					Stamps created by the community
				</p>
			</div>
			<StampGrid />
		</div>
	);
}
