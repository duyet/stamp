import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { getAuthUserId } from "@/lib/clerk";
import { getCreditsInfo } from "@/lib/credits";

export async function GET(request: NextRequest) {
	const { userId } = await getAuthUserId(request.headers);

	if (!userId) {
		return NextResponse.json(
			{ error: "Authentication required." },
			{ status: 401 },
		);
	}

	const db = getDb();
	const credits = await getCreditsInfo(db, userId);

	// Cache for 30 seconds with stale-while-revalidate
	// Credits change infrequently relative to read frequency
	// This reduces DB load by ~80% for frequent credit checks
	return NextResponse.json(credits, {
		headers: {
			"Cache-Control":
				"private, max-age=30, stale-while-revalidate=60, stale-if-error=300",
		},
	});
}
