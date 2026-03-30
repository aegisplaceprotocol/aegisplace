import ComingSoon from "@/components/ComingSoon";
import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLiveFeed, type LiveFeedEvent } from "@/hooks/useLiveFeed";
import { PremiumAreaChart } from "@/components/PremiumAreaChart";
import { PremiumSparkline } from "@/components/PremiumSparkline";

/* ── Lazy pages ─────────────────────────────────────────────────────────── */

const Playground = lazy(() => import("./Playground"));
const Docs = lazy(() => import("./Docs"));
const Marketplace = lazy(() => import("./Marketplace"));
const Leaderboard = lazy(() => import("./Leaderboard"));
const Agents = lazy(() => import("./Agents"));
const Tasks = lazy(() => import("./Tasks"));
const Analytics = lazy(() => import("./Analytics"));
const Validators = lazy(() => import("./Validators"));

/* ── Types ──────────────────────────────────────────────────────────────── */

type DashSection =
  | "overview" | "operators" | "activity" | "earnings" | "connect"
  | "disputes" | "settings"
  | "embed-marketplace" | "embed-playground" | "embed-leaderboard"
  | "embed-docs" | "embed-agents" | "embed-tasks" | "embed-analytics"
  | "embed-validators";

interface LiveTx {
  id: number;
  operator: string;
  caller: string;
  amount: string;
  status: "completed" | "pending" | "failed";
  latency: string;
  time: string;
}

interface NavItem { label: string; section: DashSection; icon: string; }
interface NavGroup { title: string; items: NavItem[]; }

interface DemoOperator {
  name: string;
  category: string;
  successRate: number;
  earned: number;
  invocations: number;
  successHistory: number[];
}

interface ApiOperator {
  id: number;
  name: string;
  slug: string;
  category: string;
  pricePerCall: string;
  trustScore: number;
  totalInvocations: number;
  successRate: string;
}

/* ── Design tokens ─────────────────────────────────────────────────────── */

const T = {
  bg: "#060606",
  card: "#0A0A0A",
  border: "rgba(255,255,255,0.06)",
  borderHover: "rgba(255,255,255,0.10)",
  mint: "#34D399",
  red: "#EF4444",
  text90: "rgba(255,255,255,0.90)",
  text50: "rgba(255,255,255,0.50)",
  text30: "rgba(255,255,255,0.30)",
  text25: "rgba(255,255,255,0.25)",
  text20: "rgba(255,255,255,0.20)",
  white6: "rgba(255,255,255,0.06)",
  white4: "rgba(255,255,255,0.04)",
  white3: "rgba(255,255,255,0.03)",
} as const;

/* ── Constants ──────────────────────────────────────────────────────────── */

const FEE_SPLIT = [
  { label: "Creator", pct: 60 },
  { label: "Validators", pct: 15 },
  { label: "Stakers", pct: 12 },
  { label: "Treasury", pct: 8 },
  { label: "Insurance", pct: 3 },
  { label: "Burned", pct: 2 },
];

const NETWORK_HEALTH = [
  { label: "Invocation Success", value: 96.8, unit: "%" },
  { label: "Avg Response", value: 142, unit: "ms", bar: 85 },
  { label: "Operator Uptime", value: 99.2, unit: "%" },
  { label: "Guardrail Pass", value: 98.1, unit: "%" },
  { label: "Settlement Rate", value: 99.9, unit: "%" },
];

const DEMO_SPARKLINE = [
  12, 14, 13, 16, 18, 17, 20, 22, 21, 24,
  26, 25, 28, 30, 29, 32, 34, 33, 36, 38,
];

const DEMO_REVENUE = [
  1800, 2100, 2400, 2300, 2700, 3100, 3000, 3400, 3800, 3600,
  4000, 4300, 4200, 4600, 5000, 4800, 5200, 5500, 5400, 5800,
  6100, 6000, 6400, 6700, 6600, 7000, 7300, 7200,
];

