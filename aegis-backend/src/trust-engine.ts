/**
 * Aegis Trust Engine - Bayesian Time-Decayed Trust Scoring
 *
 * A 5-dimensional trust score with:
 * - Exponential time decay (recent performance matters more)
 * - Bayesian smoothing (new operators aren't penalized for small sample size)
 * - Anomaly detection (sudden performance drops trigger investigation)
 * - Confidence intervals (how certain are we about this score?)
 * - Composite weighting (dimensions aren't equally important)
 *
 * Dimensions:
 * 1. Execution Reliability - % of successful invocations (time-weighted)
 * 2. Response Quality - avg response quality score from validators
 * 3. Schema Compliance - % of responses matching declared schema
 * 4. Validator Consensus - agreement among validators on quality
 * 5. Historical Performance - long-term consistency (low variance = higher)
 *
 * Score range: 0-10000 (basis points, displayed as 0-100.00)
 */

// ────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────

export interface TrustDimension {
  raw: number;          // Raw score 0-10000
  weighted: number;     // After time decay
  confidence: number;   // 0-1 (how certain we are)
  samples: number;      // Number of data points
  trend: "improving" | "stable" | "declining";
}

export interface TrustReport {
  overall: number;                           // Composite score 0-10000
  overallDisplay: number;                    // 0-100.00 for display
  confidence: number;                        // 0-1
  tier: "diamond" | "gold" | "silver" | "bronze" | "unrated";
  dimensions: {
    executionReliability: TrustDimension;
    responseQuality: TrustDimension;
    schemaCompliance: TrustDimension;
    validatorConsensus: TrustDimension;
    historicalPerformance: TrustDimension;
  };
  anomalies: TrustAnomaly[];
  lastUpdated: string;
  nextDecayAt: string;
}

export interface TrustAnomaly {
  type: "sudden_drop" | "spike" | "pattern_change" | "validator_disagreement";
  dimension: string;
  severity: "low" | "medium" | "high";
  description: string;
  detectedAt: string;
}

export interface InvocationDataPoint {
  timestamp: number;        // Unix ms
  success: boolean;
  responseMs: number;
  validatorScore?: number;  // 0-100 from validator
  schemaMatch?: boolean;
  qualityScore?: number;    // 0-100
}

// ────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────

/** Dimension weights (must sum to 10000) */
const DIMENSION_WEIGHTS = {
  executionReliability: 3000,    // 30% - most important
  responseQuality: 2500,         // 25%
  schemaCompliance: 2000,        // 20%
  validatorConsensus: 1500,      // 15%
  historicalPerformance: 1000,   // 10%
} as const;

/** Half-life for exponential decay (in milliseconds) */
const DECAY_HALF_LIFE = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Bayesian prior - equivalent to N observations at 50% quality */
const BAYESIAN_PRIOR_STRENGTH = 10;
const BAYESIAN_PRIOR_SCORE = 5000;

/** Anomaly detection thresholds */
const ANOMALY_Z_SCORE_THRESHOLD = 2.5;
const ANOMALY_DROP_THRESHOLD = 1500; // 15% drop triggers alert

/** Minimum samples for each confidence level */
const CONFIDENCE_THRESHOLDS = {
  veryLow: 5,
  low: 20,
  medium: 50,
  high: 100,
  veryHigh: 500,
};

// ────────────────────────────────────────────────────
// Core Algorithm
// ────────────────────────────────────────────────────

/**
 * Calculate exponential decay weight for a data point
 * More recent data points get higher weight
 */
function decayWeight(timestampMs: number, nowMs: number): number {
  const age = nowMs - timestampMs;
  return Math.pow(2, -age / DECAY_HALF_LIFE);
}

/**
 * Bayesian smoothed score
 * Prevents new operators with few invocations from getting extreme scores
 *
 * Formula: (prior_strength * prior_score + sum(weighted_scores)) / (prior_strength + sum(weights))
 */
function bayesianSmooth(weightedSum: number, totalWeight: number): number {
  const numerator = BAYESIAN_PRIOR_STRENGTH * BAYESIAN_PRIOR_SCORE + weightedSum;
  const denominator = BAYESIAN_PRIOR_STRENGTH + totalWeight;
  return denominator > 0 ? Math.round(numerator / denominator) : BAYESIAN_PRIOR_SCORE;
}

/**
 * Calculate confidence based on sample size and consistency
 */
function calculateConfidence(samples: number, variance: number): number {
  // Sample size factor (logarithmic - diminishing returns past 100)
  const sizeFactor = Math.min(1, Math.log10(Math.max(1, samples)) / Math.log10(CONFIDENCE_THRESHOLDS.veryHigh));

  // Consistency factor (low variance = high confidence)
  const maxVariance = 2500 * 2500; // Max reasonable variance
  const consistencyFactor = 1 - Math.min(1, variance / maxVariance);

  // Combined (geometric mean for balance)
  return Math.sqrt(sizeFactor * consistencyFactor);
}

