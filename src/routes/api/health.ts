import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "@/db";
import { withSecurityHeaders } from "@/lib/api-utils";
import { getEnv } from "@/lib/env";
import { getStampsBucket } from "@/lib/stamps-bucket";

export const Route = createFileRoute("/api/health")({
	server: {
		handlers: {
			GET: async () => {
				// r2 is null when the binding is intentionally absent, which is a
				// configured state rather than a failure.
				const results: { d1: boolean; r2: boolean | null; ai: boolean } = {
					d1: false,
					r2: false,
					ai: false,
				};

				try {
					// D1: run a simple SELECT 1
					const db = getDb();
					await db.$client.prepare("SELECT 1 as ok").first<{ ok: number }>();
					results.d1 = true;
				} catch (err) {
					console.error("[Health] D1 check failed:", err);
				}

				try {
					// R2: list bucket (limit 1 to keep it cheap)
					const bucket = getStampsBucket();
					if (bucket) {
						await bucket.list({ limit: 1 });
						results.r2 = true;
					} else {
						results.r2 = null;
					}
				} catch (err) {
					console.error("[Health] R2 check failed:", err);
				}

				try {
					// AI: verify binding is accessible
					const env = getEnv();
					results.ai = !!env.AI;
				} catch (err) {
					console.error("[Health] AI check failed:", err);
				}

				// A null r2 means "not configured", not "broken".
				const allOk = results.d1 && results.r2 !== false && results.ai;

				return withSecurityHeaders(
					new Response(
						JSON.stringify({
							status: allOk ? "ok" : "degraded",
							...results,
						}),
						{
							status: allOk ? 200 : 503,
							headers: {
								"Content-Type": "application/json",
								"Cache-Control": "no-store",
							},
						},
					),
				);
			},
		},
	},
});
