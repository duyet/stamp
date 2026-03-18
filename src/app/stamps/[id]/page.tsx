import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { stamps } from "@/db/schema";
import { StampDetailClient } from "./stamp-detail-client";

interface StampPageProps {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({
	params,
}: StampPageProps): Promise<Metadata> {
	const { id } = await params;

	try {
		const db = getDb();
		const stamp = await db
			.select()
			.from(stamps)
			.where(and(eq(stamps.id, id), eq(stamps.isPublic, true)))
			.get();

		if (!stamp) {
			return {
				title: "Stamp Not Found",
			};
		}

		const title = stamp.description || stamp.prompt;
		const description = `AI-generated postage stamp: ${stamp.prompt} (${stamp.style} style)`;

		return {
			title: `${title} — Stamp`,
			description,
			openGraph: {
				title,
				description,
				images: [
					{
						url: stamp.imageUrl,
						width: 512,
						height: 512,
						alt: title,
					},
				],
			},
			twitter: {
				card: "summary_large_image",
				title,
				description,
				images: [stamp.imageUrl],
			},
		};
	} catch {
		return {
			title: "Stamp — Error",
		};
	}
}

export default async function StampPage({ params }: StampPageProps) {
	const { id } = await params;

	try {
		const db = getDb();
		const stamp = await db
			.select()
			.from(stamps)
			.where(and(eq(stamps.id, id), eq(stamps.isPublic, true)))
			.get();

		if (!stamp) {
			notFound();
		}

		return <StampDetailClient stamp={stamp} />;
	} catch (error) {
		console.error("Failed to fetch stamp:", error);
		notFound();
	}
}
