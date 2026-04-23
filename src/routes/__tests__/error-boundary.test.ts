import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const rootTsx = readFileSync(resolve(__dirname, "../__root.tsx"), "utf-8");

describe("error boundary security", () => {
	it("does not render error.message to users", () => {
		// error.message must never appear in JSX — it can leak stack traces
		// and internal paths. Only console logging is acceptable.
		const jsxSection = rootTsx.slice(
			rootTsx.indexOf("function ErrorComponent"),
		);
		expect(jsxSection).not.toContain("error.message");
	});

	it("logs the real error for debugging", () => {
		expect(rootTsx).toContain("console.error");
	});

	it("shows a generic user-friendly message", () => {
		expect(rootTsx).toContain("An unexpected error occurred");
	});
});
