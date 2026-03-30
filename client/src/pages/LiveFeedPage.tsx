import ComingSoon from "@/components/ComingSoon";
import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { useLiveFeed } from "@/hooks/useLiveFeed";

/* ── Helpers ──────────────────────────────────────────────────────────── */

function timeAgo(date: Date | string): string {
  const now = Date.now();
  const d = typeof date === "string" ? new Date(date).getTime() : date.getTime();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function repColor(score: number) {
  if (score >= 80) return "#A1A1AA";
  if (score >= 60) return "#71717A";
  if (score >= 40) return "#eab308";
  return "#ef4444";
}

/* ── Main Page ────────────────────────────────────────────────────────── */

export default function LiveFeedPage() { return <ComingSoon title="Protocol Feed" description="Real-time invocation feed, operator activity, and network health." />; }
function _LiveFeedPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { events: sseEvents, connected: sseConnected } = useLiveFeed();

  // Refetch tRPC data when new SSE events arrive
  const utils = trpc.useUtils();
  const lastSSECount = useMemo(() => sseEvents.length, [sseEvents]);
  useEffect(() => {
    if (lastSSECount > 0) {
      utils.invoke.recent.invalidate();
    }
  }, [lastSSECount, utils.invoke.recent]);

  // Fetch recent invocations
  const { data: invocations, isLoading: loadingInvocations, refetch: refetchInvocations } = trpc.invoke.recent.useQuery(
    { limit: 50 },
    { staleTime: 300000 }
  );

  // Fetch protocol stats
  const { data: stats, isLoading: loadingStats } = trpc.stats.overview.useQuery(
    undefined,
    { staleTime: 300000 }
  );

  // Fetch operators for the health dashboard
  const { data: operatorData } = trpc.operator.list.useQuery(
    { limit: 100, sortBy: "trust" },
    { staleTime: 300000 }
  );

  const operators = operatorData?.operators || [];

  // Calculate aggregate stats
  const feedStats = useMemo(() => {
    if (!invocations || invocations.length === 0) return { successRate: 0, avgResponseMs: 0, totalFees: 0 };
    const successful = invocations.filter((i: any) => i.invocation.success).length;
    const avgMs = Math.round(invocations.reduce((s: number, i: any) => s + (i.invocation.responseMs || 0), 0) / invocations.length);
    const totalFees = invocations.reduce((s: number, i: any) => s + parseFloat(i.invocation.amountPaid || "0"), 0);
    return {
      successRate: Math.round((successful / invocations.length) * 100),
      avgResponseMs: avgMs,
      totalFees,
    };
  }, [invocations]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="pt-24">
        {/* Hero */}
        <div className="border-b border-white/[0.07]">
          <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-12 md:py-16">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-medium text-zinc-300/60 bg-white/[0.04] border border-white/[0.10] px-3 py-1 rounded-full">
                    LIVE TELEMETRY
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                  <span className="text-[10px] font-medium text-zinc-300/40">
                    {sseConnected ? "LIVE" : autoRefresh ? "AUTO-REFRESH ON" : "PAUSED"}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white/95 mb-2">
                  Protocol Feed
                </h1>
                <p className="text-base text-white/30">
                  Real-time invocations, fee distribution, and success rate updates from the Aegis network.
                </p>
              </div>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`text-[11px] font-medium px-4 py-2 border transition-all ${
                  autoRefresh
                    ? "text-zinc-300 border-white/25 bg-white/5"
                    : "text-white/30 border-white/[0.08] bg-white/[0.02]"
                }`}
              >
                {autoRefresh ? "PAUSE FEED" : "RESUME FEED"}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="border-b border-white/[0.07] bg-white/[0.01]">
          <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              <div>
                <div className="text-xl font-bold text-white/90">{stats?.totalOperators || 0}</div>
                <div className="text-[10px] font-medium text-white/25 mt-0.5">ACTIVE OPERATORS</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white/90">{(stats?.totalInvocations || 0).toLocaleString()}</div>
                <div className="text-[10px] font-medium text-white/25 mt-0.5">TOTAL INVOCATIONS</div>
              </div>
              <div>
                <div className="text-xl font-bold text-zinc-300">${parseFloat(stats?.totalEarnings || "0").toFixed(0)}</div>
                <div className="text-[10px] font-medium text-white/25 mt-0.5">REVENUE (USDC)</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white/90">{feedStats.successRate}%</div>
                <div className="text-[10px] font-medium text-white/25 mt-0.5">SUCCESS RATE</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white/90">{feedStats.avgResponseMs}ms</div>
                <div className="text-[10px] font-medium text-white/25 mt-0.5">AVG RESPONSE</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white/90">{invocations?.length || 0}</div>
                <div className="text-[10px] font-medium text-white/25 mt-0.5">RECENT EVENTS</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-[1fr_380px] gap-12">
            {/* Left: Invocation Feed */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-normal text-white/90">Invocation Feed</h2>
                <button onClick={() => refetchInvocations()} className="text-[10px] font-medium text-zinc-300/50 hover:text-zinc-300 transition-colors">
                  REFRESH
                </button>
              </div>

              {loadingInvocations ? (
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="border border-white/[0.07] bg-white/[0.01] p-4 animate-pulse">
                      <div className="h-4 bg-white/[0.04] w-48 mb-2" />
                      <div className="h-3 bg-white/[0.04] w-32" />
                    </div>
                  ))}
                </div>
              ) : invocations && invocations.length > 0 ? (
                <div className="space-y-1">
                  {invocations.map((item: any) => {
                    const inv = item.invocation;
                    const opName = item.operatorName || "Unknown";
                    const opSlug = item.operatorSlug || "";
                    return (
                      <div key={inv.id} className="border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/[0.08] transition-all p-4 group">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[9px] font-medium px-1.5 py-0.5 border ${
                                inv.success
                                  ? "text-zinc-300 border-white/15 bg-white/5"
                                  : "text-red-400 border-red-500/15 bg-red-500/5"
                              }`}>
                                {inv.success ? "OK" : "FAIL"}
                              </span>
                              <Link href={`/marketplace/${opSlug}`}
                                className="text-[13px] font-medium text-white/70 group-hover:text-zinc-300 transition-colors truncate"
                              >
                                {opName}
                              </Link>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-medium text-white/20">
                              <span>Caller: {inv.callerWallet ? `${inv.callerWallet.slice(0, 6)}...${inv.callerWallet.slice(-4)}` : "anon"}</span>
                              <span>{inv.responseMs}ms</span>
                              <span className={inv.trustDelta > 0 ? "text-zinc-300/60" : inv.trustDelta < 0 ? "text-red-400/60" : ""}>
                                trust: {inv.trustDelta > 0 ? "+" : ""}{inv.trustDelta}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[12px] font-medium text-zinc-300/70">${parseFloat(inv.amountPaid).toFixed(4)}</div>
                            <div className="text-[9px] font-medium text-white/15 mt-0.5">{timeAgo(inv.createdAt)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 text-white/20 text-sm">
                  No invocations recorded yet. Try invoking an operator from the marketplace.
                </div>
              )}
            </div>

            {/* Right: Health Dashboard */}
            <div className="space-y-6">
              {/* Operator Health */}
              <div className="border border-white/[0.08] bg-white/[0.02] p-6">
                <h3 className="text-[13px] font-medium text-zinc-300/60 tracking-wider mb-4">OPERATOR HEALTH</h3>
                <div className="space-y-3">
                  {operators.slice(0, 8).map((op: any) => (
                    <Link key={op.id} href={`/marketplace/${op.slug}`}
                      className="flex items-center justify-between py-1.5 hover:bg-white/[0.02] -mx-2 px-2 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full ${op.isActive ? "bg-white" : "bg-red-400"}`} />
                        <span className="text-[12px] text-white/50 truncate">{op.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-16 h-1 bg-white/[0.04] overflow-hidden">
                          <div className="h-full" style={{ width: `${op.trustScore}%`, background: repColor(op.trustScore) }} />
                        </div>
                        <span className="text-[10px] font-medium text-white/30 w-6 text-right">{op.trustScore}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Fee Distribution Summary */}
              <div className="border border-white/[0.08] bg-white/[0.02] p-6">
                <h3 className="text-[13px] font-medium text-zinc-300/60 tracking-wider mb-4">FEE DISTRIBUTION</h3>
                <div className="space-y-3">
                  {[
                    { label: "Creator (60%)", pct: 60, color: "#A1A1AA" },
                    { label: "Validators (15%)", pct: 15, color: "#71717A" },
                    { label: "Stakers (12%)", pct: 12, color: "#9CA3AF" },
                    { label: "Treasury (8%)", pct: 8, color: "#4A7A82" },
                    { label: "Insurance (3%)", pct: 3, color: "#6B7280" },
                    { label: "Burned (2%)", pct: 2, color: "#ef4444" },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-white/40">{item.label}</span>
                        <span className="font-normal tabular-nums" style={{ color: item.color }}>{item.pct}%</span>
                      </div>
                      <div className="h-1 bg-white/[0.04] overflow-hidden">
                        <div className="h-full" style={{ width: `${item.pct}%`, background: item.color }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-white/15 mt-4">
                  All fees paid in USDC via x402 micropayments on Solana.
                </p>
              </div>

              {/* Network Status */}
              <div className="border border-white/[0.08] bg-white/[0.02] p-6">
                <h3 className="text-[13px] font-medium text-zinc-300/60 tracking-wider mb-4">NETWORK STATUS</h3>
                <div className="space-y-3">
                  {[
                    { label: "Registry", status: "OPERATIONAL", ok: true },
                    { label: "Invocation Engine", status: "OPERATIONAL", ok: true },
                    { label: "Trust Validator", status: "OPERATIONAL", ok: true },
                    { label: "x402 Gateway", status: "SIMULATED", ok: true },
                    { label: "Solana RPC", status: "DEVNET", ok: true },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-[12px] text-white/40">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${item.ok ? "bg-white" : "bg-red-400"}`} />
                        <span className={`text-[10px] font-medium ${item.ok ? "text-zinc-300/60" : "text-red-400/60"}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
