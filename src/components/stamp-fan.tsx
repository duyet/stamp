"use client";

/**
 * StampFan — 3 stamps stacked, fan out on hover.
 * Each stamp has a unique SVG illustration matching the vintage style.
 */
export function StampFan() {
	return (
		<div className="stamp-fan group cursor-pointer select-none" aria-hidden>
			{/* Stamp 1 — Left (blue, glasses girl) */}
			<div className="stamp-fan-card stamp-fan-left">
				<div className="stamp-border">
					<svg viewBox="0 0 120 120" className="w-full h-full">
						<rect width="120" height="120" fill="#c8d6e5" />
						{/* Face */}
						<ellipse cx="60" cy="55" rx="28" ry="32" fill="#f5e6d3" />
						{/* Hair */}
						<path
							d="M32 45c0-20 12-32 28-32s28 12 28 32c0 3-1 5-2 7-2-15-12-25-26-25s-24 10-26 25c-1-2-2-4-2-7z"
							fill="#1a1a2e"
						/>
						{/* Glasses */}
						<circle
							cx="48"
							cy="52"
							r="8"
							fill="none"
							stroke="#1a1a2e"
							strokeWidth="2"
						/>
						<circle
							cx="72"
							cy="52"
							r="8"
							fill="none"
							stroke="#1a1a2e"
							strokeWidth="2"
						/>
						<line
							x1="56"
							y1="52"
							x2="64"
							y2="52"
							stroke="#1a1a2e"
							strokeWidth="2"
						/>
						{/* Eyes */}
						<circle cx="48" cy="53" r="2.5" fill="#1a1a2e" />
						<circle cx="72" cy="53" r="2.5" fill="#1a1a2e" />
						{/* Cheeks */}
						<circle cx="40" cy="62" r="4" fill="#e07c6a" opacity="0.6" />
						<circle cx="80" cy="62" r="4" fill="#e07c6a" opacity="0.6" />
						{/* Mouth */}
						<path
							d="M55 68 Q60 73 65 68"
							fill="none"
							stroke="#1a1a2e"
							strokeWidth="1.5"
						/>
						{/* Flowers */}
						<circle cx="30" cy="95" r="5" fill="#4a6fa5" opacity="0.5" />
						<circle cx="90" cy="95" r="5" fill="#4a6fa5" opacity="0.5" />
						<circle cx="30" cy="95" r="2" fill="#d4a843" />
						<circle cx="90" cy="95" r="2" fill="#d4a843" />
					</svg>
				</div>
			</div>

			{/* Stamp 2 — Center (yellow, girl with flowers) */}
			<div className="stamp-fan-card stamp-fan-center">
				<div className="stamp-border">
					<svg viewBox="0 0 120 120" className="w-full h-full">
						<rect width="120" height="120" fill="#d4a843" />
						{/* Face */}
						<ellipse cx="60" cy="55" rx="26" ry="30" fill="#f5e6d3" />
						{/* Hair */}
						<path
							d="M34 50c0-22 12-35 26-35s26 13 26 35c0 2 0 4-1 6l-5-2c0-18-8-28-20-28s-20 10-20 28l-5 2c-1-2-1-4-1-6z"
							fill="#1a1a2e"
						/>
						<rect x="34" y="48" width="8" height="40" rx="3" fill="#1a1a2e" />
						<rect x="78" y="48" width="8" height="40" rx="3" fill="#1a1a2e" />
						{/* Eyes */}
						<circle cx="50" cy="52" r="2.5" fill="#1a1a2e" />
						<circle cx="70" cy="52" r="2.5" fill="#1a1a2e" />
						{/* Mouth */}
						<path
							d="M53 66 Q60 70 67 66"
							fill="none"
							stroke="#1a1a2e"
							strokeWidth="1.5"
						/>
						{/* Flower decorations */}
						<g transform="translate(18,8)">
							<circle cx="0" cy="0" r="4" fill="#f5e6d3" opacity="0.7" />
							<circle cx="6" cy="-3" r="3" fill="#f5e6d3" opacity="0.5" />
						</g>
						<g transform="translate(95,12)">
							<circle cx="0" cy="0" r="4" fill="#f5e6d3" opacity="0.7" />
							<circle cx="-5" cy="-4" r="3" fill="#f5e6d3" opacity="0.5" />
						</g>
					</svg>
				</div>
			</div>

			{/* Stamp 3 — Right (cream, person portrait) */}
			<div className="stamp-fan-card stamp-fan-right">
				<div className="stamp-border">
					<svg viewBox="0 0 120 120" className="w-full h-full">
						<rect width="120" height="120" fill="#e8e0d4" />
						{/* Face */}
						<ellipse cx="60" cy="55" rx="25" ry="30" fill="#f5e6d3" />
						{/* Hair — short */}
						<path
							d="M35 42c0-18 11-28 25-28s25 10 25 28c0 2-1 4-2 6-1-12-10-22-23-22s-22 10-23 22c-1-2-2-4-2-6z"
							fill="#1a1a2e"
						/>
						{/* Eyes */}
						<ellipse cx="50" cy="52" rx="3" ry="2.5" fill="#1a1a2e" />
						<ellipse cx="70" cy="52" rx="3" ry="2.5" fill="#1a1a2e" />
						{/* Nose */}
						<path
							d="M60 56 L57 63 L63 63"
							fill="none"
							stroke="#1a1a2e"
							strokeWidth="1"
						/>
						{/* Mouth */}
						<line
							x1="54"
							y1="70"
							x2="66"
							y2="70"
							stroke="#1a1a2e"
							strokeWidth="1.5"
						/>
						{/* Collar */}
						<path d="M40 90 L60 80 L80 90" fill="#4a6fa5" opacity="0.3" />
						{/* Corner accent */}
						<circle cx="105" cy="15" r="8" fill="#d4a843" opacity="0.4" />
					</svg>
				</div>
			</div>
		</div>
	);
}
