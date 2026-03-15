import Link from "next/link";
import { StampFan } from "@/components/stamp-fan";
import { EXAMPLE_PROMPTS } from "@/lib/stamp-prompts";

export default function HomePage() {
	return (
		<div className="max-w-5xl mx-auto px-4">
			{/* Hero */}
			<section className="py-20 text-center">
				{/* Stamp fan — stacked, expands on hover */}
				<div className="flex justify-center mb-10">
					<StampFan />
				</div>

				<h1 className="text-5xl md:text-7xl font-bold text-stone-800 tracking-tight">
					Stamps, builder
				</h1>
				<p className="mt-4 text-lg text-stone-500 max-w-xl mx-auto font-sans">
					Create unique postage stamps with AI. Describe your vision or upload a
					photo, and watch it transform into a beautiful vintage stamp.
				</p>
				<div className="mt-8 flex justify-center gap-4 font-sans">
					<Link
						href="/generate"
						className="px-8 py-3 bg-stamp-navy text-white rounded-lg font-medium text-lg hover:bg-stamp-blue transition"
					>
						Create a Stamp
					</Link>
					<Link
						href="/collections"
						className="px-8 py-3 bg-white/60 text-stone-700 rounded-lg font-medium text-lg border border-stone-300 hover:bg-white transition"
					>
						Browse Collection
					</Link>
				</div>
			</section>

			{/* How it works */}
			<section className="py-16 border-t border-stone-200/50">
				<h2 className="text-3xl font-bold text-stone-800 text-center mb-12">
					How it works
				</h2>
				<div className="grid md:grid-cols-3 gap-8 font-sans">
					<div className="text-center">
						<div className="text-4xl mb-4">✍️</div>
						<h3 className="text-lg font-semibold text-stone-800 mb-2">
							1. Describe
						</h3>
						<p className="text-stone-500">
							Write a prompt or upload a photo of what you want on your stamp.
						</p>
					</div>
					<div className="text-center">
						<div className="text-4xl mb-4">🎨</div>
						<h3 className="text-lg font-semibold text-stone-800 mb-2">
							2. Generate
						</h3>
						<p className="text-stone-500">
							AI creates a unique stamp illustration in your chosen style.
						</p>
					</div>
					<div className="text-center">
						<div className="text-4xl mb-4">📬</div>
						<h3 className="text-lg font-semibold text-stone-800 mb-2">
							3. Share
						</h3>
						<p className="text-stone-500">
							Download your stamp or share it in the public collection.
						</p>
					</div>
				</div>
			</section>

			{/* Example prompts */}
			<section className="py-16 border-t border-stone-200/50">
				<h2 className="text-3xl font-bold text-stone-800 text-center mb-8">
					Get inspired
				</h2>
				<div className="flex flex-wrap justify-center gap-3 font-sans">
					{EXAMPLE_PROMPTS.map((prompt) => (
						<Link
							key={prompt}
							href={`/generate?prompt=${encodeURIComponent(prompt)}`}
							className="px-4 py-2 bg-white/60 text-stone-600 rounded-full border border-stone-200 hover:bg-white hover:border-stone-300 transition text-sm"
						>
							{prompt}
						</Link>
					))}
				</div>
			</section>

			{/* Free tier info */}
			<section className="py-16 border-t border-stone-200/50 text-center font-sans">
				<h2 className="text-3xl font-bold text-stone-800 mb-4">
					Free to start
				</h2>
				<p className="text-stone-500 max-w-md mx-auto">
					Generate up to 5 stamps per day for free. No account needed. Sign up
					later to unlock more generations.
				</p>
			</section>
		</div>
	);
}
