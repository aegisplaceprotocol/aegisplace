import React, { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { BrandIcon, cleanOperatorName } from "./brand-icons";
import { T } from "./theme";
import {
  Card,
  CardHead,
  PageHeader,
  StatusBadge,
  FilterChips,
  ActionButton,
  MonoValue,
  ProgressBar,
} from "./primitives";

/* ── Types ────────────────────────────────────────────────────────────── */

interface Operator {
  id: string;
  name: string;
  slug: string;
  category: string;
  qualityScore: number;
  pricePerCall: string;
  totalInvocations: number;
  successRate: number;
  isActive: boolean;
  isVerified: boolean;
  avgLatency: string;
  creator: string;
  description: string;
  recentInvocations: { caller: string; time: string; status: string; latency: string; amount: string }[];
  weeklyUsage: number[];
  validatorAttestations: { validator: string; score: number; date: string }[];
}

/* ── (demo arrays removed — data comes from trpc.operator.list) ───────── */

const CATEGORIES = [
  { id: "All", label: "All" },
  { id: "AI / ML", label: "AI / ML" },
  { id: "Development", label: "Development" },
  { id: "Security", label: "Security" },
  { id: "Data", label: "Data" },
  { id: "DeFi", label: "DeFi" },
  { id: "Infrastructure", label: "Infrastructure" },
  { id: "Other", label: "Other" },
];

const STATUS_OPTIONS = [
  { id: "All", label: "All" },
  { id: "Active", label: "Active" },
  { id: "Inactive", label: "Inactive" },
  { id: "Verified", label: "Verified" },
];

const PRICE_OPTIONS = [
  { id: "any", label: "Any" },
  { id: "free", label: "Free" },
  { id: "0.01", label: "Under $0.01" },
  { id: "0.10", label: "Under $0.10" },
];

/* ── Styles ───────────────────────────────────────────────────────────── */

const INPUT: React.CSSProperties = {
  width: "100%",
  background: T.white4,
  border: `1px solid ${T.border}`,
  borderRadius: 6,
  padding: "8px 12px",
  fontSize: 13,
  color: T.text80,
  outline: "none",
  fontFamily: "inherit",
};

const LABEL: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.02em",
  fontWeight: 500,
  color: T.text20,
};

/* ── Helpers ──────────────────────────────────────────────────────────── */

function trustColor(score: number): string {
  if (score >= 80) return T.positive;
  if (score >= 60) return T.text50;
  return T.negative;
}

type SortKey = "name" | "qualityScore" | "pricePerCall" | "totalInvocations" | "successRate";

/* ── Component ────────────────────────────────────────────────────────── */

