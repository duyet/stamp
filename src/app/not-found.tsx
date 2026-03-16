import Link from "next/link";

export default function NotFound() {
	return (
		<div className="max-w-md mx-auto px-4 py-20 text-center">
			<h2 className="text-2xl font-semibold text-neutral-900 mb-3">
				Page not found
			</h2>
			<p className="text-neutral-500 text-sm mb-6">
				The page you're looking for doesn't exist.
			</p>
			<Link
				href="/"
				className="px-5 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition text-sm inline-block"
			>
				Back to home
			</Link>
		</div>
	);
}
