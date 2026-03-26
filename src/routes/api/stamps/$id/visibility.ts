import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { stamps } from "@/db/schema";
import { jsonResponse } from "@/lib/api-utils";
import { canModifyStamp } from "@/lib/auth";
import { getAuthUserId } from "@/lib/clerk";
import { getClientIp } from "@/lib/get-client-ip";

export async function PATCH(request: Request, id: string): Promise<Response> {
	try {
		const db = getDb();

		// Validate ID format (nanoid 12 chars)
		if (!id || id.length !== 12) {
			return jsonResponse({ error: "Invalid stamp ID" }, 400);
		}

		const body = (await request.json()) as { isPublic: unknown };

		if (typeof body.isPublic !== "boolean") {
			return jsonResponse({ error: "isPublic must be a boolean" }, 400);
		}

		// Get auth state (userId for logged-in users, IP for anonymous)
		const { userId } = await getAuthUserId();
		const userIp = getClientIp(request.headers, null);

		const stamp = await db.query.stamps.findFirst({
			where: eq(stamps.id, id),
		});

		if (!stamp) {
			return jsonResponse({ error: "Stamp not found" }, 404);
		}

		// Authorization: Only the creator can toggle visibility
		if (!canModifyStamp(stamp, { userId, userIp })) {
			return jsonResponse({ error: "Not authorized" }, 403);
		}

		// Use RETURNING clause to get updated stamp in single query
		const [updatedStamp] = await db
			.update(stamps)
			.set({ isPublic: body.isPublic })
			.where(eq(stamps.id, id))
			.returning();

		return jsonResponse({
			ok: true,
			stamp: { id: updatedStamp.id, isPublic: updatedStamp.isPublic },
		});
	} catch (error) {
		console.error("Failed to update visibility:", error);
		return jsonResponse({ error: "Failed to update." }, 500);
	}
}

export const Route = createFileRoute("/api/stamps/$id/visibility")({
	server: {
		handlers: {
			PATCH: ({ request, params }) => PATCH(request, params.id),
		},
	},
});
