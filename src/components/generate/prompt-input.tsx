"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
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

function autoResize(el: HTMLTextAreaElement) {
	el.style.height = "auto";
	el.style.height = `${Math.max(56, el.scrollHeight)}px`;
}

export function PromptInput({
	value,
	onChange,
	onStyleChange,
	disabled,
	loading,
	referenceImage = false,
}: PromptInputProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [activeGroupIndex, setActiveGroupIndex] = useState(0);

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
					className="w-full pl-4 pr-14 py-3 rounded-lg border border-stone-300 bg-white text-stone-900 text-sm leading-relaxed placeholder:text-stone-400 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 outline-none transition-all duration-200 resize-none overflow-hidden disabled:opacity-50"
				/>
				<div className="absolute right-3 top-3">
					<Show when="signed-out">
						<SignInButton mode="modal">
							<button
								type="button"
								className="text-stone-300 hover:text-stone-500 transition-colors"
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
							className="shrink-0 rounded-full px-3 py-1 text-xs text-stone-600 border border-stone-200 hover:text-stone-900 hover:border-stone-400 hover:bg-stone-50 cursor-pointer transition-colors duration-150 disabled:opacity-50"
						>
							{example}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
