/**
 * Unified Invocation Engine for Aegis Protocol
 *
 * All three invoke paths (tRPC, REST, MCP) go through executeInvocation().
 * This is the single source of truth for operator invocation logic including:
 * - Operator lookup and validation
 * - SSRF protection on endpoint URLs
 * - Guardrail input/output checks (NeMo)
 * - Endpoint call with 15s timeout
 * - 6-way fee split (85/10/3/1.5/0.5)
 * - Invocation recording to MongoDB
 * - Trust score update
 * - Payment record creation
 * - SSE live feed broadcast
 */

import {
  getOperatorById,
  updateOperator,
  recordInvocation,
  createPayment,
} from "./db";
import { validateInvocation, calculateFees } from "./validator";
import { checkInput, checkOutput, lockOperatorToMaxStrictness, recordViolationPattern, getAdaptiveTier } from "./guardrails";
import { broadcastEvent } from "./sse";
import { verifyPayment } from "./solana";
import { ENV } from "./_core/env";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export interface InvokeParams {
  operatorId: number | string;
  callerWallet?: string;
  payload?: unknown;
  txSignature?: string;
  paymentToken?: string;
  source: "trpc" | "rest" | "mcp";
}

export interface InvokeResult {
  success: boolean;
  invocationId: number | string;
  operatorName: string;
  operatorSlug: string;
  responseMs: number;
  statusCode: number;
  response: unknown;
  fees: {
    total: string;
    creator: string;
    validator: string;
    staker: string;
    treasury: string;
    insurance: string;
    burned: string;
  };
  guardrails: {
    inputPassed: boolean;
    outputPassed: boolean;
    violations: string[];
  };
  trustDelta: number;
  newTrustScore: number;
  validation: {
    score: number;
    trustDelta: number;
    newTrustScore: number;
    flags: string[];
  };
}

export class InvocationError extends Error {
  public code: string;
  public statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = "InvocationError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

// ────────────────────────────────────────────────────────────
// SSRF Protection
// ────────────────────────────────────────────────────────────

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
  } catch {
    return true;
  }
}

// ────────────────────────────────────────────────────────────
// Core Engine
// ────────────────────────────────────────────────────────────

