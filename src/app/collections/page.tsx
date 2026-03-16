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
			<div className="text-center mb-12">
				<h1
					className="text-4xl font-bold text-stamp-navy tracking-tight mb-3"
					style={{ fontFamily: "var(--font-stamp)" }}
				>
					Collections
				</h1>
				<p className="text-stone-500">Stamps created by the community</p>
			</div>
			<div className="bg-stone-100 rounded-2xl p-4 sm:p-6">
				<StampGrid />
			</div>
		</div>
	);
}
