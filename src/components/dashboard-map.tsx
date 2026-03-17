"use client";

import { useState } from "react";
import {
	COUNTRY_NAMES,
	COUNTRY_PATHS,
	getMapFillClass,
	getMapStrokeClass,
	MAP_LEGEND_STEPS,
} from "@/lib/world-map-data";
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

	const legendSteps = MAP_LEGEND_STEPS;

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
									className={`${getMapFillClass(normalized)} ${getMapStrokeClass(normalized)} stroke-[0.5]`}
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
