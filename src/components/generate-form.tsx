"use client";

import {
	Show,
	SignInButton,
	UserButton,
	useAuth,
	useClerk,
} from "@clerk/nextjs";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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
	el.style.height = `${Math.max(48, el.scrollHeight)}px`;
}

export function GenerateForm({ onGenerated }: GenerateFormProps) {
	const [prompt, setPrompt] = useState("");
	const [style, setStyle] = useState<StampStyle>("vintage");
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [isPublic, setIsPublic] = useState(true);
	const [activeGroupIndex, setActiveGroupIndex] = useState(0);
	const { copied, copy } = useCopy();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isRateLimited, setIsRateLimited] = useState(false);
	const { isSignedIn } = useAuth();
	const clerk = useClerk();
	const [hd, setHd] = useState(false);

	// Reset HD when user signs out
	useEffect(() => {
		if (!isSignedIn) setHd(false);
	}, [isSignedIn]);

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
		setIsRateLimited(false);

		try {
			const res = await fetch("/api/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ prompt: prompt.trim(), style, isPublic, hd }),
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
				setIsRateLimited(res.status === 429);
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
			<form onSubmit={handleSubmit} className="space-y-4">
				{/* Prompt + auth row */}
				<div className="relative">
					<textarea
						ref={textareaRef}
						id="prompt"
						value={prompt}
						onChange={(e) => {
							setPrompt(e.target.value);
							autoResize(e.target);
						}}
						onKeyDown={(e) => {
							if (
								e.key === "Enter" &&
								e.shiftKey &&
								prompt.trim() &&
								!loading
							) {
								e.preventDefault();
								handleSubmit(e);
							}
						}}
						placeholder="Describe your stamp..."
						maxLength={500}
						rows={1}
						className="w-full pl-4 pr-12 py-3 rounded-lg border border-stone-300 bg-white text-stamp-navy text-sm leading-relaxed placeholder:text-stone-400 focus:border-stamp-navy focus:ring-1 focus:ring-stamp-navy/10 outline-none transition resize-none overflow-hidden"
						style={{ fontFamily: "var(--font-stamp)" }}
					/>
					{/* Auth button inside textarea row */}
					<div className="absolute right-3 top-3">
						<Show when="signed-out">
							<SignInButton mode="modal">
								<button
									type="button"
									className="text-xs text-stone-400 hover:text-stamp-navy transition-colors"
								>
									Sign in
								</button>
							</SignInButton>
						</Show>
						<Show when="signed-in">
							<UserButton appearance={{ elements: { avatarBox: "w-6 h-6" } }} />
						</Show>
					</div>
				</div>

				{/* Prompt suggestions */}
				<div>
					{PROMPT_GROUPS.length > 1 && (
						<div className="flex items-center gap-1 mb-1.5">
							{PROMPT_GROUPS.map((group, groupIndex) => (
								<button
									key={group.label ?? "default"}
									type="button"
									onClick={() => setActiveGroupIndex(groupIndex)}
									className={`rounded px-2 py-0.5 text-[10px] font-medium cursor-pointer transition ${
										activeGroupIndex === groupIndex
											? "bg-stamp-navy text-white"
											: "text-stone-500 hover:text-stone-700 hover:bg-stone-100"
									}`}
								>
									{group.label ?? "Ideas"}
								</button>
							))}
						</div>
					)}
					<div className="flex gap-1 overflow-x-auto scrollbar-hide pb-0.5">
						{PROMPT_GROUPS[activeGroupIndex].prompts.map((example) => {
							const group = PROMPT_GROUPS[activeGroupIndex];
							return (
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
											if (textareaRef.current) autoResize(textareaRef.current);
										});
										if (group.style) setStyle(group.style);
									}}
									className="shrink-0 rounded px-2 py-0.5 text-[10px] text-stone-400 hover:text-stone-600 hover:bg-stone-50 cursor-pointer transition"
								>
									{example}
								</button>
							);
						})}
					</div>
				</div>

				{/* Styles + actions row */}
				<div className="flex items-end justify-between gap-4">
					{/* Style selector */}
					<div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
						{Object.entries(STAMP_STYLE_PRESETS).map(([key, preset]) => (
							<button
								key={key}
								type="button"
								onClick={() => setStyle(key as StampStyle)}
								className="shrink-0 cursor-pointer transition"
							>
								<div
									className={`w-10 h-10 rounded overflow-hidden transition ${
										style === key
											? "ring-2 ring-stamp-navy ring-offset-1"
											: "opacity-50 hover:opacity-80"
									}`}
								>
									<Image
										src={preset.thumbnail}
										alt={preset.name}
										width={40}
										height={40}
										className="object-cover w-full h-full"
										unoptimized
									/>
								</div>
								<p
									className={`text-[9px] mt-0.5 text-center ${
										style === key
											? "text-stamp-navy font-medium"
											: "text-stone-400"
									}`}
								>
									{preset.name}
								</p>
							</button>
						))}
					</div>

					{/* Submit + public toggle */}
					<div className="flex items-center gap-3 shrink-0">
						<label className="flex items-center gap-1.5 cursor-pointer">
							<input
								type="checkbox"
								checked={isPublic}
								onChange={(e) => setIsPublic(e.target.checked)}
								className="w-3 h-3 rounded border-stone-300 text-stamp-navy focus:ring-stamp-navy/20"
							/>
							<span className="text-[10px] text-stone-500">Public</span>
						</label>
						<label className="flex items-center gap-1.5 cursor-pointer">
							<input
								type="checkbox"
								checked={hd}
								onChange={(e) => {
									if (!isSignedIn) {
										e.preventDefault();
										clerk.openSignIn();
										return;
									}
									setHd(e.target.checked);
								}}
								className="w-3 h-3 rounded border-stone-300 text-stamp-navy focus:ring-stamp-navy/20"
							/>
							<span className="text-[10px] text-stone-500">HD</span>
						</label>
						<button
							type="submit"
							disabled={loading || !prompt.trim()}
							className="px-5 py-2 bg-stamp-navy text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
							style={{ fontFamily: "var(--font-stamp)" }}
						>
							{loading ? (
								<span className="flex items-center gap-1.5">
									<svg
										className="animate-spin h-3 w-3"
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
							) : hd ? (
								"Generate HD (5 credits)"
							) : (
								"Generate"
							)}
						</button>
					</div>
				</div>
			</form>

			{/* Error */}
			{error && (
				<div className="mt-4 p-3 bg-stamp-red/5 border border-stamp-red/15 rounded-lg text-xs">
					<p className="text-stamp-red">{error}</p>
					{isRateLimited && !isSignedIn && (
						<div className="mt-2 pt-2 border-t border-stamp-red/10 flex items-center justify-between">
							<p className="text-stone-600">
								Sign in for 100 free stamps per day
							</p>
							<SignInButton mode="modal">
								<button
									type="button"
									className="px-3 py-1 bg-stamp-navy text-white rounded text-xs font-medium hover:bg-stone-800 transition"
								>
									Sign in
								</button>
							</SignInButton>
						</div>
					)}
				</div>
			)}

			{/* Result */}
			{result && (
				<div className="mt-8 text-center animate-stamp-appear">
					<div className="stamp-border stamp-modal-shadow inline-block">
						<Image
							src={result.imageUrl}
							alt={prompt}
							width={256}
							height={256}
							className="object-cover"
							unoptimized
						/>
					</div>

					<div className="mt-4 space-y-2">
						{/* Public toggle */}
						<label className="inline-flex items-center gap-2 cursor-pointer group">
							<div className="relative">
								<input
									type="checkbox"
									checked={isPublic}
									onChange={handleVisibilityChange}
									className="peer sr-only"
								/>
								<div className="w-8 h-4 bg-stone-200 rounded-full peer-checked:bg-stone-800 transition-colors" />
								<div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
							</div>
							<span className="text-xs text-stone-500">Public collection</span>
						</label>

						{/* Actions */}
						<div className="flex justify-center gap-2">
							<a
								href={result.imageUrl}
								download={`stamp-${result.id}.png`}
								className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-stamp-navy text-white rounded-full text-xs hover:bg-stone-800 transition"
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
								className="inline-flex items-center gap-1.5 px-4 py-1.5 text-stone-600 bg-white border border-stone-200 rounded-full text-xs hover:bg-stone-50 transition"
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
						<p className="text-[10px] text-stone-400">
							{result.remaining} remaining today
							{result.generationTimeMs && (
								<span className="ml-1">
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
