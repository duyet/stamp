"use client";

import {
	Show,
	SignInButton,
	UserButton,
	useAuth,
	useClerk,
} from "@clerk/nextjs";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckIcon, ClipboardIcon, DownloadIcon } from "@/components/icons";
import { useCopy } from "@/hooks/use-copy";
import {
	PROMPT_GROUPS,
	STAMP_STYLE_PRESETS,
	type StampStyle,
} from "@/lib/stamp-prompts";

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

function autoResize(el: HTMLTextAreaElement) {
	el.style.height = "auto";
	el.style.height = `${Math.max(56, el.scrollHeight)}px`;
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

	const [results, setResults] = useState<GeneratedStamp[]>([]);

	const latestResult = results[0] ?? null;

	const shuffledPrompts = useMemo(() => {
		const arr = [...PROMPT_GROUPS[activeGroupIndex].prompts];
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}, [activeGroupIndex]);

	async function handleVisibilityChange(
		e: React.ChangeEvent<HTMLInputElement>,
	) {
		if (!latestResult) return;
		const newValue = e.target.checked;
		setIsPublic(newValue);
		try {
			const res = await fetch(`/api/stamps/${latestResult.id}/visibility`, {
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
				}),
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

			setResults((prev) => [data, ...prev]);
			onGenerated?.({ ...data, style });
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
						className="w-full pl-4 pr-14 py-3 rounded-lg border border-stone-300 bg-white text-stone-900 text-sm leading-relaxed placeholder:text-stone-400 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 outline-none transition-all duration-200 resize-none overflow-hidden"
					/>
					{/* Auth button inside textarea row */}
					<div className="absolute right-3 top-3">
						<Show when="signed-out">
							<SignInButton mode="modal">
								<button
									type="button"
									className="text-xs text-stone-400 hover:text-stone-900 transition-colors"
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
									className={`rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition ${
										activeGroupIndex === groupIndex
											? "bg-stone-900 text-white"
											: "text-stone-500 hover:text-stone-700 hover:bg-stone-100"
									}`}
								>
									{group.label ?? "Ideas"}
								</button>
							))}
						</div>
					)}
					<div className="flex flex-wrap gap-1.5">
						{shuffledPrompts.map((example) => (
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
									const { style: groupStyle } = PROMPT_GROUPS[activeGroupIndex];
									if (groupStyle) setStyle(groupStyle);
								}}
								className="shrink-0 rounded-full px-3 py-1 text-xs text-stone-600 border border-stone-200 hover:text-stone-900 hover:border-stone-400 hover:bg-stone-50 cursor-pointer transition-colors duration-150"
							>
								{example}
							</button>
						))}
					</div>
				</div>

				{/* Style selector */}
				<div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
					{Object.entries(STAMP_STYLE_PRESETS).map(([key, preset]) => (
						<button
							key={key}
							type="button"
							onClick={() => setStyle(key as StampStyle)}
							className="shrink-0 cursor-pointer transition"
						>
							<div
								className={`w-12 h-12 transition-all duration-200 ${
									style === key
										? "ring-1 ring-stone-900 ring-offset-1"
										: "opacity-50 hover:opacity-80"
								}`}
							>
								<Image
									src={preset.thumbnail}
									alt={preset.name}
									width={48}
									height={48}
									className="object-cover w-full h-full"
									unoptimized
								/>
							</div>
							<p
								className={`text-[10px] mt-0.5 text-center transition-colors ${
									style === key
										? "text-stone-900 font-medium"
										: "text-stone-400"
								}`}
							>
								{preset.name}
							</p>
						</button>
					))}
				</div>

				{/* Actions row */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<label className="flex items-center gap-1.5 cursor-pointer group">
							<input
								type="checkbox"
								checked={isPublic}
								onChange={(e) => setIsPublic(e.target.checked)}
								className="w-3.5 h-3.5 rounded border-stone-300 text-stone-900 focus:ring-stone-900/20"
							/>
							<span className="text-xs text-stone-500 group-hover:text-stone-700 transition-colors">
								Public
							</span>
						</label>
						<label className="flex items-center gap-1.5 cursor-pointer group">
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
								className="w-3.5 h-3.5 rounded border-stone-300 text-stone-900 focus:ring-stone-900/20"
							/>
							<span className="text-xs text-stone-500 group-hover:text-stone-700 transition-colors">
								HD
							</span>
						</label>
					</div>
					<button
						type="submit"
						disabled={loading || !prompt.trim()}
						className="px-6 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 active:scale-[0.98] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
					>
						{loading ? (
							<span className="flex items-center gap-1.5">
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
						) : hd ? (
							"Generate HD (5 credits)"
						) : (
							"Generate"
						)}
					</button>
				</div>
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

			{/* Results — outside card, newest first, shown as a grid */}
			{results.length > 0 && (
				<div className="mt-10">
					{/* Controls for latest stamp */}
					<div className="text-center mb-4 space-y-2">
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
						<p className="text-xs text-stone-400">
							{latestResult?.remaining} remaining today
							{latestResult?.generationTimeMs && (
								<span className="ml-1">
									· {(latestResult.generationTimeMs / 1000).toFixed(1)}s
								</span>
							)}
						</p>
					</div>

					{/* Stamp grid — newest first */}
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
						{results.map((r, idx) => (
							<div
								key={r.id}
								className={`text-center ${idx === 0 ? "animate-stamp-appear" : ""}`}
							>
								<div className="stamp-border stamp-modal-shadow inline-block">
									<Image
										src={r.imageUrl}
										alt={r.prompt}
										width={256}
										height={256}
										className="object-cover"
										unoptimized
									/>
								</div>
								<div className="mt-2 flex justify-center gap-1.5">
									<a
										href={r.imageUrl}
										download={`stamp-${r.id}.png`}
										className="inline-flex items-center gap-1 px-3 py-1 bg-stamp-navy text-white rounded-full text-[10px] hover:bg-stone-800 transition"
									>
										<DownloadIcon />
										Download
									</a>
									<button
										type="button"
										onClick={() =>
											copy(`${window.location.origin}/api/stamps/${r.id}/image`)
										}
										className="inline-flex items-center gap-1 px-3 py-1 text-stone-600 bg-white border border-stone-200 rounded-full text-[10px] hover:bg-stone-50 transition"
									>
										{copied ? (
											<>
												<CheckIcon />
												Copied
											</>
										) : (
											<>
												<ClipboardIcon />
												Copy
											</>
										)}
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
