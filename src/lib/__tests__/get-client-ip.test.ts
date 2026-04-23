import { describe, expect, it } from "vitest";
import { getClientIp } from "../get-client-ip";

describe("getClientIp", () => {
	it("returns cf-connecting-ip header when present", () => {
		const headers = new Headers({
			"cf-connecting-ip": "203.0.113.50",
		});
		expect(getClientIp(headers)).toBe("203.0.113.50");
	});

	it("returns fallback 'unknown' when header is missing", () => {
		const headers = new Headers();
		expect(getClientIp(headers)).toBe("unknown");
	});

	it("returns null when fallback is explicitly null", () => {
		const headers = new Headers();
		expect(getClientIp(headers, null)).toBeNull();
	});

	it("returns custom fallback string", () => {
		const headers = new Headers();
		expect(getClientIp(headers, "0.0.0.0")).toBe("0.0.0.0");
	});

	it("does NOT use x-forwarded-for header", () => {
		const headers = new Headers({
			"x-forwarded-for": "10.0.0.1, 192.168.1.1",
		});
		// Should fall back, not use x-forwarded-for
		expect(getClientIp(headers)).toBe("unknown");
	});

	it("prefers cf-connecting-ip over x-forwarded-for", () => {
		const headers = new Headers({
			"cf-connecting-ip": "203.0.113.50",
			"x-forwarded-for": "10.0.0.1",
		});
		expect(getClientIp(headers)).toBe("203.0.113.50");
	});

	it("handles IPv6 addresses", () => {
		const headers = new Headers({
			"cf-connecting-ip": "2001:db8::1",
		});
		expect(getClientIp(headers)).toBe("2001:db8::1");
	});
});
