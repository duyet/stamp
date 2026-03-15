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

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Prompt input */}
				<div>
					<label
						htmlFor="prompt"
						className="block text-lg font-medium text-stone-800 mb-2"
					>
						Describe your stamp
					</label>
					<textarea
						id="prompt"
						value={prompt}
						onChange={(e) => setPrompt(e.target.value)}
						placeholder="A girl with glasses and black hair, holding flowers..."
						maxLength={500}
						rows={3}
						className="w-full px-4 py-3 rounded-lg border-2 border-stone-300 bg-white/80 text-stone-800 placeholder:text-stone-400 focus:border-stamp-blue focus:ring-2 focus:ring-stamp-blue/20 outline-none transition resize-none font-sans"
					/>
					<p className="text-sm text-stone-500 mt-1">
						{prompt.length}/500 characters
					</p>

					{/* Example prompt pills */}
					<div className="flex flex-wrap gap-2 mt-3">
						{EXAMPLE_PROMPTS.map((example) => (
							<button
								key={example}
								type="button"
								onClick={() => setPrompt(example)}
								className="bg-white/60 text-stone-600 rounded-full border border-stone-200 hover:bg-white px-3 py-1.5 text-sm font-sans cursor-pointer transition"
							>
								{example}
							</button>
						))}
					</div>
				</div>

				{/* Style selector */}
				<fieldset>
					<legend className="block text-lg font-medium text-stone-800 mb-2">
						Style
					</legend>
					<div className="flex flex-wrap gap-2">
						{Object.entries(STAMP_STYLE_PRESETS).map(([key, preset]) => (
							<button
								key={key}
								type="button"
								onClick={() => setStyle(key as StampStyle)}
								className={`px-4 py-2 rounded-full text-sm transition font-sans ${
									style === key
										? "bg-stamp-navy text-white"
										: "bg-white/60 text-stone-700 hover:bg-white border border-stone-300"
								}`}
							>
								{preset.name}
							</button>
						))}
					</div>
				</fieldset>

				{/* Public toggle */}
				<label className="flex items-center gap-3 cursor-pointer font-sans">
					<input
						type="checkbox"
						checked={isPublic}
						onChange={(e) => setIsPublic(e.target.checked)}
						className="w-5 h-5 rounded border-stone-300 text-stamp-blue focus:ring-stamp-blue/20"
					/>
					<span className="text-stone-700">Show in public collection</span>
				</label>

				{/* Submit */}
				<button
					type="submit"
					disabled={loading || !prompt.trim()}
					className="w-full py-3 px-6 bg-stamp-navy text-white rounded-lg font-sans font-medium text-lg hover:bg-stamp-blue transition disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? (
						<span className="flex items-center justify-center gap-2">
							<svg
								className="animate-spin h-5 w-5"
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
				<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-sans">
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
					<label className="flex items-center justify-center gap-3 mt-4 cursor-pointer font-sans">
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
							className="w-5 h-5 rounded border-stone-300 text-stamp-blue focus:ring-stamp-blue/20"
						/>
						<span className="text-stone-700">Show in public collection</span>
					</label>

					<div className="mt-4 flex justify-center gap-3 font-sans">
						<a
							href={result.imageUrl}
							download={`stamp-${result.id}.png`}
							className="px-4 py-2 bg-stamp-green text-white rounded-lg hover:opacity-90 transition text-sm"
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
							className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition text-sm"
						>
							Copy Link
						</button>
					</div>
					<p className="mt-3 text-sm text-stone-500 font-sans">
						{result.remaining} free generations remaining today
					</p>
				</div>
			)}
		</div>
	);
}
