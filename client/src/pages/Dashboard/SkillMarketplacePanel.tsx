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

interface Skill {
  id: string;
  name: string;
  creator: string;
  creatorWallet: string;
  category: string;
  pricingModel: "Pay-per-call" | "Subscription" | "Free";
  pricePerCall: string;
  trustScore: number;
  monthlyInvocations: number;
  totalEarnings: string;
  rating: number;
  description: string;
  composableWith: string[];
  dependents: string[];
  tags: string[];
  version: string;
  successRate: number;
  avgLatency: string;
}

interface Creator {
  name: string;
  skills: number;
  totalEarnings: string;
  avgRating: number;
}

/* ── Demo data ────────────────────────────────────────────────────────── */

const SKILLS: Skill[] = [
  {
    id: "s1", name: "Contract Vulnerability Scanner", creator: "AuditDAO", creatorWallet: "0x7a3B...e91f",
    category: "Security", pricingModel: "Pay-per-call", pricePerCall: "$0.05", trustScore: 97,
    monthlyInvocations: 284200, totalEarnings: "$127,800", rating: 4.9,
    description: "Scans smart contracts for 47 known vulnerability patterns. Catches reentrancy, overflow, access control, and logic bugs.",
    composableWith: ["Risk Assessment Engine", "Report Generator"], dependents: ["DeFi Alpha Scanner", "Audit Pipeline"],
    tags: ["security", "audit", "solidity"], version: "3.4.1", successRate: 99.7, avgLatency: "3.2s",
  },
  {
    id: "s2", name: "50-DEX Swap Router", creator: "RouteMax", creatorWallet: "0x3b1C...c44d",
    category: "Trading", pricingModel: "Pay-per-call", pricePerCall: "$0.02", trustScore: 96,
    monthlyInvocations: 1413000, totalEarnings: "$282,600", rating: 4.8,
    description: "Finds the best swap route across 50 DEXs simultaneously. Saves 2.3% per trade on average.",
    composableWith: ["Gas Fee Predictor", "Token Analyzer"], dependents: ["DeFi Alpha Scanner"],
    tags: ["defi", "swap", "routing"], version: "5.1.0", successRate: 99.4, avgLatency: "1.8s",
  },
  {
    id: "s3", name: "Sentiment Pulse Engine", creator: "SentimentDAO", creatorWallet: "0x5f82...b22c",
    category: "Analytics", pricingModel: "Subscription", pricePerCall: "$0.01", trustScore: 92,
    monthlyInvocations: 1768000, totalEarnings: "$176,800", rating: 4.6,
    description: "Real-time sentiment across Twitter, Discord, Telegram, and Reddit. Clear bullish/bearish scoring.",
    composableWith: ["Signal Generator", "Portfolio Manager"], dependents: ["Alpha Scanner"],
    tags: ["sentiment", "social", "analytics"], version: "4.2.0", successRate: 98.8, avgLatency: "2.4s",
  },
  {
    id: "s4", name: "Gas Fee Oracle", creator: "GasWise", creatorWallet: "0x1d4A...f88a",
    category: "Infrastructure", pricingModel: "Pay-per-call", pricePerCall: "$0.002", trustScore: 91,
    monthlyInvocations: 1920000, totalEarnings: "$38,400", rating: 4.5,
    description: "Predicts the cheapest time to transact in the next 24 hours. Saves 34% on gas fees.",
    composableWith: ["Transaction Builder", "Swap Router"], dependents: ["Yield Strategy", "Bridge Finder"],
    tags: ["gas", "optimization"], version: "1.9.3", successRate: 97.8, avgLatency: "0.8s",
  },
  {
    id: "s5", name: "Whale Wallet Tracker", creator: "DeepSea", creatorWallet: "0xaa17...f77c",
    category: "Analytics", pricingModel: "Subscription", pricePerCall: "$0.015", trustScore: 96,
    monthlyInvocations: 2064000, totalEarnings: "$309,600", rating: 4.8,
    description: "Tracks 5,000+ whale wallets across 8 chains with sub-second alerts.",
    composableWith: ["Signal Generator", "Swap Router"], dependents: ["DeFi Alpha Scanner"],
    tags: ["whale", "tracking", "alerts"], version: "7.3.0", successRate: 99.5, avgLatency: "0.4s",
  },
  {
    id: "s6", name: "Code Review Agent", creator: "DevGuard", creatorWallet: "0x6b3F...a99d",
    category: "Content", pricingModel: "Pay-per-call", pricePerCall: "$0.08", trustScore: 94,
    monthlyInvocations: 116000, totalEarnings: "$92,800", rating: 4.7,
    description: "Reviews code like a senior engineer. Catches bugs, suggests improvements, enforces best practices.",
    composableWith: ["CI Pipeline Builder", "Test Generator"], dependents: ["Audit Pipeline"],
    tags: ["code-review", "quality"], version: "4.1.0", successRate: 99.3, avgLatency: "6.2s",
  },
  {
    id: "s7", name: "Yield Strategy Optimizer", creator: "YieldDAO", creatorWallet: "0x2e9D...c11b",
    category: "Trading", pricingModel: "Pay-per-call", pricePerCall: "$0.03", trustScore: 95,
    monthlyInvocations: 1258667, totalEarnings: "$377,600", rating: 4.8,
    description: "Scans 200+ DeFi protocols for highest risk-adjusted yield. Auto-compounds and rebalances.",
    composableWith: ["Risk Scorer", "Gas Fee Oracle"], dependents: ["Portfolio Rebalancer"],
    tags: ["yield", "defi", "optimization"], version: "6.0.2", successRate: 98.9, avgLatency: "5.7s",
  },
  {
    id: "s8", name: "NFT Rarity Ranker", creator: "RarityLabs", creatorWallet: "0x8c7E...d55e",
    category: "Data", pricingModel: "Pay-per-call", pricePerCall: "$0.01", trustScore: 55,
    monthlyInvocations: 504000, totalEarnings: "$50,400", rating: 4.4,
    description: "Calculates true rarity of any NFT. Factors in trait combos, statistical outliers, and market weight.",
    composableWith: ["Collection Analyzer", "Price Estimator"], dependents: [],
    tags: ["nft", "rarity"], version: "2.1.0", successRate: 99.1, avgLatency: "1.2s",
  },
  {
    id: "s9", name: "Open Translation Hub", creator: "LexiAI", creatorWallet: "0x9e2B...a77b",
    category: "Content", pricingModel: "Free", pricePerCall: "Free", trustScore: 72,
    monthlyInvocations: 59333, totalEarnings: "...", rating: 4.3,
    description: "Community-driven translation for 40 languages with legal terminology support. Open source.",
    composableWith: ["Document Parser", "Summary Generator"], dependents: ["Compliance Checker"],
    tags: ["translation", "open-source"], version: "1.2.0", successRate: 97.2, avgLatency: "4.1s",
  },
];

