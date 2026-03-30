/**
 * Hash IP addresses for privacy-compliant storage.
 * SHA-256 + salt — sufficient for rate limiting (compare hashes)
 * and unique visitor counting without storing PII.
 */

const IP_HASH_SALT = "stamp-duyet-net-v1";

/**
 * Hash an IP address using SHA-256 + application salt.
 * Returns hex-encoded hash string.
 */
export async function hashIp(ip: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(ip + IP_HASH_SALT);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(hashBuffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}
