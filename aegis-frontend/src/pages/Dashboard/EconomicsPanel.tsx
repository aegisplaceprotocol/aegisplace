import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { T } from "./theme";
import { Card, CardHead, PageHeader, StatTile, TabBar, FilterChips, MiniTable, ProgressBar } from "./primitives";

/* ── Demo data ─────────────────────────────────────────────────────────── */

const TOTAL_REV = 307549;

const FEE_SPLITS = [
  { label: "Creator", pct: 60, color: "rgba(255,255,255,0.35)" },
  { label: "Validators", pct: 15, color: "rgba(255,255,255,0.25)" },
  { label: "Stakers", pct: 12, color: "rgba(255,255,255,0.20)" },
  { label: "Treasury", pct: 8, color: "rgba(255,255,255,0.15)" },
  { label: "Insurance", pct: 3, color: "rgba(255,255,255,0.10)" },
  { label: "Burned", pct: 2, color: "rgba(255,255,255,0.06)" },
];

const MONTHLY_REVENUE = [
  18200, 22400, 19800, 25100, 28700, 24300, 31200, 27800, 33400, 29100, 35600, 30755,
];
const MONTH_LABELS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

const REV_BY_TYPE = [
  { type: "AI Inference", revenue: "$142,012", pct: "46.2%" },
  { type: "Data Services", revenue: "$67,661", pct: "22.0%" },
  { type: "Compute", revenue: "$52,283", pct: "17.0%" },
  { type: "Search", revenue: "$30,755", pct: "10.0%" },
  { type: "Other", revenue: "$14,838", pct: "4.8%" },
];

const SUPPLY_DIST = [
  { label: "Circulating", amount: "67,432,891", pct: 67.43, color: T.positive },
  { label: "Staked", amount: "24,891,204", pct: 24.89, color: T.text30 },
  { label: "Treasury", amount: "4,828,712", pct: 4.83, color: T.text50 },
  { label: "Burned", amount: "2,847,193", pct: 2.85, color: T.negative },
];

type Tab = "fees" | "revenue" | "tokens";

/* ── Bar chart (inline SVG) ────────────────────────────────────────────── */

function BarChart({ data, labels, color, width, height }: { data: number[]; labels: string[]; color: string; width: number; height: number }) {
  const max = Math.max(...data);
  const barW = (width - 40) / data.length;
  const gap = 4;
  return (
    <svg viewBox={`0 0 ${width} ${height + 24}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {data.map((v, i) => {
        const bh = (v / max) * (height - 8);
        const x = 20 + i * barW + gap / 2;
        const y = height - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW - gap} height={bh} rx={3} fill={color} opacity={0.7} />
            <text x={x + (barW - gap) / 2} y={height + 16} textAnchor="middle" fill={T.text20} fontSize={9} fontFamily="inherit">
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Component ─────────────────────────────────────────────────────────── */

export default function EconomicsPanel() {
  const [tab, setTab] = useState<Tab>("fees");
  const [revPeriod, setRevPeriod] = useState<"daily" | "weekly" | "monthly" | "all">("monthly");

  const statsQuery = trpc.stats.overview.useQuery(undefined, { staleTime: 60_000 });
  const stats = statsQuery.data as Record<string, any> | undefined;

  // Use real totalEarnings when available, fallback to demo
  const totalRev = stats?.totalEarnings ? Number(stats.totalEarnings) : TOTAL_REV;

  return (
    <div>
      <PageHeader
        title="Protocol Economics"
        subtitle="Revenue flows, fee distribution, and token metrics"
      />

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatTile label="Protocol Revenue" value={`$${totalRev.toLocaleString()}`} accent={T.positive} />
        <StatTile label="Treasury Balance" value={`$${Math.round(totalRev * 0.08).toLocaleString()}`} accent={T.text50} />
        <StatTile label="Insurance Fund" value={`$${Math.round(totalRev * 0.03).toLocaleString()}`} />
        <StatTile label="Staker APY" value="18.4%" accent={T.text30} />
      </div>

      <TabBar
        tabs={[
          { id: "fees" as Tab, label: "Fee Distribution" },
          { id: "revenue" as Tab, label: "Revenue" },
          { id: "tokens" as Tab, label: "Token Metrics" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* ── Fee Distribution ──────────────────────────────────────────── */}
      {tab === "fees" && (
        <Card>
          <CardHead label="Fee Waterfall" action={<span style={{ fontSize: 11, color: T.text30 }}>Based on ${totalRev.toLocaleString()} total revenue</span>} />
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {FEE_SPLITS.map((s, i) => {
                const dollar = Math.round(totalRev * s.pct / 100);
                return (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
                        <span style={{ fontSize: 13, color: T.text50, fontWeight: 500 }}>{s.label}</span>
                      </div>
                      <div style={{ display: "flex", gap: 16 }}>
                        <span style={{ fontSize: 13, color: T.text50, fontVariantNumeric: "tabular-nums" }}>
                          ${dollar.toLocaleString()}
                        </span>
                        <span style={{ fontSize: 13, color: T.text80, fontWeight: 600, fontVariantNumeric: "tabular-nums", width: 40, textAlign: "right" }}>
                          {s.pct}%
                        </span>
                      </div>
                    </div>
                    <ProgressBar value={s.pct} color={s.color} />
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* ── Revenue ───────────────────────────────────────────────────── */}
      {tab === "revenue" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <CardHead
              label="Monthly Revenue"
              action={
                <FilterChips
                  options={[
                    { id: "daily" as const, label: "Daily" },
                    { id: "weekly" as const, label: "Weekly" },
                    { id: "monthly" as const, label: "Monthly" },
                    { id: "all" as const, label: "All Time" },
                  ]}
                  active={revPeriod}
                  onChange={setRevPeriod}
                />
              }
            />
            <div style={{ padding: "20px 20px 8px" }}>
              <BarChart data={MONTHLY_REVENUE} labels={MONTH_LABELS} color="rgba(255,255,255,0.20)" width={800} height={180} />
            </div>
          </Card>

          <Card>
            <CardHead label="Revenue by Operator Type" />
            <MiniTable
              headers={["Type", "Revenue", "% of Total"]}
              rows={REV_BY_TYPE.map(r => [r.type, r.revenue, r.pct])}
            />
          </Card>
        </div>
      )}

      {/* ── Token Metrics ─────────────────────────────────────────────── */}
      {tab === "tokens" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <CardHead label="Supply Distribution" />
            <div style={{ padding: 20 }}>
              {/* Total supply */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, color: T.text20, letterSpacing: "0.02em", fontWeight: 500, marginBottom: 6 }}>
                  Total Supply
                </div>
                <div style={{ fontSize: 32, fontWeight: 400, color: T.text80, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
                  100,000,000
                </div>
              </div>

              {/* Stacked bar */}
              <div style={{ display: "flex", height: 28, borderRadius: 6, overflow: "hidden", marginBottom: 24 }}>
                {SUPPLY_DIST.map((s, i) => (
                  <div key={i} style={{ width: `${s.pct}%`, background: s.color, opacity: 0.8 }} />
                ))}
              </div>

              {/* Legend rows */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {SUPPLY_DIST.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: T.white3, borderRadius: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, opacity: 0.8 }} />
                      <span style={{ fontSize: 13, color: T.text50, fontWeight: 500 }}>{s.label}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.text80, fontVariantNumeric: "tabular-nums" }}>
                        {s.amount}
                      </div>
                      <div style={{ fontSize: 11, color: T.text30, fontVariantNumeric: "tabular-nums" }}>
                        {s.pct}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