const TOP_CREATORS: Creator[] = [
  { name: "YieldDAO", skills: 8, totalEarnings: "$377,600", avgRating: 4.8 },
  { name: "DeepSea", skills: 5, totalEarnings: "$309,600", avgRating: 4.8 },
  { name: "RouteMax", skills: 3, totalEarnings: "$282,600", avgRating: 4.8 },
  { name: "SentimentDAO", skills: 6, totalEarnings: "$176,800", avgRating: 4.6 },
  { name: "AuditDAO", skills: 7, totalEarnings: "$127,800", avgRating: 4.9 },
];

const CATEGORIES = [
  { id: "All", label: "All" },
  { id: "Trading", label: "Trading" },
  { id: "Analytics", label: "Analytics" },
  { id: "Security", label: "Security" },
  { id: "Data", label: "Data" },
  { id: "Content", label: "Content" },
  { id: "Infrastructure", label: "Infrastructure" },
];

const SORT_OPTIONS = ["Most Popular", "Newest", "Highest Rated", "Cheapest"];
const PRICING_FILTERS = ["All", "Pay-per-call", "Subscription", "Free"];

/* ── Styles ───────────────────────────────────────────────────────────── */

const INPUT: React.CSSProperties = {
  width: "100%",
  background: T.white4,
  border: `1px solid ${T.border}`,
  borderRadius: 6,
  padding: "10px 14px",
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

function formatInvocations(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toLocaleString();
}

function renderStars(rating: number): React.ReactNode {
  const full = Math.floor(rating);
  const half = rating - full >= 0.3;
  const stars: React.ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const filled = i < full || (i === full && half);
    stars.push(
      <span key={i} style={{ color: filled ? T.text50 : T.white4, fontSize: 12 }}>
        {"\u2605"}
      </span>
    );
  }
  return <span style={{ display: "inline-flex", gap: 1 }}>{stars}</span>;
}

/* ── Component ────────────────────────────────────────────────────────── */

