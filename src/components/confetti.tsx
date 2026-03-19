"use client";

import { useEffect, useRef } from "react";

interface ConfettiProps {
	active: boolean;
	pieceCount?: number;
}

const COLORS = [
	"#4a6fa5", // stamp blue
	"#b8860b", // stamp yellow
	"#a3423a", // stamp red
	"#3d7a4a", // stamp green
	"#1c1917", // stamp navy
	"#ec4899", // pink
	"#f97316", // orange
];

/**
 * Confetti celebration effect for generation complete.
 * Triggers once when active becomes true, not on re-renders.
 */
export function Confetti({ active, pieceCount = 50 }: ConfettiProps) {
	const hasTriggered = useRef(false);

	useEffect(() => {
		// Only trigger once when active becomes true
		if (!active || hasTriggered.current) return;
		hasTriggered.current = true;

		// Create confetti pieces
		const pieces: HTMLElement[] = [];
		const container = document.body;

		for (let i = 0; i < pieceCount; i++) {
			const piece = document.createElement("div");
			piece.className = "confetti-piece";

			// Random properties
			const color = COLORS[Math.floor(Math.random() * COLORS.length)];
			const left = Math.random() * 100;
			const animationDuration = 2 + Math.random() * 2; // 2-4s
			const size = 5 + Math.random() * 10; // 5-15px

			piece.style.cssText = `
				left: ${left}%;
				background-color: ${color};
				width: ${size}px;
				height: ${size}px;
				animation-duration: ${animationDuration}s;
				animation-delay: ${Math.random() * 0.5}s;
			`;

			container.appendChild(piece);
			pieces.push(piece);

			// Remove piece after animation
			setTimeout(
				() => {
					piece.remove();
				},
				(animationDuration + 0.5) * 1000,
			);
		}

		// Cleanup
		return () => {
			pieces.forEach((piece) => {
				piece.remove();
			});
		};
	}, [active, pieceCount]);

	return null;
}
