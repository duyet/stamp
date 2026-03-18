"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/image-upload";
import { useCopy } from "@/hooks/use-copy";
import type { StampStyle } from "@/lib/stamp-prompts";
import { GenerationOptions } from "./generate/generation-options";
import { GenerationResults } from "./generate/generation-results";
import { PromptInput } from "./generate/prompt-input";
import { StyleSelector } from "./generate/style-selector";

/**
 * Format countdown milliseconds to HH:MM:SS or MM:SS
 */
function formatCountdown(ms: number): string {
	const totalSeconds = Math.ceil(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	}
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

interface GeneratedStamp {
	id: string;
	imageUrl: string;
	prompt: string;
	remaining: number;
	generationTimeMs?: number;
}

interface GenerateFormProps {
	onGenerated?: (stamp: {
		id: string;
		imageUrl: string;
		prompt: string;
		style?: string;
		enhancedPrompt?: string;
		description?: string;
	}) => void;
}

export function GenerateForm({ onGenerated }: GenerateFormProps) {
	const [prompt, setPrompt] = useState("");
	const [style, setStyle] = useState<StampStyle>("vintage");
	const [isPublic, setIsPublic] = useState(true);
	const { copied, copy } = useCopy();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isRateLimited, setIsRateLimited] = useState(false);
	const [resetAt, setResetAt] = useState<number | null>(null);
	const [countdown, setCountdown] = useState<number>(0);
	const { isSignedIn } = useAuth();
	const [hd, setHd] = useState(false);
	const [reference, setReference] = useState<string | null>(null);
	const [results, setResults] = useState<GeneratedStamp[]>([]);

	// Reset HD when user signs out
	useEffect(() => {
		if (!isSignedIn) setHd(false);
	}, [isSignedIn]);

	// Countdown timer for rate limit
	useEffect(() => {
		if (!resetAt) {
			setCountdown(0);
			return;
		}

		// Initial calculation
		const updateCountdown = () => {
			const remaining = Math.max(0, resetAt - Date.now());
			setCountdown(remaining);
			if (remaining === 0) {
				setResetAt(null);
				setIsRateLimited(false);
			}
		};

		updateCountdown();
		const interval = setInterval(updateCountdown, 1000);

		return () => clearInterval(interval);
	}, [resetAt]);

	async function handleVisibilityChange(
		e: React.ChangeEvent<HTMLInputElement>,
	) {
		if (!results[0]) return;
		const newValue = e.target.checked;
		setIsPublic(newValue);
		try {
			const res = await fetch(`/api/stamps/${results[0].id}/visibility`, {
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

	async function handleSubmit() {
		setLoading(true);
		setError(null);
		setIsRateLimited(false);

		try {
			const res = await fetch("/api/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt: prompt.trim(),
					style,
					isPublic,
					hd,
					timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
					...(reference && {
						referenceImageData: reference,
					}),
				}),
			});

			const data = (await res.json()) as {
				id?: string;
				imageUrl?: string;
				error?: string;
				remaining?: number;
				generationTimeMs?: number;
				resetAt?: number;
			};

			if (!res.ok) {
				if (res.status === 429) {
					setIsRateLimited(true);
					if (data.resetAt) {
						setResetAt(data.resetAt);
					}
				}
				throw new Error(data.error ?? "Generation failed");
			}

			if (!data.id || !data.imageUrl) {
				throw new Error("Invalid response from server");
			}

			const newStamp: GeneratedStamp = {
				id: data.id,
				imageUrl: data.imageUrl,
				prompt,
				remaining: data.remaining ?? 0,
				generationTimeMs: data.generationTimeMs,
			};

			setResults([newStamp, ...results]);
			onGenerated?.({
				id: data.id,
				imageUrl: data.imageUrl,
				prompt,
				style,
			});

			// Clear prompt after successful generation
			setPrompt("");
			setReference(null);
			setResetAt(null); // Clear countdown on success
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Something went wrong. Please try again.",
			);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="max-w-2xl mx-auto px-2 sm:px-0">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				className="space-y-5 sm:space-y-4"
			>
				{/* Reference image upload */}
				<ImageUpload
					onSelected={(data) => {
						setReference(data ? data.referenceImageData : null);
						// Auto-enable HD when reference is selected
						if (data && !hd) {
							setHd(true);
						}
					}}
					disabled={loading}
				/>

				{/* Prompt input with suggestions */}
				<PromptInput
					value={prompt}
					onChange={setPrompt}
					onStyleChange={setStyle}
					disabled={loading}
					loading={loading}
					referenceImage={!!reference}
				/>

				{/* Style selector */}
				<StyleSelector currentStyle={style} onStyleChange={setStyle} />

				{/* Actions row */}
				<GenerationOptions
					isPublic={isPublic}
					onPublicChange={setIsPublic}
					hd={hd}
					onHdChange={setHd}
					loading={loading}
					disabled={!prompt.trim() && !reference}
					referenceImage={!!reference}
				/>
			</form>

			{/* Loading skeleton */}
			{loading && (
				<div className="mt-6 p-6 bg-stone-50 rounded-xl border border-stone-200 animate-form-enter">
					<div className="flex items-center justify-center gap-3">
						<div className="animate-spin h-5 w-5 border-2 border-stone-900 border-t-transparent rounded-full" />
						<div className="text-sm text-stone-600">
							{reference ? "Analyzing your photo" : "Designing your stamp"}
							...
							<span className="block text-xs text-stone-400 mt-1">
								This takes 3-5 seconds
							</span>
						</div>
					</div>
				</div>
			)}

			{/* Error */}
			{error && (
				<div
					role="alert"
					aria-live="polite"
					className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
				>
					<div className="flex items-start justify-between gap-3">
						<div className="flex-1">
							<p className="text-sm text-red-700 font-medium">{error}</p>
							{isRateLimited && countdown > 0 && (
								<p className="mt-1 text-xs text-stone-500">
									Resets in {formatCountdown(countdown)}
								</p>
							)}
							{isRateLimited && !isSignedIn && (
								<div className="mt-2 pt-2 border-t border-red-100 flex items-center justify-between">
									<p className="text-stone-600">
										Sign in for 100 free stamps per day
									</p>
									<SignInButton mode="modal">
										<button
											type="button"
											className="px-3 py-1 bg-stone-900 text-white rounded text-xs font-medium hover:bg-stone-800 transition"
										>
											Sign in
										</button>
									</SignInButton>
								</div>
							)}
						</div>
						<button
							type="button"
							onClick={() => handleSubmit()}
							className="shrink-0 px-3 py-1.5 bg-stone-900 text-white text-xs font-medium rounded hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={loading || countdown > 0}
						>
							{loading
								? "Retrying..."
								: countdown > 0
									? "Wait..."
									: "Try again"}
						</button>
					</div>
				</div>
			)}

			{/* Results */}
			{results.length > 0 && (
				<GenerationResults
					results={results}
					remaining={results[0]?.remaining}
					generationTimeMs={results[0]?.generationTimeMs}
					copied={copied}
					onCopy={copy}
					onVisibilityChange={handleVisibilityChange}
					isPublic={isPublic}
				/>
			)}
		</div>
	);
}
