import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
	head: () => ({
		meta: [
			{ title: "Privacy Policy — stamp.builders" },
			{
				name: "description",
				content: "How stamp.builders collects, uses, and retains your data.",
			},
			{
				property: "og:title",
				content: "Privacy Policy — stamp.builders",
			},
			{
				property: "og:description",
				content: "How stamp.builders collects, uses, and retains your data.",
			},
			{ property: "og:url", content: "https://stamp.duyet.net/privacy" },
		],
	}),
	component: PrivacyPage,
});

function PrivacyPage() {
	return (
		<div className="max-w-3xl mx-auto px-6 py-20">
			<h1
				className="text-3xl font-bold text-stamp-navy tracking-tight mb-2"
				style={{ fontFamily: "var(--font-stamp)" }}
			>
				Privacy Policy
			</h1>
			<p className="text-sm text-stone-500 mb-10">
				Last updated: March 17, 2026
			</p>

			<div className="prose-sm text-stone-700 space-y-8 leading-relaxed">
				<section>
					<h2 className="text-lg font-semibold text-stamp-navy mb-2">
						What we collect
					</h2>
					<p>When you use stamp.builders, we collect:</p>
					<ul className="list-disc pl-5 space-y-1 mt-2">
						<li>
							<strong>Prompts and generated images</strong> — the text you enter
							and the stamps we create for you.
						</li>
						<li>
							<strong>Account info</strong> — if you sign in via Clerk, we
							receive your user ID. We do not access your email or password.
						</li>
						<li>
							<strong>IP address and approximate location</strong> — provided by
							Cloudflare headers (country, city, coordinates). Used for rate
							limiting and aggregate analytics.
						</li>
						<li>
							<strong>Browser metadata</strong> — user agent, referrer, and
							timezone. Used for debugging and analytics.
						</li>
						<li>
							<strong>Usage events</strong> — page views, downloads, shares, and
							generation counts. No personal identifiers beyond IP.
						</li>
					</ul>
				</section>

				<section>
					<h2 className="text-lg font-semibold text-stamp-navy mb-2">
						How we use your data
					</h2>
					<ul className="list-disc pl-5 space-y-1">
						<li>Generate stamps based on your prompts.</li>
						<li>Enforce rate limits and prevent abuse.</li>
						<li>
							Show aggregate analytics (style popularity, generation counts by
							region). We never expose individual user data publicly.
						</li>
						<li>Improve the service (prompt quality, model selection).</li>
					</ul>
				</section>

				<section>
					<h2 className="text-lg font-semibold text-stamp-navy mb-2">
						Data retention
					</h2>
					<div className="bg-stone-50 rounded-lg p-4 space-y-3 text-sm">
						<div className="flex justify-between border-b border-stone-200 pb-2">
							<span className="font-medium">Generated stamps & prompts</span>
							<span>Kept indefinitely (or until you request deletion)</span>
						</div>
						<div className="flex justify-between border-b border-stone-200 pb-2">
							<span className="font-medium">Reference images (uploads)</span>
							<span>Deleted after 7 days</span>
						</div>
						<div className="flex justify-between border-b border-stone-200 pb-2">
							<span className="font-medium">IP addresses & location</span>
							<span>Retained for 90 days, then anonymized</span>
						</div>
						<div className="flex justify-between border-b border-stone-200 pb-2">
							<span className="font-medium">Rate limit records</span>
							<span>Rolling 24-hour window, auto-expired</span>
						</div>
						<div className="flex justify-between border-b border-stone-200 pb-2">
							<span className="font-medium">Usage events</span>
							<span>Retained for 1 year, then deleted</span>
						</div>
						<div className="flex justify-between">
							<span className="font-medium">Credit transactions</span>
							<span>Kept for the lifetime of your account</span>
						</div>
					</div>
				</section>

				<section>
					<h2 className="text-lg font-semibold text-stamp-navy mb-2">
						Third-party services
					</h2>
					<ul className="list-disc pl-5 space-y-1">
						<li>
							<strong>Cloudflare</strong> — hosting, CDN, Workers AI, R2
							storage, D1 database. Subject to{" "}
							<a
								href="https://www.cloudflare.com/privacypolicy/"
								className="underline underline-offset-2 hover:text-stamp-navy transition"
								target="_blank"
								rel="noopener noreferrer"
							>
								Cloudflare&apos;s Privacy Policy
							</a>
							.
						</li>
						<li>
							<strong>Clerk</strong> — authentication. Subject to{" "}
							<a
								href="https://clerk.com/legal/privacy"
								className="underline underline-offset-2 hover:text-stamp-navy transition"
								target="_blank"
								rel="noopener noreferrer"
							>
								Clerk&apos;s Privacy Policy
							</a>
							.
						</li>
					</ul>
					<p className="mt-2">
						We do not sell your data to any third party. We do not use
						advertising trackers or cookies beyond what Clerk requires for
						authentication.
					</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold text-stamp-navy mb-2">
						Your rights
					</h2>
					<p>You can request to:</p>
					<ul className="list-disc pl-5 space-y-1 mt-2">
						<li>
							<strong>Delete your data</strong> — we will remove your stamps,
							prompts, and associated metadata.
						</li>
						<li>
							<strong>Export your data</strong> — receive a copy of your stamps
							and prompts.
						</li>
						<li>
							<strong>Make stamps private</strong> — toggle visibility on any
							stamp you created.
						</li>
					</ul>
					<p className="mt-2">
						Contact{" "}
						<a
							href="mailto:hello@stamp.builders"
							className="underline underline-offset-2 hover:text-stamp-navy transition"
						>
							hello@stamp.builders
						</a>{" "}
						for any data requests.
					</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold text-stamp-navy mb-2">
						Changes to this policy
					</h2>
					<p>
						We may update this policy from time to time. Changes will be posted
						on this page with an updated date. Continued use of the service
						after changes constitutes acceptance.
					</p>
				</section>
			</div>

			<div className="mt-12 pt-8 border-t border-stone-200 text-sm text-stone-500">
				See also:{" "}
				<Link
					to="/terms"
					className="underline underline-offset-2 hover:text-stamp-navy transition"
				>
					Terms of Service
				</Link>
			</div>
		</div>
	);
}
