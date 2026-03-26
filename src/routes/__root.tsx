import { ClerkProvider } from "@clerk/tanstack-react-start";
import {
	createRootRoute,
	HeadContent,
	Link,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import appCss from "@/app/globals.css?url";
import { Button } from "@/components/button";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{
				title: "stamp.builders — AI Stamp Generator",
			},
			{
				name: "description",
				content:
					"Create unique vintage postage stamps with AI. Describe your vision and get beautiful folk art stamp illustrations. Free, no account needed.",
			},
			{
				property: "og:title",
				content: "stamp.builders — AI Stamp Generator",
			},
			{
				property: "og:description",
				content:
					"Create unique vintage postage stamps with AI. Free, no account needed.",
			},
			{ property: "og:url", content: "https://stamp.duyet.net" },
			{ property: "og:site_name", content: "stamp.builders" },
			{ property: "og:type", content: "website" },
			{ property: "og:locale", content: "en_US" },
			{ name: "twitter:card", content: "summary_large_image" },
			{
				name: "twitter:title",
				content: "stamp.builders — AI Stamp Generator",
			},
			{
				name: "twitter:description",
				content: "Create unique vintage postage stamps with AI.",
			},
			{ name: "robots", content: "index, follow" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "canonical", href: "https://stamp.duyet.net" },
		],
	}),
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent,
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body className="antialiased min-h-screen flex flex-col font-[var(--font-serif,Georgia,serif)]">
				<ClerkProvider>{children}</ClerkProvider>
				<Scripts />
			</body>
		</html>
	);
}

function RootComponent() {
	return (
		<>
			<Header />
			<main className="flex-1">
				<Outlet />
			</main>
			<Footer />
		</>
	);
}

function NotFoundComponent() {
	return (
		<div className="max-w-md mx-auto px-4 py-20 text-center">
			{/* Stamp illustration */}
			<div className="mb-8 relative inline-block">
				<div className="w-32 h-32 mx-auto relative">
					{/* Outer stamp border */}
					<div className="absolute inset-0 border-4 border-dashed border-stone-300 rounded-lg transform rotate-3" />
					{/* Inner stamp content */}
					<div className="absolute inset-2 bg-stone-100 rounded flex items-center justify-center">
						<span
							className="text-6xl font-bold text-stone-300"
							style={{ fontFamily: "var(--font-stamp)" }}
						>
							404
						</span>
					</div>
					{/* Decorative perforation dots */}
					<div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-stone-200 rounded-full" />
					<div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-stone-200 rounded-full" />
					<div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-stone-200 rounded-full" />
					<div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-stone-200 rounded-full" />
				</div>
				{/* Cancelled stamp effect */}
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="w-28 h-1 bg-red-400 rotate-[-30deg] rounded" />
				</div>
			</div>

			<h2 className="text-2xl font-semibold text-stone-900 mb-3">
				Page not found
			</h2>
			<p className="text-stone-600 text-sm mb-6">
				This page got lost in the mail. Let's get you back on track.
			</p>
			<Link
				to="/"
				className="px-6 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 text-sm font-medium inline-flex items-center gap-2 button-shine-effect"
			>
				<span>&larr; Back to home</span>
			</Link>
		</div>
	);
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
	console.error("Error boundary caught:", error);

	return (
		<div className="min-h-screen flex items-center justify-center px-4">
			<div className="text-center max-w-md">
				<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-stone-100 mb-6 shadow-sm text-stone-400">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={1.5}
						className="w-10 h-10"
						aria-hidden="true"
					>
						<rect x="3" y="3" width="18" height="18" rx="2" />
						<circle cx="8" cy="8" r="1.5" />
						<circle cx="16" cy="8" r="1.5" />
					</svg>
				</div>
				<h2 className="text-2xl font-semibold text-stone-900 mb-3">
					Something went wrong
				</h2>
				<p className="text-stone-600 text-base mb-8">
					An unexpected error occurred. Please try again.
				</p>
				<div className="flex flex-col sm:flex-row gap-3 justify-center">
					<Button onClick={reset}>Try again</Button>
					<Link
						to="/"
						className="inline-flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all duration-200"
					>
						Go home
					</Link>
				</div>
			</div>
		</div>
	);
}
