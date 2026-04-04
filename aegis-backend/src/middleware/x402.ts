/**
 * x402 Payment Protocol Middleware for Aegis Protocol
 *
 * Implements the HTTP 402 Payment Required flow:
 * 1. Agent sends request to invoke a skill
 * 2. Server responds with 402 + payment requirements in headers
 * 3. Agent signs Solana transaction for USDC payment
 * 4. Agent retries with X-Payment-Proof header containing tx signature
 * 5. Server verifies payment and processes the request
 *
 * Compatible with:
 * - Coinbase x402 SDK (@anthropic-ai/x402)
 * - Stripe MPP (Machine Payments Protocol)
 * - Any agent wallet with Solana USDC support
 *
 * Headers:
 *   Request:
 *     X-Payment-Proof: <solana-tx-signature>
 *     X-Payer-Wallet: <solana-wallet-address>
 *
 *   Response (402):
 *     X-Payment-Required: true
 *     X-Payment-Amount: <amount-in-lamports>
 *     X-Payment-Currency: USDC
 *     X-Payment-Chain: solana
 *     X-Payment-Recipient: <operator-creator-wallet>
 *     X-Payment-Network: mainnet-beta
 *     X-Payment-Description: <skill-name invocation>
 */

import { Request, Response, NextFunction } from "express";
import { OperatorModel } from "../db.js";
import { ENV } from "../_core/env.js";

/** USDC mint on Solana mainnet */
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

/** Solana network identifier used in x402 v2 payloads */
const SOLANA_NETWORK_ID = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";

export interface X402PaymentInfo {
  required: boolean;
  amount: string;
  currency: string;
  chain: string;
  recipient: string;
  network: string;
  description: string;
  operatorSlug: string;
}

/**
 * Extracts x402 payment proof from request headers.
 *
 * Supports multiple header conventions:
 * - X-Payment-Proof (preferred)
 * - X-Payment (Coinbase x402 SDK)
 * - Payment-Signature (x402 v2 spec, base64-encoded JSON)
 * - Body fallback (txSignature field)
 */
export function extractPaymentProof(req: Request): {
  txSignature?: string;
  payerWallet?: string;
} {
  // Try the x402 v2 base64 header first (Payment-Signature)
  const paymentSigHeader = req.headers["payment-signature"] as string | undefined;
  if (paymentSigHeader) {
    try {
      const decoded = JSON.parse(
        Buffer.from(paymentSigHeader, "base64").toString("utf-8"),
      );
      if (decoded.txSignature) {
        return {
          txSignature: decoded.txSignature,
          payerWallet: decoded.sender || (req.headers["x-payer-wallet"] as string),
        };
      }
    } catch {
      // Not base64 JSON -- treat raw value as tx signature
      return {
        txSignature: paymentSigHeader,
        payerWallet: (req.headers["x-payer-wallet"] as string) || req.body?.callerWallet,
      };
    }
  }

  return {
    txSignature:
      (req.headers["x-payment-proof"] as string) ||
      (req.headers["x-payment"] as string) ||
      req.body?.txSignature,
    payerWallet:
      (req.headers["x-payer-wallet"] as string) || req.body?.callerWallet,
  };
}

/**
 * Sends a 402 Payment Required response with x402 headers.
 *
 * Sets both:
 * - Simple X-Payment-* headers for lightweight clients
 * - The x402 v2 base64 PAYMENT-REQUIRED header for SDK clients
 */
