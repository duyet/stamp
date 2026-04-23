import { describe, expect, it } from "vitest";
import { sanitizeErrorForLogging } from "../sanitize-error";

describe("sanitizeErrorForLogging", () => {
	it("returns string for non-Error values", () => {
		expect(sanitizeErrorForLogging("plain string")).toBe("plain string");
		expect(sanitizeErrorForLogging(42)).toBe("42");
		expect(sanitizeErrorForLogging(null)).toBe("null");
		expect(sanitizeErrorForLogging(undefined)).toBe("undefined");
	});

	it("returns error message for Error instances", () => {
		expect(sanitizeErrorForLogging(new Error("something broke"))).toBe(
			"something broke",
		);
	});

	it("redacts api_key patterns", () => {
		const result = sanitizeErrorForLogging(
			new Error("api_key=demo-demo-demo-key"),
		);
		expect(result).toBe("api_key=***");
	});

	it("redacts api-key patterns (hyphen variant)", () => {
		const result = sanitizeErrorForLogging(new Error("api-key mysecretkey123"));
		expect(result).toBe("api_key=***");
	});

	it("redacts token patterns", () => {
		const result = sanitizeErrorForLogging(new Error("token=demo-demo-token"));
		expect(result).toBe("token=***");
	});

	it("redacts secret patterns", () => {
		const result = sanitizeErrorForLogging(new Error("secret: myoauthsecret"));
		expect(result).toBe("secret=***");
	});

	it("redacts password patterns", () => {
		const result = sanitizeErrorForLogging(new Error("password=hunter42"));
		expect(result).toBe("password=***");
	});

	it("redacts bearer patterns", () => {
		const result = sanitizeErrorForLogging(
			new Error("bearer demo-demo-demo-token"),
		);
		expect(result).toBe("bearer=***");
	});

	it("redacts OpenAI-style sk- keys", () => {
		const result = sanitizeErrorForLogging(
			new Error("Invalid key: sk-proj-demo-demo-demo-demo-1234"),
		);
		expect(result).not.toContain("sk-proj-demo-demo");
		expect(result).toContain("sk-***");
	});

	it("handles errors without sensitive data", () => {
		const result = sanitizeErrorForLogging(
			new Error("Network timeout after 30s"),
		);
		expect(result).toBe("Network timeout after 30s");
	});

	it("handles multiple sensitive patterns in one message", () => {
		const result = sanitizeErrorForLogging(
			new Error("api_key=demo-key token=demo-token password=secret123"),
		);
		expect(result).not.toContain("demo-key");
		expect(result).not.toContain("demo-token");
		expect(result).not.toContain("secret123");
	});
});
