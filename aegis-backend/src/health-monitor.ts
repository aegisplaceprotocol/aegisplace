/**
 * Operator Health Monitor
 *
 * Periodically checks operator endpoints and updates health status.
 * Runs every 5 minutes, checking operators in batches.
 */

import { OperatorModel } from "./db";

function isPrivateUrl(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    const host = u.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "::1") return true;
    if (host === "169.254.169.254") return true; // AWS/GCP metadata
    if (host === "100.100.100.200") return true; // Alibaba metadata
    if (host.startsWith("10.")) return true;
    if (host.startsWith("192.168.")) return true;
    if (host.startsWith("172.") && parseInt(host.split(".")[1]) >= 16 && parseInt(host.split(".")[1]) <= 31) return true;
    if (host.endsWith(".internal") || host.endsWith(".local")) return true;
    if (u.protocol !== "http:" && u.protocol !== "https:") return true;
    return false;
  } catch { return true; }
}

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const BATCH_SIZE = 50;
const TIMEOUT = 10_000; // 10 seconds

interface HealthResult {
  slug: string;
  status: "healthy" | "degraded" | "down" | "unknown";
  responseMs: number;
  statusCode: number;
  error?: string;
}

async function checkOperator(op: any): Promise<HealthResult> {
  if (!op.endpointUrl || isPrivateUrl(op.endpointUrl)) {
    return { slug: op.slug, status: "unknown", responseMs: 0, statusCode: 0 };
  }

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT);

    const res = await fetch(op.endpointUrl, {
      method: "HEAD",
      signal: controller.signal,
    }).catch(() =>
      fetch(op.endpointUrl, { method: "GET", signal: controller.signal })
    );

    clearTimeout(timeout);
    const responseMs = Date.now() - start;

    let status: HealthResult["status"] = "healthy";
    if (res.status >= 500) status = "down";
    else if (res.status >= 400 || responseMs > 5000) status = "degraded";

    return { slug: op.slug, status, responseMs, statusCode: res.status };
  } catch (err: any) {
    return {
      slug: op.slug,
      status: "down",
      responseMs: Date.now() - start,
      statusCode: 0,
      error: err.message?.slice(0, 100),
    };
  }
}

async function runHealthChecks(): Promise<void> {
  const operators = await OperatorModel.find({ isActive: true })
    .select("slug endpointUrl healthStatus consecutiveFailures")
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
