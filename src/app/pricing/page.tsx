import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Pricing — stamp.builders",
	description:
		"Generate AI stamps for free. 5 stamps per day, all styles included.",
	openGraph: {
		title: "Pricing — stamp.builders",
		description: "Generate AI stamps for free. 5 stamps per day.",
		url: "https://stamp.builders/pricing",
	},
};

const freeFeatures = [
	"5 stamps per day",
	"All 5 styles available",
	"Public collection sharing",
	"Download stamps",
	"No account required",
];

const proFeatures = [
	"Unlimited stamps",
	"Priority generation",
	"Private stamps",
	"High-resolution downloads",
	"Custom style presets",
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
				<p className="text-neutral-400 text-base max-w-md mx-auto">
					Start creating stamps for free. No account needed.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
				{/* Free card */}
				<div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden flex flex-col">
					<div className="h-1 bg-stamp-navy" />
					<div className="p-6 sm:p-10 flex flex-col flex-1">
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
							<span className="text-neutral-400 text-sm ml-2">/ month</span>
						</div>
						<ul className="space-y-4 mb-10 flex-1">
							{freeFeatures.map((feature) => (
								<li
									key={feature}
									className="flex items-center gap-3 text-sm text-neutral-500"
								>
									<span className="text-stamp-green text-base leading-none">
										&#10003;
									</span>
									{feature}
								</li>
							))}
						</ul>
						<Link
							href="/"
							className="block text-center bg-stamp-navy text-white rounded-xl py-3 px-6 text-sm font-medium hover:bg-neutral-800 transition"
						>
							Start Creating
						</Link>
					</div>
				</div>

				{/* Pro card */}
				<div className="relative bg-neutral-50 rounded-2xl border border-neutral-200 overflow-hidden flex flex-col">
					<div className="h-1 bg-neutral-300" />
					{/* Coming soon overlay */}
					<div className="absolute inset-0 top-1 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-b-2xl">
						<span className="text-xs font-medium bg-neutral-100 text-neutral-500 px-3 py-1.5 rounded-full tracking-wide uppercase border border-neutral-200">
							Coming Soon
						</span>
					</div>
					<div className="p-6 sm:p-10 flex flex-col flex-1">
						<div className="flex items-start justify-between mb-2">
							<h2 className="text-lg font-semibold text-neutral-400">Pro</h2>
						</div>
						<div className="mb-8">
							<span className="text-5xl font-bold text-neutral-300">$5</span>
							<span className="text-neutral-300 text-sm ml-2">/ month</span>
						</div>
						<ul className="space-y-4 mb-10 flex-1">
							{proFeatures.map((feature) => (
								<li
									key={feature}
									className="flex items-center gap-3 text-sm text-neutral-300"
								>
									<span className="text-neutral-300 text-base leading-none">
										&#10003;
									</span>
									{feature}
								</li>
							))}
						</ul>
						<button
							type="button"
							disabled
							className="block w-full text-center bg-neutral-200 text-neutral-400 rounded-xl py-3 px-6 text-sm font-medium cursor-not-allowed"
						>
							Coming Soon
						</button>
					</div>
				</div>
			</div>

			<p className="text-center text-neutral-400 text-sm mt-14">
				Questions?{" "}
				<a
					href="mailto:hello@stamp.builders"
					className="text-neutral-500 hover:text-stamp-navy transition underline underline-offset-2"
				>
					Get in touch
				</a>
			</p>
		</div>
	);
}
