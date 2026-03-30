import ComingSoon from "@/components/ComingSoon";
import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useSearch } from "wouter";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";

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

/* ── Mock Data ─────────────────────────────────────────────────────────── */

const SKILLS: MarketplaceSkill[] = [
  {
    id: "sk-001", name: "Contract Vulnerability Scanner", creator: "AuditDAO", creatorAddress: "0x7a3...e91f", creatorAvatar: "AD",
    category: "Security", description: "Scans smart contracts for 47 known vulnerability patterns in under 10 seconds. Catches reentrancy, overflow, access control, and logic bugs before they cost you money.",
    pricingModel: "per-use", priceDisplay: "$0.05/scan", pricePerCall: 0.05, monthlyEarnings: 14200, totalEarnings: 127800,
    invocations: 2556000, rating: 4.9, reviews: 847, trustScore: 97, successRate: 99.7, avgLatency: "3.2s",
    version: "3.4.1", lastUpdated: "2 days ago", tags: ["security", "audit", "solidity", "rust"],
    composableWith: ["Risk Assessment Engine", "Report Generator", "Compliance Checker"],
    operatorsUsing: 342, status: "verified", trending: true, featured: true,
  },
  {
    id: "sk-002", name: "50-DEX Swap Router", creator: "RouteMax", creatorAddress: "0x3b1...c44d", creatorAvatar: "RM",
    category: "DeFi", description: "Finds the absolute best swap route across 50 decentralized exchanges simultaneously. Saves an average of 2.3% per trade compared to single-DEX swaps.",
    pricingModel: "revenue-share", priceDisplay: "0.1% of savings", pricePerCall: 0.02, monthlyEarnings: 31400, totalEarnings: 282600,
    invocations: 14130000, rating: 4.8, reviews: 1203, trustScore: 96, successRate: 99.4, avgLatency: "1.8s",
    version: "5.1.0", lastUpdated: "5 hours ago", tags: ["defi", "swap", "routing", "arbitrage"],
    composableWith: ["Gas Fee Predictor", "Token Analyzer", "Portfolio Rebalancer"],
    operatorsUsing: 891, status: "verified", trending: true, featured: true,
  },
  {
    id: "sk-003", name: "Legal Document Translator", creator: "LexiAI", creatorAddress: "0x9e2...a77b", creatorAvatar: "LA",
    category: "Communication", description: "Translates legal documents across 40 languages with 99.2% accuracy. Preserves legal terminology, clause structure, and jurisdiction-specific phrasing.",
    pricingModel: "per-use", priceDisplay: "$0.12/page", pricePerCall: 0.12, monthlyEarnings: 8900, totalEarnings: 71200,
    invocations: 593333, rating: 4.7, reviews: 312, trustScore: 94, successRate: 99.2, avgLatency: "4.1s",
    version: "2.8.0", lastUpdated: "1 week ago", tags: ["legal", "translation", "multilingual"],
    composableWith: ["Document Parser", "Compliance Checker", "Summary Generator"],
    operatorsUsing: 187, status: "verified", trending: false, featured: true,
  },
  {
    id: "sk-004", name: "Sentiment Pulse Engine", creator: "SentimentDAO", creatorAddress: "0x5f8...b22c", creatorAvatar: "SD",
    category: "Analytics", description: "Reads the mood of any token, project, or topic across Twitter, Discord, Telegram, and Reddit in real time. Gives you a clear bullish/bearish score before anyone else sees the shift.",
    pricingModel: "subscription", priceDisplay: "$29/mo", pricePerCall: 0.01, monthlyEarnings: 22100, totalEarnings: 176800,
    invocations: 17680000, rating: 4.6, reviews: 567, trustScore: 92, successRate: 98.8, avgLatency: "2.4s",
    version: "4.2.0", lastUpdated: "3 days ago", tags: ["sentiment", "social", "analytics", "trading"],
    composableWith: ["Signal Generator", "Portfolio Manager", "Alert System"],
    operatorsUsing: 634, status: "verified", trending: true, featured: false,
  },
  {
    id: "sk-005", name: "Gas Fee Oracle", creator: "GasWise", creatorAddress: "0x1d4...f88a", creatorAvatar: "GW",
    category: "Infrastructure", description: "Predicts the cheapest time to send your transaction in the next 24 hours. Saves users an average of 34% on gas fees by timing transactions perfectly.",
    pricingModel: "per-use", priceDisplay: "$0.002/query", pricePerCall: 0.002, monthlyEarnings: 4800, totalEarnings: 38400,
    invocations: 19200000, rating: 4.5, reviews: 234, trustScore: 91, successRate: 97.8, avgLatency: "0.8s",
    version: "1.9.3", lastUpdated: "12 hours ago", tags: ["gas", "optimization", "prediction"],
    composableWith: ["Transaction Builder", "Swap Router", "Batch Executor"],
    operatorsUsing: 1247, status: "verified", trending: false, featured: false,
  },
  {
    id: "sk-006", name: "NFT Rarity Ranker", creator: "RarityLabs", creatorAddress: "0x8c7...d55e", creatorAvatar: "RL",
    category: "NFTs", description: "Instantly calculates the true rarity of any NFT in any collection. Factors in trait combinations, statistical outliers, and market-weighted rarity that other tools miss.",
    pricingModel: "per-use", priceDisplay: "$0.01/rank", pricePerCall: 0.01, monthlyEarnings: 6300, totalEarnings: 50400,
    invocations: 5040000, rating: 4.4, reviews: 189, trustScore: 89, successRate: 99.1, avgLatency: "1.2s",
    version: "2.1.0", lastUpdated: "4 days ago", tags: ["nft", "rarity", "analysis", "collections"],
    composableWith: ["Collection Analyzer", "Price Estimator", "Sniper Bot"],
    operatorsUsing: 423, status: "verified", trending: false, featured: false,
  },
  {
    id: "sk-007", name: "Yield Strategy Optimizer", creator: "YieldDAO", creatorAddress: "0x2e9...c11b", creatorAvatar: "YD",
    category: "DeFi", description: "Continuously scans 200+ DeFi protocols to find the highest risk-adjusted yield for your assets. Auto-compounds, rebalances, and switches strategies when better opportunities appear.",
    pricingModel: "revenue-share", priceDisplay: "2% of yield", pricePerCall: 0.03, monthlyEarnings: 47200, totalEarnings: 377600,
    invocations: 12586667, rating: 4.8, reviews: 923, trustScore: 95, successRate: 98.9, avgLatency: "5.7s",
    version: "6.0.2", lastUpdated: "1 day ago", tags: ["yield", "defi", "optimization", "auto-compound"],
    composableWith: ["Risk Scorer", "Gas Fee Oracle", "Portfolio Tracker"],
    operatorsUsing: 567, status: "verified", trending: true, featured: true,
  },
  {
    id: "sk-008", name: "Multi-Chain Bridge Finder", creator: "BridgeDAO", creatorAddress: "0x4a6...e33f", creatorAvatar: "BD",
    category: "Infrastructure", description: "Compares every bridge route between 15 chains and picks the cheapest, fastest, and safest path for your tokens. No more guessing which bridge to use.",
    pricingModel: "per-use", priceDisplay: "$0.03/route", pricePerCall: 0.03, monthlyEarnings: 9100, totalEarnings: 72800,
    invocations: 2426667, rating: 4.6, reviews: 445, trustScore: 93, successRate: 98.5, avgLatency: "2.1s",
    version: "3.2.1", lastUpdated: "6 hours ago", tags: ["bridge", "cross-chain", "routing"],
    composableWith: ["Swap Router", "Gas Fee Oracle", "Risk Scorer"],
    operatorsUsing: 378, status: "verified", trending: false, featured: false,
  },
  {
    id: "sk-009", name: "Code Review Agent", creator: "DevGuard", creatorAddress: "0x6b3...a99d", creatorAvatar: "DG",
    category: "Development", description: "Reviews your code like a senior engineer who has seen everything. Catches bugs, suggests improvements, enforces best practices, and explains why in plain English.",
    pricingModel: "per-use", priceDisplay: "$0.08/review", pricePerCall: 0.08, monthlyEarnings: 11600, totalEarnings: 92800,
    invocations: 1160000, rating: 4.7, reviews: 678, trustScore: 94, successRate: 99.3, avgLatency: "6.2s",
    version: "4.1.0", lastUpdated: "3 days ago", tags: ["code-review", "quality", "best-practices"],
    composableWith: ["CI Pipeline Builder", "Test Generator", "Documentation Writer"],
    operatorsUsing: 512, status: "verified", trending: false, featured: false,
  },
  {
    id: "sk-010", name: "Whale Wallet Tracker", creator: "DeepSea", creatorAddress: "0xaa1...f77c", creatorAvatar: "DS",
    category: "Analytics", description: "Watches what the biggest wallets are doing and tells you before the market reacts. Tracks 5,000+ whale wallets across 8 chains with sub-second alerts.",
    pricingModel: "subscription", priceDisplay: "$49/mo", pricePerCall: 0.015, monthlyEarnings: 38700, totalEarnings: 309600,
    invocations: 20640000, rating: 4.8, reviews: 789, trustScore: 96, successRate: 99.5, avgLatency: "0.4s",
    version: "7.3.0", lastUpdated: "8 hours ago", tags: ["whale", "tracking", "alerts", "multi-chain"],
    composableWith: ["Signal Generator", "Swap Router", "Portfolio Manager"],
    operatorsUsing: 734, status: "verified", trending: true, featured: true,
  },
  {
    id: "sk-011", name: "Meeting Summarizer", creator: "NoteAI", creatorAddress: "0xcc5...b44a", creatorAvatar: "NA",
    category: "Productivity", description: "Turns any meeting recording into a clear summary with action items, decisions made, and who is responsible for what. Works with Zoom, Google Meet, and Teams.",
    pricingModel: "per-use", priceDisplay: "$0.15/meeting", pricePerCall: 0.15, monthlyEarnings: 7200, totalEarnings: 57600,
    invocations: 384000, rating: 4.5, reviews: 234, trustScore: 90, successRate: 98.1, avgLatency: "8.3s",
    version: "2.4.0", lastUpdated: "5 days ago", tags: ["meetings", "summary", "productivity"],
    composableWith: ["Task Creator", "Calendar Manager", "Email Drafter"],
    operatorsUsing: 289, status: "verified", trending: false, featured: false,
  },
  {
    id: "sk-012", name: "Liquidation Sniper", creator: "LiqBot", creatorAddress: "0xdd8...c66e", creatorAvatar: "LB",
    category: "DeFi", description: "Monitors 12 lending protocols for positions about to get liquidated and executes profitable liquidations automatically. Average profit: $47 per liquidation.",
    pricingModel: "revenue-share", priceDisplay: "5% of profit", pricePerCall: 0.0, monthlyEarnings: 28900, totalEarnings: 231200,
    invocations: 847000, rating: 4.6, reviews: 156, trustScore: 91, successRate: 94.2, avgLatency: "0.3s",
    version: "3.7.0", lastUpdated: "2 hours ago", tags: ["liquidation", "defi", "mev", "profit"],
    composableWith: ["Gas Fee Oracle", "Risk Scorer", "Flash Loan Executor"],
    operatorsUsing: 198, status: "verified", trending: true, featured: false,
  },
];

