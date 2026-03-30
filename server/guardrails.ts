import { ENV } from "./_core/env";
import logger from "./logger";

// ────────────────────────────────────────────────────────────
// NeMo Guardrails Integration
// ────────────────────────────────────────────────────────────

const GUARDRAILS_URL = ENV.guardrailsServerUrl;
const GUARDRAILS_TIMEOUT_MS = 10_000;

// ── Guardrail metrics (exported for dashboard/stats) ──────
export const guardrailMetrics = {
  checksAttempted: 0,
  checksPassed: 0,
  checksFailed: 0,
  checksErrored: 0,
  serverAvailable: false,
  lastCheckAt: null as string | null,
};

/** Return a snapshot of current guardrail metrics */
export function getGuardrailMetrics() {
  return { ...guardrailMetrics };
}

/** Category → NeMo config mapping */
const CONFIG_MAP: Record<string, string> = {
  "security-audit": "aegis-security",
  "code-review": "aegis-code",
};

/** Default config for categories not in CONFIG_MAP */
const DEFAULT_CONFIG = "aegis-default";

// ── Adaptive Guardrails Engine ────────────────────────────────
//
// Innovation: guardrail strictness scales inversely with operator trust.
// New operators (trust 0-2000) get maximum safety checks.
// Established operators (trust 8000+) get lighter checks.
// Operators that trigger violations get automatically re-tightened.
// This creates a self-improving feedback loop between trust and safety.
//
// Trust tiers map to NeMo parameters:
//   Tier 0 (0-2000):    Maximum strictness, all rails active, low thresholds
//   Tier 1 (2000-5000): Standard strictness, all rails active
//   Tier 2 (5000-8000): Reduced strictness, core rails only
//   Tier 3 (8000+):     Minimum strictness, content safety only
//
// After a violation, the operator is locked to Tier 0 for 24 hours
// regardless of trust score. This prevents gaming via gradual trust
// accumulation followed by a single malicious call.

export interface AdaptiveParams {
  jailbreakThreshold: number;
  injectionTypes: string[];
  piiEntities: string[];
  scoreThreshold: number;
  outputScan: boolean;
}

const ADAPTIVE_TIERS: Record<number, AdaptiveParams> = {
  0: {
    jailbreakThreshold: 50.0,
    injectionTypes: ["sqli", "template", "code", "xss", "shell", "path_traversal", "ldap", "xpath"],
    piiEntities: ["PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER", "CREDIT_CARD", "IP_ADDRESS", "API_KEY", "PASSWORD", "SSH_KEY"],
    scoreThreshold: 0.2,
    outputScan: true,
  },
  1: {
    jailbreakThreshold: 70.0,
    injectionTypes: ["sqli", "template", "code", "xss", "shell", "path_traversal"],
    piiEntities: ["PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER", "CREDIT_CARD", "API_KEY", "PASSWORD"],
    scoreThreshold: 0.4,
    outputScan: true,
  },
  2: {
    jailbreakThreshold: 89.79,
    injectionTypes: ["sqli", "template", "code", "xss"],
    piiEntities: ["EMAIL_ADDRESS", "CREDIT_CARD", "API_KEY"],
    scoreThreshold: 0.5,
    outputScan: true,
  },
  3: {
    jailbreakThreshold: 89.79,
    injectionTypes: ["sqli", "xss"],
    piiEntities: ["CREDIT_CARD", "API_KEY"],
    scoreThreshold: 0.6,
    outputScan: false,
  },
};

// Track operators that violated guardrails (locked to Tier 0 for 24h)
const violationLockout = new Map<string, number>();
const LOCKOUT_DURATION_MS = 24 * 60 * 60 * 1000;

