import { useEffect, useRef, useState } from "react";
import { CloseIcon, UploadIcon } from "@/components/icons";
import { IMAGE_CONSTANTS } from "@/lib/constants";

export interface ReferenceData {
	referenceImageData: string; // base64-encoded JPEG
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
					IMAGE_CONSTANTS.REFERENCE_MODEL_DIMENSION / img.width,
					IMAGE_CONSTANTS.REFERENCE_MODEL_DIMENSION / img.height,
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

				// Convert to JPEG so the reference sent to Workers AI stays small.
				canvas.toBlob(
					(blob) => {
						if (blob) resolve(blob);
						else reject(new Error("Canvas to blob failed"));
					},
					"image/jpeg",
					0.82,
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
			<input
				ref={inputRef}
				id="reference-upload"
				type="file"
				accept="image/jpeg,image/png,image/webp"
				onChange={(e) => {
					const file = e.target.files?.[0];
					e.currentTarget.value = "";
					if (file) handleFile(file);
				}}
				className="sr-only"
				disabled={disabled}
			/>
			{!preview ? (
				<button
					type="button"
					onClick={() => {
						if (inputRef.current) {
							inputRef.current.value = "";
							inputRef.current.click();
						}
					}}
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					onDragEnter={handleDragEnter}
					onDragLeave={handleDragLeave}
					aria-disabled={disabled}
					className={`flex min-h-[260px] w-full flex-col items-center justify-center gap-3 rounded-[1rem] border-2 border-dashed px-5 py-8 text-center transition-all duration-200 ${
						disabled
							? "cursor-not-allowed border-stone-200 bg-stone-50/80 opacity-50"
							: isDragging
								? "scale-[1.01] cursor-copy border-stone-800 bg-stone-100"
								: "cursor-pointer border-stone-300 bg-white hover:border-stone-700 hover:bg-stone-50"
					}`}
				>
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-950 text-white">
						<UploadIcon />
					</div>
					<p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
						Reference image
					</p>
					<span className="text-base font-semibold text-stone-950">
						{isDragging ? "Drop image here" : "Click to upload image"}
					</span>
					<span className="max-w-xs text-sm leading-6 text-stone-600">
						JPG, PNG, or WebP up to 5MB. We resize it for the model and use it
						to steer the stamp composition.
					</span>
				</button>
			) : (
				<div className="animate-form-enter flex items-center gap-4 rounded-[1rem] border border-stone-200 bg-white p-4">
					<div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[0.75rem] bg-stone-100">
						{processing && (
							<div className="absolute inset-0 bg-black/20 flex items-center justify-center">
								<div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
							</div>
						)}
						<img
							src={preview}
							alt="Reference upload"
							className="h-full w-full object-cover"
						/>
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
							Image attached
						</p>
						<p className="mt-1 text-sm font-semibold text-stone-950">
							{processing
								? "Processing your reference..."
								: "Reference photo ready for generation"}
						</p>
						<p className="mt-1 text-xs leading-5 text-stone-600">
							HD mode stays on so the generated stamp can track the uploaded
							composition more closely.
						</p>
					</div>
					<button
						type="button"
						onClick={handleClear}
						className="shrink-0 rounded-full border border-stone-200 bg-white p-2 text-stone-500 transition-colors hover:border-stone-400 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
						disabled={disabled || processing}
						aria-label="Remove reference image"
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
