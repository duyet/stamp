import { describe, expect, it } from "vitest";
import {
	buildSetCookieHeader,
	createSessionToken,
	getSessionToken,
	SESSION_COOKIE_NAME,
} from "@/lib/session-cookie";

describe("session-cookie", () => {
	describe("createSessionToken", () => {
		it("returns a UUID string", () => {
			const token = createSessionToken();
			expect(token).toBeTruthy();
			expect(token).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
			);
		});

		it("generates unique tokens", () => {
			const tokens = new Set(
				Array.from({ length: 100 }, () => createSessionToken()),
			);
			expect(tokens.size).toBe(100);
		});
	});

	describe("getSessionToken", () => {
		it("returns null when no cookie header", () => {
			const request = new Request("http://localhost");
			expect(getSessionToken(request)).toBeNull();
		});

		it("returns null when cookie header has no stamp_session", () => {
			const request = new Request("http://localhost", {
				headers: { cookie: "other=value" },
			});
			expect(getSessionToken(request)).toBeNull();
		});

		it("returns token from cookie header", () => {
			const request = new Request("http://localhost", {
				headers: { cookie: `${SESSION_COOKIE_NAME}=abc-123` },
			});
			expect(getSessionToken(request)).toBe("abc-123");
		});

		it("returns token from cookie header with multiple cookies", () => {
			const request = new Request("http://localhost", {
				headers: {
					cookie: `other=val; ${SESSION_COOKIE_NAME}=token-xyz; foo=bar`,
				},
			});
			expect(getSessionToken(request)).toBe("token-xyz");
		});

		it("returns null for empty stamp_session value", () => {
			const request = new Request("http://localhost", {
				headers: { cookie: `${SESSION_COOKIE_NAME}=` },
			});
			expect(getSessionToken(request)).toBeNull();
		});
	});

	describe("buildSetCookieHeader", () => {
		it("builds correct Set-Cookie header", () => {
			const header = buildSetCookieHeader("test-token");
			expect(header).toBe(
				"stamp_session=test-token; Max-Age=31536000; Path=/; HttpOnly; Secure; SameSite=Lax",
			);
		});
	});
});
