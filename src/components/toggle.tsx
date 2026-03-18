/**
 * Reusable toggle switch component.
 * Used throughout the app for binary state toggles (HD mode, public/private, etc.).
 */
interface ToggleProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	label?: string;
	disabled?: boolean;
	id?: string;
	className?: string;
}

export function Toggle({
	checked,
	onChange,
	label,
	disabled = false,
	id,
	className = "",
}: ToggleProps) {
	return (
		<label
			htmlFor={id}
			className={`relative inline-flex items-center gap-2 cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
		>
			<input
				type="checkbox"
				id={id}
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
				disabled={disabled}
				className="peer sr-only"
			/>
			<div className="relative w-8 h-4 bg-stone-200 dark:bg-stone-700 rounded-full peer-checked:bg-stone-800 dark:peer-checked:bg-stone-500 transition-colors duration-200">
				<div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 peer-checked:translate-x-4 shadow-sm" />
			</div>
			{label && (
				<span className="text-sm text-stone-600 dark:text-stone-400">
					{label}
				</span>
			)}
		</label>
	);
}
