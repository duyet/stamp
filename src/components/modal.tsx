"use client";

import { useEffect, useRef } from "react";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	children: React.ReactNode;
	ariaLabel?: string;
}

/**
 * Reusable modal component with backdrop, focus trap, and keyboard handling.
 *
 * Features:
 * - Click backdrop to close
 * - Escape key to close
 * - Focus trap (tab cycles within modal)
 * - Focus management (returns focus on close)
 * - Fade-in animation
 */
export function Modal({ isOpen, onClose, children, ariaLabel }: ModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const previousActiveElement = useRef<HTMLElement | null>(null);

	// Focus trap: cycle tab within modal
	useEffect(() => {
		if (!isOpen) return;

		const modal = modalRef.current;
		if (!modal) return;

		const handleTabKey = (e: KeyboardEvent) => {
			if (e.key !== "Tab") return;

			const focusableElements = modal.querySelectorAll<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			);
			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];

			if (e.shiftKey) {
				// Shift+Tab: wrap from first to last
				if (document.activeElement === firstElement) {
					e.preventDefault();
					lastElement?.focus();
				}
			} else {
				// Tab: wrap from last to first
				if (document.activeElement === lastElement) {
					e.preventDefault();
					firstElement?.focus();
				}
			}
		};

		document.addEventListener("keydown", handleTabKey);
		return () => document.removeEventListener("keydown", handleTabKey);
	}, [isOpen]);

	// Escape key to close
	useEffect(() => {
		if (!isOpen) return;

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};

		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [isOpen, onClose]);

	// Focus management: save focus on open, restore on close
	useEffect(() => {
		if (!isOpen) return;

		// Save current focused element
		previousActiveElement.current = document.activeElement as HTMLElement;

		// Focus close button (or modal) after render
		closeButtonRef.current?.focus();

		// Prevent body scroll
		document.body.style.overflow = "hidden";

		return () => {
			// Restore focus and body scroll on close
			previousActiveElement.current?.focus();
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	// Don't render if not open
	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			onClick={onClose}
			aria-hidden="true"
		>
			{/* Backdrop - warmer with subtle gradient */}
			<div
				className="absolute inset-0 bg-gradient-to-br from-white/95 via-stone-50/95 to-stone-100/95 dark:from-stone-900/95 dark:via-stone-900/92 dark:to-stone-800/95 backdrop-blur-xl animate-modal-fade"
				aria-hidden="true"
			/>

			{/* Modal content */}
			<div
				ref={modalRef}
				className="relative z-10 animate-stamp-appear max-h-full overflow-auto"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-label={ariaLabel}
				tabIndex={-1}
			>
				{children}
			</div>
		</div>
	);
}
