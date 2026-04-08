/**
 * x402 Payment Protocol Middleware for Aegis Protocol.
 * Implements the HTTP 402 payment-required handshake for paid invocations.
 */

import { Request, Response, NextFunction } from "express";
import { OperatorModel } from "../db.js";
import { ENV } from "../_core/env.js";
import { getDecodedOperator, getDecodedProtocolConfig, getSolanaNetworkId, getUsdcMintForCluster } from "../solana.js";

export interface X402PaymentInfo {
  required: boolean;
  amount: string;
  currency: string;
  chain: string;
  recipient: string;
  network: string;
  assetMint?: string;
  description: string;
  operatorSlug: string;
  settlement?: {
    method: "legacy_transfer" | "aegis_program";
    programId?: string;
    configPda?: string;
    operatorPda?: string;
    operatorId?: number;
    creatorWallet?: string;
  };
}

export function extractPaymentProof(req: Request): {
  txSignature?: string;
  payerWallet?: string;
  receiptPda?: string;
  settlementMethod?: string;
} {
  const paymentSigHeader = req.headers["payment-signature"] as string | undefined;
  if (paymentSigHeader) {
    try {
      const decoded = JSON.parse(Buffer.from(paymentSigHeader, "base64").toString("utf-8"));
      if (decoded.txSignature) {
        return {
          txSignature: decoded.txSignature,
          payerWallet: decoded.sender || (req.headers["x-payer-wallet"] as string),
          receiptPda: decoded.receiptPda || (req.headers["x-invocation-receipt"] as string),
          settlementMethod: decoded.settlementMethod || (req.headers["x-settlement-method"] as string),
        };
      }
    } catch {
      return {
        txSignature: paymentSigHeader,
        payerWallet: (req.headers["x-payer-wallet"] as string) || req.body?.callerWallet,
        receiptPda: (req.headers["x-invocation-receipt"] as string) || req.body?.receiptPda,
        settlementMethod: (req.headers["x-settlement-method"] as string) || req.body?.settlementMethod,
      };
    }
  }

  return {
    txSignature:
      (req.headers["x-payment-proof"] as string) ||
      (req.headers["x-payment"] as string) ||
      req.body?.txSignature,
    payerWallet: (req.headers["x-payer-wallet"] as string) || req.body?.callerWallet,
    receiptPda: (req.headers["x-invocation-receipt"] as string) || req.body?.receiptPda,
    settlementMethod: (req.headers["x-settlement-method"] as string) || req.body?.settlementMethod,
  };
}

export function send402(res: Response, info: X402PaymentInfo): void {
  const amountAtomic = String(Math.round(parseFloat(info.amount) * 1e6));
  const usdcMint = info.assetMint || getUsdcMintForCluster();
  const networkId = getSolanaNetworkId();

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
        network: networkId,
        amount: amountAtomic,
        asset: usdcMint,
        payTo: info.recipient,
        maxTimeoutSeconds: 60,
      },
    ],
  };

  const paymentRequiredHeader = Buffer.from(JSON.stringify(x402Body)).toString("base64");

  res.status(402);
  res.set({
    "X-Payment-Required": "true",
    "X-Payment-Amount": amountAtomic,
    "X-Payment-Currency": info.currency,
    "X-Payment-Chain": info.chain,
    "X-Payment-Recipient": info.recipient,
    "X-Payment-Network": info.network,
    "X-Payment-Description": info.description,
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
      asset: usdcMint,
      settlement: info.settlement,
    },
    instructions: {
      step1: info.settlement?.method === "aegis_program"
        ? "Sign an Aegis invoke_skill transaction on Solana to settle the fee split on-chain"
        : "Sign a Solana USDC transfer transaction to the recipient address",
      step2: "Retry this request with X-Payment-Proof header containing the transaction signature",
      step3: "Include X-Payer-Wallet header with your wallet address",
      step4: info.settlement?.method === "aegis_program"
        ? "Include X-Invocation-Receipt with the receipt PDA created by the Aegis program"
        : undefined,
    },
    protocols: {
      x402: "https://x402.org",
      mpp: "https://docs.stripe.com/payments/machine/mpp",
    },
  });
}

export function x402PaymentGate() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const idOrSlug = req.params.idOrSlug;
    if (!idOrSlug) return next();

    try {
      const filter: any = /^\d+$/.test(idOrSlug)
        ? { id: Number(idOrSlug) }
        : { slug: idOrSlug };
      const operator = (await OperatorModel.findOne(filter).lean()) as any;

      if (!operator) {
        res.status(404).json({ error: "Operator not found" });
        return;
      }

      let price = operator.pricePerCall?.$numberDecimal
        ? parseFloat(operator.pricePerCall.$numberDecimal)
        : parseFloat(operator.pricePerCall || "0");

      const hasPrivateSkill = typeof operator.skill === "string" && operator.skill.trim().length > 0;

      if (price <= 0) {
        (req as any).operator = operator;
        (req as any).paymentVerified = true;
        (req as any).paymentAmount = 0;
        return next();
      }

      if (!hasPrivateSkill) {
        (req as any).operator = operator;
        (req as any).paymentVerified = false;
        (req as any).paymentAmount = 0;
        return next();
      }

      const { txSignature, payerWallet } = extractPaymentProof(req);
      if (txSignature) {
        (req as any).operator = operator;
        (req as any).paymentProof = txSignature;
        (req as any).payerWallet = payerWallet;
        (req as any).paymentAmount = price;
        return next();
      }

      let assetMint: string | undefined;
      if (operator.onChainProgramId && operator.onChainConfigPda && operator.onChainOperatorPda) {
        try {
          const [config, onChainOperator] = await Promise.all([
            getDecodedProtocolConfig(operator.onChainConfigPda),
            getDecodedOperator(operator.onChainOperatorPda),
          ]);
          assetMint = config.usdcMint;
          price = Number(onChainOperator.priceUsdcBase) / 1_000_000;
        } catch {
          assetMint = undefined;
        }
      }

      send402(res, {
        required: true,
        amount: price.toFixed(6),
        currency: "USDC",
        chain: "solana",
        recipient: ENV.treasuryWallet || operator.creatorWallet || "",
        network: ENV.solanaCluster,
        assetMint,
        description: `Unlock ${operator.name} (${operator.slug})`,
        operatorSlug: operator.slug,
        settlement:
          operator.onChainProgramId && operator.onChainConfigPda && operator.onChainOperatorPda
            ? {
                method: "aegis_program",
                programId: operator.onChainProgramId,
                configPda: operator.onChainConfigPda,
                operatorPda: operator.onChainOperatorPda,
                operatorId: operator.onChainOperatorId ?? undefined,
                creatorWallet: operator.creatorWallet || undefined,
              }
            : {
                method: "legacy_transfer",
              },
      });
    } catch (err: any) {
      next(err);
    }
  };
}

export function mppCompatibility() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const mppPayment = req.headers["stripe-payment-token"] as string;
    const mppReceipt = req.headers["stripe-payment-receipt"] as string;

    if (mppPayment && !req.headers["x-payment-proof"]) {
      (req as any).mppPaymentToken = mppPayment;
      (req as any).mppReceipt = mppReceipt;
      req.headers["x-payment-proof"] = mppPayment;
    }

    next();
  };
}

export function buildPaymentResponseHeader(txSignature: string, settled: boolean): string {
  return Buffer.from(
    JSON.stringify({
      x402Version: 2,
      txSignature,
      network: getSolanaNetworkId(),
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