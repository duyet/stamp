"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/image-upload";
import { useCopy } from "@/hooks/use-copy";
import type { StampStyle } from "@/lib/stamp-prompts";
import { GenerateError } from "./generate/generate-error";
import { GenerateLoading } from "./generate/generate-loading";
import { GenerationOptions } from "./generate/generation-options";
import { GenerationResults } from "./generate/generation-results";
import { PromptInput } from "./generate/prompt-input";
import { StyleSelector } from "./generate/style-selector";

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
			{loading && <GenerateLoading reference={!!reference} />}

			{/* Error */}
			{error && (
				<GenerateError
					error={error}
					isRateLimited={isRateLimited}
					countdown={countdown}
					isSignedIn={isSignedIn}
					onRetry={() => handleSubmit()}
					loading={loading}
				/>
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
