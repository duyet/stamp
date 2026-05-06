import { useAuth } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { RefreshIcon } from "@/components/icons";
import { LoadingSpinner } from "@/components/loading-spinner";
import { StampImage } from "@/components/stamp-image";
import type { PublicStamp } from "@/db/schema";
import { useCopy } from "@/hooks/use-copy";
import { useRegenerateStamp } from "@/hooks/use-regenerate-stamp";
import { formatDateShort } from "@/lib/date-utils";
import { normalizeStyle, STAMP_STYLE_PRESETS } from "@/lib/stamp-prompts";

interface StampDetailClientProps {
	stamp: PublicStamp;
}

export function StampDetailClient({
	stamp: initialStamp,
}: StampDetailClientProps) {
	const { isSignedIn } = useAuth();
	const { copied, copy } = useCopy();
	const { regenerate, regenerating } = useRegenerateStamp();
	const [displayStamp, setDisplayStamp] = useState(initialStamp);
	const [isEditingDescription, setIsEditingDescription] = useState(false);
	const [descriptionDraft, setDescriptionDraft] = useState(
		initialStamp.description || initialStamp.prompt,
	);
	const [descriptionError, setDescriptionError] = useState<string | null>(null);
	const [savingDescription, setSavingDescription] = useState(false);

	const canEditDescription = isSignedIn === true;

	async function handleRegenerate() {
		try {
			const newStamp = await regenerate(displayStamp);
			window.location.assign(`/stamps/${newStamp.id}`);
		} catch (err) {
			console.debug(
				"[StampDetail] Regenerate failed:",
				err instanceof Error ? err.message : String(err),
			);
		}
	}

	async function handleSaveDescription() {
		const description = descriptionDraft.trim();
		if (!description) {
			setDescriptionError("Description cannot be empty.");
			return;
		}

		setSavingDescription(true);
		setDescriptionError(null);

		try {
			const res = await fetch(`/api/stamps/${displayStamp.id}/description`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ description }),
			});

			if (!res.ok) {
				const data = (await res.json().catch(() => null)) as {
					error?: string;
				} | null;
				throw new Error(data?.error || "Failed to update description.");
			}

			const data = (await res.json()) as {
				stamp: { description: string };
			};
			setDisplayStamp((prev) => ({
				...prev,
				description: data.stamp.description,
			}));
			setDescriptionDraft(data.stamp.description);
			setIsEditingDescription(false);
		} catch (err) {
			setDescriptionError(
				err instanceof Error ? err.message : "Failed to update description.",
			);
		} finally {
			setSavingDescription(false);
		}
	}

	const styleName =
		STAMP_STYLE_PRESETS[displayStamp.style as keyof typeof STAMP_STYLE_PRESETS]
			?.name || displayStamp.style;
	const shareUrl = typeof window !== "undefined" ? window.location.href : "";

	return (
		<div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
			<Link
				to="/collections"
				className="inline-flex items-center gap-1.5 pt-6 text-xs font-medium uppercase tracking-[0.18em] text-stone-500 transition-colors hover:text-stone-950"
			>
				← Collections
			</Link>

			<div className="mt-5 grid gap-8 lg:grid-cols-[minmax(300px,1fr)_minmax(0,1fr)] lg:items-start">
				{/* Stamp image */}
				<div>
					<div className="stamp-border stamp-modal-shadow">
						<div className="relative aspect-square">
							<StampImage
								src={displayStamp.imageUrl}
								width={600}
								height={600}
								alt={displayStamp.prompt}
								className="absolute inset-0 h-full w-full object-cover"
							/>
						</div>
					</div>

					{/* Action bar under image */}
					<div className="mt-4 flex items-center gap-2">
						<a
							href={displayStamp.imageUrl}
							download={`stamp-${displayStamp.id}.png`}
							className="flex-1 rounded-full bg-stone-950 px-4 py-2.5 text-center text-sm font-medium text-white transition-all hover:bg-stone-800"
						>
							Download
						</a>
						<button
							type="button"
							onClick={() => copy(shareUrl)}
							className="rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition-all hover:border-stone-400 hover:text-stone-950"
						>
							{copied ? "Copied" : "Share"}
						</button>
						<button
							type="button"
							onClick={handleRegenerate}
							disabled={regenerating}
							className="rounded-full border border-stone-200 bg-white px-3 py-2.5 text-stone-600 transition-all hover:border-stone-400 hover:text-stone-950 disabled:opacity-50"
							title="Regenerate stamp"
						>
							{regenerating ? <LoadingSpinner size="sm" /> : <RefreshIcon />}
						</button>
					</div>
				</div>

				{/* Details */}
				<div className="space-y-5">
					{/* Style + date row */}
					<div className="flex items-center gap-3 text-xs text-stone-500">
						<span className="rounded-full bg-stone-100/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]">
							{styleName}
						</span>
						<span>{formatDateShort(displayStamp.createdAt)}</span>
					</div>

					{/* Title / description */}
					{isEditingDescription ? (
						<div className="space-y-3">
							<textarea
								value={descriptionDraft}
								onChange={(e) => setDescriptionDraft(e.target.value)}
								maxLength={200}
								rows={3}
								className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-base leading-7 text-stone-900 outline-none transition focus:border-stone-400"
								aria-label="Stamp description"
							/>
							{descriptionError ? (
								<p className="text-sm text-red-600">{descriptionError}</p>
							) : null}
							<div className="flex gap-2">
								<button
									type="button"
									onClick={handleSaveDescription}
									disabled={savingDescription}
									className="rounded-full bg-stone-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-50"
								>
									{savingDescription ? "Saving..." : "Save"}
								</button>
								<button
									type="button"
									onClick={() => {
										setDescriptionDraft(
											displayStamp.description || displayStamp.prompt,
										);
										setDescriptionError(null);
										setIsEditingDescription(false);
									}}
									disabled={savingDescription}
									className="rounded-full bg-stone-100 px-4 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-200 disabled:opacity-50"
								>
									Cancel
								</button>
							</div>
						</div>
					) : (
						<div>
							<h1 className="font-stamp text-2xl leading-snug text-stone-950 sm:text-3xl">
								{displayStamp.description || displayStamp.prompt}
							</h1>
							{canEditDescription && (
								<button
									type="button"
									onClick={() => setIsEditingDescription(true)}
									className="mt-2 text-xs font-medium text-stone-400 transition-colors hover:text-stone-700"
								>
									Edit
								</button>
							)}
						</div>
					)}

					{/* Original prompt (if different from description) */}
					{displayStamp.description &&
						displayStamp.description !== displayStamp.prompt && (
							<p className="text-sm leading-6 text-stone-500">
								{displayStamp.prompt}
							</p>
						)}

					{/* Enhanced prompt */}
					{displayStamp.enhancedPrompt && (
						<details className="group">
							<summary className="flex cursor-pointer items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-stone-400 transition hover:text-stone-700 select-none list-none">
								<span className="transition-transform duration-200 group-open:rotate-90">
									▶
								</span>
								Full prompt
							</summary>
							<p className="mt-2 rounded-lg bg-stone-50 p-3 text-xs leading-5 text-stone-500">
								{displayStamp.enhancedPrompt}
							</p>
						</details>
					)}

					{/* Create similar */}
					<div className="pt-2">
						<Link
							to="/generate"
							search={{
								prompt: displayStamp.prompt,
								style: normalizeStyle(displayStamp.style),
							}}
							className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-950"
						>
							Create similar →
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
