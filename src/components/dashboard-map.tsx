"use client";

import { useState } from "react";
import type { MapData } from "@/types/analytics";

interface DashboardMapProps {
	data: MapData[];
}

interface TooltipState {
	x: number;
	y: number;
	countryCode: string;
	countryName: string;
	count: number;
}

const COUNTRY_NAMES: Record<string, string> = {
	US: "United States",
	CA: "Canada",
	MX: "Mexico",
	BR: "Brazil",
	AR: "Argentina",
	CL: "Chile",
	CO: "Colombia",
	PE: "Peru",
	VE: "Venezuela",
	GB: "United Kingdom",
	FR: "France",
	DE: "Germany",
	IT: "Italy",
	ES: "Spain",
	PT: "Portugal",
	NL: "Netherlands",
	BE: "Belgium",
	SE: "Sweden",
	NO: "Norway",
	DK: "Denmark",
	FI: "Finland",
	PL: "Poland",
	UA: "Ukraine",
	RU: "Russia",
	TR: "Turkey",
	NG: "Nigeria",
	ZA: "South Africa",
	EG: "Egypt",
	KE: "Kenya",
	ET: "Ethiopia",
	GH: "Ghana",
	TZ: "Tanzania",
	IN: "India",
	CN: "China",
	JP: "Japan",
	KR: "South Korea",
	AU: "Australia",
	NZ: "New Zealand",
	ID: "Indonesia",
	PH: "Philippines",
	TH: "Thailand",
	VN: "Vietnam",
	MY: "Malaysia",
	SG: "Singapore",
	PK: "Pakistan",
	BD: "Bangladesh",
	SA: "Saudi Arabia",
	AE: "UAE",
	IR: "Iran",
	IQ: "Iraq",
	IL: "Israel",
	RO: "Romania",
	HU: "Hungary",
	CZ: "Czech Republic",
	AT: "Austria",
	CH: "Switzerland",
	GR: "Greece",
	IE: "Ireland",
};

