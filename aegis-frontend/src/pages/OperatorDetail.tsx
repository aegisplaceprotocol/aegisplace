import { useState } from "react";
import { useParams, Link } from "wouter";
import Navbar from "@/components/Navbar";
import { NvidiaEyeLogo } from "@/components/NvidiaLogo";
import { trpc, type RouterOutputs } from "@/lib/trpc";

type InvocationRecord = RouterOutputs["invoke"]["byOperator"][number];
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";

/* ── Helpers ──────────────────────────────────────────────────────────── */

function trustTier(score: number): string {
  if (score >= 90) return "Diamond";
  if (score >= 75) return "Gold";
  if (score >= 50) return "Silver";
  return "Bronze";
}

function tierColor(tier: string) {
  switch (tier) {
    case "Diamond": return "text-zinc-200";
    case "Gold": return "text-amber-400";
    case "Silver": return "text-zinc-400";
    default: return "text-orange-400";
  }
}

function repColor(score: number) {
  if (score >= 80) return "rgb(161,161,170)";
  if (score >= 60) return "rgb(113,113,122)";
  if (score >= 40) return "rgb(234,179,8)";
  return "rgba(220,100,60,0.50)";
}

/* ── Tab Navigation ──────────────────────────────────────────────────── */
type Tab = "overview" | "invocations" | "invoke";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "invocations", label: "Invocation History" },
  { id: "invoke", label: "Invoke" },
];

/* ── Main Component ──────────────────────────────────────────────────── */

