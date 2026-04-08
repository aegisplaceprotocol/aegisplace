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
  qualityScore: number;
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

/* ── (demo arrays removed — data comes from trpc.operator.list) ───────── */

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

  const rawOperators: any[] = (operatorsQuery.data as any)?.operators ?? [];

  // Map real operators to Skill interface
  const skillItems: Skill[] = rawOperators.map((op: any, i: number) => ({
    id: String(op.id ?? `api-${i}`),
    name: op.name ?? "Unknown Skill",
    creator: op.creatorWallet ? `${op.creatorWallet.slice(0, 6)}...${op.creatorWallet.slice(-4)}` : "Unknown",
    creatorWallet: op.creatorWallet ?? "0x0000...0000",
    category: op.category ?? "Other",
    pricingModel: (parseFloat(op.pricePerCall || "0") === 0 ? "Free" : "Pay-per-call") as Skill["pricingModel"],
    pricePerCall: op.pricePerCall ? `$${op.pricePerCall}` : "Free",
    qualityScore: op.qualityScore ?? 50,
    monthlyInvocations: op.totalInvocations ?? 0,
    totalEarnings: op.totalEarned ? `$${Number(op.totalEarned).toLocaleString()}` : "$0",
    rating: op.qualityScore ? Number((op.qualityScore / 20).toFixed(1)) : 3.0,
    description: op.description ?? op.tagline ?? "",
    composableWith: [],
    dependents: [],
    tags: op.tags ?? [],
    version: "1.0.0",
    successRate: op.successfulInvocations && op.totalInvocations
      ? Number(((op.successfulInvocations / op.totalInvocations) * 100).toFixed(1))
      : 95,
    avgLatency: op.avgResponseMs ? `${(op.avgResponseMs / 1000).toFixed(1)}s` : "0s",
  }));

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
      {operatorsQuery.isLoading && (
        <div style={{ padding: "40px 0", textAlign: "center", fontSize: 12, color: T.text20 }}>
          Loading skills...
        </div>
      )}
      {!operatorsQuery.isLoading && skillItems.length === 0 && (
        <div style={{ padding: "40px 0", textAlign: "center", fontSize: 12, color: T.text20 }}>
          No skills registered yet.
        </div>
      )}
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
                  color: trustColor(skill.qualityScore),
                  fontVariantNumeric: "tabular-nums",
                  marginLeft: 12,
                }}>
                  {skill.qualityScore}
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
                <div style={LABEL}>quality score</div>
                <div style={{ fontSize: 20, fontWeight: 400, color: trustColor(selectedSkill.qualityScore), marginTop: 4 }}>{selectedSkill.qualityScore}/100</div>
                <ProgressBar value={selectedSkill.qualityScore} color={trustColor(selectedSkill.qualityScore)} />
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

      {/* Creator Leaderboard — derived from real operator data */}
      {(() => {
        const creatorMap: Record<string, { skills: number; totalEarningsRaw: number; ratingSum: number }> = {};
        for (const s of skillItems) {
          const key = s.creator;
          if (!creatorMap[key]) creatorMap[key] = { skills: 0, totalEarningsRaw: 0, ratingSum: 0 };
          creatorMap[key].skills += 1;
          creatorMap[key].totalEarningsRaw += parseFloat(s.totalEarnings.replace(/[^0-9.]/g, "") || "0");
          creatorMap[key].ratingSum += s.rating;
        }
        const topCreators: Creator[] = Object.entries(creatorMap)
          .map(([name, v]) => ({
            name,
            skills: v.skills,
            totalEarnings: `$${Math.round(v.totalEarningsRaw).toLocaleString()}`,
            avgRating: v.skills > 0 ? Number((v.ratingSum / v.skills).toFixed(1)) : 0,
          }))
          .sort((a, b) => parseFloat(b.totalEarnings.replace(/[^0-9.]/g, "")) - parseFloat(a.totalEarnings.replace(/[^0-9.]/g, "")))
          .slice(0, 5);

        return (
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
                  {topCreators.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "20px 16px", fontSize: 12, color: T.text20, textAlign: "center" }}>
                        No creators yet.
                      </td>
                    </tr>
                  ) : topCreators.map((creator, i) => (
                    <tr key={creator.name} style={{ borderBottom: i < topCreators.length - 1 ? `1px solid ${T.border}` : undefined }}>
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
        );
      })()}
    </div>
  );
}
