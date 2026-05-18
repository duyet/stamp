import { Show, SignInButton, UserButton } from "@clerk/tanstack-react-start";
import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import { AvatarIcon } from "@/components/icons";
import {
	getRandomPrompts,
	PROMPT_GROUPS,
	type StampStyle,
} from "@/lib/stamp-prompts";

interface PromptInputProps {
	value: string;
	onChange: (value: string) => void;
	onStyleChange?: (style: StampStyle) => void;
	disabled?: boolean;
	loading?: boolean;
	referenceImage?: boolean;
	style?: StampStyle;
}

export interface PromptInputRef {
	triggerError: () => void;
}

function autoResize(el: HTMLTextAreaElement) {
	el.style.height = "auto";
	el.style.height = `${Math.max(56, el.scrollHeight)}px`;
}

export const PromptInput = forwardRef<PromptInputRef, PromptInputProps>(
	(
		{
			value,
			onChange,
			onStyleChange,
			disabled,
			loading,
			referenceImage = false,
			style = "vintage",
		},
		ref,
	) => {
		const textareaRef = useRef<HTMLTextAreaElement>(null);
		const [activeGroupIndex, setActiveGroupIndex] = useState(0);
		const [isShaking, setIsShaking] = useState(false);
		const isLogoStyle = style === "logo";

		// Expose triggerError method to parent
		useImperativeHandle(
			ref,
			() => ({
				triggerError: () => {
					setIsShaking(true);
					setTimeout(() => setIsShaking(false), 400);
					// Focus textarea after a small delay to let shake start
					setTimeout(() => {
						textareaRef.current?.focus();
					}, 100);
				},
			}),
			[],
		);

		const [shuffledPrompts, setShuffledPrompts] = useState<string[]>(() =>
			getRandomPrompts(8),
		);

		useEffect(() => {
			setShuffledPrompts(
				activeGroupIndex === 0
					? getRandomPrompts(8)
					: [...PROMPT_GROUPS[activeGroupIndex].prompts],
			);
		}, [activeGroupIndex]);

		return (
			<div className="space-y-5">
				<div>
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
								Prompt
							</p>
							<p className="mt-1 text-sm leading-6 text-stone-600">
								{isLogoStyle && referenceImage
									? "Add optional art direction for the uploaded logo."
									: isLogoStyle
										? "Describe the logo mark, badge, or symbol you want on the stamp."
										: referenceImage
											? "Add extra direction for the uploaded image."
											: "Describe the scene, subject, or mood you want on the stamp."}
							</p>
						</div>
						<div className="shrink-0">
							<Show when="signed-out">
								<SignInButton mode="modal">
									<button
										type="button"
										className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 transition-colors hover:border-stone-400 hover:text-stone-900"
										aria-label="Sign in"
									>
										<AvatarIcon />
									</button>
								</SignInButton>
							</Show>
							<Show when="signed-in">
								<UserButton
									appearance={{ elements: { avatarBox: "w-10 h-10" } }}
								/>
							</Show>
						</div>
					</div>

					<div className="relative mt-4">
						<textarea
							ref={textareaRef}
							id="prompt"
							value={value}
							onChange={(e) => {
								onChange(e.target.value);
								autoResize(e.target);
							}}
							placeholder={
								isLogoStyle && referenceImage
									? "Example: keep the circular badge shape, use blue engraving lines, no readable letters"
									: isLogoStyle
										? "Example: a circular coffee badge with a mountain silhouette and bold black outlines"
										: referenceImage
											? "Example: turn this photo into a commemorative engraved stamp with a quiet coastal mood"
											: "Example: rainy Saigon alley with scooters, glowing windows, and a vintage blue engraving feel"
							}
							maxLength={500}
							rows={1}
							disabled={disabled}
							aria-label="Describe your stamp"
							aria-describedby="prompt-hint"
							className={`min-h-[178px] w-full resize-none overflow-hidden rounded-[1rem] border border-stone-200 bg-white px-5 py-4 text-base leading-8 text-stone-950 outline-none transition-all duration-200 placeholder:text-stone-400 focus:border-stone-500 focus:ring-4 focus:ring-stone-900/5 disabled:opacity-50 ${
								isShaking ? "animate-shake" : ""
							}`}
						/>
					</div>

					<div className="mt-3 flex items-center justify-between gap-3 text-sm text-stone-600">
						<span id="prompt-hint">
							{value.length > 0 && referenceImage
								? isLogoStyle
									? "Nice. This will be combined with your uploaded logo."
									: "Nice. This will be combined with your reference photo."
								: value.length > 0
									? "Ready to generate whenever you are."
									: isLogoStyle
										? "Start with the mark shape, then add palette and print texture."
										: "Start simple, then layer in place, texture, and mood."}
						</span>
						<span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 tabular-nums text-stone-600">
							{value.length}/500
						</span>
					</div>
				</div>

				<div>
					<div className="mb-3 flex items-center justify-between gap-3">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
								Quick prompts
							</p>
							<p className="mt-1 text-sm leading-6 text-stone-600">
								Use a suggestion as-is or stack a few together.
							</p>
						</div>
					</div>
					{PROMPT_GROUPS.length > 1 && (
						<div className="mb-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
							{PROMPT_GROUPS.map((group, groupIndex) => (
								<button
									key={group.label ?? "default"}
									type="button"
									onClick={() => setActiveGroupIndex(groupIndex)}
									className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
										activeGroupIndex === groupIndex
											? "bg-stone-900 text-white"
											: "border border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:text-stone-900"
									}`}
								>
									{group.label ?? "Ideas"}
								</button>
							))}
						</div>
					)}
					<div className="flex flex-wrap gap-2">
						{shuffledPrompts.map((example) => (
							<button
								key={example}
								type="button"
								onClick={() => {
									onChange(
										value
											? `${value.trimEnd()}, ${example.toLowerCase()}`
											: example,
									);
									requestAnimationFrame(() => {
										if (textareaRef.current) autoResize(textareaRef.current);
									});
									const { style: groupStyle } = PROMPT_GROUPS[activeGroupIndex];
									if (groupStyle && onStyleChange) {
										onStyleChange(groupStyle);
									}
								}}
								disabled={loading}
								className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-400 hover:text-stone-950 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/20"
							>
								{example}
							</button>
						))}
					</div>
				</div>
			</div>
		);
	},
);

PromptInput.displayName = "PromptInput";