/** Get adaptive tier based on trust score, with violation lockout override */
export function getAdaptiveTier(trustScore: number, operatorId?: string): number {
  // Check lockout
  if (operatorId) {
    const lockoutExpiry = violationLockout.get(operatorId);
    if (lockoutExpiry && Date.now() < lockoutExpiry) {
      return 0; // Locked to maximum strictness
    }
    if (lockoutExpiry && Date.now() >= lockoutExpiry) {
      violationLockout.delete(operatorId);
    }
  }

  if (trustScore < 2000) return 0;
  if (trustScore < 5000) return 1;
  if (trustScore < 8000) return 2;
  return 3;
}

/** Lock an operator to Tier 0 after a guardrail violation */
export function lockOperatorToMaxStrictness(operatorId: string) {
  violationLockout.set(operatorId, Date.now() + LOCKOUT_DURATION_MS);
  logger.info({ operatorId }, "[AdaptiveGuardrails] Operator locked to Tier 0 for 24h after violation");
}

/** Get adaptive parameters for an operator */
export function getAdaptiveParams(trustScore: number, operatorId?: string): AdaptiveParams {
  const tier = getAdaptiveTier(trustScore, operatorId);
  return ADAPTIVE_TIERS[tier];
}

// Track violation patterns for self-improving detection
const violationPatterns = new Map<string, { count: number; lastSeen: number; types: Set<string> }>();

/** Record a violation pattern for self-improving guardrails */
export function recordViolationPattern(operatorId: string, violations: string[]) {
  const existing = violationPatterns.get(operatorId) || { count: 0, lastSeen: 0, types: new Set() };
  existing.count++;
  existing.lastSeen = Date.now();
  for (const v of violations) existing.types.add(v);
  violationPatterns.set(operatorId, existing);

  // Self-improving: if 3+ violations in 1 hour, auto-lock
  if (existing.count >= 3 && Date.now() - existing.lastSeen < 60 * 60 * 1000) {
    lockOperatorToMaxStrictness(operatorId);
    logger.warn({ operatorId, count: existing.count }, "[SelfImproving] Auto-locked operator after repeated violations");
  }
}

/** Export adaptive guardrails stats for the dashboard */
export function getAdaptiveStats() {
  return {
    lockedOperators: violationLockout.size,
    trackedPatterns: violationPatterns.size,
    tiers: Object.fromEntries(
      [0, 1, 2, 3].map(t => [t, ADAPTIVE_TIERS[t]])
    ),
  };
}

export interface GuardrailResult {
  passed: boolean;
  violations: string[];
  latencyMs: number;
  /** The raw response from the guardrails server (for debugging) */
  raw?: unknown;
}

function getConfigId(category: string): string {
  return CONFIG_MAP[category] || DEFAULT_CONFIG;
}

function stringifyPayload(payload: unknown): string {
  if (typeof payload === "string") return payload;
  if (payload === null || payload === undefined) return "";
  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
}

/**
 * Check input payload against NeMo Guardrails before executing operator.
 * Fails open: if the guardrails server is unreachable, returns passed=true.
 */
