import { useEffect, useRef, useState } from "react";
import { CloseIcon, UploadIcon } from "@/components/icons";
import { StampImage } from "@/components/stamp-image";
import { IMAGE_CONSTANTS } from "@/lib/constants";

export interface ReferenceData {
	referenceImageData: string; // base64-encoded PNG
}

interface ImageUploadProps {
	onSelected: (data: ReferenceData | null) => void;
	disabled?: boolean;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function ImageUpload({ onSelected, disabled }: ImageUploadProps) {
	const [preview, setPreview] = useState<string | null>(null);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [processing, setProcessing] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	// Cleanup blob URL on unmount or when preview changes
	useEffect(() => {
		return () => {
			if (preview) URL.revokeObjectURL(preview);
		};
	}, [preview]);

	async function resizeImage(file: File): Promise<Blob> {
		return new Promise((resolve, reject) => {
			const img = document.createElement("img");
			img.onload = () => {
				// Calculate scale to fit within max dimension
				const scale = Math.min(
					1,
					IMAGE_CONSTANTS.FLUX_MAX_DIMENSION / img.width,
					IMAGE_CONSTANTS.FLUX_MAX_DIMENSION / img.height,
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
		if (
			!ACCEPTED_TYPES.includes(file.type as (typeof ACCEPTED_TYPES)[number])
		) {
			setErrorMsg("Please upload a JPG, PNG, or WebP image.");
			return;
		}
		if (file.size > IMAGE_CONSTANTS.MAX_UPLOAD_SIZE_BYTES) {
			setErrorMsg("Image must be under 5MB.");
			return;
		}

		setProcessing(true);
		setPreview(URL.createObjectURL(file));
		setErrorMsg(null);

		try {
			// Resize image to fit FLUX.2 constraints
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
		} finally {
			setProcessing(false);
		}
	}

	function handleClear() {
		setPreview(null);
		setErrorMsg(null);
		onSelected(null);
		if (inputRef.current) inputRef.current.value = "";
	}

	function handleDrop(e: React.DragEvent) {
		e.preventDefault();
		setIsDragging(false);
		const file = e.dataTransfer.files[0];
		if (file) handleFile(file);
	}

	function handleDragOver(e: React.DragEvent) {
		e.preventDefault();
	}

	function handleDragEnter(e: React.DragEvent) {
		e.preventDefault();
		setIsDragging(true);
	}

	function handleDragLeave(e: React.DragEvent) {
		e.preventDefault();
		setIsDragging(false);
	}

	return (
		<div>
			{!preview ? (
				<button
					type="button"
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					onDragEnter={handleDragEnter}
					onDragLeave={handleDragLeave}
					onClick={() => inputRef.current?.click()}
					disabled={disabled}
					className={`flex flex-col w-full items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 bg-transparent ${
						disabled
							? "border-stone-200 bg-stone-50 cursor-not-allowed opacity-50"
							: isDragging
								? "border-stamp-blue bg-stamp-blue/5 scale-[1.02]"
								: "border-stone-300 hover:border-stone-400 hover:bg-stone-50"
					}`}
				>
					<UploadIcon />
					<span className="text-xs text-stone-500">
						{isDragging ? "Drop your photo here" : "Upload a reference photo"}
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
				<div className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 animate-form-enter">
					<div className="w-16 h-16 rounded overflow-hidden shrink-0 relative">
						{processing && (
							<div className="absolute inset-0 bg-black/20 flex items-center justify-center">
								<div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
							</div>
						)}
						<StampImage
							src={preview}
							width={64}
							height={64}
							alt="Reference upload"
							className="object-cover w-full h-full"
						/>
					</div>
					<span className="text-xs text-stone-600">
						{processing
							? "Processing..."
							: "Reference photo ready (HD required)"}
					</span>
					<button
						type="button"
						onClick={handleClear}
						className="shrink-0 p-1 text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={disabled || processing}
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