export default function SkillMarketplacePanel() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("Most Popular");
  const [pricingFilter, setPricingFilter] = useState("All");
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const operatorsQuery = trpc.operator.list.useQuery(
    { limit: 30, sortBy: "trust" },
    { staleTime: 60_000 },
  );

  // Map API operators to skill cards, falling back to demo data
  const skillItems: Skill[] = operatorsQuery.data
    ? (operatorsQuery.data as any[]).map((op: any, i: number) => ({
        id: String(op.id ?? `api-${i}`),
        name: op.name ?? "Unknown Skill",
        creator: op.creatorWallet ? `${op.creatorWallet.slice(0, 6)}...${op.creatorWallet.slice(-4)}` : "Unknown",
        creatorWallet: op.creatorWallet ?? "0x0000...0000",
        category: op.category ?? "Other",
        pricingModel: (parseFloat(op.pricePerCall || "0") === 0 ? "Free" : "Pay-per-call") as Skill["pricingModel"],
        pricePerCall: op.pricePerCall ? `$${op.pricePerCall}` : "Free",
        trustScore: op.trustScore ?? 50,
        monthlyInvocations: op.totalInvocations ?? 0,
        totalEarnings: op.totalEarned ? `$${Number(op.totalEarned).toLocaleString()}` : "$0",
        rating: op.trustScore ? Number((op.trustScore / 20).toFixed(1)) : 3.0,
        description: op.description ?? op.tagline ?? "",
        composableWith: [],
        dependents: [],
        tags: op.tags ?? [],
        version: "1.0.0",
        successRate: op.successfulInvocations && op.totalInvocations
          ? Number(((op.successfulInvocations / op.totalInvocations) * 100).toFixed(1))
          : 95,
        avgLatency: op.avgResponseMs ? `${(op.avgResponseMs / 1000).toFixed(1)}s` : "0s",
      }))
    : SKILLS;

  const filtered = useMemo(() => {
    let result = skillItems.filter((s) => {
      if (category !== "All" && s.category !== category) return false;
      if (pricingFilter !== "All" && s.pricingModel !== pricingFilter) return false;
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.tags.some((t) => t.includes(search.toLowerCase()))) return false;
      return true;
    });

    if (sort === "Most Popular") result.sort((a, b) => b.monthlyInvocations - a.monthlyInvocations);
    else if (sort === "Highest Rated") result.sort((a, b) => b.rating - a.rating);
    else if (sort === "Cheapest") result.sort((a, b) => parseFloat(a.pricePerCall.replace(/[^0-9.]/g, "") || "0") - parseFloat(b.pricePerCall.replace(/[^0-9.]/g, "") || "0"));

    return result;
  }, [search, category, sort, pricingFilter, skillItems]);

  return (
    <div>
      <PageHeader
        title="Skill Marketplace"
        subtitle="Browse, install, and invoke AI skills"
      />

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search skills by name or tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={INPUT}
        />
      </div>

      {/* Filters row */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <FilterChips options={CATEGORIES} active={category} onChange={setCategory} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              background: T.white4,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 12,
              color: T.text50,
              outline: "none",
              cursor: "pointer",
            }}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={pricingFilter}
            onChange={(e) => setPricingFilter(e.target.value)}
            style={{
              background: T.white4,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 12,
              color: T.text50,
              outline: "none",
              cursor: "pointer",
            }}
          >
            {PRICING_FILTERS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <span style={{ fontSize: 11, color: T.text20 }}>{filtered.length} skills found</span>
      </div>

      {/* Skill cards grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 12,
        marginBottom: 32,
      }}>
        {filtered.map((skill) => (
          <Card
            key={skill.id}
            style={{
              cursor: "pointer",
              transition: "border-color 0.2s",
              borderColor: selectedSkill?.id === skill.id ? T.borderHover : undefined,
            }}
          >
            <div
              onClick={() => setSelectedSkill(selectedSkill?.id === skill.id ? null : skill)}
              style={{ padding: 20 }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500, color: T.text80, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <BrandIcon name={skill.name} size={16} />
                    {cleanOperatorName(skill.name)}
                  </div>
                  <div style={{ fontSize: 11, color: T.text20, fontFamily: "'JetBrains Mono', monospace" }}>
                    {skill.creatorWallet}
                  </div>
                </div>
                <span style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: trustColor(skill.trustScore),
                  fontVariantNumeric: "tabular-nums",
                  marginLeft: 12,
                }}>
                  {skill.trustScore}
                </span>
              </div>

              {/* Badges */}
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <StatusBadge status={skill.category} color="blue" />
                <StatusBadge
                  status={skill.pricingModel}
                  color={skill.pricingModel === "Free" ? "green" : skill.pricingModel === "Subscription" ? "purple" : "gray"}
                />
              </div>

              {/* Description */}
              <div style={{
                fontSize: 12,
                color: T.text30,
                lineHeight: 1.5,
                marginBottom: 12,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
                {skill.description}
              </div>

              {/* Price */}
              <div style={{ fontSize: 16, fontWeight: 500, color: T.text80, marginBottom: 10 }}>
                {skill.pricePerCall}<span style={{ fontSize: 11, fontWeight: 400, color: T.text30, marginLeft: 4 }}>per call</span>
              </div>

              {/* Stats row */}
              <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: T.text20 }}>Monthly</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text50, fontVariantNumeric: "tabular-nums" }}>
                    {formatInvocations(skill.monthlyInvocations)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.text20 }}>Earned</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text50, fontVariantNumeric: "tabular-nums" }}>
                    {skill.totalEarnings}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.text20 }}>Rating</div>
                  <div>{renderStars(skill.rating)} <span style={{ fontSize: 11, color: T.text30 }}>{skill.rating}</span></div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <ActionButton label="Install" variant="primary" />
                <ActionButton label="Try Now" variant="default" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Skill Detail Modal */}
      {selectedSkill && (
        <Card style={{ marginBottom: 32 }}>
          <CardHead
            label={`Skill Detail: ${selectedSkill.name}`}
            action={
              <button
                onClick={() => setSelectedSkill(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: T.text30,
                  cursor: "pointer",
                  fontSize: 16,
                  padding: "0 4px",
                }}
              >
                x
              </button>
            }
          />
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 13, color: T.text50, lineHeight: 1.6, marginBottom: 20 }}>
              {selectedSkill.description}
            </div>

            {/* Performance stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginBottom: 20 }}>
              <div>
                <div style={LABEL}>Success Rate</div>
                <div style={{ fontSize: 20, fontWeight: 400, color: T.positive, marginTop: 4 }}>{selectedSkill.successRate}%</div>
                <ProgressBar value={selectedSkill.successRate} color={T.positive} />
              </div>
              <div>
                <div style={LABEL}>Avg Latency</div>
                <div style={{ fontSize: 20, fontWeight: 400, color: T.text50, marginTop: 4 }}>{selectedSkill.avgLatency}</div>
              </div>
              <div>
                <div style={LABEL}>Trust Score</div>
                <div style={{ fontSize: 20, fontWeight: 400, color: trustColor(selectedSkill.trustScore), marginTop: 4 }}>{selectedSkill.trustScore}/100</div>
                <ProgressBar value={selectedSkill.trustScore} color={trustColor(selectedSkill.trustScore)} />
              </div>
              <div>
                <div style={LABEL}>Version</div>
                <div style={{ fontSize: 20, fontWeight: 400, color: T.text50, marginTop: 4 }}>v{selectedSkill.version}</div>
              </div>
            </div>

            {/* Composability */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ ...LABEL, marginBottom: 8 }}>Depends On</div>
                {selectedSkill.composableWith.map((s) => (
                  <div key={s} style={{ fontSize: 12, color: T.text50, padding: "4px 0" }}>{s}</div>
                ))}
              </div>
              <div>
                <div style={{ ...LABEL, marginBottom: 8 }}>Depended On By</div>
                {selectedSkill.dependents.length === 0 ? (
                  <div style={{ fontSize: 12, color: T.text20 }}>No dependents</div>
                ) : (
                  selectedSkill.dependents.map((s) => (
                    <div key={s} style={{ fontSize: 12, color: T.text50, padding: "4px 0" }}>{s}</div>
                  ))
                )}
              </div>
            </div>

            {/* Creator info */}
            <div style={{
              background: T.white3,
              borderRadius: 6,
              padding: 14,
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                background: T.white6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 500,
                color: T.text50,
              }}>
                {selectedSkill.creator.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text80 }}>{selectedSkill.creator}</div>
                <MonoValue color={T.text30}>{selectedSkill.creatorWallet}</MonoValue>
              </div>
            </div>

            {/* Invoke section */}
            <div style={{ ...LABEL, marginBottom: 8 }}>Invoke with Parameters</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                placeholder='{"input": "your data here"}'
                style={{ ...INPUT as React.CSSProperties, flex: 1, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
                readOnly
              />
              <ActionButton label="Invoke" variant="primary" />
            </div>
          </div>
        </Card>
      )}

      {/* Creator Leaderboard */}
      <Card>
        <CardHead label="Top Creators by Earnings" />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["#", "Creator", "Skills", "Total Earnings", "Avg Rating"].map((h, i) => (
                  <th key={i} style={{
                    ...LABEL,
                    textAlign: i <= 1 ? "left" : "right",
                    padding: "10px 16px",
                    borderBottom: `1px solid ${T.border}`,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TOP_CREATORS.map((creator, i) => (
                <tr key={creator.name} style={{ borderBottom: i < TOP_CREATORS.length - 1 ? `1px solid ${T.border}` : undefined }}>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: T.text20, fontWeight: 500 }}>{i + 1}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: T.text80 }}>{creator.name}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: T.text50, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{creator.skills}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: T.positive, textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{creator.totalEarnings}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    {renderStars(creator.avgRating)} <span style={{ fontSize: 11, color: T.text30, marginLeft: 4 }}>{creator.avgRating}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