const TOP_CREATORS: TopCreator[] = [
  { name: "YieldDAO", address: "0x2e9...c11b", skills: 8, totalEarnings: 377600, totalInvocations: 12586667, avgRating: 4.8, rank: 1 },
  { name: "DeepSea", address: "0xaa1...f77c", skills: 5, totalEarnings: 309600, totalInvocations: 20640000, avgRating: 4.8, rank: 2 },
  { name: "RouteMax", address: "0x3b1...c44d", skills: 3, totalEarnings: 282600, totalInvocations: 14130000, avgRating: 4.8, rank: 3 },
  { name: "LiqBot", address: "0xdd8...c66e", skills: 4, totalEarnings: 231200, totalInvocations: 847000, avgRating: 4.6, rank: 4 },
  { name: "SentimentDAO", address: "0x5f8...b22c", skills: 6, totalEarnings: 176800, totalInvocations: 17680000, avgRating: 4.6, rank: 5 },
  { name: "AuditDAO", address: "0x7a3...e91f", skills: 7, totalEarnings: 127800, totalInvocations: 2556000, avgRating: 4.9, rank: 6 },
  { name: "DevGuard", address: "0x6b3...a99d", skills: 4, totalEarnings: 92800, totalInvocations: 1160000, avgRating: 4.7, rank: 7 },
  { name: "BridgeDAO", address: "0x4a6...e33f", skills: 3, totalEarnings: 72800, totalInvocations: 2426667, avgRating: 4.6, rank: 8 },
];

