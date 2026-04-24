function maskClerkKey(value: string): string {
	if (value.length <= 12) {
		return "***";
	}

	return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

let hasLoggedClerkConfig = false;

function getBrowserClerkPublishableKey(): string | undefined {
	if (typeof window === "undefined") return undefined;

	const clerkState = (
		window as typeof window & {
			__clerk_init_state?: {
				__internal_clerk_state?: {
					__publishableKey?: string;
				};
			};
		}
	).__clerk_init_state;

	return clerkState?.__internal_clerk_state?.__publishableKey?.trim();
}

export function getClerkPublishableKey(): string | undefined {
	const runtimeKey = process.env.CLERK_PUBLISHABLE_KEY?.trim();
	const publicKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
	const browserKey = getBrowserClerkPublishableKey();

	if (!hasLoggedClerkConfig) {
		hasLoggedClerkConfig = true;

		if (runtimeKey && publicKey && runtimeKey !== publicKey) {
			console.error("Clerk publishable key mismatch detected", {
				preferredEnv: "CLERK_PUBLISHABLE_KEY",
				clerkPublishableKey: maskClerkKey(runtimeKey),
				nextPublicClerkPublishableKey: maskClerkKey(publicKey),
			});
		} else if (!runtimeKey && publicKey) {
			console.warn(
				"CLERK_PUBLISHABLE_KEY is not set; falling back to NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY at runtime",
			);
		} else if (!runtimeKey && !publicKey) {
			console.error(
				"Clerk publishable key is missing; set CLERK_PUBLISHABLE_KEY in Cloudflare Workers",
			);
		}
	}

	return runtimeKey || publicKey || browserKey || undefined;
}

export function getClerkSecretKey(): string | undefined {
	return process.env.CLERK_SECRET_KEY?.trim() || undefined;
}
