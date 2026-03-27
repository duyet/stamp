"use client";

import { useState } from "react";

interface StampImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
	fallbackSrc?: string;
}

export function StampImage({
	onError,
	alt,
	fallbackSrc,
	decoding,
	...rest
}: StampImageProps) {
	const [failed, setFailed] = useState(false);
	const [triedFallback, setTriedFallback] = useState(false);

	if (failed && !triedFallback && fallbackSrc) {
		setTriedFallback(true);
		setFailed(false);
		return (
			<StampImage
				{...rest}
				alt={alt}
				src={fallbackSrc}
				onError={onError}
				decoding={decoding}
			/>
		);
	}

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
			onError={(e) => {
				setFailed(true);
				onError?.(e);
			}}
			{...rest}
		/>
	);
}
