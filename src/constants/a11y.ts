/**
 * Accessibility constants and utilities.
 */

/**
 * CSS selector for focusable elements in the DOM.
 * Used for focus trap implementation in modals and dialogs.
 */
export const FOCUSABLE_SELECTOR =
	'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
