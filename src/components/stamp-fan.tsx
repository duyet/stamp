"use client";

import Image from "next/image";

interface StampFanProps {
	images?: string[];
	onClickStamp?: (index: number) => void;
}

export function StampFan({ images = [], onClickStamp }: StampFanProps) {
	const positions = [
		"stamp-fan-far-left",
		"stamp-fan-left",
		"stamp-fan-center",
		"stamp-fan-right",
		"stamp-fan-far-right",
	];
	const fallbacks = [
		<PortraitMan key="f1" />,
		<GlassesGirl key="f2" />,
		<FlowerGirl key="f3" />,
		<PortraitMan key="f4" />,
		<GlassesGirl key="f5" />,
	];

	return (
		<div className="stamp-fan group cursor-pointer select-none">
			{positions.map((pos, idx) => (
				<div key={pos} className={`stamp-fan-card ${pos}`}>
					{images[idx] && onClickStamp ? (
						<button
							type="button"
							className="stamp-border w-full h-full"
							onClick={() => onClickStamp(idx)}
							aria-label={`View stamp ${idx + 1}`}
						>
							<Image
								src={images[idx]}
								alt={`Stamp preview ${idx + 1}`}
								width={130}
								height={130}
								className="w-full h-full object-cover"
								priority={idx < 3}
							/>
						</button>
					) : (
						<div className="stamp-border" aria-hidden="true">
							{images[idx] ? (
								<Image
									src={images[idx]}
									alt=""
									width={130}
									height={130}
									className="w-full h-full object-cover"
									priority={idx < 3}
								/>
							) : (
								fallbacks[idx]
							)}
						</div>
					)}
				</div>
			))}
		</div>
	);
}

function StipplePattern({ id, color }: { id: string; color: string }) {
	return (
		<defs>
			<pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse">
				<circle cx="2" cy="2" r="0.6" fill={color} opacity="0.4" />
				<circle cx="6" cy="6" r="0.5" fill={color} opacity="0.3" />
			</pattern>
		</defs>
	);
}

function GlassesGirl() {
	return (
		<svg
			viewBox="0 0 120 120"
			className="w-full h-full"
			role="img"
			aria-label="Naive folk art illustration of a person with glasses"
		>
			<StipplePattern id="sp1" color="#8da4c0" />
			<rect width="120" height="120" fill="#d0dcea" />
			<rect width="120" height="120" fill="url(#sp1)" />
			<rect x="30" y="88" width="60" height="32" rx="3" fill="#1a1a2e" />
			<line x1="35" y1="90" x2="55" y2="110" stroke="#333" strokeWidth="0.5" />
			<line x1="45" y1="90" x2="65" y2="110" stroke="#333" strokeWidth="0.5" />
			<line x1="55" y1="90" x2="75" y2="110" stroke="#333" strokeWidth="0.5" />
			<line x1="65" y1="90" x2="85" y2="110" stroke="#333" strokeWidth="0.5" />
			<rect x="52" y="82" width="16" height="10" fill="#f0dcc8" />
			<ellipse
				cx="60"
				cy="56"
				rx="27"
				ry="30"
				fill="#f0dcc8"
				stroke="#1a1a2e"
				strokeWidth="1.5"
			/>
			<path
				d="M33 50c0-22 12-34 27-34s27 12 27 34c0 2-1 4-2 5-3-16-12-24-25-24s-22 8-25 24c-1-1-2-3-2-5z"
				fill="#1a1a2e"
			/>
			<rect x="32" y="48" width="7" height="35" rx="3" fill="#1a1a2e" />
			<rect x="81" y="48" width="7" height="35" rx="3" fill="#1a1a2e" />
			<circle
				cx="48"
				cy="54"
				r="9"
				fill="none"
				stroke="#1a1a2e"
				strokeWidth="2"
			/>
			<circle
				cx="72"
				cy="54"
				r="9"
				fill="none"
				stroke="#1a1a2e"
				strokeWidth="2"
			/>
			<line x1="57" y1="54" x2="63" y2="54" stroke="#1a1a2e" strokeWidth="2" />
			<circle cx="48" cy="55" r="2.5" fill="#1a1a2e" />
			<circle cx="72" cy="55" r="2.5" fill="#1a1a2e" />
			<circle cx="38" cy="64" r="5" fill="#e07c6a" opacity="0.5" />
			<circle cx="82" cy="64" r="5" fill="#e07c6a" opacity="0.5" />
			<path
				d="M55 70 Q60 74 65 70"
				fill="none"
				stroke="#1a1a2e"
				strokeWidth="1.2"
			/>
			<circle cx="18" cy="100" r="6" fill="#4a6fa5" opacity="0.6" />
			<circle cx="18" cy="100" r="2.5" fill="#d4a843" />
			<circle cx="102" cy="100" r="6" fill="#4a6fa5" opacity="0.6" />
			<circle cx="102" cy="100" r="2.5" fill="#d4a843" />
			<ellipse
				cx="12"
				cy="108"
				rx="4"
				ry="2"
				fill="#6b8f71"
				opacity="0.5"
				transform="rotate(-30 12 108)"
			/>
			<ellipse
				cx="108"
				cy="108"
				rx="4"
				ry="2"
				fill="#6b8f71"
				opacity="0.5"
				transform="rotate(30 108 108)"
			/>
		</svg>
	);
}