export function send402(res: Response, info: X402PaymentInfo): void {
  // Compute atomic amount (USDC has 6 decimals)
  const amountAtomic = String(Math.round(parseFloat(info.amount) * 1e6));

  // x402 v2 response body
  const x402Body = {
    x402Version: 2,
    resource: {
      url: `/api/v1/operators/${info.operatorSlug}/invoke`,
      description: info.description,
      mimeType: "application/json",
    },
    accepts: [
      {
        scheme: "exact",
        network: SOLANA_NETWORK_ID,
        amount: amountAtomic,
        asset: USDC_MINT,
        payTo: info.recipient,
        maxTimeoutSeconds: 60,
      },
    ],
  };

  const paymentRequiredHeader = Buffer.from(JSON.stringify(x402Body)).toString(
    "base64",
  );

  res.status(402);
  res.set({
    // Simple headers for lightweight clients
    "X-Payment-Required": "true",
    "X-Payment-Amount": amountAtomic,
    "X-Payment-Currency": info.currency,
    "X-Payment-Chain": info.chain,
    "X-Payment-Recipient": info.recipient,
    "X-Payment-Network": info.network,
    "X-Payment-Description": info.description,
    // x402 v2 base64 header for SDK clients
    "PAYMENT-REQUIRED": paymentRequiredHeader,
    "Content-Type": "application/json",
  });

  res.json({
    error: "Payment Required",
    code: 402,
    message: `This skill requires payment of ${info.amount} ${info.currency} to invoke.`,
    x402Version: 2,
    payment: {
      amount: info.amount,
      amountAtomic,
      currency: info.currency,
      chain: info.chain,
      recipient: info.recipient,
      network: info.network,
      asset: USDC_MINT,
    },
    instructions: {
      step1:
        "Sign a Solana USDC transfer transaction to the recipient address",
      step2:
        "Retry this request with X-Payment-Proof header containing the transaction signature",
      step3: "Include X-Payer-Wallet header with your wallet address",
    },
    protocols: {
      x402: "https://x402.org",
      mpp: "https://docs.stripe.com/payments/machine/mpp",
    },
  });
}

/**
 * Middleware that enforces x402 payment for skill invocations.
 *
 * If the request has a valid payment proof, it passes through.
 * If not, it returns a 402 with payment instructions.
 *
 * Free-tier operators (pricePerCall = 0) pass through without payment.
 */
export function x402PaymentGate() {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const idOrSlug = req.params.idOrSlug;
    if (!idOrSlug) return next();

    try {
      // Look up the operator
      const op = (await OperatorModel.findOne(
        /^\d+$/.test(idOrSlug) ? { id: Number(idOrSlug) } : { slug: idOrSlug },
      ).lean()) as any;

      if (!op) {
        res.status(404).json({ error: "Operator not found" });
        return;
      }

      // Parse price -- handles both Decimal128 objects and plain strings
      const price = op.pricePerCall?.$numberDecimal
        ? parseFloat(op.pricePerCall.$numberDecimal)
        : parseFloat(op.pricePerCall || "0");

      // Free operators don't need payment
      if (price <= 0) {
        (req as any).operator = op;
        (req as any).paymentVerified = true;
        (req as any).paymentAmount = 0;
        return next();
      }

      // Check for payment proof
      const { txSignature, payerWallet } = extractPaymentProof(req);

      if (txSignature) {
        // Payment proof provided -- attach to request for downstream verification
        (req as any).operator = op;
        (req as any).paymentProof = txSignature;
        (req as any).payerWallet = payerWallet;
        (req as any).paymentAmount = price;
        // Actual on-chain verification happens in the invoke handler
        return next();
      }

      // No payment proof -- return 402
      send402(res, {
        required: true,
        amount: price.toFixed(6),
        currency: "USDC",
        chain: "solana",
        recipient: ENV.treasuryWallet || op.creatorWallet || "",
        network: "mainnet-beta",
        description: `Invoke ${op.name} (${op.slug})`,
        operatorSlug: op.slug,
      });
    } catch (err: any) {
      next(err);
    }
  };
}

/**
 * Middleware for Stripe MPP (Machine Payments Protocol) compatibility.
 * Translates MPP-specific headers to x402 format so downstream
 * middleware can handle them uniformly.
 */
export function mppCompatibility() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Stripe MPP uses different header names
    const mppPayment = req.headers["stripe-payment-token"] as string;
    const mppReceipt = req.headers["stripe-payment-receipt"] as string;

    if (mppPayment && !req.headers["x-payment-proof"]) {
      // Translate MPP headers to x402 format
      (req as any).mppPaymentToken = mppPayment;
      (req as any).mppReceipt = mppReceipt;
      req.headers["x-payment-proof"] = mppPayment;
    }

    next();
  };
}

/**
 * Helper: build x402 v2 PAYMENT-RESPONSE header after successful invocation.
 */
export function buildPaymentResponseHeader(
  txSignature: string,
  settled: boolean,
): string {
  return Buffer.from(
    JSON.stringify({
      x402Version: 2,
      txSignature,
      network: SOLANA_NETWORK_ID,
      settled,
    }),
  ).toString("base64");
}

export default {
  x402PaymentGate,
  mppCompatibility,
  send402,
  extractPaymentProof,
  buildPaymentResponseHeader,
};
