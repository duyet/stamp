import { createFileRoute } from "@tanstack/react-router";
import { sql } from "drizzle-orm";
import type { z } from "zod";
import type { Database } from "@/db";
import { getDb } from "@/db";
import { jsonResponse } from "@/lib/api-utils";
import { isAdmin } from "@/lib/auth";
import { getAuthUserIdentity } from "@/lib/clerk";
import { getEnv } from "@/lib/env";
import { getClientIp } from "@/lib/get-client-ip";
import { hashIp } from "@/lib/hash-ip";
import { checkAnalyticsRateLimit } from "@/lib/rate-limit";
import { eventMetricsSchema, stampCountsSchema } from "@/lib/schemas";
import { COUNTRY_NAMES } from "@/lib/world-map-data";

// Type aliases derived from zod schemas
type StampCountsResult = z.infer<typeof stampCountsSchema>;
type EventMetricsResult = z.infer<typeof eventMetricsSchema>;
type RawRow = Record<string, unknown>;

const UNKNOWN_LABEL = "Unknown";
const MAX_REFERRER_GROUPS = 50;
const MAX_USER_AGENT_GROUPS = 100;
const WORKERS_AI_FREE_NEURONS_PER_DAY = 10_000;
const DEFAULT_CLOUDFLARE_ACCOUNT_ID = "23050adb6c92e313643a29e1ba64c88a";

function toNumber(value: unknown): number {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "bigint") return Number(value);
	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
}

function toStringValue(value: unknown, fallback = UNKNOWN_LABEL): string {
	if (typeof value !== "string") return fallback;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : fallback;
}

function normalizeHost(referrer: unknown): string {
	if (typeof referrer !== "string" || referrer.trim().length === 0) {
		return UNKNOWN_LABEL;
	}

	try {
		return new URL(referrer).hostname.replace(/^www\./, "") || UNKNOWN_LABEL;
	} catch {
		const stripped = referrer
			.replace(/^https?:\/\//i, "")
			.replace(/^www\./i, "")
			.split("/")[0]
			.split("?")[0]
			.trim();
		return stripped || UNKNOWN_LABEL;
	}
}

function browserFamily(userAgent: unknown): string {
	if (typeof userAgent !== "string" || userAgent.length === 0) {
		return UNKNOWN_LABEL;
	}
	const ua = userAgent.toLowerCase();
	if (ua.includes("edg/")) return "Edge";
	if (ua.includes("chrome/") || ua.includes("crios/")) return "Chrome";
	if (ua.includes("firefox/") || ua.includes("fxios/")) return "Firefox";
	if (ua.includes("safari/") && !ua.includes("chrome/")) return "Safari";
	if (ua.includes("bot") || ua.includes("crawler") || ua.includes("spider")) {
		return "Bot";
	}
	return "Other";
}

function groupRowsByLabel(
	rows: RawRow[],
	labelForRow: (row: RawRow) => string,
	countKey = "count",
): Array<{ label: string; count: number }> {
	const grouped = new Map<string, number>();
	for (const row of rows) {
		const label = labelForRow(row);
		grouped.set(label, (grouped.get(label) ?? 0) + toNumber(row[countKey]));
	}

	return [...grouped.entries()]
		.map(([label, count]) => ({ label, count }))
		.sort((a, b) => b.count - a.count);
}

function buildEventTrend(rows: RawRow[]): Array<{
	day: number;
	total: number;
	pageViews: number;
	generations: number;
	downloads: number;
	shares: number;
	copies: number;
	stampViews: number;
}> {
	const days = new Map<
		number,
		{
			day: number;
			total: number;
			pageViews: number;
			generations: number;
			downloads: number;
			shares: number;
			copies: number;
			stampViews: number;
		}
	>();

	for (const row of rows) {
		const day = toNumber(row.day);
		const event = toStringValue(row.event, "");
		const count = toNumber(row.count);
		const entry = days.get(day) ?? {
			day,
			total: 0,
			pageViews: 0,
			generations: 0,
			downloads: 0,
			shares: 0,
			copies: 0,
			stampViews: 0,
		};
		entry.total += count;
		if (event === "page_view") entry.pageViews += count;
		if (event === "generation") entry.generations += count;
		if (event === "download") entry.downloads += count;
		if (event === "share") entry.shares += count;
		if (event === "copy_link") entry.copies += count;
		if (event === "stamp_view") entry.stampViews += count;
		days.set(day, entry);
	}

	return [...days.values()].sort((a, b) => a.day - b.day);
}

function buildCreditTrend(
	rows: RawRow[],
): Array<{ day: number; count: number; totalAmount: number }> {
	return rows.map((row) => ({
		day: toNumber(row.day),
		count: toNumber(row.count),
		totalAmount: toNumber(row.total_amount),
	}));
}

function nextUtcMidnight(now = new Date()): string {
	return new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
	).toISOString();
}

