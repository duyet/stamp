"use client";

interface StampFanProps {
	/** Up to 3 image URLs from latest generated stamps */
	images?: string[];
}

/**
 * StampFan — 3 stamps stacked, fan out on hover.
 * Uses real generated stamp images when available, SVG placeholders otherwise.
 */
export function StampFan({ images = [] }: StampFanProps) {
	return (
		<div className="stamp-fan group cursor-pointer select-none" aria-hidden>
			<div className="stamp-fan-card stamp-fan-left">
				<div className="stamp-border">
					{images[0] ? (
						<img
							src={images[0]}
							alt=""
							className="w-full h-full object-cover"
						/>
					) : (
						<FallbackStamp color="#c8d6e5" />
					)}
				</div>
			</div>

			<div className="stamp-fan-card stamp-fan-center">
				<div className="stamp-border">
					{images[1] ? (
						<img
							src={images[1]}
							alt=""
							className="w-full h-full object-cover"
						/>
					) : (
						<FallbackStamp color="#d4a843" />
					)}
				</div>
			</div>

			<div className="stamp-fan-card stamp-fan-right">
				<div className="stamp-border">
					{images[2] ? (
						<img
							src={images[2]}
							alt=""
							className="w-full h-full object-cover"
						/>
					) : (
						<FallbackStamp color="#e8e0d4" />
					)}
				</div>
			</div>
		</div>
	);
}

function FallbackStamp({ color }: { color: string }) {
	return (
		<svg viewBox="0 0 120 120" className="w-full h-full">
			<rect width="120" height="120" fill={color} />
			<ellipse cx="60" cy="55" rx="26" ry="30" fill="#f5e6d3" />
			<path
				d="M34 45c0-20 12-30 26-30s26 10 26 30c0 2-1 4-2 6-2-14-10-22-24-22s-22 8-24 22c-1-2-2-4-2-6z"
				fill="#1a1a2e"
			/>
			<circle cx="50" cy="52" r="2.5" fill="#1a1a2e" />
			<circle cx="70" cy="52" r="2.5" fill="#1a1a2e" />
			<path
				d="M54 66 Q60 71 66 66"
				fill="none"
				stroke="#1a1a2e"
				strokeWidth="1.5"
			/>
		</svg>
	);
}
