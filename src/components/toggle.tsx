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
			className={`relative inline-flex items-center gap-3 rounded-full bg-white/72 px-3 py-2 transition-colors ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-white"} ${className}`}
		>
			<input
				type="checkbox"
				id={id}
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
				disabled={disabled}
				className="peer sr-only"
			/>
			<div className="relative h-5 w-10 rounded-full bg-stone-200 transition-colors duration-200 peer-checked:bg-stone-900 peer-focus-visible:ring-2 peer-focus-visible:ring-stone-400 peer-focus-visible:ring-offset-2">
				<div className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200 peer-checked:translate-x-5" />
			</div>
			{label && (
				<span className="text-sm font-medium tracking-tight text-stone-700">
					{label}
				</span>
			)}
		</label>
	);
}
