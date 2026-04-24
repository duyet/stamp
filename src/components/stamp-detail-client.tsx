import { useAuth } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { RefreshIcon } from "@/components/icons";
import { LoadingSpinner } from "@/components/loading-spinner";
import { StampImage } from "@/components/stamp-image";
import type { PublicStamp } from "@/db/schema";
import { useCopy } from "@/hooks/use-copy";
import { useRegenerateStamp } from "@/hooks/use-regenerate-stamp";
import { formatDateLong } from "@/lib/date-utils";
import { STAMP_STYLE_PRESETS } from "@/lib/stamp-prompts";

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

			const newUrl = `/stamps/${newStamp.id}`;
			window.location.assign(newUrl);
		} catch (err) {
			// Error displayed by useRegenerateStamp hook
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
		<div className="min-h-screen bg-stone-50">
			<div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 sm:py-16">
				{/* Back link */}
				<Link
					to="/collections"
					className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stamp-blue transition-colors mb-8"
				>
					← Back to collections
				</Link>

				<div className="grid md:grid-cols-2 gap-8 md:gap-12">
					{/* Stamp image */}
					<div className="relative">
						<div className="stamp-border stamp-modal-shadow">
							<div className="relative aspect-square">
								<StampImage
									src={displayStamp.imageUrl}
									width={500}
									height={500}
									alt={displayStamp.prompt}
									className="object-cover w-full h-full absolute inset-0"
								/>
							</div>
						</div>

						{/* Regenerate button */}
						<button
							type="button"
							onClick={handleRegenerate}
							disabled={regenerating}
							className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 border border-stone-200/80 rounded-lg text-sm hover:bg-stone-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{regenerating ? (
								<>
									<LoadingSpinner size="sm" />
									Regenerating...
								</>
							) : (
								<>
									<RefreshIcon />
									Regenerate
								</>
							)}
						</button>
					</div>

					{/* Details */}
					<div className="flex flex-col">
						<div className="mb-4">
							{isEditingDescription ? (
								<div className="space-y-3">
									<textarea
										value={descriptionDraft}
										onChange={(e) => setDescriptionDraft(e.target.value)}
										maxLength={200}
										rows={3}
										className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-base leading-6 text-stone-900 outline-none transition focus:border-stone-400"
										aria-label="Stamp description"
									/>
									{descriptionError ? (
										<p className="text-sm text-red-600">{descriptionError}</p>
									) : null}
									<div className="flex flex-wrap gap-2">
										<button
											type="button"
											onClick={handleSaveDescription}
											disabled={savingDescription}
											className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-50"
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
											className="rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-200 disabled:opacity-50"
										>
											Cancel
										</button>
									</div>
								</div>
							) : (
								<div className="space-y-3">
									<h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-stamp">
										{displayStamp.description || displayStamp.prompt}
									</h1>
									{canEditDescription ? (
										<button
											type="button"
											onClick={() => setIsEditingDescription(true)}
											className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-950"
										>
											Edit description
										</button>
									) : null}
								</div>
							)}
						</div>

						{displayStamp.description &&
							displayStamp.description !== displayStamp.prompt && (
								<p className="text-sm text-stone-500 mb-6">
									Prompt: {displayStamp.prompt}
								</p>
							)}

						{/* Style badge */}
						<div className="mb-6">
							<span className="inline-block text-xs tracking-wider uppercase text-stone-500 bg-stone-100/80 rounded-full px-3 py-1">
								{styleName}
							</span>
						</div>

						{/* Enhanced prompt */}
						{displayStamp.enhancedPrompt && (
							<details className="mb-6 group">
								<summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-stone-700 hover:text-stone-900 transition select-none list-none">
									<span className="transform transition-transform duration-200 group-open:rotate-90">
										▶
									</span>
									Enhanced prompt
								</summary>
								<p className="mt-3 text-sm text-stone-600 leading-relaxed bg-stone-50 rounded-lg p-4">
									{displayStamp.enhancedPrompt}
								</p>
							</details>
						)}

						{/* Metadata */}
						<div className="mb-8 text-sm text-stone-500">
							<p>Created: {formatDateLong(displayStamp.createdAt)}</p>
						</div>

						{/* Actions */}
						<div className="space-y-3 mt-auto">
							<a
								href={displayStamp.imageUrl}
								download={`stamp-${displayStamp.id}.png`}
								className="block w-full text-center px-6 py-3 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-all duration-200"
							>
								Download Stamp
							</a>
							<button
								type="button"
								onClick={() => copy(shareUrl)}
								className="w-full px-6 py-3 text-stone-700 bg-stone-50 border border-stone-200/80 rounded-full font-medium hover:bg-stone-100 transition-all duration-200"
							>
								{copied ? "✓ Link copied!" : "Copy link"}
							</button>
							<a
								href={`/generate?prompt=${encodeURIComponent(displayStamp.prompt)}&style=${displayStamp.style}`}
								className="block w-full text-center px-6 py-3 text-stamp-blue hover:text-stamp-blue/80 font-medium transition"
							>
								Create similar →
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
