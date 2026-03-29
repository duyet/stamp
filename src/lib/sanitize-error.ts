/**
 * Sanitize error messages for logging to prevent leaking sensitive information.
 * Removes potential API keys, tokens, and other sensitive patterns.
 *
 * @param error - The error to sanitize
 * @returns A sanitized string representation of the error
 */
export function sanitizeErrorForLogging(error: unknown): string {
	if (error instanceof Error) {
		// Remove common sensitive patterns from error messages
		const sanitized = error.message
			.replace(/api[_-]?key["\s:=]+[^\s,}]*/gi, "api_key=***")
			.replace(/token["\s:=]+[^\s,}]*/gi, "token=***")
			.replace(/secret["\s:=]+[^\s,}]*/gi, "secret=***")
			.replace(/password["\s:=]+[^\s,}]*/gi, "password=***")
			.replace(/bearer["\s:=]+[^\s,}]*/gi, "bearer=***")
			.replace(/sk-[a-zA-Z0-9_-]{20,}/g, "sk-***")
			.replace(/["\s:]([^"\\]{10,})["\\]/g, (match) => {
				// Truncate long strings that might be sensitive
				const content = match.slice(1, -1);
				if (content.length > 50) {
					return `"${content.slice(0, 20)}...${content.slice(-10)}"`;
				}
				return match;
			});
		return sanitized;
	}
	return String(error);
}
