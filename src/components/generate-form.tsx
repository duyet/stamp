import { useAuth } from "@clerk/tanstack-react-start";
import { useCallback, useEffect, useRef, useState } from "react";

import { CREDITS_CHANGED_EVENT } from "@/components/credit-balance";
import { ImageUpload } from "@/components/image-upload";
import { useCopy } from "@/hooks/use-copy";
import { CREDITS_CHANGED_EVENT } from "@/lib/credit-events";
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
	style?: string;
	enhancedPrompt?: string;
	description?: string;
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
	initialPrompt?: string;
	initialStyle?: StampStyle;
}

export function GenerateForm({
	onGenerated,
	initialPrompt = "",
	initialStyle = "vintage",
}: GenerateFormProps) {
	const [prompt, setPrompt] = useState(initialPrompt);
	const [style, setStyle] = useState<StampStyle>(initialStyle);
	const [isPublic, setIsPublic] = useState(true);
	const { copied, copy } = useCopy();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isRateLimited, setIsRateLimited] = useState(false);
	const [resetAt, setResetAt] = useState<number | null>(null);
	const [countdown, setCountdown] = useState<number>(0);
	const { isSignedIn } = useAuth();
	const isAnonymous = isSignedIn !== true;
	const [hd, setHd] = useState(false);
	const [reference, setReference] = useState<string | null>(null);
	const [referenceResetToken, setReferenceResetToken] = useState(0);
	const [results, setResults] = useState<GeneratedStamp[]>([]);
	const promptInputRef = useRef<{ triggerError: () => void } | null>(null);

	// Reset HD when user signs out
	useEffect(() => {
		if (!isSignedIn) setHd(false);
	}, [isSignedIn]);

	useEffect(() => {
		setPrompt(initialPrompt);
	}, [initialPrompt]);

	useEffect(() => {
		setStyle(initialStyle);
	}, [initialStyle]);

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

	const handleVisibilityChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			if (isAnonymous) {
				setError(
					"Anonymous generations stay public. Sign in to create private editions.",
				);
				return;
			}
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
					throw new Error("Failed to update visibility");
				}
			} catch {
				setIsPublic(!newValue);
				setError("Failed to update visibility. Please try again.");
			}
		},
		[results, isAnonymous],
	);

	const handleSubmit = useCallback(async () => {
		// Validate: need either prompt or reference image
		if (!prompt.trim() && !reference) {
			promptInputRef.current?.triggerError();
			return;
		}

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
					isPublic: isAnonymous ? true : isPublic,
					hd: isAnonymous ? false : hd,
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
				style?: string;
				enhancedPrompt?: string;
				description?: string;
				code?: string;
			};

			if (!res.ok) {
				if (res.status === 429 && data.code !== "UPSTREAM_AI_LIMIT") {
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
				style: data.style,
				enhancedPrompt: data.enhancedPrompt,
				description: data.description,
				remaining: data.remaining ?? 0,
				generationTimeMs: data.generationTimeMs,
			};

			setResults([newStamp, ...results]);
			if (isPublic) {
				onGenerated?.({
					id: data.id,
					imageUrl: data.imageUrl,
					prompt,
					style: data.style ?? style,
					enhancedPrompt: data.enhancedPrompt,
					description: data.description,
				});
			}

			setReference(null);
			setReferenceResetToken((value) => value + 1);
			setResetAt(null); // Clear countdown on success
			window.dispatchEvent(new Event(CREDITS_CHANGED_EVENT));
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Something went wrong. Please try again.",
			);
		} finally {
			setLoading(false);
		}
	}, [
		prompt,
		style,
		isPublic,
		hd,
		reference,
		results,
		onGenerated,
		isAnonymous,
	]);

	return (
		<div className="w-full">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				className="grid gap-5 rounded-[1.25rem] border border-stone-200 bg-[#fffdf9] p-4 shadow-[0_22px_70px_-54px_rgba(61,43,24,0.55)] sm:p-5 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start"
			>
				<div className="space-y-5">
					<ImageUpload
						key={referenceResetToken}
						onSelected={(data) => {
							setReference(data ? data.referenceImageData : null);
							if (data && isSignedIn) {
								setHd(true);
							} else if (!isSignedIn) {
								setHd(false);
							}
						}}
						disabled={loading}
					/>

					<StyleSelector currentStyle={style} onStyleChange={setStyle} />
				</div>

				<div className="space-y-5">
					<PromptInput
						ref={promptInputRef}
						value={prompt}
						onChange={setPrompt}
						onStyleChange={setStyle}
						disabled={loading}
						loading={loading}
						referenceImage={!!reference}
					/>

					<GenerationOptions
						isPublic={isPublic}
						onPublicChange={setIsPublic}
						hd={hd}
						onHdChange={setHd}
						loading={loading}
						disabled={!prompt.trim() && !reference}
						referenceImage={!!reference}
						isSignedIn={isSignedIn === true}
					/>
				</div>
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
					onRetry={handleSubmit}
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
					canEditVisibility={!isAnonymous}
				/>
			)}
		</div>
	);
}
