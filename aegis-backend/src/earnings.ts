/**
 * Aegis Creator Earnings
 *
 * Queries for creator dashboard: earnings summaries, per-operator breakdowns,
 * and daily analytics for charting.
 */

import {
  getCreatorEarningsData,
  getCreatorDailyAnalytics,
  getCreatorOperatorsWithStats,
} from "./db";

export interface CreatorEarnings {
  total: string;
  last24h: string;
  last7d: string;
  last30d: string;
  pending: string;
  settled: string;
  byOperator: {
    operatorId: number;
    operatorName: string;
    operatorSlug: string;
    total: string;
    invocationCount: number;
  }[];
}

export interface DailyAnalytics {
  daily: {
    date: string;
    invocations: number;
    revenue: string;
  }[];
}

export interface CreatorOperatorStats {
  id: number;
  name: string;
  slug: string;
  category: string;
  trustScore: number;
  totalInvocations: number;
  successfulInvocations: number;
  totalEarned: string;
  avgResponseMs: number;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
}

/**
 * Get comprehensive earnings data for a creator by wallet address.
 */
export async function getCreatorEarnings(walletAddress: string): Promise<CreatorEarnings> {
  return getCreatorEarningsData(walletAddress);
}

/**
 * Get daily invocation volume and revenue for a creator over N days.
 */
export async function getCreatorAnalytics(walletAddress: string, days: number): Promise<DailyAnalytics> {
  const daily = await getCreatorDailyAnalytics(walletAddress, days);
  return { daily };
}

/**
 * Get all operators owned by a creator with their stats.
 */
export async function getCreatorOperators(walletAddress: string): Promise<CreatorOperatorStats[]> {
  return getCreatorOperatorsWithStats(walletAddress);
}
