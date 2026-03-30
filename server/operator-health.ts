/**
 * Operator Health Checking for Aegis Protocol.
 * Periodically checks operator endpoints and auto-deactivates after 3 consecutive failures.
 */

import { OperatorModel, logAudit } from "./db";
import logger from "./logger";

/** Health check interval: 5 minutes */
const HEALTH_CHECK_INTERVAL_MS = 5 * 60 * 1000;

/** Timeout for each health check request (10 seconds) */
const HEALTH_CHECK_TIMEOUT_MS = 10_000;

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
 * Check a single operator's endpoint health via HEAD request.
 * Falls back to GET if HEAD is not supported.
 */
async function checkOperatorHealth(
  operatorId: string,
  slug: string,
  endpointUrl: string,
): Promise<HealthCheckResult> {
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

    // Try HEAD first (lightweight)
    let res: Response;
    try {
      res = await fetch(endpointUrl, {
        method: "HEAD",
        signal: controller.signal,
        headers: {
          "User-Agent": "Aegis-HealthCheck/1.0",
          "X-Aegis-Health-Check": "true",
        },
      });
    } catch {
      // Some endpoints don't support HEAD, try GET
      res = await fetch(endpointUrl, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": "Aegis-HealthCheck/1.0",
          "X-Aegis-Health-Check": "true",
        },
      });
    }

    clearTimeout(timeout);
    const responseMs = Date.now() - start;

    if (res.status >= 200 && res.status < 500) {
      // 2xx-4xx are considered "alive" — the endpoint is responding
      const status: HealthStatus = responseMs > 5000 ? "degraded" : "healthy";
      return { operatorId, slug, status, responseMs };
    }

    // 5xx = server error, endpoint is degraded/down
    return {
      operatorId,
      slug,
      status: "degraded",
      responseMs,
      error: `HTTP ${res.status}`,
    };
  } catch (err: any) {
    const responseMs = Date.now() - start;
    const errorMsg = err.name === "AbortError" ? "Timeout" : err.message || "Connection failed";
    return {
      operatorId,
      slug,
      status: "down",
      responseMs,
      error: errorMsg,
    };
  }
}

/**
 * Run health checks on all active operators that have an endpointUrl.
 * Updates healthStatus, consecutiveFailures, and lastHealthCheck in the database.
 * Auto-deactivates operators after MAX_CONSECUTIVE_FAILURES consecutive failures.
 */
export async function runHealthChecks(): Promise<void> {
  try {
    // Get all active operators with endpoints
    const activeOperators = await OperatorModel.find({
      isActive: true,
      endpointUrl: { $ne: null, $exists: true },
    }).select("_id slug endpointUrl consecutiveFailures").lean();

    if (activeOperators.length === 0) return;

    logger.info(`[HealthCheck] Checking ${activeOperators.length} operators...`);

    // Run health checks in parallel (batched to avoid overwhelming the network)
    const BATCH_SIZE = 10;
    for (let i = 0; i < activeOperators.length; i += BATCH_SIZE) {
      const batch = activeOperators.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map((op: any) =>
          checkOperatorHealth(String(op._id), op.slug, op.endpointUrl!),
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
          updateData.suspensionReason = `Auto-deactivated: endpoint unreachable for ${MAX_CONSECUTIVE_FAILURES} consecutive health checks`;

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
 * Validate that an endpoint URL is reachable before accepting registration.
 * Returns true if the endpoint responds within the timeout, false otherwise.
 */
export async function validateEndpoint(endpointUrl: string): Promise<{ reachable: boolean; responseMs: number; error?: string }> {
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const res = await fetch(endpointUrl, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "Aegis-EndpointValidation/1.0",
        "X-Aegis-Validation": "true",
      },
    });

    clearTimeout(timeout);
    const responseMs = Date.now() - start;

    // Accept any response (even 4xx) as proof the server is alive
    return { reachable: true, responseMs };
  } catch (headErr: any) {
    // Try GET as fallback — some servers don't support HEAD
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);

      const res = await fetch(endpointUrl, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": "Aegis-EndpointValidation/1.0",
          "X-Aegis-Validation": "true",
        },
      });

      clearTimeout(timeout);
      const responseMs = Date.now() - start;
      return { reachable: true, responseMs };
    } catch (getErr: any) {
      const responseMs = Date.now() - start;
      const errorMsg = getErr.name === "AbortError"
        ? "Endpoint did not respond within 15 seconds"
        : getErr.message || "Connection failed";
      return { reachable: false, responseMs, error: errorMsg };
    }
  }
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
