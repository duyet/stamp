"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { CloseIcon, UploadIcon } from "@/components/icons";

export interface ReferenceData {
	referenceImageData: string; // base64-encoded PNG
}

interface ImageUploadProps {
	onSelected: (data: ReferenceData | null) => void;
	disabled?: boolean;
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_DIMENSION = 512; // FLUX.2 requires ≤512x512

export function ImageUpload({ onSelected, disabled }: ImageUploadProps) {
	const [preview, setPreview] = useState<string | null>(null);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	async function resizeImage(file: File): Promise<Blob> {
		return new Promise((resolve, reject) => {
			const img = document.createElement("img");
			img.onload = () => {
				// Calculate scale to fit within MAX_DIMENSION
				const scale = Math.min(
					1,
					MAX_DIMENSION / img.width,
					MAX_DIMENSION / img.height,
				);
				const width = Math.floor(img.width * scale);
				const height = Math.floor(img.height * scale);

				// Create canvas and resize
				const canvas = document.createElement("canvas");
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext("2d");

				if (!ctx) {
					reject(new Error("Could not get canvas context"));
					return;
				}

				// Draw resized image
				ctx.drawImage(img, 0, 0, width, height);

				// Convert to blob as PNG
				canvas.toBlob(
					(blob) => {
						if (blob) resolve(blob);
						else reject(new Error("Canvas to blob failed"));
					},
					"image/png",
					0.9,
				);
			};
			img.onerror = () => reject(new Error("Failed to load image"));
			img.src = URL.createObjectURL(file);
		});
	}

	async function handleFile(file: File) {
		if (!ACCEPTED_TYPES.includes(file.type)) {
			setErrorMsg("Please upload a JPG, PNG, or WebP image.");
			return;
		}
		if (file.size > MAX_SIZE) {
			setErrorMsg("Image must be under 5MB.");
			return;
		}

		setPreview(URL.createObjectURL(file));
		setErrorMsg(null);

		try {
			// Resize image to ≤512x512 for FLUX.2
			const resizedBlob = await resizeImage(file);

			// Convert to base64
			const base64 = await new Promise<string>((resolve) => {
				const reader = new FileReader();
				reader.onload = () => {
					const result = reader.result as string;
					// Remove data URL prefix
					resolve(result.split(",")[1]);
				};
				reader.readAsDataURL(resizedBlob);
			});

			onSelected({ referenceImageData: base64 });
		} catch (err) {
			setErrorMsg("Failed to process image. Please try another.");
			console.error("Image resize error:", err);
		}
	}

	function handleClear() {
		if (preview) URL.revokeObjectURL(preview);
		setPreview(null);
		setErrorMsg(null);
		onSelected(null);
		if (inputRef.current) inputRef.current.value = "";
	}

	function handleDrop(e: React.DragEvent) {
		e.preventDefault();
		const file = e.dataTransfer.files[0];
		if (file) handleFile(file);
	}

	function handleDragOver(e: React.DragEvent) {
		e.preventDefault();
	}

	return (
		<div>
			{!preview ? (
				<button
					type="button"
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					onClick={() => inputRef.current?.click()}
					disabled={disabled}
					className={`flex w-full items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 bg-transparent ${
						disabled
							? "border-stone-200 bg-stone-50 cursor-not-allowed opacity-50"
							: "border-stone-300 hover:border-stone-400 hover:bg-stone-50"
					}`}
				>
					<UploadIcon />
					<span className="text-xs text-stone-500">
						Upload a reference photo
					</span>
					<span className="text-[10px] text-stone-400">
						JPG, PNG, WebP up to 5MB
					</span>
					<input
						ref={inputRef}
						type="file"
						accept="image/jpeg,image/png,image/webp"
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) handleFile(file);
						}}
						className="hidden"
						disabled={disabled}
					/>
				</button>
			) : (
				<div className="flex items-center gap-3 p-3 border border-stone-200 rounded-lg bg-stone-50">
					<div className="w-16 h-16 rounded overflow-hidden shrink-0">
						<Image
							src={preview}
							alt="Reference photo"
							width={64}
							height={64}
							className="object-cover w-full h-full"
							unoptimized
						/>
					</div>
					<span className="text-xs text-stone-600">
						Reference photo ready (HD required)
					</span>
					<button
						type="button"
						onClick={handleClear}
						className="shrink-0 p-1 text-stone-400 hover:text-stone-600 transition-colors"
						disabled={disabled}
					>
						<CloseIcon />
					</button>
				</div>
			)}
			{errorMsg && (
				<div className="mt-1.5 flex items-center justify-between">
					<p className="text-xs text-red-600">{errorMsg}</p>
					<button
						type="button"
						onClick={() => setErrorMsg(null)}
						className="text-xs text-stone-500 hover:text-stone-700 transition-colors"
					>
						Try again
					</button>
				</div>
			)}
		</div>
	);
}
