"use client";

import { useEffect, useRef, useState } from "react";

interface StampImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
	fallbackSrc?: string;
}

export function StampImage({
	onError,
	alt,
	fallbackSrc,
	decoding,
	src,
	...rest
}: StampImageProps) {
	const [failed, setFailed] = useState(false);
	const [triedFallback, setTriedFallback] = useState(false);
	const [currentSrc, setCurrentSrc] = useState(src);

	// Reset state when src prop changes
	const prevSrcRef = useRef(src);
	useEffect(() => {
		if (prevSrcRef.current !== src) {
			prevSrcRef.current = src;
			setFailed(false);
			setTriedFallback(false);
			setCurrentSrc(src);
		}
	}, [src]);

	// Handle fallback in useEffect (not during render)
	useEffect(() => {
		if (failed && !triedFallback && fallbackSrc) {
			setTriedFallback(true);
			setFailed(false);
			setCurrentSrc(fallbackSrc);
		}
	}, [failed, triedFallback, fallbackSrc]);

	if (failed) {
		return (
			<div
				className={`bg-stone-100 flex items-center justify-center text-stone-400 text-xs text-center p-2 ${rest.className ?? ""}`}
				role="img"
				aria-label={alt}
			>
				{alt || "Image unavailable"}
			</div>
		);
	}

	return (
		<img
			decoding={decoding ?? "async"}
			alt={alt}
			src={currentSrc}
			onError={(e) => {
				setFailed(true);
				onError?.(e);
			}}
			{...rest}
		/>
	);
}
