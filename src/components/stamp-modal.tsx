"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { FOCUSABLE_SELECTOR } from "@/constants/a11y";
import type { Stamp } from "@/db/schema";
import { useCopy } from "@/hooks/use-copy";
import { useRegenerateStamp } from "@/hooks/use-regenerate-stamp";
import {
	CheckIcon,
	ChevronIcon,
	ClipboardIcon,
	CloseIcon,
	DownloadIcon,
	RefreshIcon,
} from "./icons";

interface StampModalProps {
	stamp: Stamp;
	onClose: () => void;
	onRegenerate?: (newStamp: Stamp) => void;
}

export function StampModal({ stamp, onClose, onRegenerate }: StampModalProps) {
	const { copied, copy } = useCopy();
	const {
		regenerate,
		regenerating,
		error: regenerateError,
	} = useRegenerateStamp();
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const modalRef = useRef<HTMLDivElement>(null);
	const focusableElementsRef = useRef<HTMLElement[]>([]);

	async function handleRegenerate() {
		if (!onRegenerate) return;

		try {
			const newStamp = await regenerate(stamp);
			onRegenerate(newStamp);
		} catch {
			// Error handled by hook
		}
	}

	useEffect(() => {
		// Focus close button when modal opens
		closeButtonRef.current?.focus();

		// Cache focusable elements once to avoid repeated DOM queries
		if (modalRef.current) {
			focusableElementsRef.current = Array.from(
				modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
			);
		}

		// Prevent body scroll — iOS-safe method
		// Store current scroll position to restore later
		const scrollY = window.scrollY;
		const bodyStyle = document.body.style;
		const originalOverflow = bodyStyle.overflow;
		const originalPosition = bodyStyle.position;

		// Apply iOS-compatible scroll lock
		bodyStyle.position = "fixed";
		bodyStyle.top = `-${scrollY}px`;
		bodyStyle.width = "100%";
		bodyStyle.overflow = "hidden";

		// Handle Escape key and Tab key for focus trap
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
				return;
			}

			// Focus trap for Tab key (uses cached focusable elements)
			if (e.key === "Tab") {
				const focusable = focusableElementsRef.current;
				if (focusable.length === 0) return;

				const firstFocusable = focusable[0];
				const lastFocusable = focusable[focusable.length - 1];

				if (e.target === firstFocusable && e.shiftKey) {
					e.preventDefault();
					lastFocusable?.focus();
				} else if (e.target === lastFocusable && !e.shiftKey) {
					e.preventDefault();
					firstFocusable?.focus();
				}
			}
		};

		document.addEventListener("keydown", handleKey);

		return () => {
			document.removeEventListener("keydown", handleKey);

			// Restore scroll position and body styles
			const scrollYBeforeRestore = -parseInt(bodyStyle.top || "0", 10);
			bodyStyle.position = originalPosition;
			bodyStyle.top = "";
			bodyStyle.width = "";
			bodyStyle.overflow = originalOverflow;

			// Restore scroll position after next paint
			requestAnimationFrame(() => {
				window.scrollTo(0, scrollYBeforeRestore);
			});
		};
	}, [onClose]);

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-0"
			onClick={onClose}
			onKeyDown={(e) => e.key === "Escape" && onClose()}
			role="dialog"
			aria-modal="true"
			aria-label={`Stamp: ${stamp.prompt}`}
		>
			{/* Backdrop - darker to hide background */}
			<div className="absolute inset-0 bg-stone-950/95 dark:bg-black/95 backdrop-blur-xl animate-modal-fade" />

			{/* Content - full screen overlay */}
			<div
				ref={modalRef}
				className="relative w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 animate-stamp-appear overflow-auto"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				role="document"
			>
				{/* Close - top right prominent */}
				<button
					ref={closeButtonRef}
					type="button"
					onClick={onClose}
					className="absolute top-4 right-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/90 dark:bg-stone-800/90 text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-white transition-all duration-200 shadow-lg"
					aria-label="Close modal"
				>
					<CloseIcon />
				</button>

				{/* Stamp image - responsive max size */}
				<div className="stamp-border stamp-modal-shadow max-w-full">
					<div className="relative aspect-square w-full max-w-[500px] max-h-[50vh]">
						<Image
							src={stamp.imageUrl}
							alt={stamp.prompt}
							fill
							sizes="(max-width: 768px) 90vw, 500px"
							className="object-cover"
							priority
							unoptimized
						/>
					</div>
				</div>

				{/* Info - scrollable on small screens */}
				<div className="mt-6 space-y-4 max-w-lg w-full px-4">
					{/* Description + style badge */}
					<div className="text-center space-y-2 px-2">
						<p
							className="text-stone-100 dark:text-stone-200 text-[15px] leading-relaxed"
							style={{ fontFamily: "var(--font-stamp)" }}
						>
							{stamp.description || stamp.prompt}
						</p>
						{stamp.description && stamp.description !== stamp.prompt && (
							<p className="text-[11px] text-stone-400 dark:text-stone-500">
								Prompt: {stamp.prompt}
							</p>
						)}
						{stamp.style && (
							<span className="inline-block text-[11px] tracking-wider uppercase text-stone-300 dark:text-stone-400 bg-white/10 dark:bg-white/5 rounded-full px-3 py-0.5">
								{stamp.style}
							</span>
						)}
					</div>

					{/* Enhanced prompt disclosure */}
					{stamp.enhancedPrompt && (
						<details className="group mx-auto max-w-sm">
							<summary className="flex items-center justify-center gap-1.5 cursor-pointer text-[11px] tracking-wider uppercase text-stone-400 dark:text-stone-500 hover:text-stone-200 dark:hover:text-stone-300 transition select-none list-none [&::-webkit-details-marker]:hidden">
								<ChevronIcon className="w-3 h-3 transition-transform duration-200 group-open:rotate-90" />
								Enhanced prompt
							</summary>
							<p className="mt-2 text-xs text-stone-300 dark:text-stone-400 leading-relaxed text-center px-2">
								{stamp.enhancedPrompt}
							</p>
						</details>
					)}

					{/* Divider */}
					<div className="border-t border-white/10 dark:border-white/5 mx-8" />

					{/* Actions */}
					<div className="flex justify-center gap-2 flex-wrap">
						{onRegenerate && (
							<button
								type="button"
								onClick={handleRegenerate}
								disabled={regenerating}
								className="inline-flex items-center gap-2 px-5 py-2 bg-white/10 dark:bg-white/5 text-stone-200 dark:text-stone-300 border border-white/20 dark:border-white/10 rounded-full text-sm hover:bg-white/20 dark:hover:bg-white/10 hover:border-white/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{regenerating ? (
									<>
										<LoadingSpinner size="sm" />
										Regenerating...
									</>
								) : (
									<>
										<RefreshIcon />
										Regenerate
									</>
								)}
							</button>
						)}
						<Link
							href={`/stamps/${stamp.id}`}
							className="inline-flex items-center gap-2 px-5 py-2 text-stone-200 dark:text-stone-300 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-full text-sm hover:bg-white/20 dark:hover:bg-white/10 hover:border-white/30 transition-all duration-200"
						>
							View page
						</Link>
						<a
							href={stamp.imageUrl}
							download={`stamp-${stamp.id}.png`}
							className="inline-flex items-center gap-2 px-5 py-2 bg-white dark:bg-stone-200 text-stone-900 dark:text-stone-900 rounded-full text-sm hover:bg-stone-100 dark:hover:bg-white transition-all duration-200 shadow-lg"
						>
							<DownloadIcon />
							Download
						</a>
						<button
							type="button"
							onClick={() => copy(`${window.location.origin}${stamp.imageUrl}`)}
							className="inline-flex items-center gap-2 px-5 py-2 text-stone-200 dark:text-stone-300 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-full text-sm hover:bg-white/20 dark:hover:bg-white/10 hover:border-white/30 transition-all duration-200"
						>
							{copied ? (
								<>
									<CheckIcon />
									Copied!
								</>
							) : (
								<>
									<ClipboardIcon />
									Copy Link
								</>
							)}
						</button>
					</div>

					{/* Regenerate error */}
					{regenerateError && (
						<div
							role="alert"
							aria-live="polite"
							className="mx-auto max-w-sm p-2 bg-red-900/30 dark:bg-red-900/50 border border-red-500/50 dark:border-red-700/50 rounded-lg text-xs"
						>
							<p className="text-red-200 dark:text-red-300">
								{regenerateError}
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