// Simplified SVG paths — viewBox: 0 0 1000 500
const COUNTRY_PATHS: Record<string, string> = {
	US: "M 120,120 L 155,118 172,108 195,112 210,125 208,145 215,160 205,170 185,175 170,168 155,172 140,165 125,160 115,148 110,135 Z",
	CA: "M 110,70 L 200,65 215,75 210,95 195,100 175,98 155,105 135,108 115,105 100,95 95,82 Z",
	MX: "M 120,175 L 160,172 175,180 180,195 168,205 150,208 135,200 118,192 Z",
	BR: "M 220,215 L 265,210 285,220 295,245 288,270 270,290 248,298 228,285 215,265 212,242 Z",
	AR: "M 230,295 L 255,290 268,310 262,335 248,355 232,365 218,345 220,318 Z",
	CL: "M 215,295 L 228,293 230,340 220,360 208,350 206,320 Z",
	CO: "M 195,215 L 225,210 232,225 220,240 200,242 188,228 Z",
	PE: "M 195,245 L 220,240 228,255 222,275 205,282 190,268 188,252 Z",
	VE: "M 220,205 L 245,200 258,210 252,222 232,225 215,218 Z",
	GB: "M 445,98 L 458,95 462,108 455,118 445,115 440,105 Z",
	IE: "M 435,100 L 443,97 444,110 435,112 Z",
	FR: "M 455,118 L 478,115 485,128 478,140 460,142 450,132 Z",
	ES: "M 445,142 L 478,140 482,155 465,162 448,158 Z",
	PT: "M 437,142 L 447,140 447,158 437,158 Z",
	DE: "M 478,105 L 498,103 505,115 500,128 480,130 472,118 Z",
	IT: "M 478,130 L 495,128 502,145 495,162 482,168 475,155 472,140 Z",
	NL: "M 470,98 L 482,96 483,106 472,107 Z",
	BE: "M 462,108 L 472,107 474,116 463,117 Z",
	SE: "M 488,72 L 502,68 508,80 505,95 492,98 485,88 Z",
	NO: "M 470,58 L 492,52 498,65 488,72 472,70 Z",
	DK: "M 480,88 L 490,86 492,96 482,97 Z",
	FI: "M 502,60 L 520,55 528,68 522,82 508,85 500,72 Z",
	PL: "M 498,105 L 520,103 525,118 515,128 498,126 493,115 Z",
	UA: "M 520,110 L 548,108 555,122 545,135 522,133 512,122 Z",
	RO: "M 525,128 L 545,126 548,140 535,148 520,142 518,132 Z",
	HU: "M 505,125 L 522,123 525,133 512,138 502,132 Z",
	CZ: "M 496,115 L 512,113 515,122 498,124 Z",
	AT: "M 488,122 L 504,120 506,128 490,130 Z",
	CH: "M 470,125 L 484,123 485,132 471,133 Z",
	GR: "M 510,148 L 528,145 530,158 518,165 508,158 Z",
	TR: "M 540,140 L 572,138 578,152 565,162 542,158 535,150 Z",
	RU: "M 520,55 L 650,45 720,52 745,65 750,80 720,88 680,85 640,80 590,82 555,80 530,72 515,62 Z",
	NG: "M 468,222 L 492,220 498,235 488,248 468,248 460,235 Z",
	GH: "M 452,222 L 464,220 466,235 452,237 Z",
	ZA: "M 488,318 L 515,312 522,330 508,348 490,348 480,332 Z",
	EG: "M 518,162 L 545,160 548,178 520,180 Z",
	KE: "M 525,255 L 545,250 552,265 540,278 522,272 518,260 Z",
	ET: "M 528,238 L 555,232 560,248 545,258 525,252 Z",
	TZ: "M 522,272 L 545,268 550,285 535,295 518,288 516,277 Z",
	SA: "M 548,175 L 580,172 585,195 572,210 548,208 540,190 Z",
	AE: "M 582,188 L 596,185 598,198 582,200 Z",
	IR: "M 578,155 L 612,150 618,168 608,182 580,182 572,168 Z",
	IQ: "M 552,155 L 578,153 580,170 562,175 548,168 Z",
	IL: "M 528,165 L 538,163 540,175 528,177 Z",
	IN: "M 618,168 L 652,162 665,180 660,210 645,228 625,232 608,215 605,192 Z",
	PK: "M 598,155 L 622,150 625,165 615,178 595,175 590,162 Z",
	BD: "M 658,185 L 672,182 675,198 660,202 Z",
	CN: "M 655,100 L 745,92 758,108 752,135 730,148 700,150 668,142 650,125 Z",
	JP: "M 762,115 L 775,108 782,120 775,135 760,135 756,122 Z",
	KR: "M 748,122 L 760,118 763,132 750,135 Z",
	ID: "M 680,222 L 720,215 748,218 760,232 745,242 708,245 678,238 Z",
	PH: "M 750,195 L 762,190 768,205 758,215 748,208 Z",
	TH: "M 668,190 L 685,185 690,205 678,218 665,212 Z",
	VN: "M 690,185 L 705,180 710,198 700,215 688,208 Z",
	MY: "M 685,218 L 710,215 715,228 700,232 682,228 Z",
	SG: "M 710,228 L 718,226 719,232 710,234 Z",
	AU: "M 730,280 L 790,272 810,285 812,315 795,332 762,338 738,322 725,300 Z",
	NZ: "M 820,328 L 832,318 840,335 830,350 818,342 Z",
};

function getFillClass(normalized: number): string {
	if (normalized <= 0) return "fill-stone-100";
	if (normalized < 0.2) return "fill-stone-300";
	if (normalized < 0.5) return "fill-stone-500";
	if (normalized < 0.8) return "fill-stone-700";
	return "fill-stone-900";
}

function getStrokeClass(normalized: number): string {
	if (normalized <= 0) return "stroke-stone-300";
	return "stroke-white";
}

