/**
 * Operator readiness checking for Aegis Protocol.
 * Periodically checks that operators still have private skill content configured.
 */

import { OperatorModel, logAudit } from "./db";
import logger from "./logger";

/** Health check interval: 5 minutes */
const HEALTH_CHECK_INTERVAL_MS = 5 * 60 * 1000;

/** Number of consecutive failures before auto-deactivation */
const MAX_CONSECUTIVE_FAILURES = 3;

export type HealthStatus = "healthy" | "degraded" | "down" | "unknown";

interface HealthCheckResult {
  operatorId: string;
  slug: string;
  status: HealthStatus;
  responseMs: number;
  error?: string;
}

/**
 * Check whether a single operator still has private skill content configured.
 */
async function checkOperatorHealth(
  operatorId: string,
  slug: string,
  skill: string | null | undefined,
): Promise<HealthCheckResult> {
  const hasPrivateSkill = typeof skill === "string" && skill.trim().length > 0;
  if (hasPrivateSkill) {
    return { operatorId, slug, status: "healthy", responseMs: 0 };
  }
  return {
    operatorId,
    slug,
    status: "down",
    responseMs: 0,
    error: "Private SKILL.md content is missing",
  };
}

/**
 * Run readiness checks on all active operators.
 * Updates healthStatus, consecutiveFailures, and lastHealthCheck in the database.
 * Auto-deactivates operators after MAX_CONSECUTIVE_FAILURES consecutive missing-skill checks.
 */
export async function runHealthChecks(): Promise<void> {
  try {
    // Get all active operators
    const activeOperators = await OperatorModel.find({
      isActive: true,
    }).select("_id slug skill consecutiveFailures").lean();

    if (activeOperators.length === 0) return;

    logger.info(`[HealthCheck] Checking ${activeOperators.length} operators...`);

    // Run health checks in parallel (batched to avoid overwhelming the network)
    const BATCH_SIZE = 10;
    for (let i = 0; i < activeOperators.length; i += BATCH_SIZE) {
      const batch = activeOperators.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map((op: any) =>
          checkOperatorHealth(String(op._id), op.slug, op.skill),
        ),
      );

      for (const result of results) {
        if (result.status === "rejected") continue;

        const check = result.value;
        const op = batch.find((o: any) => String(o._id) === check.operatorId) as any;
        if (!op) continue;

        const isFailure = check.status === "down";
        const newConsecutiveFailures = isFailure
          ? (op.consecutiveFailures || 0) + 1
          : 0;

        // Update the operator's health status
        const updateData: Record<string, any> = {
          lastHealthCheck: new Date(),
          healthStatus: check.status,
          consecutiveFailures: newConsecutiveFailures,
        };

        // Auto-deactivate after MAX_CONSECUTIVE_FAILURES
        if (newConsecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          updateData.isActive = false;
          updateData.healthStatus = "down";
          updateData.suspensionReason = `Auto-deactivated: private SKILL.md missing for ${MAX_CONSECUTIVE_FAILURES} consecutive checks`;

          logger.warn(
            `[HealthCheck] Auto-deactivating operator ${check.slug} (${check.operatorId}): ${MAX_CONSECUTIVE_FAILURES} consecutive failures`,
          );

          await logAudit({
            action: "operator.auto_deactivate",
            targetType: "operator",
            targetId: check.operatorId as any,
            details: {
              reason: "health_check_failures",
              consecutiveFailures: newConsecutiveFailures,
              lastError: check.error,
            },
          });
        }

        await OperatorModel.findByIdAndUpdate(op._id, { $set: updateData });
      }
    }

    logger.info("[HealthCheck] Health check cycle complete");
  } catch (err) {
    logger.error({ err }, "[HealthCheck] Error running health checks");
  }
}

/**
 * Validate that private skill content exists before accepting registration.
 */
export async function validateEndpoint(skill: string): Promise<{ reachable: boolean; responseMs: number; error?: string }> {
  const hasPrivateSkill = typeof skill === "string" && skill.trim().length > 0;
  return hasPrivateSkill
    ? { reachable: true, responseMs: 0 }
    : { reachable: false, responseMs: 0, error: "Private SKILL.md content is required" };
}

/** Timer handle for the health check interval */
let healthCheckTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start the periodic health check loop.
 * Call this once during server startup.
 */
export function startHealthCheckLoop(): void {
  if (healthCheckTimer) {
    logger.warn("[HealthCheck] Health check loop already running");
    return;
  }

  logger.info(`[HealthCheck] Starting health check loop (every ${HEALTH_CHECK_INTERVAL_MS / 1000}s)`);

  // Run the first check after a short delay to let the server finish starting
  setTimeout(() => {
    runHealthChecks().catch((err) =>
      logger.error({ err }, "[HealthCheck] Initial health check failed"),
    );
  }, 10_000);

  // Then run every HEALTH_CHECK_INTERVAL_MS
  healthCheckTimer = setInterval(() => {
    runHealthChecks().catch((err) =>
      logger.error({ err }, "[HealthCheck] Periodic health check failed"),
    );
  }, HEALTH_CHECK_INTERVAL_MS);
}

/**
 * Stop the periodic health check loop.
 */
export function stopHealthCheckLoop(): void {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = null;
    logger.info("[HealthCheck] Health check loop stopped");
  }
}
