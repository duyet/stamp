import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Footer } from "@/components/footer";
import { LayoutClient } from "@/components/layout-client";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const playfair = Playfair_Display({
	variable: "--font-serif",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
	title: {
		default: "stamp.builders — AI Stamp Generator",
		template: "%s — stamp.builders",
	},
	description:
		"Create unique vintage postage stamps with AI. Describe your vision and get beautiful folk art stamp illustrations. Free, no account needed.",
	metadataBase: new URL("https://stamp.builders"),
	openGraph: {
		title: "stamp.builders — AI Stamp Generator",
		description:
			"Create unique vintage postage stamps with AI. Free, no account needed.",
		url: "https://stamp.builders",
		siteName: "stamp.builders",
		type: "website",
		locale: "en_US",
	},
	twitter: {
		card: "summary_large_image",
		title: "stamp.builders — AI Stamp Generator",
		description: "Create unique vintage postage stamps with AI.",
	},
	robots: {
		index: true,
		follow: true,
	},
	alternates: {
		canonical: "https://stamp.builders",
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
				className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased min-h-screen flex flex-col`}
			>
				<ClerkProvider>
					<LayoutClient>
						<main className="flex-1">{children}</main>
						<Footer />
					</LayoutClient>
				</ClerkProvider>
			</body>
		</html>
	);
}
