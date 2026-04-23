import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { stamps } from "@/db/schema";
import { withSecurityHeaders } from "@/lib/api-utils";
import { canModifyStamp } from "@/lib/auth";
import { getAuthUserId } from "@/lib/clerk";
import { getEnv } from "@/lib/env";
import { getClientIp } from "@/lib/get-client-ip";
import { hashIp } from "@/lib/hash-ip";
import { getSessionToken } from "@/lib/session-cookie";
import {
	getStampImageKeys,
	isValidStampImageExtension,
} from "@/lib/stamp-image";

const CONTENT_TYPE_MAP: Record<string, string> = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	webp: "image/webp",
};

const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const MAX_ID_LENGTH = 100;

export async function GET(request: Request, id: string): Promise<Response> {
	const jsonError = (msg: string, status: number) =>
		withSecurityHeaders(
			new Response(JSON.stringify({ error: msg }), {
				status,
				headers: { "Content-Type": "application/json" },
			}),
		);

	try {
		if (!ID_PATTERN.test(id) || id.length > MAX_ID_LENGTH) {
			return jsonError("Invalid ID format", 400);
		}

		const env = getEnv();
		const db = getDb();
		const bucket = env.STAMPS_BUCKET as unknown as R2Bucket;

		const isReference = id.startsWith("ref_");
		const cleanId = isReference ? id.slice(4) : id;

		if (!cleanId || !ID_PATTERN.test(cleanId)) {
			return jsonError("Invalid ID format", 400);
		}

		let object: R2ObjectBody | null = null;
		let contentType = "image/png";

		if (!isReference) {
			let imageExt: string | null = null;

			const stamp = await db.query.stamps.findFirst({
				where: eq(stamps.id, id),
				columns: {
					imageExt: true,
					isPublic: true,
					userId: true,
					userIp: true,
					sessionToken: true,
				},
			});

			if (stamp?.imageExt && !isValidStampImageExtension(stamp.imageExt)) {
				return jsonError("Invalid image extension", 400);
			}

			if (stamp && stamp.isPublic === false) {
				const { userId } = await getAuthUserId();
				const rawIp = getClientIp(request.headers, null);
				const userIp = rawIp ? await hashIp(rawIp) : null;
				const sessionToken = getSessionToken(request);

				if (!canModifyStamp(stamp, { userId, userIp, sessionToken })) {
					return jsonError("Not authorized", 403);
				}
			}

			imageExt = stamp?.imageExt ?? null;

			for (const key of getStampImageKeys(cleanId, imageExt)) {
				object = await bucket.get(key);
				if (!object) {
					continue;
				}

				const ext = key.slice(key.lastIndexOf(".") + 1);
				contentType = CONTENT_TYPE_MAP[ext] ?? "image/png";
				break;
			}
		} else {
			for (const key of getStampImageKeys(cleanId, null, {
				isReference: true,
			})) {
				object = await bucket.get(key);
				if (!object) {
					continue;
				}

				const ext = key.slice(key.lastIndexOf(".") + 1);
				contentType = CONTENT_TYPE_MAP[ext] ?? "image/png";
				break;
			}
		}

		if (!object) {
			return jsonError("Image not found", 404);
		}

		return withSecurityHeaders(
			new Response(object.body, {
				headers: {
					"Content-Type": contentType,
					"Cache-Control": "public, max-age=31536000, immutable",
				},
			}),
		);
	} catch (error) {
		console.error("Failed to serve image:", error);
		return jsonError("Failed to load image.", 500);
	}
}

export const Route = createFileRoute("/api/stamps/$id/image")({
	server: {
		handlers: {
			GET: ({ request, params }) => GET(request, params.id),
		},
	},
});