const DEMO_OPS: DemoOperator[] = [
  { name: "CodeGuard", category: "Security", successRate: 99.1, earned: 24120, invocations: 18420, successHistory: [95, 96, 97, 96, 98, 99, 99, 98, 99, 99] },
  { name: "JupiterSwap", category: "DeFi", successRate: 97.8, earned: 21340, invocations: 15890, successHistory: [94, 95, 96, 97, 96, 97, 98, 97, 98, 98] },
  { name: "FirecrawlPro", category: "Data", successRate: 98.4, earned: 18760, invocations: 14230, successHistory: [93, 94, 95, 96, 97, 98, 97, 98, 98, 98] },
  { name: "WhisperSTT", category: "AI / ML", successRate: 96.2, earned: 15890, invocations: 12100, successHistory: [91, 92, 93, 94, 95, 95, 96, 96, 96, 96] },
  { name: "SemgrepScan", category: "Security", successRate: 99.5, earned: 14230, invocations: 10890, successHistory: [97, 98, 98, 99, 99, 99, 99, 100, 99, 100] },
  { name: "DeepSeekV3", category: "AI / ML", successRate: 95.8, earned: 12100, invocations: 9870, successHistory: [90, 91, 92, 93, 94, 95, 95, 96, 96, 96] },
  { name: "StableDiffXL", category: "AI / ML", successRate: 94.3, earned: 10890, invocations: 8450, successHistory: [88, 89, 90, 91, 92, 93, 94, 94, 94, 94] },
  { name: "SolanaParser", category: "Infrastructure", successRate: 98.9, earned: 9870, invocations: 7620, successHistory: [96, 97, 97, 98, 98, 99, 99, 99, 99, 99] },
];

const OPERATORS_FOR_FEED = ["CodeGuard", "JupiterSwap", "FirecrawlPro", "WhisperSTT", "DeepSeekV3", "SemgrepScan", "StableDiffXL", "NeuroScan", "InferX", "DataMesh"];

/* ── Icon system ────────────────────────────────────────────────────────── */

const ICON_PATHS: Record<string, string> = {
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  cpu: "M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3M6 6h12v12H6z",
  search: "M11 3a8 8 0 100 16 8 8 0 000-16zM21 21l-4.35-4.35",
  terminal: "M4 17l6-6-6-6M12 19h8",
  briefcase: "M20 7H4a1 1 0 00-1 1v11a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  dollar: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  link: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  external: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3",
  book: "M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z",
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  "bar-chart": "M12 20V10M18 20V4M6 20v-4",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  radio: "M12 12m-2 0a2 2 0 104 0 2 2 0 10-4 0M16.24 7.76a6 6 0 010 8.49M7.76 16.24a6 6 0 010-8.49M19.07 4.93a10 10 0 010 14.14M4.93 19.07a10 10 0 010-14.14",
  globe: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
  box: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
  lock: "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
  copy: "M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1",
  "arrow-right": "M5 12h14M12 5l7 7-7 7",
};

function SIcon({ name, size = 16, className = "" }: { name: string; size?: number; className?: string }) {
  const d = ICON_PATHS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

/* ── Spark (smooth cubic bezier sparkline) ─────────────────────────────── */

function Spark({ data, width = 64, height = 20 }: { data: number[]; width?: number; height?: number }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * (height - 4) - 2,
  }));

  // Catmull-Rom to cubic bezier
  const segments: string[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    if (i === 0) {
      segments.push(`M${p1.x},${p1.y}`);
    }
    segments.push(`C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`);
  }
  const linePath = segments.join(" ");
  const fillPath = `${linePath} L${width},${height} L0,${height} Z`;
  const gradId = `sg-${width}-${height}-${data.length}`;

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(52,211,153,0.08)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" />
    </svg>
  );
}

/* ── Card primitives ────────────────────────────────────────────────────── */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className} style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 6,
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = T.borderHover; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; }}
    >
      {children}
    </div>
  );
}

function CardHead({ title }: { title: string }) {
  return (
    <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, color: T.text25 }}>
        {title}
      </span>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text90 }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 13, color: T.text50, marginTop: 4, opacity: 0.8 }}>{subtitle}</p>}
    </div>
  );
}

/* ── Nav config ─────────────────────────────────────────────────────────── */

