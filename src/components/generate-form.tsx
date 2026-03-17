"use client";

import { useEffect, useState } from "react";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { ImageUpload } from "@/components/image-upload";
import { useCopy } from "@/hooks/use-copy";
import type { StampStyle } from "@/lib/stamp-prompts";
import { STAMP_STYLE_PRESETS } from "@/lib/stamp-prompts";
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
	const { isSignedIn } = useAuth();
	const [hd, setHd] = useState(false);
	const [reference, setReference] = useState<string | null>(null);
	const [results, setResults] = useState<GeneratedStamp[]>([]);

	// Reset HD when user signs out
	useEffect(() => {
		if (!isSignedIn) setHd(false);
	}, [isSignedIn]);

	async function handleVisibilityChange(e: React.ChangeEvent<HTMLInputElement>) {
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
			};

			if (!res.ok) {
				if (res.status === 429) setIsRateLimited(true);
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
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="max-w-2xl mx-auto">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				className="space-y-4"
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

			{/* Error */}
			{error && (
				<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs">
					<p className="text-red-700 font-medium">{error}</p>
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
