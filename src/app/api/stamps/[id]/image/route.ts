import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { stamps } from "@/db/schema";
import { getEnv } from "@/lib/env";
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
		const cleanId = isReference ? id.slice(4) : id;

		// Validate cleanId is not empty after prefix removal
		if (!cleanId || !ID_PATTERN.test(cleanId)) {
			return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
		}

		let object: R2ObjectBody | null = null;
		let contentType = "image/png";

		if (!isReference) {
			let imageExt: string | null = null;

			const stamp = await db.query.stamps.findFirst({
				where: eq(stamps.id, id),
				columns: { imageExt: true },
			});

			if (stamp?.imageExt && !isValidStampImageExtension(stamp.imageExt)) {
				return NextResponse.json(
					{ error: "Invalid image extension" },
					{ status: 400 },
				);
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
