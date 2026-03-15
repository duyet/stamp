import type { Metadata } from "next";
import { GenerateForm } from "@/components/generate-form";

export const metadata: Metadata = {
	title: "Create a Stamp — stamp.builder",
	description: "Generate a unique AI-powered postage stamp illustration.",
};

export default function GeneratePage() {
	return (
		<div className="max-w-5xl mx-auto px-4 py-12">
			<div className="text-center mb-10">
				<h1 className="text-4xl font-bold text-stone-800">Create your stamp</h1>
				<p className="mt-2 text-stone-500 font-sans">
					Describe what you want, pick a style, and let AI do the rest.
				</p>
			</div>
			<GenerateForm />
		</div>
	);
}
