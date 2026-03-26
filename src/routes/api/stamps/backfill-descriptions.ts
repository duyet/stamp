import { createFileRoute } from "@tanstack/react-router";
import { eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { stamps } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { getAuthUserId } from "@/lib/clerk";
import { getEnv } from "@/lib/env";
import { capitalize } from "@/lib/text-utils";

export async function POST(request: Request): Promise<Response> {
	try {
		const env = getEnv();
		const db = getDb();

		// Require authentication
		const { userId } = await getAuthUserId(request.headers);
		if (!userId) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Fail-closed admin check: no admin list configured = 403
		if (!isAdmin(userId)) {
			return new Response(JSON.stringify({ error: "Forbidden" }), {
				status: 403,
				headers: { "Content-Type": "application/json" },
			});
		}

		const ai = env.AI;
		if (!ai) {
			return new Response(
				JSON.stringify({ error: "AI binding not configured." }),
				{
					status: 503,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const stampsWithoutDescription = await db
			.select({
				id: stamps.id,
				prompt: stamps.prompt,
				enhancedPrompt: stamps.enhancedPrompt,
			})
			.from(stamps)
			.where(isNull(stamps.description));

		const total = stampsWithoutDescription.length;
		let updated = 0;

		// Process in batches to avoid timeout
		const BATCH_SIZE = 10;
		for (let i = 0; i < stampsWithoutDescription.length; i += BATCH_SIZE) {
			const batch = stampsWithoutDescription.slice(i, i + BATCH_SIZE);

			await Promise.all(
				batch.map(async (stamp) => {
					try {
						// Simple description from prompt (no AI call needed)
						const description = capitalize(stamp.prompt) || "Custom stamp";

						await db
							.update(stamps)
							.set({ description })
							.where(eq(stamps.id, stamp.id));

						updated++;
					} catch (err) {
						console.error(
							`Failed to generate description for stamp ${stamp.id}:`,
							err,
						);
					}
				}),
			);
		}

		return new Response(JSON.stringify({ updated, total }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Backfill descriptions failed:", error);
		return new Response(
			JSON.stringify({ error: "Failed to backfill descriptions." }),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}

export const Route = createFileRoute("/api/stamps/backfill-descriptions")({
	server: {
		handlers: {
			POST: ({ request }) => POST(request),
		},
	},
});
