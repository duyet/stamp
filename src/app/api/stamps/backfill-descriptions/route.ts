import { eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { stamps } from "@/db/schema";
import { getAuthUserId } from "@/lib/clerk";
import { getEnv } from "@/lib/env";
import { capitalize } from "@/lib/text-utils";

export async function POST(request: NextRequest) {
	try {
		const env = getEnv();
		const db = getDb();

		// Require authentication
		const { userId } = await getAuthUserId(request.headers);
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Check if user is admin (can be configured via wrangler.toml or environment variables)
		// In development, allow all authenticated users for testing
		const ADMIN_USER_IDS: string[] =
			(env.ADMIN_USER_IDS as string | undefined)?.split(",").filter(Boolean) ||
			[];
		const isAdmin =
			ADMIN_USER_IDS.length === 0 || ADMIN_USER_IDS.includes(userId);
		if (!isAdmin) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const ai = env.AI;
		if (!ai) {
			return NextResponse.json(
				{ error: "AI binding not configured." },
				{ status: 503 },
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

		return NextResponse.json({ updated, total });
	} catch (error) {
		console.error("Backfill descriptions failed:", error);
		return NextResponse.json(
			{ error: "Failed to backfill descriptions." },
			{ status: 500 },
		);
	}
}
