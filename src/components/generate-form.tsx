"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { CheckIcon, ClipboardIcon, DownloadIcon } from "@/components/icons";
import { useCopy } from "@/hooks/use-copy";
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
	const [showMorePrompts, setShowMorePrompts] = useState(false);
	const { copied, copy } = useCopy();
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
			<form onSubmit={handleSubmit} className="space-y-5">
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
						className="w-full px-4 py-3 sm:px-5 sm:py-3.5 rounded-xl border border-stone-200 bg-cream text-stamp-navy text-sm sm:text-base leading-relaxed placeholder:text-stone-400 focus:border-stamp-navy/20 focus:ring-2 focus:ring-stamp-navy/5 outline-none transition-colors resize-none overflow-hidden"
						style={{ fontFamily: "var(--font-stamp)" }}
					/>
					<p className="text-[11px] text-stone-400 mt-1 px-1 text-right">
						{prompt.length}/500
					</p>

					{/* Prompt quick-picks */}
					{PROMPT_GROUPS.map((group, groupIndex) => {
						const isFirstGroup = groupIndex === 0;
						const visiblePrompts =
							!showMorePrompts && isFirstGroup
								? group.prompts.slice(0, 4)
								: group.prompts;

						if (!showMorePrompts && !isFirstGroup) return null;

						return (
							<div
								key={group.label ?? "default"}
								className={group.label ? "mt-2" : "mt-3"}
							>
								{group.label && (
									<p
										className="text-[11px] text-stone-400 mb-1.5 px-1"
										style={{ fontFamily: "var(--font-stamp)" }}
									>
										{group.label}
									</p>
								)}
								<div className="flex flex-wrap gap-1.5">
									{visiblePrompts.map((example) => (
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
											className={`${group.className} ${group.hoverClassName} rounded-full px-2.5 py-1 text-[11px] cursor-pointer transition`}
										>
											{example}
										</button>
									))}
									{isFirstGroup && !showMorePrompts && (
										<button
											type="button"
											onClick={() => setShowMorePrompts(true)}
											className="text-stone-400 hover:text-stone-600 rounded-full px-2.5 py-1 text-[11px] cursor-pointer transition border border-stone-200 hover:border-stone-300"
										>
											More ideas...
										</button>
									)}
								</div>
							</div>
						);
					})}
				</div>

				{/* Style selector */}
				<fieldset>
					<legend
						className="text-sm font-medium text-stamp-navy mb-3"
						style={{ fontFamily: "var(--font-stamp)" }}
					>
						Style
					</legend>
					<div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
						{Object.entries(STAMP_STYLE_PRESETS).map(([key, preset]) => (
							<button
								key={key}
								type="button"
								onClick={() => setStyle(key as StampStyle)}
								className={`group relative rounded-lg overflow-hidden transition cursor-pointer ${
									style === key
										? "ring-2 ring-stamp-navy ring-offset-1"
										: "hover:ring-1 hover:ring-stone-300"
								}`}
							>
								<div className="bg-stone-100 p-1.5 pb-1">
									<div className="aspect-square rounded overflow-hidden">
										<Image
											src={preset.thumbnail}
											alt={`${preset.name} style`}
											width={120}
											height={120}
											className="object-cover w-full h-full"
										/>
									</div>
									<p
										className={`mt-1 text-xs font-medium text-center ${
											style === key ? "text-stamp-navy" : "text-stone-500"
										}`}
									>
										{preset.name}
									</p>
								</div>
							</button>
						))}
					</div>
				</fieldset>

				{/* Submit row: toggle + button */}
				<div className="flex items-center justify-between gap-4">
					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							checked={isPublic}
							onChange={(e) => setIsPublic(e.target.checked)}
							className="w-3.5 h-3.5 rounded border-stone-300 text-neutral-900 focus:ring-neutral-200"
						/>
						<span className="text-xs text-stone-500">Public</span>
					</label>

					<button
						type="submit"
						disabled={loading || !prompt.trim()}
						className="px-8 py-2.5 bg-stamp-navy text-white rounded-lg font-medium text-sm hover:bg-neutral-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
						style={{ fontFamily: "var(--font-stamp)" }}
					>
						{loading ? (
							<span className="flex items-center gap-2">
								<svg
									className="animate-spin h-3.5 w-3.5"
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
								Creating...
							</span>
						) : (
							"Generate"
						)}
					</button>
				</div>
			</form>

			{/* Error */}
			{error && (
				<div className="mt-6 p-4 bg-stamp-red/5 border border-stamp-red/20 rounded-xl text-stamp-red text-sm">
					{error}
				</div>
			)}

			{/* Result */}
			{result && (
				<div className="mt-10 text-center animate-stamp-appear">
					<div className="stamp-border stamp-modal-shadow inline-block">
						<Image
							src={result.imageUrl}
							alt={prompt}
							width={288}
							height={288}
							className="object-cover"
						/>
					</div>

					<div className="mt-5 space-y-3">
						{/* Public collection toggle */}
						<label className="inline-flex items-center gap-3 cursor-pointer group">
							<div className="relative">
								<input
									type="checkbox"
									checked={isPublic}
									onChange={handleVisibilityChange}
									className="peer sr-only"
								/>
								<div className="w-9 h-5 bg-stone-200 rounded-full peer-checked:bg-stone-800 transition-colors duration-200" />
								<div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
							</div>
							<span className="text-sm text-stone-500 group-hover:text-stone-700 transition-colors">
								Show in public collection
							</span>
						</label>

						{/* Divider */}
						<div className="border-t border-stone-100 mx-12" />

						{/* Actions */}
						<div className="flex justify-center gap-2">
							<a
								href={result.imageUrl}
								download={`stamp-${result.id}.png`}
								className="inline-flex items-center gap-2 px-5 py-2 bg-stamp-navy text-white rounded-full text-sm hover:bg-stone-800 transition-all duration-200 shadow-sm"
							>
								<DownloadIcon />
								Download
							</a>
							<button
								type="button"
								onClick={() =>
									copy(
										`${window.location.origin}/api/stamps/${result.id}/image`,
									)
								}
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

						{/* Meta */}
						<p className="text-[11px] text-stone-400 tracking-wide">
							{result.remaining} remaining today
							{result.generationTimeMs && (
								<span className="ml-1.5">
									· {(result.generationTimeMs / 1000).toFixed(1)}s
								</span>
							)}
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
