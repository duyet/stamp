import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { StampCard } from "@/components/stamp-card";
import type { Stamp } from "@/db/schema";
import { stamps } from "@/db/schema";

export const metadata: Metadata = {
	title: "Collections — stamp.builder",
	description:
		"Browse AI-generated postage stamps created by the community. Vintage folk art style illustrations.",
	openGraph: {
		title: "Stamp Collections — stamp.builder",
		description: "Browse AI-generated postage stamps created by the community",
		url: "https://stamp.builder/collections",
	},
};

async function getStamps(): Promise<Stamp[]> {
	try {
		const { getDb } = await import("@/db");
		const db = getDb();
		return await db
			.select()
			.from(stamps)
			.where(eq(stamps.isPublic, true))
			.orderBy(desc(stamps.createdAt))
			.limit(50);
	} catch {
		return [];
	}
}

export default async function CollectionsPage() {
	const allStamps = await getStamps();

	return (
		<div className="max-w-5xl mx-auto px-4 py-12">
			<div className="mb-10">
				<h1 className="text-2xl font-semibold text-neutral-900">Collections</h1>
				<p className="mt-1 text-sm text-neutral-500">
					{allStamps.length} stamps created by the community
				</p>
			</div>

			{allStamps.length === 0 ? (
				<div className="text-center py-20">
					<p className="text-neutral-500 text-base">No stamps yet.</p>
					<p className="text-neutral-400 text-sm mt-1">
						Be the first to{" "}
						<a
							href="/generate"
							className="text-neutral-700 hover:text-neutral-900 underline underline-offset-2 transition"
						>
							create one
						</a>
						.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{allStamps.map((stamp) => (
						<StampCard key={stamp.id} stamp={stamp} />
					))}
				</div>
			)}
		</div>
	);
}
