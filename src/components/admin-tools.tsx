import { useAuth } from "@clerk/tanstack-react-start";
import { useState } from "react";

export function AdminTools() {
	const { isSignedIn } = useAuth();
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<string | null>(null);

	if (!isSignedIn) return null;

	async function runBackfill() {
		setLoading(true);
		setResult(null);
		try {
			const res = await fetch("/api/stamps/backfill-descriptions", {
				method: "POST",
			});
			const data = await res.json();
			if (res.ok) {
				setResult(`Updated ${data.updated}/${data.total} stamps`);
			} else {
				setResult(`Error: ${data.error}`);
			}
		} catch {
			setResult("Request failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<section className="mt-10 rounded-[1.4rem] border border-stone-200 bg-white p-6">
			<h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
				Admin tools
			</h2>
			<div className="mt-4 flex items-center gap-4">
				<button
					type="button"
					onClick={runBackfill}
					disabled={loading}
					className="rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-stone-800 disabled:opacity-50"
				>
					{loading ? "Running..." : "Backfill descriptions"}
				</button>
				{result && <span className="text-sm text-stone-600">{result}</span>}
			</div>
		</section>
	);
}
