const iconProps = {
	width: 14,
	height: 14,
	viewBox: "0 0 14 14",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 1.5,
	strokeLinecap: "round" as const,
};

export function DownloadIcon() {
	return (
		<svg {...iconProps} aria-hidden="true">
			<path d="M7 2v8M4 7.5L7 10.5 10 7.5" />
			<path d="M2.5 12h9" />
		</svg>
	);
}

export function ClipboardIcon() {
	return (
		<svg {...iconProps} aria-hidden="true">
			<rect x="4.5" y="4.5" width="7" height="7" rx="1.5" />
			<path d="M9.5 4.5V3a1.5 1.5 0 00-1.5-1.5H3A1.5 1.5 0 001.5 3v5A1.5 1.5 0 003 9.5h1.5" />
		</svg>
	);
}

export function CheckIcon() {
	return (
		<svg {...iconProps} strokeLinejoin="round" aria-hidden="true">
			<path d="M3.5 7.5l2.5 2.5 4.5-5" />
		</svg>
	);
}

export function CloseIcon() {
	return (
		<svg {...iconProps} aria-hidden="true">
			<path d="M3 3l8 8M11 3l-8 8" />
		</svg>
	);
}

export function ChevronIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 12 12"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			aria-hidden="true"
		>
			<path d="M4.5 2.5l4 3.5-4 3.5" />
		</svg>
	);
}

export function UploadIcon() {
	return (
		<svg {...iconProps} aria-hidden="true">
			<path d="M7 10V2M4 4.5L7 1.5 10 4.5" />
			<path d="M2.5 12h9" />
		</svg>
	);
}

export function ImageIcon() {
	return (
		<svg {...iconProps} aria-hidden="true">
			<rect x="1.5" y="2.5" width="11" height="9" rx="1.5" />
			<circle cx="4.5" cy="5.5" r="1" />
			<path d="M1.5 9.5l3-3 2 2 3-3 3 3" />
		</svg>
	);
}

export function AvatarIcon() {
	return (
		<svg {...iconProps} aria-hidden="true">
			<path d="M7 1a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM3.5 9.5a3.5 3.5 0 00-3.5 3.5v1h14v-1a3.5 3.5 0 00-3.5-3.5h-7z" />
		</svg>
	);
}
