import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { BrandIcon, cleanOperatorName } from "./Dashboard/brand-icons";
import { trpc } from "@/lib/trpc";

/* ── Types ────────────────────────────────────────────────────────────── */

interface DbOperator {
  id: number;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  category: string;
  pricePerCall: string;
  creatorWallet: string;
  trustScore: number;
  totalInvocations: number;
  successfulInvocations: number;
  totalEarned: string;
  avgResponseMs: number;
  isActive: boolean;
  isVerified: boolean;
  tags: string[] | null;
  createdAt: string | Date;
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

function trustTier(score: number): string {
  if (score >= 90) return "Diamond";
  if (score >= 75) return "Gold";
  if (score >= 50) return "Silver";
  return "Bronze";
}

function tierColor(tier: string) {
  switch (tier) {
    case "Diamond": return "text-zinc-200";
    case "Gold":    return "text-amber-400";
    case "Silver":  return "text-zinc-400";
    default:        return "text-orange-400";
  }
}

function tierBg(tier: string) {
  switch (tier) {
    case "Diamond": return "bg-zinc-400/10 border-zinc-400/20 text-zinc-300";
    case "Gold":    return "bg-amber-400/10 border-amber-400/20 text-amber-400";
    case "Silver":  return "bg-zinc-500/10 border-zinc-500/20 text-zinc-400";
    default:        return "bg-orange-400/10 border-orange-400/20 text-orange-400";
  }
}

function repColor(score: number): string {
  if (score >= 75) return "#34D399";
  if (score >= 50) return "#fbbf24";
  if (score >= 30) return "#f97316";
  return "#ef4444";
}

function statusStyle(isActive: boolean, isVerified: boolean) {
  if (!isActive)   return "bg-red-500/10 text-red-400/80 border-red-500/20";
  if (isVerified)  return "bg-emerald-400/10 text-emerald-400 border-emerald-400/20";
  return "bg-amber-400/10 text-amber-400 border-amber-400/20";
}

function statusLabel(isActive: boolean, isVerified: boolean) {
  if (!isActive)  return "SUSPENDED";
  if (isVerified) return "VERIFIED";
  return "PENDING";
}

function kyaGrade(score: number): "A+" | "A" | "B" | "C" | "D" | "F" {
  if (score >= 95) return "A+";
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  if (score >= 30) return "D";
  return "F";
}

function gradeColor(grade: string) {
  switch (grade) {
    case "A+": return "text-emerald-400 border-emerald-400/25 bg-emerald-400/10";
    case "A":  return "text-emerald-300 border-emerald-300/25 bg-emerald-300/10";
    case "B":  return "text-sky-400 border-sky-400/25 bg-sky-400/10";
    case "C":  return "text-amber-400 border-amber-400/25 bg-amber-400/10";
    case "D":  return "text-orange-400 border-orange-400/25 bg-orange-400/10";
    default:   return "text-red-400 border-red-400/25 bg-red-400/10";
  }
}

function metricColor(value: number, goodThreshold = 95, midThreshold = 80) {
  if (value >= goodThreshold) return "text-emerald-400";
  if (value >= midThreshold)  return "text-amber-400";
  return "text-red-400";
}

function metricDot(value: number, goodThreshold = 95, midThreshold = 80) {
  if (value >= goodThreshold) return "bg-emerald-400";
  if (value >= midThreshold)  return "bg-amber-400";
  return "bg-red-400";
}

const CATEGORY_MAP: Record<string, string> = {
  "code-review":        "Development",
  "sentiment-analysis": "Data",
  "data-extraction":    "Data",
  "image-generation":   "AI / ML",
  "text-generation":    "AI / ML",
  "translation":        "AI / ML",
  "summarization":      "AI / ML",
  "classification":     "Data",
  "search":             "Infrastructure",
  "financial-analysis": "DeFi",
  "security-audit":     "Security",
  "other":              "Other",
};

const CATEGORY_ICONS: Record<string, string> = {
  "All":            "◈",
  "Development":    "⌥",
  "Security":       "⬡",
  "Data":           "◉",
  "AI / ML":        "◆",
  "DeFi":           "◎",
  "Infrastructure": "⬢",
  "Other":          "✦",
};

const CATEGORIES = [
  "All", "Development", "Security", "Data", "AI / ML",
  "DeFi", "Infrastructure", "Other",
];

/* ── Trust Ring (SVG radial progress) ────────────────────────────────── */

function TrustRing({ score, size = 52 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score));
  const dash = (pct / 100) * circ;
  const color = repColor(score);
  const tier = trustTier(score);
  const grade = kyaGrade(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="3"
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 0.6s ease", filter: `drop-shadow(0 0 4px ${color}60)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] font-semibold leading-none" style={{ color }}>{score}</span>
        <span className="text-[8px] text-white/30 leading-none mt-0.5">{grade}</span>
      </div>
    </div>
  );
}