export async function executeInvocation(params: InvokeParams): Promise<InvokeResult> {
  const { operatorId, callerWallet, payload, txSignature, paymentToken, source } = params;

  // ── 1. Look up operator ──
  const operator: any = await getOperatorById(operatorId);
  if (!operator) {
    throw new InvocationError("NOT_FOUND", "Operator not found", 404);
  }
  if (!operator.isActive) {
    throw new InvocationError("INACTIVE", "Operator is not active", 400);
  }

  const price = parseFloat(operator.pricePerCall);
  const fees = calculateFees(price);

  // ── 2. Guardrail input check ──
  let guardrailInputResult = { passed: true, violations: [] as string[], latencyMs: 0 };
  let guardrailOutputResult = { passed: true, violations: [] as string[], latencyMs: 0 };
  let totalGuardrailLatencyMs = 0;

  guardrailInputResult = await checkInput(operator.category, payload);
  totalGuardrailLatencyMs += guardrailInputResult.latencyMs;

  // Self-improving: record violation patterns and auto-lock repeat offenders
  if (!guardrailInputResult.passed) {
    const opId = String(operator._id || operator.id);
    recordViolationPattern(opId, guardrailInputResult.violations);
    lockOperatorToMaxStrictness(opId);
  }

  // If input guardrail blocked, record and return immediately
  if (!guardrailInputResult.passed) {
    const invocationId = await recordInvocation({
      operatorId: operator._id || operator.id,
      callerWallet: callerWallet || null,
      amountPaid: "0",
      creatorShare: "0",
      validatorShare: "0",
      treasuryShare: "0",
      burnAmount: "0",
      responseMs: 0,
      success: false,
      statusCode: 403,
      trustDelta: 0,
      paymentVerified: false,
      guardrailInputPassed: false,
      guardrailOutputPassed: true,
      guardrailViolations: guardrailInputResult.violations,
      guardrailLatencyMs: totalGuardrailLatencyMs,
    });

    broadcastEvent("invocation", {
      invocationId,
      operatorId: operator.id,
      operatorName: operator.name,
      operatorSlug: operator.slug,
      callerWallet: callerWallet || null,
      success: false,
      responseMs: 0,
      amountPaid: "0",
      trustDelta: 0,
    });

    return {
      success: false,
      invocationId,
      operatorName: operator.name,
      operatorSlug: operator.slug,
      responseMs: 0,
      statusCode: 403,
      response: {
        error: "Blocked by Aegis NeMo Guardrails safety check",
        violations: guardrailInputResult.violations,
      },
      fees: {
        total: "0",
        creator: "0",
        validator: "0",
        staker: "0",
        treasury: "0",
        insurance: "0",
        burned: "0",
      },
      guardrails: {
        inputPassed: false,
        outputPassed: true,
        violations: guardrailInputResult.violations,
      },
      trustDelta: 0,
      newTrustScore: operator.trustScore,
      validation: {
        score: 0,
        trustDelta: 0,
        newTrustScore: operator.trustScore,
        flags: ["guardrail_input_blocked"],
      },
    };
  }

  // ── 3. Payment verification ──
  let paymentVerified = false;

  if (txSignature) {
    if (!callerWallet) {
      throw new InvocationError(
        "BAD_REQUEST",
        "callerWallet is required when providing txSignature",
        400,
      );
    }
    if (!ENV.treasuryWallet) {
      throw new InvocationError(
        "INTERNAL_SERVER_ERROR",
        "Treasury wallet not configured",
        500,
      );
    }

    const verification = await verifyPayment(
      txSignature,
      price,
      callerWallet,
      ENV.treasuryWallet,
    );

    if (!verification.verified) {
      throw new InvocationError(
        "PAYMENT_FAILED",
        `Payment verification failed: ${verification.error}`,
        400,
      );
    }
    paymentVerified = true;
  } else if (operator.endpointUrl && price > 0) {
    // Real operator with a price requires payment - demo operators (no endpoint) are free
    throw new InvocationError(
      "PAYMENT_REQUIRED",
      "This operator requires payment. Provide a txSignature for an on-chain USDC transfer to the treasury wallet.",
      402,
    );
  }

  // ── 4. Call the operator endpoint ──
  let responseMs = 0;
  let statusCode = 200;
  let responseBody: unknown = null;
  let success = true;

  if (operator.endpointUrl) {
    // SSRF check
    if (isPrivateUrl(operator.endpointUrl)) {
      throw new InvocationError("ENDPOINT_BLOCKED", "Invalid operator endpoint", 403);
    }

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const method = (operator.httpMethod || "POST").toUpperCase();
      const isBodyAllowed = method !== "GET" && method !== "HEAD";
      const hasPayload = payload !== null && payload !== undefined && !(typeof payload === "object" && Object.keys(payload as Record<string, unknown>).length === 0);

      const res = await fetch(operator.endpointUrl, {
        method,
        headers: {
          ...(isBodyAllowed ? { "Content-Type": "application/json" } : {}),
          "X-Aegis-Operator-Id": String(operator.id),
          "X-Aegis-Caller": callerWallet || "anonymous",
          "X-Aegis-Source": source,
        },
        body: isBodyAllowed && hasPayload ? JSON.stringify(payload) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      responseMs = Date.now() - start;
      statusCode = res.status;

      const rawText = await res.text();
      if (rawText.length > 1_000_000) {
        throw new Error("Response too large (max 1MB)");
      }
      try {
        responseBody = JSON.parse(rawText);
      } catch {
        responseBody = rawText;
      }

      success = statusCode >= 200 && statusCode < 400;
    } catch (err: any) {
      responseMs = Date.now() - start;
      statusCode = 0;
      success = false;
      responseBody = { error: err.message || "Request failed" };
    }
  } else {
    // No endpoint deployed
    responseMs = 0;
    statusCode = 503;
    success = false;
    responseBody = {
      error: "OPERATOR_NOT_DEPLOYED",
      message: "This operator is not yet deployed.",
    };
  }

  // ── 5. Guardrail output check ──
  if (success) {
    guardrailOutputResult = await checkOutput(operator.category, responseBody);
    totalGuardrailLatencyMs += guardrailOutputResult.latencyMs;

    if (!guardrailOutputResult.passed) {
      success = false;
      // Self-improving: lock operator and record pattern
      const opId = String(operator._id || operator.id);
      recordViolationPattern(opId, guardrailOutputResult.violations);
      lockOperatorToMaxStrictness(opId);
    }
  }

  // ── 6. Validate the response ──
  const validation = validateInvocation({
    responseMs,
    statusCode,
    responseBody,
    expectedSchema: operator.responseSchema as Record<string, unknown> | undefined,
  });

  // Apply guardrail output penalty to trust delta
  let trustDelta = validation.trustDelta;
  if (!guardrailOutputResult.passed) {
    trustDelta = -5;
  }

  // Combine all guardrail violations
  const allViolations = [
    ...guardrailInputResult.violations,
    ...guardrailOutputResult.violations,
  ];

  // ── 7. Record the invocation in MongoDB ──
  const invocationId = await recordInvocation({
    operatorId: operator._id || operator.id,
    callerWallet: callerWallet || null,
    amountPaid: price.toFixed(8),
    creatorShare: fees.creator.toFixed(8),
    validatorShare: fees.validators.toFixed(8),
    treasuryShare: fees.treasury.toFixed(8),
    burnAmount: fees.burn.toFixed(8),
    stakersShare: fees.stakers.toFixed(8),
    insuranceShare: fees.insurance.toFixed(8),
    responseMs,
    success,
    statusCode,
    trustDelta,
    txSignature: txSignature || null,
    paymentToken: paymentToken,
    paymentVerified,
    guardrailInputPassed: guardrailInputResult.passed,
    guardrailOutputPassed: guardrailOutputResult.passed,
    guardrailViolations: allViolations.length > 0 ? allViolations : undefined,
    guardrailLatencyMs: totalGuardrailLatencyMs,
  });

  // ── 8. Update trust score ──
  const newTrust = Math.max(0, Math.min(100, operator.trustScore + trustDelta));
  await updateOperator(operator.id, { trustScore: newTrust });

  // ── 9. Create payment record ──
  const txSig = txSignature || paymentToken || (source === "mcp" ? `mcp-${invocationId}` : "awaiting_confirmation");
  await createPayment({
    invocationId,
    txSignature: txSig,
    totalAmount: price.toFixed(8),
    operatorShare: fees.creator.toFixed(8),
    protocolShare: fees.treasury.toFixed(8),
    validatorShare: fees.validators.toFixed(8),
    burnAmount: fees.burn.toFixed(8),
    stakersShare: fees.stakers.toFixed(8),
    insuranceShare: fees.insurance.toFixed(8),
    status: paymentVerified ? "settled" : "pending",
    settledAt: paymentVerified ? new Date() : undefined,
  });

  // ── 10. Broadcast via SSE live feed ──
  broadcastEvent("invocation", {
    invocationId,
    operatorId: operator.id,
    operatorName: operator.name,
    operatorSlug: operator.slug,
    callerWallet: callerWallet || null,
    success,
    responseMs,
    amountPaid: price.toFixed(8),
    trustDelta,
  });

  // ── 11. Return structured result ──
  return {
    success,
    invocationId,
    operatorName: operator.name,
    operatorSlug: operator.slug,
    responseMs,
    statusCode,
    response: responseBody,
    fees: {
      total: price.toFixed(8),
      creator: fees.creator.toFixed(8),
      validator: fees.validators.toFixed(8),
      staker: fees.stakers.toFixed(8),
      treasury: fees.treasury.toFixed(8),
      insurance: fees.insurance.toFixed(8),
      burned: fees.burn.toFixed(8),
    },
    guardrails: {
      inputPassed: guardrailInputResult.passed,
      outputPassed: guardrailOutputResult.passed,
      violations: allViolations,
      adaptiveTier: getAdaptiveTier(operator.trustScore || 5000, String(operator._id || operator.id)),
      latencyMs: totalGuardrailLatencyMs,
    },
    trustDelta,
    newTrustScore: newTrust,
    validation: {
      score: validation.score,
      trustDelta,
      newTrustScore: newTrust,
      flags: [
        ...validation.flags,
        ...(!guardrailOutputResult.passed ? ["guardrail_output_blocked"] : []),
      ],
    },
  };
}
