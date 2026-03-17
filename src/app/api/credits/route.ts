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

	return NextResponse.json(credits);
}
