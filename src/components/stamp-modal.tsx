"use client";

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
			{/* Blurred backdrop */}
			<div className="absolute inset-0 bg-white/70 backdrop-blur-xl" />

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
					className="absolute -top-3 -right-3 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-stone-500 hover:text-stone-800 transition font-sans text-xl"
					aria-label="Close"
				>
					&times;
				</button>

				{/* Stamp image with perforated border + shadow */}
				<div className="stamp-border stamp-modal-shadow">
					<img
						src={stamp.imageUrl}
						alt={stamp.prompt}
						className="w-full aspect-square object-cover"
					/>
				</div>

				{/* Stamp info */}
				<div className="mt-6 text-center font-sans">
					<p className="text-stone-700 italic text-lg">{stamp.prompt}</p>
					{stamp.style && (
						<p className="text-stone-400 text-sm mt-1 capitalize">
							{stamp.style}
						</p>
					)}

					{/* Actions */}
					<div className="mt-4 flex justify-center gap-3">
						<a
							href={stamp.imageUrl}
							download={`stamp-${stamp.id}.png`}
							className="px-5 py-2 bg-stamp-navy text-white rounded-lg hover:bg-stamp-blue transition text-sm"
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
							className="px-5 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition text-sm"
						>
							Copy Link
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
