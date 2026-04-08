/**
 * REST API v1 + x402 Payment Middleware
 * Provides standard REST endpoints for operator discovery and x402-compatible invocation.
 */
import { Router, type Request, type Response } from "express";
import * as db from "./db.js";
import { logger } from "./logger.js";
import {
  x402PaymentGate,
  mppCompatibility,
  extractPaymentProof,
  buildPaymentResponseHeader,
} from "./middleware/x402.js";
import { invokeLimiter } from "./middleware/rate-limit.js";
import { executeInvocation, InvocationError } from "./invoke-engine.js";
import { getGuardrailMetrics } from "./guardrails.js";
import { getTrustBreakdown } from "./trust-engine.js";

const router = Router();

/* ── Helper: format operator for API response ────────────────────────── */
function formatOperator(op: Record<string, unknown>) {
  const hasPrivateSkill = typeof op.skill === "string" && op.skill.trim().length > 0;
  return {
    id: op._id || op.id,
    slug: op.slug,
    name: op.name,
    description: op.description || op.tagline,
    category: op.category,
    price: op.pricePerCall || "0.05",
    currency: "USDC",
    chain: "solana",
    trustScore: op.trustScore || 85,
    invocations: op.totalInvocations || 0,
    revenue: op.totalEarnings || "0",
    healthStatus: op.healthStatus || "healthy",
    hasPrivateSkill,
    skillFormat: hasPrivateSkill ? "markdown" : null,
    skillStatus: hasPrivateSkill ? "ready" : "missing_skill",
    creatorWallet: op.creatorWallet || null,
    metadataUri: op.onChainMetadataUri || null,
    onChain: {
      cluster: op.onChainCluster || null,
      programId: op.onChainProgramId || null,
      configPda: op.onChainConfigPda || null,
      operatorPda: op.onChainOperatorPda || null,
      operatorId: op.onChainOperatorId ?? null,
      txSignature: op.onChainTxSignature || null,
      syncStatus: op.onChainSyncStatus || "unregistered",
      registeredAt: op.onChainRegisteredAt || null,
    },
    createdAt: op.createdAt,
  };
}

/* ── GET /api/v1/operators ────────────────────────────────────────────── */
router.get("/operators", async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || "").slice(0, 200);
    const category = String(req.query.category || "").slice(0, 50);
    const sortBy = String(req.query.sortBy || "trust");
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt((req.query.pageSize || req.query.limit) as string) || 20));

    const result = await db.listOperators({
      search: q,
      category: category || undefined,
      sortBy: sortBy as "trust" | "newest" | "earnings" | "invocations",
      limit,
      offset: (page - 1) * limit,
    });

    res.json({
      operators: (result.operators || []).map(formatOperator),
      total: result.total || 0,
      page,
      pageSize: limit,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch operators" });
  }
});

/* ── GET /api/v1/operators/:idOrSlug ──────────────────────────────────── */
router.get("/operators/:idOrSlug", async (req: Request, res: Response) => {
  try {
    const op = await db.getOperatorBySlug(req.params.idOrSlug);
    if (!op) {
      res.status(404).json({ error: "Operator not found" });
      return;
    }
    res.json(formatOperator(op as unknown as Record<string, unknown>));
  } catch {
    res.status(500).json({ error: "Failed to fetch operator" });
  }
});

