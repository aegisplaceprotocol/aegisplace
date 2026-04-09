import React, { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { trpc } from "@/lib/trpc";
import { useLiveFeed } from "@/hooks/useLiveFeed";
import { BrandIcon, cleanOperatorName } from "./brand-icons";
import { T } from "./theme";
import {
  Card,
  CardHead,
  PageHeader,
  StatTile,
  StatusBadge,
  FilterChips,
  ActionButton,
  MonoValue,
} from "./primitives";

type RowStatus = "Success" | "Failed" | "Pending";

interface FeedRow {
  id: string;
  time: string;
  timestamp: number;
  operator: string;
  caller: string;
  amount: string;
  latency: string;
  status: RowStatus;
  traceId: string;
  guardrails: string[];
}

const parseAmountValue = (value: unknown): number => {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === "object" && value !== null && "$numberDecimal" in value) {
    const parsed = Number.parseFloat(String((value as { $numberDecimal?: unknown }).$numberDecimal ?? "0"));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
};


const FEE_BREAKDOWN = [
  { label: "Creator", pct: "85%", color: T.positive },
  { label: "Validators", pct: "10%", color: T.text50 },
  { label: "Stakers", pct: "3%", color: T.text30 },
  { label: "Treasury", pct: "1.5%", color: T.text50 },
  { label: "Insurance", pct: "0.5%", color: T.text50 },
  { label: "Burned", pct: "0%", color: T.negative },
];

// TOP_OPERATORS is derived from real feed data — see topOperators computed below

/* ── Styles ───────────────────────────────────────────────────────────── */

const LABEL: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.02em",
  fontWeight: 500,
  color: T.text20,
};

const MONO: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontVariantNumeric: "tabular-nums",
};

/* ── Component ────────────────────────────────────────────────────────── */

