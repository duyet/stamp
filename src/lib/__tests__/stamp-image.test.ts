import { describe, expect, it, vi } from "vitest";
import { getStampImageKeys, hasRenderableStampImage } from "../stamp-image";

function createBucket(head: (key: string) => Promise<unknown>): {
	bucket: R2Bucket;
	calls: string[];
} {
	const calls: string[] = [];
	const bucket = {
		head: (key: string) => {
			calls.push(key);
			return head(key);
		},
	} as unknown as R2Bucket;

	return { bucket, calls };
}

describe("getStampImageKeys", () => {
	it("returns the single known key when the extension is recorded", () => {
		expect(getStampImageKeys("abc", "jpg")).toEqual(["stamps/abc.jpg"]);
	});

	it("probes every supported extension when it is unknown", () => {
		expect(getStampImageKeys("abc", null)).toEqual([
			"stamps/abc.png",
			"stamps/abc.jpg",
			"stamps/abc.jpeg",
			"stamps/abc.webp",
		]);
	});
});

describe("hasRenderableStampImage", () => {
	// image_ext is written only after the R2 upload succeeds (see persistStamp),
	// so the column is authoritative and must not cost a subrequest per row.
	it("trusts a recorded extension without touching R2", async () => {
		const { bucket, calls } = createBucket(async () => null);

		await expect(hasRenderableStampImage(bucket, "abc", "jpg")).resolves.toBe(
			true,
		);
		expect(calls).toEqual([]);
	});

	it("probes R2 for legacy rows with no recorded extension", async () => {
		const { bucket, calls } = createBucket(async (key) =>
			key === "stamps/abc.jpg" ? {} : null,
		);

		await expect(hasRenderableStampImage(bucket, "abc", null)).resolves.toBe(
			true,
		);
		expect(calls).toEqual(["stamps/abc.png", "stamps/abc.jpg"]);
	});

	it("reports a legacy row as unrenderable when no object exists", async () => {
		const { bucket } = createBucket(async () => null);

		await expect(hasRenderableStampImage(bucket, "abc", null)).resolves.toBe(
			false,
		);
	});

	// R2 is currently unbound (see wrangler.jsonc), so the listing must still
	// render rather than filtering every legacy row out of existence.
	it("fails open when no bucket is configured", async () => {
		await expect(hasRenderableStampImage(null, "abc", null)).resolves.toBe(
			true,
		);
	});

	// A storage outage must degrade images, not 500 the whole listing.
	it("fails open when R2 throws", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		const { bucket } = createBucket(async () => {
			throw new Error("R2 is not enabled for this account");
		});

		await expect(hasRenderableStampImage(bucket, "abc", null)).resolves.toBe(
			true,
		);
	});
});
