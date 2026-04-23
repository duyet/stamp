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
				{/* Textarea with auth button */}
				<div className="relative">
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
								? "Add extra instructions (optional)..."
								: "Describe your stamp..."
						}
						maxLength={500}
						rows={1}
						disabled={disabled}
						aria-label="Describe your stamp"
						aria-describedby="prompt-hint"
						className={`w-full pl-4 pr-14 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm leading-relaxed placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900/10 outline-none transition-all duration-200 resize-none overflow-hidden disabled:opacity-50 ${
							isShaking ? "animate-shake" : ""
						}`}
					/>
					<div className="absolute right-3 top-3">
						<Show when="signed-out">
							<SignInButton mode="modal">
								<button
									type="button"
									className="text-gray-300 hover:text-gray-500 transition-colors"
									aria-label="Sign in"
								>
									<AvatarIcon />
								</button>
							</SignInButton>
						</Show>
						<Show when="signed-in">
							<UserButton appearance={{ elements: { avatarBox: "w-6 h-6" } }} />
						</Show>
					</div>
				</div>
				{/* Character counter and hint */}
				<div className="flex items-center justify-between text-xs text-gray-400">
					<span id="prompt-hint">
						{value.length > 0 && referenceImage
							? "Add details to enhance your photo"
							: value.length > 0
								? "Great! Press Enter or click Generate"
								: "Be creative or pick a suggestion below"}
					</span>
					<span className="tabular-nums">{value.length}/500</span>
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
											? "bg-gray-900 text-white"
											: "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
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
								className="shrink-0 rounded-full px-3 py-1 text-xs text-gray-600 border border-gray-200 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 cursor-pointer transition-all duration-200 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/20 hover:scale-105"
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
