import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { stamps } from "@/db/schema";
import { getEnv } from "@/lib/env";

const CONTENT_TYPE_MAP: Record<string, string> = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	webp: "image/webp",
};

const VALID_EXTENSIONS = ["png", "jpg", "jpeg", "webp"] as const;
const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const MAX_ID_LENGTH = 100;

export async function GET(id: string): Promise<Response> {
	try {
		// Validate ID format to prevent injection attacks
		if (!ID_PATTERN.test(id) || id.length > MAX_ID_LENGTH) {
			return new Response(JSON.stringify({ error: "Invalid ID format" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const env = getEnv();
		const db = getDb();
		const bucket = env.STAMPS_BUCKET as unknown as R2Bucket;

		// Support reference images stored under references/ prefix
		const isReference = id.startsWith("ref_");
		const prefix = isReference ? "references" : "stamps";
		const cleanId = isReference ? id.slice(4) : id;

		// Validate cleanId is not empty after prefix removal
		if (!cleanId || !ID_PATTERN.test(cleanId)) {
			return new Response(JSON.stringify({ error: "Invalid ID format" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		let object: R2ObjectBody | null = null;
		let contentType = "image/png";

		// For stamps, get extension from database first
		if (!isReference) {
			const stamp = await db.query.stamps.findFirst({
				where: eq(stamps.id, id),
				columns: { imageExt: true },
			});

			if (stamp?.imageExt) {
				const ext = stamp.imageExt;
				// Validate extension is in allowlist
				if (!(VALID_EXTENSIONS as readonly string[]).includes(ext)) {
					return new Response(
						JSON.stringify({ error: "Invalid image extension" }),
						{
							status: 400,
							headers: { "Content-Type": "application/json" },
						},
					);
				}
				// Direct GET using exact extension from DB
				object = await bucket.get(`${prefix}/${cleanId}.${ext}`);
				if (object) {
					contentType = CONTENT_TYPE_MAP[ext] ?? "image/png";
				}
			}

			// Fallback for stamps without imageExt in DB (legacy data)
			if (!object) {
				object = await bucket.get(`${prefix}/${cleanId}.png`);
				if (object) contentType = "image/png";
			}
		} else {
			// Reference images: try webp first (newer format), then png (legacy)
			object = await bucket.get(`${prefix}/${cleanId}.webp`);
			if (object) {
				contentType = "image/webp";
			}

			if (!object) {
				object = await bucket.get(`${prefix}/${cleanId}.png`);
				contentType = "image/png";
			}
		}

		if (!object) {
			return new Response(JSON.stringify({ error: "Image not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		const body = await object.arrayBuffer();

		return new Response(body, {
			headers: {
				"Content-Type": contentType,
				"Cache-Control": "public, max-age=31536000, immutable",
			},
		});
	} catch (error) {
		console.error("Failed to serve image:", error);
		return new Response(JSON.stringify({ error: "Failed to load image." }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}

export const Route = createFileRoute("/api/stamps/$id/image")({
	server: {
		handlers: {
			GET: ({ params }) => GET(params.id),
		},
	},
});
