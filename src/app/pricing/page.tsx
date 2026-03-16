import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Pricing — stamp.builders",
	description:
		"Generate AI stamps for free. 100 credits per day with an account, 20 without signing in.",
	openGraph: {
		title: "Pricing — stamp.builders",
		description:
			"Generate AI stamps for free. 100 credits per day with an account.",
		url: "https://stamp.builders/pricing",
	},
};

const freeFeatures = [
	"100 credits per day",
	"All 5 styles available",
	"Public collection sharing",
	"Download stamps",
	"Free account required",
];

const proFeatures = [
	"Buy credits as needed",
	"Credits never expire",
	"Priority generation",
	"Private stamps",
	"High-resolution downloads",
];

export default function PricingPage() {
	return (
		<div className="max-w-5xl mx-auto px-6 py-20">
			<div className="text-center mb-16">
				<h1
					className="text-4xl font-bold text-stamp-navy tracking-tight mb-4"
					style={{ fontFamily: "var(--font-stamp)" }}
				>
					Simple, honest pricing
				</h1>
				<p className="text-stone-600 text-base max-w-md mx-auto">
					Start creating stamps for free. 20 stamps per day without an account,
					100 with one.
				</p>
			</div>

			<div className="bg-stone-100 rounded-2xl p-6 sm:p-10 max-w-3xl mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Free card */}
					<div className="bg-white rounded-2xl p-6 sm:p-8 flex flex-col">
						<div className="flex items-start justify-between mb-2">
							<h2
								className="text-lg font-semibold text-stamp-navy"
								style={{ fontFamily: "var(--font-stamp)" }}
							>
								Free
							</h2>
							<span className="text-xs font-medium bg-stamp-green/10 text-stamp-green px-2.5 py-1 rounded-full">
								Current Plan
							</span>
						</div>
						<div className="mb-8">
							<span className="text-5xl font-bold text-stamp-navy">$0</span>
							<span className="text-stone-500 text-sm ml-2">/ month</span>
						</div>
						<ul className="space-y-4 mb-10 flex-1">
							{freeFeatures.map((feature) => (
								<li
									key={feature}
									className="flex items-center gap-3 text-sm text-stone-700"
								>
									<span className="text-stamp-green text-base leading-none">
										&#10003;
									</span>
									{feature}
								</li>
							))}
						</ul>
						<p className="text-xs text-stone-500 mb-6">
							No account? You still get 20 stamps per day.
						</p>
						<Link
							href="/"
							className="block text-center bg-stamp-navy text-white rounded-xl py-3 px-6 text-sm font-medium hover:bg-stone-800 transition"
						>
							Start Creating
						</Link>
					</div>

					{/* Pro card */}
					<div className="relative bg-stone-200/60 rounded-2xl overflow-hidden flex flex-col">
						{/* Coming soon overlay */}
						<div className="absolute inset-0 bg-stone-100/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
							<span className="text-xs font-medium bg-white text-stone-500 px-3 py-1.5 rounded-full tracking-wide uppercase">
								Coming Soon
							</span>
						</div>
						<div className="p-6 sm:p-8 flex flex-col flex-1">
							<div className="flex items-start justify-between mb-2">
								<h2 className="text-lg font-semibold text-stone-400">Pro</h2>
							</div>
							<div className="mb-8">
								<span className="text-5xl font-bold text-stone-300">$5</span>
								<span className="text-stone-300 text-sm ml-2">
									/ 500 credits
								</span>
							</div>
							<ul className="space-y-4 mb-10 flex-1">
								{proFeatures.map((feature) => (
									<li
										key={feature}
										className="flex items-center gap-3 text-sm text-stone-300"
									>
										<span className="text-stone-300 text-base leading-none">
											&#10003;
										</span>
										{feature}
									</li>
								))}
							</ul>
							<button
								type="button"
								disabled
								className="block w-full text-center bg-stone-300 text-stone-400 rounded-xl py-3 px-6 text-sm font-medium cursor-not-allowed"
							>
								Coming Soon
							</button>
						</div>
					</div>
				</div>
			</div>

			<p className="text-center text-stone-600 text-sm mt-14">
				Questions?{" "}
				<a
					href="mailto:hello@stamp.builders"
					className="text-stone-600 hover:text-stamp-navy transition underline underline-offset-2"
				>
					Get in touch
				</a>
			</p>
		</div>
	);
}
