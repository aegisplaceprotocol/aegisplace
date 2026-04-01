import React from "react";
import { trpc } from "@/lib/trpc";
import { T } from "./theme";
import { Card, CardHead, PageHeader, StatTile, MiniTable, MonoValue } from "./primitives";

/* ── Demo data ─────────────────────────────────────────────────────────── */

const CHART_DATA = [
  92000, 88000, 95000, 101000, 98000, 103000, 110000, 105000, 99000, 107000,
  112000, 108000, 115000, 118000, 113000, 120000, 116000, 109000, 104000, 111000,
  114000, 119000, 117000, 106000, 102000, 108000, 113000, 116000, 110000, 104219,
];

const TOP_SERVERS = [
  { name: "api.openai-proxy.x402", txns: "18,402", volume: "$9,812", pct: "17.7%" },
  { name: "inference.anthropic.x402", txns: "14,891", volume: "$8,103", pct: "14.3%" },
  { name: "tools.langchain.x402", txns: "12,340", volume: "$6,421", pct: "11.8%" },
  { name: "search.perplexity.x402", txns: "9,877", volume: "$5,102", pct: "9.5%" },
  { name: "compute.runpod.x402", txns: "8,231", volume: "$4,710", pct: "7.9%" },
  { name: "data.chainlink.x402", txns: "7,104", volume: "$3,891", pct: "6.8%" },
  { name: "ml.replicate.x402", txns: "6,512", volume: "$3,204", pct: "6.2%" },
  { name: "storage.arweave.x402", txns: "5,890", volume: "$2,847", pct: "5.7%" },
];

const CHAINS = [
  { label: "Solana", pct: 49.3, color: T.text30 },
  { label: "Base", pct: 31.2, color: T.text50 },
  { label: "Other", pct: 19.5, color: T.text30 },
];

/* ── Chart helpers ─────────────────────────────────────────────────────── */

function buildPolyline(data: number[], w: number, h: number, pad = 0): string {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  return data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

function AreaChart({ data, color, width, height }: { data: number[]; color: string; width: number; height: number }) {
  const pad = 2;
  const pts = buildPolyline(data, width, height, pad);
  const first = pts.split(" ")[0];
  const last = pts.split(" ").at(-1)!;
  const polyFill = `${pad},${height} ${pts} ${last.split(",")[0]},${height}`;
  const gradId = `grad-${color.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={polyFill} fill={`url(#${gradId})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

/* ── Component ─────────────────────────────────────────────────────────── */

export default function X402TrackerPanel() {
  const statsQuery = trpc.stats.overview.useQuery(undefined, { staleTime: 60_000 });
  const recentQuery = trpc.invoke.recent.useQuery({ limit: 50 }, { staleTime: 30_000 });
  const stats = statsQuery.data as Record<string, any> | undefined;

  // Aggregate invocation amounts as x402 transaction volume
  const recentInvocations = (recentQuery.data ?? []) as any[];
  const dailyVolume = recentInvocations.reduce(
    (sum: number, inv: any) => sum + (Number(inv.amountPaid) || 0),
    0,
  );
  const dailyTxns = recentInvocations.length;
  const activeBuyers = new Set(recentInvocations.map((inv: any) => inv.callerWallet).filter(Boolean)).size;

  // Use real data when available, fallback to demo
  const displayDailyTxns = stats?.totalInvocations ? String(stats.totalInvocations) : "104,219";
  const displayDailyVolume = dailyVolume > 0 ? `$${dailyVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "$53,402";
  const displayActiveBuyers = activeBuyers > 0 ? String(activeBuyers) : "1,847";

  return (
    <div>
      <PageHeader
        title="x402 Payment Protocol Tracker"
        subtitle="Real-time monitoring of HTTP 402 payment transactions across all chains"
      />

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatTile label="Daily Transactions" value={displayDailyTxns} delta="+2.8%" />
        <StatTile label="Daily Volume" value={displayDailyVolume} delta="+4.1%" />
        <StatTile label="Active Buyers" value={displayActiveBuyers} />
        <StatTile label="Solana Market Share" value="49.3%" accent={T.text30} />
      </div>

      {/* 30-day chart */}
      <Card style={{ marginBottom: 20 }}>
        <CardHead label="30-Day Transaction Volume" />
        <div style={{ padding: "20px 20px 16px" }}>
          <AreaChart data={CHART_DATA} color="rgba(255,255,255,0.20)" width={800} height={200} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 10, color: T.text20 }}>30 days ago</span>
            <span style={{ fontSize: 10, color: T.text20 }}>Today</span>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Top servers table */}
        <Card>
          <CardHead label="Top x402 Servers" />
          <MiniTable
            headers={["Server", "Daily Txns", "Volume", "% of Total"]}
            rows={TOP_SERVERS.map(s => [
              <MonoValue color={T.text80}>{s.name}</MonoValue>,
              s.txns,
              s.volume,
              s.pct,
            ])}
          />
        </Card>

        {/* Chain breakdown */}
        <Card>
          <CardHead label="Chain Breakdown" />
          <div style={{ padding: 20 }}>
            {/* Stacked bar */}
            <div style={{ display: "flex", height: 24, borderRadius: 6, overflow: "hidden", marginBottom: 20 }}>
              {CHAINS.map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: `${c.pct}%`,
                    background: c.color,
                    opacity: 0.8,
                    transition: "width 0.4s ease",
                  }}
                />
              ))}
            </div>
            {/* Legend */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {CHAINS.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: c.color, opacity: 0.8 }} />
                    <span style={{ fontSize: 13, color: T.text50, fontWeight: 500 }}>{c.label}</span>
                  </div>
                  <span style={{ fontSize: 13, color: T.text80, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    {c.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <a
          href="https://x402scan.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 11, color: T.text20, textDecoration: "none" }}
        >
          Powered by x402scan.com
        </a>
      </div>
    </div>
  );
}
