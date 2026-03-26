import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { stamps } from "@/db/schema";
import { canModifyStamp } from "@/lib/auth";
import { getAuthUserId } from "@/lib/clerk";
import { getClientIp } from "@/lib/get-client-ip";

export async function PATCH(request: Request, id: string): Promise<Response> {
	try {
		const db = getDb();

		// Validate ID format (nanoid 12 chars)
		if (!id || id.length !== 12) {
			return new Response(JSON.stringify({ error: "Invalid stamp ID" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const body = (await request.json()) as { isPublic: unknown };

		if (typeof body.isPublic !== "boolean") {
			return new Response(
				JSON.stringify({ error: "isPublic must be a boolean" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Get auth state (userId for logged-in users, IP for anonymous)
		const { userId } = await getAuthUserId(request.headers);
		const userIp = getClientIp(request.headers, null);

		const stamp = await db.query.stamps.findFirst({
			where: eq(stamps.id, id),
		});

		if (!stamp) {
			return new Response(JSON.stringify({ error: "Stamp not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Authorization: Only the creator can toggle visibility
		if (!canModifyStamp(stamp, { userId, userIp })) {
			return new Response(JSON.stringify({ error: "Not authorized" }), {
				status: 403,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Use RETURNING clause to get updated stamp in single query
		const [updatedStamp] = await db
			.update(stamps)
			.set({ isPublic: body.isPublic })
			.where(eq(stamps.id, id))
			.returning();

		return new Response(
			JSON.stringify({
				ok: true,
				stamp: { id: updatedStamp.id, isPublic: updatedStamp.isPublic },
			}),
			{
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Failed to update visibility:", error);
		return new Response(JSON.stringify({ error: "Failed to update." }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}

export const Route = createFileRoute("/api/stamps/$id/visibility")({
	server: {
		handlers: {
			PATCH: ({ request, params }) => PATCH(request, params.id),
		},
	},
});
