import { useState } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";

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

/* ── Category metadata ────────────────────────────────────────────────── */

const CATEGORY_META: Record<string, { title: string; subtitle: string; icon: string }> = {
  "financial-analysis": { title: "DeFi Skills", subtitle: "Trade, analyze, and manage on-chain assets autonomously", icon: "\u{1F4B0}" },
  "data-extraction": { title: "Research Skills", subtitle: "Extract, summarize, and synthesize knowledge at scale", icon: "\u{1F52C}" },
  "text-generation": { title: "Content Skills", subtitle: "Generate, translate, and transform content with AI", icon: "\u270D\uFE0F" },
  "security-audit": { title: "Security Skills", subtitle: "Audit, scan, and protect codebases and smart contracts", icon: "\u{1F6E1}\uFE0F" },
  "code-review": { title: "Developer Tools", subtitle: "Review, refactor, and improve code quality", icon: "\u2699\uFE0F" },
  "summarization": { title: "Analysis Skills", subtitle: "Distill complex information into actionable insights", icon: "\u{1F4CA}" },
  "search": { title: "Discovery Skills", subtitle: "Find and retrieve information across any source", icon: "\u{1F50D}" },
  "translation": { title: "Language Skills", subtitle: "Translate and localize content across languages", icon: "\u{1F310}" },
  "other": { title: "All Skills", subtitle: "Browse every skill on the Aegis Protocol", icon: "\u26A1" },
};

/* ── Helpers ──────────────────────────────────────────────────────────── */

function repColor(score: number) {
  if (score >= 80) return "#A1A1AA";
  if (score >= 60) return "#71717A";
  if (score >= 40) return "#eab308";
  return "rgba(220,100,60,0.50)";
}

/* ── Operator Card ────────────────────────────────────────────────────── */

function OperatorCard({ op }: { op: DbOperator }) {
  const pct = Math.min(100, Math.max(0, op.trustScore));
  const color = repColor(op.trustScore);

  return (
    <Link
      href={`/marketplace/${op.slug}`}
      className="text-left w-full p-6 border border-white/[0.04] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.03] transition-all duration-300 group block rounded"
    >
      {/* Name */}
      <h3 className="text-[14px] font-medium text-white/80 group-hover:text-zinc-300 transition-colors mb-1 truncate">
        {op.name}
      </h3>

      {/* Tagline */}
      <p className="text-[11px] text-white/30 leading-relaxed line-clamp-2 mb-4">
        {op.tagline || op.description?.slice(0, 120) || "No description"}
      </p>

      {/* Trust score bar */}
      <div className="mb-4">
        <div className="h-[3px] bg-white/[0.04] w-full overflow-hidden rounded">
          <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[9px] text-white/15">Trust: {op.trustScore}/100</span>
          <span className="text-[9px] text-white/15">
            {op.totalInvocations.toLocaleString()} calls
          </span>
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-zinc-300/60">${parseFloat(op.pricePerCall).toFixed(3)}/call</span>
        <span className="text-[10px] font-medium text-zinc-300/50 border border-white/[0.10] px-3 py-1 rounded-full group-hover:border-white/20 group-hover:text-zinc-300/70 transition-all">
          Invoke
        </span>
      </div>
    </Link>
  );
}

/* ── Main Component ───────────────────────────────────────────────────── */

export default function CategoryLanding() {
  const [, params] = useRoute("/skills/:category");
  const category = params?.category || "other";
  const meta = CATEGORY_META[category] || CATEGORY_META["other"];

  const { data, isLoading } = trpc.operator.list.useQuery({
    category: category === "other" ? undefined : category,
    limit: 50,
    sortBy: "trust",
  });

  const operators = (data as any)?.operators ?? [];
  const total = (data as any)?.total ?? 0;

  // Compute stats
  const avgTrust = operators.length > 0
    ? Math.round(operators.reduce((s: number, o: DbOperator) => s + o.trustScore, 0) / operators.length)
    : 0;
  const totalInvocations = operators.reduce((s: number, o: DbOperator) => s + o.totalInvocations, 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero Section */}
      <div className="pt-24">
        <div className="border-b border-white/[0.04]">
          <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-16 md:py-24">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[10px] font-medium text-zinc-300/60 bg-white/[0.04] border border-white/[0.10] px-3 py-1 rounded-full">
                  SKILL CATEGORY
                </span>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl">{meta.icon}</span>
                <h1 className="text-4xl md:text-5xl lg:text-[56px] font-normal tracking-tight leading-[1.05] text-white/95">
                  {meta.title}
                </h1>
              </div>
              <p className="text-base md:text-lg text-white/30 max-w-lg leading-relaxed mt-4">
                {meta.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="border-b border-white/[0.04] bg-white/[0.01]">
          <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[9px] font-medium text-zinc-300/50 tracking-wider">CATEGORY STATS</span>
              <div className="h-px flex-1 bg-white/[0.04]" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
              <span className="text-[9px] font-medium text-zinc-300/40">LIVE</span>
            </div>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="text-2xl md:text-3xl font-normal text-white/90 tracking-tight">
                  {isLoading ? "--" : total}
                </div>
                <div className="text-[11px] text-white/25 mt-1 tracking-wider">OPERATORS</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-normal text-white/90 tracking-tight">
                  {isLoading ? "--" : avgTrust}
                </div>
                <div className="text-[11px] text-white/25 mt-1 tracking-wider">AVG TRUST SCORE</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-normal text-white/90 tracking-tight">
                  {isLoading ? "--" : totalInvocations.toLocaleString()}
                </div>
                <div className="text-[11px] text-white/25 mt-1 tracking-wider">TOTAL INVOCATIONS</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Operator Grid */}
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-6 border border-white/[0.04] bg-white/[0.02] animate-pulse rounded">
                <div className="h-5 bg-white/[0.04] w-48 mb-2 rounded" />
                <div className="h-3 bg-white/[0.04] w-full mb-2 rounded" />
                <div className="h-3 bg-white/[0.04] w-3/4 mb-6 rounded" />
                <div className="h-1 bg-white/[0.04] w-full rounded" />
              </div>
            ))}
          </div>
        ) : operators.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-lg text-white/12">No operators found in this category.</div>
            <div className="text-sm text-white/8 mt-2">Be the first to deploy a {meta.title.toLowerCase()} operator.</div>
          </div>
        ) : (
          <>
            <div className="text-[10px] text-white/15 mb-6">
              {operators.length} operator{operators.length !== 1 ? "s" : ""} found
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {operators.map((op: DbOperator) => (
                <OperatorCard key={op.id} op={op} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="border-t border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-normal text-white/90 tracking-tight mb-3">
            Deploy a {meta.title.replace(" Skills", "").replace(" Tools", "")} Skill
          </h2>
          <p className="text-white/25 mb-8 max-w-lg mx-auto leading-relaxed">
            Upload your operator and earn 60% of every invocation fee. Join the Aegis Protocol ecosystem today.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/submit" className="text-sm font-normal bg-white text-zinc-900 px-8 py-3.5 hover:bg-zinc-200 transition-colors rounded">
              Deploy Operator
            </Link>
            <Link href="/marketplace" className="text-sm font-medium border border-white/[0.12] text-zinc-300/60 hover:text-zinc-300 hover:border-white/[0.25] px-8 py-3.5 transition-all rounded">
              Browse All Skills
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
