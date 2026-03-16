import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { getCreditsInfo } from "@/lib/credits";

export async function GET() {
	const { userId } = await auth();

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
