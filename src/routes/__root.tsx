import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRoute,
} from "@tanstack/react-router";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import appCss from "@/app/globals.css?url";

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
});

function RootComponent() {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body className="antialiased min-h-screen flex flex-col font-[var(--font-serif,Georgia,serif)]">
				<Header />
				<main className="flex-1">
					<Outlet />
				</main>
				<Footer />
				<Scripts />
			</body>
		</html>
	);
}
