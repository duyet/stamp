import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Footer } from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
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
	metadataBase: new URL("https://stamp.duyet.net"),
	openGraph: {
		title: "stamp.builders — AI Stamp Generator",
		description:
			"Create unique vintage postage stamps with AI. Free, no account needed.",
		url: "https://stamp.duyet.net",
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
		canonical: "https://stamp.duyet.net",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased min-h-screen flex flex-col`}
			>
				<ClerkProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						<a
							href="#main-content"
							className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-stone-900 dark:focus:bg-stone-100 focus:text-white dark:focus:text-stone-900 focus:rounded-lg focus:shadow-lg"
						>
							Skip to main content
						</a>
						<main id="main-content" className="flex-1" tabIndex={-1}>
							{children}
						</main>
						<Footer />
					</ThemeProvider>
				</ClerkProvider>
			</body>
		</html>
	);
}