export async function checkInput(category: string, payload: unknown): Promise<GuardrailResult> {
  if (!ENV.guardrailsEnabled) {
    return { passed: true, violations: [], latencyMs: 0 };
  }

  guardrailMetrics.checksAttempted++;
  guardrailMetrics.lastCheckAt = new Date().toISOString();

  const configId = getConfigId(category);
  const content = stringifyPayload(payload);
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GUARDRAILS_TIMEOUT_MS);

    const response = await fetch(`${GUARDRAILS_URL}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config_id: configId,
        messages: [{ role: "user", content }],
        options: {
          rails: { input: true, output: false },
          log: { activated_rails: true },
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const latencyMs = Date.now() - start;

    guardrailMetrics.serverAvailable = true;

    if (!response.ok) {
      logger.warn({ status: response.status }, "[Guardrails] Input check failed, failing open");
      guardrailMetrics.checksErrored++;
      return { passed: true, violations: [], latencyMs };
    }

    const data = await response.json() as GuardrailsResponse;
    const result = parseGuardrailResponse(data, latencyMs);
    if (result.passed) guardrailMetrics.checksPassed++;
    else guardrailMetrics.checksFailed++;
    return result;
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    guardrailMetrics.serverAvailable = false;
    guardrailMetrics.checksErrored++;
    // Fail open: if guardrails server is down, allow the request
    logger.warn({ err: err.message }, "[Guardrails] Input check error (server unreachable), failing open");
    return { passed: true, violations: [], latencyMs };
  }
}

/**
 * Check operator output against NeMo Guardrails after execution.
 * Fails open: if the guardrails server is unreachable, returns passed=true.
 */
export async function checkOutput(category: string, response: unknown): Promise<GuardrailResult> {
  if (!ENV.guardrailsEnabled) {
    return { passed: true, violations: [], latencyMs: 0 };
  }

  guardrailMetrics.checksAttempted++;
  guardrailMetrics.lastCheckAt = new Date().toISOString();

  const configId = getConfigId(category);
  const content = stringifyPayload(response);
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GUARDRAILS_TIMEOUT_MS);

    const res = await fetch(`${GUARDRAILS_URL}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config_id: configId,
        messages: [
          { role: "user", content: "Invoke operator" },
          { role: "assistant", content },
        ],
        options: {
          rails: { input: false, output: true },
          log: { activated_rails: true },
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const latencyMs = Date.now() - start;

    guardrailMetrics.serverAvailable = true;

    if (!res.ok) {
      logger.warn({ status: res.status }, "[Guardrails] Output check failed, failing open");
      guardrailMetrics.checksErrored++;
      return { passed: true, violations: [], latencyMs };
    }

    const data = await res.json() as GuardrailsResponse;
    const result = parseGuardrailResponse(data, latencyMs);
    if (result.passed) guardrailMetrics.checksPassed++;
    else guardrailMetrics.checksFailed++;
    return result;
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    guardrailMetrics.serverAvailable = false;
    guardrailMetrics.checksErrored++;
    logger.warn({ err: err.message }, "[Guardrails] Output check error (server unreachable), failing open");
    return { passed: true, violations: [], latencyMs };
  }
}

// ── Internal types & helpers ────────────────────────────────

interface GuardrailsLogEntry {
  type?: string;
  name?: string;
  triggered?: boolean;
  [key: string]: unknown;
}

interface GuardrailsResponse {
  choices?: Array<{
    message?: {
      content?: string;
      role?: string;
    };
  }>;
  log?: {
    activated_rails?: GuardrailsLogEntry[];
  };
  response?: string | Array<{ content?: string }>;
}

/**
 * Parse the NeMo Guardrails server response to determine pass/fail and extract violations.
 * A response is considered blocked if:
 *  - The response content contains a known refusal message
 *  - Any activated rail was triggered
 */
function parseGuardrailResponse(data: GuardrailsResponse, latencyMs: number): GuardrailResult {
  const violations: string[] = [];

  // Check activated rails in the log
  const activatedRails = data.log?.activated_rails;
  if (Array.isArray(activatedRails)) {
    for (const rail of activatedRails) {
      if (rail.triggered) {
        violations.push(rail.name || rail.type || "unknown_rail");
      }
    }
  }

  // Check if the response content indicates a refusal
  const responseContent =
    data.choices?.[0]?.message?.content
    || (typeof data.response === "string" ? data.response : null)
    || (Array.isArray(data.response) ? data.response[0]?.content : null)
    || "";

  const refusalPatterns = [
    "blocked by Aegis safety checks",
    "I'm sorry, I can't",
    "cannot process this request",
    "blocked by safety",
    "content safety violation",
  ];

  const isRefusal = refusalPatterns.some(
    (pattern) => typeof responseContent === "string" && responseContent.toLowerCase().includes(pattern.toLowerCase()),
  );

  if (isRefusal && violations.length === 0) {
    violations.push("content_safety_refusal");
  }

  const passed = violations.length === 0;

  return { passed, violations, latencyMs, raw: data };
}
