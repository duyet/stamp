"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { Stamp } from "@/db/schema";
import { useCopy } from "@/hooks/use-copy";
import {
	CheckIcon,
	ChevronIcon,
	ClipboardIcon,
	CloseIcon,
	DownloadIcon,
} from "./icons";

interface StampModalProps {
	stamp: Stamp;
	onClose: () => void;
}

export function StampModal({ stamp, onClose }: StampModalProps) {
	const { copied, copy } = useCopy();
	const closeButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		// Focus close button when modal opens
		closeButtonRef.current?.focus();

		// Prevent body scroll
		document.body.style.overflow = "hidden";

		// Handle Escape key and Tab key for focus trap
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
				return;
			}

			// Focus trap for Tab key
			if (e.key === "Tab") {
				const modal = e.currentTarget as HTMLElement;
				const focusableElements =
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
				const focusable = Array.from(
					modal.querySelectorAll<HTMLElement>(focusableElements),
				);
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
			document.body.style.overflow = "";
		};
	}, [onClose]);

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
			onClick={onClose}
			onKeyDown={(e) => e.key === "Escape" && onClose()}
			role="dialog"
			aria-modal="true"
			aria-label={`Stamp: ${stamp.prompt}`}
		>
			{/* Backdrop */}
			<div className="absolute inset-0 bg-white/92 backdrop-blur-xl animate-modal-fade" />

			{/* Content */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: modal content area needs click stop */}
			<div
				className="relative max-w-md w-full animate-stamp-appear"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				role="document"
			>
				{/* Close */}
				<button
					ref={closeButtonRef}
					type="button"
					onClick={onClose}
					className="absolute -top-2 -right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700 transition-all duration-200"
					aria-label="Close modal"
				>
					<CloseIcon />
				</button>

				{/* Stamp image */}
				<div className="stamp-border stamp-modal-shadow">
					<div className="relative aspect-square">
						<Image
							src={stamp.imageUrl}
							alt={stamp.prompt}
							fill
							sizes="(max-width: 768px) 90vw, 448px"
							className="object-cover"
							priority
							unoptimized
						/>
					</div>
				</div>

				{/* Info */}
				<div className="mt-5 space-y-3">
					{/* Description + style badge */}
					<div className="text-center space-y-2 px-2">
						<p
							className="text-stone-800 text-[15px] leading-relaxed"
							style={{ fontFamily: "var(--font-stamp)" }}
						>
							{stamp.description || stamp.prompt}
						</p>
						{stamp.description && stamp.description !== stamp.prompt && (
							<p className="text-[11px] text-stone-400">
								Prompt: {stamp.prompt}
							</p>
						)}
						{stamp.style && (
							<span className="inline-block text-[11px] tracking-wider uppercase text-stone-500 bg-stone-100/80 rounded-full px-3 py-0.5">
								{stamp.style}
							</span>
						)}
					</div>

					{/* Enhanced prompt disclosure */}
					{stamp.enhancedPrompt && (
						<details className="group mx-auto max-w-sm">
							<summary className="flex items-center justify-center gap-1.5 cursor-pointer text-[11px] tracking-wider uppercase text-stone-500 hover:text-stone-700 transition select-none list-none [&::-webkit-details-marker]:hidden">
								<ChevronIcon className="w-3 h-3 transition-transform duration-200 group-open:rotate-90" />
								Enhanced prompt
							</summary>
							<p className="mt-2 text-xs text-stone-600 leading-relaxed text-center px-2">
								{stamp.enhancedPrompt}
							</p>
						</details>
					)}

					{/* Divider */}
					<div className="border-t border-stone-100 mx-8" />

					{/* Actions */}
					<div className="flex justify-center gap-2">
						<a
							href={stamp.imageUrl}
							download={`stamp-${stamp.id}.png`}
							className="inline-flex items-center gap-2 px-5 py-2 bg-stone-900 text-white rounded-full text-sm hover:bg-stone-800 transition-all duration-200 shadow-sm"
						>
							<DownloadIcon />
							Download
						</a>
						<button
							type="button"
							onClick={() => copy(`${window.location.origin}${stamp.imageUrl}`)}
							className="inline-flex items-center gap-2 px-5 py-2 text-stone-600 bg-stone-50 border border-stone-200/80 rounded-full text-sm hover:bg-stone-100 hover:border-stone-300 transition-all duration-200"
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
				</div>
			</div>
		</div>
	);
}
