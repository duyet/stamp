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