export default function OperatorDirectoryPanel() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priceFilter, setPriceFilter] = useState("any");
  const [trustMin, setTrustMin] = useState("");
  const [trustMax, setTrustMax] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalInvocations");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const operatorsQuery = trpc.operator.list.useQuery(
    { limit: 50, sortBy: "trust" },
    { staleTime: 60_000 },
  );

  const rawOperators: any[] = (operatorsQuery.data as any)?.operators ?? [];

  // Map real operators to local Operator shape
  const OPERATORS_DATA: Operator[] = rawOperators.map((op: any, i: number) => ({
    id: String(op.id ?? `api-${i}`),
    name: op.name ?? "Unknown Operator",
    slug: op.slug ?? "unknown",
    category: op.category ?? "Other",
    qualityScore: op.qualityScore ?? 50,
    pricePerCall: op.pricePerCall ? `$${op.pricePerCall}` : "$0.00",
    totalInvocations: op.totalInvocations ?? 0,
    successRate: op.successfulInvocations && op.totalInvocations
      ? Number(((op.successfulInvocations / op.totalInvocations) * 100).toFixed(1))
      : 0,
    isActive: op.isActive ?? false,
    isVerified: op.isVerified ?? false,
    avgLatency: op.avgResponseMs ? `${op.avgResponseMs}ms` : "0ms",
    creator: op.creatorWallet ? `${op.creatorWallet.slice(0, 6)}...${op.creatorWallet.slice(-4)}` : "unknown",
    description: op.description ?? op.tagline ?? "",
    recentInvocations: [],
    weeklyUsage: [0, 0, 0, 0, 0, 0, 0],
    validatorAttestations: [],
  }));

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const filtered = useMemo(() => {
    let result = OPERATORS_DATA.filter((op) => {
      if (category !== "All" && op.category !== category) return false;
      if (statusFilter === "Active" && !op.isActive) return false;
      if (statusFilter === "Inactive" && op.isActive) return false;
      if (statusFilter === "Verified" && !op.isVerified) return false;
      if (priceFilter === "free" && parseFloat(op.pricePerCall.replace("$", "")) > 0) return false;
      if (priceFilter === "0.01" && parseFloat(op.pricePerCall.replace("$", "")) >= 0.01) return false;
      if (priceFilter === "0.10" && parseFloat(op.pricePerCall.replace("$", "")) >= 0.10) return false;
      if (trustMin && op.qualityScore < parseInt(trustMin)) return false;
      if (trustMax && op.qualityScore > parseInt(trustMax)) return false;
      if (search && !op.name.toLowerCase().includes(search.toLowerCase()) && !op.slug.includes(search.toLowerCase())) return false;
      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "qualityScore") cmp = a.qualityScore - b.qualityScore;
      else if (sortKey === "pricePerCall") cmp = parseFloat(a.pricePerCall.replace("$", "")) - parseFloat(b.pricePerCall.replace("$", ""));
      else if (sortKey === "totalInvocations") cmp = a.totalInvocations - b.totalInvocations;
      else if (sortKey === "successRate") cmp = a.successRate - b.successRate;
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [search, category, statusFilter, priceFilter, trustMin, trustMax, sortKey, sortAsc, OPERATORS_DATA]);

  const expanded = expandedId ? OPERATORS_DATA.find((o) => o.id === expandedId) : null;

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortAsc ? " \u2191" : " \u2193";
  };

  const miniChartWidth = 100;
  const miniChartHeight = 30;

  return (
    <div>
      <PageHeader
        title="Operator Directory"
        subtitle="Search and filter all registered operators"
      />

      {/* Search + filters */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="text"
            placeholder="Search operators by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={INPUT}
          />
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
            <FilterChips options={CATEGORIES} active={category} onChange={setCategory} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
            <FilterChips options={STATUS_OPTIONS} active={statusFilter} onChange={setStatusFilter} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: T.text30 }}>Trust:</span>
              <input
                type="number"
                placeholder="Min"
                value={trustMin}
                onChange={(e) => setTrustMin(e.target.value)}
                style={{ ...INPUT, width: 60, padding: "4px 8px", fontSize: 11 }}
              />
              <span style={{ color: T.text20 }}>-</span>
              <input
                type="number"
                placeholder="Max"
                value={trustMax}
                onChange={(e) => setTrustMax(e.target.value)}
                style={{ ...INPUT, width: 60, padding: "4px 8px", fontSize: 11 }}
              />
            </div>
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              style={{
                background: T.white4,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: 11,
                color: T.text50,
                outline: "none",
                cursor: "pointer",
              }}
            >
              {PRICE_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <span style={{ fontSize: 11, color: T.text20 }}>{filtered.length} results</span>
          </div>
        </div>
      </Card>

      {/* Results table */}
      <Card>
        <CardHead label="Operators" action={<span style={{ fontSize: 11, color: T.text20 }}>{filtered.length} operators</span>} />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {([
                  { key: "name" as SortKey, label: "Operator", align: "left" },
                  { key: null, label: "Slug", align: "left" },
                  { key: null, label: "Category", align: "left" },
                  { key: "qualityScore" as SortKey, label: "Trust", align: "right" },
                  { key: "pricePerCall" as SortKey, label: "Price", align: "right" },
                  { key: "totalInvocations" as SortKey, label: "Invocations", align: "right" },
                  { key: "successRate" as SortKey, label: "Success", align: "right" },
                  { key: null, label: "Status", align: "center" },
                  { key: null, label: "", align: "center" },
                ] as const).map((col, i) => (
                  <th
                    key={i}
                    onClick={col.key ? () => handleSort(col.key!) : undefined}
                    style={{
                      ...LABEL,
                      textAlign: col.align as React.CSSProperties["textAlign"],
                      padding: "10px 12px",
                      borderBottom: `1px solid ${T.border}`,
                      cursor: col.key ? "pointer" : "default",
                      whiteSpace: "nowrap",
                      userSelect: "none",
                    }}
                  >
                    {col.label}{col.key ? sortIndicator(col.key) : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {operatorsQuery.isLoading && (
                <tr>
                  <td colSpan={9} style={{ padding: "32px 16px", textAlign: "center", fontSize: 12, color: T.text20 }}>
                    Loading operators...
                  </td>
                </tr>
              )}
              {!operatorsQuery.isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: "32px 16px", textAlign: "center", fontSize: 12, color: T.text20 }}>
                    No operators found.
                  </td>
                </tr>
              )}
              {filtered.map((op) => (
                <React.Fragment key={op.id}>
                  <tr
                    onClick={() => setExpandedId(expandedId === op.id ? null : op.id)}
                    style={{
                      borderBottom: `1px solid ${T.border}`,
                      cursor: "pointer",
                      background: expandedId === op.id ? T.white3 : "transparent",
                      transition: "background 0.15s",
                    }}
                  >
                    <td style={{ padding: "12px 12px", fontSize: 13, fontWeight: 600, color: T.text80 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <BrandIcon name={op.name} size={16} />
                        {cleanOperatorName(op.name)}
                      </span>
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <MonoValue color={T.text30}>{op.slug}</MonoValue>
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <StatusBadge status={op.category} color="blue" />
                    </td>
                    <td style={{ padding: "12px 12px", textAlign: "right" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: trustColor(op.qualityScore), fontVariantNumeric: "tabular-nums" }}>
                        {op.qualityScore}
                      </span>
                    </td>
                    <td style={{ padding: "12px 12px", fontSize: 13, color: T.text50, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {op.pricePerCall}
                    </td>
                    <td style={{ padding: "12px 12px", fontSize: 13, color: T.text50, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {op.totalInvocations.toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 12px", fontSize: 13, color: T.text50, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {op.successRate}%
                    </td>
                    <td style={{ padding: "12px 12px", textAlign: "center" }}>
                      <StatusBadge
                        status={!op.isActive ? "Inactive" : op.isVerified ? "Verified" : "Active"}
                        color={!op.isActive ? "red" : op.isVerified ? "green" : "amber"}
                      />
                    </td>
                    <td style={{ padding: "12px 12px", textAlign: "center" }}>
                      <ActionButton label="Invoke" variant="primary" />
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  {expandedId === op.id && (
                    <tr>
                      <td colSpan={9} style={{ padding: 0 }}>
                        <div style={{ padding: "20px 24px", background: T.white3, borderBottom: `1px solid ${T.border}` }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 24, marginBottom: 20 }}>
                            {/* Mini chart */}
                            <div>
                              <div style={{ ...LABEL, marginBottom: 8 }}>7-Day Usage</div>
                              <svg width={miniChartWidth} height={miniChartHeight} viewBox={`0 0 ${miniChartWidth} ${miniChartHeight}`}>
                                {(() => {
                                  const max = Math.max(...op.weeklyUsage, 1);
                                  const step = miniChartWidth / (op.weeklyUsage.length - 1);
                                  const pts = op.weeklyUsage.map((v, i) => `${i * step},${miniChartHeight - (v / max) * (miniChartHeight - 4)}`).join(" ");
                                  return (
                                    <>
                                      <polyline points={pts} fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="1.5" />
                                      {op.weeklyUsage.map((v, i) => (
                                        <circle key={i} cx={i * step} cy={miniChartHeight - (v / max) * (miniChartHeight - 4)} r="2" fill="rgba(255,255,255,0.20)" />
                                      ))}
                                    </>
                                  );
                                })()}
                              </svg>
                            </div>

                            {/* Success rate */}
                            <div>
                              <div style={{ ...LABEL, marginBottom: 8 }}>Success Rate</div>
                              <div style={{ fontSize: 20, fontWeight: 400, color: T.positive }}>{op.successRate}%</div>
                              <ProgressBar value={op.successRate} color={T.positive} />
                            </div>

                            {/* Avg latency */}
                            <div>
                              <div style={{ ...LABEL, marginBottom: 8 }}>Avg Latency</div>
                              <div style={{ fontSize: 20, fontWeight: 400, color: T.text50 }}>{op.avgLatency}</div>
                            </div>
                          </div>

                          {/* Validator attestations */}
                          {op.validatorAttestations.length > 0 && (
                            <div style={{ marginBottom: 20 }}>
                              <div style={{ ...LABEL, marginBottom: 8 }}>Validator Attestations</div>
                              {op.validatorAttestations.map((att, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0", fontSize: 12 }}>
                                  <span style={{ color: T.text50, fontWeight: 600 }}>{att.validator}</span>
                                  <span style={{ color: trustColor(att.score), fontWeight: 500 }}>{att.score}</span>
                                  <span style={{ color: T.text20 }}>{att.date}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Recent invocations */}
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ ...LABEL, marginBottom: 8 }}>Recent Invocations</div>
                            <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <thead>
                                <tr>
                                  {["Caller", "Time", "Status", "Latency", "Amount"].map((h, i) => (
                                    <th key={i} style={{
                                      ...LABEL,
                                      textAlign: i === 0 ? "left" : "right",
                                      padding: "6px 8px",
                                      borderBottom: `1px solid ${T.border}`,
                                    }}>
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {op.recentInvocations.map((inv, i) => (
                                  <tr key={i} style={{ borderBottom: i < op.recentInvocations.length - 1 ? `1px solid ${T.border}` : undefined }}>
                                    <td style={{ padding: "8px 8px", fontSize: 11 }}>
                                      <MonoValue color={T.text50}>{inv.caller}</MonoValue>
                                    </td>
                                    <td style={{ padding: "8px 8px", fontSize: 11, color: T.text30, textAlign: "right" }}>{inv.time}</td>
                                    <td style={{ padding: "8px 8px", textAlign: "right" }}>
                                      <StatusBadge status={inv.status} />
                                    </td>
                                    <td style={{ padding: "8px 8px", fontSize: 11, color: T.text50, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{inv.latency}</td>
                                    <td style={{ padding: "8px 8px", fontSize: 11, color: T.text50, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{inv.amount}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            </div>
                          </div>

                          {/* Invoke from dashboard */}
                          <div style={{ ...LABEL, marginBottom: 8 }}>Invoke from Dashboard</div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <input
                              type="text"
                              placeholder='{"prompt": "your input"}'
                              style={{ ...INPUT, flex: 1, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
                              readOnly
                            />
                            <ActionButton label="Invoke" variant="primary" />
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
    </div>
  );
}
