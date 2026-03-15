import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import "./globals.css";

export const metadata: Metadata = {
	title: "stamp.builder — AI Stamp Generator",
	description:
		"Create unique postage stamps with AI. Upload photos or describe your vision, and get beautiful vintage-style stamp illustrations.",
	openGraph: {
		title: "stamp.builder",
		description: "Create unique postage stamps with AI",
		url: "https://stamp.builder",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className="min-h-screen flex flex-col">
				<Header />
				<main className="flex-1">{children}</main>
				<Footer />
			</body>
		</html>
	);
}
