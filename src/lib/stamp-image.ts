const STAMP_IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp"] as const;

export type StampImageExtension = (typeof STAMP_IMAGE_EXTENSIONS)[number];

export function isValidStampImageExtension(
	value: string | null | undefined,
): value is StampImageExtension {
	return (
		typeof value === "string" &&
		(STAMP_IMAGE_EXTENSIONS as readonly string[]).includes(value)
	);
}

export function getStampImageKeys(
	id: string,
	imageExt: string | null | undefined,
	options?: { isReference?: boolean },
): string[] {
	const prefix = options?.isReference ? "references" : "stamps";

	if (options?.isReference) {
		return [`${prefix}/${id}.webp`, `${prefix}/${id}.png`];
	}

	if (isValidStampImageExtension(imageExt)) {
		return [`${prefix}/${id}.${imageExt}`];
	}

	return STAMP_IMAGE_EXTENSIONS.map((ext) => `${prefix}/${id}.${ext}`);
}

export async function hasRenderableStampImage(
	bucket: R2Bucket,
	id: string,
	imageExt: string | null | undefined,
): Promise<boolean> {
	const keys = getStampImageKeys(id, imageExt);

	for (const key of keys) {
		const object = await bucket.head(key);
		if (object) {
			return true;
		}
	}

	return false;
}