async function getWorkersAiCredits(env: CloudflareEnv): Promise<{
	status: "ok" | "unconfigured" | "unavailable";
	dailyFreeNeurons: number;
	usedNeuronsToday: number;
	remainingNeuronsToday: number;
	requestsToday: number;
	resetAt: string;
}> {
	const token = env.CLOUDFLARE_API_TOKEN?.trim();
	const accountId =
		env.CLOUDFLARE_ACCOUNT_ID?.trim() || DEFAULT_CLOUDFLARE_ACCOUNT_ID;
	const resetAt = nextUtcMidnight();

	if (!token || !accountId) {
		return {
			status: "unconfigured",
			dailyFreeNeurons: WORKERS_AI_FREE_NEURONS_PER_DAY,
			usedNeuronsToday: 0,
			remainingNeuronsToday: WORKERS_AI_FREE_NEURONS_PER_DAY,
			requestsToday: 0,
			resetAt,
		};
	}

	const now = new Date();
	const start = new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
	).toISOString();

	const query = `
		query WorkersAiUsage($accountTag: string!, $start: Time!) {
			viewer {
				accounts(filter: { accountTag: $accountTag }) {
					aiInferenceAdaptiveGroups(limit: 1, filter: { datetime_geq: $start }) {
						count
						sum {
							totalNeurons
						}
					}
				}
			}
		}
	`;

	try {
		const response = await fetch(
			"https://api.cloudflare.com/client/v4/graphql",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					query,
					variables: { accountTag: accountId, start },
				}),
			},
		);

		if (!response.ok) {
			console.warn(
				"[Analytics] Workers AI usage query failed:",
				response.status,
			);
			throw new Error("Cloudflare GraphQL request failed");
		}

		const body = (await response.json()) as {
			data?: {
				viewer?: {
					accounts?: Array<{
						aiInferenceAdaptiveGroups?: Array<{
							count?: number;
							sum?: { totalNeurons?: number };
						}>;
					}>;
				};
			};
			errors?: unknown[];
		};

		if (body.errors?.length) {
			console.warn("[Analytics] Workers AI usage query errors:", body.errors);
			throw new Error("Cloudflare GraphQL returned errors");
		}

		const group =
			body.data?.viewer?.accounts?.[0]?.aiInferenceAdaptiveGroups?.[0];
		const usedNeuronsToday = Math.max(
			0,
			Math.round(toNumber(group?.sum?.totalNeurons)),
		);
		const requestsToday = Math.max(0, Math.round(toNumber(group?.count)));

		return {
			status: "ok",
			dailyFreeNeurons: WORKERS_AI_FREE_NEURONS_PER_DAY,
			usedNeuronsToday,
			remainingNeuronsToday: Math.max(
				0,
				WORKERS_AI_FREE_NEURONS_PER_DAY - usedNeuronsToday,
			),
			requestsToday,
			resetAt,
		};
	} catch (error) {
		console.warn("[Analytics] Failed to load Workers AI usage:", error);
		return {
			status: "unavailable",
			dailyFreeNeurons: WORKERS_AI_FREE_NEURONS_PER_DAY,
			usedNeuronsToday: 0,
			remainingNeuronsToday: WORKERS_AI_FREE_NEURONS_PER_DAY,
			requestsToday: 0,
			resetAt,
		};
	}
}
/**
 * Fetch pre-aggregated daily stats for performance optimization.
 * Returns data from daily_stats table if available, falling back to raw queries.
 *
 * Performance: Single query vs 8 parallel queries (~300ms savings for large datasets)
 *
 * @param db - Database instance
 * @param daysAgo - Number of days to fetch (default: 30 for monthly trends)
 * @returns Array of daily stats records
 */
