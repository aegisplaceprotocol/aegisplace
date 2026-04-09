import { apiUrl } from "@/lib/api";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { useWalletModal } from "@/components/WalletModal";
import { toast } from "sonner";

type CheckoutMode = "mcp" | "rest";

type PreparedTransaction = {
  transactionBase64: string;
  recentBlockhash: string;
  lastValidBlockHeight: number;
};

type PaymentPlan = {
  error: string;
  operatorId: string;
  operatorSlug: string;
  operatorName: string;
  callerWallet: string;
  checkoutUrl?: string;
  retryCommand?: string;
  retry?: {
    method: string;
    url: string;
    body: unknown;
    headers?: Record<string, string>;
    curlCommand?: string;
  };
  payment: {
    amount: string;
    currency: string;
    recipient: string | null;
    preparedTransaction: PreparedTransaction | null;
    checkoutUrl?: string | null;
  };
};

type MpcToolResponse = {
  result?: {
    content?: Array<{
      type?: string;
      text?: string;
    }>;
    isError?: boolean;
  };
  error?: {
    message?: string;
  };
};

function readSearchParams() {
  const params = new URLSearchParams(window.location.search);
  const isMcpRoute = window.location.pathname.startsWith("/mcp/");

  return {
    mode: (params.get("mode") as CheckoutMode | null) || (isMcpRoute ? "mcp" : "rest"),
    operatorId: params.get("operatorId") || "",
    operatorSlug: params.get("operatorSlug") || "",
  };
}

function normalizePayload(payload: unknown) {
  if (typeof payload === "object" && payload !== null) {
    return payload as Record<string, unknown>;
  }

  return {};
}

function buildRetryCommand(
  operatorId: string,
  callerWallet: string,
  txSignature: string,
) {
  return `#aegis_invoke_operator {"operatorId":"${operatorId}","x-payer-wallet":"${callerWallet}","x-payment-proof":"${txSignature}"}`;
}

function buildCurlCommand(params: {
  operatorSlug: string;
  callerWallet: string;
  txSignature: string;
  payload: unknown;
}) {
  const requestUrl = new URL(
    apiUrl(`/api/v1/operators/${params.operatorSlug}/invoke`),
    window.location.origin,
  ).toString();
  const body = JSON.stringify(normalizePayload(params.payload));

  return `curl -X POST ${requestUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-Payment-Proof: ${params.txSignature}" \\
  -H "X-Payer-Wallet: ${params.callerWallet}" \\
  -d '${body}'`;
}

function shortWallet(value: string) {
  if (!value || value.length < 10) return value || "Not connected";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function CopyIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="5"
        width="8"
        height="8"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M3 10V3h7"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

async function fetchMcpPaymentPlan(
  operatorId: string,
  callerWallet: string,
): Promise<PaymentPlan> {
  const response = await fetch(apiUrl(`/api/v1/operators/${operatorId}/checkout-plan`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      callerWallet,
    }),
  });

  const parsed = (await response.json()) as Partial<PaymentPlan> & {
    message?: string;
    payment?: PaymentPlan["payment"];
  };

  if (!response.ok || !parsed.payment) {
    throw new Error(
      parsed.message || "The MCP checkout endpoint did not return a payment plan.",
    );
  }

  return {
    error: "PAYMENT_REQUIRED",
    operatorId: parsed.operatorId || operatorId,
    operatorSlug: parsed.operatorSlug || "",
    operatorName: parsed.operatorName || parsed.operatorSlug || "",
    callerWallet: parsed.callerWallet || callerWallet,
    checkoutUrl: parsed.checkoutUrl || parsed.payment.checkoutUrl || undefined,
    retryCommand: parsed.retryCommand,
    retry: parsed.retry,
    payment: {
      amount: parsed.payment.amount || "0",
      currency: parsed.payment.currency || "USDC",
      recipient: parsed.payment.recipient || null,
      preparedTransaction: parsed.payment.preparedTransaction || null,
      checkoutUrl: parsed.payment.checkoutUrl || null,
    },
  };
}

