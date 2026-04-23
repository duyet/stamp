import { useAuth, useClerk } from "@clerk/tanstack-react-start";

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
		<div className="p-1">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-stone-500">
						Output
					</p>
					<div className="mt-3 flex flex-wrap items-center gap-3">
						<Toggle
							checked={isPublic}
							onChange={onPublicChange}
							label="Public"
						/>
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
					<p className="mt-3 text-xs leading-5 text-stone-500">
						Public stamps can appear in the gallery. HD uses signed-in credits
						for a higher-detail render.
					</p>
				</div>
				<button
					type="submit"
					disabled={loading || disabled}
					className="inline-flex min-w-[190px] items-center justify-center gap-2 rounded-full bg-stone-950 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-30"
				>
					{loading ? (
						<>
							<LoadingSpinner size="sm" />
							Creating stamp...
						</>
					) : referenceImage ? (
						"Generate from photo"
					) : hd ? (
						"Generate HD (5 credits)"
					) : (
						"Generate stamp"
					)}
				</button>
			</div>
		</div>
	);
}