const CATEGORIES = ["All", "Security", "DeFi", "Analytics", "Infrastructure", "Development", "Communication", "NFTs", "Productivity"];

const PRICING_MODELS = ["All", "per-use", "subscription", "revenue-share", "tiered", "staked"];

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

function trustColor(score: number): string {
  if (score >= 95) return "text-zinc-300";
  if (score >= 90) return "text-[#71717A]";
  if (score >= 80) return "text-amber-400";
  return "text-red-400";
}

function statusBadge(status: string): string {
  switch (status) {
    case "verified": return "bg-white/10 text-zinc-300 border-white/20";
    case "beta": return "bg-amber-400/8 text-amber-400 border-amber-400/15";
    case "new": return "bg-white/8 text-white/50 border-white/15";
    default: return "bg-white/5 text-white/30 border-white/10";
  }
}

function pricingBadge(model: string): string {
  switch (model) {
    case "per-use": return "bg-white/8 text-zinc-300/70";
    case "subscription": return "bg-[#71717A]/8 text-[#71717A]/70";
    case "revenue-share": return "bg-[#71717A]/8 text-[#71717A]/70";
    case "tiered": return "bg-[#52525B]/8 text-[#52525B]/70";
    case "staked": return "bg-[#3F3F46]/8 text-[#3F3F46]/70";
    default: return "bg-white/5 text-white/30";
  }
}

/* ── Stat Card ──────────────────────────────────────────────────────────── */

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-white/[0.07] bg-white/[0.02] p-4 rounded">
      <div className="text-[9px] font-medium text-white/25 tracking-wider mb-2">{label}</div>
      <div className="text-xl font-bold text-white/90 ">{value}</div>
      {sub && <div className="text-[10px] font-medium text-zinc-300/40 mt-1">{sub}</div>}
    </div>
  );
}

/* ── Skill Card ─────────────────────────────────────────────────────────── */

