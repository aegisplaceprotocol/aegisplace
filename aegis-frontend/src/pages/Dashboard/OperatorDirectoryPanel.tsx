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
  trustScore: number;
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

/* ── Demo data ────────────────────────────────────────────────────────── */

const OPERATORS: Operator[] = [
  {
    id: "o1", name: "GPT-4o Router", slug: "gpt-4o-router", category: "AI / ML", trustScore: 95,
    pricePerCall: "$0.012", totalInvocations: 312400, successRate: 99.2, isActive: true, isVerified: true,
    avgLatency: "89ms", creator: "0x7a3B...f291", description: "Routes prompts to GPT-4o with optimal token budgeting.",
    recentInvocations: [
      { caller: "0x1eC4...83d0", time: "2 min ago", status: "Success", latency: "82ms", amount: "$0.012" },
      { caller: "0xbF92...44a1", time: "5 min ago", status: "Success", latency: "91ms", amount: "$0.012" },
      { caller: "0x3dA1...c7e8", time: "8 min ago", status: "Failed", latency: "312ms", amount: "$0.000" },
      { caller: "0x92F6...1b3c", time: "12 min ago", status: "Success", latency: "78ms", amount: "$0.012" },
      { caller: "0xd4E7...9f02", time: "15 min ago", status: "Success", latency: "95ms", amount: "$0.012" },
    ],
    weeklyUsage: [4200, 4800, 3900, 5100, 4600, 3200, 4400],
    validatorAttestations: [
      { validator: "Validator Alpha", score: 96, date: "2026-03-20" },
      { validator: "Validator Beta", score: 94, date: "2026-03-18" },
    ],
  },
  {
    id: "o2", name: "Claude Analyst", slug: "claude-analyst", category: "AI / ML", trustScore: 93,
    pricePerCall: "$0.034", totalInvocations: 248100, successRate: 98.7, isActive: true, isVerified: true,
    avgLatency: "142ms", creator: "0x1eC4...83d0", description: "Claude-powered data analysis with structured output.",
    recentInvocations: [
      { caller: "0x7a3B...f291", time: "1 min ago", status: "Success", latency: "138ms", amount: "$0.034" },
      { caller: "0xbF92...44a1", time: "4 min ago", status: "Success", latency: "151ms", amount: "$0.034" },
      { caller: "0x3dA1...c7e8", time: "9 min ago", status: "Success", latency: "129ms", amount: "$0.034" },
      { caller: "0x92F6...1b3c", time: "14 min ago", status: "Pending", latency: "--", amount: "--" },
      { caller: "0xd4E7...9f02", time: "20 min ago", status: "Success", latency: "145ms", amount: "$0.034" },
    ],
    weeklyUsage: [3800, 4100, 3500, 4400, 3900, 2800, 3600],
    validatorAttestations: [
      { validator: "Validator Alpha", score: 93, date: "2026-03-22" },
    ],
  },
  {
    id: "o3", name: "Mistral Coder", slug: "mistral-coder", category: "Development", trustScore: 88,
    pricePerCall: "$0.008", totalInvocations: 187300, successRate: 97.4, isActive: true, isVerified: false,
    avgLatency: "203ms", creator: "0xbF92...44a1", description: "Mistral-based code generation and completion.",
    recentInvocations: [
      { caller: "0x7a3B...f291", time: "3 min ago", status: "Success", latency: "198ms", amount: "$0.008" },
      { caller: "0x1eC4...83d0", time: "7 min ago", status: "Success", latency: "210ms", amount: "$0.008" },
      { caller: "0x3dA1...c7e8", time: "11 min ago", status: "Success", latency: "195ms", amount: "$0.008" },
      { caller: "0x92F6...1b3c", time: "16 min ago", status: "Success", latency: "220ms", amount: "$0.008" },
      { caller: "0xd4E7...9f02", time: "22 min ago", status: "Failed", latency: "503ms", amount: "$0.000" },
    ],
    weeklyUsage: [2800, 3100, 2600, 3400, 3000, 2100, 2700],
    validatorAttestations: [],
  },
  {
    id: "o4", name: "Gemini Vision", slug: "gemini-vision", category: "AI / ML", trustScore: 91,
    pricePerCall: "$0.042", totalInvocations: 143200, successRate: 98.1, isActive: true, isVerified: true,
    avgLatency: "178ms", creator: "0x3dA1...c7e8", description: "Multi-modal vision analysis powered by Gemini.",
    recentInvocations: [
      { caller: "0x7a3B...f291", time: "6 min ago", status: "Success", latency: "170ms", amount: "$0.042" },
      { caller: "0x1eC4...83d0", time: "10 min ago", status: "Success", latency: "185ms", amount: "$0.042" },
      { caller: "0xbF92...44a1", time: "15 min ago", status: "Success", latency: "172ms", amount: "$0.042" },
      { caller: "0x92F6...1b3c", time: "19 min ago", status: "Success", latency: "191ms", amount: "$0.042" },
      { caller: "0xd4E7...9f02", time: "24 min ago", status: "Success", latency: "168ms", amount: "$0.042" },
    ],
    weeklyUsage: [2200, 2500, 2000, 2700, 2400, 1700, 2100],
    validatorAttestations: [
      { validator: "Validator Gamma", score: 91, date: "2026-03-19" },
    ],
  },
  {
    id: "o5", name: "Llama Guard", slug: "llama-guard", category: "Security", trustScore: 86,
    pricePerCall: "$0.003", totalInvocations: 98400, successRate: 96.8, isActive: true, isVerified: false,
    avgLatency: "67ms", creator: "0x92F6...1b3c", description: "Content safety filtering powered by Llama Guard.",
    recentInvocations: [
      { caller: "0x7a3B...f291", time: "1 min ago", status: "Success", latency: "63ms", amount: "$0.003" },
      { caller: "0x1eC4...83d0", time: "3 min ago", status: "Success", latency: "71ms", amount: "$0.003" },
      { caller: "0xbF92...44a1", time: "6 min ago", status: "Success", latency: "59ms", amount: "$0.003" },
      { caller: "0x3dA1...c7e8", time: "10 min ago", status: "Success", latency: "68ms", amount: "$0.003" },
      { caller: "0xd4E7...9f02", time: "14 min ago", status: "Failed", latency: "450ms", amount: "$0.000" },
    ],
    weeklyUsage: [1500, 1700, 1300, 1900, 1600, 1100, 1400],
    validatorAttestations: [],
  },
  {
    id: "o6", name: "DeepSeek Math", slug: "deepseek-math", category: "AI / ML", trustScore: 82,
    pricePerCall: "$0.005", totalInvocations: 74600, successRate: 95.3, isActive: true, isVerified: false,
    avgLatency: "256ms", creator: "0xd4E7...9f02", description: "Mathematical reasoning and proof verification.",
    recentInvocations: [
      { caller: "0x7a3B...f291", time: "4 min ago", status: "Success", latency: "248ms", amount: "$0.005" },
      { caller: "0x1eC4...83d0", time: "9 min ago", status: "Success", latency: "262ms", amount: "$0.005" },
      { caller: "0xbF92...44a1", time: "13 min ago", status: "Pending", latency: "--", amount: "--" },
      { caller: "0x3dA1...c7e8", time: "18 min ago", status: "Success", latency: "251ms", amount: "$0.005" },
      { caller: "0x92F6...1b3c", time: "23 min ago", status: "Success", latency: "270ms", amount: "$0.005" },
    ],
    weeklyUsage: [1100, 1300, 900, 1500, 1200, 800, 1000],
    validatorAttestations: [],
  },
  {
    id: "o7", name: "Cohere Summarizer", slug: "cohere-summarizer", category: "AI / ML", trustScore: 89,
    pricePerCall: "$0.006", totalInvocations: 62100, successRate: 98.0, isActive: true, isVerified: true,
    avgLatency: "118ms", creator: "0x5cB8...62d4", description: "High-quality text summarization across languages.",
    recentInvocations: [
      { caller: "0x7a3B...f291", time: "2 min ago", status: "Success", latency: "112ms", amount: "$0.006" },
      { caller: "0x1eC4...83d0", time: "6 min ago", status: "Success", latency: "125ms", amount: "$0.006" },
      { caller: "0xbF92...44a1", time: "11 min ago", status: "Success", latency: "108ms", amount: "$0.006" },
      { caller: "0x3dA1...c7e8", time: "17 min ago", status: "Success", latency: "120ms", amount: "$0.006" },
      { caller: "0x92F6...1b3c", time: "21 min ago", status: "Success", latency: "115ms", amount: "$0.006" },
    ],
    weeklyUsage: [900, 1000, 800, 1100, 950, 650, 850],
    validatorAttestations: [
      { validator: "Validator Beta", score: 89, date: "2026-03-21" },
    ],
  },
  {
    id: "o8", name: "Stable Diffusion XL", slug: "stable-diffusion-xl", category: "AI / ML", trustScore: 78,
    pricePerCall: "$0.087", totalInvocations: 45200, successRate: 94.6, isActive: true, isVerified: false,
    avgLatency: "3120ms", creator: "0xaA31...7e5f", description: "State-of-the-art image generation with SDXL.",
    recentInvocations: [
      { caller: "0x7a3B...f291", time: "5 min ago", status: "Success", latency: "3050ms", amount: "$0.087" },
      { caller: "0x1eC4...83d0", time: "12 min ago", status: "Success", latency: "3200ms", amount: "$0.087" },
      { caller: "0xbF92...44a1", time: "18 min ago", status: "Failed", latency: "5000ms", amount: "$0.000" },
      { caller: "0x3dA1...c7e8", time: "25 min ago", status: "Success", latency: "3100ms", amount: "$0.087" },
      { caller: "0x92F6...1b3c", time: "32 min ago", status: "Success", latency: "2980ms", amount: "$0.087" },
    ],
    weeklyUsage: [600, 750, 550, 800, 700, 400, 620],
    validatorAttestations: [],
  },
  {
    id: "o9", name: "Whisper Transcribe", slug: "whisper-transcribe", category: "AI / ML", trustScore: 90,
    pricePerCall: "$0.021", totalInvocations: 53800, successRate: 97.9, isActive: true, isVerified: true,
    avgLatency: "1450ms", creator: "0x7a3B...f291", description: "Audio to text with speaker diarization.",
    recentInvocations: [
      { caller: "0x1eC4...83d0", time: "3 min ago", status: "Success", latency: "1380ms", amount: "$0.021" },
      { caller: "0xbF92...44a1", time: "8 min ago", status: "Success", latency: "1520ms", amount: "$0.021" },
      { caller: "0x3dA1...c7e8", time: "14 min ago", status: "Success", latency: "1410ms", amount: "$0.021" },
      { caller: "0x92F6...1b3c", time: "20 min ago", status: "Success", latency: "1490ms", amount: "$0.021" },
      { caller: "0xd4E7...9f02", time: "27 min ago", status: "Pending", latency: "--", amount: "--" },
    ],
    weeklyUsage: [800, 900, 700, 1000, 850, 580, 760],
    validatorAttestations: [
      { validator: "Validator Alpha", score: 90, date: "2026-03-23" },
    ],
  },
  {
    id: "o10", name: "DALL-E Renderer", slug: "dalle-renderer", category: "AI / ML", trustScore: 84,
    pricePerCall: "$0.064", totalInvocations: 38700, successRate: 96.2, isActive: false, isVerified: false,
    avgLatency: "2800ms", creator: "0x1eC4...83d0", description: "DALL-E 3 image generation with style controls.",
    recentInvocations: [
      { caller: "0x7a3B...f291", time: "1 hr ago", status: "Failed", latency: "5000ms", amount: "$0.000" },
      { caller: "0xbF92...44a1", time: "1 hr ago", status: "Failed", latency: "5000ms", amount: "$0.000" },
      { caller: "0x3dA1...c7e8", time: "2 hrs ago", status: "Success", latency: "2750ms", amount: "$0.064" },
      { caller: "0x92F6...1b3c", time: "2 hrs ago", status: "Success", latency: "2900ms", amount: "$0.064" },
      { caller: "0xd4E7...9f02", time: "3 hrs ago", status: "Success", latency: "2680ms", amount: "$0.064" },
    ],
    weeklyUsage: [500, 620, 480, 0, 0, 0, 0],
    validatorAttestations: [],
  },
  {
    id: "o11", name: "CodeLlama Debug", slug: "codellama-debug", category: "Development", trustScore: 85,
    pricePerCall: "$0.004", totalInvocations: 29100, successRate: 96.5, isActive: true, isVerified: false,
    avgLatency: "310ms", creator: "0xbF92...44a1", description: "Automated code debugging and fix suggestions.",
    recentInvocations: [
      { caller: "0x7a3B...f291", time: "7 min ago", status: "Success", latency: "305ms", amount: "$0.004" },
      { caller: "0x1eC4...83d0", time: "13 min ago", status: "Success", latency: "318ms", amount: "$0.004" },
      { caller: "0x3dA1...c7e8", time: "19 min ago", status: "Success", latency: "292ms", amount: "$0.004" },
      { caller: "0x92F6...1b3c", time: "25 min ago", status: "Success", latency: "330ms", amount: "$0.004" },
      { caller: "0xd4E7...9f02", time: "33 min ago", status: "Success", latency: "301ms", amount: "$0.004" },
    ],
    weeklyUsage: [400, 480, 350, 520, 460, 300, 410],
    validatorAttestations: [],
  },
  {
    id: "o12", name: "Phi-3 Classifier", slug: "phi3-classifier", category: "Data", trustScore: 80,
    pricePerCall: "$0.002", totalInvocations: 21400, successRate: 95.8, isActive: true, isVerified: false,
    avgLatency: "45ms", creator: "0x3dA1...c7e8", description: "Lightweight text classification for structured data.",
    recentInvocations: [
      { caller: "0x7a3B...f291", time: "1 min ago", status: "Success", latency: "42ms", amount: "$0.002" },
      { caller: "0x1eC4...83d0", time: "4 min ago", status: "Success", latency: "48ms", amount: "$0.002" },
      { caller: "0xbF92...44a1", time: "8 min ago", status: "Success", latency: "44ms", amount: "$0.002" },
      { caller: "0x92F6...1b3c", time: "13 min ago", status: "Success", latency: "46ms", amount: "$0.002" },
      { caller: "0xd4E7...9f02", time: "18 min ago", status: "Success", latency: "41ms", amount: "$0.002" },
    ],
    weeklyUsage: [300, 360, 270, 400, 340, 220, 310],
    validatorAttestations: [],
  },
];

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

type SortKey = "name" | "trustScore" | "pricePerCall" | "totalInvocations" | "successRate";

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

  // Map API data to local shape, falling back to demo data
  const OPERATORS_DATA: Operator[] = operatorsQuery.data
    ? (operatorsQuery.data as any[]).map((op: any, i: number) => ({
        id: String(op.id ?? `api-${i}`),
        name: op.name ?? "Unknown Operator",
        slug: op.slug ?? "unknown",
        category: op.category ?? "Other",
        trustScore: op.trustScore ?? 50,
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
      }))
    : OPERATORS;

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
      if (trustMin && op.trustScore < parseInt(trustMin)) return false;
      if (trustMax && op.trustScore > parseInt(trustMax)) return false;
      if (search && !op.name.toLowerCase().includes(search.toLowerCase()) && !op.slug.includes(search.toLowerCase())) return false;
      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "trustScore") cmp = a.trustScore - b.trustScore;
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
                  { key: "trustScore" as SortKey, label: "Trust", align: "right" },
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
                      <span style={{ fontSize: 14, fontWeight: 600, color: trustColor(op.trustScore), fontVariantNumeric: "tabular-nums" }}>
                        {op.trustScore}
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