function FlowerGirl() {
	return (
		<svg
			viewBox="0 0 120 120"
			className="w-full h-full"
			role="img"
			aria-label="Naive folk art illustration of a person with flowers"
		>
			<StipplePattern id="sp2" color="#b88c2e" />
			<rect width="120" height="120" fill="#d4a843" />
			<rect width="120" height="120" fill="url(#sp2)" />
			<rect x="32" y="90" width="56" height="30" rx="4" fill="#1a1a2e" />
			<rect x="52" y="84" width="16" height="10" fill="#f0dcc8" />
			<ellipse
				cx="60"
				cy="55"
				rx="25"
				ry="30"
				fill="#f0dcc8"
				stroke="#1a1a2e"
				strokeWidth="1.5"
			/>
			<path
				d="M35 48c0-20 11-32 25-32s25 12 25 32c0 3-1 5-2 7l-4-1c0-16-8-26-19-26s-19 10-19 26l-4 1c-1-2-2-4-2-7z"
				fill="#1a1a2e"
			/>
			<rect x="34" y="46" width="9" height="42" rx="4" fill="#1a1a2e" />
			<rect x="77" y="46" width="9" height="42" rx="4" fill="#1a1a2e" />
			<circle cx="50" cy="54" r="2.5" fill="#1a1a2e" />
			<circle cx="70" cy="54" r="2.5" fill="#1a1a2e" />
			<line
				x1="45"
				y1="47"
				x2="55"
				y2="48"
				stroke="#1a1a2e"
				strokeWidth="1.2"
			/>
			<line
				x1="65"
				y1="48"
				x2="75"
				y2="47"
				stroke="#1a1a2e"
				strokeWidth="1.2"
			/>
			<path
				d="M54 68 Q60 72 66 68"
				fill="none"
				stroke="#1a1a2e"
				strokeWidth="1.2"
			/>
			<g transform="translate(16,12)">
				<circle cx="0" cy="0" r="5" fill="#f0dcc8" opacity="0.8" />
				<circle cx="0" cy="-5" r="3" fill="#f0dcc8" opacity="0.6" />
				<circle cx="4" cy="-2" r="3" fill="#f0dcc8" opacity="0.6" />
				<circle cx="0" cy="0" r="2" fill="#d4a843" />
			</g>
			<g transform="translate(100,16)">
				<circle cx="0" cy="0" r="4" fill="#f0dcc8" opacity="0.7" />
				<circle cx="3" cy="-3" r="3" fill="#f0dcc8" opacity="0.5" />
				<circle cx="0" cy="0" r="1.5" fill="#d4a843" />
			</g>
		</svg>
	);
}

function PortraitMan() {
	return (
		<svg
			viewBox="0 0 120 120"
			className="w-full h-full"
			role="img"
			aria-label="Naive folk art illustration of a portrait"
		>
			<StipplePattern id="sp3" color="#b8ad9c" />
			<rect width="120" height="120" fill="#e8e0d4" />
			<rect width="120" height="120" fill="url(#sp3)" />
			<rect
				x="0"
				y="85"
				width="120"
				height="35"
				fill="#4a6fa5"
				opacity="0.25"
			/>
			<path
				d="M30 95 Q40 85 60 82 Q80 85 90 95 L90 120 L30 120 Z"
				fill="#1a1a2e"
			/>
			<path
				d="M48 88 L60 82 L72 88"
				fill="none"
				stroke="#e8e0d4"
				strokeWidth="1"
			/>
			<ellipse
				cx="60"
				cy="52"
				rx="24"
				ry="28"
				fill="#f0dcc8"
				stroke="#1a1a2e"
				strokeWidth="1.5"
			/>
			<path
				d="M36 42c0-16 10-26 24-26s24 10 24 26c0 2-1 3-1 5-2-11-10-18-23-18s-21 7-23 18c0-2-1-3-1-5z"
				fill="#1a1a2e"
			/>
			<ellipse cx="50" cy="50" rx="3" ry="2.5" fill="#1a1a2e" />
			<ellipse cx="70" cy="50" rx="3" ry="2.5" fill="#1a1a2e" />
			<path
				d="M60 54 L57 62 L63 62"
				fill="none"
				stroke="#1a1a2e"
				strokeWidth="1"
			/>
			<line
				x1="54"
				y1="68"
				x2="66"
				y2="68"
				stroke="#1a1a2e"
				strokeWidth="1.2"
			/>
			<rect x="80" y="85" width="14" height="14" rx="2" fill="#d4a843" />
			<path
				d="M84 89 Q87 92 90 89"
				fill="none"
				stroke="#1a1a2e"
				strokeWidth="0.8"
			/>
			<path
				d="M84 93 Q87 96 90 93"
				fill="none"
				stroke="#1a1a2e"
				strokeWidth="0.8"
			/>
		</svg>
	);
}
