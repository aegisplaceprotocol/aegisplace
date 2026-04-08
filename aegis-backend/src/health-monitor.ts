/**
 * Operator Health Monitor
 *
 * Periodically checks whether operators still have private skill content configured.
 * Runs every 5 minutes, checking operators in batches.
 */

import { OperatorModel } from "./db";

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const BATCH_SIZE = 50;

interface HealthResult {
  slug: string;
  status: "healthy" | "degraded" | "down" | "unknown";
  responseMs: number;
  statusCode: number;
  error?: string;
}

async function checkOperator(op: any): Promise<HealthResult> {
  const hasPrivateSkill = typeof op.skill === "string" && op.skill.trim().length > 0;
  if (!hasPrivateSkill) {
    return { slug: op.slug, status: "unknown", responseMs: 0, statusCode: 0 };
  }
  return { slug: op.slug, status: "healthy", responseMs: 0, statusCode: 200 };
}

async function runHealthChecks(): Promise<void> {
  const operators = await OperatorModel.find({ isActive: true })
    .select("slug skill healthStatus consecutiveFailures")
    .lean();

  // Process in batches
  for (let i = 0; i < operators.length; i += BATCH_SIZE) {
    const batch = operators.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((op: any) => checkOperator(op))
    );

    // Update each operator
    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      const r = result.value;

      const update: any = {
        healthStatus: r.status,
        lastHealthCheck: new Date(),
      };

      if (r.status === "down") {
        update.$inc = { consecutiveFailures: 1 };
      } else {
        update.consecutiveFailures = 0;
      }

      await OperatorModel.updateOne({ slug: r.slug }, update).catch(() => {});
    }
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startHealthMonitor(): void {
  if (intervalId) return;
  // Run first check after 30 seconds
  setTimeout(() => {
    runHealthChecks().catch(() => {});
    intervalId = setInterval(() => {
      runHealthChecks().catch(() => {});
    }, CHECK_INTERVAL);
  }, 30_000);
}

export function stopHealthMonitor(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