/* ── GET /api/v1/skills/:slug/metadata ───────────────────────────────── */
router.get("/skills/:slug/metadata", async (req: Request, res: Response) => {
  try {
    const op = await db.getOperatorBySlug(req.params.slug);
    if (!op) {
      res.status(404).json({ error: "Skill not found" });
      return;
    }

    const operator = op as unknown as Record<string, any>;
    res.json({
      version: "1.0",
      slug: operator.slug,
      name: operator.name,
      tagline: operator.tagline || null,
      description: operator.description || operator.tagline || null,
      category: operator.category,
      creatorWallet: operator.creatorWallet,
      pricePerCall: operator.pricePerCall || "0",
      hasPrivateSkill: typeof operator.skill === "string" && operator.skill.trim().length > 0,
      skillFormat: "markdown",
      revealPath: `/api/v1/operators/${operator.slug}/invoke`,
      tags: operator.tags || [],
      iconUrl: operator.iconUrl || null,
      docsUrl: operator.docsUrl || null,
      githubUrl: operator.githubUrl || null,
      onChain: {
        cluster: operator.onChainCluster || null,
        programId: operator.onChainProgramId || null,
        configPda: operator.onChainConfigPda || null,
        operatorPda: operator.onChainOperatorPda || null,
        operatorId: operator.onChainOperatorId ?? null,
      },
      updatedAt: operator.updatedAt,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch skill metadata" });
  }
});

/* ── GET /api/v1/operators/:idOrSlug/trust ────────────────────────────── */
router.get("/operators/:idOrSlug/trust", async (req: Request, res: Response) => {
  try {
    const op = await db.getOperatorBySlug(req.params.idOrSlug);
    if (!op) {
      res.status(404).json({ error: "Operator not found" });
      return;
    }
    const o = op as unknown as Record<string, unknown>;
    const operatorId = (o.id ?? o._id) as number;
    const breakdown = await getTrustBreakdown(operatorId);
    res.json({
      operatorId: o._id || o.id,
      name: o.name,
      overallScore: breakdown.overall,
      dimensions: {
        executionReliability: { score: Math.round(breakdown.executionReliability), weight: 30, description: "Percentage of successful invocations (time-weighted)" },
        responseQuality: { score: Math.round(breakdown.responseQuality), weight: 25, description: "Average response quality score from validators" },
        schemaCompliance: { score: Math.round(breakdown.schemaCompliance), weight: 20, description: "Percentage of responses matching declared schema" },
        validatorConsensus: { score: Math.round(breakdown.validatorConsensus), weight: 15, description: "Agreement among validators on quality" },
        historicalPerformance: { score: Math.round(breakdown.historicalPerformance), weight: 10, description: "Long-term consistency and reliability" },
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch trust score" });
  }
});

/* ── POST /api/v1/operators/:idOrSlug/invoke  (x402 middleware) ────────── */
router.post(
  "/operators/:idOrSlug/invoke",
  invokeLimiter,
  mppCompatibility(),
  x402PaymentGate(),
  async (req: Request, res: Response) => {
    try {
      // Resolve operator - middleware may have attached it, otherwise look up by slug
      let op = (req as any).operator;
      if (!op) {
        const fetched = await db.getOperatorBySlug(req.params.idOrSlug);
        if (!fetched) {
          res.status(404).json({ error: "Operator not found" });
          return;
        }
        op = fetched;
      }

      const o = op as Record<string, unknown>;
      const operatorId = o._id || o.id;
      const { txSignature, payerWallet, receiptPda, settlementMethod } = extractPaymentProof(req);
      const paymentHeader = (req as any).paymentProof || txSignature;

      // Execute through unified invocation engine
      const result = await executeInvocation({
        operatorId: operatorId as number,
        callerWallet: (payerWallet as string) || undefined,
        payload: req.body,
        txSignature: paymentHeader ? String(paymentHeader) : undefined,
        receiptPda: receiptPda ? String(receiptPda) : undefined,
        paymentToken: undefined,
        settlementMethod: settlementMethod === "aegis_program" ? "aegis_program" : "legacy_transfer",
        source: "rest",
      });

      // Set x402 v2 payment response header
      if (paymentHeader) {
        res.setHeader(
          "PAYMENT-RESPONSE",
          buildPaymentResponseHeader(String(paymentHeader), true),
        );
      }

      res.json({
        success: result.success,
        operatorId,
        operatorName: result.operatorName,
        operator: {
          slug: o.slug,
          description: o.description || o.tagline || null,
          metadataUri: o.onChainMetadataUri || null,
          skillStatus: typeof o.skill === "string" && o.skill.trim().length > 0 ? "ready" : "missing_skill",
          skillFormat: "markdown",
        },
        result: result.response,
        execution: {
          durationMs: result.responseMs,
          trustScore: result.newTrustScore,
          guardrailsPass: result.guardrails.inputPassed && result.guardrails.outputPassed,
          timestamp: new Date().toISOString(),
        },
        payment: {
          amount: result.fees.total,
          token: "USDC",
          chain: "solana",
          txSignature: paymentHeader || null,
          receiptPda: receiptPda || null,
          settlementMethod: settlementMethod || (receiptPda ? "aegis_program" : "legacy_transfer"),
          settledAt: new Date().toISOString(),
          feeSplit: {
            creator: "85%",
            validators: "10%",
            treasury: "3%",
            insurance: "1.5%",
            burned: "0.5%",
          },
        },
        invocationId: result.invocationId,
        guardrails: result.guardrails,
      });
    } catch (err: any) {
      if (err instanceof InvocationError) {
        res.status(err.statusCode).json({ error: err.code, message: err.message });
      } else {
        logger.error({ err }, "REST invoke failed");
        res.status(500).json({ error: "Failed to invoke operator" });
      }
    }
  },
);

/* ── GET /api/v1/categories ───────────────────────────────────────────── */
router.get("/categories", async (_req: Request, res: Response) => {
  try {
    const result = await db.listOperators({ limit: 1000 });
    const cats: Record<string, number> = {};
    for (const op of result.operators || []) {
      const c = (op as unknown as Record<string, unknown>).category as string || "other";
      cats[c] = (cats[c] || 0) + 1;
    }
    res.json({
      categories: Object.entries(cats)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      total: Object.keys(cats).length,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

/* ── GET /api/v1/stats ────────────────────────────────────────────────── */
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const stats = await db.getProtocolStats();

    res.json({
      operators: stats?.totalOperators || 0,
      realOperators: stats?.realOperators || 0,
      invocations: stats?.totalInvocations || 0,
      revenue: stats?.totalEarnings || "0",
      avgTrustScore: stats?.avgTrustScore || 0,
      avgCostPerCall: "0.02",
      settlementChain: "solana",
      settlementTime: "~400ms",
      txCost: "$0.00025",
      health: stats?.health || { healthy: 0, degraded: 0 },
      guardrails: {
        ...(stats?.guardrails || {
          totalChecks: 0,
          blocked: 0,
          passRate: "100.0",
          serverStatus: "standby",
        }),
        runtime: getGuardrailMetrics(),
      },
      protocols: ["mcp", "x402", "a2a"],
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export { router as restApiV1 };
export default router;