function SkillCard({ skill, onSelect }: { skill: MarketplaceSkill; onSelect: (s: MarketplaceSkill) => void }) {
  return (
    <button
      onClick={() => onSelect(skill)}
      className="w-full text-left border border-white/[0.07] bg-white/[0.015] hover:bg-white/[0.03] hover:border-white/[0.12] transition-all p-5 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-normal text-white/85 group-hover:text-white transition-colors">{skill.name}</span>
            {skill.trending && (
              <span className="text-[8px] bg-white/10 text-zinc-300 px-1.5 py-0.5 tracking-wider">TRENDING</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white/[0.06] flex items-center justify-center text-[7px] text-white/40">{skill.creatorAvatar}</div>
            <span className="text-[11px] font-medium text-white/30">{skill.creator}</span>
            <span className="text-[9px] font-medium text-white/15">{skill.creatorAddress}</span>
          </div>
        </div>
        <span className={`text-[9px] font-medium px-2 py-0.5 border shrink-0 ${statusBadge(skill.status)}`}>
          {skill.status}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-white/40 leading-relaxed mb-4 line-clamp-2">{skill.description}</p>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div>
          <div className="text-[8px] text-white/20 mb-0.5">CALLS</div>
          <div className="text-xs text-white/60">{formatNum(skill.invocations)}</div>
        </div>
        <div>
          <div className="text-[8px] text-white/20 mb-0.5">RATING</div>
          <div className="text-xs text-white/60">{skill.rating}/5</div>
        </div>
        <div>
          <div className="text-[8px] text-white/20 mb-0.5">TRUST</div>
          <div className={`text-xs ${trustColor(skill.trustScore)}`}>{skill.trustScore}%</div>
        </div>
        <div>
          <div className="text-[8px] text-white/20 mb-0.5">OPERATORS</div>
          <div className="text-xs text-white/60">{formatNum(skill.operatorsUsing)}</div>
        </div>
      </div>

      {/* Pricing + Earnings */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-medium px-2 py-0.5 ${pricingBadge(skill.pricingModel)}`}>{skill.pricingModel}</span>
          <span className="text-xs text-white/50">{skill.priceDisplay}</span>
        </div>
        <div className="text-right">
          <div className="text-[8px] text-white/15">CREATOR EARNED</div>
          <div className="text-xs text-zinc-300/70">{formatMoney(skill.totalEarnings)}</div>
        </div>
      </div>
    </button>
  );
}

/* ── Skill Detail Modal ─────────────────────────────────────────────────── */

function SkillDetail({ skill, onClose }: { skill: MarketplaceSkill; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white/[0.02] border border-white/[0.08]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/[0.02] border-b border-white/[0.07] p-5 flex items-start justify-between z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-white/90">{skill.name}</h2>
              <span className={`text-[9px] font-medium px-2 py-0.5 border ${statusBadge(skill.status)}`}>{skill.status}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-white/[0.06] flex items-center justify-center text-[8px] text-white/40">{skill.creatorAvatar}</div>
              <span className="text-xs text-white/40">{skill.creator}</span>
              <span className="text-[10px] font-medium text-white/20">{skill.creatorAddress}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Description */}
          <div>
            <div className="text-[9px] font-medium text-white/20 tracking-wider mb-2">ABOUT THIS SKILL</div>
            <p className="text-sm text-white/50 leading-relaxed">{skill.description}</p>
          </div>

          {/* Key Metrics */}
          <div>
            <div className="text-[9px] font-medium text-white/20 tracking-wider mb-3">PERFORMANCE</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="border border-white/[0.07] p-3">
                <div className="text-[8px] text-white/20 mb-1">SUCCESS RATE</div>
                <div className="text-lg font-bold text-zinc-300 ">{skill.successRate}%</div>
              </div>
              <div className="border border-white/[0.07] p-3">
                <div className="text-[8px] text-white/20 mb-1">AVG LATENCY</div>
                <div className="text-lg font-bold text-white/80 ">{skill.avgLatency}</div>
              </div>
              <div className="border border-white/[0.07] p-3">
                <div className="text-[8px] text-white/20 mb-1">TRUST SCORE</div>
                <div className={`text-lg font-normal ${trustColor(skill.trustScore)}`}>{skill.trustScore}/100</div>
              </div>
              <div className="border border-white/[0.07] p-3">
                <div className="text-[8px] text-white/20 mb-1">TOTAL CALLS</div>
                <div className="text-lg font-bold text-white/80 ">{formatNum(skill.invocations)}</div>
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div>
            <div className="text-[9px] font-medium text-white/20 tracking-wider mb-3">CREATOR REVENUE</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-white/10 bg-white/[0.02] p-3">
                <div className="text-[8px] text-zinc-300/40 mb-1">THIS MONTH</div>
                <div className="text-lg font-bold text-zinc-300 ">{formatMoney(skill.monthlyEarnings)}</div>
              </div>
              <div className="border border-white/10 bg-white/[0.02] p-3">
                <div className="text-[8px] text-zinc-300/40 mb-1">ALL TIME</div>
                <div className="text-lg font-bold text-zinc-300 ">{formatMoney(skill.totalEarnings)}</div>
              </div>
              <div className="border border-white/[0.07] p-3">
                <div className="text-[8px] text-white/20 mb-1">PRICING</div>
                <div className="text-sm font-bold text-white/70 ">{skill.priceDisplay}</div>
                <div className={`text-[9px] font-medium mt-1 ${pricingBadge(skill.pricingModel)}`}>{skill.pricingModel}</div>
              </div>
            </div>
          </div>

          {/* Composability */}
          <div>
            <div className="text-[9px] font-medium text-white/20 tracking-wider mb-3">WORKS WITH</div>
            <div className="flex flex-wrap gap-2">
              {skill.composableWith.map((s) => (
                <span key={s} className="text-[11px] font-medium text-white/40 border border-white/[0.08] px-3 py-1.5 hover:border-white/20 hover:text-zinc-300/60 transition-all cursor-default">
                  {s}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-white/20 mt-2">Chain these skills together to build powerful multi-step workflows.</p>
          </div>

          {/* Tags */}
          <div>
            <div className="text-[9px] font-medium text-white/20 tracking-wider mb-2">TAGS</div>
            <div className="flex flex-wrap gap-1.5">
              {skill.tags.map((t) => (
                <span key={t} className="text-[10px] font-medium text-white/25 bg-white/[0.03] px-2 py-0.5">{t}</span>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/[0.07]">
            <div>
              <div className="text-[8px] text-white/15 mb-0.5">VERSION</div>
              <div className="text-xs text-white/40">v{skill.version}</div>
            </div>
            <div>
              <div className="text-[8px] text-white/15 mb-0.5">UPDATED</div>
              <div className="text-xs text-white/40">{skill.lastUpdated}</div>
            </div>
            <div>
              <div className="text-[8px] text-white/15 mb-0.5">REVIEWS</div>
              <div className="text-xs text-white/40">{skill.reviews}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { toast.success("Skill added to your operator!"); onClose(); }}
              className="flex-1 text-sm font-normal bg-white text-zinc-900 py-3 hover:bg-zinc-200 transition-colors"
            >
              Install Skill
            </button>
            <button
              onClick={() => toast.info("Sandbox test environment coming soon")}
              className="text-sm font-medium border border-white/20 text-zinc-300/60 hover:text-zinc-300 hover:border-white/40 px-6 py-3 transition-all"
            >
              Try It Free
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Upload Wizard ──────────────────────────────────────────────────────── */

function UploadWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [skillName, setSkillName] = useState("");
  const [skillDesc, setSkillDesc] = useState("");
  const [skillCategory, setSkillCategory] = useState("Development");
  const [pricingModel, setPricingModel] = useState("per-use");
  const [priceAmount, setPriceAmount] = useState("");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto bg-white/[0.02] border border-white/[0.08]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-white/[0.07] p-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white/90">Upload Your Skill</h2>
            <p className="text-xs text-white/30 mt-1">Step {step} of 4</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-white/[0.04]">
          <div className="h-full bg-white transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
        </div>

        <div className="p-5 space-y-5">
          {step === 1 && (
            <>
              <div className="text-[9px] font-medium text-zinc-300/50 tracking-wider mb-4">BASIC INFO</div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Skill Name</label>
                <input
                  type="text" value={skillName} onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g. Smart Contract Auditor"
                  className="w-full bg-white/[0.03] border border-white/[0.08] text-sm text-white/70 px-4 py-3 placeholder:text-white/15 focus:border-white/30 focus:outline-none transition-colors "
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Description</label>
                <textarea
                  value={skillDesc} onChange={(e) => setSkillDesc(e.target.value)}
                  placeholder="Explain what your skill does in plain English. What problem does it solve? Who is it for?"
                  rows={4}
                  className="w-full bg-white/[0.03] border border-white/[0.08] text-sm text-white/70 px-4 py-3 placeholder:text-white/15 focus:border-white/30 focus:outline-none transition-colors resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.filter(c => c !== "All").map((cat) => (
                    <button key={cat} onClick={() => setSkillCategory(cat)}
                      className={`text-[11px] font-medium px-3 py-1.5 border transition-all ${
                        skillCategory === cat
                          ? "bg-white/8 text-zinc-300 border-white/20"
                          : "bg-transparent text-white/25 border-white/[0.07] hover:text-white/40"
                      }`}
                    >{cat}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-[9px] font-medium text-zinc-300/50 tracking-wider mb-4">PRICING MODEL</div>
              <p className="text-xs text-white/35 mb-4">Choose how you want to get paid. You earn every time someone uses your skill.</p>
              <div className="space-y-2">
                {[
                  { id: "per-use", title: "Pay Per Use", desc: "Users pay a fixed amount each time they call your skill. Best for simple, single-action skills.", example: "e.g. $0.05 per scan" },
                  { id: "subscription", title: "Monthly Subscription", desc: "Users pay a flat monthly fee for unlimited access. Best for skills that get used frequently.", example: "e.g. $29/month" },
                  { id: "revenue-share", title: "Revenue Share", desc: "You take a percentage of the value your skill creates. Best for DeFi and trading skills.", example: "e.g. 2% of yield generated" },
                  { id: "tiered", title: "Tiered Pricing", desc: "Different prices for different usage levels. Free tier for testing, paid tiers for production.", example: "e.g. Free: 100 calls, Pro: $19/mo" },
                  { id: "staked", title: "Stake-Gated", desc: "Users must stake $AEGIS tokens to access your skill. Higher stakes unlock premium features.", example: "e.g. Stake 1,000 $AEGIS" },
                ].map((model) => (
                  <button key={model.id} onClick={() => setPricingModel(model.id)}
                    className={`w-full text-left p-4 border transition-all ${
                      pricingModel === model.id
                        ? "border-white/30 bg-white/[0.03]"
                        : "border-white/[0.07] bg-white/[0.01] hover:border-white/[0.12]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white/80">{model.title}</span>
                      <span className="text-[10px] font-medium text-white/20">{model.example}</span>
                    </div>
                    <p className="text-[11px] text-white/35">{model.desc}</p>
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <label className="text-xs text-white/40 mb-1.5 block">Price Amount</label>
                <input
                  type="text" value={priceAmount} onChange={(e) => setPriceAmount(e.target.value)}
                  placeholder="e.g. 0.05"
                  className="w-full bg-white/[0.03] border border-white/[0.08] text-sm text-white/70 px-4 py-3 placeholder:text-white/15 focus:border-white/30 focus:outline-none transition-colors "
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="text-[9px] font-medium text-zinc-300/50 tracking-wider mb-4">UPLOAD CODE</div>
              <p className="text-xs text-white/35 mb-4">Upload your skill code or connect a GitHub repository. We will validate, sandbox-test, and security-audit it automatically.</p>
              <div className="border-2 border-dashed border-white/[0.08] p-8 text-center hover:border-white/20 transition-colors cursor-pointer"
                onClick={() => toast.info("File upload coming soon")}
              >
                <svg className="mx-auto mb-3 text-white/15" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="text-sm text-white/30 mb-1">Drop your skill files here</p>
                <p className="text-[10px] text-white/15">or click to browse. Supports .ts, .py, .rs, .zip, or GitHub URL</p>
              </div>
              <div className="mt-4 text-center">
                <span className="text-[10px] text-white/15">or</span>
              </div>
              <button
                onClick={() => toast.info("GitHub integration coming soon")}
                className="w-full flex items-center justify-center gap-2 border border-white/[0.08] py-3 text-sm text-white/40 hover:text-white/60 hover:border-white/[0.15] transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                Connect GitHub Repository
              </button>
              <div className="mt-5 border border-white/[0.07] p-4">
                <div className="text-[9px] font-medium text-white/20 tracking-wider mb-2">WHAT HAPPENS NEXT</div>
                <div className="space-y-2">
                  {[
                    "Your code runs in a sandboxed environment to verify it works",
                    "Automated security audit checks for vulnerabilities and data leaks",
                    "Performance benchmarks measure latency and resource usage",
                    "If everything passes, your skill goes live on the marketplace",
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[10px] font-medium text-zinc-300/50 mt-0.5">{i + 1}.</span>
                      <span className="text-[11px] text-white/35">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="text-[9px] font-medium text-zinc-300/50 tracking-wider mb-4">REVIEW AND SUBMIT</div>
              <div className="space-y-4">
                <div className="border border-white/[0.07] p-4">
                  <div className="text-[8px] text-white/20 mb-1">SKILL NAME</div>
                  <div className="text-sm text-white/70">{skillName || "Untitled Skill"}</div>
                </div>
                <div className="border border-white/[0.07] p-4">
                  <div className="text-[8px] text-white/20 mb-1">DESCRIPTION</div>
                  <div className="text-xs text-white/50">{skillDesc || "No description provided"}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-white/[0.07] p-4">
                    <div className="text-[8px] text-white/20 mb-1">CATEGORY</div>
                    <div className="text-sm text-white/70">{skillCategory}</div>
                  </div>
                  <div className="border border-white/[0.07] p-4">
                    <div className="text-[8px] text-white/20 mb-1">PRICING</div>
                    <div className="text-sm text-white/70">{pricingModel}{priceAmount ? ` - $${priceAmount}` : ""}</div>
                  </div>
                </div>
                <div className="border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-[9px] font-medium text-zinc-300/50 mb-2">HOW YOU WILL EARN</div>
                  <p className="text-xs text-white/40 leading-relaxed">
                    Every time an operator uses your skill, you earn {pricingModel === "per-use" ? `$${priceAmount || "0.05"} per call` : pricingModel === "subscription" ? `$${priceAmount || "29"}/month per subscriber` : pricingModel === "revenue-share" ? `${priceAmount || "2"}% of value generated` : "based on your pricing model"}.
                    Payments settle automatically via x402 protocol. You can withdraw earnings to any wallet at any time. No minimums, no delays.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)}
                className="text-sm font-medium border border-white/[0.08] text-white/40 hover:text-white/60 px-6 py-3 transition-all"
              >Back</button>
            )}
            {step < 4 ? (
              <button onClick={() => setStep(step + 1)}
                className="flex-1 text-sm font-normal bg-white text-zinc-900 py-3 hover:bg-zinc-200 transition-colors"
              >Continue</button>
            ) : (
              <button
                onClick={() => { toast.success("Skill submitted for review! You will be notified when it goes live."); onClose(); }}
                className="flex-1 text-sm font-normal bg-white text-zinc-900 py-3 hover:bg-zinc-200 transition-colors"
              >Submit Skill</button>
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
    <div className="border border-white/[0.07] bg-white/[0.015] p-6">
      <div className="text-[9px] font-medium text-zinc-300/50 tracking-wider mb-4">EARNINGS CALCULATOR</div>
      <p className="text-xs text-white/35 mb-5">See how much you could earn. You keep 60% of every payment. The other 40% goes to validators, stakers, treasury, insurance, and burn.</p>

      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-white/40">Monthly calls</label>
            <span className="text-sm text-white/60">{calls.toLocaleString()}</span>
          </div>
          <input type="range" min="100" max="1000000" step="100" value={calls}
            onChange={(e) => setCalls(Number(e.target.value))}
            className="w-full accent-[#A1A1AA] h-1 bg-white/[0.06] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-white/40">Price per call</label>
            <span className="text-sm text-white/60">${price.toFixed(3)}</span>
          </div>
          <input type="range" min="0.001" max="1" step="0.001" value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full accent-[#A1A1AA] h-1 bg-white/[0.06] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="border border-white/15 bg-white/[0.03] p-4 text-center">
          <div className="text-[8px] text-zinc-300/40 mb-1">MONTHLY</div>
          <div className="text-2xl font-bold text-zinc-300 ">{formatMoney(monthly)}</div>
        </div>
        <div className="border border-white/15 bg-white/[0.03] p-4 text-center">
          <div className="text-[8px] text-zinc-300/40 mb-1">YEARLY</div>
          <div className="text-2xl font-bold text-zinc-300 ">{formatMoney(yearly)}</div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-[10px] text-white/20">Based on 60% creator share. Top creators earn $30K+/month.</p>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────── */

export default function SkillMarketplace() {
  return <ComingSoon title="Skill Marketplace" description="Upload, discover, and trade AI agent skills." />;
}

function _SkillMarketplace() {
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

  const filtered = useMemo(() => {
    let skills = [...SKILLS];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      skills = skills.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.creator.toLowerCase().includes(q) ||
        s.tags.some(t => t.includes(q))
      );
    }
    if (category !== "All") skills = skills.filter(s => s.category === category);
    if (pricing !== "All") skills = skills.filter(s => s.pricingModel === pricing);
    switch (sort) {
      case "trending": skills.sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0) || b.invocations - a.invocations); break;
      case "earnings": skills.sort((a, b) => b.totalEarnings - a.totalEarnings); break;
      case "rating": skills.sort((a, b) => b.rating - a.rating); break;
      case "newest": skills.sort((a, b) => a.id > b.id ? -1 : 1); break;
      case "invocations": skills.sort((a, b) => b.invocations - a.invocations); break;
    }
    return skills;
  }, [searchQuery, category, pricing, sort]);

  const totalEarnings = SKILLS.reduce((sum, s) => sum + s.totalEarnings, 0);
  const totalInvocations = SKILLS.reduce((sum, s) => sum + s.invocations, 0);
  const totalCreators = new Set(SKILLS.map(s => s.creator)).size;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <div className="pt-24">
        <div className="border-b border-white/[0.07]">
          <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-16 md:py-24">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-[10px] font-medium text-zinc-300/60 bg-white/[0.04] border border-white/[0.10] px-3 py-1 rounded-full">
                    SKILL MARKETPLACE
                  </span>
                  <span className="text-[10px] font-medium text-white/20">
                    {SKILLS.length} skills listed
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tight leading-[1.05]">
                  <span className="text-white/95">Build a skill.</span><br />
                  <span className="text-white/95">Earn every time</span><br />
                  <span className="text-zinc-300">it gets used.</span>
                </h1>
                <p className="text-base md:text-lg text-white/30 max-w-lg leading-relaxed mt-6">
                  The app store for AI agent abilities. Anyone can create a skill, upload it, set their price, and earn real money every single time an operator uses it. No middlemen. Payments settle instantly on-chain.
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 lg:w-[320px]">
                <StatCard label="TOTAL PAID TO CREATORS" value={formatMoney(totalEarnings)} sub="and growing daily" />
                <StatCard label="TOTAL SKILL CALLS" value={formatNum(totalInvocations)} sub="across all skills" />
                <StatCard label="ACTIVE CREATORS" value={totalCreators.toString()} sub="earning revenue" />
                <StatCard label="AVG CREATOR INCOME" value={formatMoney(Math.round(totalEarnings / totalCreators))} sub="per creator" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-white/[0.07]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 flex items-center gap-1 py-0">
          {[
            { id: "browse" as const, label: "Browse Skills" },
            { id: "creators" as const, label: "Top Creators" },
            { id: "earn" as const, label: "Start Earning" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setView(tab.id)}
              className={`text-sm font-medium px-5 py-4 border-b-2 transition-all ${
                view === tab.id
                  ? "text-zinc-300 border-white"
                  : "text-white/25 border-transparent hover:text-white/40"
              }`}
            >{tab.label}</button>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => setShowUpload(true)}
            className="text-sm font-normal bg-white text-zinc-900 px-6 py-2.5 hover:bg-zinc-200 transition-colors my-2"
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
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-white/15" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <input
                type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills, creators, tags..."
                className="w-full bg-white/[0.02] border border-white/[0.07] text-sm text-white/60 pl-11 pr-4 py-3 placeholder:text-white/12 focus:border-white/25 focus:outline-none transition-colors "
              />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="bg-white/[0.02] border border-white/[0.07] text-sm text-white/35 px-4 py-3 focus:border-white/25 focus:outline-none appearance-none cursor-pointer "
            >
              <option value="trending" className="bg-white/[0.02]">Trending</option>
              <option value="earnings" className="bg-white/[0.02]">Highest Earnings</option>
              <option value="rating" className="bg-white/[0.02]">Top Rated</option>
              <option value="invocations" className="bg-white/[0.02]">Most Used</option>
              <option value="newest" className="bg-white/[0.02]">Newest</option>
            </select>
          </div>

          {/* Category + Pricing filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex gap-1 overflow-x-auto flex-1">
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`text-[11px] font-medium px-3 py-1.5 whitespace-nowrap border transition-all ${
                    category === cat
                      ? "bg-white/8 text-zinc-300 border-white/20"
                      : "bg-transparent text-white/20 border-white/[0.07] hover:text-white/35"
                  }`}
                >{cat}</button>
              ))}
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {PRICING_MODELS.map((pm) => (
                <button key={pm} onClick={() => setPricing(pm)}
                  className={`text-[11px] font-medium px-3 py-1.5 whitespace-nowrap border transition-all ${
                    pricing === pm
                      ? "bg-white/8 text-zinc-300 border-white/20"
                      : "bg-transparent text-white/20 border-white/[0.07] hover:text-white/35"
                  }`}
                >{pm === "All" ? "All Pricing" : pm}</button>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-white/15 mb-4">{filtered.length} skill{filtered.length !== 1 ? "s" : ""} found</div>

          {/* Skill Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((skill) => (
              <SkillCard key={skill.id} skill={skill} onSelect={setSelectedSkill} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-24">
              <div className="text-lg text-white/12">No skills match your search.</div>
              <div className="text-sm text-white/8 mt-2">Try adjusting your filters.</div>
            </div>
          )}
        </div>
      )}

      {/* Creators View */}
      {view === "creators" && (
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white/90 mb-2">Top Creators</h2>
            <p className="text-sm text-white/30">The people building the skills that power the agent economy. Ranked by total earnings.</p>
          </div>

          {/* Creator Leaderboard */}
          <div className="border border-white/[0.07]">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/[0.07] text-[9px] text-white/15 tracking-wider">
              <span>#</span><span>CREATOR</span><span>SKILLS</span><span>TOTAL EARNED</span><span>INVOCATIONS</span><span>AVG RATING</span>
            </div>
            {TOP_CREATORS.map((creator) => (
              <div key={creator.name}
                className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-4 border-b border-white/[0.04] hover:bg-white/[0.015] transition-colors items-center"
              >
                <span className={`text-xs w-6 ${creator.rank <= 3 ? "text-zinc-300" : "text-white/20"}`}>{creator.rank}</span>
                <div>
                  <span className="text-sm text-white/70 font-medium">{creator.name}</span>
                  <span className="text-[10px] font-medium text-white/20 ml-2">{creator.address}</span>
                </div>
                <span className="text-xs text-white/40 w-12 text-right">{creator.skills}</span>
                <span className="text-xs text-zinc-300 font-normal w-20 text-right">{formatMoney(creator.totalEarnings)}</span>
                <span className="text-xs text-white/30 w-16 text-right">{formatNum(creator.totalInvocations)}</span>
                <span className="text-xs text-white/40 w-10 text-right">{creator.avgRating}</span>
              </div>
            ))}
          </div>

          {/* How Creators Earn */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-white/[0.07] p-6 rounded">
              <div className="text-3xl mb-3">1</div>
              <h3 className="text-base font-normal text-white/80 mb-2">Build Something Useful</h3>
              <p className="text-xs text-white/35 leading-relaxed">
                Create a skill that solves a real problem. Security scanning, data analysis, trading strategies, document processing. If agents need it, someone will pay for it.
              </p>
            </div>
            <div className="border border-white/[0.07] p-6 rounded">
              <div className="text-3xl mb-3">2</div>
              <h3 className="text-base font-normal text-white/80 mb-2">Upload and Set Your Price</h3>
              <p className="text-xs text-white/35 leading-relaxed">
                Upload your code, choose your pricing model (per-use, subscription, revenue share, or staked), and set your price. We handle the rest: hosting, scaling, billing, and security.
              </p>
            </div>
            <div className="border border-white/[0.07] p-6 rounded">
              <div className="text-3xl mb-3">3</div>
              <h3 className="text-base font-normal text-white/80 mb-2">Earn While You Sleep</h3>
              <p className="text-xs text-white/35 leading-relaxed">
                Every time an operator calls your skill, you earn money. Payments settle instantly via x402. No invoicing, no chasing payments, no minimum thresholds. Your code works for you 24/7.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Earn View */}
      {view === "earn" && (
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Pitch */}
            <div>
              <h2 className="text-3xl font-bold text-white/90 mb-4 leading-tight">
                Turn your code into<br />
                <span className="text-zinc-300">passive income.</span>
              </h2>
              <p className="text-sm text-white/35 leading-relaxed mb-6">
                You have built something useful. Maybe a smart contract scanner, a trading signal generator, a data pipeline, or a document processor. Right now it sits on your laptop doing nothing. Upload it as an Aegis skill and it starts earning money the moment someone uses it.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { title: "You keep 60% of every payment", desc: "The highest creator share in the agent economy. The other 40% covers validators, safety, treasury, referrers, and burn." },
                  { title: "Instant settlement via x402", desc: "No waiting 30 days for a payout. Every payment settles on-chain the moment your skill completes a task." },
                  { title: "Zero infrastructure costs", desc: "We host, scale, and secure your skill. You write the code, we handle everything else." },
                  { title: "Composability multiplier", desc: "Other skills can chain yours into workflows. More integrations means more calls means more revenue." },
                  { title: "Reputation compounds", desc: "Good skills get more visibility, more operators, and more calls. Your reputation is your moat." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-5 h-5 border border-white/20 flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-6" stroke="#A1A1AA" strokeWidth="2" /></svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white/70 mb-0.5">{item.title}</div>
                      <div className="text-[11px] text-white/30">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowUpload(true)}
                className="text-sm font-normal bg-white text-zinc-900 px-8 py-3.5 hover:bg-zinc-200 transition-colors rounded"
              >
                Upload Your First Skill
              </button>
            </div>

            {/* Right: Revenue Calculator */}
            <div className="space-y-6">
              <RevenueSimulator />

              {/* Success Stories */}
              <div className="border border-white/[0.07] bg-white/[0.015] p-6">
                <div className="text-[9px] font-medium text-zinc-300/50 tracking-wider mb-4">CREATOR SPOTLIGHT</div>
                <div className="space-y-4">
                  {[
                    { name: "YieldDAO", earned: "$377K", story: "Started with a simple yield comparison tool. Now runs 8 skills that auto-compound across 200+ protocols." },
                    { name: "DeepSea", earned: "$309K", story: "Built a whale wallet tracker as a side project. Now it is the most-subscribed analytics skill on the platform." },
                    { name: "AuditDAO", earned: "$127K", story: "Former security researcher. Turned manual audit checklists into an automated scanner. 342 operators use it daily." },
                  ].map((story) => (
                    <div key={story.name} className="border-l-2 border-white/20 pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white/70">{story.name}</span>
                        <span className="text-[10px] font-medium text-zinc-300/60">{story.earned} earned</span>
                      </div>
                      <p className="text-[11px] text-white/30">{story.story}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div className="border-t border-white/[0.07] mt-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-16 text-center">
          <div className="text-[10px] font-medium text-zinc-300/40 tracking-wider mb-4">THE AGENT ECONOMY</div>
          <h2 className="text-2xl md:text-3xl font-bold text-white/90 tracking-tight mb-3">
            Your code. Your price. Your revenue.
          </h2>
          <p className="text-white/25 mb-8 max-w-lg mx-auto leading-relaxed">
            Every skill you upload becomes a revenue stream. Every operator that uses it pays you directly. This is the future of software: code that earns.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button onClick={() => setShowUpload(true)} className="text-sm font-normal bg-white text-zinc-900 px-8 py-3.5 hover:bg-zinc-200 transition-colors rounded">
              Upload a Skill
            </button>
            <Link href="/skills" className="text-sm font-medium border border-white/20 text-zinc-300/60 hover:text-zinc-300 hover:border-white/40 px-8 py-3.5 transition-all">
              Skill Directory
            </Link>
            <Link href="/marketplace" className="text-sm font-medium border border-white/[0.07] text-white/35 hover:text-white/55 hover:border-white/[0.12] px-8 py-3.5 transition-all">
              Operator Marketplace
            </Link>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedSkill && <SkillDetail skill={selectedSkill} onClose={() => setSelectedSkill(null)} />}
      {showUpload && <UploadWizard onClose={() => setShowUpload(false)} />}
    </div>
  );
}
