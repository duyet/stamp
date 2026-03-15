import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { stamps } from "@/db/schema";

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const db = getDb();

		const body = (await request.json()) as { isPublic: boolean };

		await db
			.update(stamps)
			.set({ isPublic: body.isPublic })
			.where(eq(stamps.id, id));

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("Failed to update visibility:", error);
		return NextResponse.json({ error: "Failed to update." }, { status: 500 });
	}
}
