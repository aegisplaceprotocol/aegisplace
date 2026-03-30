import { ENV } from "./_core/env";
import logger from "./logger";

// ────────────────────────────────────────────────────────────
// NeMo Guardrails Integration
// ────────────────────────────────────────────────────────────

const GUARDRAILS_URL = ENV.guardrailsServerUrl;
const GUARDRAILS_TIMEOUT_MS = 10_000;

/** Category → NeMo config mapping */
const CONFIG_MAP: Record<string, string> = {
  "security-audit": "aegis-security",
  "code-review": "aegis-code",
};

/** Default config for categories not in CONFIG_MAP */
const DEFAULT_CONFIG = "aegis-default";

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

    if (!response.ok) {
      logger.warn({ status: response.status }, "[Guardrails] Input check failed, failing open");
      return { passed: true, violations: [], latencyMs };
    }

    const data = await response.json() as GuardrailsResponse;
    return parseGuardrailResponse(data, latencyMs);
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    // Fail open: if guardrails server is down, allow the request
    logger.warn({ err }, "[Guardrails] Input check error, failing open");
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

    if (!res.ok) {
      logger.warn({ status: res.status }, "[Guardrails] Output check failed, failing open");
      return { passed: true, violations: [], latencyMs };
    }

    const data = await res.json() as GuardrailsResponse;
    return parseGuardrailResponse(data, latencyMs);
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    logger.warn({ err }, "[Guardrails] Output check error, failing open");
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
