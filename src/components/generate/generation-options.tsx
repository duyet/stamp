"use client";

import { useAuth, useClerk } from "@clerk/nextjs";

import { LoadingSpinner } from "@/components/loading-spinner";
import { Toggle } from "@/components/toggle";

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
				<Toggle checked={isPublic} onChange={onPublicChange} label="Public" />
				<Toggle
					checked={hd}
					onChange={(checked) => {
						if (!isSignedIn) {
							clerk.openSignIn();
							return;
						}
						onHdChange(checked);
					}}
					label="HD"
				/>
			</div>
			<button
				type="submit"
				disabled={loading || disabled}
				className="px-6 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg text-sm font-medium hover:bg-stone-800 dark:hover:bg-stone-200 active:scale-[0.98] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
			>
				{loading ? (
					<span className="flex items-center gap-1.5">
						<LoadingSpinner size="sm" />
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
