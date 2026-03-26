import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "@/db";
import { withSecurityHeaders } from "@/lib/api-utils";
import { getEnv } from "@/lib/env";

export const Route = createFileRoute("/api/health")({
	server: {
		handlers: {
			GET: async () => {
				const results = { d1: false, r2: false, ai: false };

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
					const env = getEnv();
					const bucket = env.STAMPS_BUCKET as unknown as R2Bucket;
					await bucket.list({ limit: 1 });
					results.r2 = true;
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

				const allOk = results.d1 && results.r2 && results.ai;

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
