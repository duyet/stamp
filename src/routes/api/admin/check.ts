import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse } from "@/lib/api-utils";
import { isAdmin } from "@/lib/auth";
import { getAuthUserIdentity } from "@/lib/clerk";

export async function GET(): Promise<Response> {
	const { userId, email } = await getAuthUserIdentity();
	if (!userId) {
		return jsonResponse({ isAdmin: false }, 200);
	}
	return jsonResponse({ isAdmin: isAdmin(userId, email) }, 200);
}

export const Route = createFileRoute("/api/admin/check")({
	server: {
		handlers: { GET: ({ request }) => GET(request) },
	},
});
