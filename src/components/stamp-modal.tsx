"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FOCUSABLE_SELECTOR } from "@/constants/a11y";
import type { Stamp } from "@/db/schema";
import { useCopy } from "@/hooks/use-copy";
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
	const [regenerating, setRegenerating] = useState(false);
	const [regenerateError, setRegenerateError] = useState<string | null>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const modalRef = useRef<HTMLDivElement>(null);
	const focusableElementsRef = useRef<HTMLElement[]>([]);

	async function handleRegenerate() {
		if (!onRegenerate) return;

		setRegenerating(true);
		setRegenerateError(null);

		try {
			const res = await fetch("/api/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt: stamp.prompt,
					style: stamp.style,
					isPublic: stamp.isPublic,
					timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				}),
			});

			const data = (await res.json()) as {
				id?: string;
				imageUrl?: string;
				error?: string;
			};

			if (!res.ok) {
				throw new Error(data.error ?? "Regeneration failed");
			}

			if (!data.id || !data.imageUrl) {
				throw new Error("Invalid response from server");
			}

			// Create new stamp object with updated data
			const newStamp: Stamp = {
				...stamp,
				id: data.id,
				imageUrl: data.imageUrl,
				createdAt: new Date(),
			};

			onRegenerate(newStamp);
		} catch (err) {
			setRegenerateError(
				err instanceof Error ? err.message : "Failed to regenerate stamp",
			);
		} finally {
			setRegenerating(false);
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

		// Prevent body scroll
		document.body.style.overflow = "hidden";

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
			<div
				ref={modalRef}
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
					<div className="flex justify-center gap-2 flex-wrap">
						{onRegenerate && (
							<button
								type="button"
								onClick={handleRegenerate}
								disabled={regenerating}
								className="inline-flex items-center gap-2 px-5 py-2 bg-stone-100 text-stone-700 border border-stone-200/80 rounded-full text-sm hover:bg-stone-200 hover:border-stone-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{regenerating ? (
									<>
										<svg
											className="animate-spin h-3.5 w-3.5"
											viewBox="0 0 24 24"
											fill="none"
											aria-hidden="true"
										>
											<title>Regenerating</title>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth={4}
											/>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 8 2.627 8 5.92v10.16c0 3.293 2.627 6 5.92 6h5.086c3.355 0 6.082-2.627 6.082-6V12c0-3.293-2.627-6-5.92-6h-4zm2 8a2 2 0 100-4 2 2v4a2 2 0 002 2h4a2 2 0 002-2v-4z"
											/>
										</svg>
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

					{/* Regenerate error */}
					{regenerateError && (
						<div
							role="alert"
							aria-live="polite"
							className="mx-auto max-w-sm p-2 bg-red-50 border border-red-200 rounded-lg text-xs"
						>
							<p className="text-red-700">{regenerateError}</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