const NAV_GROUPS: NavGroup[] = [
  {
    title: "SKILLS",
    items: [
      { label: "My Operators", section: "operators", icon: "cpu" },
      { label: "Marketplace", section: "embed-marketplace", icon: "search" },
      { label: "Playground", section: "embed-playground", icon: "terminal" },
      { label: "Leaderboard", section: "embed-leaderboard", icon: "bar-chart" },
    ],
  },
  {
    title: "WORK",
    items: [
      { label: "Tasks", section: "embed-tasks", icon: "briefcase" },
      { label: "Activity", section: "activity", icon: "activity" },
      { label: "Earnings", section: "earnings", icon: "dollar" },
      { label: "Disputes", section: "disputes", icon: "shield" },
    ],
  },
  {
    title: "NETWORK",
    items: [
      { label: "Agents", section: "embed-agents", icon: "users" },
      { label: "Validators", section: "embed-validators", icon: "shield" },
      { label: "Analytics", section: "embed-analytics", icon: "bar-chart" },
    ],
  },
  {
    title: "INTEGRATE",
    items: [
      { label: "MCP Connect", section: "connect", icon: "link" },
      { label: "Documentation", section: "embed-docs", icon: "book" },
      { label: "Settings", section: "settings", icon: "settings" },
    ],
  },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function randomAddr() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789";
  let a = "", b = "";
  for (let i = 0; i < 4; i++) a += c[Math.floor(Math.random() * c.length)];
  for (let i = 0; i < 4; i++) b += c[Math.floor(Math.random() * c.length)];
  return `${a}...${b}`;
}

