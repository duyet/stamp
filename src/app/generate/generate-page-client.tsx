"use client";

import { useEffect } from "react";
import { GenerateForm } from "@/components/generate-form";
import { useTrack } from "@/hooks/use-track";

export function GeneratePageClient() {
	const { track } = useTrack();

	useEffect(() => {
		track("page_view", { context: "generate" });
	}, [track]);

	return (
		<div className="max-w-5xl mx-auto px-6 py-10 sm:py-14 animate-page-fade-in">
			<div className="text-center mb-8">
				<h1
					className="text-4xl md:text-5xl font-bold tracking-tight mb-3 hero-gradient"
					style={{ fontFamily: "var(--font-stamp)" }}
				>
					Create your stamp
				</h1>
				<p className="text-base text-stone-600">
					Describe what you want, pick a style, and let AI do the rest.
				</p>
			</div>
			<GenerateForm />
		</div>
	);
}
