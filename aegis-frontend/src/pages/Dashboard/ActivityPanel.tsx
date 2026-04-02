/**
 * Aegis Dashboard. Activity Panel
 */
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { T } from "./theme";
import { SIcon, BrandIcon } from "./icons";
import { Card, PageHeader, StatusBadge } from "./primitives";
import { type LiveTx, formatInvocationAsTx } from "./constants";

export default function ActivityPanel() {
  const [filter, setFilter] = useState<"all" | "completed" | "pending" | "failed">("all");
  const [visibleCount, setVisibleCount] = useState(20);

  const recentQuery = trpc.invoke.recent.useQuery(
    { limit: 100 },
    { staleTime: 30_000, refetchInterval: 30_000 },
  );
  const statsQuery = trpc.stats.overview.useQuery(undefined, { staleTime: 300_000 });
  const rawStats = statsQuery.data as Record<string, unknown> | undefined;

  const allTxs: LiveTx[] = useMemo(() => {
    if (!recentQuery.data) return [];
    return (recentQuery.data as any[]).map((row, i) => formatInvocationAsTx(row, i));
  }, [recentQuery.data]);

  const filtered = filter === "all" ? allTxs : allTxs.filter((tx) => tx.status === filter);
  const visible = filtered.slice(0, visibleCount);

  const successCount = allTxs.filter((tx) => tx.status === "completed").length;
  const successRate = allTxs.length > 0 ? ((successCount / allTxs.length) * 100).toFixed(1) : "—";
  const avgLatencyMs = allTxs.length > 0
    ? Math.round(allTxs.reduce((acc, tx) => acc + (parseInt(tx.latency) || 0), 0) / allTxs.length)
    : null;
  const avgLatency = avgLatencyMs != null ? `${avgLatencyMs}ms` : "—";
  const totalFees = rawStats?.totalEarnings ? `$${parseFloat(String(rawStats.totalEarnings)).toFixed(2)}` : "—";

  const filterTabs: Array<{ key: typeof filter; label: string }> = [
    { key: "all",       label: "All" },
    { key: "completed", label: "Completed" },
    { key: "pending",   label: "Pending" },
    { key: "failed",    label: "Failed" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader title="Activity" subtitle="Transaction log. real-time invocation history" />

      {/* Filter tabs + stats bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 4, background: T.white3, border: `1px solid ${T.border}`, borderRadius: 8, padding: 4 }}>
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setFilter(tab.key); setVisibleCount(20); }}
              style={{
                padding: "5px 14px", borderRadius: 5, border: "none",
                fontSize: 12, fontWeight: filter === tab.key ? 400 : 300, cursor: "pointer",
                background: filter === tab.key ? T.white6 : "transparent",
                color: filter === tab.key ? T.text95 : T.text30,
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[
            { label: "Recent", value: `${allTxs.length} calls` },
            { label: "Success Rate", value: allTxs.length > 0 ? `${successRate}%` : "—" },
            { label: "Avg Latency", value: avgLatency },
            { label: "Total Earnings", value: totalFees },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
              <span style={{ fontSize: 10, letterSpacing: "0.04em", fontWeight: 500, color: T.text20 }}>{s.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text50, fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      <Card>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {[
                  { h: "Status",   align: "left" as const },
                  { h: "Operator", align: "left" as const },
                  { h: "Caller",   align: "left" as const },
                  { h: "Amount",   align: "right" as const },
                  { h: "Latency",  align: "right" as const },
                  { h: "Time",     align: "right" as const },
                ].map((col) => (
                  <th key={col.h} style={{
                    padding: "11px 20px", textAlign: col.align,
                    fontSize: 10, letterSpacing: "0.02em", fontWeight: 500, color: T.text12,
                  }}>{col.h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((tx) => {
                const latMs = parseInt(tx.latency);
                const latColor = latMs < 100 ? T.text50 : latMs < 200 ? T.text30 : T.negative;
                return (
                  <tr
                    key={tx.id}
                    style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ padding: "10px 20px" }}>
                      <StatusBadge status={tx.status} />
                    </td>
                    <td style={{ padding: "10px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <BrandIcon name={tx.operator} size={16} />
                        <span style={{ color: T.text50, fontWeight: 400 }}>{tx.operator}</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 20px", color: T.text30, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{tx.caller}</td>
                    <td style={{ padding: "10px 20px", textAlign: "right", color: T.text50, fontVariantNumeric: "tabular-nums" }}>{tx.amount}</td>
                    <td style={{ padding: "10px 20px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontSize: 12, color: latColor, fontWeight: 600 }}>{tx.latency}</td>
                    <td style={{ padding: "10px 20px", textAlign: "right", color: T.text20, fontSize: 11 }}>{tx.time}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {visibleCount < filtered.length && (
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "center" }}>
            <button
              onClick={() => setVisibleCount((c) => c + 20)}
              style={{
                padding: "8px 24px", borderRadius: 6, border: `1px solid ${T.border}`,
                background: T.white3, color: T.text50, fontSize: 13, cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.borderHover; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.border; }}
            >
              Load more ({filtered.length - visibleCount} remaining)
            </button>
          </div>
        )}
        {visible.length === 0 && (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <SIcon name="activity" size={32} className="text-white/10" />
            <div style={{ fontSize: 14, color: T.text30, marginTop: 12, fontWeight: 600 }}>No transactions found</div>
            <div style={{ fontSize: 12, color: T.text20, marginTop: 4 }}>Try changing the filter above</div>
          </div>
        )}
      </Card>
    </div>
  );
}
