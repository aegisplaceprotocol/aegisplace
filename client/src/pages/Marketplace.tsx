import ComingSoon from "@/components/ComingSoon";
import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
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
    case "Diamond": return "text-zinc-300";
    case "Gold": return "text-amber-400";
    case "Silver": return "text-white/40";
    default: return "text-orange-400";
  }
}

function repColor(score: number) {
  if (score >= 80) return "#A1A1AA";
  if (score >= 60) return "#71717A";
  if (score >= 40) return "#eab308";
  return "#ef4444";
}

function statusStyle(isActive: boolean, isVerified: boolean) {
  if (!isActive) return "bg-red-500/8 text-red-400 border-red-500/15";
  if (isVerified) return "bg-white/8 text-zinc-300 border-white/15";
  return "bg-yellow-500/8 text-amber-400 border-amber-400/12";
}

function statusLabel(isActive: boolean, isVerified: boolean) {
  if (!isActive) return "SUSPENDED";
  if (isVerified) return "VERIFIED";
  return "PENDING";
}

const CATEGORY_MAP: Record<string, string> = {
  "code-review": "Development",
  "sentiment-analysis": "Data",
  "data-extraction": "Data",
  "image-generation": "AI / ML",
  "text-generation": "AI / ML",
  "translation": "AI / ML",
  "summarization": "AI / ML",
  "classification": "Data",
  "search": "Infrastructure",
  "financial-analysis": "DeFi",
  "security-audit": "Security",
  "other": "Other",
};

const CATEGORIES = [
  "All", "Development", "Security", "Data", "AI / ML",
  "DeFi", "Infrastructure", "Other",
];

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
    const steps = 30;
    const iv = setInterval(() => {
      step++;
      const p = 1 - Math.pow(1 - step / steps, 3);
      const c = target * p;
      const f = hasComma ? Math.round(c).toLocaleString() : (Number.isInteger(target) ? Math.round(c).toString() : c.toFixed(1));
      setDisplay(f + suffix);
      if (step >= steps) clearInterval(iv);
    }, 30);
    return () => clearInterval(iv);
  }, [vis, value]);

  return (
    <div ref={ref}>
      <div className="text-2xl md:text-3xl font-bold text-white/90 tracking-tight">{display}</div>
      <div className="text-[11px] text-white/25 mt-1 tracking-wider">{label}</div>
      {sub && <div className="text-[10px] text-white/15 mt-0.5">{sub}</div>}
    </div>
  );
}

/* ── Operator Card ────────────────────────────────────────────────────── */

