import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
	getEnv: vi.fn(),
}));

import { canModifyStamp, isAdmin } from "@/lib/auth";
import { getEnv } from "@/lib/env";

describe("isAdmin", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns false when admin allowlists are not configured (fail-closed)", () => {
		vi.mocked(getEnv).mockReturnValue({} as never);
		expect(isAdmin("user_123")).toBe(false);
	});

	it("returns false when admin allowlists are empty strings (fail-closed)", () => {
		vi.mocked(getEnv).mockReturnValue({
			ADMIN_EMAILS: "",
			ADMIN_USER_IDS: "",
		} as never);
		expect(isAdmin("user_123")).toBe(false);
	});

	it("returns true for a user in the admin list", () => {
		vi.mocked(getEnv).mockReturnValue({
			ADMIN_USER_IDS: "user_abc,user_123,user_xyz",
		} as never);
		expect(isAdmin("user_123")).toBe(true);
	});

	it("returns false for a user not in the admin list", () => {
		vi.mocked(getEnv).mockReturnValue({
			ADMIN_USER_IDS: "user_abc,user_xyz",
		} as never);
		expect(isAdmin("user_123")).toBe(false);
	});

	it("handles single admin in the list", () => {
		vi.mocked(getEnv).mockReturnValue({
			ADMIN_USER_IDS: "user_only",
		} as never);
		expect(isAdmin("user_only")).toBe(true);
		expect(isAdmin("user_other")).toBe(false);
	});

	it("ignores empty entries from trailing commas", () => {
		vi.mocked(getEnv).mockReturnValue({
			ADMIN_USER_IDS: "user_abc,,user_xyz,",
		} as never);
		expect(isAdmin("user_abc")).toBe(true);
		expect(isAdmin("")).toBe(false);
	});

	it("trims whitespace around admin IDs", () => {
		vi.mocked(getEnv).mockReturnValue({
			ADMIN_USER_IDS: " user_abc , user_xyz ",
		} as never);
		expect(isAdmin("user_abc")).toBe(true);
		expect(isAdmin("user_xyz")).toBe(true);
		expect(isAdmin(" user_abc ")).toBe(false);
	});

	it("returns true for a user email in the admin email list", () => {
		vi.mocked(getEnv).mockReturnValue({
			ADMIN_EMAILS: "admin@example.com, lvduit08@gmail.com",
		} as never);
		expect(isAdmin("user_regular", "lvduit08@gmail.com")).toBe(true);
	});

	it("matches admin emails case-insensitively", () => {
		vi.mocked(getEnv).mockReturnValue({
			ADMIN_EMAILS: "LVduIt08@GMAIL.com",
		} as never);
		expect(isAdmin("user_regular", " lvduit08@gmail.com ")).toBe(true);
	});

	it("returns false for a user email not in the admin email list", () => {
		vi.mocked(getEnv).mockReturnValue({
			ADMIN_EMAILS: "admin@example.com",
		} as never);
		expect(isAdmin("user_regular", "lvduit08@gmail.com")).toBe(false);
	});
});

describe("canModifyStamp", () => {
	it("allows authenticated user to modify their own stamp", () => {
		expect(
			canModifyStamp(
				{ userId: "user_1", userIp: "1.2.3.4", sessionToken: null },
				{ userId: "user_1", userIp: "5.6.7.8", sessionToken: null },
			),
		).toBe(true);
	});

	it("denies authenticated user from modifying another user stamp", () => {
		expect(
			canModifyStamp(
				{ userId: "user_1", userIp: "1.2.3.4", sessionToken: "token-a" },
				{ userId: "user_2", userIp: "5.6.7.8", sessionToken: "token-b" },
			),
		).toBe(false);
	});

	it("allows anonymous user with matching session token", () => {
		expect(
			canModifyStamp(
				{ userId: null, userIp: "1.2.3.4", sessionToken: "token-abc" },
				{ userId: null, userIp: "5.6.7.8", sessionToken: "token-abc" },
			),
		).toBe(true);
	});

	it("denies anonymous user with different session token", () => {
		expect(
			canModifyStamp(
				{ userId: null, userIp: "1.2.3.4", sessionToken: "token-abc" },
				{ userId: null, userIp: "5.6.7.8", sessionToken: "token-xyz" },
			),
		).toBe(false);
	});

	it("falls back to IP match when no session token (backward compat)", () => {
		expect(
			canModifyStamp(
				{ userId: null, userIp: "1.2.3.4", sessionToken: null },
				{ userId: null, userIp: "1.2.3.4", sessionToken: null },
			),
		).toBe(true);
	});

	it("denies anonymous user with different IP and no session token", () => {
		expect(
			canModifyStamp(
				{ userId: null, userIp: "1.2.3.4", sessionToken: null },
				{ userId: null, userIp: "5.6.7.8", sessionToken: null },
			),
		).toBe(false);
	});

	it("prefers userId over sessionToken and IP", () => {
		expect(
			canModifyStamp(
				{ userId: "user_1", userIp: "1.2.3.4", sessionToken: "token-abc" },
				{ userId: "user_1", userIp: "5.6.7.8", sessionToken: "token-xyz" },
			),
		).toBe(true);
	});

	it("prefers sessionToken over IP", () => {
		expect(
			canModifyStamp(
				{ userId: null, userIp: "1.2.3.4", sessionToken: "token-abc" },
				{ userId: null, userIp: "5.6.7.8", sessionToken: "token-abc" },
			),
		).toBe(true);
	});

	it("denies when stamp has no sessionToken and IPs differ", () => {
		expect(
			canModifyStamp(
				{ userId: null, userIp: "1.2.3.4", sessionToken: null },
				{ userId: null, userIp: "5.6.7.8", sessionToken: "token-abc" },
			),
		).toBe(false);
	});

	it("falls back to IP when stamp has sessionToken but requester does not", () => {
		expect(
			canModifyStamp(
				{ userId: null, userIp: "1.2.3.4", sessionToken: "token-abc" },
				{ userId: null, userIp: "1.2.3.4", sessionToken: null },
			),
		).toBe(true); // IP fallback still works
	});
});
