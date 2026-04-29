/**
 * Analytics types for dashboard location and timezone insights.
 */

export interface LocationStats {
	country: string;
	countryCode: string;
	city?: string;
	count: number;
	percentage: number;
}

export interface TimezoneStats {
	timezone: string;
	hourlyData: number[]; // 24 values for each hour
	total: number;
}

export interface MapData {
	countryCode: string;
	count: number;
	lat?: number;
	lng?: number;
}

export interface CountItem {
	label: string;
	count: number;
}

export interface DailyStampCount {
	day: number;
	count: number;
}

export interface EventTrendDay {
	day: number;
	total: number;
	pageViews: number;
	generations: number;
	downloads: number;
	shares: number;
	copies: number;
	stampViews: number;
}

export interface CreditTransactionTrendDay {
	day: number;
	count: number;
	totalAmount: number;
}

export interface CreditOverview {
	users: number;
	totalDailyLimit: number;
	totalDailyUsed: number;
	totalDailyRemaining: number;
	purchasedCredits: number;
	usersWithPurchasedCredits: number;
}

export interface RateLimitOverview {
	generationRows: number;
	analyticsRows: number;
	trackRows: number;
	totalRows: number;
	maxGenerationCount: number;
	maxAnalyticsCount: number;
	maxTrackEventCount: number;
	totalGenerationCount: number;
	totalAnalyticsCount: number;
	totalTrackEventCount: number;
}

export interface WorkersAiCredits {
	status: "ok" | "unconfigured" | "unavailable";
	dailyFreeNeurons: number;
	usedNeuronsToday: number;
	remainingNeuronsToday: number;
	requestsToday: number;
	resetAt: string;
}