function OperatorCard({ op }: { op: DbOperator }) {
  const tier = trustTier(op.trustScore);
  const pct = Math.min(100, Math.max(0, op.trustScore));
  const color = repColor(op.trustScore);
  const displayCategory = CATEGORY_MAP[op.category] || op.category;
  const successRate = op.totalInvocations > 0
    ? Math.round((op.successfulInvocations / op.totalInvocations) * 100)
    : 100;

  return (
    <Link
      href={`/marketplace/${op.slug}`}
      className="text-left w-full p-6 border border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.03] transition-all duration-300 group block rounded"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-medium px-2 py-0.5 border rounded-full ${statusStyle(op.isActive, op.isVerified)}`}>
            {statusLabel(op.isActive, op.isVerified)}
          </span>
          <span className={`text-[9px] font-medium ${tierColor(tier)}`}>{tier}</span>
        </div>
        <span className="text-[10px] font-medium text-white/25">{displayCategory}</span>
      </div>

      {/* Name */}
      <h3 className="text-[14px] font-normal text-white/80 group-hover:text-zinc-300 transition-colors mt-3 mb-0.5 truncate">
        {op.name}
      </h3>
      <div className="flex items-center gap-2 text-[10px] text-white/15 mb-3">
        <span className="text-zinc-300/60">${parseFloat(op.pricePerCall).toFixed(3)}</span>
        <span className="text-white/10">per call</span>
        <span className="text-white/10">|</span>
        <span>{successRate}% success</span>
      </div>

      {/* Tagline */}
      <p className="text-[11px] text-white/30 leading-relaxed line-clamp-2 mb-4 ">
        {op.tagline || op.description?.slice(0, 120) || "No description"}
      </p>

      {/* Success score bar */}
      <div className="mb-4">
        <div className="h-[3px] bg-white/[0.04] w-full overflow-hidden">
          <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[9px] text-white/15 ">Trust: {op.trustScore}/100</span>
          <span className="text-[9px] text-white/15 ">
            {op.totalInvocations.toLocaleString()} calls | ${parseFloat(op.totalEarned).toFixed(2)} earned
          </span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-1 flex-wrap">
        {(op.tags || []).slice(0, 4).map((tag) => (
          <span key={tag} className="text-[8px] text-white/15 border border-white/[0.05] px-2 py-0.5 rounded-full">
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}

/* ── Section Header ───────────────────────────────────────────────────── */

function SectionRow({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <h2 className="text-xl md:text-2xl font-bold text-white/90 tracking-tight">
        {title}
        {count !== undefined && <span className="text-white/15 text-base ml-2 font-normal">{count}</span>}
      </h2>
    </div>
  );
}

/* ── Main Marketplace Page ────────────────────────────────────────────── */

export default function Marketplace() { return <ComingSoon title="Marketplace" description="Browse 452 operators with bonded reputation and auditable execution." />; }
function _Marketplace() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<"trust" | "invocations" | "earnings" | "newest">("trust");

  // Fetch operators from real API
  const { data, isLoading, error } = trpc.operator.list.useQuery({
    search: search || undefined,
    sortBy: sort,
    limit: 100,
  });

  // Fetch protocol stats
  const { data: stats } = trpc.stats.overview.useQuery();

  const operators = useMemo(() => {
    const ops = (data?.operators || []) as DbOperator[];
    if (category === "All") return ops;
    return ops.filter(op => {
      const mapped = CATEGORY_MAP[op.category] || op.category;
      return mapped === category;
    });
  }, [data, category]);

  const verified = useMemo(() => operators.filter(op => op.isVerified), [operators]);
  const topPerformers = useMemo(() =>
    [...operators].sort((a, b) => b.totalInvocations - a.totalInvocations).slice(0, 5),
    [operators]
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Command Center Hero */}
      <div className="pt-24">
        <div className="border-b border-white/[0.07]">
          <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-16 md:py-24">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-[10px] font-medium text-zinc-300/60 bg-white/[0.04] border border-white/[0.10] px-3 py-1 rounded-full">
                    COMMAND CENTER
                  </span>
                  <span className="text-[10px] font-medium text-white/20">
                    {stats?.totalOperators || operators.length} operators indexed
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                  <span className="text-[10px] font-medium text-zinc-300/40">LIVE</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tight leading-[1.05]">
                  <span className="text-white/95">Command</span><br />
                  <span className="text-white/25">Center.</span>
                </h1>
                <p className="text-base md:text-lg text-white/30 max-w-lg leading-relaxed mt-6">
                  Browse specialized AI operators with bonded reputation, real success rates, and auditable execution.
                  Every operator earns its creator 60% of every invocation fee.
                </p>
              </div>

              {/* Compatible platforms */}
              <div className="lg:text-right">
                <div className="text-[10px] font-medium text-white/15 tracking-wider mb-3">COMPATIBLE PLATFORMS</div>
                <div className="flex lg:justify-end gap-2 flex-wrap">
                  {["Claude Code", "Codex CLI", "ChatGPT", "Cursor", "Windsurf", "Aegis"].map((name) => (
                    <span key={name} className="text-[11px] font-medium text-white/30 border border-white/[0.07] px-3 py-1.5 hover:border-white/[0.12] hover:text-white/45 transition-all cursor-default rounded">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Stats Bar */}
        <div className="border-b border-white/[0.07] bg-white/[0.01]">
          <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[9px] font-medium text-zinc-300/50 tracking-wider">PROTOCOL STATS</span>
              <div className="h-px flex-1 bg-white/[0.04]" />
              <span className="text-[9px] font-medium text-white/15">LIVE FROM DATABASE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
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
                value={operators.length > 0
                  ? (operators.reduce((s, o) => s + o.trustScore, 0) / operators.length).toFixed(1)
                  : "0"
                }
                sub="across all operators"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 pt-12 pb-6">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-white/15" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search operators by name, description, tags..."
                    className="w-full bg-white/[0.02] border border-white/[0.07] text-sm text-white/60 pl-11 pr-20 py-3.5 placeholder:text-white/12 focus:border-white/25 focus:outline-none transition-colors rounded"
            />
            {search && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-[10px] font-medium text-white/20">{operators.length} found</span>
                <button onClick={() => setSearch("")} className="text-white/20 hover:text-white/50 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" /></svg>
                </button>
              </div>
            )}
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}
            className="bg-white/[0.02] border border-white/[0.07] text-sm text-white/40 px-4 py-3.5 focus:outline-none focus:border-white/25 transition-colors appearance-none cursor-pointer rounded"
          >
            <option value="trust" className="bg-white/[0.02]">Success Rate</option>
            <option value="invocations" className="bg-white/[0.02]">Invocations</option>
            <option value="earnings" className="bg-white/[0.02]">Earnings</option>
            <option value="newest" className="bg-white/[0.02]">Newest</option>
          </select>
        </div>

        {/* Category filters */}
        <div className="flex gap-1 overflow-x-auto mt-4">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`text-sm font-medium px-4 py-2.5 whitespace-nowrap transition-all border rounded ${
                category === cat
                  ? "bg-white/8 text-zinc-300 border-white/20"
                  : "bg-transparent text-white/25 border-white/[0.07] hover:text-white/40 hover:border-white/[0.1]"
              }`}
            >{cat}</button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-6 border border-white/[0.07] bg-white/[0.02] animate-pulse rounded">
                <div className="h-4 bg-white/[0.04] w-20 mb-4" />
                <div className="h-5 bg-white/[0.04] w-48 mb-2" />
                <div className="h-3 bg-white/[0.04] w-32 mb-4" />
                <div className="h-3 bg-white/[0.04] w-full mb-2" />
                <div className="h-3 bg-white/[0.04] w-3/4 mb-6" />
                <div className="h-1 bg-white/[0.04] w-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 pb-16">
          <div className="border border-red-500/20 bg-red-500/5 p-6 text-center rounded">
            <p className="text-red-400/80 text-sm ">Failed to load operators from the database.</p>
            <p className="text-white/20 text-xs mt-2">Error: {error.message}</p>
          </div>
        </div>
      )}

      {/* Operator Grid */}
      {!isLoading && !error && (
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 pb-16 space-y-16">
          {/* Leaderboard */}
          {topPerformers.length > 0 && !search && category === "All" && (
            <section>
              <SectionRow title="Top Performers" count={topPerformers.length} />
              <div className="border border-white/[0.07] rounded overflow-hidden">
                <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/[0.07] text-[9px] text-white/15 tracking-wider">
                  <span>#</span><span>OPERATOR</span><span>TIER</span><span>TRUST</span><span>INVOCATIONS</span><span>EARNED</span>
                </div>
                {topPerformers.map((op, i) => (
                  <Link key={op.id} href={`/marketplace/${op.slug}`}
                    className="w-full grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.015] transition-colors items-center text-left"
                  >
                    <span className="text-xs text-white/15 w-6">{i + 1}</span>
                    <span className="text-sm text-white/60 font-medium truncate">{op.name}</span>
                    <span className={`text-[10px] font-medium ${tierColor(trustTier(op.trustScore))} w-16`}>{trustTier(op.trustScore)}</span>
                    <span className="text-xs text-white/40 w-12 text-right">{op.trustScore}</span>
                    <span className="text-xs text-white/25 w-16 text-right">{op.totalInvocations.toLocaleString()}</span>
                    <span className="text-xs text-white/25 w-20 text-right">${parseFloat(op.totalEarned).toFixed(2)}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* All Operators */}
          <section>
            <SectionRow title={category === "All" ? "All Operators" : category} count={operators.length} />
            <div className="text-[10px] text-white/15 mb-4">
              {operators.length} operator{operators.length !== 1 ? "s" : ""} found
              {search && ` matching "${search}"`}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {operators.map((op) => (
                <OperatorCard key={op.id} op={op} />
              ))}
            </div>

            {operators.length === 0 && (
              <div className="text-center py-24">
                <div className="text-lg text-white/12">No operators match your search.</div>
                <div className="text-sm text-white/8 mt-2">Try adjusting your filters or search terms.</div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Footer CTA */}
      <div className="border-t border-white/[0.07]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-20 text-center">

          <h2 className="text-2xl md:text-3xl font-bold text-white/90 tracking-tight mb-3">
            Deploy your first operator.
          </h2>
          <p className="text-white/25 mb-8 max-w-lg mx-auto leading-relaxed">
            Each operator is a specialized AI skill with bonded reputation and staked validators.
            Upload yours and earn 60% of every invocation fee.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
              <a href="/submit" className="text-sm font-normal bg-white text-zinc-900 px-8 py-3.5 hover:bg-zinc-200 transition-colors rounded">
              Upload Operator
            </a>
            <a                    className="text-sm font-medium border border-white/[0.12] text-zinc-300/60 hover:text-zinc-300 hover:border-white/[0.25] px-8 py-3.5 transition-all rounded">
              Try Playground
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