export default function LiveFeedPanel() {
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? "";
  const queryEnabled = Boolean(walletAddress);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("1h");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const earningsQuery = trpc.creator.earningsByWallet.useQuery(
    { walletAddress },
    { staleTime: 30_000, refetchInterval: isPaused ? false : 30_000, enabled: queryEnabled },
  );
  const operatorsQuery = trpc.creator.operatorsByWallet.useQuery(
    { walletAddress },
    { staleTime: 30_000, refetchInterval: isPaused ? false : 30_000, enabled: queryEnabled },
  );

  const recentQuery = trpc.creator.recentInvocationsByWallet.useQuery(
    { walletAddress, limit: 100 },
    { staleTime: 15_000, refetchInterval: isPaused ? false : 15_000, enabled: queryEnabled },
  );
  const { events: liveEvents, connected: liveConnected } = useLiveFeed();
  const ownedOperators = operatorsQuery.data ?? [];
  const ownedOperatorNames = new Set(ownedOperators.map((op: any) => String(op.name ?? "")));
  const ownedOperatorSlugs = new Set(ownedOperators.map((op: any) => String(op.slug ?? "")));

  const feedRows: FeedRow[] = useMemo(() => (
    recentQuery.data
      ? (recentQuery.data as any[]).map((row: any, i: number) => {
        const inv = row.invocation ?? row;
        const timestamp = inv.createdAt ? new Date(inv.createdAt).getTime() : Date.now();
        const guardrails = Array.isArray(inv.guardrailViolations) && inv.guardrailViolations.length > 0
          ? inv.guardrailViolations.map((v: string) => `${v}: Flagged`)
          : ["No guardrail violations"];
        return {
          id: `inv-${inv.id ?? inv._id ?? i}`,
          time: inv.createdAt ? new Date(inv.createdAt).toLocaleTimeString() : "",
          timestamp,
          operator: row.operatorName ?? row.operatorSlug ?? inv.operatorName ?? inv.operatorSlug ?? `operator-${inv.operatorId ?? "?"}`,
          caller: inv.callerWallet ? `${String(inv.callerWallet).slice(0, 6)}...${String(inv.callerWallet).slice(-4)}` : "anonymous",
          amount: `$${parseAmountValue(inv.amountPaid).toFixed(3)}`,
          latency: inv.responseMs != null ? `${inv.responseMs}ms` : "--",
          status: (inv.success ? "Success" : inv.responseMs === 0 ? "Pending" : "Failed") as RowStatus,
          traceId: `trace-${inv.id ?? inv._id ?? i}`,
          guardrails,
        };
      })
      : []
  ), [recentQuery.data]);

  const liveRows = useMemo(() => (
    liveEvents
      .filter((e) => e.event === "invocation")
      .filter((e) => {
        const operatorName = String(e.data.operatorName ?? "");
        const operatorSlug = String(e.data.operatorSlug ?? "");
        return ownedOperatorNames.has(operatorName) || ownedOperatorSlugs.has(operatorSlug);
      })
      .slice(0, 12)
      .map((e, i) => ({
            id: e.id || `live-${i}`,
            time: new Date(e.data.timestamp).toLocaleTimeString(),
            timestamp: Number(e.data.timestamp ?? Date.now()),
            operator: String(e.data.operatorName ?? e.data.operatorSlug ?? `operator-${e.data.operatorId ?? "?"}`),
            caller: e.data.callerWallet ? `${String(e.data.callerWallet).slice(0, 6)}...${String(e.data.callerWallet).slice(-4)}` : "anonymous",
        amount: `$${parseAmountValue(e.data.amountPaid).toFixed(3)}`,
            latency: e.data.responseMs != null ? `${e.data.responseMs}ms` : "--",
            status: (e.data.success ? "Success" : "Failed") as RowStatus,
            traceId: `trace-live-${e.id}`,
            guardrails: Array.isArray(e.data.guardrailViolations) && e.data.guardrailViolations.length > 0
              ? (e.data.guardrailViolations as string[]).map((v) => `${v}: Flagged`)
              : ["No guardrail violations"],
          }))
  ), [liveEvents, ownedOperatorNames, ownedOperatorSlugs]);

  const allRows = useMemo(() => {
    const merged = liveConnected && liveRows.length > 0 ? [...liveRows, ...feedRows] : feedRows;
    const deduped = merged.filter((row, index, array) => array.findIndex((candidate) => candidate.id === row.id) === index);
    return deduped.sort((left, right) => right.timestamp - left.timestamp).slice(0, 100);
  }, [feedRows, liveConnected, liveRows]);

  const rangeMs = timeRange === "1h"
    ? 60 * 60 * 1000
    : timeRange === "6h"
      ? 6 * 60 * 60 * 1000
      : timeRange === "24h"
        ? 24 * 60 * 60 * 1000
        : 7 * 24 * 60 * 60 * 1000;

  const rangeStart = Date.now() - rangeMs;

  const rangeRows = allRows.filter((row) => row.timestamp >= rangeStart);

  const filtered = rangeRows.filter((r) => {
    if (statusFilter !== "all" && r.status.toLowerCase() !== statusFilter) return false;
    if (searchQuery && !r.operator.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Top operators derived from real feed rows
  const topOperators: { name: string; invocations: number }[] = (() => {
    const counts: Record<string, number> = {};
    for (const r of rangeRows) {
      counts[r.operator] = (counts[r.operator] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, invocations]) => ({ name, invocations }));
  })();

  // Derived stats from real data
  const totalInv = ownedOperators.reduce((sum: number, op: any) => sum + Number(op.totalInvocations ?? 0), 0);
  const totalEarnings = earningsQuery.data?.total ? parseFloat(earningsQuery.data.total) : 0;
  const successCount = rangeRows.filter(r => r.status === "Success").length;
  const feedSuccessRate = rangeRows.length > 0 ? ((successCount / rangeRows.length) * 100).toFixed(1) : null;
  const feedAvgLatencyMs = rangeRows.length > 0
    ? Math.round(rangeRows.reduce((acc, r) => acc + (parseInt(r.latency) || 0), 0) / rangeRows.length)
    : null;

  const errorBuckets = useMemo(() => {
    const bucketCount = 12;
    const bucketSize = rangeMs / bucketCount;
    return Array.from({ length: bucketCount }, (_, index) => {
      const bucketStart = rangeStart + index * bucketSize;
      const bucketEnd = bucketStart + bucketSize;
      const bucketRows = rangeRows.filter((row) => row.timestamp >= bucketStart && row.timestamp < bucketEnd);
      if (bucketRows.length === 0) return 0;
      const failed = bucketRows.filter((row) => row.status === "Failed").length;
      return Number(((failed / bucketRows.length) * 100).toFixed(1));
    });
  }, [rangeMs, rangeRows, rangeStart]);

  const errorRate = rangeRows.length > 0
    ? Number((((rangeRows.filter((row) => row.status === "Failed").length) / rangeRows.length) * 100).toFixed(1))
    : null;

  return (
    <div>
      <PageHeader
        title="Live Feed"
        subtitle="Real-time invocation stream for operators owned by the connected wallet"
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 11, fontWeight: 500, color: isPaused ? T.text30 : T.text30,
            }}>
              {!isPaused && (
                <span style={{ color: T.text30 }}>{"\u2022"}</span>
              )}
              {isPaused ? "PAUSED" : "LIVE"}
            </span>
          </div>
        }
      />

      {/* Stats row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
        marginBottom: 24,
      }}>
        <StatTile label="Total Invocations" value={totalInv > 0 ? totalInv.toLocaleString() : "—"} delta="all-time" />
        <StatTile label="Success Rate" value={feedSuccessRate ? `${feedSuccessRate}%` : "—"} delta={timeRange} accent={T.positive} />
        <StatTile label="Avg Latency" value={feedAvgLatencyMs != null ? `${feedAvgLatencyMs}ms` : "—"} delta={timeRange} accent={T.text50} />
        <StatTile label="Creator Revenue" value={totalEarnings > 0 ? `$${Math.floor(totalEarnings).toLocaleString()}` : "—"} delta="all-time" accent={T.text50} />
      </div>

      {/* Filter bar */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 16, padding: "12px 20px",
          flexWrap: "wrap",
        }}>
          <FilterChips
            options={[
              { id: "all", label: "All" },
              { id: "success", label: "Success" },
              { id: "failed", label: "Failed" },
              { id: "pending", label: "Pending" },
            ]}
            active={statusFilter}
            onChange={setStatusFilter}
          />
          <div style={{ flex: 1, minWidth: 160 }}>
            <input
              type="text"
              placeholder="Search operator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                background: T.white4,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 12,
                color: T.text80,
                outline: "none",
                ...MONO,
              }}
            />
          </div>
          <FilterChips
            options={[
              { id: "1h", label: "1h" },
              { id: "6h", label: "6h" },
              { id: "24h", label: "24h" },
              { id: "7d", label: "7d" },
            ]}
            active={timeRange}
            onChange={setTimeRange}
          />
        </div>
      </Card>

      {/* Main content: table + side panel */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 16,
      }}>
        {/* Live stream table */}
        <Card>
          <CardHead
            label="Invocation Stream"
            action={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: T.text30 }}>
                  {filtered.length} entries
                </span>
              </div>
            }
          />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Time", "Operator", "Caller", "Amount", "Latency", "Status"].map((h, i) => (
                    <th key={h} style={{
                      ...LABEL,
                      textAlign: i === 0 ? "left" : i === 5 ? "center" : "right",
                      padding: "10px 16px",
                      borderBottom: `1px solid ${T.border}`,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: "24px 16px", fontSize: 12, color: T.text20, textAlign: "center" }}>
                      No live feed data for this wallet in the selected window.
                    </td>
                  </tr>
                )}
                {filtered.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr
                      onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                      style={{
                        cursor: "pointer",
                        borderBottom: `1px solid ${T.border}`,
                        background: expandedRow === row.id ? T.white3 : "transparent",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = T.white4; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = expandedRow === row.id ? T.white3 : "transparent"; }}
                    >
                      <td style={{ padding: "10px 16px", ...MONO, fontSize: 12, color: T.text50 }}>
                        {row.time}
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: T.text80, textAlign: "right" }}>
                        <span style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                          <BrandIcon name={row.operator} size={16} />
                          {cleanOperatorName(row.operator)}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px", ...MONO, fontSize: 11, color: T.text30, textAlign: "right" }}>
                        {row.caller}
                      </td>
                      <td style={{ padding: "10px 16px", ...MONO, fontSize: 12, color: T.positive, textAlign: "right" }}>
                        {row.amount}
                      </td>
                      <td style={{ padding: "10px 16px", ...MONO, fontSize: 12, color: T.text50, textAlign: "right" }}>
                        {row.latency}
                      </td>
                      <td style={{ padding: "10px 16px", textAlign: "center" }}>
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                    {expandedRow === row.id && (
                      <tr>
                        <td colSpan={6} style={{ padding: 0 }}>
                          <div style={{
                            background: T.white3,
                            padding: "16px 20px",
                            borderBottom: `1px solid ${T.border}`,
                          }}>
                            {/* Fee Breakdown */}
                            <div style={{ ...LABEL, marginBottom: 10 }}>Fee Breakdown</div>
                            <div style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                              gap: 8,
                              marginBottom: 16,
                            }}>
                              {FEE_BREAKDOWN.map((f) => (
                                <div key={f.label} style={{
                                  background: T.white3,
                                  borderRadius: 6,
                                  padding: "8px 10px",
                                  textAlign: "center",
                                }}>
                                  <div style={{ fontSize: 16, fontWeight: 500, color: f.color, ...MONO }}>{f.pct}</div>
                                  <div style={{ fontSize: 10, color: T.text30, marginTop: 2 }}>{f.label}</div>
                                </div>
                              ))}
                            </div>
                            {/* Trace & Guardrails */}
                            <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                              <div>
                                <div style={{ ...LABEL, marginBottom: 6 }}>Trace ID</div>
                                <MonoValue color={T.text50}>{row.traceId}</MonoValue>
                              </div>
                              <div>
                                <div style={{ ...LABEL, marginBottom: 6 }}>Guardrail Results</div>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  {row.guardrails.map((g, gi) => (
                                    <span key={gi} style={{
                                      fontSize: 11,
                                      padding: "2px 8px",
                                      borderRadius: 4,
                                      background: g.includes("Pass") ? "rgba(255,255,255,0.04)" : "rgba(239,68,68,0.04)",
                                      color: g.includes("Pass") ? T.positive : T.negative,
                                      ...MONO,
                                    }}>
                                      {g}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Side panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Top operators */}
          <Card>
            <CardHead label="Top Operators (recent)" />
            <div style={{ padding: "12px 20px 16px" }}>
              {topOperators.length === 0 && (
                <div style={{ fontSize: 12, color: T.text20, textAlign: "center", padding: "16px 0" }}>No data yet</div>
              )}
              {topOperators.map((op) => {
                const maxInv = topOperators[0]?.invocations ?? 1;
                const pct = (op.invocations / maxInv) * 100;
                return (
                  <div key={op.name} style={{ marginBottom: 12 }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      marginBottom: 4,
                    }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: T.text50 }}><BrandIcon name={op.name} size={16} />{cleanOperatorName(op.name)}</span>
                      <span style={{ ...MONO, fontSize: 11, color: T.text50 }}>{op.invocations}</span>
                    </div>
                    <div style={{ height: 4, background: T.white4, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: T.borderSubtle,
                        borderRadius: 2,
                        transition: "width 0.4s ease",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Error rate mini chart */}
          <Card>
            <CardHead label={`Error Rate (${timeRange})`} />
            <div style={{ padding: "12px 20px 16px" }}>
              <div style={{
                fontSize: 28, fontWeight: 400, fontVariantNumeric: "tabular-nums",
                color: T.text80, letterSpacing: "-0.02em", marginBottom: 8,
              }}>
                {errorRate != null ? `${errorRate}%` : "—"}
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 48 }}>
                {errorBuckets.map((v, i) => (
                  <div key={i} style={{
                    flex: 1,
                    height: `${Math.min((v / 100) * 100, 100)}%`,
                    background: v > 25 ? T.negative : v > 10 ? T.text50 : T.positive,
                    borderRadius: 2,
                    opacity: 0.7,
                    transition: "height 0.3s ease",
                  }} />
                ))}
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 9, color: T.text20, marginTop: 6,
              }}>
                <span>-{timeRange}</span>
                <span>now</span>
              </div>
            </div>
          </Card>

          {/* Pause button */}
          <ActionButton
            label={isPaused ? "Resume Feed" : "Pause Feed"}
            variant={isPaused ? "primary" : "default"}
            onClick={() => setIsPaused(!isPaused)}
          />
        </div>
      </div>

    </div>
  );
}
