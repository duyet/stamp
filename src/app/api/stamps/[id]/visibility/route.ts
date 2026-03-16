import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { stamps } from "@/db/schema";
import { getClientIp } from "@/lib/get-client-ip";

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const db = getDb();

		// Validate ID format (nanoid 12 chars)
		if (!id || id.length !== 12) {
			return NextResponse.json({ error: "Invalid stamp ID" }, { status: 400 });
		}

		const body = (await request.json()) as { isPublic: unknown };

		if (typeof body.isPublic !== "boolean") {
			return NextResponse.json(
				{ error: "isPublic must be a boolean" },
				{ status: 400 },
			);
		}

		// Verify the stamp exists and the requester is the creator (by IP)
		const userIp = getClientIp(request.headers, null);

		const stamp = await db.query.stamps.findFirst({
			where: eq(stamps.id, id),
		});

		if (!stamp) {
			return NextResponse.json({ error: "Stamp not found" }, { status: 404 });
		}

		// Only the creator (same IP) can toggle visibility
		if (stamp.userIp && userIp && stamp.userIp !== userIp) {
			return NextResponse.json({ error: "Not authorized" }, { status: 403 });
		}

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
