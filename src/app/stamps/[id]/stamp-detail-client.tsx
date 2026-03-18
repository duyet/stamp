"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { RefreshIcon } from "@/components/icons";
import type { Stamp } from "@/db/schema";
import { useCopy } from "@/hooks/use-copy";
import { STAMP_STYLE_PRESETS } from "@/lib/stamp-prompts";

interface StampDetailClientProps {
	stamp: Stamp;
}

export function StampDetailClient({ stamp }: StampDetailClientProps) {
	const { copied, copy } = useCopy();
	const [regenerating, setRegenerating] = useState(false);
	const [currentStamp, setCurrentStamp] = useState(stamp);

	async function handleRegenerate() {
		setRegenerating(true);
		try {
			const res = await fetch("/api/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt: currentStamp.prompt,
					style: currentStamp.style,
					isPublic: currentStamp.isPublic,
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

			// Create new stamp object
			const newStamp: Stamp = {
				...currentStamp,
				id: data.id,
				imageUrl: data.imageUrl,
				createdAt: new Date(),
			};

			setCurrentStamp(newStamp);

			// Update URL to new stamp ID without page reload
			const newUrl = `/stamps/${data.id}`;
			window.history.replaceState({}, "", newUrl);
		} catch (err) {
			console.error("Failed to regenerate:", err);
		} finally {
			setRegenerating(false);
		}
	}

	const styleName =
		STAMP_STYLE_PRESETS[currentStamp.style as keyof typeof STAMP_STYLE_PRESETS]
			?.name || currentStamp.style;
	const shareUrl = typeof window !== "undefined" ? window.location.href : "";

	return (
		<div className="min-h-screen bg-stone-50">
			<div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 sm:py-16">
				{/* Back link */}
				<Link
					href="/collections"
					className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stamp-blue transition-colors mb-8"
				>
					← Back to collections
				</Link>

				<div className="grid md:grid-cols-2 gap-8 md:gap-12">
					{/* Stamp image */}
					<div className="relative">
						<div className="stamp-border stamp-modal-shadow">
							<div className="relative aspect-square">
								<Image
									src={currentStamp.imageUrl}
									alt={currentStamp.prompt}
									fill
									sizes="(max-width: 768px) 90vw, 448px"
									className="object-cover"
									priority
									unoptimized
								/>
							</div>
						</div>

						{/* Regenerate button */}
						<button
							type="button"
							onClick={handleRegenerate}
							disabled={regenerating}
							className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 border border-stone-200/80 rounded-lg text-sm hover:bg-stone-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
					</div>

					{/* Details */}
					<div className="flex flex-col">
						{/* Title/description */}
						<h1
							className="text-2xl sm:text-3xl font-bold text-stone-900 mb-4"
							style={{ fontFamily: "var(--font-stamp)" }}
						>
							{currentStamp.description || currentStamp.prompt}
						</h1>

						{currentStamp.description &&
							currentStamp.description !== currentStamp.prompt && (
								<p className="text-sm text-stone-500 mb-6">
									Prompt: {currentStamp.prompt}
								</p>
							)}

						{/* Style badge */}
						<div className="mb-6">
							<span className="inline-block text-xs tracking-wider uppercase text-stone-500 bg-stone-100/80 rounded-full px-3 py-1">
								{styleName}
							</span>
						</div>

						{/* Enhanced prompt */}
						{currentStamp.enhancedPrompt && (
							<details className="mb-6 group">
								<summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-stone-700 hover:text-stone-900 transition select-none list-none">
									<span className="transform transition-transform duration-200 group-open:rotate-90">
										▶
									</span>
									Enhanced prompt
								</summary>
								<p className="mt-3 text-sm text-stone-600 leading-relaxed bg-stone-50 rounded-lg p-4">
									{currentStamp.enhancedPrompt}
								</p>
							</details>
						)}

						{/* Metadata */}
						<div className="mb-8 text-sm text-stone-500">
							<p>
								Created: {new Date(currentStamp.createdAt).toLocaleDateString()}
							</p>
						</div>

						{/* Actions */}
						<div className="space-y-3 mt-auto">
							<a
								href={currentStamp.imageUrl}
								download={`stamp-${currentStamp.id}.png`}
								className="block w-full text-center px-6 py-3 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-all duration-200 shadow-sm"
							>
								Download Stamp
							</a>
							<button
								type="button"
								onClick={() => copy(shareUrl)}
								className="w-full px-6 py-3 text-stone-700 bg-stone-50 border border-stone-200/80 rounded-full font-medium hover:bg-stone-100 transition-all duration-200"
							>
								{copied ? "✓ Link copied!" : "Copy link"}
							</button>
							<Link
								href={`/generate?prompt=${encodeURIComponent(currentStamp.prompt)}&style=${currentStamp.style}`}
								className="block w-full text-center px-6 py-3 text-stamp-blue hover:text-stamp-blue/80 font-medium transition"
							>
								Create similar →
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
