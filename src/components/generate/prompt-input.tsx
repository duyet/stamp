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
					aria-describedby="prompt-hint"
					className="w-full pl-4 pr-14 py-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm leading-relaxed placeholder:text-stone-400 dark:placeholder:text-stone-600 focus:border-stone-900 dark:focus:border-stone-500 focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-stone-500/20 outline-none transition-all duration-200 resize-none overflow-hidden disabled:opacity-50 shadow-sm focus:shadow-md"
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
			{/* Character counter and hint */}
			<div className="flex items-center justify-between text-xs text-stone-400 dark:text-stone-500">
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
										? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-md"
										: "text-stone-500 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
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
							className="shrink-0 rounded-full px-3 py-1 text-xs text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:text-stone-900 dark:hover:text-stone-100 hover:border-stone-400 dark:hover:border-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer transition-all duration-200 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/20 dark:focus-visible:ring-stone-500/20 hover:scale-105 hover:shadow-sm"
						>
							{example}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