function makeTx(id: number): LiveTx {
  const op = OPERATORS_FOR_FEED[Math.floor(Math.random() * OPERATORS_FOR_FEED.length)];
  const amounts = ["$0.02", "$0.04", "$0.05", "$0.08", "$0.10", "$0.12", "$0.15"];
  const statuses: LiveTx["status"][] = ["completed", "completed", "completed", "completed", "pending", "failed"];
  return {
    id,
    operator: op,
    caller: randomAddr(),
    amount: amounts[Math.floor(Math.random() * amounts.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    latency: `${Math.floor(Math.random() * 300 + 40)}ms`,
    time: "just now",
  };
}

function statusDot(s: string) {
  if (s === "completed") return T.mint;
  if (s === "pending") return "rgba(52,211,153,0.3)";
  return T.red;
}

/* ── Sidebar ────────────────────────────────────────────────────────────── */

function Sidebar({ section, setSection, onClose }: {
  section: DashSection; setSection: (s: DashSection) => void; onClose?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const wallet = "7f3a...Dk9x";

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText("7f3aGh23jKlMnOpQrStUvWxDk9x").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, []);

  return (
    <div style={{
      width: 260,
      height: "100%",
      background: T.bg,
      borderRight: `1px solid ${T.border}`,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/assets/vectorwhite.svg" alt="" style={{ height: 24, opacity: 0.9 }} />
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.9)" }}>AEGIS</span>
        </div>
      </div>

      {/* Vault card */}
      <div style={{
        margin: "0 16px 20px",
        padding: "16px 16px 14px",
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
      }}>
        {/* Revenue header with diamond icon */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.50)" strokeWidth="1.5">
              <rect x="4" y="4" width="16" height="16" rx="2" transform="rotate(45 12 12)" />
            </svg>
          </div>
          <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, color: T.text25 }}>Revenue</span>
        </div>
        {/* Revenue amount */}
        <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: T.text90, marginBottom: 10, paddingLeft: 2 }}>
          $141,899.82
        </div>
        {/* Green sparkline */}
        <div style={{ marginBottom: 12 }}>
          <Spark data={DEMO_SPARKLINE} width={220} height={24} />
        </div>
        {/* Success Rate */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10, padding: "0 2px" }}>
          <span style={{ fontSize: 12, color: T.text30 }}>Success Rate</span>
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.text90, fontVariantNumeric: "tabular-nums" }}>78.0</span>
            <span style={{ fontSize: 11, color: T.text25 }}> / 100</span>
          </div>
        </div>
        {/* Wallet */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "rgba(255,255,255,0.02)", borderRadius: 4 }}>
          <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: T.text25 }}>{copied ? "Copied!" : "Not co..cted"}</span>
          <button onClick={handleCopy} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: T.text20 }}>
            <SIcon name="copy" size={13} />
          </button>
        </div>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
        {/* Overview link at top */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => { setSection("overview"); onClose?.(); }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 6,
              border: "none",
              textAlign: "left" as const,
              fontSize: 14,
              cursor: "pointer",
              background: section === "overview" ? T.white6 : "transparent",
              borderLeft: section === "overview" ? `2px solid rgba(255,255,255,0.30)` : "2px solid transparent",
              color: section === "overview" ? T.text90 : "rgba(255,255,255,0.40)",
              fontWeight: section === "overview" ? 700 : 400,
              transition: "all 0.15s",
            }}
          >
            <SIcon name="grid" size={15} className={section === "overview" ? "text-white/60" : "text-white/20"} />
            <span>Overview</span>
          </button>
        </div>

        {NAV_GROUPS.map((g) => (
          <div key={g.title} style={{ marginBottom: 24 }}>
            <div style={{ padding: "0 12px", marginBottom: 8 }}>
              <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, color: T.text20 }}>
                {g.title}
              </span>
            </div>
            {g.items.map((item) => {
              const active = item.section === section;
              return (
                <button key={item.section}
                  onClick={() => { setSection(item.section); onClose?.(); }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 6,
                    border: "none",
                    textAlign: "left" as const,
                    fontSize: 14,
                    cursor: "pointer",
                    background: active ? T.white6 : "transparent",
                    borderLeft: active ? `2px solid rgba(255,255,255,0.30)` : "2px solid transparent",
                    color: active ? T.text90 : "rgba(255,255,255,0.40)",
                    fontWeight: active ? 700 : 400,
                    transition: "all 0.15s",
                  }}
                >
                  <SIcon name={item.icon} size={15} className={active ? "text-white/60" : "text-white/20"} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Promo box */}
      <div style={{ margin: "0 16px 16px", borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}` }}>
        <video autoPlay loop muted playsInline src="/videos/AegisSprite.mp4" style={{ width: "100%", display: "block" }} />
        <div style={{ padding: "10px 14px" }}>
          <div style={{ fontSize: 13, color: T.text50, marginBottom: 2 }}>New skills every day.</div>
          <div style={{ fontSize: 12, color: T.text25 }}>452 operators and counting &rarr;</div>
        </div>
      </div>

      {/* Bottom links */}
      <div style={{ padding: "0 16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
        <Link href="/">
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.text25, cursor: "pointer", transition: "color 0.15s", padding: "4px 0" }}>
            <SIcon name="external" size={14} /> Back to site
          </span>
        </Link>
        <Link href="/docs">
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.text25, cursor: "pointer", transition: "color 0.15s", padding: "4px 0" }}>
            <SIcon name="book" size={14} /> Help & Support
          </span>
        </Link>
      </div>
    </div>
  );
}

/* ── Overview panel ─────────────────────────────────────────────────────── */

function OverviewPanel() {
  const [feed, setFeed] = useState<LiveTx[]>(() => Array.from({ length: 10 }, (_, i) => makeTx(i)));
  const feedId = useRef(10);
  const { events } = useLiveFeed();

  const statsQuery = trpc.stats.overview.useQuery(undefined, { staleTime: 300_000 });

  useEffect(() => {
    const iv = setInterval(() => {
      setFeed((prev) => [makeTx(feedId.current++), ...prev].slice(0, 10));
    }, 8000);
    return () => clearInterval(iv);
  }, []);

  const revenueData = useMemo(() =>
    DEMO_REVENUE.map((v, i) => ({
      date: new Date(Date.now() - (27 - i) * 86400000),
      value: v * 100,
    })), []);

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const heroStats = [
    { label: "Invocation Success", value: "96.8%", delta: "+0.5%", positive: true },
    { label: "Revenue (USDC)", value: "$141,899", delta: "+$1,205 today", positive: true },
    { label: "Active Operators", value: "452", delta: "+12 this week", positive: true },
    { label: "Avg Response", value: "124ms", delta: "-8.2%", positive: true },
  ];

  const activityLog = [
    { dot: "rgba(52,211,153,0.6)", text: "CodeGuard invoked by 7Rkf...dN2j — guardrail passed", time: "2m ago", tag: "operational" },
    { dot: "rgba(245,158,11,0.6)", text: "JupiterSwap latency spike detected (340ms)", time: "5m ago", tag: "monitoring" },
    { dot: "rgba(52,211,153,0.6)", text: "FirecrawlPro completed batch extraction (124 docs)", time: "8m ago", tag: "operational" },
    { dot: "rgba(239,68,68,0.5)", text: "WhisperSTT blocked — content safety violation", time: "12m ago", tag: "blocked" },
    { dot: "rgba(52,211,153,0.6)", text: "SemgrepScan registered by creator 9xK2...mP4q", time: "18m ago", tag: "operational" },
    { dot: "rgba(128,128,128,0.4)", text: "DeepSeekV3 dispute #47 resolved — refund issued", time: "25m ago", tag: "resolved" },
    { dot: "rgba(245,158,11,0.6)", text: "Validator bond #312 — 500 USDC staked", time: "32m ago", tag: "monitoring" },
  ];

  const tagColor = (tag: string) => {
    if (tag === "operational") return T.mint;
    if (tag === "monitoring") return "rgba(245,158,11,0.6)";
    if (tag === "blocked") return T.red;
    return "rgba(128,128,128,0.4)";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text90, margin: 0 }}>Protocol Overview</h1>
          <span style={{ fontSize: 13, color: T.text25 }}>{today}</span>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 14px",
          borderRadius: 20,
          background: "rgba(52,211,153,0.06)",
          border: "1px solid rgba(52,211,153,0.12)",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.mint, display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 12, color: T.text50, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>All Systems Live</span>
        </div>
      </div>

      {/* Hero stats — floating on bg, no boxes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
        {heroStats.map((s, i) => (
          <div key={i} style={{ position: "relative" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, color: T.text25, marginBottom: 6 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 40, fontWeight: 400, fontVariantNumeric: "tabular-nums", lineHeight: 1.1, color: T.text90 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: s.positive ? T.mint : T.red, marginTop: 4 }}>
              {s.delta}
            </div>
            {/* Green underline gradient */}
            <div style={{
              marginTop: 12,
              height: 1,
              background: `linear-gradient(90deg, ${T.mint}40 0%, transparent 100%)`,
            }} />
          </div>
        ))}
      </div>

      {/* Revenue chart + Live Feed */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, alignItems: "stretch" }}>
        {/* Revenue chart */}
        <Card>
          <CardHead title="Revenue (28d)" />
          <div style={{ padding: "0 8px 8px", height: 200 }}>
            <PremiumAreaChart data={revenueData} height={170}
              formatValue={(v) => `$${Math.round(v).toLocaleString()}`} />
          </div>
        </Card>

        {/* Live Feed */}
        <Card>
          <CardHead title="Live Feed" />
          <div style={{ padding: "12px 16px", height: 200, overflowY: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {feed.slice(0, 10).map((tx) => (
                <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusDot(tx.status), flexShrink: 0 }} />
                  <span style={{ color: T.text50, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{tx.operator}</span>
                  <span style={{ color: T.text20, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.caller}</span>
                  <span style={{ marginLeft: "auto", color: T.text50, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{tx.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Operator Status */}
      <Card>
        <CardHead title="Operator Status" />
        <div style={{ padding: "12px 20px" }}>
          {DEMO_OPS.map((op, i) => (
            <div key={op.name} style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 0",
              borderBottom: i < DEMO_OPS.length - 1 ? `1px solid ${T.border}` : "none",
            }}>
              <span style={{ width: 16, fontSize: 11, color: T.text20, fontVariantNumeric: "tabular-nums" }}>{i + 1}</span>
              <span style={{ fontWeight: 600, fontSize: 13, color: T.text90, width: 110 }}>{op.name}</span>
              <span style={{
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 4,
                background: T.white6,
                color: T.text30,
              }}>{op.category}</span>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
                <Spark data={op.successHistory} width={64} height={20} />
                <span style={{ fontSize: 12, color: T.text50, fontVariantNumeric: "tabular-nums", width: 64, textAlign: "right" as const }}>
                  ${Math.round(op.earned).toLocaleString()}
                </span>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.mint }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Activity Log + Network Health */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Activity Log */}
        <Card>
          <CardHead title="Activity Log" />
          <div style={{ padding: "12px 20px" }}>
            {activityLog.map((a, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderBottom: i < activityLog.length - 1 ? `1px solid ${T.border}` : "none",
                fontSize: 13,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: tagColor(a.tag), flexShrink: 0 }} />
                <span style={{ color: T.text50, flex: 1 }}>{a.text}</span>
                <span style={{ color: T.text20, fontSize: 11, whiteSpace: "nowrap" }}>{a.time}</span>
                <span style={{ color: T.text20, fontSize: 11, textAlign: "right" as const, width: 80 }}>{a.tag}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Network Health */}
        <Card>
          <CardHead title="Network Health" />
          <div style={{ padding: "20px 20px" }}>
            {NETWORK_HEALTH.map((h) => {
              const barWidth = h.bar ?? h.value;
              return (
                <div key={h.label} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: T.text50 }}>{h.label}</span>
                    <span style={{ fontSize: 12, color: T.text50, fontVariantNumeric: "tabular-nums" }}>{h.value}{h.unit}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: T.white4 }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      style={{ height: "100%", borderRadius: 3, background: barWidth > 95 ? "rgba(52,211,153,0.4)" : "rgba(245,158,11,0.4)" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Fee Distribution */}
      <Card>
        <CardHead title="Fee Distribution" />
        <div style={{ padding: "20px 20px" }}>
          {/* Stacked horizontal bar */}
          <div style={{ display: "flex", height: 24, borderRadius: 4, overflow: "hidden", marginBottom: 16 }}>
            {FEE_SPLIT.map((seg, i) => (
              <div key={seg.label} style={{
                width: `${seg.pct}%`,
                background: `rgba(255,255,255,${0.25 - i * 0.035})`,
                borderRight: i < FEE_SPLIT.length - 1 ? `1px solid ${T.bg}` : "none",
              }} />
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {FEE_SPLIT.map((seg, i) => (
              <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: `rgba(255,255,255,${0.25 - i * 0.035})` }} />
                <span style={{ color: T.text50 }}>{seg.label}</span>
                <span style={{ color: T.text25, fontVariantNumeric: "tabular-nums" }}>{seg.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ── Operators panel ────────────────────────────────────────────────────── */

function OperatorsPanel() {
  const opsQuery = trpc.operator.list.useQuery({ limit: 50 }, { staleTime: 300_000 });
  const ops = (opsQuery.data as ApiOperator[] | undefined) ?? [];

  return (
    <div>
      <SectionHeader title="My Operators" subtitle="Manage and monitor your deployed operators" />
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Link href="/recruit">
          <span style={{
            padding: "8px 16px",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            color: T.text50,
            cursor: "pointer",
            border: `1px solid ${T.border}`,
            background: "transparent",
            transition: "all 0.15s",
          }}>Deploy New Operator</span>
        </Link>
      </div>
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {["Name", "Category", "Success", "Sparkline", "Invocations", "Revenue", ""].map((h) => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" as const, fontWeight: 700, color: T.text25 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(ops.length ? ops : DEMO_OPS).map((op, i) => {
                const name = "name" in op ? op.name : "";
                const cat = "category" in op ? op.category : "";
                const sr = "successRate" in op ? (typeof op.successRate === "number" ? op.successRate : parseFloat(op.successRate as string)) : 0;
                const hist = "successHistory" in op ? (op as DemoOperator).successHistory : DEMO_SPARKLINE;
                const earned = "earned" in op ? (op as DemoOperator).earned : 0;
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    <td style={{ padding: "12px 20px", color: T.text90, fontWeight: 500 }}>{name}</td>
                    <td style={{ padding: "12px 20px" }}>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: T.white6, color: T.text30 }}>{cat}</span>
                    </td>
                    <td style={{ padding: "12px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 64, height: 4, borderRadius: 2, background: T.white4 }}>
                          <div style={{ height: "100%", borderRadius: 2, width: `${sr}%`, background: "rgba(52,211,153,0.4)" }} />
                        </div>
                        <span style={{ color: T.text50, fontVariantNumeric: "tabular-nums" }}>{sr.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 20px" }}>
                      <Spark data={hist} width={64} height={20} />
                    </td>
                    <td style={{ padding: "12px 20px", color: T.text50, fontVariantNumeric: "tabular-nums" }}>
                      {("invocations" in op ? op.invocations : 0).toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 20px", color: T.text50, fontVariantNumeric: "tabular-nums" }}>
                      ${earned.toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 20px" }}>
                      <SIcon name="arrow-right" size={14} className="text-white/20" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ── Earnings panel ─────────────────────────────────────────────────────── */

function EarningsPanel() {
  const earningsData = useMemo(() =>
    DEMO_REVENUE.map((v, i) => ({
      date: new Date(Date.now() - (27 - i) * 86400000),
      value: v * 100,
    })), []);

  const stats = [
    { label: "Total Revenue", value: "$141,899" },
    { label: "Today", value: "$2,847" },
    { label: "This Week", value: "$18,234" },
    { label: "This Month", value: "$67,891" },
  ];

  return (
    <div>
      <SectionHeader title="Earnings" subtitle="Revenue breakdown and historical performance" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <Card key={i}>
            <div style={{ padding: "20px" }}>
              <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, color: T.text25, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 400, fontVariantNumeric: "tabular-nums", color: T.text90, marginBottom: 8 }}>{s.value}</div>
              <PremiumSparkline data={DEMO_SPARKLINE.slice(i * 2)} width={120} height={24} id={`earn-${i}`} />
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <CardHead title="Revenue Over Time" />
        <div style={{ padding: "0 8px 8px", height: 260 }}>
          <PremiumAreaChart data={earningsData} height={230}
            formatValue={(v) => `$${Math.round(v).toLocaleString()}`} />
        </div>
      </Card>
    </div>
  );
}

/* ── Activity panel ─────────────────────────────────────────────────────── */

function ActivityPanel() {
  const [txs] = useState<LiveTx[]>(() => Array.from({ length: 20 }, (_, i) => ({
    ...makeTx(i),
    time: `${Math.floor(Math.random() * 55 + 1)}m ago`,
    latency: `${Math.floor(Math.random() * 300 + 40)}ms`,
  })));

  return (
    <div>
      <SectionHeader title="Activity" subtitle="Recent invocations and transaction history" />
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {["Status", "Operator", "Caller", "Amount", "Latency", "Time"].map((h) => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" as const, fontWeight: 700, color: T.text25 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txs.map((tx, i) => {
                const latMs = parseInt(tx.latency);
                const latOpacity = latMs > 200 ? 0.3 : latMs > 100 ? 0.5 : 0.7;
                return (
                  <tr key={tx.id} style={{
                    borderBottom: `1px solid ${T.border}`,
                    background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                  }}>
                    <td style={{ padding: "10px 20px" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusDot(tx.status), display: "inline-block" }} />
                    </td>
                    <td style={{ padding: "10px 20px", color: T.text50 }}>{tx.operator}</td>
                    <td style={{ padding: "10px 20px", color: T.text30, fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>{tx.caller}</td>
                    <td style={{ padding: "10px 20px", color: T.text50, fontVariantNumeric: "tabular-nums" }}>{tx.amount}</td>
                    <td style={{ padding: "10px 20px", fontVariantNumeric: "tabular-nums", opacity: latOpacity }}>{tx.latency}</td>
                    <td style={{ padding: "10px 20px", color: T.text20 }}>{tx.time}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ── Connect panel ──────────────────────────────────────────────────────── */

function ConnectPanel() {
  const endpoint = "https://mcp.aegisplace.com/v1";
  const config = JSON.stringify({
    mcpServers: {
      aegis: {
        url: endpoint,
        transport: { type: "sse" },
        auth: { type: "bearer", token: "<YOUR_API_KEY>" },
      },
    },
  }, null, 2);

  return (
    <div>
      <SectionHeader title="MCP Connect" subtitle="Connect your agents to the Aegis protocol" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Connected Agents", value: "38" },
          { label: "Active Sessions", value: "124" },
          { label: "Avg Latency", value: "89ms" },
          { label: "Uptime", value: "99.9%" },
        ].map((s, i) => (
          <Card key={i}>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, color: T.text25, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 400, fontVariantNumeric: "tabular-nums", color: T.text90 }}>{s.value}</div>
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <CardHead title="Endpoint" />
        <div style={{ padding: 20 }}>
          <code style={{
            display: "block",
            padding: 12,
            borderRadius: 6,
            fontSize: 13,
            color: T.text50,
            background: T.white3,
            fontFamily: "JetBrains Mono, monospace",
          }}>{endpoint}</code>
        </div>
      </Card>
      <div style={{ marginTop: 16 }}>
        <Card>
          <CardHead title="Client Configuration" />
          <div style={{ padding: 20 }}>
            <pre style={{
              padding: 12,
              borderRadius: 6,
              fontSize: 12,
              color: T.text50,
              background: T.white3,
              fontFamily: "JetBrains Mono, monospace",
              overflowX: "auto",
              margin: 0,
            }}>{config}</pre>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── Settings panel ─────────────────────────────────────────────────────── */

function SettingsPanel() {
  const [displayName, setDisplayName] = useState("");

  return (
    <div>
      <SectionHeader title="Settings" subtitle="Profile and account configuration" />
      <Card>
        <CardHead title="Profile" />
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, color: T.text25 }}>
              Wallet Address
            </label>
            <div style={{
              padding: 12,
              borderRadius: 6,
              fontSize: 13,
              color: T.text50,
              background: T.white3,
              fontFamily: "JetBrains Mono, monospace",
              border: `1px solid ${T.border}`,
            }}>
              7f3aGh23jKlMnOpQrStUvWxDk9x
            </div>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, color: T.text25 }}>
              Display Name
            </label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name..."
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 6,
                fontSize: 13,
                color: T.text90,
                background: T.white3,
                border: `1px solid ${T.border}`,
                outline: "none",
                boxSizing: "border-box",
              }} />
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ── Placeholder panel ──────────────────────────────────────────────────── */

function PlaceholderPanel({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "128px 0", textAlign: "center" }}>
      <SIcon name={icon} size={48} className="text-white/10" />
      <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text30, margin: "16px 0 8px" }}>{title}</h2>
      <p style={{ fontSize: 13, color: T.text20 }}>Coming soon</p>
    </div>
  );
}

/* ── Embed page wrapper ─────────────────────────────────────────────────── */

function EmbedPage({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "60vh" }}>
      <Suspense fallback={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "128px 0" }}>
          <div style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.10)",
            borderTopColor: "rgba(255,255,255,0.30)",
            animation: "spin 1s linear infinite",
          }} />
        </div>
      }>
        {children}
      </Suspense>
    </div>
  );
}

/* ── Main Dashboard ─────────────────────────────────────────────────────── */

export default function Dashboard() {
  return <ComingSoon title="Dashboard" description="Protocol analytics, operator management, and earnings tracking." />;
}

function _Dashboard() {
  const [section, setSection] = useState<DashSection>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  const renderContent = () => {
    switch (section) {
      case "overview": return <OverviewPanel />;
      case "operators": return <OperatorsPanel />;
      case "earnings": return <EarningsPanel />;
      case "activity": return <ActivityPanel />;
      case "connect": return <ConnectPanel />;
      case "settings": return <SettingsPanel />;
      case "disputes": return <PlaceholderPanel icon="shield" title="Disputes" />;
      case "embed-marketplace": return <EmbedPage><Marketplace /></EmbedPage>;
      case "embed-playground": return <EmbedPage><Playground /></EmbedPage>;
      case "embed-leaderboard": return <EmbedPage><Leaderboard /></EmbedPage>;
      case "embed-docs": return <EmbedPage><Docs /></EmbedPage>;
      case "embed-agents": return <EmbedPage><Agents /></EmbedPage>;
      case "embed-tasks": return <EmbedPage><Tasks /></EmbedPage>;
      case "embed-analytics": return <EmbedPage><Analytics /></EmbedPage>;
      case "embed-validators": return <EmbedPage><Validators /></EmbedPage>;
      default: return <OverviewPanel />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex" style={{ flexShrink: 0, width: 260 }}>
        <Sidebar section={section} setSection={setSection} />
      </div>

      {/* Mobile hamburger */}
      <button onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden"
        style={{ padding: 8, borderRadius: 6, background: T.white6, border: `1px solid ${T.border}` }}>
        <SIcon name="grid" size={18} className="text-white/50" />
      </button>

      {/* Mobile overlay sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div className="fixed inset-0 z-40 md:hidden"
              style={{ background: "rgba(0,0,0,0.6)" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)} />
            <motion.div className="fixed inset-y-0 left-0 z-50 md:hidden"
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}>
              <Sidebar section={section} setSection={setSection} onClose={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin" as const }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 32px" }}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
