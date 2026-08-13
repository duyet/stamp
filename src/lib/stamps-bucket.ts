import { getEnv } from "@/lib/env";

/**
 * The R2 bucket holding generated stamp images, or null when R2 is not
 * configured for this deployment.
 *
 * R2 is currently disabled on the Cloudflare account, so `wrangler.jsonc`
 * omits the binding — keeping it would make every `wrangler deploy` fail with
 * `code: 10136`. Callers must decide how to degrade: reads fall back to a
 * broken image, writes must refuse with a clear error.
 */
export function getStampsBucket(): R2Bucket | null {
	return (getEnv().STAMPS_BUCKET as R2Bucket | undefined) ?? null;
}
