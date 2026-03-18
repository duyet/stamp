"use client";

import { useRef, useState } from "react";

interface TiltCardProps {
	children: React.ReactNode;
	className?: string;
	intensity?: number;
}

/**
 * 3D tilt effect component that responds to mouse movement.
 * Creates a dynamic perspective transform based on cursor position.
 *
 * @param intensity - Tilt intensity multiplier (default: 1.0)
 * Higher values create more dramatic tilt effect.
 *
 * Note: This component uses mouse events for visual effect only.
 * The interactive element should be a child (button, link, etc.)
 */
export function TiltCard({
	children,
	className = "",
	intensity = 1.0,
}: TiltCardProps) {
	const cardRef = useRef<HTMLDivElement>(null);
	const [transform, setTransform] = useState("");

	function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
		if (!cardRef.current) return;

		const rect = cardRef.current.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		// Calculate rotation based on cursor position relative to center
		const centerX = rect.width / 2;
		const centerY = rect.height / 2;

		// Normalize to -1 to 1 range
		const percentX = (x - centerX) / centerX;
		const percentY = (y - centerY) / centerY;

		// Max rotation degrees (multiplied by intensity)
		const maxRotate = 10 * intensity;

		// Calculate rotation (invert Y for natural feel)
		const rotateX = percentY * -maxRotate;
		const rotateY = percentX * maxRotate;

		// Apply perspective transform
		setTransform(
			`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
		);
	}

	function handleMouseLeave() {
		// Reset transform when mouse leaves
		setTransform("");
	}

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: Visual wrapper only, interactive element is child
		<div
			ref={cardRef}
			className={className}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			style={{
				transform,
				transformStyle: "preserve-3d",
				transition: "transform 0.1s ease-out",
			}}
		>
			{children}
		</div>
	);
}
