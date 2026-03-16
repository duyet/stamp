"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import {
	PROMPT_GROUPS,
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

function autoResize(el: HTMLTextAreaElement) {
	el.style.height = "auto";
	el.style.height = `${Math.max(56, el.scrollHeight)}px`;
}

export function GenerateForm({ onGenerated }: GenerateFormProps) {
	const [prompt, setPrompt] = useState("");
	const [style, setStyle] = useState<StampStyle>("vintage");
	const textareaRef = useRef<HTMLTextAreaElement>(null);
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
						ref={textareaRef}
						id="prompt"
						value={prompt}
						onChange={(e) => {
							setPrompt(e.target.value);
							autoResize(e.target);
						}}
						placeholder="Describe your stamp..."
						maxLength={500}
						rows={1}
						className="w-full px-4 py-4 sm:px-7 sm:py-5 rounded-2xl border border-stone-200 bg-cream text-stamp-navy text-base sm:text-lg leading-relaxed sm:leading-loose placeholder:text-stone-400 focus:border-stamp-navy/20 focus:ring-2 focus:ring-stamp-navy/5 outline-none transition-colors resize-none overflow-hidden"
						style={{ fontFamily: "var(--font-stamp)" }}
					/>
					<div className="flex items-center justify-between mt-2 px-2">
						<p className="text-xs text-stone-500">{prompt.length}/500</p>
					</div>

					{/* Prompt quick-picks */}
					{PROMPT_GROUPS.map((group) => (
						<div
							key={group.label ?? "default"}
							className={group.label ? "mt-3" : "mt-4"}
						>
							{group.label && (
								<p
									className="text-xs text-stone-500 mb-2 px-1"
									style={{ fontFamily: "var(--font-stamp)" }}
								>
									{group.label}
								</p>
							)}
							<div className="flex flex-wrap gap-2">
								{group.prompts.map((example) => (
									<button
										key={example}
										type="button"
										onClick={() => {
											setPrompt((prev) =>
												prev
													? `${prev.trimEnd()}, ${example.toLowerCase()}`
													: example,
											);
											requestAnimationFrame(() => {
												if (textareaRef.current)
													autoResize(textareaRef.current);
											});
											if (group.style) setStyle(group.style);
										}}
										className={`${group.className} ${group.hoverClassName} rounded-full px-3 py-1.5 text-xs cursor-pointer transition`}
									>
										{example}
									</button>
								))}
							</div>
						</div>
					))}
				</div>

				{/* Style selector */}
				<fieldset className="bg-stone-100 rounded-2xl p-5 sm:p-6">
					<legend
						className="text-xl font-semibold text-stamp-navy mb-1"
						style={{ fontFamily: "var(--font-stamp)" }}
					>
						Choose a style
					</legend>
					<p className="text-sm text-stone-500 mb-5">
						Each style gives your stamp a distinct look and feel.
					</p>
					<div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
						{Object.entries(STAMP_STYLE_PRESETS).map(([key, preset]) => (
							<button
								key={key}
								type="button"
								onClick={() => setStyle(key as StampStyle)}
								className={`group relative rounded-xl overflow-hidden transition cursor-pointer ${
									style === key
										? "ring-2 ring-stamp-navy ring-offset-2 ring-offset-stone-100"
										: "hover:ring-1 hover:ring-stone-300"
								}`}
							>
								<div className="bg-stone-200/80 p-3 pb-2">
									<div className="aspect-square rounded-lg overflow-hidden">
										<Image
											src={preset.thumbnail}
											alt={`${preset.name} style`}
											width={200}
											height={200}
											className="object-cover w-full h-full"
										/>
									</div>
									<p
										className={`mt-2 text-sm font-medium text-center ${
											style === key ? "text-stamp-navy" : "text-stone-700"
										}`}
									>
										{preset.name}
									</p>
								</div>
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
						className="w-4 h-4 rounded border-stone-300 text-neutral-900 focus:ring-neutral-200"
					/>
					<span className="text-sm text-stone-600">
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
							className="w-4 h-4 rounded border-stone-300 text-neutral-900 focus:ring-neutral-200"
						/>
						<span className="text-sm text-stone-600">
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
							className="px-5 py-2.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition text-sm"
						>
							Copy Link
						</button>
					</div>
					<p className="mt-4 text-xs text-stone-500">
						{result.remaining} free generations remaining today
						{result.generationTimeMs && (
							<span className="ml-2 text-stone-500">
								({(result.generationTimeMs / 1000).toFixed(1)}s)
							</span>
						)}
					</p>
				</div>
			)}
		</div>
	);
}