export function DashboardMap({ data }: DashboardMapProps) {
	const [tooltip, setTooltip] = useState<TooltipState | null>(null);

	const countMap = new Map<string, number>();
	for (const item of data) {
		countMap.set(item.countryCode.toUpperCase(), item.count);
	}
	const maxCount = Math.max(...Array.from(countMap.values()), 1);

	function handleMouseEnter(e: React.MouseEvent<SVGGElement>, code: string) {
		const count = countMap.get(code) ?? 0;
		const svg = e.currentTarget.closest("svg") as SVGSVGElement;
		const rect = svg.getBoundingClientRect();
		setTooltip({
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
			countryCode: code,
			countryName: COUNTRY_NAMES[code] ?? code,
			count,
		});
	}

	function handleMouseMove(e: React.MouseEvent<SVGGElement>) {
		if (!tooltip) return;
		const svg = e.currentTarget.closest("svg") as SVGSVGElement;
		const rect = svg.getBoundingClientRect();
		setTooltip((prev) =>
			prev
				? {
						...prev,
						x: e.clientX - rect.left,
						y: e.clientY - rect.top,
					}
				: null,
		);
	}

	function handleMouseLeave() {
		setTooltip(null);
	}

	const legendSteps = [
		{ label: "0", cls: "bg-stone-100 border border-stone-300" },
		{ label: "Low", cls: "bg-stone-300" },
		{ label: "Mid", cls: "bg-stone-500" },
		{ label: "High", cls: "bg-stone-700" },
		{ label: "Max", cls: "bg-stone-900" },
	];

	return (
		<div className="bg-white rounded-xl border border-stone-200 p-6">
			<h2 className="text-xs font-medium text-stone-600 uppercase tracking-wide mb-4">
				Stamps by country
			</h2>

			<div className="relative">
				<svg
					viewBox="0 0 1000 500"
					className="w-full h-auto"
					aria-label="World map showing stamp generation counts by country"
				>
					<rect width="1000" height="500" className="fill-stone-50" rx="8" />

					{Object.entries(COUNTRY_PATHS).map(([code, pathD]) => {
						const count = countMap.get(code) ?? 0;
						const normalized = count / maxCount;
						return (
							// biome-ignore lint/a11y/noStaticElementInteractions: SVG country region with tooltip hover
							<g
								key={code}
								data-country={code}
								aria-label={`${COUNTRY_NAMES[code] ?? code}: ${count} stamp${count !== 1 ? "s" : ""}`}
								onMouseEnter={(e) => handleMouseEnter(e, code)}
								onMouseMove={handleMouseMove}
								onMouseLeave={handleMouseLeave}
								className="cursor-pointer transition-opacity hover:opacity-75"
							>
								<path
									d={pathD}
									className={`${getFillClass(normalized)} ${getStrokeClass(normalized)} stroke-[0.5]`}
								/>
							</g>
						);
					})}
				</svg>

				{tooltip && (
					<div
						className="pointer-events-none absolute z-10 rounded-lg bg-stone-900 text-white px-3 py-2 text-xs shadow-lg whitespace-nowrap"
						style={{
							left: tooltip.x + 12,
							top: tooltip.y - 36,
							transform:
								tooltip.x > 800 ? "translateX(-110%)" : "translateX(0)",
						}}
					>
						<span className="font-semibold">{tooltip.countryName}</span>
						<span className="ml-2 text-stone-300">
							{tooltip.count.toLocaleString()} stamp
							{tooltip.count !== 1 ? "s" : ""}
						</span>
					</div>
				)}
			</div>

			<div className="mt-4 flex items-center gap-3">
				<span className="text-xs text-stone-500">Count</span>
				<div className="flex items-center gap-1">
					{legendSteps.map((step) => (
						<div key={step.label} className="flex items-center gap-1">
							<span className={`inline-block w-4 h-4 rounded-sm ${step.cls}`} />
							<span className="text-xs text-stone-500">{step.label}</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
