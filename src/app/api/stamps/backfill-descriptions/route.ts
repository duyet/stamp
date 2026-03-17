import { eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { stamps } from "@/db/schema";
import { getEnv } from "@/lib/env";
import { generateDescription } from "@/lib/generate-stamp";

export async function POST() {
	try {
		const env = getEnv();
		const db = getDb();

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

		// Process sequentially to avoid overwhelming the AI binding
		for (const stamp of stampsWithoutDescription) {
			try {
				const description = await generateDescription(
					ai,
					stamp.prompt,
					stamp.enhancedPrompt || stamp.prompt,
				);

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
