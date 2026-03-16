"use client";

import Image from "next/image";
import { useEffect } from "react";
import type { Stamp } from "@/db/schema";

interface StampModalProps {
	stamp: Stamp;
	onClose: () => void;
}

export function StampModal({ stamp, onClose }: StampModalProps) {
	// Close on Escape key
	useEffect(() => {
		function handleKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		document.addEventListener("keydown", handleKey);
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", handleKey);
			document.body.style.overflow = "";
		};
	}, [onClose]);

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			onClick={onClose}
			onKeyDown={(e) => e.key === "Escape" && onClose()}
			role="dialog"
			aria-modal="true"
			aria-label={`Stamp: ${stamp.prompt}`}
		>
			{/* Backdrop */}
			<div className="absolute inset-0 bg-white/95 backdrop-blur-2xl" />

			{/* Stamp content */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: modal content area needs click stop */}
			<div
				className="relative max-w-lg w-full animate-stamp-appear"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
			>
				{/* Close button */}
				<button
					type="button"
					onClick={onClose}
					className="absolute -top-3 -right-3 z-10 w-9 h-9 bg-white rounded-full border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:border-neutral-300 transition text-lg leading-none"
					aria-label="Close"
				>
					&times;
				</button>

				{/* Stamp image with perforated border + shadow */}
				<div className="stamp-border stamp-modal-shadow">
					<div className="relative aspect-square">
						<Image
							src={stamp.imageUrl}
							alt={stamp.prompt}
							fill
							sizes="(max-width: 768px) 90vw, 512px"
							className="object-cover"
							priority
						/>
					</div>
				</div>

				{/* Stamp info */}
				<div className="mt-6 text-center">
					<p className="text-neutral-700 text-base">{stamp.prompt}</p>
					{stamp.enhancedPrompt && (
						<details className="mt-2 text-xs text-neutral-400">
							<summary className="cursor-pointer hover:text-neutral-600 transition">
								Enhanced prompt
							</summary>
							<p className="mt-1 text-left leading-relaxed">
								{stamp.enhancedPrompt}
							</p>
						</details>
					)}
					{stamp.style && (
						<p className="text-neutral-400 text-xs mt-1 capitalize">
							{stamp.style}
						</p>
					)}

					{/* Actions */}
					<div className="mt-4 flex justify-center gap-3">
						<a
							href={stamp.imageUrl}
							download={`stamp-${stamp.id}.png`}
							className="px-5 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition text-sm"
						>
							Download
						</a>
						<button
							type="button"
							onClick={() => {
								navigator.clipboard.writeText(
									`${window.location.origin}${stamp.imageUrl}`,
								);
							}}
							className="px-5 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition text-sm"
						>
							Copy Link
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
