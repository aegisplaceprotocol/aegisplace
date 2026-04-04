import { useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Link, useSearch } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { API_BASE_URL } from "@/lib/api";
import {
  sanitizeSlug,
  sendSkillRegistrationTransaction,
  type PreparedSkillRegistrationPlan,
} from "@/lib/solanaSkillRegistry";

/* ── Types ─────────────────────────────────────────────────────────────── */

interface MarketplaceSkill {
  id: string;
  name: string;
  creator: string;
  creatorAddress: string;
  creatorAvatar: string;
  category: string;
  description: string;
  pricingModel: "per-use" | "subscription" | "tiered" | "revenue-share" | "staked";
  priceDisplay: string;
  pricePerCall: number;
  monthlyEarnings: number;
  totalEarnings: number;
  invocations: number;
  rating: number;
  reviews: number;
  trustScore: number;
  successRate: number;
  avgLatency: string;
  version: string;
  lastUpdated: string;
  tags: string[];
  composableWith: string[];
  operatorsUsing: number;
  status: "verified" | "beta" | "new";
  trending: boolean;
  featured: boolean;
}

interface TopCreator {
  name: string;
  address: string;
  skills: number;
  totalEarnings: number;
  totalInvocations: number;
  avgRating: number;
  rank: number;
}

/* ── Helpers: parse MongoDB Decimal128 ─────────────────────────────────── */

function parseDecimal(val: any): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (val.$numberDecimal) return parseFloat(val.$numberDecimal);
  return parseFloat(String(val)) || 0;
}

function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr ?? "";
  return addr.slice(0, 5) + "..." + addr.slice(-4);
}

function mapOperatorToSkill(op: any): MarketplaceSkill {
  const totalEarned = parseDecimal(op.totalEarned);
  const pricePerCall = parseDecimal(op.pricePerCall);
  return {
    id: op._id ?? op.slug ?? op.name,
    name: op.name ?? "Unnamed Skill",
    creator: op.creatorWallet ? shortenAddress(op.creatorWallet) : "Unknown",
    creatorAddress: op.creatorWallet ? shortenAddress(op.creatorWallet) : "",
    creatorAvatar: (op.name ?? "??").slice(0, 2).toUpperCase(),
    category: op.category ?? "Uncategorized",
    description: op.description ?? op.tagline ?? "",
    pricingModel: "per-use",
    priceDisplay: pricePerCall > 0 ? `$${pricePerCall.toFixed(pricePerCall < 0.01 ? 4 : 2)}/call` : "Free",
    pricePerCall,
    monthlyEarnings: 0,
    totalEarnings: totalEarned,
    invocations: op.totalInvocations ?? 0,
    rating: 0,
    reviews: 0,
    trustScore: op.trustScore ?? 0,
    successRate: op.successRate ?? 0,
    avgLatency: ". ",
    version: ". ",
    lastUpdated: ". ",
    tags: op.tags ?? [],
    composableWith: [],
    operatorsUsing: 0,
    status: op.isActive ? "verified" : "beta",
    trending: (op.totalInvocations ?? 0) > 1000,
    featured: (op.trustScore ?? 0) >= 95,
  };
}

const CATEGORIES = ["All", "Security", "DeFi", "Analytics", "Infrastructure", "Development", "Communication", "NFTs", "Productivity"];

const PRICING_MODELS = ["All", "per-use", "subscription", "revenue-share", "tiered", "staked"];

const CATEGORY_ICONS: Record<string, string> = {
  Security: "🛡",
  DeFi: "📈",
  Analytics: "📊",
  Infrastructure: "⚙",
  Development: "{ }",
  Communication: "💬",
  NFTs: "◈",
  Productivity: "⚡",
  Uncategorized: "✦",
  All: "✦",
};

const CATEGORY_OPTIONS = [
  ["code-review", "Code Review"],
  ["sentiment-analysis", "Sentiment Analysis"],
  ["data-extraction", "Data Extraction"],
  ["image-generation", "Image Generation"],
  ["text-generation", "Text Generation"],
  ["translation", "Translation"],
  ["summarization", "Summarization"],
  ["classification", "Classification"],
  ["search", "Search"],
  ["financial-analysis", "Financial Analysis"],
  ["security-audit", "Security Audit"],
  ["other", "Other"],
] as const;

function parseOptionalJson(value: string) {
  if (!value.trim()) return undefined;
  return JSON.parse(value);
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + "K";
  return n.toLocaleString();
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + "K";
  return "$" + n.toLocaleString();
}

function trustRingColor(score: number): string {
  if (score >= 95) return "#10B981";
  if (score >= 85) return "#34D399";
  if (score >= 75) return "#A3A3A3";
  if (score >= 60) return "#F59E0B";
  return "#EF4444";
}

function trustColor(score: number): string {
  if (score >= 95) return "text-[#10B981]";
  if (score >= 85) return "text-[#34D399]";
  if (score >= 75) return "text-zinc-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "verified": return "badge-success";
    case "beta": return "badge-warning";
    case "new": return "badge-neutral";
    default: return "badge-neutral";
  }
}

function pricingBadge(model: string): string {
  switch (model) {
    case "per-use": return "bg-white/[0.06] text-white/50";
    case "subscription": return "bg-white/[0.06] text-white/50";
    case "revenue-share": return "bg-[#10B981]/10 text-[#10B981]/70";
    case "tiered": return "bg-white/[0.06] text-white/50";
    case "staked": return "bg-white/[0.06] text-white/50";
    default: return "bg-white/[0.04] text-white/35";
  }
}

/* ── Trust Ring SVG ─────────────────────────────────────────────────────── */

function TrustRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score));
  const dash = (pct / 100) * circ;
  const color = trustRingColor(score);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-label={`Trust score ${score}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
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
  );
}

/* ── Skeleton Card ──────────────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="card-standard p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="h-4 skeleton-shimmer w-3/4 mb-2" />
          <div className="h-3 skeleton-shimmer w-1/2" />
        </div>
        <div className="h-5 w-14 skeleton-shimmer" />
      </div>
      <div className="h-3 skeleton-shimmer w-full mb-1.5" />
      <div className="h-3 skeleton-shimmer w-2/3 mb-4" />
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <div className="h-2 skeleton-shimmer w-10 mb-1" />
            <div className="h-3 skeleton-shimmer w-12" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-white/4">
        <div className="h-4 skeleton-shimmer w-24" />
        <div className="h-4 skeleton-shimmer w-16" />
      </div>
    </div>
  );
}

/* ── Stat Card ──────────────────────────────────────────────────────────── */

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card-glass p-4 hover:border-white/10 transition-all group">
      <div className="text-[9px] font-bold text-white/40 tracking-widest uppercase mb-2">{label}</div>
      <div className="text-xl font-normal text-[#10B981] tracking-tight">{value}</div>
      {sub && <div className="text-[10px] text-white/40 mt-1">{sub}</div>}
    </div>
  );
}

/* ── Skill Card ─────────────────────────────────────────────────────────── */

function SkillCard({ skill, onSelect }: { skill: MarketplaceSkill; onSelect: (s: MarketplaceSkill) => void }) {
  const catIcon = CATEGORY_ICONS[skill.category] ?? "✦";

  return (
    <button
      onClick={() => onSelect(skill)}
      className="w-full text-left group relative"
      style={{
        background: "var(--tier-1)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderTop: "1px solid rgba(16,185,129,0.20)",
        borderRadius: "6px",
        transition: "transform 150ms ease, border-color 150ms ease, box-shadow 200ms ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(-2px)";
        el.style.borderColor = "rgba(255,255,255,0.12)";
        el.style.borderTopColor = "rgba(16,185,129,0.45)";
        el.style.boxShadow = "0 8px 32px rgba(16,185,129,0.07), 0 2px 8px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(0)";
        el.style.borderColor = "rgba(255,255,255,0.06)";
        el.style.borderTopColor = "rgba(16,185,129,0.20)";
        el.style.boxShadow = "none";
      }}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {/* Category icon */}
              <span className="text-[11px] text-white/35 font-mono">{catIcon}</span>
              <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors tracking-[-0.025em]">
                {skill.name}
              </span>
              {skill.trending && (
                <span
                  className="text-[8px] font-bold px-1.5 py-0.5 tracking-wider"
                  style={{
                    background: "rgba(16,185,129,0.12)",
                    color: "#10B981",
                    border: "1px solid rgba(16,185,129,0.25)",
                    borderRadius: "3px",
                    boxShadow: "0 0 8px rgba(16,185,129,0.15)",
                    letterSpacing: "0.08em",
                  }}
                >
                  TRENDING
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 flex items-center justify-center text-[7px] font-bold text-[#10B981]"
                style={{
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.20)",
                  borderRadius: "50%",
                }}
              >
                {skill.creatorAvatar}
              </div>
              <span className="text-[11px] font-medium text-white/50">{skill.creator}</span>
              {skill.creatorAddress && (
                <span className="text-[9px] font-medium text-white/25">{skill.creatorAddress}</span>
              )}
            </div>
          </div>
          {/* Status badge + Trust ring */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={`text-[8px] font-bold px-2 py-0.5 tracking-wider uppercase ${statusBadgeClass(skill.status)}`}>
              {skill.status}
            </span>
            <div className="relative flex items-center justify-center" style={{ width: 40, height: 40 }}>
              <TrustRing score={skill.trustScore} size={40} />
              <span
                className="absolute text-[9px] font-bold"
                style={{ color: trustRingColor(skill.trustScore) }}
              >
                {skill.trustScore}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-white/50 leading-relaxed mb-4 line-clamp-2">{skill.description}</p>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div>
            <div className="text-[8px] font-bold text-white/30 mb-0.5 tracking-wider">CALLS</div>
            <div className="text-xs font-medium text-white/65">{formatNum(skill.invocations)}</div>
          </div>
          <div>
            <div className="text-[8px] font-bold text-white/30 mb-0.5 tracking-wider">RATING</div>
            <div className="text-xs font-medium text-white/65">{skill.rating > 0 ? `${skill.rating}/5` : "—"}</div>
          </div>
          <div>
            <div className="text-[8px] font-bold text-white/30 mb-0.5 tracking-wider">SUCCESS</div>
            <div className="flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  background: skill.successRate >= 95 ? "#10B981" : skill.successRate >= 80 ? "#F59E0B" : "#EF4444",
                  boxShadow: skill.successRate >= 95 ? "0 0 4px rgba(16,185,129,0.5)" : "none",
                }}
              />
              <span className={`text-xs font-medium ${trustColor(skill.successRate)}`}>
                {skill.successRate > 0 ? `${skill.successRate}%` : "—"}
              </span>
            </div>
          </div>
          <div>
            <div className="text-[8px] font-bold text-white/30 mb-0.5 tracking-wider">OPS</div>
            <div className="text-xs font-medium text-white/65">{formatNum(skill.operatorsUsing)}</div>
          </div>
        </div>

        {/* Tags */}
        {skill.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {skill.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-[9px] font-medium px-2 py-0.5"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.40)",
                  borderRadius: "3px",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Pricing + Earnings */}
        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-2">
            <span className={`text-[8px] font-bold px-2 py-0.5 rounded tracking-wider uppercase ${pricingBadge(skill.pricingModel)}`}>
              {skill.pricingModel}
            </span>
            <span className="text-sm font-semibold" style={{ color: "#10B981" }}>
              {skill.priceDisplay}
            </span>
          </div>
          <div className="text-right">
            <div className="text-[8px] font-bold text-white/25 tracking-wider">EARNED</div>
            <div className="text-xs font-medium text-white/60">{formatMoney(skill.totalEarnings)}</div>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ── Skill Detail Modal ─────────────────────────────────────────────────── */

function SkillDetail({ skill, onClose }: { skill: MarketplaceSkill; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
      <div
        className="card-glow relative w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        style={{
          background: "var(--tier-1)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 0 60px rgba(0,0,0,0.8), 0 0 24px rgba(16,185,129,0.05)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 p-5 flex items-start justify-between"
          style={{
            background: "var(--tier-1)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-start gap-4">
            <div className="relative flex items-center justify-center shrink-0" style={{ width: 52, height: 52 }}>
              <TrustRing score={skill.trustScore} size={52} />
              <span
                className="absolute text-[10px] font-bold"
                style={{ color: trustRingColor(skill.trustScore) }}
              >
                {skill.trustScore}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-medium text-white/95 tracking-[-0.025em]">{skill.name}</h2>
                <span className={`text-[8px] font-bold px-2 py-0.5 tracking-wider uppercase ${statusBadgeClass(skill.status)}`}>
                  {skill.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 flex items-center justify-center text-[8px] font-bold text-[#10B981]"
                  style={{
                    background: "rgba(16,185,129,0.08)",
                    border: "1px solid rgba(16,185,129,0.20)",
                    borderRadius: "50%",
                  }}
                >
                  {skill.creatorAvatar}
                </div>
                <span className="text-xs text-white/55">{skill.creator}</span>
                {skill.creatorAddress && (
                  <span className="text-[10px] font-medium text-white/30">{skill.creatorAddress}</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/35 hover:text-white/70 transition-colors p-1 shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Description */}
          <div>
            <div className="text-[9px] font-bold text-white/30 tracking-widest uppercase mb-2">About This Skill</div>
            <p className="text-sm text-white/60 leading-relaxed">{skill.description}</p>
          </div>

          {/* Key Metrics */}
          <div>
            <div className="text-[9px] font-bold text-white/30 tracking-widest uppercase mb-3">Performance</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="card-glass p-3">
                <div className="text-[8px] font-bold text-white/35 tracking-wider mb-1">SUCCESS RATE</div>
                <div className={`text-lg font-semibold tracking-tight ${trustColor(skill.successRate)}`}>
                  {skill.successRate > 0 ? `${skill.successRate}%` : "—"}
                </div>
              </div>
              <div className="card-glass p-3">
                <div className="text-[8px] font-bold text-white/35 tracking-wider mb-1">AVG LATENCY</div>
                <div className="text-lg font-semibold text-white/80 tracking-tight">{skill.avgLatency}</div>
              </div>
              <div className="card-glass p-3">
                <div className="text-[8px] font-bold text-white/35 tracking-wider mb-1">TRUST SCORE</div>
                <div className={`text-lg font-semibold tracking-tight ${trustColor(skill.trustScore)}`}>
                  {skill.trustScore}/100
                </div>
              </div>
              <div className="card-glass p-3">
                <div className="text-[8px] font-bold text-white/35 tracking-wider mb-1">TOTAL CALLS</div>
                <div className="text-lg font-semibold text-white/80 tracking-tight">{formatNum(skill.invocations)}</div>
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div>
            <div className="text-[9px] font-bold text-white/30 tracking-widest uppercase mb-3">Creator Revenue</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="card-glass p-3">
                <div className="text-[8px] font-bold text-white/35 tracking-wider mb-1">THIS MONTH</div>
                <div className="text-lg font-semibold tracking-tight" style={{ color: "#10B981" }}>
                  {formatMoney(skill.monthlyEarnings)}
                </div>
              </div>
              <div className="card-glass p-3">
                <div className="text-[8px] font-bold text-white/35 tracking-wider mb-1">ALL TIME</div>
                <div className="text-lg font-semibold tracking-tight" style={{ color: "#10B981" }}>
                  {formatMoney(skill.totalEarnings)}
                </div>
              </div>
              <div className="card-glass p-3">
                <div className="text-[8px] font-bold text-white/35 tracking-wider mb-1">PRICING</div>
                <div className="text-sm font-medium text-white/75 tracking-tight">{skill.priceDisplay}</div>
                <div className={`text-[9px] font-bold mt-1 tracking-wider uppercase ${pricingBadge(skill.pricingModel)}`}>
                  {skill.pricingModel}
                </div>
              </div>
            </div>
          </div>

          {/* Composability */}
          {skill.composableWith.length > 0 && (
            <div>
              <div className="text-[9px] font-bold text-white/30 tracking-widest uppercase mb-3">Works With</div>
              <div className="flex flex-wrap gap-2">
                {skill.composableWith.map((s) => (
                  <span
                    key={s}
                    className="text-[11px] font-medium text-white/50 px-3 py-1.5 hover:text-white/70 transition-all cursor-default"
                    style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px" }}
                  >
                    {s}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-white/30 mt-2">Chain these skills together to build powerful multi-step workflows.</p>
              <p className="text-[10px] text-white/35 mt-2 font-mono">
                Available in AegisX via: aegisx skills search -q {skill.name}
              </p>
            </div>
          )}

          {/* Tags */}
          {skill.tags.length > 0 && (
            <div>
              <div className="text-[9px] font-bold text-white/30 tracking-widest uppercase mb-2">Tags</div>
              <div className="flex flex-wrap gap-1.5">
                {skill.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-medium text-white/45 px-2 py-0.5"
                    style={{ background: "rgba(255,255,255,0.06)", borderRadius: "3px" }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Meta */}
          <div
            className="grid grid-cols-3 gap-3 pt-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div>
              <div className="text-[8px] font-bold text-white/25 tracking-wider mb-0.5">VERSION</div>
              <div className="text-xs text-white/50">v{skill.version}</div>
            </div>
            <div>
              <div className="text-[8px] font-bold text-white/25 tracking-wider mb-0.5">UPDATED</div>
              <div className="text-xs text-white/50">{skill.lastUpdated}</div>
            </div>
            <div>
              <div className="text-[8px] font-bold text-white/25 tracking-wider mb-0.5">REVIEWS</div>
              <div className="text-xs text-white/50">{skill.reviews}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { toast.success("Skill added to your operator!"); onClose(); }}
              className="flex-1 text-sm font-semibold py-3 transition-all"
              style={{
                background: "#10B981",
                color: "#000",
                borderRadius: "5px",
                boxShadow: "0 0 20px rgba(16,185,129,0.25)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#059669";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 28px rgba(16,185,129,0.4)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#10B981";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(16,185,129,0.25)";
              }}
            >
              Invoke Skill
            </button>
            <button
              onClick={() => toast.info("Sandbox testing is available via the CLI: agent-aegis test --sandbox")}
              className="text-sm font-medium text-white/55 hover:text-white/80 px-6 py-3 transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "5px" }}
            >
              Try Free
            </button>
          </div>
          <div className="flex justify-end pt-1">
            <a
              href="https://aegisplace.com/aegisx"
              target="_blank"
              rel="noopener"
              className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
            >
              Open in AegisX IDE →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Upload Wizard ──────────────────────────────────────────────────────── */

function UploadWizard({ onClose }: { onClose: () => void }) {
  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();
  const { isAuthenticated, user, refresh, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const registerMutation = trpc.operator.register.useMutation();
  const [step, setStep] = useState(1);
  const [skillName, setSkillName] = useState("");
  const [skillSlug, setSkillSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [skillDesc, setSkillDesc] = useState("");
  const [skillCategory, setSkillCategory] = useState("other");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [httpMethod, setHttpMethod] = useState("POST");
  const [priceAmount, setPriceAmount] = useState("0.050000");
  const [tags, setTags] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [docsUrl, setDocsUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [requestSchema, setRequestSchema] = useState("{\n  \"input\": \"string\"\n}");
  const [responseSchema, setResponseSchema] = useState("{\n  \"result\": \"string\"\n}");
  const [submitting, setSubmitting] = useState(false);

  const walletAddress = publicKey?.toBase58() ?? ((user as { walletAddress?: string } | null)?.walletAddress ?? "");
  const apiBaseUrl = useMemo(() => {
    if (API_BASE_URL) return API_BASE_URL;
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }, []);
  const sessionWallet = (user as { walletAddress?: string } | null)?.walletAddress ?? "";
  const slugValue = sanitizeSlug(skillSlug || skillName);
  const authReady = Boolean(isAuthenticated && walletAddress && (!sessionWallet || sessionWallet === walletAddress));
  const uploadEnabled = Boolean(connected && publicKey && sendTransaction && authReady) && !submitting && !registerMutation.isPending;
  const canAdvance =
    (step === 1 && Boolean(skillName.trim() && slugValue && skillDesc.trim())) ||
    (step === 2 && Boolean(endpointUrl.trim() && priceAmount.trim())) ||
    (step === 3 && Boolean(requestSchema.trim() && responseSchema.trim())) ||
    step === 4;

  useEffect(() => {
    if (!connected || !publicKey || authReady) return;

    const handleWalletAuthenticated = (event: Event) => {
      const customEvent = event as CustomEvent<{ wallet?: string }>;
      if (!customEvent.detail?.wallet || customEvent.detail.wallet === publicKey.toBase58()) {
        void refresh();
      }
    };

    window.addEventListener("aegis:wallet-authenticated", handleWalletAuthenticated as EventListener);
    return () => {
      window.removeEventListener("aegis:wallet-authenticated", handleWalletAuthenticated as EventListener);
    };
  }, [authReady, connected, publicKey, refresh]);

  async function handleUpload() {
    if (!connected || !publicKey || !sendTransaction) {
      toast.error("Connect a Solana wallet before uploading a skill");
      return;
    }

    if (!authReady) {
      toast.error("Authenticate with your wallet before publishing a skill");
      return;
    }

    if (!slugValue) {
      toast.error("Provide a valid skill slug");
      return;
    }

    setSubmitting(true);
    try {
      const parsedRequestSchema = parseOptionalJson(requestSchema);
      const parsedResponseSchema = parseOptionalJson(responseSchema);

      const plan = await utils.operator.prepareRegistration.fetch({
        slug: slugValue,
        creatorWallet: walletAddress,
        apiBaseUrl,
        endpointUrl,
      }) as PreparedSkillRegistrationPlan;

      const txSignature = await sendSkillRegistrationTransaction({
        connection,
        sendTransaction,
        creatorWallet: walletAddress,
        plan,
        payload: {
          name: skillName.trim(),
          slug: slugValue,
          endpointUrl: endpointUrl.trim(),
          metadataUri: plan.metadataUri,
          pricePerCall: priceAmount,
          category: skillCategory,
        },
      });

      await registerMutation.mutateAsync({
        name: skillName.trim(),
        slug: slugValue,
        tagline: tagline.trim() || undefined,
        description: skillDesc.trim() || undefined,
        category: skillCategory as any,
        endpointUrl: endpointUrl.trim(),
        httpMethod: httpMethod as "GET" | "POST" | "PUT",
        requestSchema: parsedRequestSchema,
        responseSchema: parsedResponseSchema,
        pricePerCall: priceAmount,
        creatorWallet: walletAddress,
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        iconUrl: iconUrl.trim() || undefined,
        docsUrl: docsUrl.trim() || undefined,
        githubUrl: githubUrl.trim() || undefined,
        onChainProgramId: plan.programId,
        onChainConfigPda: plan.configPda,
        onChainOperatorPda: plan.operatorPda,
        onChainOperatorId: plan.operatorId,
        onChainTxSignature: txSignature,
        onChainMetadataUri: plan.metadataUri,
        onChainCluster: plan.cluster as "devnet" | "mainnet-beta" | "testnet" | "localnet",
      });

      await Promise.all([
        utils.operator.list.invalidate(),
        utils.operator.mine.invalidate(),
      ]);

      toast.success("Skill registered on Solana and published to the marketplace");
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload skill");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full text-sm text-white/75 px-4 py-3 placeholder:text-white/20 focus:outline-none transition-colors";
  const inputStyle = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "5px",
  };
  const inputFocusStyle = { borderColor: "rgba(16,185,129,0.40)" };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
      <div
        className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto"
        style={{
          background: "var(--tier-1)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "6px",
          boxShadow: "0 0 60px rgba(0,0,0,0.8), 0 0 24px rgba(16,185,129,0.05)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <h2 className="text-lg font-medium text-white/95 tracking-[-0.025em]">Upload Your Skill</h2>
            <div className="flex items-center gap-2 mt-1">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center gap-1">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all"
                    style={{
                      background: s <= step ? "#10B981" : "rgba(255,255,255,0.06)",
                      color: s <= step ? "#000" : "rgba(255,255,255,0.30)",
                      boxShadow: s === step ? "0 0 10px rgba(16,185,129,0.35)" : "none",
                    }}
                  >
                    {s}
                  </div>
                  {s < 4 && (
                    <div
                      className="w-6 h-px transition-all"
                      style={{ background: s < step ? "#10B981" : "rgba(255,255,255,0.08)" }}
                    />
                  )}
                </div>
              ))}
              <span className="text-[10px] text-white/35 ml-1">Step {step} of 4</span>
            </div>
          </div>
          <button onClick={onClose} className="text-white/35 hover:text-white/70 transition-colors p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${(step / 4) * 100}%`,
              background: "#10B981",
              boxShadow: "0 0 8px rgba(16,185,129,0.5)",
            }}
          />
        </div>

        <div className="p-5 space-y-5">
          {step === 1 && (
            <>
              <div className="text-[9px] font-bold text-white/40 tracking-widest uppercase mb-4">Basic Info</div>
              <div>
                <label className="text-xs font-medium text-white/55 mb-1.5 block">Skill Name</label>
                <input
                  type="text" value={skillName} onChange={(e) => { setSkillName(e.target.value); if (!skillSlug) setSkillSlug(sanitizeSlug(e.target.value)); }}
                  placeholder="e.g. Smart Contract Auditor"
                  className={inputClass}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/55 mb-1.5 block">Slug</label>
                <input
                  type="text" value={skillSlug} onChange={(e) => setSkillSlug(sanitizeSlug(e.target.value))}
                  placeholder="e.g. smart-contract-auditor"
                  className={inputClass}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/55 mb-1.5 block">Tagline</label>
                <input
                  type="text" value={tagline} onChange={(e) => setTagline(e.target.value)}
                  placeholder="One-line value proposition for the marketplace card"
                  className={inputClass}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/55 mb-1.5 block">Description</label>
                <textarea
                  value={skillDesc} onChange={(e) => setSkillDesc(e.target.value)}
                  placeholder="Explain what your skill does in plain English. What problem does it solve? Who is it for?"
                  rows={4}
                  className={`${inputClass} resize-none`}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/55 mb-1.5 block">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_OPTIONS.map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setSkillCategory(value)}
                      className="text-[11px] font-medium px-3 py-1.5 transition-all"
                      style={skillCategory === value ? {
                        background: "rgba(16,185,129,0.12)",
                        color: "#10B981",
                        border: "1px solid rgba(16,185,129,0.30)",
                        borderRadius: "4px",
                      } : {
                        background: "transparent",
                        color: "rgba(255,255,255,0.35)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "4px",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-[9px] font-bold text-white/40 tracking-widest uppercase mb-4">Endpoint & Pricing</div>
              <p className="text-xs text-white/45 mb-4">Set the live endpoint your skill exposes and the per-call amount charged on-chain.</p>
              <div>
                <label className="text-xs font-medium text-white/55 mb-1.5 block">Endpoint URL</label>
                <input
                  type="url" value={endpointUrl} onChange={(e) => setEndpointUrl(e.target.value)}
                  placeholder="https://api.example.com/skill"
                  className={inputClass}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-white/55 mb-1.5 block">HTTP Method</label>
                  <select
                    value={httpMethod}
                    onChange={(e) => setHttpMethod(e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                    onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
                  >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                    <option value="PUT">PUT</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-white/55 mb-1.5 block">Price / Call</label>
                  <input
                    type="text" value={priceAmount} onChange={(e) => setPriceAmount(e.target.value)}
                    placeholder="0.050000"
                    className={inputClass}
                    style={inputStyle}
                    onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="text-xs font-medium text-white/55 mb-1.5 block">Tags</label>
                <input
                  type="text" value={tags} onChange={(e) => setTags(e.target.value)}
                  placeholder="mcp, audits, security"
                  className={inputClass}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="text-[9px] font-bold text-white/40 tracking-widest uppercase mb-4">Schemas & Links</div>
              <p className="text-xs text-white/45 mb-4">Add the interface definition and the links shown on the marketplace listing.</p>
              <div>
                <label className="text-xs font-medium text-white/55 mb-1.5 block">Request Schema JSON</label>
                <textarea
                  value={requestSchema} onChange={(e) => setRequestSchema(e.target.value)}
                  rows={6}
                  className={`${inputClass} resize-none font-mono text-xs`}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/55 mb-1.5 block">Response Schema JSON</label>
                <textarea
                  value={responseSchema} onChange={(e) => setResponseSchema(e.target.value)}
                  rows={6}
                  className={`${inputClass} resize-none font-mono text-xs`}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  type="url" value={docsUrl} onChange={(e) => setDocsUrl(e.target.value)}
                  placeholder="Docs URL"
                  className={inputClass}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
                />
                <input
                  type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="GitHub URL"
                  className={inputClass}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
                />
                <input
                  type="url" value={iconUrl} onChange={(e) => setIconUrl(e.target.value)}
                  placeholder="Icon URL"
                  className={inputClass}
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.currentTarget.style, inputStyle)}
                />
              </div>
              <div className="mt-5 p-4" style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: "5px" }}>
                <div className="text-[9px] font-bold text-white/30 tracking-widest uppercase mb-2">What Happens Next</div>
                <div className="space-y-2">
                  {[
                    "The backend validates your slug and checks the endpoint is reachable",
                    "Your wallet signs the on-chain register_operator transaction",
                    "Marketplace metadata is stored with the tx signature and PDAs",
                    "The skill becomes discoverable through the marketplace, REST API, and MCP",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5" style={{ color: "#10B981" }}>
                        <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      <span className="text-[11px] text-white/50">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="text-[9px] font-bold text-white/40 tracking-widest uppercase mb-4">Review and Submit</div>
              <div className="space-y-4">
                <div className="card-glass p-4">
                  <div className="text-[8px] font-bold text-white/30 tracking-wider mb-1">SKILL NAME</div>
                  <div className="text-sm text-white/80">{skillName || "Untitled Skill"}</div>
                </div>
                <div className="card-glass p-4">
                  <div className="text-[8px] font-bold text-white/30 tracking-wider mb-1">SLUG</div>
                  <div className="text-sm text-white/80">{slugValue || "not-set"}</div>
                </div>
                <div className="card-glass p-4">
                  <div className="text-[8px] font-bold text-white/30 tracking-wider mb-1">DESCRIPTION</div>
                  <div className="text-xs text-white/60">{skillDesc || "No description provided"}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="card-glass p-4">
                    <div className="text-[8px] font-bold text-white/30 tracking-wider mb-1">CATEGORY</div>
                    <div className="text-sm text-white/80">{CATEGORY_OPTIONS.find(([value]) => value === skillCategory)?.[1] ?? skillCategory}</div>
                  </div>
                  <div className="card-glass p-4">
                    <div className="text-[8px] font-bold text-white/30 tracking-wider mb-1">PRICING</div>
                    <div className="text-sm text-white/80">{priceAmount ? `$${priceAmount}/call` : "Not set"}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="card-glass p-4">
                    <div className="text-[8px] font-bold text-white/30 tracking-wider mb-1">ENDPOINT</div>
                    <div className="text-xs text-white/60 break-all">{endpointUrl || "No endpoint provided"}</div>
                  </div>
                  <div className="card-glass p-4">
                    <div className="text-[8px] font-bold text-white/30 tracking-wider mb-1">METHOD</div>
                    <div className="text-sm text-white/80">{httpMethod}</div>
                  </div>
                </div>
                <div className="p-4" style={{ border: "1px solid rgba(16,185,129,0.15)", background: "rgba(16,185,129,0.04)", borderRadius: "5px" }}>
                  <div className="text-[9px] font-bold tracking-widest uppercase mb-2" style={{ color: "#10B981" }}>
                    How You Will Earn
                  </div>
                  <p className="text-xs text-white/55 leading-relaxed">
                    Every time an operator uses your skill, the on-chain invocation flow charges {priceAmount ? `$${priceAmount}` : "$0.05"} per call and records the creator-owned listing on Solana before the marketplace publishes the metadata.
                  </p>
                </div>
                <div className="card-glass p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[8px] font-bold text-white/30 tracking-wider mb-1">WALLET</div>
                      <div className="text-xs text-white/60 break-all">{walletAddress || "No wallet connected"}</div>
                    </div>
                    <ConnectWalletButton />
                  </div>
                  <p className="mt-3 text-[11px] text-white/45">
                    Connect and authenticate a wallet first. The Upload CTA unlocks after the session refresh completes for the connected wallet.
                  </p>
                  {connected && !authReady && authLoading && (
                    <p className="mt-2 text-[11px] text-[#10B981]">Finalizing wallet session...</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="text-sm font-medium text-white/50 hover:text-white/75 px-6 py-3 transition-all"
                style={{ border: "1px solid rgba(255,255,255,0.09)", borderRadius: "5px" }}
              >
                Back
              </button>
            )}
            {step < 4 ? (
              <button
                type="button"
                disabled={!canAdvance}
                onClick={() => setStep(step + 1)}
                className="flex-1 text-sm font-semibold py-3 transition-all"
                style={{
                  background: canAdvance ? "#10B981" : "rgba(255,255,255,0.08)",
                  color: canAdvance ? "#000" : "rgba(255,255,255,0.35)",
                  borderRadius: "5px",
                  boxShadow: canAdvance ? "0 0 16px rgba(16,185,129,0.25)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!canAdvance) return;
                  (e.currentTarget as HTMLButtonElement).style.background = "#059669";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 24px rgba(16,185,129,0.40)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = canAdvance ? "#10B981" : "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = canAdvance ? "0 0 16px rgba(16,185,129,0.25)" : "none";
                }}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                disabled={!uploadEnabled}
                onClick={handleUpload}
                className="flex-1 text-sm font-semibold py-3 transition-all"
                style={{
                  background: uploadEnabled ? "#10B981" : "rgba(255,255,255,0.08)",
                  color: uploadEnabled ? "#000" : "rgba(255,255,255,0.35)",
                  borderRadius: "5px",
                  boxShadow: uploadEnabled ? "0 0 16px rgba(16,185,129,0.25)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!uploadEnabled) return;
                  (e.currentTarget as HTMLButtonElement).style.background = "#059669";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 24px rgba(16,185,129,0.40)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = uploadEnabled ? "#10B981" : "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = uploadEnabled ? "0 0 16px rgba(16,185,129,0.25)" : "none";
                }}
              >
                {submitting || registerMutation.isPending
                  ? "Uploading Skill..."
                  : connected && authReady
                    ? "Upload Skill"
                    : "Connect Wallet To Upload"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Revenue Simulator ──────────────────────────────────────────────────── */

function RevenueSimulator() {
  const [calls, setCalls] = useState(10000);
  const [price, setPrice] = useState(0.05);
  const creatorShare = 0.70;
  const monthly = calls * price * creatorShare;
  const yearly = monthly * 12;

  return (
    <div className="card-glass p-6">
      <div className="text-[9px] font-bold text-white/40 tracking-widest uppercase mb-1">Earnings Calculator</div>
      <p className="text-xs text-white/45 mb-5 leading-relaxed">
        See how much you could earn. You keep 85% of every payment. The other 15% goes to validators, treasury, insurance, and burn.
      </p>

      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-white/55">Monthly calls</label>
            <span className="text-sm font-semibold text-white/75">{calls.toLocaleString()}</span>
          </div>
          <input
            type="range" min="100" max="1000000" step="100" value={calls}
            onChange={(e) => setCalls(Number(e.target.value))}
            className="w-full h-1 appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #10B981 ${(calls / 1000000) * 100}%, rgba(255,255,255,0.08) 0%)`,
              accentColor: "#10B981",
            }}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-white/55">Price per call</label>
            <span className="text-sm font-semibold text-white/75">${price.toFixed(3)}</span>
          </div>
          <input
            type="range" min="0.001" max="1" step="0.001" value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full h-1 appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #10B981 ${(price / 1) * 100}%, rgba(255,255,255,0.08) 0%)`,
              accentColor: "#10B981",
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <div
          className="p-4 text-center"
          style={{ border: "1px solid rgba(16,185,129,0.20)", background: "rgba(16,185,129,0.06)", borderRadius: "5px" }}
        >
          <div className="text-[8px] font-bold text-white/40 tracking-wider mb-1">MONTHLY</div>
          <div className="text-2xl font-semibold tracking-tight" style={{ color: "#10B981" }}>{formatMoney(monthly)}</div>
        </div>
        <div
          className="p-4 text-center"
          style={{ border: "1px solid rgba(16,185,129,0.20)", background: "rgba(16,185,129,0.06)", borderRadius: "5px" }}
        >
          <div className="text-[8px] font-bold text-white/40 tracking-wider mb-1">YEARLY</div>
          <div className="text-2xl font-semibold tracking-tight" style={{ color: "#10B981" }}>{formatMoney(yearly)}</div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-[10px] text-white/30">Based on 85% creator share. Top creators earn $30K+/month.</p>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────── */

export default function SkillMarketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [pricing, setPricing] = useState("All");
  const [sort, setSort] = useState("trending");
  const [selectedSkill, setSelectedSkill] = useState<MarketplaceSkill | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const queryString = useSearch();
  const [view, setView] = useState<"browse" | "creators" | "earn">(() => {
    const params = new URLSearchParams(queryString);
    const tab = params.get("tab");
    if (tab === "upload" || tab === "earn") return "earn";
    if (tab === "creators") return "creators";
    return "browse";
  });

  /* ── tRPC query ──────────────────────────────────────────────────────── */

  const sortByMap: Record<string, string> = {
    trending: "trust",
    earnings: "trust",
    rating: "trust",
    newest: "trust",
    invocations: "trust",
  };

  const { data: operatorData, isLoading } = trpc.operator.list.useQuery({
    limit: 50,
    offset: 0,
    sortBy: (sortByMap[sort] ?? "trust") as "trust" | "invocations" | "earnings" | "newest",
    ...(category !== "All" ? { category } : {}),
    ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
  });

  /* ── Map API operators to skill cards ────────────────────────────────── */

  const allSkills: MarketplaceSkill[] = useMemo(() => {
    if (!operatorData?.operators) return [];
    return operatorData.operators.map(mapOperatorToSkill);
  }, [operatorData]);

  const filtered = useMemo(() => {
    let skills = [...allSkills];
    if (pricing !== "All") skills = skills.filter(s => s.pricingModel === pricing);
    switch (sort) {
      case "trending": skills.sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0) || b.invocations - a.invocations); break;
      case "earnings": skills.sort((a, b) => b.totalEarnings - a.totalEarnings); break;
      case "rating": skills.sort((a, b) => b.rating - a.rating); break;
      case "newest": skills.sort((a, b) => a.id > b.id ? -1 : 1); break;
      case "invocations": skills.sort((a, b) => b.invocations - a.invocations); break;
    }
    return skills;
  }, [allSkills, pricing, sort]);

  /* ── Derive top creators from live data ──────────────────────────────── */

  const topCreators: TopCreator[] = useMemo(() => {
    if (!operatorData?.operators) return [];
    const creatorMap = new Map<string, { name: string; address: string; skills: number; totalEarnings: number; totalInvocations: number }>();
    for (const op of operatorData.operators) {
      const wallet = op.creatorWallet ?? "unknown";
      const existing = creatorMap.get(wallet);
      const earned = parseDecimal(op.totalEarned);
      if (existing) {
        existing.skills += 1;
        existing.totalEarnings += earned;
        existing.totalInvocations += (op.totalInvocations ?? 0);
      } else {
        creatorMap.set(wallet, {
          name: shortenAddress(wallet),
          address: shortenAddress(wallet),
          skills: 1,
          totalEarnings: earned,
          totalInvocations: op.totalInvocations ?? 0,
        });
      }
    }
    return Array.from(creatorMap.values())
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, 10)
      .map((c, i) => ({ ...c, avgRating: 0, rank: i + 1 }));
  }, [operatorData]);

  /* ── Aggregate stats ─────────────────────────────────────────────────── */

  const totalEarnings = allSkills.reduce((sum, s) => sum + s.totalEarnings, 0);
  const totalInvocations = allSkills.reduce((sum, s) => sum + s.invocations, 0);
  const totalCreators = new Set(allSkills.map(s => s.creatorAddress)).size;

  const rankColor = (rank: number) => {
    if (rank === 1) return "#FFD700";
    if (rank === 2) return "#C0C0C0";
    if (rank === 3) return "#CD7F32";
    return "rgba(255,255,255,0.25)";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <div className="pt-24">
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-16 md:py-24 relative">
            {/* Radial emerald glow behind title */}
            <div
              className="absolute top-0 left-1/4 h-100 w-150 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center, rgba(16,185,129,0.06) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
            />
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 relative">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.20)" }}>
                    <div className="live-dot" />
                    <span className="text-[10px] font-bold tracking-widest" style={{ color: "#10B981" }}>
                      SKILL MARKETPLACE
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-white/35">
                    {operatorData?.total ?? allSkills.length} skills listed
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-[56px] font-normal leading-[1.05]" style={{ letterSpacing: "-0.025em" }}>
                  <span className="text-white/95">Build a skill.</span><br />
                  <span className="text-white/95">Earn every time</span><br />
                  <span style={{ color: "#10B981" }}>it gets used.</span>
                </h1>
                <p className="text-base md:text-lg text-white/50 max-w-lg leading-relaxed mt-6">
                  The app store for AI agent abilities. Anyone can create a skill, upload it, set their price, and earn real money every single time an operator uses it. No middlemen. Payments settle instantly on-chain.
                </p>
                <p className="text-sm text-white/35 max-w-lg leading-relaxed mt-3">
                  Every skill listed here is available inside AegisX. Find a skill, check its trust score, and use it instantly from the IDE terminal or chat panel.
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 lg:w-[320px]">
                <StatCard label="TOTAL PAID TO CREATORS" value={formatMoney(totalEarnings)} sub="and growing daily" />
                <StatCard label="TOTAL SKILL CALLS" value={formatNum(totalInvocations)} sub="across all skills" />
                <StatCard label="ACTIVE CREATORS" value={totalCreators.toString()} sub="earning revenue" />
                <StatCard
                  label="AVG CREATOR INCOME"
                  value={totalCreators > 0 ? formatMoney(Math.round(totalEarnings / totalCreators)) : "$0"}
                  sub="per creator"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 flex items-center gap-1 py-0">
          {[
            { id: "browse" as const, label: "Browse Skills" },
            { id: "creators" as const, label: "Top Creators" },
            { id: "earn" as const, label: "Start Earning" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className="text-sm font-medium px-5 py-4 border-b-2 transition-all"
              style={view === tab.id ? {
                color: "#10B981",
                borderBottomColor: "#10B981",
                textShadow: "0 0 12px rgba(16,185,129,0.35)",
              } : {
                color: "rgba(255,255,255,0.35)",
                borderBottomColor: "transparent",
              }}
            >
              {tab.label}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => setShowUpload(true)}
            className="text-sm font-semibold px-6 py-2.5 my-2 transition-all"
            style={{
              background: "#10B981",
              color: "#000",
              borderRadius: "5px",
              boxShadow: "0 0 16px rgba(16,185,129,0.25)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#059669";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 24px rgba(16,185,129,0.40)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#10B981";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(16,185,129,0.25)";
            }}
          >
            Upload Skill
          </button>
        </div>
      </div>

      {/* Browse View */}
      {view === "browse" && (
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <input
                type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills, creators, tags..."
                className="w-full text-sm text-white/65 pl-11 pr-4 py-3 placeholder:text-white/20 focus:outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "6px",
                  backdropFilter: "blur(8px)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(16,185,129,0.35)";
                  e.currentTarget.style.boxShadow = "0 0 0 2px rgba(16,185,129,0.08)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
            <select
              value={sort} onChange={(e) => setSort(e.target.value)}
              className="text-sm text-white/50 px-4 py-3 focus:outline-none appearance-none cursor-pointer transition-all"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "6px",
              }}
            >
              <option value="trending">Trending</option>
              <option value="earnings">Highest Earnings</option>
              <option value="rating">Top Rated</option>
              <option value="invocations">Most Used</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {/* Category + Pricing filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex gap-1 overflow-x-auto flex-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="text-[11px] font-medium px-3 py-1.5 whitespace-nowrap transition-all"
                  style={category === cat ? {
                    background: "rgba(16,185,129,0.12)",
                    color: "#10B981",
                    border: "1px solid rgba(16,185,129,0.28)",
                    borderRadius: "4px",
                    boxShadow: "0 0 8px rgba(16,185,129,0.10)",
                  } : {
                    background: "transparent",
                    color: "rgba(255,255,255,0.30)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "4px",
                  }}
                >
                  {cat !== "All" && CATEGORY_ICONS[cat] && <span className="mr-1">{CATEGORY_ICONS[cat]}</span>}
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {PRICING_MODELS.map((pm) => (
                <button
                  key={pm}
                  onClick={() => setPricing(pm)}
                  className="text-[11px] font-medium px-3 py-1.5 whitespace-nowrap transition-all"
                  style={pricing === pm ? {
                    background: "rgba(16,185,129,0.12)",
                    color: "#10B981",
                    border: "1px solid rgba(16,185,129,0.28)",
                    borderRadius: "4px",
                  } : {
                    background: "transparent",
                    color: "rgba(255,255,255,0.30)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "4px",
                  }}
                >
                  {pm === "All" ? "All Pricing" : pm}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[10px] font-medium text-white/30 mb-4">
            {isLoading ? "Loading skills..." : `${filtered.length} skill${filtered.length !== 1 ? "s" : ""} found`}
          </div>

          {/* Skill Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((skill) => (
                <SkillCard key={skill.id} skill={skill} onSelect={setSelectedSkill} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <div className="text-lg text-white/25">No skills match your search.</div>
              <div className="text-sm text-white/15 mt-2">Try adjusting your filters or clearing the search.</div>
            </div>
          )}
        </div>
      )}

      {/* Creators View */}
      {view === "creators" && (
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-medium text-white/95 mb-2" style={{ letterSpacing: "-0.025em" }}>Top Creators</h2>
            <p className="text-sm text-white/45">The people building the skills that power the agent economy. Ranked by total earnings.</p>
          </div>

          {/* Creator Leaderboard */}
          <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", overflow: "hidden" }}>
            <div
              className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 text-[9px] font-bold tracking-widest text-white/25 uppercase"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
            >
              <span>#</span><span>Creator</span><span>Skills</span><span>Total Earned</span><span>Invocations</span><span>Avg Rating</span>
            </div>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-4 items-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="w-6 h-4 skeleton-shimmer" />
                  <div className="h-4 skeleton-shimmer w-32" />
                  <div className="w-12 h-4 skeleton-shimmer" />
                  <div className="w-20 h-4 skeleton-shimmer" />
                  <div className="w-16 h-4 skeleton-shimmer" />
                  <div className="w-10 h-4 skeleton-shimmer" />
                </div>
              ))
            ) : topCreators.length > 0 ? (
              topCreators.map((creator, idx) => (
                <div
                  key={creator.name}
                  className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-4 items-center transition-colors"
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.008)",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "rgba(16,185,129,0.03)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.008)")}
                >
                  <span
                    className="text-xs font-bold w-6 text-center"
                    style={{ color: rankColor(creator.rank) }}
                  >
                    {creator.rank}
                  </span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                      style={{
                        background: "rgba(16,185,129,0.10)",
                        border: `1px solid ${creator.rank <= 3 ? rankColor(creator.rank) + "40" : "rgba(255,255,255,0.10)"}`,
                        color: creator.rank <= 3 ? rankColor(creator.rank) : "rgba(255,255,255,0.55)",
                      }}
                    >
                      {creator.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-white/80">{creator.name}</span>
                      {creator.address !== creator.name && (
                        <span className="text-[10px] font-medium text-white/30 ml-2">{creator.address}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-white/50 w-12 text-right">{creator.skills}</span>
                  <span className="text-xs font-semibold w-20 text-right" style={{ color: "#10B981" }}>
                    {formatMoney(creator.totalEarnings)}
                  </span>
                  <span className="text-xs text-white/45 w-16 text-right">{formatNum(creator.totalInvocations)}</span>
                  <span className="text-xs text-white/40 w-10 text-right">{creator.avgRating || "—"}</span>
                </div>
              ))
            ) : (
              <div className="px-5 py-12 text-center">
                <div className="text-sm text-white/25">No creators found yet.</div>
              </div>
            )}
          </div>

          {/* How Creators Earn */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { num: "1", title: "Build Something Useful", desc: "Create a skill that solves a real problem. Security scanning, data analysis, trading strategies, document processing. If agents need it, someone will pay for it." },
              { num: "2", title: "Upload and Set Your Price", desc: "Upload your code, choose your pricing model (per-use, subscription, revenue share, or staked), and set your price. We handle the rest: hosting, scaling, billing, and security." },
              { num: "3", title: "Earn While You Sleep", desc: "Every time an operator calls your skill, you earn money. Payments settle instantly via x402. No invoicing, no chasing payments, no minimum thresholds. Your code works for you 24/7." },
            ].map((item) => (
              <div
                key={item.num}
                className="card-standard p-6 hover:border-white/12 transition-all"
              >
                <div
                  className="text-3xl font-bold mb-3"
                  style={{ color: "#10B981", fontVariantNumeric: "tabular-nums" }}
                >
                  {item.num}
                </div>
                <h3 className="text-base font-medium text-white/85 mb-2 tracking-tight">{item.title}</h3>
                <p className="text-xs text-white/45 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Earn View */}
      {view === "earn" && (
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Pitch */}
            <div>
              <h2 className="text-3xl font-medium text-white/95 mb-4 leading-tight" style={{ letterSpacing: "-0.025em" }}>
                Turn your code into<br />
                <span style={{ color: "#10B981" }}>passive income.</span>
              </h2>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                You have built something useful. Maybe a smart contract scanner, a trading signal generator, a data pipeline, or a document processor. Right now it sits on your laptop doing nothing. Upload it as an Aegis skill and it starts earning money the moment someone uses it.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { title: "You keep 85% of every payment", desc: "The highest creator share in the agent economy. The other 15% covers validators (10%), treasury (3%), insurance (1.5%), and burn (0.5%)." },
                  { title: "Instant settlement via x402", desc: "No waiting 30 days for a payout. Every payment settles on-chain the moment your skill completes a task." },
                  { title: "Zero infrastructure costs", desc: "We host, scale, and secure your skill. You write the code, we handle everything else." },
                  { title: "Composability multiplier", desc: "Other skills can chain yours into workflows. More integrations means more calls means more revenue." },
                  { title: "Reputation compounds", desc: "Good skills get more visibility, more operators, and more calls. Your reputation is your moat." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div
                      className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background: "rgba(16,185,129,0.10)",
                        border: "1px solid rgba(16,185,129,0.25)",
                        borderRadius: "4px",
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l4 4 6-6" stroke="#10B981" strokeWidth="2.5" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white/80 mb-0.5">{item.title}</div>
                      <div className="text-[11px] text-white/45">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowUpload(true)}
                className="text-sm font-semibold px-8 py-3.5 transition-all"
                style={{
                  background: "#10B981",
                  color: "#000",
                  borderRadius: "6px",
                  boxShadow: "0 0 20px rgba(16,185,129,0.30)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#059669";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 28px rgba(16,185,129,0.45)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#10B981";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(16,185,129,0.30)";
                }}
              >
                Upload Your First Skill
              </button>
            </div>

            {/* Right: Revenue Calculator + Spotlight */}
            <div className="space-y-6">
              <RevenueSimulator />

              {/* Success Stories */}
              <div className="card-glass p-6">
                <div className="text-[9px] font-bold text-white/40 tracking-widest uppercase mb-4">Creator Spotlight</div>
                <div className="space-y-4">
                  {[
                    { name: "YieldDAO", earned: "$377K", story: "Started with a simple yield comparison tool. Now runs 8 skills that auto-compound across 200+ protocols." },
                    { name: "DeepSea", earned: "$309K", story: "Built a whale wallet tracker as a side project. Now it is the most-subscribed analytics skill on the platform." },
                    { name: "AuditDAO", earned: "$127K", story: "Former security researcher. Turned manual audit checklists into an automated scanner. 342 operators use it daily." },
                  ].map((story) => (
                    <div
                      key={story.name}
                      className="pl-4"
                      style={{ borderLeft: "2px solid #10B981" }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white/80">{story.name}</span>
                        <span className="text-[10px] font-bold" style={{ color: "#10B981" }}>{story.earned} earned</span>
                      </div>
                      <p className="text-[11px] text-white/45">{story.story}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div className="mt-16 relative" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.06) 0%, transparent 60%)",
          }}
        />
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-16 text-center relative">
          <div className="text-[10px] font-bold text-white/35 tracking-widest uppercase mb-4">The Agent Economy</div>
          <h2 className="text-2xl md:text-3xl font-medium text-white/95 mb-3" style={{ letterSpacing: "-0.025em" }}>
            Your code. Your price. Your revenue.
          </h2>
          <p className="text-white/45 mb-8 max-w-lg mx-auto leading-relaxed">
            Every skill you upload becomes a revenue stream. Every operator that uses it pays you directly. This is the future of software: code that earns.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => setShowUpload(true)}
              className="text-sm font-semibold px-8 py-3.5 transition-all"
              style={{
                background: "#10B981",
                color: "#000",
                borderRadius: "6px",
                boxShadow: "0 0 20px rgba(16,185,129,0.28)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#059669";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 28px rgba(16,185,129,0.45)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#10B981";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(16,185,129,0.28)";
              }}
            >
              Upload a Skill
            </button>
            <Link
              href="/skill-marketplace"
              className="text-sm font-medium text-white/55 hover:text-white/80 px-8 py-3.5 transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px" }}
            >
              Skill Directory
            </Link>
            <Link
              href="/marketplace"
              className="text-sm font-medium text-white/35 hover:text-white/60 px-8 py-3.5 transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px" }}
            >
              Operator Marketplace
            </Link>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedSkill && <SkillDetail skill={selectedSkill} onClose={() => setSelectedSkill(null)} />}
      {showUpload && <UploadWizard onClose={() => setShowUpload(false)} />}
      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}
