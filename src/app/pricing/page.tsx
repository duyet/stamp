import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Pricing — stamp.builder",
	description:
		"Generate AI stamps for free. 5 stamps per day, all styles included.",
	openGraph: {
		title: "Pricing — stamp.builder",
		description: "Generate AI stamps for free. 5 stamps per day.",
		url: "https://stamp.builder/pricing",
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

function CheckIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			className="w-5 h-5 shrink-0"
			aria-hidden="true"
		>
			<path
				fillRule="evenodd"
				d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
				clipRule="evenodd"
			/>
		</svg>
	);
}

export default function PricingPage() {
	return (
		<div className="max-w-5xl mx-auto px-4 py-16 font-sans">
			<div className="text-center mb-12">
				<h1 className="text-4xl font-bold text-stone-800 font-serif mb-3">
					Simple, honest pricing
				</h1>
				<p className="text-stone-500 text-lg max-w-md mx-auto">
					Start creating stamps for free. No account needed.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
				{/* Free card */}
				<div className="bg-white rounded-2xl border border-stone-200 overflow-hidden flex flex-col">
					<div className="h-1.5 bg-stamp-navy" />
					<div className="p-8 flex flex-col flex-1">
						<div className="flex items-start justify-between mb-1">
							<h2 className="text-xl font-bold text-stone-800 font-serif">
								Free
							</h2>
							<span className="text-xs font-semibold bg-stamp-green/15 text-stamp-green px-2.5 py-1 rounded-full">
								Current Plan
							</span>
						</div>
						<div className="mb-6">
							<span className="text-4xl font-bold text-stone-800">$0</span>
							<span className="text-stone-400 text-sm ml-1">/ month</span>
						</div>
						<ul className="space-y-3 mb-8 flex-1">
							{freeFeatures.map((feature) => (
								<li
									key={feature}
									className="flex items-center gap-3 text-sm text-stone-600"
								>
									<span className="text-stamp-green">
										<CheckIcon />
									</span>
									{feature}
								</li>
							))}
						</ul>
						<Link
							href="/"
							className="block text-center bg-stamp-navy text-white rounded-lg py-2.5 px-4 text-sm font-medium hover:bg-stamp-navy/90 transition"
						>
							Start Creating
						</Link>
					</div>
				</div>

				{/* Pro card */}
				<div className="relative bg-stone-100 rounded-2xl border border-stone-200 overflow-hidden flex flex-col">
					<div className="h-1.5 bg-stamp-blue" />
					{/* Coming soon overlay */}
					<div className="absolute inset-0 top-1.5 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-b-2xl">
						<span className="text-xs font-semibold bg-stone-200 text-stone-500 px-3 py-1.5 rounded-full tracking-wide uppercase">
							Coming Soon
						</span>
					</div>
					<div className="p-8 flex flex-col flex-1">
						<div className="flex items-start justify-between mb-1">
							<h2 className="text-xl font-bold text-stone-400 font-serif">
								Pro
							</h2>
						</div>
						<div className="mb-6">
							<span className="text-4xl font-bold text-stone-400">$5</span>
							<span className="text-stone-400 text-sm ml-1">/ month</span>
						</div>
						<ul className="space-y-3 mb-8 flex-1">
							{proFeatures.map((feature) => (
								<li
									key={feature}
									className="flex items-center gap-3 text-sm text-stone-400"
								>
									<span className="text-stone-300">
										<CheckIcon />
									</span>
									{feature}
								</li>
							))}
						</ul>
						<button
							type="button"
							disabled
							className="block w-full text-center bg-stone-300 text-stone-400 rounded-lg py-2.5 px-4 text-sm font-medium cursor-not-allowed"
						>
							Coming Soon
						</button>
					</div>
				</div>
			</div>

			<p className="text-center text-stone-400 text-sm mt-10">
				Questions?{" "}
				<a
					href="mailto:hello@stamp.builder"
					className="text-stamp-blue hover:underline"
				>
					Get in touch
				</a>
			</p>
		</div>
	);
}
