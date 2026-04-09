import { ENV } from "./_core/env";
import { getDecodedOperator, getDecodedProtocolConfig, getSolanaNetworkId, getUsdcMintForCluster } from "./solana";
import { buildPreparedOperatorPayment, type PreparedOperatorPayment } from "./payment-transaction";

export type CheckoutMode = "mcp" | "rest";

export interface OperatorPaymentContext {
  amount: number;
  amountAtomic: string;
  assetMint: string;
  hasAegisSettlement: boolean;
  preparedTransaction: PreparedOperatorPayment | null;
}

export function sanitizeInvokePayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }

  const nextPayload = { ...(payload as Record<string, unknown>) };
  delete nextPayload.callerWallet;
  delete nextPayload.txSignature;
  delete nextPayload.receiptPda;
  delete nextPayload.settlementMethod;
  return nextPayload;
}

function getCheckoutBaseUrl() {
  return ENV.frontendUrls[0] || "http://127.0.0.1:5173";
}

export function buildCheckoutUrl(params: {
  mode: CheckoutMode;
  operatorId?: string;
  operatorSlug?: string;
}) {
  const pathname = params.mode === "mcp" ? "/mcp/checkout" : "/checkout";
  const url = new URL(pathname, getCheckoutBaseUrl());

  if (params.operatorId) {
    url.searchParams.set("operatorId", params.operatorId);
  }
  if (params.operatorSlug) {
    url.searchParams.set("operatorSlug", params.operatorSlug);
  }

  return url.toString();
}

export function buildMcpRetryCommand(
  operatorId: string,
  callerWallet: string,
  txSignature = "<confirmed-solana-transaction-signature>",
) {
  const retryWallet = callerWallet && callerWallet !== "mcp-agent" ? callerWallet : "<connected-wallet-address>";
  return `'mcp_aegis_aegis_invoke_operator' {"operatorId":"${operatorId}","callerWallet":"${retryWallet}","txSignature":"${txSignature}"}`;
}

export function buildRestRetryTemplate(params: {
  operatorSlug: string;
  callerWallet?: string;
  txSignature?: string;
  payload?: unknown;
}) {
  const invokeUrl = new URL(`/api/v1/operators/${params.operatorSlug}/invoke`, getCheckoutBaseUrl()).toString();
  const wallet = params.callerWallet || "<connected-wallet-address>";
  const txSignature = params.txSignature || "<confirmed-solana-transaction-signature>";
  const body = sanitizeInvokePayload(params.payload) ?? {};

  return {
    method: "POST" as const,
    url: invokeUrl,
    headers: {
      "Content-Type": "application/json",
      "X-Payment-Proof": txSignature,
      "X-Payer-Wallet": wallet,
    },
    body,
    curlCommand: `curl -X POST ${invokeUrl} \
  -H "Content-Type: application/json" \
  -H "X-Payment-Proof: ${txSignature}" \
  -H "X-Payer-Wallet: ${wallet}" \
  -d '${JSON.stringify(body)}'`,
  };
}

export async function buildOperatorPaymentContext(params: {
  operator: any;
  callerWallet?: string;
}): Promise<OperatorPaymentContext> {
  let amount = parseFloat(params.operator.pricePerCall || "0");
  let assetMint = getUsdcMintForCluster();
  const hasAegisSettlement = Boolean(
    params.operator.onChainProgramId && params.operator.onChainConfigPda && params.operator.onChainOperatorPda,
  );

  if (hasAegisSettlement) {
    try {
      const [config, onChainOperator] = await Promise.all([
        getDecodedProtocolConfig(params.operator.onChainConfigPda),
        getDecodedOperator(params.operator.onChainOperatorPda),
      ]);
      assetMint = config.usdcMint || assetMint;
      amount = Number(onChainOperator.priceUsdcBase) / 1_000_000;
    } catch {
      // Fall back to stored marketplace metadata if on-chain reads fail.
    }
  }

  let preparedTransaction: PreparedOperatorPayment | null = null;
  if (hasAegisSettlement && params.callerWallet) {
    try {
      preparedTransaction = await buildPreparedOperatorPayment({
        callerWallet: params.callerWallet,
        programId: params.operator.onChainProgramId,
        configPda: params.operator.onChainConfigPda,
        operatorPda: params.operator.onChainOperatorPda,
      });
    } catch {
      preparedTransaction = null;
    }
  }

  return {
    amount,
    amountAtomic: String(Math.round(amount * 1_000_000)),
    assetMint,
    hasAegisSettlement,
    preparedTransaction,
  };
}

export { getCheckoutBaseUrl, getSolanaNetworkId };