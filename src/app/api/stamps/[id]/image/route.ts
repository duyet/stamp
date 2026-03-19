import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
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

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;

		// Validate ID format to prevent injection attacks
		if (!ID_PATTERN.test(id) || id.length > MAX_ID_LENGTH) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
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
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}

		let object: R2ObjectBody | null = null;
		let contentType = "image/png";

		// For stamps, try to get extension from database first
		if (!isReference) {
			const stamp = await db.query.stamps.findFirst({
				where: eq(stamps.id, id),
				columns: { imageExt: true },
			});

			if (stamp?.imageExt) {
				const ext = stamp.imageExt;
				// Validate extension is in allowlist
				if (!(VALID_EXTENSIONS as readonly string[]).includes(ext)) {
					return NextResponse.json(
						{ error: "Invalid image extension" },
						{ status: 400 },
					);
				}
				// Use HEAD request to check existence before full GET (faster for 404s)
				const headResult = await bucket.head(`${prefix}/${cleanId}.${ext}`);
				if (headResult) {
					object = await bucket.get(`${prefix}/${cleanId}.${ext}`);
					contentType = CONTENT_TYPE_MAP[ext] ?? "image/png";
				}
			}
		}

		// Fallback: try extensions if db lookup failed or no imageExt stored
		if (!object) {
			object = await bucket.get(`${prefix}/${cleanId}.png`);
			contentType = "image/png";
		}

		if (!object) {
			object = await bucket.get(`${prefix}/${cleanId}.jpg`);
			contentType = "image/jpeg";
		}

		if (!object && isReference) {
			object = await bucket.get(`${prefix}/${cleanId}.webp`);
			contentType = "image/webp";
		}

		if (!object) {
			return NextResponse.json({ error: "Image not found" }, { status: 404 });
		}

		const body = await object.arrayBuffer();

		return new NextResponse(body, {
			headers: {
				"Content-Type": contentType,
				"Cache-Control": "public, max-age=31536000, immutable",
			},
		});
	} catch (error) {
		console.error("Failed to serve image:", error);
		return NextResponse.json(
			{ error: "Failed to load image." },
			{ status: 500 },
		);
	}
}
