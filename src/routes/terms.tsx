import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
	head: () => ({
		meta: [
			{ title: "Terms of Service — stamp.builders" },
			{
				name: "description",
				content: "Terms governing your use of stamp.builders.",
			},
			{
				property: "og:title",
				content: "Terms of Service — stamp.builders",
			},
			{
				property: "og:description",
				content: "Terms governing your use of stamp.builders.",
			},
			{ property: "og:url", content: "https://stamp.duyet.net/terms" },
		],
	}),
	component: TermsPage,
});

function TermsPage() {
	return (
		<div className="max-w-3xl mx-auto px-6 py-20">
			<h1
				className="text-3xl font-bold text-stamp-navy tracking-tight mb-2"
				style={{ fontFamily: "var(--font-stamp)" }}
			>
				Terms of Service
			</h1>
			<p className="text-sm text-stone-500 mb-10">
				Last updated: March 17, 2026
			</p>

			<div className="prose-sm text-stone-700 space-y-8 leading-relaxed">
				<section>
					<h2 className="text-lg font-semibold text-stamp-navy mb-2">
						The service
					</h2>
					<p>
						stamp.builders is an AI-powered stamp illustration generator. You
						provide a text prompt or reference image, and we generate a stamp
						illustration using Cloudflare Workers AI. The service is provided
						as-is, free of charge for personal use.
					</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold text-stamp-navy mb-2">
						Your content
					</h2>
					<ul className="list-disc pl-5 space-y-1">
						<li>
							<strong>Prompts</strong> — you own your text prompts. We store
							them to generate and display your stamps.
						</li>
						<li>
							<strong>Generated stamps</strong> — stamps are AI-generated
							outputs. You may use them for personal, non-commercial purposes.
							We make no copyright claims on generated images.
						</li>
						<li>
							<strong>Public stamps</strong> — stamps marked as public are
							visible in the collections gallery. You can toggle visibility at
							any time.
						</li>
						<li>
							<strong>Reference images</strong> — uploaded reference photos are
							used only to generate descriptions for stamp creation. They are
							automatically deleted after 7 days.
						</li>
					</ul>
				</section>

				<section>
					<h2 className="text-lg font-semibold text-stamp-navy mb-2">
						Acceptable use
					</h2>
					<p>You agree not to:</p>
					<ul className="list-disc pl-5 space-y-1 mt-2">
						<li>
							Generate content that is illegal, harmful, hateful, or sexually
							explicit.
						</li>
						<li>
							Attempt to bypass rate limits, abuse the API, or disrupt the
							service.
						</li>
						<li>
							Use automated tools to bulk-generate stamps beyond the rate
							limits.
						</li>
						<li>Upload reference images you do not have the right to use.</li>
						<li>
							Impersonate others or use the service for deceptive purposes.
						</li>
					</ul>
					<p className="mt-2">
						We reserve the right to remove content or restrict accounts that
						violate these terms.
					</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold text-stamp-navy mb-2">
						Rate limits and credits
					</h2>
					<ul className="list-disc pl-5 space-y-1">
						<li>Anonymous users: 20 generations per day per IP address.</li>
						<li>
							Signed-in users: 100 free credits per day, resetting every 24
							hours.
						</li>
						<li>HD generation costs 5 credits per stamp.</li>
						<li>Purchased credits do not expire but are non-refundable.</li>
					</ul>
				</section>

				<section>
					<h2 className="text-lg font-semibold text-stamp-navy mb-2">
						Data retention
					</h2>
					<p>
						We retain your data as described in our{" "}
						<Link
							to="/privacy"
							className="underline underline-offset-2 hover:text-stamp-navy transition"
						>
							Privacy Policy
						</Link>
						. Key retention periods:
					</p>
					<ul className="list-disc pl-5 space-y-1 mt-2">
						<li>
							Generated stamps and prompts: kept until you request deletion.
						</li>
						<li>
							Reference image uploads: automatically deleted after 7 days.
						</li>
						<li>IP addresses and location data: anonymized after 90 days.</li>
						<li>Usage events: deleted after 1 year.</li>
					</ul>
					<p className="mt-2">
						You may request deletion of your data at any time by emailing{" "}
						<a
							href="mailto:hello@stamp.builders"
							className="underline underline-offset-2 hover:text-stamp-navy transition"
						>
							hello@stamp.builders
						</a>
						.
					</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold text-stamp-navy mb-2">
						Disclaimers
					</h2>
					<ul className="list-disc pl-5 space-y-1">
						<li>
							The service is provided &quot;as is&quot; without warranty of any
							kind.
						</li>
						<li>
							AI-generated images may not match your expectations. Generation
							quality varies.
						</li>
						<li>
							We may modify, suspend, or discontinue the service at any time.
						</li>
						<li>
							We are not liable for any damages arising from your use of the
							service.
						</li>
					</ul>
				</section>

				<section>
					<h2 className="text-lg font-semibold text-stamp-navy mb-2">
						Changes to these terms
					</h2>
					<p>
						We may update these terms from time to time. Changes will be posted
						on this page with an updated date. Continued use of the service
						after changes constitutes acceptance.
					</p>
				</section>
			</div>

			<div className="mt-12 pt-8 border-t border-stone-200 text-sm text-stone-500">
				See also:{" "}
				<Link
					to="/privacy"
					className="underline underline-offset-2 hover:text-stamp-navy transition"
				>
					Privacy Policy
				</Link>
			</div>
		</div>
	);
}