export default function OperatorDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  const [tab, setTab] = useState<Tab>("overview");
  const { publicKey } = useWallet();

  // Fetch operator from database
  const { data: operator, isLoading, error } = trpc.operator.bySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  // Fetch invocation history
  const { data: invocations } = trpc.invoke.byOperator.useQuery(
    { operatorId: operator?.id || 0, limit: 20 },
    { enabled: !!operator?.id }
  );

  // Invoke mutation
  const invokeMutation = trpc.invoke.execute.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Invocation successful! Success score: ${result.validation.newTrustScore}`, {
          description: `Response in ${result.responseMs}ms. Fee: $${result.fees.total.toFixed(4)} USDC`,
        });
      } else {
        toast.error("Invocation failed", {
          description: `Status: ${result.statusCode}. Flags: ${result.validation.flags.join(", ")}`,
        });
      }
    },
    onError: (err) => {
      toast.error("Invocation error", { description: err.message });
    },
  });

  const handleInvoke = () => {
    if (!operator) return;
    invokeMutation.mutate({
      operatorId: operator.id,
      callerWallet: publicKey?.toBase58() || undefined,
      payload: { test: true, timestamp: new Date().toISOString() },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white/[0.02]">
        <Navbar />
        <div className="pt-24">
          <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-24 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-zinc-800/40 rounded w-64 mx-auto" />
              <div className="h-4 bg-zinc-800/40 rounded w-96 mx-auto" />
              <div className="h-4 bg-zinc-800/40 rounded w-80 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !operator) {
    return (
      <div className="min-h-screen bg-white/[0.02]">
        <Navbar />
        <div className="pt-24">
          <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-24 text-center">
            <h1 className="text-3xl font-normal text-white mb-4">Operator Not Found</h1>
            <p className="text-zinc-500 mb-8">The operator "{slug}" does not exist in the registry.</p>
            <Link href="/marketplace" className="text-sm font-normal bg-white text-zinc-900 px-6 py-3 hover:bg-zinc-200 transition-colors rounded">
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tier = trustTier(operator.trustScore);
  const successRate = operator.totalInvocations > 0
    ? ((operator.successfulInvocations / operator.totalInvocations) * 100).toFixed(1)
    : "100.0";
  const price = parseFloat(operator.pricePerCall);
  const priceDisplay = price < 0.01 ? price.toFixed(4) : price < 1 ? price.toFixed(3) : price.toFixed(2);
  const creatorShare = (price * 0.60).toFixed(4);
  const validatorShare = (price * 0.15).toFixed(4);
  const stakerShare = (price * 0.12).toFixed(4);
  const treasuryShare = (price * 0.08).toFixed(4);
  const insuranceShare = (price * 0.03).toFixed(4);
  const burnAmount = (price * 0.02).toFixed(4);

  return (
    <div className="min-h-screen bg-white/[0.02]">
      <Navbar />

      <div className="pt-24">
        {/* Breadcrumb */}
        <div className="border-b border-white/[0.06]/30">
          <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500">
              <Link href="/marketplace" className="hover:text-zinc-300 transition-colors">Marketplace</Link>
              <span className="text-zinc-700">/</span>
              <span className="text-zinc-400">{operator.slug}</span>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="border-b border-white/[0.06]/30">
          <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-12 md:py-16">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-[10px] font-medium px-3 py-1 rounded border ${
                    operator.isVerified
                      ? "bg-zinc-800/40 text-zinc-300 border-white/[0.06]/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-400/20"
                  }`}>
                    {operator.isVerified ? "Verified" : "Pending Verification"}
                  </span>
                  <span className={`text-[11px] font-medium ${tierColor(tier)}`}>{tier}</span>
                  <span className="text-[11px] font-medium text-zinc-600">{operator.category}</span>
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight text-white mb-3">
                  {operator.name}
                </h1>

                <p className="text-base md:text-lg text-zinc-500 leading-relaxed mb-6">
                  {operator.tagline || operator.description?.slice(0, 200)}
                </p>

                {/* Creator wallet */}
                <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-600">
                  <span>Creator:</span>
                  <span className="text-zinc-400">{operator.creatorWallet.slice(0, 8)}...{operator.creatorWallet.slice(-4)}</span>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3 lg:min-w-[320px]">
                <div className="border border-white/[0.06]/50 bg-white/[0.02]/40 rounded p-4">
                  <div className="text-[11px] font-medium text-zinc-500 mb-1">Success Rate</div>
                  <div className="text-2xl font-normal" style={{ color: repColor(operator.trustScore) }}>{operator.trustScore}</div>
                </div>
                <div className="border border-white/[0.06]/50 bg-white/[0.02]/40 rounded p-4">
                  <div className="text-[11px] font-medium text-zinc-500 mb-1">Invocations</div>
                  <div className="text-2xl font-normal text-zinc-200">{operator.totalInvocations.toLocaleString()}</div>
                </div>
                <div className="border border-white/[0.06]/50 bg-white/[0.02]/40 rounded p-4">
                  <div className="text-[11px] font-medium text-zinc-500 mb-1">Success Rate</div>
                  <div className="text-2xl font-normal text-zinc-200">{successRate}%</div>
                </div>
                <div className="border border-white/[0.06]/40 bg-zinc-800/30 rounded p-4">
                  <div className="text-[11px] font-medium text-zinc-400 mb-1">Price / Call</div>
                  <div className="text-2xl font-normal text-zinc-200">${priceDisplay}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/[0.06]/30">
          <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
            <div className="flex gap-0">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`text-[13px] font-medium px-6 py-4 border-b-2 transition-all ${
                    tab === t.id
                      ? "text-zinc-200 border-zinc-200"
                      : "text-zinc-500 border-transparent hover:text-zinc-300"
                  }`}
                >{t.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-12">
          {/* Overview Tab */}
          {tab === "overview" && (
            <div className="grid lg:grid-cols-[1fr_380px] gap-12">
              <div>
                <h2 className="text-xl font-normal text-white mb-4">Description</h2>
                <p className="text-[14px] text-zinc-500 leading-relaxed mb-8 whitespace-pre-wrap">
                  {operator.description || "No detailed description available."}
                </p>

                {/* Success score bar */}
                <div className="mb-8">
                  <h3 className="text-[12px] font-medium text-zinc-500 mb-3">Success Rate Breakdown</h3>
                  <div className="h-2 bg-zinc-800 w-full rounded overflow-hidden mb-2">
                    <div className="h-full rounded transition-all duration-1000"
                      style={{ width: `${operator.trustScore}%`, background: repColor(operator.trustScore) }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-medium text-zinc-600">
                    <span>0</span>
                    <span>Current: {operator.trustScore}/100</span>
                    <span>100</span>
                  </div>
                </div>

                {/* Tags */}
                {operator.tags && (operator.tags as string[]).length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-[12px] font-medium text-zinc-500 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {(operator.tags as string[]).map((tag) => (
                        <span key={tag} className="text-[11px] font-medium text-zinc-400 bg-zinc-800/40 border border-white/[0.06]/30 px-3 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Fee Distribution */}
                <div className="border border-white/[0.06]/50 bg-white/[0.02]/40 rounded p-6">
                  <h3 className="text-[12px] font-medium text-zinc-400 mb-4">Fee Distribution</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-zinc-500">Price per call</span>
                      <span className="text-zinc-200">${priceDisplay} USDC</span>
                    </div>
                    <div className="h-px bg-zinc-800/50" />
                    <div className="flex justify-between text-[13px]">
                      <span className="text-zinc-400">Creator (60%)</span>
                      <span className="text-zinc-300">${creatorShare}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-zinc-500">Validators (15%)</span>
                      <span className="text-zinc-400">${validatorShare}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-zinc-500">Stakers (12%)</span>
                      <span className="text-zinc-400">${stakerShare}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-zinc-500">Treasury (8%)</span>
                      <span className="text-zinc-400">${treasuryShare}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-zinc-500">Insurance (3%)</span>
                      <span className="text-zinc-400">${insuranceShare}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-zinc-500">Burned (2%)</span>
                      <span className="text-zinc-400">${burnAmount}</span>
                    </div>
                  </div>
                </div>

                {/* NeMo Stack Status */}
                <div className="border border-[rgba(52,211,153,0.08)] bg-[rgba(52,211,153,0.02)] rounded p-6">
                  <h3 className="flex items-center gap-2 text-[12px] font-normal text-[rgba(52,211,153,0.55)] mb-4">
                    <NvidiaEyeLogo size={14} className="text-[rgba(52,211,153,0.55)]" />
                    NeMo Stack
                  </h3>
                  <div className="space-y-2">
                    {[
                      { name: "Guardrails", status: "Active" },
                      { name: "Evaluator", status: "Benchmarked" },
                      { name: "NIM Runtime", status: "Deployed" },
                      { name: "Nemotron Base", status: "Super" },
                    ].map(item => (
                      <div key={item.name} className="flex items-center justify-between text-[12px]">
                        <span className="text-zinc-500">{item.name}</span>
                        <span className="font-normal text-[rgba(52,211,153,0.55)] text-[10px]">{item.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Earned */}
                <div className="border border-white/[0.06]/50 bg-white/[0.02]/40 rounded p-6">
                  <h3 className="text-[12px] font-medium text-zinc-500 mb-4">Lifetime Earnings</h3>
                  <div className="text-3xl font-normal text-zinc-200">${parseFloat(operator.totalEarned).toFixed(2)}</div>
                  <div className="text-[11px] font-medium text-zinc-600 mt-1">USDC earned by creator</div>
                </div>

                {/* Invoke Button */}
                <button
                  onClick={handleInvoke}
                  disabled={invokeMutation.isPending}
                  className="w-full bg-white text-zinc-900 font-normal text-[14px] py-4 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
                >
                  {invokeMutation.isPending ? "Invoking..." : `Invoke for $${priceDisplay} USDC`}
                </button>
                <p className="text-[10px] text-zinc-600 text-center">
                  Simulated invocation. Real x402 payments settle on Solana mainnet.
                </p>
              </div>
            </div>
          )}

          {/* Invocations Tab */}
          {tab === "invocations" && (
            <div>
              <h2 className="text-xl font-normal text-white mb-6">Recent Invocations</h2>
              {invocations && invocations.length > 0 ? (
                <div className="border border-white/[0.06]/50 rounded overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/[0.06]/40 text-[10px] text-zinc-500 bg-white/[0.02]/40">
                    <span>Caller</span>
                    <span>Amount</span>
                    <span>Status</span>
                    <span>Response</span>
                    <span>Trust</span>
                  </div>
                  {invocations.map((inv: InvocationRecord) => (
                    <div key={inv.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/[0.06]/20 text-[12px] items-center hover:bg-zinc-800/20 transition-colors">
                      <span className="font-medium text-zinc-500 truncate">
                        {inv.callerWallet ? `${inv.callerWallet.slice(0, 6)}...${inv.callerWallet.slice(-4)}` : "Anonymous"}
                      </span>
                      <span className="font-medium text-zinc-400">${parseFloat(inv.amountPaid).toFixed(4)}</span>
                      <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded border ${
                        inv.success
                          ? "text-zinc-300 border-white/[0.06]/30 bg-zinc-800/40"
                          : "text-[rgba(220,100,60,0.50)] border-[rgba(220,100,60,0.15)] bg-[rgba(220,100,60,0.06)]"
                      }`}>
                        {inv.success ? "OK" : "FAIL"}
                      </span>
                      <span className="font-medium text-zinc-500">{inv.responseMs}ms</span>
                      <span className={`text-[10px] font-medium ${inv.trustDelta > 0 ? "text-zinc-300" : inv.trustDelta < 0 ? "text-[rgba(220,100,60,0.50)]" : "text-zinc-600"}`}>
                        {inv.trustDelta > 0 ? "+" : ""}{inv.trustDelta}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-zinc-600 text-sm">
                  No invocations recorded yet.
                </div>
              )}
            </div>
          )}

          {/* Invoke Tab */}
          {tab === "invoke" && (
            <div className="max-w-2xl">
              <h2 className="text-xl font-normal text-white mb-4">Test Invocation</h2>
              <p className="text-[14px] text-zinc-500 leading-relaxed mb-8">
                Send a test invocation to this operator. The response will be validated by the Aegis trust engine,
                which scores latency, status, schema compliance, and content quality. The operator's success rate
                will be updated based on the result.
              </p>

              {/* Invocation result */}
              {invokeMutation.data && (
                <div className="border border-white/[0.06]/50 bg-white/[0.02]/40 rounded p-6 mb-8">
                  <h3 className="text-[12px] font-medium text-zinc-400 mb-4">Invocation Result</h3>
                  <div className="space-y-3 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Status</span>
                      <span className={invokeMutation.data.success ? "text-zinc-200" : "text-[rgba(220,100,60,0.50)]"}>
                        {invokeMutation.data.success ? "Success" : "Failed"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Response time</span>
                      <span className="text-zinc-300">{invokeMutation.data.responseMs}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Validation score</span>
                      <span className="text-zinc-300">{invokeMutation.data.validation.score}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Trust delta</span>
                      <span className={`font-normal ${invokeMutation.data.validation.trustDelta > 0 ? "text-zinc-200" : "text-[rgba(220,100,60,0.50)]"}`}>
                        {invokeMutation.data.validation.trustDelta > 0 ? "+" : ""}{invokeMutation.data.validation.trustDelta}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">New success rate</span>
                      <span className="text-zinc-300">{invokeMutation.data.validation.newTrustScore}</span>
                    </div>
                    {invokeMutation.data.validation.flags.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Flags</span>
                        <span className="text-amber-400 text-[11px] font-medium">
                          {invokeMutation.data.validation.flags.join(", ")}
                        </span>
                      </div>
                    )}
                    <div className="h-px bg-zinc-800/50" />
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Creator earned</span>
                      <span className="text-zinc-300">${invokeMutation.data.fees.creator.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Burned</span>
                      <span className="text-zinc-500">${invokeMutation.data.fees.burn.toFixed(4)}</span>
                    </div>
                  </div>

                  {/* Raw response */}
                  <div className="mt-6">
                    <h4 className="text-[11px] font-medium text-zinc-500 mb-2">Raw Response</h4>
                    <pre className="text-[11px] font-mono text-zinc-400 bg-white/[0.02]/60 border border-white/[0.06]/40 p-4 rounded overflow-x-auto max-h-48 overflow-y-auto">
                      {JSON.stringify(invokeMutation.data.response, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <button
                onClick={handleInvoke}
                disabled={invokeMutation.isPending}
                className="bg-white text-zinc-900 font-normal text-[14px] px-8 py-4 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                {invokeMutation.isPending ? "Invoking..." : `Send Test Invocation ($${priceDisplay} USDC)`}
              </button>
              <p className="text-[10px] text-zinc-600 mt-3">
                This is a simulated invocation. No real USDC is charged. Success scores are updated in the database.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
