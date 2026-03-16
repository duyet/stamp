import type { Metadata } from "next";
import { GeneratePageClient } from "./generate-page-client";

export const metadata: Metadata = {
	title: "Create a Stamp — stamp.builders",
	description: "Generate a unique AI-powered postage stamp illustration.",
};

export default function GeneratePage() {
	return <GeneratePageClient />;
}
