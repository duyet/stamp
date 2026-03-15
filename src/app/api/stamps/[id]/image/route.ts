import { type NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

export const runtime = "edge";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const env = await getEnv();
		const bucket = env.STAMPS_BUCKET as unknown as R2Bucket;

		// Try both png and jpg
		const pngKey = `stamps/${id}.png`;
		const jpgKey = `stamps/${id}.jpg`;

		let object = await bucket.get(pngKey);
		let contentType = "image/png";

		if (!object) {
			object = await bucket.get(jpgKey);
			contentType = "image/jpeg";
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