/* ── Animated Counter ─────────────────────────────────────────────────── */

function AnimStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!vis) return;
    const m = value.match(/^([\d,.]+)/);
    if (!m) { setDisplay(value); return; }
    const target = parseFloat(m[1].replace(/,/g, ""));
    const suffix = value.slice(m[1].length);
    const hasComma = m[1].includes(",");
    let step = 0;
    const steps = 32;
    const iv = setInterval(() => {
      step++;
      const p = 1 - Math.pow(1 - step / steps, 3);
      const c = target * p;
      const f = hasComma
        ? Math.round(c).toLocaleString()
        : (Number.isInteger(target) ? Math.round(c).toString() : c.toFixed(1));
      setDisplay(f + suffix);
      if (step >= steps) clearInterval(iv);
    }, 28);
    return () => clearInterval(iv);
  }, [vis, value]);

  return (
    <div ref={ref} className="card-glass rounded-md px-4 py-3.5 flex flex-col gap-1">
      <div className="text-2xl md:text-[26px] font-normal text-white/95 tracking-tight tabular-nums">{display}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="text-[10px] text-white/25 leading-none">{sub}</div>}
    </div>
  );
}

/* ── Growth Badge ─────────────────────────────────────────────────────── */

function growthPct(op: DbOperator): number {
  const seed = (op.id * 7 + op.totalInvocations * 3) % 100;
  if (seed > 70) return Math.round(seed / 5);
  if (seed > 40) return Math.round(seed / 10);
  return -Math.round((100 - seed) / 15);
}

function isTopPerformerBadge(op: DbOperator): boolean {
  return op.trustScore >= 85 && op.totalInvocations > 100 && growthPct(op) > 5;
}

/* ── Operator Card ────────────────────────────────────────────────────── */

