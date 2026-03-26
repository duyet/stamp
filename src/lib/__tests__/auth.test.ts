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

	it("returns false when ADMIN_USER_IDS is not configured (fail-closed)", () => {
		vi.mocked(getEnv).mockReturnValue({} as never);
		expect(isAdmin("user_123")).toBe(false);
	});

	it("returns false when ADMIN_USER_IDS is empty string (fail-closed)", () => {
		vi.mocked(getEnv).mockReturnValue({ ADMIN_USER_IDS: "" } as never);
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
});

describe("canModifyStamp", () => {
	it("allows authenticated user to modify their own stamp", () => {
		expect(
			canModifyStamp(
				{ userId: "user_1", userIp: "1.2.3.4" },
				{ userId: "user_1", userIp: "5.6.7.8" },
			),
		).toBe(true);
	});

	it("denies authenticated user from modifying another user stamp", () => {
		expect(
			canModifyStamp(
				{ userId: "user_1", userIp: "1.2.3.4" },
				{ userId: "user_2", userIp: "1.2.3.4" },
			),
		).toBe(false);
	});

	it("allows anonymous user with matching IP", () => {
		expect(
			canModifyStamp(
				{ userId: null, userIp: "1.2.3.4" },
				{ userId: null, userIp: "1.2.3.4" },
			),
		).toBe(true);
	});

	it("denies anonymous user with different IP", () => {
		expect(
			canModifyStamp(
				{ userId: null, userIp: "1.2.3.4" },
				{ userId: null, userIp: "5.6.7.8" },
			),
		).toBe(false);
	});
});
