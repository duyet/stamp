import { useClerk } from "@clerk/tanstack-react-start";

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
	isSignedIn: boolean;
}

interface GenerationOptionsState {
	effectiveIsPublic: boolean;
	effectiveHd: boolean;
	publicDisabled: boolean;
	hdDisabled: boolean;
	description: string;
}

export function getGenerationOptionsState(
	isSignedIn: boolean,
	isPublic: boolean,
	hd: boolean,
): GenerationOptionsState {
	if (!isSignedIn) {
		return {
			effectiveIsPublic: true,
			effectiveHd: false,
			publicDisabled: true,
			hdDisabled: true,
			description:
				"Anonymous mode is public and standard quality only. Sign in to unlock HD and private editions.",
		};
	}

	return {
		effectiveIsPublic: isPublic,
		effectiveHd: hd,
		publicDisabled: false,
		hdDisabled: false,
		description:
			"Public editions can appear on the homepage wall. HD spends signed-in credits for a richer print.",
	};
}

export function GenerationOptions({
	isPublic,
	onPublicChange,
	hd,
	onHdChange,
	loading,
	disabled,
	referenceImage = false,
	isSignedIn,
}: GenerationOptionsProps) {
	const clerk = useClerk();
	const state = getGenerationOptionsState(isSignedIn, isPublic, hd);
	const hdChecked = state.effectiveHd;

	return (
		<div className="rounded-[1rem] border border-stone-200 bg-white p-4">
			<div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
				<div className="max-w-xl">
					<p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
						Output
					</p>
					<div className="mt-3 flex flex-wrap items-center gap-3">
						<Toggle
							checked={state.effectiveIsPublic}
							onChange={onPublicChange}
							label="Public"
							disabled={state.publicDisabled}
						/>
						<Toggle
							checked={hdChecked}
							onChange={(checked) => {
								if (!isSignedIn) {
									onHdChange(false);
									clerk.openSignIn();
									return;
								}
								onHdChange(checked);
							}}
							label="HD"
							disabled={state.hdDisabled}
						/>
					</div>
					<p className="mt-3 text-sm leading-6 text-stone-600">
						{state.description}
					</p>
				</div>
				<button
					type="submit"
					disabled={loading || disabled}
					className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-35 md:w-auto md:min-w-[220px]"
				>
					{loading ? (
						<>
							<LoadingSpinner size="sm" />
							Creating stamp...
						</>
					) : referenceImage ? (
						"Generate from photo"
					) : hdChecked ? (
						"Generate HD (5 credits)"
					) : (
						"Generate stamp"
					)}
				</button>
			</div>
		</div>
	);
}
