interface FilterOption<T extends string> {
	label: string;
	value: T;
}

interface StyleFilterChipsProps<T extends string> {
	options: readonly FilterOption<T>[];
	selectedValue: T;
	onChange?: (value: T) => void;
	getHref?: (value: T) => string;
	className?: string;
}

export function StyleFilterChips<T extends string>({
	options,
	selectedValue,
	onChange,
	getHref,
	className = "",
}: StyleFilterChipsProps<T>) {
	return (
		<div className={`flex flex-wrap gap-2 ${className}`}>
			{options.map((option) => {
				const isActive = option.value === selectedValue;
				const buttonClassName = `rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
					isActive
						? "border-stone-900 bg-stone-900 text-white shadow-[0_14px_30px_-24px_rgba(49,31,14,0.8)]"
						: "border-stone-300 bg-white/80 text-stone-700 hover:-translate-y-0.5 hover:border-stone-400 hover:bg-white"
				}`;

				if (getHref) {
					return (
						<a
							key={option.value}
							href={getHref(option.value)}
							className={buttonClassName}
							aria-current={isActive ? "page" : undefined}
							onClick={() => onChange?.(option.value)}
						>
							{option.label}
						</a>
					);
				}

				return (
					<button
						key={option.value}
						type="button"
						onClick={() => onChange?.(option.value)}
						className={buttonClassName}
					>
						{option.label}
					</button>
				);
			})}
		</div>
	);
}
