/**
 * Shared constants for stamp.builders
 * Single source of truth for magic numbers and configuration values
 */

/**
 * Image dimension constraints
 */
export const IMAGE_CONSTANTS = {
	/** Maximum upload size in bytes (5MB) */
	MAX_UPLOAD_SIZE_BYTES: 5 * 1024 * 1024,
	/** FLUX.2 img2img max dimension */
	FLUX_MAX_DIMENSION: 512,
	/** HD generation output dimension */
	HD_DIMENSION: 1024,
	/** Standard generation output dimension */
	STANDARD_DIMENSION: 512,
} as const;

/**
 * Prompt constraints
 */
export const PROMPT_MAX_LENGTH = 500;

/**
 * Rate limiting window (24 hours in milliseconds)
 */
export const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Credit costs
 */
export const CREDIT_COSTS = {
	/** Standard stamp generation cost */
	STANDARD: 1,
	/** HD stamp generation cost */
	HD: 5,
} as const;

/**
 * Daily credit limits
 */
export const DAILY_CREDIT_LIMITS = {
	/** Authenticated users daily limit */
	AUTHENTICATED: 100,
	/** Anonymous users daily limit */
	ANONYMOUS: 20,
} as const;

/**
 * Stamp pagination
 */
export const STAMPS_PER_PAGE = 50;

/**
 * Analytics event types
 */
export const ANALYTICS_EVENTS = {
	PAGE_VIEW: "page_view",
	GENERATION: "generation",
	DOWNLOAD: "download",
	SHARE: "share",
	COPY_LINK: "copy_link",
	STAMP_VIEW: "stamp_view",
} as const;

/**
 * Stamp styles
 */
export const STAMP_STYLES = [
	"vintage",
	"folk",
	"modern",
	"botanical",
	"portrait",
	"watercolor",
	"woodcut",
	"engraved",
	"pixel",
	"risograph",
] as const;

/** Stamp style type */
export type StampStyle = (typeof STAMP_STYLES)[number];
