import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

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
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
			>
				<Header />
				<main className="flex-1">{children}</main>
				<Footer />
			</body>
		</html>
	);
}
