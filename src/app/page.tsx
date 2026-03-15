import { desc, eq } from "drizzle-orm";
import { HomeContent } from "@/components/home-content";
import type { Stamp } from "@/db/schema";
import { stamps } from "@/db/schema";

export const dynamic = "force-dynamic";

async function getLatestStamps(): Promise<Stamp[]> {
	try {
		const { getDb } = await import("@/db");
		const db = getDb();
		return await db
			.select()
			.from(stamps)
			.where(eq(stamps.isPublic, true))
			.orderBy(desc(stamps.createdAt))
			.limit(8);
	} catch {
		return [];
	}
}

export default async function HomePage() {
	const latestStamps = await getLatestStamps();
	return <HomeContent initialStamps={latestStamps} />;
}
