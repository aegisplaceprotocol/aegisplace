import { Router, Request, Response } from "express";
import { OperatorModel, InvocationModel, ValidatorModel, DisputeModel } from "../db";

const router = Router();

// Cache metrics for 30 seconds to avoid hammering MongoDB
let metricsCache: string = "";
let lastUpdate = 0;
const CACHE_TTL = 30_000;

async function collectMetrics(): Promise<string> {
  const now = Date.now();
  if (metricsCache && now - lastUpdate < CACHE_TTL) return metricsCache;

  const [
    totalOperators,
    activeOperators,
    totalInvocations,
    successfulInvocations,
    totalValidators,
    activeValidators,
    openDisputes,
    recentInvocations,
  ] = await Promise.all([
    OperatorModel.countDocuments(),
    OperatorModel.countDocuments({ isActive: true }),
    InvocationModel.countDocuments(),
    InvocationModel.countDocuments({ success: true }),
    ValidatorModel.countDocuments(),
    ValidatorModel.countDocuments({ status: "active" }),
    DisputeModel.countDocuments({ status: "open" }),
    InvocationModel.countDocuments({
      createdAt: { $gte: new Date(now - 86400000) },
    }),
  ]);

  const successRate = totalInvocations > 0
    ? ((successfulInvocations / totalInvocations) * 100).toFixed(2)
    : "0";

  const lines = [
    "# HELP aegis_operators_total Total registered operators",
    "# TYPE aegis_operators_total gauge",
    `aegis_operators_total ${totalOperators}`,
    "",
    "# HELP aegis_operators_active Currently active operators",
    "# TYPE aegis_operators_active gauge",
    `aegis_operators_active ${activeOperators}`,
    "",
    "# HELP aegis_invocations_total Total invocations processed",
    "# TYPE aegis_invocations_total counter",
    `aegis_invocations_total ${totalInvocations}`,
    "",
    "# HELP aegis_invocations_successful Total successful invocations",
    "# TYPE aegis_invocations_successful counter",
    `aegis_invocations_successful ${successfulInvocations}`,
    "",
    "# HELP aegis_invocations_success_rate Invocation success rate percentage",
    "# TYPE aegis_invocations_success_rate gauge",
    `aegis_invocations_success_rate ${successRate}`,
    "",
    "# HELP aegis_invocations_24h Invocations in the last 24 hours",
    "# TYPE aegis_invocations_24h gauge",
    `aegis_invocations_24h ${recentInvocations}`,
    "",
    "# HELP aegis_validators_total Total registered validators",
    "# TYPE aegis_validators_total gauge",
    `aegis_validators_total ${totalValidators}`,
    "",
    "# HELP aegis_validators_active Currently active validators",
    "# TYPE aegis_validators_active gauge",
    `aegis_validators_active ${activeValidators}`,
    "",
    "# HELP aegis_disputes_open Currently open disputes",
    "# TYPE aegis_disputes_open gauge",
    `aegis_disputes_open ${openDisputes}`,
    "",
    "# HELP aegis_uptime_seconds Server uptime in seconds",
    "# TYPE aegis_uptime_seconds gauge",
    `aegis_uptime_seconds ${Math.floor(process.uptime())}`,
    "",
    "# HELP aegis_memory_rss_bytes Resident set size in bytes",
    "# TYPE aegis_memory_rss_bytes gauge",
    `aegis_memory_rss_bytes ${process.memoryUsage().rss}`,
    "",
    "# HELP aegis_memory_heap_used_bytes Heap used in bytes",
    "# TYPE aegis_memory_heap_used_bytes gauge",
    `aegis_memory_heap_used_bytes ${process.memoryUsage().heapUsed}`,
    "",
  ];

  metricsCache = lines.join("\n");
  lastUpdate = now;
  return metricsCache;
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    const metrics = await collectMetrics();
    res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
    res.send(metrics);
  } catch (err: any) {
    res.status(500).send(`# Error collecting metrics\n`);
  }
});

export default router;
