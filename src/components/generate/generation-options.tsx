"use client";

import { useAuth, useClerk } from "@clerk/nextjs";

interface GenerationOptionsProps {
	isPublic: boolean;
	onPublicChange: (value: boolean) => void;
	hd: boolean;
	onHdChange: (value: boolean) => void;
	loading: boolean;
	disabled: boolean;
	referenceImage?: boolean;
}

export function GenerationOptions({
	isPublic,
	onPublicChange,
	hd,
	onHdChange,
	loading,
	disabled,
	referenceImage = false,
}: GenerationOptionsProps) {
	const { isSignedIn } = useAuth();
	const clerk = useClerk();

	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-4">
				<label className="flex items-center gap-1.5 cursor-pointer group">
					<input
						type="checkbox"
						checked={isPublic}
						onChange={(e) => onPublicChange(e.target.checked)}
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
							onHdChange(e.target.checked);
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
				disabled={loading || disabled}
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
				) : referenceImage ? (
					"Generate from photo"
				) : hd ? (
					"Generate HD (5 credits)"
				) : (
					"Generate"
				)}
			</button>
		</div>
	);
}
