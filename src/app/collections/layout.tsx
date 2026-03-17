import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Collections — stamp.builders",
	description:
		"Browse AI-generated postage stamps created by the community. Vintage folk art style illustrations.",
	openGraph: {
		title: "Stamp Collections — stamp.builders",
		description: "Browse AI-generated postage stamps created by the community",
		url: "https://stamp.duyet.net/collections",
	},
};

export default function CollectionsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
