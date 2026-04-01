import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import { trpc, type RouterOutputs } from "@/lib/trpc";

type RecentInvocationItem = RouterOutputs["invoke"]["recent"][number];
type OperatorItem = RouterOutputs["operator"]["list"]["operators"][number];
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
  return "rgba(220,100,60,0.50)";
}

function feedLikeCount(id: number): number {
  // Deterministic engagement count based on invocation id
  return ((id * 17 + 3) % 42) + 1;
}

const FEED_CATEGORIES: Record<string, { label: string; color: string }> = {
  "code-review": { label: "Dev", color: "text-sky-400/70 border-sky-400/20 bg-sky-400/8" },
  "sentiment-analysis": { label: "Data", color: "text-violet-400/70 border-violet-400/20 bg-violet-400/8" },
  "data-extraction": { label: "Data", color: "text-violet-400/70 border-violet-400/20 bg-violet-400/8" },
  "image-generation": { label: "AI", color: "text-fuchsia-400/70 border-fuchsia-400/20 bg-fuchsia-400/8" },
  "text-generation": { label: "AI", color: "text-fuchsia-400/70 border-fuchsia-400/20 bg-fuchsia-400/8" },
  "financial-analysis": { label: "DeFi", color: "text-emerald-400/70 border-emerald-400/20 bg-emerald-400/8" },
  "security-audit": { label: "Security", color: "text-amber-400/70 border-amber-400/20 bg-amber-400/8" },
};

const OP_ICON_COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e", "#ef4444", "#f97316", "#22c55e", "#06b6d4", "#3b82f6"];

/* ── Main Page ────────────────────────────────────────────────────────── */

