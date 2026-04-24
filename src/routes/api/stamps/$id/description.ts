import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { stamps } from "@/db/schema";
import { handleCorsPreflight, jsonResponse } from "@/lib/api-utils";
import { canModifyStamp } from "@/lib/auth";
import { getAuthUserId } from "@/lib/clerk";
import { getClientIp } from "@/lib/get-client-ip";
import { hashIp } from "@/lib/hash-ip";
import { getSessionToken } from "@/lib/session-cookie";

const MAX_DESCRIPTION_LENGTH = 200;

export async function PATCH(request: Request, id: string): Promise<Response> {
	try {
		const db = getDb();

		if (!id || id.length !== 12) {
			return jsonResponse({ error: "Invalid stamp ID" }, 400);
		}

		const body = (await request.json()) as { description: unknown };
		if (typeof body.description !== "string") {
			return jsonResponse({ error: "description must be a string" }, 400);
		}

		const description = body.description.trim();
		if (
			description.length === 0 ||
			description.length > MAX_DESCRIPTION_LENGTH
		) {
			return jsonResponse(
				{
					error: `description must be between 1 and ${MAX_DESCRIPTION_LENGTH} characters`,
				},
				400,
			);
		}

		const { userId } = await getAuthUserId();
		if (!userId) {
			return jsonResponse({ error: "Sign in required" }, 401);
		}

		const rawIp = getClientIp(request.headers, null);
		const userIp = rawIp ? await hashIp(rawIp) : null;
		const sessionToken = getSessionToken(request);

		const stamp = await db.query.stamps.findFirst({
			where: eq(stamps.id, id),
		});

		if (!stamp) {
			return jsonResponse({ error: "Stamp not found" }, 404);
		}

		if (!canModifyStamp(stamp, { userId, userIp, sessionToken })) {
			return jsonResponse({ error: "Not authorized" }, 403);
		}

		const [updatedStamp] = await db
			.update(stamps)
			.set({ description })
			.where(eq(stamps.id, id))
			.returning();

		return jsonResponse({
			ok: true,
			stamp: {
				id: updatedStamp.id,
				description: updatedStamp.description,
			},
		});
	} catch (error) {
		console.error("Failed to update description:", error);
		return jsonResponse({ error: "Failed to update." }, 500);
	}
}

export const Route = createFileRoute("/api/stamps/$id/description")({
	server: {
		handlers: {
			OPTIONS: ({ request }) => handleCorsPreflight(request),
			PATCH: ({ request, params }) => PATCH(request, params.id),
		},
	},
});