async function getDailyStats(
	db: Database,
	daysAgo: number = 30,
): Promise<
	Array<{
		date: string;
		total_stamps: number;
		new_stamps: number;
		page_views: number;
		unique_visitors: number;
		downloads: number;
		shares: number;
	}>
> {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
	const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

	try {
		const stats = await db.all(sql`
			SELECT
				date,
				total_stamps,
				new_stamps,
				page_views,
				unique_visitors,
				downloads,
				shares
			FROM daily_stats
			WHERE date >= ${cutoffDateStr}
			ORDER BY date DESC
		`);

		if (stats.length > 0) {
			return stats.map((row) => ({
				date: toStringValue((row as RawRow).date, ""),
				total_stamps: toNumber((row as RawRow).total_stamps),
				new_stamps: toNumber((row as RawRow).new_stamps),
				page_views: toNumber((row as RawRow).page_views),
				unique_visitors: toNumber((row as RawRow).unique_visitors),
				downloads: toNumber((row as RawRow).downloads),
				shares: toNumber((row as RawRow).shares),
			}));
		}
	} catch (error) {
		console.warn(
			"[Analytics] daily_stats query failed, falling back to raw queries:",
			error,
		);
	}

	return [];
}

// Time constants for analytics calculations
const SECONDS_PER_DAY = 86_400;
const WEEK_DAYS = 7;
const MONTH_DAYS = 30;

