import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import { createMiddleware, createStart } from "@tanstack/react-start";

const securityHeadersMiddleware = createMiddleware().server(
	async ({ next }) => {
		const result = await next();

		const headers = result.response.headers;
		headers.set("X-Frame-Options", "DENY");
		headers.set("X-Content-Type-Options", "nosniff");
		headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
		headers.set(
			"Strict-Transport-Security",
			"max-age=63072000; includeSubDomains; preload",
		);
		headers.set(
			"Permissions-Policy",
			"camera=(), microphone=(), geolocation=(), payment=()",
		);

		return result;
	},
);

export const startInstance = createStart(() => ({
	requestMiddleware: [clerkMiddleware(), securityHeadersMiddleware],
}));