async function fetchRestPaymentPlan(
  operatorSlug: string,
  callerWallet: string,
  payload: unknown,
): Promise<PaymentPlan> {
  const response = await fetch(apiUrl(`/api/v1/operators/${operatorSlug}/checkout-plan`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...normalizePayload(payload),
      callerWallet,
    }),
  });

  const body = (await response.json()) as Partial<PaymentPlan> & {
    message?: string;
    payment?: PaymentPlan["payment"];
  };

  if (!response.ok || !body.payment) {
    throw new Error(body.message || "The REST checkout endpoint did not return a payment plan.");
  }

  return {
    error: "PAYMENT_REQUIRED",
    operatorId: body.operatorId || "",
    operatorSlug: body.operatorSlug || operatorSlug,
    operatorName: body.operatorName || operatorSlug,
    callerWallet: body.callerWallet || callerWallet,
    checkoutUrl: body.checkoutUrl || body.payment.checkoutUrl || undefined,
    retryCommand: body.retryCommand,
    retry: body.retry,
    payment: {
      amount: body.payment.amount || "0",
      currency: body.payment.currency || "USDC",
      recipient: body.payment.recipient || null,
      preparedTransaction: body.payment.preparedTransaction || null,
      checkoutUrl: body.payment.checkoutUrl || null,
    },
  };
}

async function fetchPaymentPlan(params: {
  mode: CheckoutMode;
  operatorId: string;
  operatorSlug: string;
  callerWallet: string;
  payload: unknown;
}): Promise<PaymentPlan> {
  if (params.mode === "rest") {
    return fetchRestPaymentPlan(params.operatorSlug, params.callerWallet, params.payload);
  }

  return fetchMcpPaymentPlan(params.operatorId, params.callerWallet);
}

