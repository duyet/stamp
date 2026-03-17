"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { CloseIcon, UploadIcon } from "@/components/icons";

export interface ReferenceData {
	referenceId: string;
	referenceImageUrl: string;
	referenceDescription: string;
}

interface ImageUploadProps {
	onDescribed: (data: ReferenceData) => void;
	onClear: () => void;
	disabled?: boolean;
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ImageUpload({
	onDescribed,
	onClear,
	disabled,
}: ImageUploadProps) {
	const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">(
		"idle",
	);
	const [preview, setPreview] = useState<string | null>(null);
	const [description, setDescription] = useState<string | null>(null);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	async function handleFile(file: File) {
		if (!ACCEPTED_TYPES.includes(file.type)) {
			setStatus("error");
			setErrorMsg("Please upload a JPG, PNG, or WebP image.");
			return;
		}
		if (file.size > MAX_SIZE) {
			setStatus("error");
			setErrorMsg("Image must be under 5MB.");
			return;
		}

		setPreview(URL.createObjectURL(file));
		setStatus("uploading");
		setErrorMsg(null);

		try {
			const formData = new FormData();
			formData.append("image", file);

			const res = await fetch("/api/upload-reference", {
				method: "POST",
				body: formData,
			});

			const data = (await res.json()) as ReferenceData & { error?: string };

			if (!res.ok) {
				setStatus("error");
				setErrorMsg(data.error || "Upload failed. Please try again.");
				return;
			}

			setDescription(data.referenceDescription);
			setStatus("done");
			onDescribed(data);
		} catch {
			setStatus("error");
			setErrorMsg("Upload failed. Please try again.");
		}
	}

	function handleClear() {
		if (preview) URL.revokeObjectURL(preview);
		setStatus("idle");
		setPreview(null);
		setDescription(null);
		setErrorMsg(null);
		if (inputRef.current) inputRef.current.value = "";
		onClear();
	}

	function handleDrop(e: React.DragEvent) {
		e.preventDefault();
		const file = e.dataTransfer.files[0];
		if (file) handleFile(file);
	}

	function handleDragOver(e: React.DragEvent) {
		e.preventDefault();
	}

	if (status === "idle" || status === "error") {
		return (
			<div>
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
				{status === "error" && errorMsg && (
					<div className="mt-1.5 flex items-center justify-between">
						<p className="text-xs text-red-600">{errorMsg}</p>
						<button
							type="button"
							onClick={() => {
								setStatus("idle");
								setErrorMsg(null);
							}}
							className="text-xs text-stone-500 hover:text-stone-700 transition-colors"
						>
							Try again
						</button>
					</div>
				)}
			</div>
		);
	}

	if (status === "uploading") {
		return (
			<div className="flex items-center gap-3 p-3 border border-stone-200 rounded-lg bg-stone-50">
				{preview && (
					<div className="w-12 h-12 rounded overflow-hidden shrink-0">
						<Image
							src={preview}
							alt="Uploading reference"
							width={48}
							height={48}
							className="object-cover w-full h-full"
							unoptimized
						/>
					</div>
				)}
				<div className="flex items-center gap-2 text-xs text-stone-500">
					<svg
						className="animate-spin h-3.5 w-3.5"
						viewBox="0 0 24 24"
						fill="none"
						aria-hidden="true"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						/>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
						/>
					</svg>
					Analyzing your photo...
				</div>
			</div>
		);
	}

	return (
		<div className="flex items-start gap-3 p-3 border border-stone-200 rounded-lg bg-stone-50">
			{preview && (
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
			)}
			<div className="flex-1 min-w-0">
				<p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
					{description}
				</p>
			</div>
			<button
				type="button"
				onClick={handleClear}
				className="shrink-0 p-1 text-stone-400 hover:text-stone-600 transition-colors"
				disabled={disabled}
			>
				<CloseIcon />
			</button>
		</div>
	);
}
