import type { Metadata } from "next";
import { StampCard } from "@/components/stamp-card";
import type { Stamp } from "@/db/schema";

export const metadata: Metadata = {
	title: "Collections — stamp.builder",
	description: "Browse the public collection of AI-generated stamps.",
};

async function getStamps(): Promise<Stamp[]> {
	try {
		// In production, this fetches from D1 via the API
		// During build/dev without D1, return empty
		const { getEnv } = await import("@/lib/env");
		const env = await getEnv();
		const { createDb } = await import("@/db");
		const { stamps } = await import("@/db/schema");
		const { desc, eq } = await import("drizzle-orm");

		const db = createDb(env.DB as unknown as D1Database);
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
			<div className="text-center mb-10">
				<h1 className="text-4xl font-bold text-stone-800">Collections</h1>
				<p className="mt-2 text-stone-500 font-sans">
					Stamps created by the community. All public and free to share.
				</p>
			</div>

			{allStamps.length === 0 ? (
				<div className="text-center py-20 font-sans">
					<span className="text-6xl block mb-4">📭</span>
					<p className="text-stone-500 text-lg">No stamps yet.</p>
					<p className="text-stone-400 mt-1">
						Be the first to{" "}
						<a href="/generate" className="text-stamp-blue hover:underline">
							create one
						</a>
						!
					</p>
				</div>
			) : (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
					{allStamps.map((stamp) => (
						<StampCard key={stamp.id} stamp={stamp} />
					))}
				</div>
			)}
		</div>
	);
}
