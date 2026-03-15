"use client";

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
	} | null>(null);

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
				remaining: number;
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
		<div className="max-w-2xl mx-auto">
			<form onSubmit={handleSubmit} className="space-y-5">
				{/* Prompt input */}
				<div>
					<label
						htmlFor="prompt"
						className="block text-sm font-medium text-neutral-700 mb-2"
					>
						Describe your stamp
					</label>
					<textarea
						id="prompt"
						value={prompt}
						onChange={(e) => setPrompt(e.target.value)}
						placeholder="A girl with glasses and black hair, holding flowers..."
						maxLength={500}
						rows={4}
						className="w-full px-5 py-4 rounded-xl border border-neutral-200 bg-white text-neutral-800 text-base placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 outline-none transition resize-none leading-relaxed"
					/>
					<p className="text-xs text-neutral-400 mt-1">
						{prompt.length}/500 characters
					</p>

					{/* Example prompt pills */}
					<div className="flex flex-wrap gap-2 mt-3">
						{EXAMPLE_PROMPTS.map((example) => (
							<button
								key={example}
								type="button"
								onClick={() => setPrompt(example)}
								className="bg-neutral-100 text-neutral-500 rounded-full hover:bg-neutral-200 px-3 py-1.5 text-xs cursor-pointer transition"
							>
								{example}
							</button>
						))}
					</div>
				</div>

				{/* Style selector */}
				<fieldset>
					<legend className="block text-sm font-medium text-neutral-700 mb-2">
						Style
					</legend>
					<div className="flex flex-wrap gap-2">
						{Object.entries(STAMP_STYLE_PRESETS).map(([key, preset]) => (
							<button
								key={key}
								type="button"
								onClick={() => setStyle(key as StampStyle)}
								className={`px-4 py-2 rounded-full text-sm transition ${
									style === key
										? "bg-neutral-900 text-white border border-neutral-900"
										: "bg-white text-neutral-700 hover:border-neutral-400 border border-neutral-200"
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
					<span className="text-sm text-neutral-600">
						Show in public collection
					</span>
				</label>

				{/* Submit */}
				<button
					type="submit"
					disabled={loading || !prompt.trim()}
					className="w-full py-3 px-6 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
				>
					{loading ? (
						<span className="flex items-center justify-center gap-2">
							<svg
								className="animate-spin h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
							>
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
				<div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
					{error}
				</div>
			)}

			{/* Result */}
			{result && (
				<div className="mt-8 text-center">
					<div className="stamp-border inline-block">
						<img
							src={result.imageUrl}
							alt={prompt}
							className="w-64 h-64 object-cover"
						/>
					</div>

					{/* Public collection toggle (post-generation) */}
					<label className="flex items-center justify-center gap-3 mt-4 cursor-pointer">
						<input
							type="checkbox"
							checked={isPublic}
							onChange={async (e) => {
								const newValue = e.target.checked;
								setIsPublic(newValue);
								await fetch(`/api/stamps/${result.id}/visibility`, {
									method: "PATCH",
									headers: { "Content-Type": "application/json" },
									body: JSON.stringify({ isPublic: newValue }),
								});
							}}
							className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-200"
						/>
						<span className="text-sm text-neutral-600">
							Show in public collection
						</span>
					</label>

					<div className="mt-4 flex justify-center gap-3">
						<a
							href={result.imageUrl}
							download={`stamp-${result.id}.png`}
							className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition text-sm"
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
							className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition text-sm"
						>
							Copy Link
						</button>
					</div>
					<p className="mt-3 text-xs text-neutral-400">
						{result.remaining} free generations remaining today
					</p>
				</div>
			)}
		</div>
	);
}