export default function McpCheckout() {
  const { mode, operatorId, operatorSlug } = readSearchParams();
  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const activeWallet = publicKey?.toBase58() || "";
  const connectedWallet = publicKey?.toBase58() || "";
  const currentStep = txSignature
    ? 4
    : submitting
      ? 3
      : paymentPlan
        ? connected
          ? 3
          : 2
        : 1;
  const shellStyle = {
    background: "#0d0d0f",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "6px",
    boxShadow: "0 0 60px rgba(0,0,0,0.8), 0 0 24px rgba(16,185,129,0.05)",
    height: "min(720px, calc(100vh - 2rem))",
  } as const;
  const cardStyle = {
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "5px",
    background: "rgba(255,255,255,0.03)",
  } as const;
  const inputShell = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "5px",
  } as const;
  const operatorLabel = paymentPlan?.operatorName || (mode === "mcp" ? "Loading" : operatorSlug || "Loading");
  const contextLabel = mode === "mcp" ? operatorId || "Missing operatorId" : paymentPlan?.operatorSlug || operatorSlug || "Missing operator slug";
  const retryCommand = txSignature && activeWallet
    ? mode === "mcp"
      ? buildRetryCommand(operatorId, activeWallet, txSignature)
      : buildCurlCommand({
          operatorSlug: paymentPlan?.operatorSlug || operatorSlug,
          callerWallet: activeWallet,
          txSignature,
          payload: paymentPlan?.retry?.body ?? {},
        })
    : null;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (mode === "mcp" && !operatorId) return;
      if (mode === "rest" && !operatorSlug) return;
      if (!activeWallet) return;

      setLoadingPlan(true);
      setPlanError(null);
      try {
        const nextPlan = await fetchPaymentPlan({
          mode,
          operatorId,
          operatorSlug,
          callerWallet: activeWallet,
          payload: {},
        });
        if (!cancelled) setPaymentPlan(nextPlan);
      } catch (error) {
        if (!cancelled) {
          setPlanError(
            error instanceof Error
              ? error.message
              : "Failed to load payment plan.",
          );
        }
      } finally {
        if (!cancelled) setLoadingPlan(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [activeWallet, mode, operatorId, operatorSlug]);

  async function handleConnectWallet() {
    setVisible(true);
  }

  async function handleSignAndSend() {
    if (!paymentPlan?.payment.preparedTransaction) {
      toast.error(
        "Missing prepared transaction. Refresh the page to request a new payment plan.",
      );
      return;
    }
    if (!connected || !publicKey || !sendTransaction) {
      setVisible(true);
      return;
    }

    setSubmitting(true);
    try {
      const rawBytes = Buffer.from(
        paymentPlan.payment.preparedTransaction.transactionBase64,
        "base64",
      );
      const transaction = Transaction.from(rawBytes);
      const signature = await sendTransaction(transaction, connection, {
        preflightCommitment: "confirmed",
        skipPreflight: false,
      });

      await connection.confirmTransaction(
        {
          signature,
          blockhash: paymentPlan.payment.preparedTransaction.recentBlockhash,
          lastValidBlockHeight:
            paymentPlan.payment.preparedTransaction.lastValidBlockHeight,
        },
        "confirmed",
      );

      setTxSignature(signature);
      toast.success(
        mode === "mcp"
          ? "Transaction confirmed. Copy the retry MCP command below."
          : "Transaction confirmed. Copy the retry curl command below.",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to sign and send transaction.";
      toast.error(
        message.includes("blockhash")
          ? "Transaction expired. Refresh the page and try again."
          : message,
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyRetryCommand() {
    if (!retryCommand) return;
    await navigator.clipboard.writeText(retryCommand);
    toast.success(mode === "mcp" ? "Retry MCP command copied." : "Retry curl command copied.");
  }

  return (
    <main
      className="flex min-h-screen items-start justify-center overflow-y-auto p-4 sm:items-center"
      style={{
        background:
          "radial-gradient(circle at top, rgba(16,185,129,0.08), transparent 32%), #050506",
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
      <div className="relative z-10 my-4 w-full max-w-2xl">
        <div
          className="flex w-full flex-col overflow-hidden"
          style={shellStyle}
          data-lenis-prevent
        >
          <div className="border-b border-white/6 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                  {mode === "mcp" ? "MCP Checkout" : "REST Checkout"}
                </div>
                <h1 className="mt-1 text-lg font-medium tracking-[-0.025em] text-white/95">
                  {mode === "mcp"
                    ? "Unlock paid skill with wallet signature"
                    : "Unlock paid invoke with wallet signature"}
                </h1>
              </div>
              <div className="rounded-[5px] border border-white/8 bg-white/4 px-5 py-2 text-right">
                <div className="text-[8px] font-bold uppercase tracking-wider text-white/30">
                  Operator
                </div>
                <div className="mt-1 text-sm text-white/80">
                  {operatorLabel}
                </div>
                <div className="text-[11px] text-white/45">
                  {paymentPlan?.payment.amount || "--"}{" "}
                  {paymentPlan?.payment.currency || "USDC"}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center gap-1">
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold transition-all"
                    style={{
                      background:
                        step <= currentStep
                          ? "#10B981"
                          : "rgba(255,255,255,0.06)",
                      color:
                        step <= currentStep ? "#000" : "rgba(255,255,255,0.30)",
                      boxShadow:
                        step === currentStep
                          ? "0 0 10px rgba(16,185,129,0.35)"
                          : "none",
                    }}
                  >
                    {step}
                  </div>
                  {step < 4 ? (
                    <div
                      className="h-px w-6 transition-all"
                      style={{
                        background:
                          step < currentStep
                            ? "#10B981"
                            : "rgba(255,255,255,0.08)",
                      }}
                    />
                  ) : null}
                </div>
              ))}
              <span className="ml-1 text-[10px] text-white/35">
                Step {currentStep} of 4
              </span>
            </div>
          </div>

          <div className="h-0.5 bg-white/4">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${(currentStep / 4) * 100}%`,
                background: "#10B981",
                boxShadow: "0 0 8px rgba(16,185,129,0.5)",
              }}
            />
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto p-4"
            data-lenis-prevent
          >
            <div className="space-y-4">
              <div className="mb-3 text-[9px] font-bold uppercase tracking-widest text-white/40">
                Checkout Context
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="p-4" style={cardStyle}>
                  <div className="mb-1 text-[8px] font-bold uppercase tracking-wider text-white/30">
                    {mode === "mcp" ? "Operator ID" : "Operator Slug"}
                  </div>
                  <div className="break-all font-mono text-xs text-white/65">
                    {contextLabel}
                  </div>
                </div>
                <div className="p-4" style={cardStyle}>
                  <div className="mb-1 text-[8px] font-bold uppercase tracking-wider text-white/30">
                    Checkout Mode
                  </div>
                  <div className="text-sm text-white/80">
                    {mode === "mcp" ? "Wallet selected in browser" : "REST invoke checkout"}
                  </div>
                  <div className="mt-1 text-[11px] text-white/45">
                    {mode === "mcp"
                      ? "The connected wallet will be used for payment and for the retry MCP command."
                      : "The connected wallet will pay for the invoke and the confirmed signature will be inserted into the retry curl command."}
                  </div>
                </div>
              </div>

              <div className="p-4" style={cardStyle}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <div className="mb-1 text-[8px] font-bold uppercase tracking-wider text-white/30">
                      Wallet
                    </div>
                    <div className="text-sm text-white/80">
                      {connectedWallet
                        ? shortWallet(connectedWallet)
                        : "No wallet connected"}
                    </div>
                    <div className="mt-1 break-all font-mono text-[11px] text-white/45">
                      {connectedWallet ||
                        "Connect Phantom or another Solana wallet to continue."}
                    </div>
                  </div>
                  <ConnectWalletButton />
                </div>
                <p className="text-[11px] text-white/45">
                  {mode === "mcp"
                    ? "Connect the wallet that should pay for the operator unlock. That same wallet will be written into the retry MCP command after confirmation."
                    : "Connect the wallet that should pay for the operator unlock. That same wallet will be written into the retry curl command after confirmation."}
                </p>
              </div>

              <div>
                <div className="mb-3 text-[9px] font-bold uppercase tracking-widest text-white/40">
                  Payment Plan
                </div>
                <div className="space-y-3">
                  <div className="p-4" style={cardStyle}>
                    <div className="mb-1 text-[8px] font-bold uppercase tracking-wider text-white/30">
                      Status
                    </div>
                    <div className="text-sm text-white/80">
                      {loadingPlan
                        ? mode === "mcp"
                          ? "Requesting a fresh payment plan from MCP..."
                          : "Requesting a fresh payment plan from the REST invoke route..."
                        : paymentPlan
                          ? `${paymentPlan.payment.amount} ${paymentPlan.payment.currency} ready for wallet approval`
                          : "Connect a wallet to load the payment plan."}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="p-4" style={cardStyle}>
                      <div className="mb-1 text-[8px] font-bold uppercase tracking-wider text-white/30">
                        Program
                      </div>
                      <div className="break-all font-mono text-[11px] text-white/55">
                        {paymentPlan?.payment.recipient || "Unknown"}
                      </div>
                    </div>
                    <div className="p-4" style={cardStyle}>
                      <div className="mb-1 text-[8px] font-bold uppercase tracking-wider text-white/30">
                        Prepared Transaction
                      </div>
                      <div className="text-sm text-white/80">
                        {paymentPlan?.payment.preparedTransaction
                          ? "Ready to sign"
                          : "Not available yet"}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[5px] border border-[#10B981]/15 bg-[#10B981]/4 p-4">
                    <div className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#10B981]">
                      How This Works
                    </div>
                    <div className="space-y-2">
                      {[
                        mode === "mcp"
                          ? "The page asks the MCP server for a fresh prepared invoke transaction for this operator and wallet."
                          : "The page asks the REST invoke route for a fresh x402 payment plan and prepared transaction for this operator and wallet.",
                        "Your wallet signs and submits that prepared Aegis program transaction on Solana.",
                        mode === "mcp"
                          ? "Once the transaction confirms, the page prints the exact MCP retry command with real x-payer-wallet and x-payment-proof values."
                          : "Once the transaction confirms, the page prints the exact curl retry command with the real payment headers.",
                        mode === "mcp"
                          ? "Paste that command back into VS Code chat to receive the unlocked skill result."
                          : "Run that curl command to retry the invoke route with the confirmed payment proof.",
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-2">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 16 16"
                            fill="none"
                            className="mt-0.5 shrink-0"
                            style={{ color: "#10B981" }}
                          >
                            <path
                              d="M3 8l4 4 6-6"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                          </svg>
                          <span className="text-[11px] text-white/55">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {paymentPlan?.checkoutUrl ? (
                    <div className="p-4" style={cardStyle}>
                      <div className="mb-1 text-[8px] font-bold uppercase tracking-wider text-white/30">
                        Checkout Link
                      </div>
                      <a
                        href={paymentPlan.checkoutUrl}
                        className="break-all text-xs text-[#10B981] hover:text-emerald-300"
                      >
                        {paymentPlan.checkoutUrl}
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>

              {planError ? (
                <div className="rounded-[5px] border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200/90">
                  {planError}
                </div>
              ) : null}

              {retryCommand ? (
                <>
                  <div className="mb-3 text-[9px] font-bold uppercase tracking-widest text-white/40">
                    {mode === "mcp" ? "Retry Command" : "Retry Curl"}
                  </div>
                  <div className="rounded-[5px] border border-[#10B981]/15 bg-[#10B981]/4 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-[#10B981]">
                          Transaction Confirmed
                        </div>
                        <p className="mb-3 text-xs leading-relaxed text-white/55">
                          {mode === "mcp"
                            ? "Your payment transaction is confirmed. Copy this exact MCP command back into your IDE's chat to fetch the unlocked operator result."
                            : "Your payment transaction is confirmed. Copy this exact curl command to retry the REST invoke route with the real payment proof values."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyRetryCommand}
                        className="inline-flex shrink-0 items-center gap-2 rounded-[5px] border border-white/10 bg-white/6 px-3 py-2 text-[11px] font-medium text-white/65 transition-colors hover:text-white/90"
                        aria-label={mode === "mcp" ? "Copy retry MCP command" : "Copy retry curl command"}
                      >
                        <CopyIcon />
                        Copy
                      </button>
                    </div>

                    <div
                      className="p-4 font-mono text-[11px] leading-relaxed text-white/75"
                      style={{
                        ...inputShell,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {retryCommand}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="border-t border-white/6 p-4">
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 text-sm font-medium text-white/50 transition-all hover:text-white/75"
                style={{
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: "5px",
                }}
              >
                Refresh Plan
              </button>
              {!connected ? (
                <button
                  type="button"
                  onClick={handleConnectWallet}
                  className="flex-1 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    background: "#10B981",
                    color: "#000",
                    borderRadius: "5px",
                    boxShadow: "0 0 16px rgba(16,185,129,0.25)",
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = "#059669";
                    event.currentTarget.style.boxShadow =
                      "0 0 24px rgba(16,185,129,0.40)";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = "#10B981";
                    event.currentTarget.style.boxShadow =
                      "0 0 16px rgba(16,185,129,0.25)";
                  }}
                >
                  Connect Wallet To Continue
                </button>
              ) : retryCommand ? (
                <button
                  type="button"
                  onClick={() => {
                    void handleCopyRetryCommand();
                  }}
                  className="flex-1 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    background: "#10B981",
                    color: "#000",
                    borderRadius: "5px",
                    boxShadow: "0 0 16px rgba(16,185,129,0.25)",
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = "#059669";
                    event.currentTarget.style.boxShadow =
                      "0 0 24px rgba(16,185,129,0.40)";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = "#10B981";
                    event.currentTarget.style.boxShadow =
                      "0 0 16px rgba(16,185,129,0.25)";
                  }}
                >
                  {mode === "mcp" ? "Copy Retry Command" : "Copy Curl Command"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={
                    loadingPlan ||
                    submitting ||
                    !paymentPlan?.payment.preparedTransaction
                  }
                  onClick={handleSignAndSend}
                  className="flex-1 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    background:
                      loadingPlan ||
                      submitting ||
                      !paymentPlan?.payment.preparedTransaction
                        ? "rgba(255,255,255,0.08)"
                        : "#10B981",
                    color:
                      loadingPlan ||
                      submitting ||
                      !paymentPlan?.payment.preparedTransaction
                        ? "rgba(255,255,255,0.35)"
                        : "#000",
                    borderRadius: "5px",
                    boxShadow:
                      loadingPlan ||
                      submitting ||
                      !paymentPlan?.payment.preparedTransaction
                        ? "none"
                        : "0 0 16px rgba(16,185,129,0.25)",
                  }}
                  onMouseEnter={(event) => {
                    if (
                      loadingPlan ||
                      submitting ||
                      !paymentPlan?.payment.preparedTransaction
                    ) {
                      return;
                    }
                    event.currentTarget.style.background = "#059669";
                    event.currentTarget.style.boxShadow =
                      "0 0 24px rgba(16,185,129,0.40)";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background =
                      loadingPlan ||
                      submitting ||
                      !paymentPlan?.payment.preparedTransaction
                        ? "rgba(255,255,255,0.08)"
                        : "#10B981";
                    event.currentTarget.style.boxShadow =
                      loadingPlan ||
                      submitting ||
                      !paymentPlan?.payment.preparedTransaction
                        ? "none"
                        : "0 0 16px rgba(16,185,129,0.25)";
                  }}
                >
                  {submitting
                    ? "Waiting For Confirmation..."
                    : paymentPlan?.payment.preparedTransaction
                      ? "Sign And Send Transaction"
                      : "Waiting For Payment Plan"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
