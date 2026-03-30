/**
 * Know Your Agent (KYA) - Trust verification for AI agents.
 *
 * Produces a comprehensive trust report for any operator,
 * covering: identity, behavior, safety, reliability, economics.
 */

export interface KYAReport {
  operatorId: number;
  slug: string;
  verifiedAt: Date;
  overallScore: number; // 0-100
  grade: "A+" | "A" | "B" | "C" | "D" | "F" | "Unrated";

  identity: {
    hasEndpoint: boolean;
    endpointReachable: boolean;
    endpointResponseMs: number;
    hasCreatorWallet: boolean;
    walletHasBalance: boolean;
    hasBond: boolean;
    bondAmount: number;
    hasDescription: boolean;
    hasSchema: boolean;
    score: number; // 0-100
  };

  behavior: {
    totalInvocations: number;
    successRate: number;
    avgResponseMs: number;
    p95ResponseMs: number;
    lastActiveAt: Date | null;
    consistencyScore: number; // how stable is performance over time
    score: number;
  };

  safety: {
    guardrailsEnabled: boolean;
    inputPassRate: number;
    outputPassRate: number;
    totalViolations: number;
    violationTypes: string[];
    lastViolationAt: Date | null;
    score: number;
  };

  reliability: {
    healthStatus: string;
    uptimePercent: number;
    consecutiveFailures: number;
    lastHealthCheck: Date | null;
    schemaCompliance: number; // % of responses matching declared schema
    score: number;
  };

  economics: {
    totalRevenue: number;
    pricePerCall: number;
    revenueGrowth: number; // % change last 30 days
    uniqueCallers: number;
    score: number;
  };
}

