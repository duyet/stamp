"use client";

import Image from "next/image";
import { useState } from "react";
import {
	EXAMPLE_PROMPTS,
	STAMP_STYLE_PRESETS,
	type StampStyle,
} from "@/lib/stamp-prompts";

interface GenerateFormProps {
	onGenerated?: (stamp: {
		id: string;
		imageUrl: string;
		prompt: string;
	}) => void;
}

export function GenerateForm({ onGenerated }: GenerateFormProps) {
	const [prompt, setPrompt] = useState("");
	const [style, setStyle] = useState<StampStyle>("vintage");
	const [isPublic, setIsPublic] = useState(true);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<{
		id: string;
		imageUrl: string;
		remaining: number;
		generationTimeMs?: number;
	} | null>(null);

	async function handleVisibilityChange(
		e: React.ChangeEvent<HTMLInputElement>,
	) {
		if (!result) return;
		const newValue = e.target.checked;
		setIsPublic(newValue);
		try {
			const res = await fetch(`/api/stamps/${result.id}/visibility`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isPublic: newValue }),
			});
			if (!res.ok) {
				setIsPublic(!newValue);
				setError("Failed to update visibility. Please try again.");
			}
		} catch {
			setIsPublic(!newValue);
			setError("Failed to update visibility. Please try again.");
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!prompt.trim()) return;

		setLoading(true);
		setError(null);
		setResult(null);

		try {
			const res = await fetch("/api/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ prompt: prompt.trim(), style, isPublic }),
			});

			const data = (await res.json()) as {
				id: string;
				imageUrl: string;
				prompt: string;
				enhancedPrompt?: string;
				remaining: number;
				generationTimeMs?: number;
				error?: string;
			};

			if (!res.ok) {
				setError(data.error || "Generation failed");
				return;
			}

			setResult(data);
			onGenerated?.(data);
		} catch {
			setError("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="max-w-3xl mx-auto">
			<form onSubmit={handleSubmit} className="space-y-8">
				{/* Prompt input */}
				<div>
					<textarea
						id="prompt"
						value={prompt}
						onChange={(e) => setPrompt(e.target.value)}
						placeholder="Describe your stamp — a mountain village at dawn, a cat reading by candlelight, wildflowers in a glass jar..."
						maxLength={500}
						rows={6}
						className="w-full px-4 py-4 sm:px-7 sm:py-6 rounded-2xl border border-neutral-200 bg-cream text-stamp-navy text-base sm:text-lg leading-relaxed sm:leading-loose placeholder:text-neutral-400/80 focus:border-stamp-navy/20 focus:ring-2 focus:ring-stamp-navy/5 outline-none transition resize-none"
						style={{ fontFamily: "var(--font-stamp)" }}
					/>
					<div className="flex items-center justify-between mt-2 px-2">
						<p className="text-xs text-neutral-400">{prompt.length}/500</p>
					</div>

					{/* Example prompts */}
					<div className="flex flex-wrap gap-2 mt-4">
						{EXAMPLE_PROMPTS.map((example) => (
							<button
								key={example}
								type="button"
								onClick={() => setPrompt(example)}
								className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full px-3 py-1.5 text-xs cursor-pointer transition"
							>
								{example}
							</button>
						))}
					</div>
				</div>

				{/* Style selector */}
				<fieldset>
					<legend
						className="block text-sm text-neutral-500 mb-3"
						style={{ fontFamily: "var(--font-stamp)" }}
					>
						Choose a style
					</legend>
					<div className="flex flex-wrap gap-2">
						{Object.entries(STAMP_STYLE_PRESETS).map(([key, preset]) => (
							<button
								key={key}
								type="button"
								onClick={() => setStyle(key as StampStyle)}
								className={`px-4 py-2 rounded-full text-sm transition ${
									style === key
										? "bg-stamp-navy text-white"
										: "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
								}`}
							>
								{preset.name}
							</button>
						))}
					</div>
				</fieldset>

				{/* Public toggle */}
				<label className="flex items-center gap-3 cursor-pointer">
					<input
						type="checkbox"
						checked={isPublic}
						onChange={(e) => setIsPublic(e.target.checked)}
						className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-200"
					/>
					<span className="text-sm text-neutral-500">
						Show in public collection
					</span>
				</label>

				{/* Submit */}
				<button
					type="submit"
					disabled={loading || !prompt.trim()}
					className="w-full py-4 px-6 bg-stamp-navy text-white rounded-xl font-medium text-base hover:bg-neutral-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
					style={{ fontFamily: "var(--font-stamp)" }}
				>
					{loading ? (
						<span className="flex items-center justify-center gap-2">
							<svg
								className="animate-spin h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
								role="img"
								aria-label="Loading"
							>
								<title>Loading</title>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								/>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
								/>
							</svg>
							Creating your stamp...
						</span>
					) : (
						"Generate Stamp"
					)}
				</button>
			</form>

			{/* Error */}
			{error && (
				<div className="mt-6 p-4 bg-stamp-red/5 border border-stamp-red/20 rounded-xl text-stamp-red text-sm">
					{error}
				</div>
			)}

			{/* Result */}
			{result && (
				<div className="mt-10 text-center">
					<div className="stamp-border inline-block">
						<Image
							src={result.imageUrl}
							alt={prompt}
							width={288}
							height={288}
							className="object-cover"
						/>
					</div>

					{/* Public collection toggle (post-generation) */}
					<label className="flex items-center justify-center gap-3 mt-5 cursor-pointer">
						<input
							type="checkbox"
							checked={isPublic}
							onChange={handleVisibilityChange}
							className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-200"
						/>
						<span className="text-sm text-neutral-500">
							Show in public collection
						</span>
					</label>

					<div className="mt-4 flex justify-center gap-3">
						<a
							href={result.imageUrl}
							download={`stamp-${result.id}.png`}
							className="px-5 py-2.5 bg-stamp-navy text-white rounded-xl hover:bg-neutral-800 transition text-sm"
						>
							Download
						</a>
						<button
							type="button"
							onClick={() => {
								navigator.clipboard.writeText(
									`${window.location.origin}/api/stamps/${result.id}/image`,
								);
							}}
							className="px-5 py-2.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition text-sm"
						>
							Copy Link
						</button>
					</div>
					<p className="mt-4 text-xs text-neutral-400">
						{result.remaining} free generations remaining today
						{result.generationTimeMs && (
							<span className="ml-2 text-neutral-300">
								({(result.generationTimeMs / 1000).toFixed(1)}s)
							</span>
						)}
					</p>
				</div>
			)}
		</div>
	);
}
