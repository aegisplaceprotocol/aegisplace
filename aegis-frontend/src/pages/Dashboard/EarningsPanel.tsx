/**
 * Aegis Dashboard. Earnings Panel
 */
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { PremiumAreaChart } from "@/components/PremiumAreaChart";
import { T } from "./theme";
import { Card, PageHeader, StatTile, CardHead } from "./primitives";
import { DEMO_SPARKLINE, DEMO_REVENUE, FEE_SPLIT } from "./constants";

export default function EarningsPanel() {
  const statsQuery = trpc.stats.overview.useQuery(undefined, { staleTime: 300_000 });
  const creatorQuery = trpc.creator.earnings.useQuery(undefined, { staleTime: 300_000 });
  const rawStats = statsQuery.data as Record<string, unknown> | undefined;
  const creatorEarnings = creatorQuery.data;

  // Use creator.earnings for time-windowed breakdown; fall back to stats.overview total
  const totalEarnings = creatorEarnings?.total
    ? parseFloat(creatorEarnings.total)
    : rawStats?.totalEarnings ? parseFloat(String(rawStats.totalEarnings)) : 0;
  const totalInvocations: number = (rawStats?.totalInvocations as number) ?? 0;

  const last30d = creatorEarnings?.last30d ? parseFloat(creatorEarnings.last30d) : null;
  const last7d = creatorEarnings?.last7d ? parseFloat(creatorEarnings.last7d) : null;

  const earningsData = useMemo(() => {
    if (totalEarnings === 0) return DEMO_REVENUE.map((_, i) => ({ date: new Date(Date.now() - (27 - i) * 86400000), value: 0 }));
    const scale = totalEarnings / (DEMO_REVENUE.reduce((a, b) => a + b, 0) * 100 / DEMO_REVENUE.length);
    return DEMO_REVENUE.map((v, i) => ({
      date: new Date(Date.now() - (27 - i) * 86400000),
      value: v * scale,
    }));
  }, [totalEarnings]);

  const avgPerCall = totalInvocations > 0 ? totalEarnings / totalInvocations : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <PageHeader title="Earnings" subtitle="Revenue breakdown and historical performance" />

      {/* 4 stat tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        <StatTile label="Total Revenue" value={`$${Math.floor(totalEarnings).toLocaleString()}`} delta="all-time" sub="USDC settled on Solana" />
        <StatTile label="Last 30 Days" value={last30d !== null ? `$${Math.floor(last30d).toLocaleString()}` : "—"} delta="30-day window" sub="rolling period" />
        <StatTile label="Last 7 Days" value={last7d !== null ? `$${Math.floor(last7d).toLocaleString()}` : "—"} delta="7-day window" sub="rolling period" />
        <StatTile label="Avg / Invocation" value={`$${avgPerCall.toFixed(4)}`} delta="blended rate" sub={`${totalInvocations.toLocaleString()} total calls`} />
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHead label={
          <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <span>Revenue (28 days)</span>
            <span style={{ fontSize: 11, color: T.text25, fontVariantNumeric: "tabular-nums", fontWeight: 300 }}>
              {new Date(Date.now() - 27 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}. {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </span>
        } />
        <div style={{ padding: "0 8px 8px", height: 288 }}>
          <PremiumAreaChart data={earningsData} height={258} formatValue={(v: number) => `$${Math.round(v).toLocaleString()}`} />
        </div>
      </Card>

      {/* Second row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Fee Breakdown */}
        <Card>
          <CardHead label="Fee Breakdown" />
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{ display: "flex", height: 6, borderRadius: 4, overflow: "hidden", gap: 1, marginBottom: 18 }}>
              {FEE_SPLIT.map((seg, i) => (
                <div key={seg.label} style={{
                  width: `${seg.pct}%`,
                  background: `rgba(255,255,255,${0.22 - i * 0.03})`,
                  borderRadius: i === 0 ? "3px 0 0 3px" : i === FEE_SPLIT.length - 1 ? "0 3px 3px 0" : 0,
                }} />
              ))}
            </div>
            {FEE_SPLIT.map((seg, i) => {
              const dollar = totalEarnings * (seg.pct / 100);
              return (
                <div key={seg.label} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "9px 0",
                  borderBottom: i < FEE_SPLIT.length - 1 ? `1px solid ${T.border}` : "none",
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, flexShrink: 0, background: `rgba(255,255,255,${0.22 - i * 0.03})` }} />
                  <span style={{ fontSize: 13, color: T.text50, flex: 1 }}>{seg.label}</span>
                  <span style={{ fontSize: 12, color: T.text25, fontVariantNumeric: "tabular-nums", marginRight: 8 }}>{seg.pct}%</span>
                  <span style={{ fontSize: 13, color: T.text50, fontVariantNumeric: "tabular-nums", fontWeight: 600, minWidth: 72, textAlign: "right" as const }}>
                    ${Math.floor(dollar).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Protocol Economics */}
        <Card>
          <CardHead label="Protocol Economics" />
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              { label: "Total Invocations", value: totalInvocations.toLocaleString(), sub: "all-time skill calls" },
              { label: "Avg Price / Call", value: `$${avgPerCall.toFixed(4)}`, sub: "blended across all skills" },
              { label: "Burn Rate (est.)", value: `$${Math.floor(totalEarnings * 0.005).toLocaleString()} USDC`, sub: "0.5% of all protocol fees" },
            ].map((m) => (
              <div key={m.label}>
                <div style={{ fontSize: 11, letterSpacing: "0.04em", fontWeight: 500, color: T.text20, marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontSize: 24, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: T.text95, letterSpacing: "-0.01em" }}>{m.value}</div>
                <div style={{ fontSize: 11, color: T.text25, marginTop: 3 }}>{m.sub}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