export default function LiveFeedPage() {
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
    const successful = invocations.filter((i: RecentInvocationItem) => i.invocation.success).length;
    const avgMs = Math.round(invocations.reduce((s: number, i: RecentInvocationItem) => s + (i.invocation.responseMs || 0), 0) / invocations.length);
    const totalFees = invocations.reduce((s: number, i: RecentInvocationItem) => s + parseFloat(i.invocation.amountPaid || "0"), 0);
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
        <div className="border-b border-white/[0.04]">
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
                <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-white/95 mb-2">
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
                    : "text-white/30 border-white/[0.04] bg-white/[0.02]"
                }`}
              >
                {autoRefresh ? "PAUSE FEED" : "RESUME FEED"}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="border-b border-white/[0.04] bg-white/[0.01]">
          <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              <div>
                <div className="text-xl font-normal text-white/90">{stats?.totalOperators || 0}</div>
                <div className="text-[10px] font-medium text-white/25 mt-0.5">ACTIVE OPERATORS</div>
              </div>
              <div>
                <div className="text-xl font-normal text-white/90">{(stats?.totalInvocations || 0).toLocaleString()}</div>
                <div className="text-[10px] font-medium text-white/25 mt-0.5">TOTAL INVOCATIONS</div>
              </div>
              <div>
                <div className="text-xl font-normal text-zinc-300">${parseFloat(stats?.totalEarnings || "0").toFixed(0)}</div>
                <div className="text-[10px] font-medium text-white/25 mt-0.5">REVENUE (USDC)</div>
              </div>
              <div>
                <div className="text-xl font-normal text-white/90">{feedStats.successRate}%</div>
                <div className="text-[10px] font-medium text-white/25 mt-0.5">SUCCESS RATE</div>
              </div>
              <div>
                <div className="text-xl font-normal text-white/90">{feedStats.avgResponseMs}ms</div>
                <div className="text-[10px] font-medium text-white/25 mt-0.5">AVG RESPONSE</div>
              </div>
              <div>
                <div className="text-xl font-normal text-white/90">{invocations?.length || 0}</div>
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
                    <div key={i} className="border border-white/[0.04] bg-white/[0.01] p-4 animate-pulse">
                      <div className="h-4 bg-white/[0.04] w-48 mb-2" />
                      <div className="h-3 bg-white/[0.04] w-32" />
                    </div>
                  ))}
                </div>
              ) : invocations && invocations.length > 0 ? (
                <div className="space-y-1">
                  {invocations.map((item: RecentInvocationItem) => {
                    const inv = item.invocation;
                    const opName = item.operatorName || "Unknown";
                    const opSlug = item.operatorSlug || "";
                    return (
                      <div key={inv.id} className="border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/[0.04] transition-all p-4 group">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            {/* Operator icon */}
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white/90 shrink-0 mt-0.5"
                              style={{ background: OP_ICON_COLORS[inv.id % OP_ICON_COLORS.length] }}
                            >
                              {opName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[9px] font-medium px-1.5 py-0.5 border ${
                                  inv.success
                                    ? "text-zinc-300 border-white/15 bg-white/5"
                                    : "text-[rgba(220,100,60,0.50)] border-[rgba(220,100,60,0.12)] bg-[rgba(220,100,60,0.04)]"
                                }`}>
                                  {inv.success ? "OK" : "FAIL"}
                                </span>
                                <Link href={`/marketplace/${opSlug}`}
                                  className="text-[13px] font-medium text-white/70 group-hover:text-zinc-300 transition-colors truncate"
                                >
                                  {opName}
                                </Link>
                                {/* Category tag */}
                                {(() => {
                                  const cat = FEED_CATEGORIES[opSlug] || FEED_CATEGORIES["code-review"];
                                  return cat ? (
                                    <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded border ${cat.color}`}>
                                      {cat.label}
                                    </span>
                                  ) : null;
                                })()}
                              </div>
                              <div className="flex items-center gap-3 text-[10px] font-medium text-white/20">
                                <span>Caller: {inv.callerWallet ? `${inv.callerWallet.slice(0, 6)}...${inv.callerWallet.slice(-4)}` : "anon"}</span>
                                <span>{inv.responseMs}ms</span>
                                <span className={inv.trustDelta > 0 ? "text-zinc-300/60" : inv.trustDelta < 0 ? "text-[rgba(220,100,60,0.50)]/60" : ""}>
                                  trust: {inv.trustDelta > 0 ? "+" : ""}{inv.trustDelta}
                                </span>
                                {/* Engagement: like count */}
                                <span className="flex items-center gap-1 text-white/15 hover:text-white/30 cursor-default">
                                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 14s-5.5-3.5-5.5-7.5C2.5 4 4 2.5 5.5 2.5c1 0 2 .5 2.5 1.5.5-1 1.5-1.5 2.5-1.5 1.5 0 3 1.5 3 3.5S8 14 8 14z" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.15"/></svg>
                                  {feedLikeCount(inv.id)}
                                </span>
                              </div>
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
              <div className="border border-white/[0.04] bg-white/[0.02] p-6">
                <h3 className="text-[13px] font-medium text-zinc-300/60 tracking-wider mb-4">OPERATOR HEALTH</h3>
                <div className="space-y-3">
                  {operators.slice(0, 8).map((op: OperatorItem) => (
                    <Link key={op.id} href={`/marketplace/${op.slug}`}
                      className="flex items-center justify-between py-1.5 hover:bg-white/[0.02] -mx-2 px-2 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full ${op.isActive ? "bg-white" : "bg-[rgba(220,100,60,0.50)]"}`} />
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
              <div className="border border-white/[0.04] bg-white/[0.02] p-6">
                <h3 className="text-[13px] font-medium text-zinc-300/60 tracking-wider mb-4">FEE DISTRIBUTION</h3>
                <div className="space-y-3">
                  {[
                    { label: "Creator (60%)", pct: 60, color: "#A1A1AA" },
                    { label: "Validators (15%)", pct: 15, color: "#71717A" },
                    { label: "Stakers (12%)", pct: 12, color: "#9CA3AF" },
                    { label: "Treasury (8%)", pct: 8, color: "#4A7A82" },
                    { label: "Insurance (3%)", pct: 3, color: "#6B7280" },
                    { label: "Burned (2%)", pct: 2, color: "rgba(220,100,60,0.50)" },
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
              <div className="border border-white/[0.04] bg-white/[0.02] p-6">
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
                        <span className={`w-1.5 h-1.5 rounded-full ${item.ok ? "bg-white" : "bg-[rgba(220,100,60,0.50)]"}`} />
                        <span className={`text-[10px] font-medium ${item.ok ? "text-zinc-300/60" : "text-[rgba(220,100,60,0.50)]/60"}`}>
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
