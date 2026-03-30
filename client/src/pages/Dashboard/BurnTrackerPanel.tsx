import React from "react";
import { trpc } from "@/lib/trpc";
import { T } from "./theme";
import { Card, CardHead, PageHeader, StatTile, MiniTable, MonoValue, ProgressBar } from "./primitives";

/* ── Demo data ─────────────────────────────────────────────────────────── */

const BURN_CHART = [
  120000, 215000, 340000, 480000, 590000, 720000, 830000, 950000, 1040000, 1150000,
  1240000, 1350000, 1430000, 1540000, 1620000, 1730000, 1810000, 1900000, 1980000, 2060000,
  2140000, 2220000, 2310000, 2400000, 2490000, 2560000, 2640000, 2720000, 2790000, 2847193,
];

const BURN_SOURCES = [
  { label: "Invocation Fees", pct: 72, color: T.text50 },
  { label: "Dispute Slashing", pct: 15, color: T.text50 },
  { label: "Protocol Burns", pct: 13, color: T.text50 },
];

const RECENT_BURNS = [
  { time: "2 min ago", amount: "1,247", source: "Invocation", tx: "5Kx9...mR3f" },
  { time: "8 min ago", amount: "892", source: "Invocation", tx: "7Yz2...pQ4a" },
  { time: "15 min ago", amount: "3,100", source: "Dispute Slash", tx: "9Ab7...kL2m" },
  { time: "22 min ago", amount: "541", source: "Invocation", tx: "2Cd4...nH8v" },
  { time: "31 min ago", amount: "1,890", source: "Protocol Burn", tx: "4Ef1...jR6w" },
  { time: "45 min ago", amount: "723", source: "Invocation", tx: "6Gh3...bT5x" },
  { time: "1h ago", amount: "2,104", source: "Invocation", tx: "8Ij6...dV9y" },
  { time: "1.5h ago", amount: "456", source: "Invocation", tx: "1Kl8...fX2z" },
  { time: "2h ago", amount: "5,200", source: "Dispute Slash", tx: "3Mn0...hZ4a" },
  { time: "2.5h ago", amount: "1,018", source: "Protocol Burn", tx: "5Op2...jB6c" },
];

/* ── Chart helper ──────────────────────────────────────────────────────── */

function AreaChart({ data, color, width, height }: { data: number[]; color: string; width: number; height: number }) {
  const pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (width - pad * 2);
      const y = pad + (1 - (v - min) / range) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");
  const lastX = pts.split(" ").at(-1)!.split(",")[0];
  const polyFill = `${pad},${height} ${pts} ${lastX},${height}`;
  const gradId = `burn-grad`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={polyFill} fill={`url(#${gradId})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

/* ── Component ─────────────────────────────────────────────────────────── */

export default function BurnTrackerPanel() {
  const statsQuery = trpc.stats.overview.useQuery(undefined, { staleTime: 60_000 });
  const stats = statsQuery.data as Record<string, any> | undefined;

  // Compute burn metrics from totalEarnings * 2% burn rate
  const totalEarnings = stats?.totalEarnings ? Number(stats.totalEarnings) : 0;
  const totalBurned = totalEarnings > 0 ? Math.round(totalEarnings * 0.02) : 2847193;
  const dailyBurn = totalEarnings > 0 ? Math.round((totalEarnings * 0.02) / 30) : 4219;
  const weeklyBurn = dailyBurn * 7;
  const supplyImpact = totalEarnings > 0 ? ((totalBurned / 100_000_000) * 100).toFixed(2) : "2.85";
  const annualProjected = Math.round(dailyBurn * 365);

  return (
    <div>
      <PageHeader
        title="$AEGIS Burn Tracker"
        subtitle="Real-time token burn monitoring and supply impact analysis"
      />

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatTile label="Total Burned" value={totalBurned.toLocaleString()} accent={T.text50} />
        <StatTile label="Burn Rate (24h)" value={`${dailyBurn.toLocaleString()}/day`} accent={T.text50} />
        <StatTile label="Weekly Burn" value={weeklyBurn.toLocaleString()} accent={T.text50} />
        <StatTile label="Supply Impact" value={`${supplyImpact}%`} sub="of initial supply" accent={T.text50} />
      </div>

      {/* Cumulative burn chart */}
      <Card style={{ marginBottom: 20 }}>
        <CardHead label="Cumulative Burn (30 Days)" />
        <div style={{ padding: "20px 20px 16px" }}>
          <AreaChart data={BURN_CHART} color={T.text50} width={800} height={200} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 10, color: T.text20 }}>30 days ago</span>
            <span style={{ fontSize: 10, color: T.text20 }}>Today</span>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 20 }}>
        {/* Burn breakdown */}
        <Card>
          <CardHead label="Burn Sources Breakdown" />
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {BURN_SOURCES.map((s, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: T.text50, fontWeight: 500 }}>{s.label}</span>
                    <span style={{ fontSize: 13, color: T.text80, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                      {s.pct}%
                    </span>
                  </div>
                  <ProgressBar value={s.pct} color={s.color} />
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Projected annual burn */}
        <Card>
          <CardHead label="Projected Annual Burn Rate" />
          <div style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "center", height: "calc(100% - 45px)" }}>
            <div style={{ fontSize: 48, fontWeight: 400, color: T.text50, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 8 }}>
              {annualProjected.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: T.text30, marginBottom: 20 }}>
              tokens projected to burn annually at current rate
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              <div>
                <div style={{ fontSize: 10, color: T.text20, letterSpacing: "0.02em", fontWeight: 500, marginBottom: 4 }}>
                  % of Circulating
                </div>
                <div style={{ fontSize: 20, fontWeight: 400, color: T.text80, fontVariantNumeric: "tabular-nums" }}>
                  2.28%
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: T.text20, letterSpacing: "0.02em", fontWeight: 500, marginBottom: 4 }}>
                  Circulating Supply
                </div>
                <div style={{ fontSize: 20, fontWeight: 400, color: T.text80, fontVariantNumeric: "tabular-nums" }}>
                  67,432,891
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent burns table */}
      <Card>
        <CardHead label="Recent Burns" />
        <MiniTable
          headers={["Time", "Amount", "Source", "Transaction"]}
          rows={RECENT_BURNS.map(b => [
            b.time,
            <MonoValue color={T.text50}>{b.amount}</MonoValue>,
            b.source,
            <MonoValue color={T.text30}>{b.tx}</MonoValue>,
          ])}
        />
      </Card>
    </div>
  );
}
