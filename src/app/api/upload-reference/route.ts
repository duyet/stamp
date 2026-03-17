import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { describeImage } from "@/lib/describe-image";
import { getEnv } from "@/lib/env";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function getExtension(mimeType: string): string {
	if (mimeType === "image/png") return "png";
	if (mimeType === "image/webp") return "webp";
	return "jpg";
}

export async function POST(request: NextRequest) {
	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
	}

	const file = formData.get("image");
	if (!file || !(file instanceof File)) {
		return NextResponse.json(
			{ error: "Missing 'image' field." },
			{ status: 400 },
		);
	}

	if (!ALLOWED_TYPES.has(file.type)) {
		return NextResponse.json(
			{
				error:
					"Invalid file type. Only JPEG, PNG, and WebP images are accepted.",
			},
			{ status: 400 },
		);
	}

	if (file.size > MAX_SIZE) {
		return NextResponse.json(
			{ error: "File too large. Maximum size is 5 MB." },
			{ status: 400 },
		);
	}

	const env = getEnv();

	if (!env.AI) {
		return NextResponse.json(
			{ error: "AI binding not configured." },
			{ status: 503 },
		);
	}

	const imageData = new Uint8Array(await file.arrayBuffer());
	const referenceId = nanoid(12);
	const ext = getExtension(file.type);
	const bucket = env.STAMPS_BUCKET as unknown as R2Bucket;

	await bucket.put(`references/${referenceId}.${ext}`, imageData, {
		httpMetadata: { contentType: file.type },
	});

	let referenceDescription: string;
	try {
		referenceDescription = await describeImage(env.AI, imageData, file.type);
	} catch {
		return NextResponse.json(
			{ error: "Could not analyze image. Try a different photo." },
			{ status: 500 },
		);
	}

	return NextResponse.json({
		referenceId,
		referenceImageUrl: `/api/stamps/ref_${referenceId}/image`,
		referenceDescription,
	});
}