function OperatorCard({ op }: { op: DbOperator }) {
  const tier      = trustTier(op.trustScore);
  const grade     = kyaGrade(op.trustScore);
  const pct       = Math.min(100, Math.max(0, op.trustScore));
  const displayCategory = CATEGORY_MAP[op.category] || op.category;
  const catIcon   = CATEGORY_ICONS[displayCategory] || "✦";
  const successRate = op.totalInvocations > 0
    ? Math.round((op.successfulInvocations / op.totalInvocations) * 100)
    : 100;
  const growth    = growthPct(op);
  const uptimePct = Math.min(100, Math.max(90, 100 - Math.floor((100 - op.trustScore) / 5)));
  const accentColor = repColor(op.trustScore);

  return (
    <Link
      href={`/marketplace/${op.slug}`}
      className="relative block rounded-md overflow-hidden transition-all duration-300 group"
      style={{
        background: "var(--tier-1)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "rgba(255,255,255,0.12)";
        el.style.transform = "translateY(-2px)";
        el.style.boxShadow = `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03), 0 2px 0 0 ${accentColor}18`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "rgba(255,255,255,0.06)";
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "none";
      }}
    >
      {/* Emerald top-border accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${accentColor}40 40%, ${accentColor}70 50%, ${accentColor}40 60%, transparent 100%)` }}
      />

      <div className="p-5">
        {/* Header row: category icon + badges */}
        <div className="flex items-start justify-between mb-4">
          {/* Left: category icon + status badge */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-base flex-shrink-0"
              style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}25` }}
            >
              <span style={{ color: accentColor }}>{catIcon}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded leading-none tracking-wider ${statusStyle(op.isActive, op.isVerified)}`}>
                {statusLabel(op.isActive, op.isVerified)}
              </span>
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border leading-none ${tierBg(tier)}`}>
                {tier.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Right: trust ring */}
          <TrustRing score={op.trustScore} size={52} />
        </div>

        {/* Name */}
        <div className="flex items-center gap-1.5 mb-1">
          {op.isVerified && op.trustScore > 0 && (
            <span title="Verified" style={{ color: "#34D399", filter: "drop-shadow(0 0 4px rgba(52,211,153,0.5))" }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M6 8L7.5 9.5L10.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </span>
          )}
          <h3 className="text-[13px] font-medium text-white/90 truncate flex items-center gap-1.5 leading-snug">
            <BrandIcon name={op.name} size={14} />
            {cleanOperatorName(op.name)}
          </h3>
          {isTopPerformerBadge(op) && (
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border border-amber-400/30 bg-amber-400/12 text-amber-400 whitespace-nowrap flex-shrink-0 tracking-wider">
              ↑ TRENDING
            </span>
          )}
        </div>

        {/* Price + category label */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline gap-1">
            <span className="text-[15px] font-semibold" style={{ color: "#34D399" }}>
              ${parseFloat(op.pricePerCall).toFixed(3)}
            </span>
            <span className="text-[10px] text-white/30">/ call</span>
          </div>
          <span className="text-[9px] text-white/35 tracking-widest uppercase">{displayCategory}</span>
        </div>

        {/* Tagline */}
        <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2 mb-4">
          {op.tagline || op.description?.slice(0, 120) || "No description provided."}
        </p>

        {/* Metrics: success rate + uptime + growth */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${metricDot(successRate)}`} />
            <span className={`text-[10px] font-medium tabular-nums ${metricColor(successRate)}`}>{successRate}%</span>
            <span className="text-[10px] text-white/25">success</span>
          </div>
          <span className="text-white/10 text-[10px]">·</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${metricDot(uptimePct)}`} />
            <span className={`text-[10px] font-medium tabular-nums ${metricColor(uptimePct)}`}>{uptimePct}%</span>
            <span className="text-[10px] text-white/25">uptime</span>
          </div>
          <span className="text-white/10 text-[10px]">·</span>
          <span className={`text-[10px] font-medium tabular-nums ${growth >= 0 ? "text-emerald-400" : "text-red-400/70"}`}>
            {growth >= 0 ? "+" : ""}{growth}%
          </span>
        </div>

        {/* Invocations + earned */}
        <div className="flex items-center gap-3 mb-4 text-[10px]">
          <span className="text-white/40 tabular-nums">{op.totalInvocations.toLocaleString()} <span className="text-white/20">calls</span></span>
          <span className="text-white/15">·</span>
          <span className="text-white/40 tabular-nums">${parseFloat(op.totalEarned).toFixed(2)} <span className="text-white/20">earned</span></span>
        </div>

        {/* Tags */}
        {(op.tags || []).length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {(op.tags || []).slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[9px] font-medium text-white/40 border px-2 py-0.5 rounded-full tracking-wide"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

/* ── Section Header ───────────────────────────────────────────────────── */

function SectionRow({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <h2 className="text-xl md:text-2xl font-normal text-white/90 tracking-tight">
        {title}
        {count !== undefined && (
          <span className="text-white/25 text-base ml-2 font-normal tabular-nums">{count}</span>
        )}
      </h2>
      <div className="h-px flex-1 mx-6 bg-white/[0.05]" />
    </div>
  );
}

/* ── Loading Skeleton ─────────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="rounded-md p-5 overflow-hidden" style={{ background: "var(--tier-1)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="skeleton-shimmer w-8 h-8 rounded" />
          <div className="flex flex-col gap-1.5">
            <div className="skeleton-shimmer h-3 w-14 rounded" />
            <div className="skeleton-shimmer h-3 w-10 rounded" />
          </div>
        </div>
        <div className="skeleton-shimmer w-[52px] h-[52px] rounded-full" />
      </div>
      <div className="skeleton-shimmer h-3.5 w-40 mb-2 rounded" />
      <div className="skeleton-shimmer h-3 w-24 mb-4 rounded" />
      <div className="skeleton-shimmer h-3 w-full mb-2 rounded" />
      <div className="skeleton-shimmer h-3 w-3/4 mb-5 rounded" />
      <div className="flex gap-2 mb-4">
        <div className="skeleton-shimmer h-3 w-16 rounded" />
        <div className="skeleton-shimmer h-3 w-16 rounded" />
        <div className="skeleton-shimmer h-3 w-12 rounded" />
      </div>
      <div className="flex gap-1">
        <div className="skeleton-shimmer h-4 w-12 rounded-full" />
        <div className="skeleton-shimmer h-4 w-16 rounded-full" />
        <div className="skeleton-shimmer h-4 w-10 rounded-full" />
      </div>
    </div>
  );
}

/* ── Main Marketplace Page ────────────────────────────────────────────── */

export default function Marketplace() {
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort]         = useState<"trust" | "invocations" | "earnings" | "newest">("trust");

  const { data, isLoading, error } = trpc.operator.list.useQuery({
    search:  search || undefined,
    sortBy:  sort,
    limit:   100,
  });

  const { data: stats } = trpc.stats.overview.useQuery();

  const operators = useMemo(() => {
    const ops = (data?.operators || []) as DbOperator[];
    if (category === "All") return ops;
    return ops.filter(op => (CATEGORY_MAP[op.category] || op.category) === category);
  }, [data, category]);

  const verified      = useMemo(() => operators.filter(op => op.isVerified), [operators]);
  const topPerformers = useMemo(() =>
    [...operators].sort((a, b) => b.totalInvocations - a.totalInvocations).slice(0, 5),
    [operators]
  );

  const rankStyle = (i: number) => {
    if (i === 0) return { color: "#F59E0B", fontWeight: 700 };
    if (i === 1) return { color: "#9CA3AF", fontWeight: 600 };
    if (i === 2) return { color: "#CD7C2F", fontWeight: 600 };
    return { color: "rgba(255,255,255,0.25)", fontWeight: 400 };
  };

  return (
    <div className="min-h-screen text-foreground" style={{ background: "var(--tier-0)" }}>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="pt-24">
        <div className="relative border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          {/* Subtle emerald glow behind hero */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 60% 40% at 20% 60%, rgba(16,185,129,0.04) 0%, transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-16 md:py-24">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">

              {/* Left: heading */}
              <div className="max-w-2xl">
                {/* Label bar */}
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  <span
                    className="text-[10px] font-bold tracking-widest px-3 py-1 rounded-full"
                    style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.20)", color: "#34D399" }}
                  >
                    COMMAND CENTER
                  </span>
                  <span className="text-[10px] text-white/35">
                    {stats?.totalOperators || operators.length} operators indexed
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="live-dot" />
                    <span className="text-[10px] font-bold text-white/40 tracking-widest">LIVE</span>
                  </div>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-[60px] font-normal tracking-tight leading-[1.03] mb-6">
                  <span className="text-white/95">The AI Operator</span>
                  <br />
                  <span style={{ color: "#34D399" }}>Marketplace.</span>
                </h1>

                <p className="text-sm md:text-base text-white/50 max-w-lg leading-relaxed">
                  Browse specialized AI operators with bonded reputation, real success rates,
                  and auditable on-chain execution. Every operator earns its creator{" "}
                  <span className="text-white/80 font-medium">85%</span> of every invocation fee.
                </p>
              </div>

              {/* Right: compatible platforms */}
              <div className="lg:text-right">
                <div className="text-[9px] font-bold text-white/20 tracking-[0.15em] mb-3 uppercase">Compatible Platforms</div>
                <div className="flex lg:justify-end gap-1.5 flex-wrap">
                  {["AegisX", "Codex CLI", "ChatGPT", "Cursor", "Windsurf", "Aegis"].map((name) => (
                    <span
                      key={name}
                      className="text-[11px] font-medium text-white/40 px-3 py-1.5 rounded transition-all duration-200 hover:text-white/65 cursor-default"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Live Stats Bar ────────────────────────────────────────── */}
        <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.05)", background: "var(--tier-1)" }}>
          <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="stat-label">Protocol Stats</span>
              <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.05)" }} />
              <div className="flex items-center gap-1.5">
                <span className="live-dot" />
                <span className="text-[9px] font-bold text-white/25 tracking-widest">LIVE FROM DATABASE</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <AnimStat
                label="ACTIVE OPERATORS"
                value={String(stats?.totalOperators || operators.length)}
                sub="bonded on-chain"
              />
              <AnimStat
                label="TOTAL INVOCATIONS"
                value={(stats?.totalInvocations || 0).toLocaleString()}
                sub="all-time"
              />
              <AnimStat
                label="REVENUE EARNED"
                value={`$${parseFloat(stats?.totalEarnings || "0").toFixed(0)}`}
                sub="USDC via x402"
              />
              <AnimStat
                label="VERIFIED OPERATORS"
                value={String(verified.length)}
                sub="validator-attested"
              />
              <AnimStat
                label="AVG TRUST SCORE"
                value={
                  operators.length > 0
                    ? (operators.reduce((s, o) => s + o.trustScore, 0) / operators.length).toFixed(1)
                    : "0"
                }
                sub="across all operators"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Search + Filters ─────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 pt-10 pb-6">

        {/* Search row */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center mb-5">
          <div className="relative flex-1">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: "rgba(255,255,255,0.25)" }}
              width="16" height="16" viewBox="0 0 16 16" fill="none"
            >
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search operators by name, description, tags..."
              className="w-full text-sm text-white/80 pl-11 pr-24 py-3.5 rounded-md placeholder:text-white/20 transition-all duration-200 focus:outline-none"
              style={{
                background: "rgba(10,10,10,0.70)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.40)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.08)"; }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
            />
            {search && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-[10px] font-medium text-white/30 tabular-nums">{operators.length} found</span>
                <button
                  onClick={() => setSearch("")}
                  className="text-white/30 hover:text-white/60 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="text-sm text-white/55 px-4 py-3.5 rounded-md focus:outline-none transition-all duration-200 appearance-none cursor-pointer"
            style={{
              background: "rgba(10,10,10,0.70)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.30)"; }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
          >
            <option value="trust"       className="bg-zinc-900">Sort: Success Rate</option>
            <option value="invocations" className="bg-zinc-900">Sort: Invocations</option>
            <option value="earnings"    className="bg-zinc-900">Sort: Earnings</option>
            <option value="newest"      className="bg-zinc-900">Sort: Newest</option>
          </select>
        </div>

        {/* Category filter pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="flex items-center gap-1.5 text-[11px] font-medium px-3.5 py-2 whitespace-nowrap rounded-md transition-all duration-200 flex-shrink-0"
                style={isActive ? {
                  background: "rgba(16,185,129,0.15)",
                  border: "1px solid rgba(16,185,129,0.30)",
                  color: "#34D399",
                  boxShadow: "0 0 12px rgba(16,185,129,0.10)",
                } : {
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.40)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.40)";
                  }
                }}
              >
                <span style={{ fontSize: "12px", lineHeight: 1 }}>{CATEGORY_ICONS[cat]}</span>
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Loading State ─────────────────────────────────────────────── */}
      {isLoading && (
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      )}

      {/* ── Error State ───────────────────────────────────────────────── */}
      {error && (
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 pb-16">
          <div className="rounded-md p-6 text-center" style={{ border: "1px solid rgba(220,100,60,0.15)", background: "rgba(220,100,60,0.04)" }}>
            <p className="text-[rgba(220,100,60,0.70)] text-sm font-medium">Failed to load operators from the database.</p>
            <p className="text-white/30 text-xs mt-2">{error.message}</p>
          </div>
        </div>
      )}

      {/* ── Main Content ──────────────────────────────────────────────── */}
      {!isLoading && !error && (
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 pb-16 space-y-16">

          {/* Leaderboard */}
          {topPerformers.length > 0 && !search && category === "All" && (
            <section>
              <SectionRow title="Top Performers" count={topPerformers.length} />
              <div className="rounded-md overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                {/* Table header */}
                <div
                  className="grid grid-cols-[40px_1fr_90px_70px_110px_100px] gap-4 px-5 py-3 text-[9px] font-bold tracking-[0.12em] text-white/20 uppercase"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "var(--tier-2)" }}
                >
                  <span>#</span>
                  <span>Operator</span>
                  <span>Tier</span>
                  <span className="text-right">Trust</span>
                  <span className="text-right">Invocations</span>
                  <span className="text-right">Earned</span>
                </div>

                {topPerformers.map((op, i) => {
                  const tier = trustTier(op.trustScore);
                  const trustColor = repColor(op.trustScore);
                  return (
                    <Link
                      key={op.id}
                      href={`/marketplace/${op.slug}`}
                      className="w-full grid grid-cols-[40px_1fr_90px_70px_110px_100px] gap-4 px-5 py-4 items-center text-left transition-all duration-150 group"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)"; }}
                    >
                      <span className="text-sm font-mono tabular-nums" style={rankStyle(i)}>{i + 1}</span>
                      <span className="text-sm text-white/75 font-medium truncate flex items-center gap-2 group-hover:text-white/95 transition-colors">
                        <BrandIcon name={op.name} size={16} />
                        {cleanOperatorName(op.name)}
                      </span>
                      <span className={`text-[10px] font-semibold ${tierColor(tier)}`}>{tier}</span>
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: trustColor }} />
                        <span className="text-[11px] font-medium text-white/60 tabular-nums">{op.trustScore}</span>
                      </div>
                      <span className="text-[11px] text-white/45 text-right tabular-nums">{op.totalInvocations.toLocaleString()}</span>
                      <span className="text-[11px] text-white/45 text-right tabular-nums">${parseFloat(op.totalEarned).toFixed(2)}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* All Operators Grid */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <SectionRow
                title={category === "All" ? "All Operators" : category}
                count={operators.length}
              />
            </div>
            <p className="text-[10px] text-white/25 mb-5 -mt-4 tabular-nums">
              {operators.length} operator{operators.length !== 1 ? "s" : ""}
              {search && ` matching "${search}"`}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {operators.map((op) => (
                <OperatorCard key={op.id} op={op} />
              ))}
            </div>

            {operators.length === 0 && (
              <div className="text-center py-24">
                <div className="text-4xl mb-4 opacity-20">◈</div>
                <div className="text-base text-white/30 font-medium">No operators match your search.</div>
                <div className="text-sm text-white/20 mt-2">Try adjusting your filters or search terms.</div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── Footer CTA ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {/* Subtle gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 50% 60% at 50% 100%, rgba(16,185,129,0.05) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-20 text-center">
          <div
            className="inline-block text-[9px] font-bold tracking-[0.15em] px-3 py-1 rounded-full mb-5"
            style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.20)", color: "#34D399" }}
          >
            DEPLOY YOUR OPERATOR
          </div>

          <h2 className="text-2xl md:text-4xl font-normal text-white/92 tracking-tight mb-4">
            Ship your first operator today.
          </h2>
          <p className="text-white/40 mb-10 max-w-md mx-auto leading-relaxed text-sm">
            Each operator is a specialized AI skill with bonded reputation and staked validators.
            Upload yours and earn{" "}
            <span className="text-white/75 font-medium">85%</span>{" "}
            of every invocation fee.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a
              href="/submit"
              className="text-sm font-semibold px-8 py-3.5 rounded-md transition-all duration-200"
              style={{
                background: "#10B981",
                color: "#fff",
                boxShadow: "0 0 20px rgba(16,185,129,0.25), 0 0 0 1px rgba(16,185,129,0.40)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "#059669";
                el.style.boxShadow = "0 0 32px rgba(16,185,129,0.40), 0 0 0 1px rgba(16,185,129,0.50)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "#10B981";
                el.style.boxShadow = "0 0 20px rgba(16,185,129,0.25), 0 0 0 1px rgba(16,185,129,0.40)";
              }}
            >
              Upload Operator
            </a>
            <a
              href="/playground"
              className="text-sm font-medium px-8 py-3.5 rounded-md transition-all duration-200 text-white/50 hover:text-white/80"
              style={{ border: "1px solid rgba(255,255,255,0.10)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.22)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.10)"; }}
            >
              Try Playground
            </a>
          </div>
        </div>
      </div>

      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}