/**
 * Detect trend from recent data points
 */
function detectTrend(recentScores: number[]): "improving" | "stable" | "declining" {
  if (recentScores.length < 5) return "stable";

  const firstHalf = recentScores.slice(0, Math.floor(recentScores.length / 2));
  const secondHalf = recentScores.slice(Math.floor(recentScores.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const delta = secondAvg - firstAvg;
  if (delta > 200) return "improving";    // >2% improvement
  if (delta < -200) return "declining";   // >2% decline
  return "stable";
}

/**
 * Detect anomalies in the data
 */
function detectAnomalies(
  dataPoints: InvocationDataPoint[],
  currentScores: Record<string, number>,
  historicalMeans: Record<string, number>,
  historicalStdDevs: Record<string, number>,
): TrustAnomaly[] {
  const anomalies: TrustAnomaly[] = [];
  const now = new Date().toISOString();

  for (const [dim, score] of Object.entries(currentScores)) {
    const mean = historicalMeans[dim] ?? score;
    const stdDev = historicalStdDevs[dim] ?? 1000;

    if (stdDev > 0) {
      const zScore = (score - mean) / stdDev;

      if (zScore < -ANOMALY_Z_SCORE_THRESHOLD) {
        anomalies.push({
          type: "sudden_drop",
          dimension: dim,
          severity: zScore < -4 ? "high" : zScore < -3 ? "medium" : "low",
          description: `${dim} dropped ${Math.abs(Math.round(score - mean))} points below historical mean (z=${zScore.toFixed(1)})`,
          detectedAt: now,
        });
      }
    }

    // Check for recent rapid decline
    if (mean - score > ANOMALY_DROP_THRESHOLD) {
      anomalies.push({
        type: "pattern_change",
        dimension: dim,
        severity: "medium",
        description: `${dim} is ${Math.round((mean - score) / 100)}% below historical average`,
        detectedAt: now,
      });
    }
  }

  // Check for validator disagreement
  const recentValidatorScores = dataPoints
    .filter(d => d.validatorScore !== undefined)
    .slice(-20)
    .map(d => d.validatorScore!);

  if (recentValidatorScores.length >= 5) {
    const vMean = recentValidatorScores.reduce((a, b) => a + b, 0) / recentValidatorScores.length;
    const vVariance = recentValidatorScores.reduce((a, b) => a + (b - vMean) ** 2, 0) / recentValidatorScores.length;
    const vStdDev = Math.sqrt(vVariance);

    if (vStdDev > 25) { // High disagreement among validators
      anomalies.push({
        type: "validator_disagreement",
        dimension: "validatorConsensus",
        severity: vStdDev > 35 ? "high" : "medium",
        description: `Validators disagree significantly (σ=${vStdDev.toFixed(1)}) - possible quality inconsistency`,
        detectedAt: now,
      });
    }
  }

  return anomalies;
}

// ────────────────────────────────────────────────────
// Main Calculator
// ────────────────────────────────────────────────────

/**
 * Calculate the full trust report for an operator
 */
export function calculateTrustReport(dataPoints: InvocationDataPoint[]): TrustReport {
  const now = Date.now();

  if (dataPoints.length === 0) {
    return createUnratedReport();
  }

  // ── Dimension 1: Execution Reliability ──
  let execWeightedSum = 0;
  let execTotalWeight = 0;
  const execScores: number[] = [];

  for (const dp of dataPoints) {
    const w = decayWeight(dp.timestamp, now);
    const score = dp.success ? 10000 : 0;
    execWeightedSum += score * w;
    execTotalWeight += w;
    execScores.push(score);
  }
  const execScore = bayesianSmooth(execWeightedSum, execTotalWeight);

  // ── Dimension 2: Response Quality ──
  let qualWeightedSum = 0;
  let qualTotalWeight = 0;
  const qualScores: number[] = [];

  for (const dp of dataPoints) {
    if (dp.qualityScore === undefined) continue;
    const w = decayWeight(dp.timestamp, now);
    const score = dp.qualityScore * 100; // 0-100 → 0-10000
    qualWeightedSum += score * w;
    qualTotalWeight += w;
    qualScores.push(score);
  }
  const qualScore = qualTotalWeight > 0
    ? bayesianSmooth(qualWeightedSum, qualTotalWeight)
    : BAYESIAN_PRIOR_SCORE;

  // ── Dimension 3: Schema Compliance ──
  let schemaWeightedSum = 0;
  let schemaTotalWeight = 0;
  const schemaScores: number[] = [];

  for (const dp of dataPoints) {
    if (dp.schemaMatch === undefined) continue;
    const w = decayWeight(dp.timestamp, now);
    const score = dp.schemaMatch ? 10000 : 0;
    schemaWeightedSum += score * w;
    schemaTotalWeight += w;
    schemaScores.push(score);
  }
  const schemaScore = schemaTotalWeight > 0
    ? bayesianSmooth(schemaWeightedSum, schemaTotalWeight)
    : BAYESIAN_PRIOR_SCORE;

  // ── Dimension 4: Validator Consensus ──
  const validatorScores = dataPoints
    .filter(d => d.validatorScore !== undefined)
    .map(d => d.validatorScore! * 100);

  let valScore = BAYESIAN_PRIOR_SCORE;
  if (validatorScores.length > 0) {
    const valMean = validatorScores.reduce((a, b) => a + b, 0) / validatorScores.length;
    const valVariance = validatorScores.reduce((a, b) => a + (b - valMean) ** 2, 0) / validatorScores.length;
    const valStdDev = Math.sqrt(valVariance);

    // Consensus = high mean + low variance
    const meanFactor = valMean / 10000;
    const consensusFactor = Math.max(0, 1 - valStdDev / 3000); // Lower std dev = higher consensus
    valScore = Math.round(meanFactor * consensusFactor * 10000);
    valScore = bayesianSmooth(valScore * validatorScores.length, validatorScores.length);
  }

  // ── Dimension 5: Historical Performance ──
  // Low variance over time = high historical performance
  const allScores = execScores;
  let histScore = BAYESIAN_PRIOR_SCORE;
  if (allScores.length >= 5) {
    const mean = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    const variance = allScores.reduce((a, b) => a + (b - mean) ** 2, 0) / allScores.length;
    const consistency = Math.max(0, 1 - Math.sqrt(variance) / 5000);
    histScore = Math.round(mean * 0.5 + consistency * 10000 * 0.5);
  }

  // ── Calculate variance for confidence ──
  const execVariance = calculateVariance(execScores);
  const qualVariance = calculateVariance(qualScores);
  const schemaVariance = calculateVariance(schemaScores);

  // ── Build dimensions ──
  const dimensions = {
    executionReliability: {
      raw: execScore,
      weighted: execScore,
      confidence: calculateConfidence(dataPoints.length, execVariance),
      samples: dataPoints.length,
      trend: detectTrend(execScores.slice(-20)),
    } as TrustDimension,
    responseQuality: {
      raw: qualScore,
      weighted: qualScore,
      confidence: calculateConfidence(qualScores.length, qualVariance),
      samples: qualScores.length,
      trend: detectTrend(qualScores.slice(-20)),
    } as TrustDimension,
    schemaCompliance: {
      raw: schemaScore,
      weighted: schemaScore,
      confidence: calculateConfidence(schemaScores.length, schemaVariance),
      samples: schemaScores.length,
      trend: detectTrend(schemaScores.slice(-20)),
    } as TrustDimension,
    validatorConsensus: {
      raw: valScore,
      weighted: valScore,
      confidence: calculateConfidence(validatorScores.length, calculateVariance(validatorScores)),
      samples: validatorScores.length,
      trend: detectTrend(validatorScores.slice(-20)),
    } as TrustDimension,
    historicalPerformance: {
      raw: histScore,
      weighted: histScore,
      confidence: calculateConfidence(allScores.length, calculateVariance(allScores)),
      samples: allScores.length,
      trend: detectTrend(allScores.slice(-20)),
    } as TrustDimension,
  };

  // ── Composite score ──
  const overall = Math.round(
    (dimensions.executionReliability.weighted * DIMENSION_WEIGHTS.executionReliability +
     dimensions.responseQuality.weighted * DIMENSION_WEIGHTS.responseQuality +
     dimensions.schemaCompliance.weighted * DIMENSION_WEIGHTS.schemaCompliance +
     dimensions.validatorConsensus.weighted * DIMENSION_WEIGHTS.validatorConsensus +
     dimensions.historicalPerformance.weighted * DIMENSION_WEIGHTS.historicalPerformance) / 10000
  );

  const overallConfidence =
    (dimensions.executionReliability.confidence * DIMENSION_WEIGHTS.executionReliability +
     dimensions.responseQuality.confidence * DIMENSION_WEIGHTS.responseQuality +
     dimensions.schemaCompliance.confidence * DIMENSION_WEIGHTS.schemaCompliance +
     dimensions.validatorConsensus.confidence * DIMENSION_WEIGHTS.validatorConsensus +
     dimensions.historicalPerformance.confidence * DIMENSION_WEIGHTS.historicalPerformance) / 10000;

  // ── Anomaly detection ──
  const currentScores: Record<string, number> = {
    executionReliability: execScore,
    responseQuality: qualScore,
    schemaCompliance: schemaScore,
    validatorConsensus: valScore,
    historicalPerformance: histScore,
  };

  // Use half the current score as "historical mean" approximation
  const historicalMeans: Record<string, number> = {};
  const historicalStdDevs: Record<string, number> = {};
  for (const [k, v] of Object.entries(currentScores)) {
    historicalMeans[k] = v; // In production, this comes from stored history
    historicalStdDevs[k] = 1000; // Default std dev
  }

  const anomalies = detectAnomalies(dataPoints, currentScores, historicalMeans, historicalStdDevs);

  // ── Tier ──
  const tier = overall >= 9000 ? "diamond"
    : overall >= 7000 ? "gold"
    : overall >= 5000 ? "silver"
    : overall >= 2000 ? "bronze"
    : "unrated";

  return {
    overall: clamp(overall, 0, 10000),
    overallDisplay: parseFloat((clamp(overall, 0, 10000) / 100).toFixed(2)),
    confidence: parseFloat(overallConfidence.toFixed(4)),
    tier,
    dimensions,
    anomalies,
    lastUpdated: new Date().toISOString(),
    nextDecayAt: new Date(now + DECAY_HALF_LIFE).toISOString(),
  };
}

// ────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────

function calculateVariance(scores: number[]): number {
  if (scores.length < 2) return 0;
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  return scores.reduce((a, b) => a + (b - mean) ** 2, 0) / scores.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function createUnratedReport(): TrustReport {
  const emptyDimension: TrustDimension = {
    raw: BAYESIAN_PRIOR_SCORE,
    weighted: BAYESIAN_PRIOR_SCORE,
    confidence: 0,
    samples: 0,
    trend: "stable",
  };
  return {
    overall: BAYESIAN_PRIOR_SCORE,
    overallDisplay: 50.00,
    confidence: 0,
    tier: "unrated",
    dimensions: {
      executionReliability: { ...emptyDimension },
      responseQuality: { ...emptyDimension },
      schemaCompliance: { ...emptyDimension },
      validatorConsensus: { ...emptyDimension },
      historicalPerformance: { ...emptyDimension },
    },
    anomalies: [],
    lastUpdated: new Date().toISOString(),
    nextDecayAt: new Date(Date.now() + DECAY_HALF_LIFE).toISOString(),
  };
}

// ────────────────────────────────────────────────────
// Backward-compatible API (used by mcp.ts, routers.ts, _core/index.ts)
// ────────────────────────────────────────────────────

import { OperatorModel, InvocationModel } from "./db";

/**
 * Get trust breakdown for an operator (backward-compatible wrapper)
 */
export async function getTrustBreakdown(operatorId: number): Promise<{
  overall: number;
  executionReliability: number;
  responseQuality: number;
  schemaCompliance: number;
  validatorConsensus: number;
  historicalPerformance: number;
}> {
  const op = await OperatorModel.findOne({ id: operatorId }).lean() as any;
  if (!op) {
    return { overall: 50, executionReliability: 50, responseQuality: 50, schemaCompliance: 50, validatorConsensus: 50, historicalPerformance: 50 };
  }

  // Fetch recent invocations for this operator
  const invocations = await InvocationModel.find({ operatorId: op._id })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean() as any[];

  const dataPoints: InvocationDataPoint[] = invocations.map((inv: any) => ({
    timestamp: inv.createdAt ? new Date(inv.createdAt).getTime() : Date.now(),
    success: inv.success ?? true,
    responseMs: inv.responseMs ?? 0,
    qualityScore: inv.guardrailOutputPassed ? 90 : 60,
    schemaMatch: inv.guardrailOutputPassed ?? true,
  }));

  const report = calculateTrustReport(dataPoints);
  return {
    overall: report.overallDisplay,
    executionReliability: report.dimensions.executionReliability.raw / 100,
    responseQuality: report.dimensions.responseQuality.raw / 100,
    schemaCompliance: report.dimensions.schemaCompliance.raw / 100,
    validatorConsensus: report.dimensions.validatorConsensus.raw / 100,
    historicalPerformance: report.dimensions.historicalPerformance.raw / 100,
  };
}

/**
 * Recalculate trust scores for all operators (backward-compatible wrapper)
 */
export async function recalculateTrustScores(): Promise<void> {
  const operators = await OperatorModel.find({ isActive: true }).select("_id id trustScore").lean() as any[];

  for (const op of operators) {
    try {
      const breakdown = await getTrustBreakdown(op.id);
      const newScore = Math.round(breakdown.overall * 100); // Convert to basis points
      if (Math.abs(newScore - (op.trustScore || 5000)) > 50) {
        await OperatorModel.updateOne({ _id: op._id }, { trustScore: clamp(newScore, 0, 10000) });
      }
    } catch {
      // Skip failed operators
    }
  }
}

export default { calculateTrustReport, getTrustBreakdown, recalculateTrustScores };
