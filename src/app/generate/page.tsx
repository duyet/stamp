import type { Metadata } from "next";
import { GenerateForm } from "@/components/generate-form";

export const metadata: Metadata = {
	title: "Create a Stamp — stamp.builders",
	description: "Generate a unique AI-powered postage stamp illustration.",
};

export default function GeneratePage() {
	return (
		<div className="max-w-5xl mx-auto px-6 py-20">
			<div className="text-center mb-12">
				<h1
					className="text-4xl font-bold text-stamp-navy tracking-tight"
					style={{ fontFamily: "var(--font-stamp)" }}
				>
					Create your stamp
				</h1>
				<p className="mt-3 text-stone-500">
					Describe what you want, pick a style, and let AI do the rest.
				</p>
			</div>
			<GenerateForm />
		</div>
	);
}
