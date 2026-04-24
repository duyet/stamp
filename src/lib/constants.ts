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
	/** Reference image dimension sent to model to reduce upstream usage */
	REFERENCE_MODEL_DIMENSION: 384,
	/** HD generation output dimension */
	HD_DIMENSION: 1024,
	/** Standard generation output dimension */
	STANDARD_DIMENSION: 512,
} as const;

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
 * UI color constants for dark mode consistency
 */
export const TEXT_COLORS = {
	/** Primary text color */
	primary: "text-stone-600 dark:text-stone-400",
	/** Secondary text color */
	secondary: "text-stone-500 dark:text-stone-400",
	/** Dark text color */
	dark: "text-stone-700 dark:text-stone-300",
	/** Heading color */
	heading: "text-stamp-navy dark:text-stone-100",
	/** Muted text color */
	muted: "text-stone-400 dark:text-stone-500",
	/** Hover text color */
	hover: "hover:text-stone-700 dark:hover:text-stone-300",
	/** Inverted text (dark mode) */
	inverted: "text-stone-900 dark:text-stone-100",
} as const;

/**
 * Dashboard-specific constants
 */
export const DASHBOARD = {
	/** Number of days to show in daily trend chart */
	DAILY_TREND_DAYS: 30,
	/** Maximum bar height in pixels for trend chart */
	MAX_BAR_HEIGHT: 112,
	/** Minimum bar height in pixels for trend chart */
	MIN_BAR_HEIGHT: 4,
	/** Number of stat cards per row in overview section */
	STATS_PER_ROW: 4,
	/** Number of popular styles to showcase */
	POPULAR_STYLES_LIMIT: 6,
} as const;
