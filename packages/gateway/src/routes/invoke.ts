/**
 * POST /v1/invoke/:operatorSlug
 *
 * x402 payment-gated invocation route.
 *
 * Flow:
 * 1. No X-Payment-Signature header -> 402 with X-Payment-Required
 * 2. With header -> verify payment on-chain, forward to operator, validate quality, return result
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  decodePaymentHeader,
  buildPaymentRequiredHeader,
  buildPaymentResponseHeader,
  verifyPaymentOnChain,
} from "../middleware/x402.js";
import {
  getOperatorBySlugFromRegistry,
  recordInvocationInDb,
} from "../services/operator-registry.js";
import { scoreQuality, calculateFees } from "../services/quality.js";

const TREASURY_WALLET = process.env.TREASURY_WALLET ?? "";
const USDC_DECIMALS = 6;

export async function invokeRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/invoke/:operatorSlug", async (request: FastifyRequest, reply: FastifyReply) => {
    const { operatorSlug } = request.params as { operatorSlug: string };

    // ── Look up operator ──────────────────────────────────
    const operator = await getOperatorBySlugFromRegistry(operatorSlug);
    if (!operator) {
      return reply.status(404).send({
        error: "operator_not_found",
        message: `No operator found with slug: ${operatorSlug}`,
      });
    }

    if (!operator.isActive) {
      return reply.status(410).send({
        error: "operator_inactive",
        message: `Operator "${operator.name}" is currently inactive.`,
      });
    }

    // ── Check for payment header ──────────────────────────
    const paymentHeader = request.headers["x-payment-signature"] as string | undefined;

    if (!paymentHeader) {
      // Return 402 Payment Required
      const priceBaseUnits = String(
        Math.round(operator.priceUsdc * Math.pow(10, USDC_DECIMALS)),
      );

      return reply
        .status(402)
        .header("X-Payment-Required", buildPaymentRequiredHeader(priceBaseUnits))
        .send({
          error: "payment_required",
          message: `This skill costs ${operator.priceUsdc} USDC per invocation.`,
          operator: {
            slug: operator.slug,
            name: operator.name,
            priceUsdc: operator.priceUsdc,
            trustScore: operator.trustScore,
          },
          payment: {
            amount: priceBaseUnits,
            currency: "USDC",
            network: "solana",
            recipient: TREASURY_WALLET,
          },
        });
    }

    // ── Decode payment header ─────────────────────────────
    const payment = decodePaymentHeader(paymentHeader);
    if (!payment) {
      return reply.status(400).send({
        error: "invalid_payment_header",
        message: "X-Payment-Signature header must be base64-encoded JSON with txSignature, sender, and amount fields.",
      });
    }

    // ── Verify payment on-chain ───────────────────────────
    const expectedBaseUnits = Math.round(operator.priceUsdc * Math.pow(10, USDC_DECIMALS));
    const verification = await verifyPaymentOnChain(payment, expectedBaseUnits, TREASURY_WALLET);

    if (!verification.verified) {
      return reply.status(402).send({
        error: "payment_verification_failed",
        message: verification.error ?? "Payment could not be verified on-chain.",
        txSignature: payment.txSignature,
      });
    }

    // ── Forward request to operator endpoint ──────────────
    const payload = request.body ?? {};
    const invokeStart = Date.now();
    let operatorResponse: Response;
    let operatorBody: unknown;
    let operatorStatus: number;

    try {
      operatorResponse = await fetch(operator.endpoint, {
        method: operator.method ?? "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Aegis-Gateway/1.0",
          "X-Aegis-Invocation": "true",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });

      operatorStatus = operatorResponse.status;

      const contentType = operatorResponse.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        operatorBody = await operatorResponse.json();
      } else {
        operatorBody = await operatorResponse.text();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      operatorStatus = 502;
      operatorBody = { error: "operator_unreachable", message };
    }

    const responseMs = Date.now() - invokeStart;

    // ── Score quality ─────────────────────────────────────
    const quality = scoreQuality({
      responseMs,
      statusCode: operatorStatus,
      responseBody: operatorBody,
      expectedSchema: operator.expectedSchema,
    });

    // ── Calculate fees ────────────────────────────────────
    const fees = calculateFees(operator.priceUsdc);

    // ── Record invocation ─────────────────────────────────
    let invocationId = "unknown";
    try {
      invocationId = await recordInvocationInDb({
        operatorId: String(operator._id),
        callerWallet: payment.sender,
        payload,
        responseBody: operatorBody,
        statusCode: operatorStatus,
        responseMs,
        qualityScore: quality.score,
        trustDelta: quality.trustDelta,
        amountUsdc: operator.priceUsdc,
        creatorShare: fees.creator,
        txSignature: payment.txSignature,
        success: operatorStatus >= 200 && operatorStatus < 300,
        flags: quality.flags,
      });
    } catch (err: unknown) {
      console.warn("[invoke] Failed to record invocation:", err);
    }

    // ── Return result ─────────────────────────────────────
    return reply
      .status(200)
      .header("X-Payment-Response", buildPaymentResponseHeader(payment.txSignature, true))
      .send({
        result: operatorBody,
        invocationId,
        operator: {
          slug: operator.slug,
          name: operator.name,
        },
        quality: {
          score: quality.score,
          trustDelta: quality.trustDelta,
          breakdown: quality.breakdown,
          flags: quality.flags,
        },
        payment: {
          txSignature: payment.txSignature,
          amountUsdc: operator.priceUsdc,
          fees,
        },
        meta: {
          responseMs,
          statusCode: operatorStatus,
          timestamp: new Date().toISOString(),
        },
      });
  });
}
