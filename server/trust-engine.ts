/**
 * Aegis Trust Engine
 *
 * Computes a composite trust score (0-100) for each operator from 5 weighted components:
 *   responseQuality  25%  — average validation score from invocations
 *   guardrailPass    25%  — % of invocations passing guardrail checks
 *   uptimeRate       20%  — successful invocations / total invocations
 *   reviewScore      15%  — user review average normalized to 0-100
 *   disputeRate      15%  — inverse of dispute frequency (fewer = better)
 */

import logger from "./logger";
import {
  getTrustComponentsForOperator,
  getActiveOperatorIds,
  updateOperatorTrustScore,
} from "./db";

export interface TrustBreakdown {
  overall: number;
  responseQuality: number;
  guardrailPassRate: number;
  uptimeRate: number;
  reviewScore: number;
  disputeRate: number;
}

/**
 * Compute the trust breakdown for a single operator.
 */
export async function getTrustBreakdown(operatorId: number): Promise<TrustBreakdown> {
  const components = await getTrustComponentsForOperator(operatorId);

  // responseQuality: average validation-quality score (derived from avg response time)
  // We map avgResponseMs to a 0-100 quality score using the same buckets as validator.ts
  const responseQuality = scoreResponseQuality(components.avgResponseMs);

  // guardrailPassRate: % invocations that passed guardrails (default 100 if no guardrail data)
  // Since guardrail columns may not exist yet (Phase 5), fall back to success rate
  const guardrailPassRate = components.totalInvocations > 0
    ? Math.round((components.guardrailPassCount / components.totalInvocations) * 100)
    : 50; // neutral default

  // uptimeRate: successful / total invocations
  const uptimeRate = components.totalInvocations > 0
    ? Math.round((components.successfulInvocations / components.totalInvocations) * 100)
    : 50; // neutral default

  // reviewScore: average review rating (1-5) normalized to 0-100
  const reviewScore = components.reviewCount > 0
    ? Math.round((components.avgRating / 5) * 100)
    : 50; // neutral default

  // disputeRate: inverse of dispute frequency
  // 0 disputes = 100, scale down as disputes increase relative to invocations
  let disputeRate: number;
  if (components.totalInvocations === 0) {
    disputeRate = 50; // neutral default
  } else if (components.disputeCount === 0) {
    disputeRate = 100;
  } else {
    const ratio = components.disputeCount / components.totalInvocations;
    // ratio of 0.01 (1%) -> ~90, ratio of 0.1 (10%) -> ~50, ratio of 0.5+ -> ~10
    disputeRate = Math.max(0, Math.min(100, Math.round(100 * (1 - ratio * 5))));
  }

  const overall = Math.round(
    responseQuality * 0.25 +
    guardrailPassRate * 0.25 +
    uptimeRate * 0.20 +
    reviewScore * 0.15 +
    disputeRate * 0.15
  );

  return {
    overall: Math.max(0, Math.min(100, overall)),
    responseQuality,
    guardrailPassRate,
    uptimeRate,
    reviewScore,
    disputeRate,
  };
}

/**
 * Recalculate trust scores for ALL active operators and persist to DB.
 */
export async function recalculateTrustScores(): Promise<void> {
  try {
    const operatorIds = await getActiveOperatorIds();
    if (operatorIds.length === 0) return;

    for (const id of operatorIds) {
      try {
        const breakdown = await getTrustBreakdown(id);
        await updateOperatorTrustScore(id, breakdown.overall);
      } catch (err) {
        logger.error({ operatorId: id, err }, `[TrustEngine] Failed to recalculate trust for operator ${id}`);
      }
    }

    logger.info(`[TrustEngine] Recalculated trust scores for ${operatorIds.length} operators`);
  } catch (err) {
    logger.error({ err }, "[TrustEngine] Failed to recalculate trust scores");
  }
}

/**
 * Map average response time (ms) to a 0-100 quality score.
 */
function scoreResponseQuality(avgResponseMs: number): number {
  if (avgResponseMs <= 0) return 50; // no data
  if (avgResponseMs <= 500) return 100;
  if (avgResponseMs <= 1000) return 90;
  if (avgResponseMs <= 2000) return 75;
  if (avgResponseMs <= 5000) return 50;
  if (avgResponseMs <= 10000) return 25;
  return 10;
}