export async function generateKYAReport(operatorId: number | string): Promise<KYAReport> {
  // Import models
  const {
    OperatorModel: Operator,
    InvocationModel: Invocation,
    OperatorBondModel: OperatorBond,
  } = await import("./db");

  const operator = await Operator.findById(operatorId).lean();
  if (!operator) throw new Error("Operator not found");

  // Identity checks
  const identity = {
    hasEndpoint: !!(operator as any).endpointUrl,
    endpointReachable: false,
    endpointResponseMs: 0,
    hasCreatorWallet: !!(operator as any).creatorWallet,
    walletHasBalance: false, // Would check Solana RPC
    hasBond: false,
    bondAmount: 0,
    hasDescription: !!((operator as any).description && (operator as any).description.length > 20),
    hasSchema: !!((operator as any).requestSchema || (operator as any).responseSchema),
    score: 0,
  };

  // Check endpoint reachability
  if (identity.hasEndpoint) {
    try {
      const start = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch((operator as any).endpointUrl!, {
        method: "HEAD",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      identity.endpointReachable = res.ok || res.status < 500;
      identity.endpointResponseMs = Date.now() - start;
    } catch {
      /* unreachable */
    }
  }

  // Check bonds
  const bond = await OperatorBond.findOne({
    operatorId,
    status: "active",
  }).lean();
  if (bond) {
    identity.hasBond = true;
    identity.bondAmount = (bond as any).amountLamports || 0;
  }

  identity.score = [
    identity.hasEndpoint ? 20 : 0,
    identity.endpointReachable ? 20 : 0,
    identity.hasCreatorWallet ? 15 : 0,
    identity.hasBond ? 15 : 0,
    identity.hasDescription ? 15 : 0,
    identity.hasSchema ? 15 : 0,
  ].reduce((a, b) => a + b, 0);

  // Behavior analysis
  const invocations = await Invocation.find({ operatorId })
    .sort({ createdAt: -1 })
    .limit(1000)
    .lean();
  const totalInv =
    (operator as any).totalInvocations || invocations.length;
  const successInv =
    (operator as any).successfulInvocations ||
    invocations.filter((i: any) => i.success).length;
  const responseTimes = invocations
    .map((i: any) => i.responseMs || 0)
    .filter((ms: number) => ms > 0);
  const avgMs =
    responseTimes.length > 0
      ? responseTimes.reduce((a: number, b: number) => a + b, 0) /
        responseTimes.length
      : 0;
  const sortedMs = [...responseTimes].sort((a, b) => a - b);
  const p95Ms =
    sortedMs.length > 0
      ? sortedMs[Math.floor(sortedMs.length * 0.95)]
      : 0;

  const behavior = {
    totalInvocations: totalInv,
    successRate: totalInv > 0 ? (successInv / totalInv) * 100 : 0,
    avgResponseMs: Math.round(avgMs),
    p95ResponseMs: Math.round(p95Ms),
    lastActiveAt: (invocations[0] as any)?.createdAt || null,
    consistencyScore: 0,
    score: 0,
  };

  // Consistency: low variance in response times = high consistency
  if (responseTimes.length > 5) {
    const mean = avgMs;
    const variance =
      responseTimes.reduce(
        (sum: number, ms: number) => sum + Math.pow(ms - mean, 2),
        0,
      ) / responseTimes.length;
    const cv = Math.sqrt(variance) / (mean || 1); // coefficient of variation
    behavior.consistencyScore = Math.max(
      0,
      Math.min(100, 100 - cv * 100),
    );
  }

  behavior.score = Math.min(
    100,
    Math.round(
      (behavior.successRate > 0
        ? Math.min(behavior.successRate, 100) * 0.4
        : 0) +
        (behavior.avgResponseMs > 0 && behavior.avgResponseMs < 1000
          ? ((1000 - behavior.avgResponseMs) / 10) * 0.3
          : 0) +
        behavior.consistencyScore * 0.3,
    ),
  );

  // Safety
  const guardrailInvs = invocations.filter(
    (i: any) => i.guardrailInputPassed !== undefined,
  );
  const inputFails = guardrailInvs.filter(
    (i: any) => i.guardrailInputPassed === false,
  ).length;
  const outputFails = guardrailInvs.filter(
    (i: any) => i.guardrailOutputPassed === false,
  ).length;
  const allViolations = guardrailInvs.flatMap(
    (i: any) => i.guardrailViolations || [],
  );

  const safety = {
    guardrailsEnabled: process.env.GUARDRAILS_ENABLED === "true",
    inputPassRate:
      guardrailInvs.length > 0
        ? ((guardrailInvs.length - inputFails) / guardrailInvs.length) *
          100
        : 100,
    outputPassRate:
      guardrailInvs.length > 0
        ? ((guardrailInvs.length - outputFails) / guardrailInvs.length) *
          100
        : 100,
    totalViolations: allViolations.length,
    violationTypes: [
      ...new Set(allViolations.map((v: any) => v.type || v)),
    ],
    lastViolationAt: null as Date | null,
    score: 0,
  };

  safety.score = Math.round(
    safety.inputPassRate * 0.4 +
      safety.outputPassRate * 0.4 +
      (safety.guardrailsEnabled ? 20 : 10),
  );

  // Reliability
  const reliability = {
    healthStatus: (operator as any).healthStatus || "unknown",
    uptimePercent:
      (operator as any).healthStatus === "healthy"
        ? 99.9
        : (operator as any).healthStatus === "degraded"
          ? 95
          : 0,
    consecutiveFailures: (operator as any).consecutiveFailures || 0,
    lastHealthCheck: (operator as any).lastHealthCheck || null,
    schemaCompliance: 100, // Would need schema validation logic
    score: 0,
  };

  reliability.score = Math.round(
    reliability.uptimePercent * 0.5 +
      (reliability.consecutiveFailures === 0
        ? 30
        : Math.max(0, 30 - reliability.consecutiveFailures * 10)) +
      reliability.schemaCompliance * 0.2,
  );

  // Economics
  const totalEarned = (operator as any).totalEarned;
  const revenue = totalEarned?.$numberDecimal
    ? parseFloat(totalEarned.$numberDecimal)
    : typeof totalEarned === "number"
      ? totalEarned
      : typeof totalEarned === "string"
        ? parseFloat(totalEarned) || 0
        : 0;
  const rawPrice = (operator as any).pricePerCall;
  const price = rawPrice?.$numberDecimal
    ? parseFloat(rawPrice.$numberDecimal)
    : typeof rawPrice === "string"
      ? parseFloat(rawPrice) || 0.01
      : typeof rawPrice === "number"
        ? rawPrice
        : 0.01;
  const uniqueCallers = await Invocation.distinct("callerWallet", {
    operatorId,
  })
    .then((w: any[]) => w.length)
    .catch(() => 0);

  const economics = {
    totalRevenue: revenue,
    pricePerCall: price,
    revenueGrowth: 0,
    uniqueCallers,
    score: Math.min(
      100,
      Math.round(
        (revenue > 0 ? 30 : 0) +
          (uniqueCallers > 0 ? Math.min(uniqueCallers * 5, 30) : 0) +
          (totalInv > 100 ? 20 : totalInv > 10 ? 10 : 0) +
          (price > 0 ? 20 : 0),
      ),
    ),
  };

  // Overall
  const overallScore = Math.round(
    identity.score * 0.2 +
      behavior.score * 0.25 +
      safety.score * 0.25 +
      reliability.score * 0.15 +
      economics.score * 0.15,
  );

  const grade: KYAReport["grade"] =
    overallScore >= 95
      ? "A+"
      : overallScore >= 85
        ? "A"
        : overallScore >= 70
          ? "B"
          : overallScore >= 50
            ? "C"
            : overallScore >= 30
              ? "D"
              : "F";

  return {
    operatorId: (operator as any).id ?? operatorId,
    slug: (operator as any).slug,
    verifiedAt: new Date(),
    overallScore,
    grade,
    identity,
    behavior,
    safety,
    reliability,
    economics,
  };
}
