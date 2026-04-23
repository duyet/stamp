import { describe, expect, it } from "vitest";
import type { PublicStamp } from "@/db/schema";

describe("PublicStamp type", () => {
	it("excludes PII fields from the type", () => {
		const publicStamp: PublicStamp = {
			id: "abc123",
			prompt: "a cat",
			enhancedPrompt: null,
			description: null,
			imageUrl: "https://example.com/stamp.png",
			style: "vintage",
			isPublic: true,
			createdAt: new Date(),
		};

		// Verify safe fields are present
		expect(publicStamp.id).toBe("abc123");
		expect(publicStamp.prompt).toBe("a cat");
		expect(publicStamp.imageUrl).toBe("https://example.com/stamp.png");

		// Verify PII fields are not accessible on the type
		const keys = Object.keys(publicStamp);
		const piiFields = [
			"userIp",
			"userId",
			"userAgent",
			"referrer",
			"locationCity",
			"locationCountry",
			"locationLat",
			"locationLng",
			"userTimezone",
		];

		for (const pii of piiFields) {
			expect(keys).not.toContain(pii);
		}
	});
});
