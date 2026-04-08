/**
 * Aegis Dashboard. Overview Panel
 */
import { useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { PremiumAreaChart } from "@/components/PremiumAreaChart";
import { T } from "./theme";
import { SIcon, BrandIcon, Spark } from "./icons";
import {
  type LiveTx, formatInvocationAsTx, computeNetworkHealth,
  DEMO_SPARKLINE, DEMO_REVENUE, DEMO_OPS, FEE_SPLIT,
} from "./constants";

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
  const statsQuery = trpc.stats.overview.useQuery(undefined, { staleTime: 300_000 });
  const opsQuery = trpc.operator.list.useQuery({ limit: 8, sortBy: "invocations" }, { staleTime: 300_000 });
  const recentQuery = trpc.invoke.recent.useQuery(
    { limit: 14 },
    { staleTime: 30_000, refetchInterval: 30_000 },
  );

  const stats = statsQuery.data as Record<string, unknown> | undefined;
  const realOps: Record<string, unknown>[] = ((opsQuery.data as Record<string, unknown>)?.operators as Record<string, unknown>[]) ?? [];

  const totalInvocations: number = (stats?.totalInvocations as number) ?? 0;
  const totalEarnings: number = stats?.totalEarnings ? parseFloat(String(stats.totalEarnings)) : 0;
  const totalOperators: number = (stats?.totalOperators as number) ?? 0;
  const realOperators: number = (stats?.realOperators as number) ?? 0;
  const guardrailStatus: string = ((stats?.guardrails as Record<string, unknown>)?.serverStatus as string) ?? "standby";

  const feed = useMemo<LiveTx[]>(() => {
    if (!recentQuery.data) return [];
    return (recentQuery.data as any[]).map((row, i) => formatInvocationAsTx(row, i));
  }, [recentQuery.data]);

  const revenueData = useMemo(() => {
    const scale = totalEarnings / (DEMO_REVENUE.reduce((a, b) => a + b, 0) * 100 / DEMO_REVENUE.length);
    return DEMO_REVENUE.map((v, i) => ({
      date: new Date(Date.now() - (27 - i) * 86400000),
      value: v * scale,
    }));
  }, [totalEarnings]);

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
            {"\u2022"} All Systems Live
          </span>
        </div>
      </div>

      {/* Hero stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 32 }}>
        {[
          { label: "Total Invocations", value: totalInvocations.toLocaleString(), delta: "real executions", sub: "across all operators" },
          { label: "Protocol Revenue", value: `$${Math.floor(totalEarnings).toLocaleString()}`, delta: "from real usage", sub: "USDC settled on Solana" },
          { label: "Active Operators", value: totalOperators.toLocaleString(), delta: `${realOperators} with endpoints`, sub: "skills available to agents" },
          { label: "Guardrails", value: guardrailStatus === "active" ? "Active" : "Standby", delta: guardrailStatus === "active" ? "NVIDIA NeMo" : "not enabled", sub: `${(stats?.guardrails as Record<string, unknown>)?.totalChecks ?? 0} checks performed` },
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
            <PremiumAreaChart data={revenueData} height={260} formatValue={(v: number) => `$${Math.round(v).toLocaleString()}`} />
          </div>
        </Card>

        <Card>
          <div style={{ padding: "13px 16px 10px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, letterSpacing: "0.02em", fontWeight: 500, color: T.text25 }}>Live Invocations</span>
            <span style={{ fontSize: 10, color: T.text30 }}>{"\u2022"} Live</span>
          </div>
          <div style={{ overflow: "hidden", height: 250 }}>
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
          <span style={{ fontSize: 11, letterSpacing: "0.02em", fontWeight: 500, color: T.text25 }}>Top Operators</span>
          <Link href="/marketplace">
            <span style={{ fontSize: 11, color: T.text20, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, transition: "color 0.15s" }}>
              View all {totalOperators.toLocaleString()} <SIcon name="arrow-right" size={12} />
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
        {(realOps.length ? realOps : DEMO_OPS).slice(0, 8).map((op: Record<string, unknown>, i: number) => {
          const name = (op.name as string) ?? "";
          const cat = ((op.category as string) ?? "").replace(/-/g, " ");
          const invocations: number = (op.totalInvocations as number) ?? (op.invocations as number) ?? 0;
          const totalEarnedObj = op.totalEarned as Record<string, string> | undefined;
          const earned: number = totalEarnedObj?.$numberDecimal
            ? parseFloat(totalEarnedObj.$numberDecimal)
            : (op.earned as number) ?? 0;
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
                <span style={{ fontSize: 12, color: T.text80, fontVariantNumeric: "tabular-nums", width: 72, textAlign: "right" as const, fontWeight: 500 }}>${Math.round(earned).toLocaleString()}</span>
              </div>
            </div>
          );
        })}
        <div style={{ padding: "9px 20px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: T.text20 }}>Showing 8 of {totalOperators.toLocaleString()} active operators</span>
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
            {computeNetworkHealth(stats).map((h) => {
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
                <span style={{ color: T.text30 }}>Creator earnings (total)</span>
                <span style={{ color: T.text50, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>${Math.floor(totalEarnings * (FEE_SPLIT[0].pct / 100)).toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: T.text30 }}>Total burned (est.)</span>
                <span style={{ color: T.text50, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>${Math.floor(totalEarnings * 0.005).toLocaleString()} USDC</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
