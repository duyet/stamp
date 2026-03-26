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

	// Private cache only — credits are per-user, public/s-maxage would let CDN
	// serve User A's balance to User B on the same edge node.
	return NextResponse.json(credits, {
		headers: {
			"Cache-Control": "private, max-age=30, stale-while-revalidate=60",
		},
	});
}