export async function GET(request: Request): Promise<Response> {
	const env = getEnv();
	const db = getDb();

	const { userId, email } = await getAuthUserIdentity();
	const rawIp = getClientIp(request.headers);
	const userIp = rawIp ? await hashIp(rawIp) : "anonymous";

	// Require authentication
	if (!userId) {
		return jsonResponse({ error: "Unauthorized" }, 401);
	}

	// Fail-closed admin check: no admin list configured = 403
	if (!isAdmin(userId, email)) {
		return jsonResponse({ error: "Forbidden" }, 403);
	}

	// Rate limit expensive analytics queries
	const { allowed, remaining: _remaining } = await checkAnalyticsRateLimit(
		db,
		userIp,
	);
	if (!allowed) {
		return jsonResponse(
			{ error: "Rate limit exceeded. Please try again later." },
			429,
		);
	}

	try {
		// Stamps may be stored in seconds by Drizzle timestamp mode; events and
		// credit/rate-limit rows are inserted as Date.now() milliseconds.
		const nowSec = Math.floor(Date.now() / 1000);
		const nowMs = Date.now();
		const todayStart = nowSec - (nowSec % SECONDS_PER_DAY);
		const weekStart = todayStart - (WEEK_DAYS - 1) * SECONDS_PER_DAY;
		const monthStart = todayStart - (MONTH_DAYS - 1) * SECONDS_PER_DAY;
		const thirtyDaysAgo = nowSec - MONTH_DAYS * SECONDS_PER_DAY;
		const todayStartMs = todayStart * 1000;
		const thirtyDaysAgoMs = thirtyDaysAgo * 1000;
		const workersAiCreditsPromise = getWorkersAiCredits(env);

		// Try pre-aggregated daily_stats first (performance optimization: 8 queries → 1 query)
		const dailyStatsData = await getDailyStats(db, 30);

		let stampCountsResult: StampCountsResult;
		let eventMetricsResult: EventMetricsResult;
		let dailyTrendResult: Array<{ day: number; count: number }>;

		if (dailyStatsData.length > 0) {
			// Use pre-aggregated data from daily_stats table
			const latest = dailyStatsData[0];
			const todayDate = new Date().toISOString().split("T")[0];
			const today = dailyStatsData.find((s) => s.date === todayDate);
			const weekData = dailyStatsData.slice(0, WEEK_DAYS);
			const monthData = dailyStatsData.slice(0, MONTH_DAYS);

			stampCountsResult = {
				total_stamps: latest.total_stamps,
				stamps_today: today?.new_stamps ?? 0,
				stamps_week: weekData.reduce((sum, s) => sum + s.new_stamps, 0),
				stamps_month: monthData.reduce((sum, s) => sum + s.new_stamps, 0),
			};

			eventMetricsResult = {
				total_page_views: dailyStatsData.reduce(
					(sum, s) => sum + s.page_views,
					0,
				),
				total_downloads: dailyStatsData.reduce(
					(sum, s) => sum + s.downloads,
					0,
				),
				total_shares: dailyStatsData.reduce((sum, s) => sum + s.shares, 0),
			};

			// Build daily trend from daily_stats
			dailyTrendResult = dailyStatsData
				.map((s) => {
					const date = new Date(s.date);
					const dayTimestamp = Math.floor(date.getTime() / 1000);
					return { day: dayTimestamp, count: s.new_stamps };
				})
				.sort((a, b) => a.day - b.day);
		} else {
			// Fallback to raw queries if daily_stats is empty (first run or migration issue)
			console.warn("[Analytics] daily_stats empty, using raw queries");

			// Consolidated stamp count query (4 aggregations → 1 query)
			const stampRows = await db.all(
				sql`
					SELECT
						count(*) as total_stamps,
						count(CASE WHEN stamp_sec >= ${todayStart} THEN 1 END) as stamps_today,
						count(CASE WHEN stamp_sec >= ${weekStart} THEN 1 END) as stamps_week,
						count(CASE WHEN stamp_sec >= ${monthStart} THEN 1 END) as stamps_month
					FROM (
						SELECT CASE WHEN created_at > 100000000000 THEN created_at / 1000 ELSE created_at END as stamp_sec
						FROM stamps
					)
				`,
			);
			const parsedStamps = stampCountsSchema.safeParse(stampRows[0]);
			stampCountsResult = parsedStamps.success
				? parsedStamps.data
				: { total_stamps: 0, stamps_today: 0, stamps_week: 0, stamps_month: 0 };

			// Consolidated event metrics query (3 aggregations → 1 query)
			const eventRows = await db.all(
				sql`
					SELECT
						count(CASE WHEN event = 'page_view' THEN 1 END) as total_page_views,
						count(CASE WHEN event = 'download' THEN 1 END) as total_downloads,
						count(CASE WHEN event IN ('copy_link', 'share') THEN 1 END) as total_shares
					FROM events
				`,
			);
			const parsedEvents = eventMetricsSchema.safeParse(eventRows[0]);
			eventMetricsResult = parsedEvents.success
				? parsedEvents.data
				: { total_page_views: 0, total_downloads: 0, total_shares: 0 };

			// Daily trend query
			const trendData = await db.all(sql`
				SELECT
					cast(stamp_sec / 86400 as integer) * 86400 as day,
					count(*) as count
				FROM (
					SELECT CASE WHEN created_at > 100000000000 THEN created_at / 1000 ELSE created_at END as stamp_sec
					FROM stamps
				)
				WHERE stamp_sec >= ${thirtyDaysAgo}
				GROUP BY cast(stamp_sec / 86400 as integer) * 86400
				ORDER BY cast(stamp_sec / 86400 as integer) * 86400
			`);
			dailyTrendResult = trendData.map((row) => ({
				day: toNumber((row as RawRow).day),
				count: toNumber((row as RawRow).count),
			}));
		}

		// Parallel queries for remaining analytics (not in daily_stats yet)
		const [
			popularStylesResult,
			uniqueVisitorsResult,
			eventBreakdownResult,
			pageViewBreakdownResult,
			locationCountryResult,
			locationCityResult,
			timezoneResult,
			stampOverviewResult,
			generationMetricsResult,
			referrerRows,
			userAgentRows,
			eventTrendRows,
			creditOverviewResult,
			creditTransactionBreakdownResult,
			creditTransactionTrendRows,
			rateLimitOverviewRows,
			workersAiCredits,
		] = await Promise.all([
			db.all(sql`
				SELECT style, count(*) as count
				FROM stamps
				GROUP BY style
				ORDER BY count(*) DESC
			`),

			// Use daily_stats if available, otherwise query raw
			dailyStatsData.length > 0
				? db.all(sql`
						SELECT cast(sum(unique_visitors) as integer) as count
						FROM daily_stats
					`)
				: db.all(sql`
						SELECT count(distinct user_ip) as count
						FROM events
						WHERE user_ip is not null
					`),

			db.all(sql`
				SELECT event, count(*) as count
				FROM events
				GROUP BY event
				ORDER BY count(*) DESC
				LIMIT 50
			`),

			db.all(sql`
				SELECT json_extract(metadata, '$.path') as path, count(*) as count
				FROM events
				WHERE event = 'page_view' AND json_extract(metadata, '$.path') is not null
				GROUP BY json_extract(metadata, '$.path')
				ORDER BY count(*) DESC
				LIMIT 50
			`),

			// Location: top countries
			db.all(sql`
				SELECT location_country as countryCode, count(*) as count
				FROM stamps
				WHERE location_country is not null
				GROUP BY location_country
				ORDER BY count(*) DESC
				LIMIT 30
			`),

			// Location: top cities (with country)
			db.all(sql`
				SELECT location_country as countryCode, location_city as city, count(*) as count
				FROM stamps
				WHERE location_city is not null AND location_country is not null
				GROUP BY location_country, location_city
				ORDER BY count(*) DESC
				LIMIT 20
			`),

			// Timezone: activity by timezone and hour
			db.all(sql`
				SELECT
					user_timezone as timezone,
					cast((stamp_sec % 86400) / 3600 as integer) as hour,
					count(*) as count
				FROM (
					SELECT
						user_timezone,
						CASE WHEN created_at > 100000000000 THEN created_at / 1000 ELSE created_at END as stamp_sec
					FROM stamps
					WHERE user_timezone is not null
				)
				GROUP BY user_timezone, cast((stamp_sec % 86400) / 3600 as integer)
				ORDER BY count(*) DESC
				LIMIT 500
			`),

			db.all(sql`
				SELECT
					count(*) as total,
					count(CASE WHEN is_public = 1 THEN 1 END) as public_count,
					count(CASE WHEN is_public = 0 THEN 1 END) as private_count,
					count(CASE WHEN reference_image_url is not null THEN 1 END) as with_reference,
					count(CASE WHEN reference_image_url is null THEN 1 END) as without_reference,
					count(CASE WHEN description is not null THEN 1 END) as with_description,
					count(CASE WHEN location_country is not null THEN 1 END) as with_location,
					count(CASE WHEN user_id is not null THEN 1 END) as authenticated,
					count(CASE WHEN user_id is null THEN 1 END) as anonymous,
					count(CASE WHEN session_token is not null THEN 1 END) as session_owned,
					count(distinct user_id) as distinct_users
				FROM stamps
			`),

			db.all(sql`
				SELECT
					count(*) as generations,
					avg(cast(json_extract(metadata, '$.generation_time_ms') as real)) as average_generation_time_ms,
					max(cast(json_extract(metadata, '$.generation_time_ms') as integer)) as max_generation_time_ms,
					avg(cast(json_extract(metadata, '$.prompt_length') as real)) as average_prompt_length,
					count(CASE WHEN json_extract(metadata, '$.hd') = 1 THEN 1 END) as hd_generations,
					count(CASE WHEN json_extract(metadata, '$.has_reference') = 1 THEN 1 END) as reference_generations
				FROM events
				WHERE event = 'generation'
			`),

			db.all(sql`
				SELECT referrer, count(*) as count
				FROM stamps
				WHERE referrer is not null
				GROUP BY referrer
				ORDER BY count(*) DESC
				LIMIT ${MAX_REFERRER_GROUPS}
			`),

			db.all(sql`
				SELECT user_agent, count(*) as count
				FROM stamps
				WHERE user_agent is not null
				GROUP BY user_agent
				ORDER BY count(*) DESC
				LIMIT ${MAX_USER_AGENT_GROUPS}
			`),

			db.all(sql`
				SELECT
					cast((created_at / 1000) / 86400 as integer) * 86400 as day,
					event,
					count(*) as count
				FROM events
				WHERE created_at >= ${thirtyDaysAgoMs}
				GROUP BY cast((created_at / 1000) / 86400 as integer) * 86400, event
				ORDER BY cast((created_at / 1000) / 86400 as integer) * 86400
			`),

			db.all(sql`
				SELECT
					count(*) as users,
					coalesce(sum(daily_limit), 0) as total_daily_limit,
					coalesce(sum(daily_used), 0) as total_daily_used,
					coalesce(sum(daily_limit - daily_used), 0) as total_daily_remaining,
					coalesce(sum(purchased_credits), 0) as purchased_credits,
					count(CASE WHEN purchased_credits > 0 THEN 1 END) as users_with_purchased_credits
				FROM user_credits
			`),

			db.all(sql`
				SELECT type, count(*) as count, coalesce(sum(amount), 0) as total_amount
				FROM credit_transactions
				GROUP BY type
				ORDER BY count(*) DESC
				LIMIT 50
			`),

			db.all(sql`
				SELECT
					cast((created_at / 1000) / 86400 as integer) * 86400 as day,
					count(*) as count,
					coalesce(sum(amount), 0) as total_amount
				FROM credit_transactions
				WHERE created_at >= ${thirtyDaysAgoMs}
				GROUP BY cast((created_at / 1000) / 86400 as integer) * 86400
				ORDER BY cast((created_at / 1000) / 86400 as integer) * 86400
			`),

			db.all(sql`
				SELECT 'generation limits' as label, count(*) as rows, coalesce(max(generations_count), 0) as max_count, coalesce(sum(generations_count), 0) as total_count
				FROM rate_limits
				WHERE window_start >= ${todayStartMs}
				UNION ALL
				SELECT 'analytics limits' as label, count(*) as rows, coalesce(max(generations_count), 0) as max_count, coalesce(sum(generations_count), 0) as total_count
				FROM analytics_rate_limits
				WHERE window_start >= ${nowMs - 60 * 60 * 1000}
				UNION ALL
				SELECT 'tracking limits' as label, count(*) as rows, coalesce(max(event_count), 0) as max_count, coalesce(sum(event_count), 0) as total_count
				FROM track_rate_limits
				WHERE window_start >= ${nowMs - 60 * 1000}
			`),
			workersAiCreditsPromise,
		]);

		const totalWithLocation = locationCountryResult.reduce<number>(
			(sum, r) => sum + toNumber((r as RawRow).count),
			0,
		);

		// Build timezone hourly data
		const tzMap = new Map<string, { hourly: number[]; total: number }>();
		for (const row of timezoneResult) {
			const rawRow = row as RawRow;
			const timezone = toStringValue(rawRow.timezone, "");
			if (!timezone) continue;
			if (!tzMap.has(timezone)) {
				tzMap.set(timezone, { hourly: new Array(24).fill(0), total: 0 });
			}
			const entry = tzMap.get(timezone);
			if (!entry) continue;
			const h = Math.min(23, Math.max(0, toNumber(rawRow.hour)));
			const count = toNumber(rawRow.count);
			entry.hourly[h] += count;
			entry.total += count;
		}
		const timezones = [...tzMap.entries()]
			.sort((a, b) => b[1].total - a[1].total)
			.slice(0, 10)
			.map(([tz, data]) => ({
				timezone: tz,
				hourlyData: data.hourly,
				total: data.total,
			}));

		// Build location stats (merging country + city data)
		const locations = locationCountryResult.map((row) => {
			const r = row as RawRow;
			const countryCode = toStringValue(r.countryCode, "XX");
			const count = toNumber(r.count);
			return {
				country: COUNTRY_NAMES[countryCode] ?? countryCode ?? "Unknown",
				countryCode,
				count,
				percentage:
					totalWithLocation > 0
						? Math.round((count / totalWithLocation) * 100)
						: 0,
				topCities: locationCityResult
					.filter((c) => (c as RawRow).countryCode === countryCode)
					.slice(0, 3)
					.map((c) => ({
						city: toStringValue((c as RawRow).city),
						count: toNumber((c as RawRow).count),
					})),
			};
		});

		const mapData = locationCountryResult.map((row) => ({
			countryCode: toStringValue((row as RawRow).countryCode, "XX"),
			count: toNumber((row as RawRow).count),
		}));

		const stampOverview = (stampOverviewResult[0] ?? {}) as RawRow;
		const generationMetrics = (generationMetricsResult[0] ?? {}) as RawRow;
		const creditOverview = (creditOverviewResult[0] ?? {}) as RawRow;
		const rateLimitRows = rateLimitOverviewRows.map((row) => row as RawRow);
		const rateLimitByLabel = new Map(
			rateLimitRows.map((row) => [toStringValue(row.label, ""), row]),
		);
		const generationLimits = rateLimitByLabel.get("generation limits") ?? {};
		const analyticsLimits = rateLimitByLabel.get("analytics limits") ?? {};
		const trackingLimits = rateLimitByLabel.get("tracking limits") ?? {};
		const rateLimitPressure = rateLimitRows.flatMap((row) => {
			const label = toStringValue(row.label);
			return [
				{ label: `${label} rows`, count: toNumber(row.rows) },
				{ label: `${label} max`, count: toNumber(row.max_count) },
			];
		});

		const publicCount = toNumber(stampOverview.public_count);
		const privateCount = toNumber(stampOverview.private_count);
		const totalStampOverview = toNumber(stampOverview.total);

		return jsonResponse(
			{
				totalStamps: stampCountsResult.total_stamps,
				stampsToday: stampCountsResult.stamps_today,
				stampsThisWeek: stampCountsResult.stamps_week,
				stampsThisMonth: stampCountsResult.stamps_month,
				popularStyles: popularStylesResult.map((row) => ({
					style: toStringValue((row as RawRow).style, "vintage"),
					count: toNumber((row as RawRow).count),
				})),
				dailyTrend: dailyTrendResult,
				totalPageViews: eventMetricsResult.total_page_views,
				uniqueVisitors: toNumber((uniqueVisitorsResult[0] as RawRow)?.count),
				totalDownloads: eventMetricsResult.total_downloads,
				totalShares: eventMetricsResult.total_shares,
				eventBreakdown: eventBreakdownResult.map((row) => ({
					event: toStringValue((row as RawRow).event),
					count: toNumber((row as RawRow).count),
				})),
				pageViewBreakdown: pageViewBreakdownResult.map((row) => ({
					path: toStringValue((row as RawRow).path),
					count: toNumber((row as RawRow).count),
				})),
				locations,
				timezones,
				mapData,
				stampVisibility: {
					public: publicCount,
					private: privateCount,
					publicPercentage:
						totalStampOverview > 0
							? Math.round((publicCount / totalStampOverview) * 100)
							: 0,
				},
				stampInputs: {
					withReference: toNumber(stampOverview.with_reference),
					withoutReference: toNumber(stampOverview.without_reference),
					withDescription: toNumber(stampOverview.with_description),
					withLocation: toNumber(stampOverview.with_location),
				},
				ownership: {
					authenticated: toNumber(stampOverview.authenticated),
					anonymous: toNumber(stampOverview.anonymous),
					sessionOwned: toNumber(stampOverview.session_owned),
					distinctUsers: toNumber(stampOverview.distinct_users),
				},
				referrerBreakdown: groupRowsByLabel(referrerRows as RawRow[], (row) =>
					normalizeHost(row.referrer),
				),
				userAgentBreakdown: groupRowsByLabel(userAgentRows as RawRow[], (row) =>
					browserFamily(row.user_agent),
				),
				eventTrend: buildEventTrend(eventTrendRows as RawRow[]),
				generationPerformance: {
					generations: toNumber(generationMetrics.generations),
					averageMs: Math.round(
						toNumber(generationMetrics.average_generation_time_ms),
					),
					maxMs: toNumber(generationMetrics.max_generation_time_ms),
					averagePromptLength: Math.round(
						toNumber(generationMetrics.average_prompt_length),
					),
					hdGenerations: toNumber(generationMetrics.hd_generations),
					referenceGenerations: toNumber(
						generationMetrics.reference_generations,
					),
				},
				creditOverview: {
					users: toNumber(creditOverview.users),
					totalDailyLimit: toNumber(creditOverview.total_daily_limit),
					totalDailyUsed: toNumber(creditOverview.total_daily_used),
					totalDailyRemaining: toNumber(creditOverview.total_daily_remaining),
					purchasedCredits: toNumber(creditOverview.purchased_credits),
					usersWithPurchasedCredits: toNumber(
						creditOverview.users_with_purchased_credits,
					),
				},
				creditTransactionBreakdown: creditTransactionBreakdownResult.map(
					(row) => ({
						type: toStringValue((row as RawRow).type),
						count: toNumber((row as RawRow).count),
						totalAmount: toNumber((row as RawRow).total_amount),
					}),
				),
				creditTransactionTrend: buildCreditTrend(
					creditTransactionTrendRows as RawRow[],
				),
				rateLimitOverview: {
					generationRows: toNumber(generationLimits.rows),
					analyticsRows: toNumber(analyticsLimits.rows),
					trackRows: toNumber(trackingLimits.rows),
					totalRows: rateLimitRows.reduce(
						(sum, row) => sum + toNumber(row.rows),
						0,
					),
					maxGenerationCount: toNumber(generationLimits.max_count),
					maxAnalyticsCount: toNumber(analyticsLimits.max_count),
					maxTrackEventCount: toNumber(trackingLimits.max_count),
					totalGenerationCount: toNumber(generationLimits.total_count),
					totalAnalyticsCount: toNumber(analyticsLimits.total_count),
					totalTrackEventCount: toNumber(trackingLimits.total_count),
				},
				rateLimitPressure,
				workersAiCredits,
			},
			200,
			{
				// Private cache — admin-only endpoint, public would bypass auth at CDN edge
				"Cache-Control": "private, max-age=300, stale-while-revalidate=600",
				// Enable Brotli compression (handled by CF Workers)
				Vary: "Accept-Encoding",
			},
		);
	} catch (error) {
		console.error("Analytics query failed:", error);
		return jsonResponse({ error: "Failed to fetch analytics" }, 500);
	}
}

export const Route = createFileRoute("/api/analytics")({
	server: {
		handlers: {
			GET: ({ request }) => GET(request),
		},
	},
});
