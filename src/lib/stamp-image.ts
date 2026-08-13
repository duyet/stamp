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
	// The extension is only persisted after the R2 upload succeeds, so a valid
	// value already proves the object exists. Probing R2 again would cost one
	// subrequest per stamp on every listing render for no new information.
	if (isValidStampImageExtension(imageExt)) {
		return true;
	}

	const keys = getStampImageKeys(id, imageExt);

	try {
		for (const key of keys) {
			const object = await bucket.head(key);
			if (object) {
				return true;
			}
		}
	} catch (error) {
		// R2 being unavailable must degrade images, not take down the listing.
		// Fail open and let the client's broken-image fallback handle it.
		console.error(`[stamp-image] R2 head failed for stamp ${id}:`, error);
		return true;
	}

	return false;
}
