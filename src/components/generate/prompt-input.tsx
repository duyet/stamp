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
		},
		ref,
	) => {
		const textareaRef = useRef<HTMLTextAreaElement>(null);
		const [activeGroupIndex, setActiveGroupIndex] = useState(0);
		const [isShaking, setIsShaking] = useState(false);

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

		const [shuffledPrompts, setShuffledPrompts] = useState<string[]>(() => {
			return getRandomPrompts(12);
		});

		// biome-ignore lint/correctness/useExhaustiveDependencies: activeGroupIndex used as trigger signal
		useEffect(() => {
			setShuffledPrompts(getRandomPrompts(8));
		}, [activeGroupIndex]);

		return (
			<div className="space-y-4">
				<div className="p-1">
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
								Prompt
							</p>
							<p className="mt-1 text-sm text-stone-600">
								{referenceImage
									? "Add extra direction for the uploaded image."
									: "Describe the scene, subject, or mood you want on the stamp."}
							</p>
						</div>
						<div className="shrink-0">
							<Show when="signed-out">
								<SignInButton mode="modal">
									<button
										type="button"
										className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-400 transition-colors hover:text-stone-700"
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
								referenceImage
									? "Example: turn this photo into a commemorative engraved stamp with a quiet coastal mood"
									: "Example: rainy Saigon alley with scooters, glowing windows, and a vintage blue engraving feel"
							}
							maxLength={500}
							rows={1}
							disabled={disabled}
							aria-label="Describe your stamp"
							aria-describedby="prompt-hint"
							className={`min-h-[128px] w-full resize-none overflow-hidden rounded-[1.3rem] bg-[rgba(255,255,255,0.8)] px-4 py-4 text-sm leading-7 text-stone-900 outline-none transition-all duration-200 placeholder:text-stone-400 focus:bg-white focus:ring-4 focus:ring-stone-900/5 disabled:opacity-50 ${
								isShaking ? "animate-shake" : ""
							}`}
						/>
					</div>

					<div className="mt-3 flex items-center justify-between text-xs text-stone-500">
						<span id="prompt-hint">
							{value.length > 0 && referenceImage
								? "Nice. This will be combined with your reference photo."
								: value.length > 0
									? "Ready to generate whenever you are."
									: "Start simple, then layer in place, texture, and mood."}
						</span>
						<span className="rounded-full bg-stone-100 px-2.5 py-1 tabular-nums text-stone-600">
							{value.length}/500
						</span>
					</div>
				</div>

				<div className="p-1">
					<div className="mb-3 flex items-center justify-between gap-3">
						<div>
							<p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-stone-500">
								Quick prompts
							</p>
							<p className="mt-1 text-sm text-stone-600">
								Use a suggestion as-is or stack a few together.
							</p>
						</div>
					</div>
					{PROMPT_GROUPS.length > 1 && (
						<div className="mb-3 flex items-center gap-2">
							{PROMPT_GROUPS.map((group, groupIndex) => (
								<button
									key={group.label ?? "default"}
									type="button"
									onClick={() => setActiveGroupIndex(groupIndex)}
									className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
										activeGroupIndex === groupIndex
											? "bg-stone-900 text-white"
											: "bg-white/80 text-stone-500 hover:bg-white hover:text-stone-700"
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
								className="shrink-0 rounded-full bg-[rgba(255,255,255,0.85)] px-3 py-1.5 text-xs text-stone-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-stone-900 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/20"
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
