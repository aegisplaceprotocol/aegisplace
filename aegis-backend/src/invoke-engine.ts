/**
 * Unified Invocation Engine for Aegis Protocol
 *
 * All invoke paths go through executeInvocation(). The current product model
 * treats invocation as a gated skill unlock: users pay to reveal the creator's
 * private SKILL.md markdown rather than calling a remote endpoint.
 */

import {
  getOperatorById,
  recordInvocation,
  createPayment,
  hasPaymentTxSignature,
} from "./db";
import { calculateFees } from "./validator";
import { broadcastEvent } from "./sse";
import { getDecodedOperator, verifyPayment, verifyProgramPayment } from "./solana";
import { ENV } from "./_core/env";

export interface InvokeParams {
  operatorId: number | string;
  callerWallet?: string;
  payload?: unknown;
  txSignature?: string;
  receiptPda?: string;
  paymentToken?: string;
  settlementMethod?: "legacy_transfer" | "aegis_program";
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
    treasury: string;
    insurance: string;
    burned: string;
  };
  guardrails: {
    inputPassed: boolean;
    outputPassed: boolean;
    violations: string[];
    latencyMs?: number;
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

export async function executeInvocation(params: InvokeParams): Promise<InvokeResult> {
  const { operatorId, callerWallet, payload, txSignature, receiptPda, paymentToken, settlementMethod, source } = params;

  const operator: any = await getOperatorById(operatorId);
  if (!operator) {
    throw new InvocationError("NOT_FOUND", "Operator not found", 404);
  }
  if (!operator.isActive) {
    throw new InvocationError("INACTIVE", "Operator is not active", 400);
  }

  let price = parseFloat(operator.pricePerCall || "0");
  if ((settlementMethod === "aegis_program" || receiptPda) && operator.onChainOperatorPda) {
    const onChainOperator = await getDecodedOperator(operator.onChainOperatorPda);
    price = Number(onChainOperator.priceUsdcBase) / 1_000_000;
  }
  const fees = calculateFees(price);
  const skillContent = typeof operator.skill === "string" ? operator.skill.trim() : "";

  if (!skillContent) {
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
      statusCode: 409,
      trustDelta: 0,
      paymentVerified: false,
      settlementMethod: settlementMethod || null,
      onChainReceiptPda: receiptPda || null,
      guardrailInputPassed: true,
      guardrailOutputPassed: true,
      guardrailLatencyMs: 0,
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
      statusCode: 409,
      response: {
        error: "SKILL_NOT_CONFIGURED",
        message: "This skill does not have private SKILL.md content configured yet.",
        description: operator.description || operator.tagline || null,
        metadataUri: operator.onChainMetadataUri || null,
        skillStatus: "missing_skill",
      },
      fees: {
        total: "0",
        creator: "0",
        validator: "0",
        treasury: "0",
        insurance: "0",
        burned: "0",
      },
      guardrails: {
        inputPassed: true,
        outputPassed: true,
        violations: [],
        latencyMs: 0,
      },
      trustDelta: 0,
      newTrustScore: operator.trustScore,
      validation: {
        score: 0,
        trustDelta: 0,
        newTrustScore: operator.trustScore,
        flags: ["skill_not_configured"],
      },
    };
  }

  let paymentVerified = false;
  if (txSignature) {
    if (!callerWallet) {
      throw new InvocationError("BAD_REQUEST", "callerWallet is required when providing txSignature", 400);
    }
    if ((settlementMethod === "aegis_program" || receiptPda) && (!operator.onChainProgramId || !operator.onChainConfigPda || !operator.onChainOperatorPda)) {
      throw new InvocationError("PAYMENT_FAILED", "Operator is missing required on-chain settlement metadata.", 409);
    }
    if (settlementMethod === "aegis_program" && !receiptPda) {
      throw new InvocationError("BAD_REQUEST", "receiptPda is required for on-chain Aegis settlement verification", 400);
    }
    if (!ENV.treasuryWallet && settlementMethod !== "aegis_program") {
      throw new InvocationError("INTERNAL_SERVER_ERROR", "Treasury wallet not configured", 500);
    }
    if (await hasPaymentTxSignature(txSignature)) {
      throw new InvocationError("PAYMENT_PROOF_ALREADY_USED", "This payment transaction signature has already been used for a previous invocation.", 409);
    }

    const verification = settlementMethod === "aegis_program" || !!receiptPda
      ? await verifyProgramPayment({
          txSignature,
          expectedAmount: price,
          callerWallet,
          programId: operator.onChainProgramId || ENV.aegisProgramId,
          operatorPda: operator.onChainOperatorPda,
          configPda: operator.onChainConfigPda,
          receiptPda: receiptPda || "",
        })
      : await verifyPayment(txSignature, price, callerWallet, ENV.treasuryWallet);

    if (!verification.verified) {
      throw new InvocationError("PAYMENT_FAILED", `Payment verification failed: ${verification.error}`, 400);
    }
    paymentVerified = true;
  } else if (price > 0) {
    throw new InvocationError("PAYMENT_REQUIRED", "This skill requires payment. Provide a confirmed on-chain settlement proof for the paid unlock transaction.", 402);
  }

  const invocationId = await recordInvocation({
    operatorId: operator._id || operator.id,
    callerWallet: callerWallet || null,
    amountPaid: price.toFixed(8),
    creatorShare: fees.creator.toFixed(8),
    validatorShare: fees.validators.toFixed(8),
    treasuryShare: fees.treasury.toFixed(8),
    burnAmount: fees.burn.toFixed(8),
    insuranceShare: fees.insurance.toFixed(8),
    responseMs: 0,
    success: true,
    statusCode: 200,
    trustDelta: 0,
    txSignature: txSignature || null,
    paymentToken,
    paymentVerified,
    settlementMethod: settlementMethod || (receiptPda ? "aegis_program" : null),
    onChainReceiptPda: receiptPda || null,
    guardrailInputPassed: true,
    guardrailOutputPassed: true,
    guardrailLatencyMs: 0,
  });

  if (price > 0) {
    const txSig = txSignature || paymentToken || (source === "mcp" ? `mcp-${invocationId}` : "awaiting_confirmation");
    await createPayment({
      invocationId,
      txSignature: txSig,
      totalAmount: price.toFixed(8),
      operatorShare: fees.creator.toFixed(8),
      protocolShare: fees.treasury.toFixed(8),
      validatorShare: fees.validators.toFixed(8),
      burnAmount: fees.burn.toFixed(8),
      insuranceShare: fees.insurance.toFixed(8),
      settlementMethod: settlementMethod || (receiptPda ? "aegis_program" : "legacy_transfer"),
      onChainReceiptPda: receiptPda || null,
      status: paymentVerified ? "settled" : "pending",
      settledAt: paymentVerified ? new Date() : undefined,
    });
  }

  broadcastEvent("invocation", {
    invocationId,
    operatorId: operator.id,
    operatorName: operator.name,
    operatorSlug: operator.slug,
    callerWallet: callerWallet || null,
    success: true,
    responseMs: 0,
    amountPaid: price.toFixed(8),
    trustDelta: 0,
  });

  return {
    success: true,
    invocationId,
    operatorName: operator.name,
    operatorSlug: operator.slug,
    responseMs: 0,
    statusCode: 200,
    response: {
      kind: "skill_markdown",
      version: "1.0",
      access: price > 0 ? "paid" : "free",
      description: operator.description || operator.tagline || null,
      skill: skillContent,
      metadataUri: operator.onChainMetadataUri || null,
      docsUrl: operator.docsUrl || null,
      githubUrl: operator.githubUrl || null,
      tags: operator.tags || [],
      requestedWith: {
        source,
        callerWallet: callerWallet || null,
        hasPayload: payload != null,
      },
    },
    fees: {
      total: price.toFixed(8),
      creator: fees.creator.toFixed(8),
      validator: fees.validators.toFixed(8),
      treasury: fees.treasury.toFixed(8),
      insurance: fees.insurance.toFixed(8),
      burned: fees.burn.toFixed(8),
    },
    guardrails: {
      inputPassed: true,
      outputPassed: true,
      violations: [],
      latencyMs: 0,
    },
    trustDelta: 0,
    newTrustScore: operator.trustScore,
    validation: {
      score: 100,
      trustDelta: 0,
      newTrustScore: operator.trustScore,
      flags: [],
    },
  };
}
