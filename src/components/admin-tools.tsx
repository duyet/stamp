import { useAuth } from "@clerk/tanstack-react-start";
import { useState } from "react";

interface ActionState {
	loading: boolean;
	result: string | null;
}

type ActionResponse = {
	updated?: number;
	total?: number;
	status?: "ok" | "degraded";
	error?: string;
};

export function AdminTools() {
	const { isSignedIn } = useAuth();
	const [actions, setActions] = useState<Record<string, ActionState>>({});

	if (!isSignedIn) return null;

	function setAction(key: string, update: Partial<ActionState>) {
		setActions((prev) => ({
			...prev,
			[key]: { ...prev[key], loading: false, result: null, ...update },
		}));
	}

	async function runAction(key: string, url: string, method: string = "POST") {
		setAction(key, { loading: true, result: null });
		try {
			const res = await fetch(url, { method });
			const data = (await res.json()) as ActionResponse;
			if (res.ok) {
				if (
					typeof data.updated === "number" &&
					typeof data.total === "number"
				) {
					setAction(key, {
						loading: false,
						result: `Updated ${data.updated}/${data.total} stamps`,
					});
					return;
				}

				if (data.status) {
					setAction(key, {
						loading: false,
						result: `Health: ${data.status}`,
					});
					return;
				}

				setAction(key, {
					loading: false,
					result: "Done",
				});
			} else {
				setAction(key, {
					loading: false,
					result: `Error: ${data.error ?? "Request failed"}`,
				});
			}
		} catch {
			setAction(key, { loading: false, result: "Request failed" });
		}
	}

	const tools = [
		{
			key: "backfill",
			label: "Backfill descriptions",
			description: "Generate artistic descriptions for stamps missing them",
			action: () => runAction("backfill", "/api/stamps/backfill-descriptions"),
		},
		{
			key: "health",
			label: "Health check",
			description: "Check system status (AI binding, DB)",
			action: () => runAction("health", "/api/health", "GET"),
		},
	];

	return (
		<section className="mt-10 rounded-[1.4rem] border border-stone-200 bg-white p-6">
			<h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
				Admin tools
			</h2>
			<div className="mt-4 space-y-3">
				{tools.map((tool) => (
					<div
						key={tool.key}
						className="flex items-center justify-between gap-4 rounded-xl border border-stone-100 px-4 py-3"
					>
						<div className="min-w-0">
							<p className="text-sm font-medium text-stone-800">{tool.label}</p>
							<p className="text-xs text-stone-500">{tool.description}</p>
						</div>
						<div className="flex shrink-0 items-center gap-3">
							{actions[tool.key]?.result && (
								<span className="text-xs text-stone-500">
									{actions[tool.key].result}
								</span>
							)}
							<button
								type="button"
								onClick={tool.action}
								disabled={actions[tool.key]?.loading}
								className="rounded-full bg-stone-950 px-3 py-1.5 text-xs font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-stone-800 disabled:opacity-50"
							>
								{actions[tool.key]?.loading ? "Running..." : "Run"}
							</button>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
