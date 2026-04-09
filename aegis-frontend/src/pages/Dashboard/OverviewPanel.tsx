/**
 * Aegis Dashboard. Overview Panel
 */
import { useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { trpc } from "@/lib/trpc";
import { PremiumAreaChart } from "@/components/PremiumAreaChart";
import { T } from "./theme";
import { SIcon, BrandIcon, Spark } from "./icons";
import {
  type LiveTx, formatInvocationAsTx, DEMO_SPARKLINE, FEE_SPLIT, formatUsd, parseNumericValue,
} from "./constants";

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/* ── Local card primitives (inline, panel-specific) ────────────────────── */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className} style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 6,
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = T.borderHover; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; }}
    >
      {children}
    </div>
  );
}

function CardHead({ title }: { title: string }) {
  return (
    <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 11, letterSpacing: "0.02em", fontWeight: 500, color: T.text25 }}>
        {title}
      </span>
    </div>
  );
}

/* ── OverviewPanel ─────────────────────────────────────────────────────── */

export default function OverviewPanel() {
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? "";
  const queryEnabled = Boolean(walletAddress);

  const earningsQuery = trpc.creator.earningsByWallet.useQuery(
    { walletAddress },
    { staleTime: 300_000, enabled: queryEnabled },
  );
  const analyticsQuery = trpc.creator.analyticsByWallet.useQuery(
    { walletAddress, days: 90 },
    { staleTime: 300_000, enabled: queryEnabled },
  );
  const opsQuery = trpc.creator.operatorsByWallet.useQuery(
    { walletAddress },
    { staleTime: 300_000, enabled: queryEnabled },
  );
  const recentQuery = trpc.creator.recentInvocationsByWallet.useQuery(
    { walletAddress, limit: 14 },
    { staleTime: 30_000, refetchInterval: 30_000 },
  );

  const creatorEarnings = earningsQuery.data;
  const creatorAnalytics = analyticsQuery.data;
  const realOps = (opsQuery.data ?? []) as Array<Record<string, unknown>>;
  const earningsByOperator = creatorEarnings?.byOperator ?? [];

  const earningsTotal = parseNumericValue(creatorEarnings?.total);
  const operatorRevenueTotal = realOps.reduce((sum, op) => sum + parseNumericValue(op.totalEarned), 0);
  const byOperatorRevenueTotal = earningsByOperator.reduce((sum, op) => sum + parseNumericValue(op.total), 0);
  const totalEarnings = Math.max(earningsTotal, operatorRevenueTotal, byOperatorRevenueTotal);
  const totalInvocations = realOps.reduce((sum, op) => sum + Number(op.totalInvocations ?? 0), 0);
  const totalOperators = realOps.length;
  const activeOperators = realOps.filter((op) => Boolean(op.isActive)).length;
  const successfulInvocations = realOps.reduce((sum, op) => sum + Number(op.successfulInvocations ?? 0), 0);
  const avgResponseMs = totalInvocations > 0
    ? realOps.reduce((sum, op) => sum + (Number(op.avgResponseMs ?? 0) * Number(op.totalInvocations ?? 0)), 0) / totalInvocations
    : 0;
  const successRate = totalInvocations > 0 ? (successfulInvocations / totalInvocations) * 100 : 0;
  const last30dRevenue = parseNumericValue(creatorEarnings?.last30d);

  const operatorRevenueMap = useMemo(() => {
    const entries = earningsByOperator.map((entry) => [String(entry.operatorId), parseNumericValue(entry.total)]);
    return new Map(entries);
  }, [earningsByOperator]);

  const feed = useMemo<LiveTx[]>(() => {
    if (!recentQuery.data) return [];
    return (recentQuery.data as any[]).map((row, i) => formatInvocationAsTx(row, i));
  }, [recentQuery.data]);

  const revenueData = useMemo(() => {
    const daily = creatorAnalytics?.daily ?? [];
    const revenueByDay = new Map(daily.map((entry) => [entry.date, parseNumericValue(entry.revenue)]));
    const series = [] as { date: Date; value: number }[];

    for (let offset = 89; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      const key = toDateKey(date);
      series.push({
        date: new Date(date),
        value: revenueByDay.get(key) ?? 0,
      });
    }

    return series;
  }, [creatorAnalytics]);

  const networkHealth = useMemo(() => ([
    { label: "Invocation Success", value: totalInvocations > 0 ? Number(successRate.toFixed(1)) : "--", unit: totalInvocations > 0 ? "%" : "", bar: successRate },
    { label: "Avg Response", value: totalInvocations > 0 ? Math.round(avgResponseMs) : "--", unit: totalInvocations > 0 ? "ms" : "", bar: totalInvocations > 0 ? Math.max(0, 100 - Math.min(avgResponseMs / 20, 100)) : 0 },
    { label: "Active Operators", value: totalOperators > 0 ? activeOperators : "--", unit: "", bar: totalOperators > 0 ? (activeOperators / totalOperators) * 100 : 0 },
    { label: "30d Revenue", value: formatUsd(last30dRevenue), unit: "", bar: totalEarnings > 0 ? Math.min((last30dRevenue / Math.max(totalEarnings, 1)) * 100, 100) : 0 },
    { label: "Portfolio Share", value: totalOperators > 0 ? `${totalOperators}` : "--", unit: totalOperators > 0 ? " ops" : "", bar: totalOperators > 0 ? 100 : 0 },
  ]), [activeOperators, avgResponseMs, last30dRevenue, successRate, totalEarnings, totalInvocations, totalOperators]);

  const estimatedGrossFees = totalEarnings > 0 ? totalEarnings / (FEE_SPLIT[0].pct / 100) : 0;

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: T.text95, margin: 0, letterSpacing: "-0.02em" }}>Protocol Overview</h1>
          <span style={{ fontSize: 12, color: T.text25 }}>{today}</span>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 7, padding: "7px 16px",
          borderRadius: 20, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.borderSubtle}`,
        }}>
          <span style={{ fontSize: 11, color: T.text30 }}>
            {"\u2022"} Creator Dashboard
          </span>
        </div>
      </div>

      {/* Hero stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 32 }}>
        {[
          { label: "Live Invocations", value: totalInvocations.toLocaleString(), delta: "real executions", sub: "across your operators" },
          { label: "Revenue", value: formatUsd(totalEarnings), delta: "creator share", sub: "earned by your wallet" },
          { label: "Your Operators", value: totalOperators.toLocaleString(), delta: `${activeOperators} active`, sub: "owned by connected wallet" },
          { label: "Execution Success", value: totalInvocations > 0 ? `${successRate.toFixed(1)}%` : "--", delta: `${successfulInvocations.toLocaleString()} successful`, sub: "based on your operator calls" },
        ].map((s, i) => (
          <div key={i}>
            <div style={{ fontSize: 11, letterSpacing: "0.04em", fontWeight: 500, color: T.text20, marginBottom: 12 }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 600, fontVariantNumeric: "tabular-nums", lineHeight: 1, color: T.text95, letterSpacing: "-0.02em" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: T.text50, marginTop: 10, fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{s.delta}</div>
            <div style={{ fontSize: 11, color: T.text20, marginTop: 3 }}>{s.sub}</div>
            <div style={{ marginTop: 20, height: 1, background: `linear-gradient(90deg, rgba(255,255,255,0.06) 0%, transparent 80%)` }} />
          </div>
        ))}
      </div>

      {/* Revenue chart + Live Feed */}
      <div style={{ display: "grid", gridTemplateColumns: "5fr 2fr", gap: 14, alignItems: "stretch" }}>
        <Card>
          <CardHead title="Revenue (90d)" />
          <div style={{ padding: "4px 0 0" }}>
            <PremiumAreaChart data={revenueData} height={260} formatValue={(v: number) => formatUsd(v)} />
          </div>
        </Card>

        <Card>
          <div style={{ padding: "13px 16px 10px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, letterSpacing: "0.02em", fontWeight: 500, color: T.text25 }}>Live Invocations</span>
            <span style={{ fontSize: 10, color: T.text30 }}>{"\u2022"} Your Operators</span>
          </div>
          <div style={{ overflow: "hidden", height: 250 }}>
            {feed.length === 0 && (
              <div style={{ padding: "20px 14px", fontSize: 11, color: T.text20 }}>
                No recent invocations for this wallet's operators yet.
              </div>
            )}
            <AnimatePresence initial={false}>
              {feed.map((tx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: -14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 14px", fontSize: 11 }}
                >
                  <BrandIcon name={tx.operator} size={14} />
                  <span style={{ color: T.text50, fontWeight: 400, width: 76, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0, fontSize: 11 }}>
                    {tx.operator}
                  </span>
                  <span style={{ color: T.text20, fontFamily: "JetBrains Mono, monospace", fontSize: 10, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tx.caller}
                  </span>
                  <span style={{ color: T.text30, fontVariantNumeric: "tabular-nums", flexShrink: 0, fontSize: 11 }}>{tx.amount}</span>
                  <span style={{ color: T.text20, fontSize: 10, flexShrink: 0, fontFamily: "JetBrains Mono, monospace" }}>{tx.latency}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>
      </div>

      {/* Top Operators */}
      <Card>
        <div style={{ padding: "13px 20px 11px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, letterSpacing: "0.02em", fontWeight: 500, color: T.text25 }}>Your Operators</span>
          <Link href="/marketplace">
            <span style={{ fontSize: 11, color: T.text20, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, transition: "color 0.15s" }}>
              View marketplace <SIcon name="arrow-right" size={12} />
            </span>
          </Link>
        </div>
        {/* Column headers */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 20px 6px", borderBottom: `1px solid ${T.border}` }}>
          <span style={{ width: 20, flexShrink: 0 }} />
          <span style={{ flex: "0 0 180px", fontSize: 10, letterSpacing: "0.02em", fontWeight: 500, color: T.text12 }}>Operator</span>
          <span style={{ flex: "0 0 110px", fontSize: 10, letterSpacing: "0.02em", fontWeight: 500, color: T.text12 }}>Category</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 10, letterSpacing: "0.02em", fontWeight: 500, color: T.text12, width: 50, textAlign: "right" as const }}>Success</span>
            <span style={{ width: 64, flexShrink: 0 }} />
            <span style={{ fontSize: 10, letterSpacing: "0.02em", fontWeight: 500, color: T.text12, width: 80, textAlign: "right" as const }}>Invocations</span>
            <span style={{ fontSize: 10, letterSpacing: "0.02em", fontWeight: 500, color: T.text12, width: 72, textAlign: "right" as const }}>Revenue</span>
          </div>
        </div>
        {realOps.slice(0, 8).map((op: Record<string, unknown>, i: number) => {
          const name = (op.name as string) ?? "";
          const cat = ((op.category as string) ?? "").replace(/-/g, " ");
          const invocations: number = (op.totalInvocations as number) ?? (op.invocations as number) ?? 0;
          const opId = String(op.id ?? "");
          const earned = operatorRevenueMap.get(opId) ?? parseNumericValue(op.totalEarned ?? op.earned);
          const sr: number = (op.successfulInvocations as number) && (op.totalInvocations as number)
            ? ((op.successfulInvocations as number) / (op.totalInvocations as number)) * 100
            : (op.successRate as number) ?? 0;
          const sparkData = (op.successHistory as number[]) ?? DEMO_SPARKLINE.slice(0, 10);
          const verified: boolean = (op.isVerified as boolean) ?? false;
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 20px",
              borderBottom: i < 7 ? `1px solid ${T.border}` : "none",
              transition: "background 0.15s",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
            >
              <span style={{ width: 18, fontSize: 10, color: T.text12, fontVariantNumeric: "tabular-nums", flexShrink: 0, textAlign: "right" as const, fontWeight: 300 }}>{i + 1}</span>
              <BrandIcon name={name} size={18} />
              <span style={{ fontWeight: 400, fontSize: 12, color: T.text50, flex: "0 0 160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {name.replace(/^(OpenAI|Anthropic|Google|Meta|Mistral|NVIDIA)\s*/i, "")}
                {verified && <span style={{ marginLeft: 5, fontSize: 8, color: T.text20, fontWeight: 400 }}>&#10003;</span>}
              </span>
              <span style={{ fontSize: 10, color: T.text20, flex: "0 0 auto", whiteSpace: "nowrap", fontWeight: 300 }}>{cat}</span>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 12, color: T.text50, fontVariantNumeric: "tabular-nums", width: 50, textAlign: "right" as const, fontWeight: 500 }}>{sr.toFixed(1)}%</span>
                <Spark data={sparkData} width={64} height={20} />
                <span style={{ fontSize: 12, color: T.text50, fontVariantNumeric: "tabular-nums", width: 80, textAlign: "right" as const }}>{invocations.toLocaleString()}</span>
                <span style={{ fontSize: 12, color: T.text80, fontVariantNumeric: "tabular-nums", width: 72, textAlign: "right" as const, fontWeight: 500 }}>{formatUsd(earned)}</span>
              </div>
            </div>
          );
        })}
        {realOps.length === 0 && (
          <div style={{ padding: "24px 20px", fontSize: 12, color: T.text20 }}>
            No operators connected to this wallet yet.
          </div>
        )}
        <div style={{ padding: "9px 20px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: T.text20 }}>Showing {Math.min(realOps.length, 8)} of {totalOperators.toLocaleString()} operators owned by this wallet</span>
          <Link href="/marketplace">
            <span style={{ fontSize: 11, color: T.text20, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              Browse marketplace <SIcon name="arrow-right" size={11} />
            </span>
          </Link>
        </div>
      </Card>

      {/* Network Health + Fee Distribution */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card>
          <CardHead title="Network Health" />
          <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
            {networkHealth.map((h) => {
              const numVal = typeof h.value === "number" ? h.value : 0;
              const barW = h.bar ?? numVal;
              return (
                <div key={h.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: T.text50 }}>{h.label}</span>
                    <span style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: T.text80, letterSpacing: "-0.01em" }}>
                      {h.value}{h.unit}
                    </span>
                  </div>
                  <div style={{ height: 3, borderRadius: 3, background: T.white4 }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barW}%` }}
                      transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                      style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg, rgba(255,255,255,0.20), rgba(255,255,255,0.08))` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHead title="Fee Distribution" />
          <div style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", height: 28, borderRadius: 5, overflow: "hidden", marginBottom: 18, gap: 2 }}>
              {FEE_SPLIT.map((seg, i) => (
                <div key={seg.label} style={{
                  width: `${seg.pct}%`,
                  background: `rgba(255,255,255,${0.22 - i * 0.03})`,
                  borderRadius: i === 0 ? "4px 0 0 4px" : i === FEE_SPLIT.length - 1 ? "0 4px 4px 0" : 0,
                  position: "relative",
                }} />
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px", marginBottom: 16 }}>
              {FEE_SPLIT.map((seg, i) => (
                <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, flexShrink: 0, background: `rgba(255,255,255,${0.22 - i * 0.03})` }} />
                  <span style={{ color: T.text50 }}>{seg.label}</span>
                  <span style={{ color: T.text25, fontVariantNumeric: "tabular-nums", marginLeft: "auto", fontWeight: 600 }}>{seg.pct}%</span>
                </div>
              ))}
            </div>
            <div style={{ paddingTop: 14, borderTop: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: T.text30 }}>Estimated gross fees</span>
                <span style={{ color: T.text50, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{formatUsd(estimatedGrossFees)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: T.text30 }}>Creator earnings (wallet)</span>
                <span style={{ color: T.text50, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{formatUsd(totalEarnings)} USDC</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
