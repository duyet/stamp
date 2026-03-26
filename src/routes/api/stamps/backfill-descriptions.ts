import { createFileRoute } from "@tanstack/react-router";
import { eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { stamps } from "@/db/schema";
import { withSecurityHeaders } from "@/lib/api-utils";
import { isAdmin } from "@/lib/auth";
import { getAuthUserId } from "@/lib/clerk";
import { getEnv } from "@/lib/env";
import { capitalize } from "@/lib/text-utils";

function jsonResponse(data: unknown, status = 200): Response {
	return withSecurityHeaders(
		new Response(JSON.stringify(data), {
			status,
			headers: { "Content-Type": "application/json" },
		}),
	);
}

export async function POST(_request: Request): Promise<Response> {
	try {
		const env = getEnv();
		const db = getDb();

		// Require authentication
		const { userId } = await getAuthUserId();
		if (!userId) {
			return jsonResponse({ error: "Unauthorized" }, 401);
		}

		// Fail-closed admin check: no admin list configured = 403
		if (!isAdmin(userId)) {
			return jsonResponse({ error: "Forbidden" }, 403);
		}

		const ai = env.AI;
		if (!ai) {
			return jsonResponse({ error: "AI binding not configured." }, 503);
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

		return jsonResponse({ updated, total });
	} catch (error) {
		console.error("Backfill descriptions failed:", error);
		return jsonResponse({ error: "Failed to backfill descriptions." }, 500);
	}
}

export const Route = createFileRoute("/api/stamps/backfill-descriptions")({
	server: {
		handlers: {
			POST: ({ request }) => POST(request),
		},
	},
});
