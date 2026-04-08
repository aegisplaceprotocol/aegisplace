import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { PremiumAreaChart } from "@/components/PremiumAreaChart";

/* ── Design tokens ──────────────────────────────────────────────────────── */

const T = {
  bg: "#060606",
  card: "#0A0A0A",
  border: "rgba(255,255,255,0.06)",
  borderHover: "rgba(255,255,255,0.10)",
  mint: "rgba(52,211,153,0.55)",
  amber: "rgba(245,158,11,0.90)",
  blue: "rgba(59,130,246,0.90)",
  red: "rgba(220,100,60,0.50)",
  text90: "rgba(255,255,255,0.90)",
  text50: "rgba(255,255,255,0.50)",
  text30: "rgba(255,255,255,0.30)",
  text25: "rgba(255,255,255,0.25)",
  text20: "rgba(255,255,255,0.20)",
  white6: "rgba(255,255,255,0.06)",
  white4: "rgba(255,255,255,0.04)",
  white3: "rgba(255,255,255,0.03)",
} as const;

/* ── Tab types ──────────────────────────────────────────────────────────── */

type RoyaltiesTab = "earnings" | "dependencies" | "leaderboard" | "how-it-works";

/* ── Demo data ──────────────────────────────────────────────────────────── */

const DEMO_EARNINGS = {
  unclaimed: 24_810_000,
  totalEarned: 891_340_000,
  totalClaimed: 866_530_000,
  recentPayments: [
    { childSkill: "report-generator", invocationAmount: 100_000, royaltyAmount: 3_000, depth: 1, time: "2m ago", status: "deposited" },
    { childSkill: "market-analyzer", invocationAmount: 80_000, royaltyAmount: 2_400, depth: 1, time: "7m ago", status: "deposited" },
    { childSkill: "sentiment-engine", invocationAmount: 120_000, royaltyAmount: 1_440, depth: 2, time: "14m ago", status: "claimed" },
    { childSkill: "code-reviewer", invocationAmount: 50_000, royaltyAmount: 1_500, depth: 1, time: "22m ago", status: "claimed" },
    { childSkill: "report-generator", invocationAmount: 100_000, royaltyAmount: 3_000, depth: 1, time: "31m ago", status: "claimed" },
    { childSkill: "translation-hub", invocationAmount: 60_000, royaltyAmount: 720, depth: 2, time: "45m ago", status: "claimed" },
    { childSkill: "data-pipeline", invocationAmount: 90_000, royaltyAmount: 2_700, depth: 1, time: "58m ago", status: "claimed" },
  ],
  topSources: [
    { skillName: "Report Generator", slug: "report-generator", totalPaid: 342_000, invocations: 114 },
    { skillName: "Market Analyzer", slug: "market-analyzer", totalPaid: 289_000, invocations: 96 },
    { skillName: "Code Reviewer", slug: "code-reviewer", totalPaid: 187_000, invocations: 124 },
    { skillName: "Sentiment Engine", slug: "sentiment-engine", totalPaid: 73_000, invocations: 51 },
  ],
};

const DEMO_UPSTREAM_DEPS = [
  { slug: "pdf-extractor", name: "PDF Extractor", royaltyBps: 300, depth: 1 },
  { slug: "ocr-engine", name: "OCR Engine", royaltyBps: 200, depth: 2 },
];

const DEMO_DOWNSTREAM_DEPS = [
  { slug: "report-generator", name: "Report Generator", royaltyBps: 300, depth: 1 },
  { slug: "market-analyzer", name: "Market Analyzer", royaltyBps: 250, depth: 1 },
  { slug: "sentiment-engine", name: "Sentiment Engine", royaltyBps: 200, depth: 2 },
];

const DEMO_LEADERBOARD = [
  { rank: 1, name: "RPC Load Balancer", slug: "rpc-load-balancer", category: "infrastructure", dependents: 47, totalRoyalties: 12_450_000, avgPerDay: 415_000, sparkData: [12,13,14,15,16,18,20,19,21,22] },
  { rank: 2, name: "Multilingual Translator", slug: "multilingual-translator", category: "translation", dependents: 38, totalRoyalties: 9_870_000, avgPerDay: 329_000, sparkData: [8,9,10,11,12,11,13,14,15,14] },
  { rank: 3, name: "Gemini Flash 2.0", slug: "gemini-flash-2", category: "text-generation", dependents: 31, totalRoyalties: 7_230_000, avgPerDay: 241_000, sparkData: [6,7,8,9,9,10,11,12,11,12] },
  { rank: 4, name: "PDF Extractor Pro", slug: "pdf-extractor", category: "data-extraction", dependents: 28, totalRoyalties: 5_910_000, avgPerDay: 197_000, sparkData: [5,6,6,7,7,8,9,9,9,10] },
  { rank: 5, name: "Code Sandboxer", slug: "code-sandbox", category: "code-review", dependents: 24, totalRoyalties: 4_350_000, avgPerDay: 145_000, sparkData: [4,4,5,5,6,6,7,7,7,8] },
  { rank: 6, name: "Web Scraper Agent", slug: "web-scraper", category: "data-extraction", dependents: 19, totalRoyalties: 3_120_000, avgPerDay: 104_000, sparkData: [3,3,4,4,4,5,5,5,6,6] },
  { rank: 7, name: "Vector Embedder", slug: "vector-embedder", category: "other", dependents: 16, totalRoyalties: 2_340_000, avgPerDay: 78_000, sparkData: [2,2,3,3,3,4,4,4,4,5] },
  { rank: 8, name: "SQL Query Agent", slug: "sql-agent", category: "other", dependents: 12, totalRoyalties: 1_680_000, avgPerDay: 56_000, sparkData: [1,2,2,2,3,3,3,3,4,4] },
];

/* ── USDC formatting ────────────────────────────────────────────────────── */

function fmtUsdc(baseUnits: number, decimals: 2 | 4 | 6 = 4): string {
  return `$${(baseUnits / 1_000_000).toFixed(decimals)}`;
}

/* ── Icon system ────────────────────────────────────────────────────────── */

const ICON_PATHS: Record<string, string> = {
  dollar: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  link: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
  "bar-chart": "M12 20V10M18 20V4M6 20v-4",
  book: "M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z",
  "arrow-right": "M5 12h14M12 5l7 7-7 7",
  "arrow-up-right": "M7 17L17 7M7 7h10v10",
  "chevron-right": "M9 18l6-6-6-6",
  check: "M20 6L9 17l-5-5",
  plus: "M12 5v14M5 12h14",
  external: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  trophy: "M8 21h8M12 21v-4M7 3H5a2 2 0 00-2 2v3a4 4 0 004 4 4 4 0 004-4V3H7zM17 3h2a2 2 0 012 2v3a4 4 0 01-4 4 4 4 0 01-4-4V3h4z",
  "info": "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8h.01M11 12h1v4h1",
  "git-branch": "M6 3v12M18 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM18 9a9 9 0 01-9 9",
  "corner-down-right": "M15 10l5 5-5 5M4 4v7a4 4 0 004 4h12",
  "cpu": "M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3M6 6h12v12H6z",
};

function SIcon({ name, size = 16 }: { name: string; size?: number }) {
  const d = ICON_PATHS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/* ── Spark (mini sparkline) ─────────────────────────────────────────────── */

function Spark({ data, width = 64, height = 20 }: { data: number[]; width?: number; height?: number }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * (height - 4) - 2,
  }));
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
    if (i === 0) segments.push(`M${p1.x},${p1.y}`);
    segments.push(`C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`);
  }
  const linePath = segments.join(" ");
  const fillPath = `${linePath} L${width},${height} L0,${height} Z`;
  const gradId = `spark-${width}-${height}-${data.join("-").slice(0, 20)}`;
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(52,211,153,0.08)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke="rgba(52,211,153,0.45)" strokeWidth="1.5" />
    </svg>
  );
}

/* ── Card primitives ────────────────────────────────────────────────────── */

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${hovered ? T.borderHover : T.border}`,
        borderRadius: 4,
        overflow: "hidden",
        transition: "border-color 0.2s",
        ...style,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </div>
  );
}

function CardHead({ title }: { title: string }) {
  return (
    <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" as const, fontWeight: 400, color: T.text25 }}>
        {title}
      </span>
    </div>
  );
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12, marginBottom: 28 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 400, color: T.text90, margin: 0, letterSpacing: "-0.02em" }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 12, color: T.text25, margin: "4px 0 0" }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function StatTile({ label, value, delta, sub }: { label: string; value: string; delta?: string; sub?: string }) {
  return (
    <Card>
      <div style={{ padding: "20px 20px 16px" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" as const, fontWeight: 400, color: T.text20, marginBottom: 10 }}>
          {label}
        </div>
        <div style={{ fontSize: 32, fontWeight: 400, fontVariantNumeric: "tabular-nums", color: T.text90, letterSpacing: "-0.02em", lineHeight: 1 }}>
          {value}
        </div>
        {delta && (
          <div style={{ fontSize: 12, color: T.mint, marginTop: 8, fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
            {delta}
          </div>
        )}
        {sub && <div style={{ fontSize: 11, color: T.text20, marginTop: 3 }}>{sub}</div>}
        <div style={{ marginTop: 14, height: 1, background: "linear-gradient(90deg, rgba(52,211,153,0.22) 0%, transparent 80%)" }} />
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    deposited: { bg: "rgba(59,130,246,0.10)", color: "rgba(59,130,246,0.90)" },
    pending:   { bg: "rgba(245,158,11,0.10)", color: "rgba(245,158,11,0.90)" },
    claimed:   { bg: "rgba(52,211,153,0.10)", color: "rgba(52,211,153,0.90)" },
    failed:    { bg: "rgba(239,68,68,0.10)",  color: "rgba(239,68,68,0.90)" },
  };
  const s = map[status] ?? { bg: T.white6, color: T.text30 };
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 400,
      letterSpacing: "0.06em",
      textTransform: "uppercase" as const,
      background: s.bg,
      color: s.color,
    }}>
      {status}
    </span>
  );
}

function depthColor(depth: number): string {
  if (depth === 1) return "rgba(255,255,255,0.70)";
  if (depth === 2) return "rgba(255,255,255,0.50)";
  return "rgba(255,255,255,0.30)";
}

/* ── Tab nav ────────────────────────────────────────────────────────────── */

const TABS: { id: RoyaltiesTab; label: string; icon: string }[] = [
  { id: "earnings", label: "My Earnings", icon: "dollar" },
  { id: "dependencies", label: "Dependencies", icon: "git-branch" },
  { id: "leaderboard", label: "Leaderboard", icon: "trophy" },
  { id: "how-it-works", label: "How It Works", icon: "book" },
];

function TabNav({ active, setActive }: { active: RoyaltiesTab; setActive: (t: RoyaltiesTab) => void }) {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 32, borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderBottom: isActive ? `2px solid ${T.mint}` : "2px solid transparent",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: isActive ? 700 : 400,
              color: isActive ? T.text90 : T.text50,
              transition: "all 0.15s",
              marginBottom: -1,
            }}
          >
            <span style={{ color: isActive ? T.mint : T.text30 }}>
              <SIcon name={tab.icon} size={14} />
            </span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Section 1: My Earnings ─────────────────────────────────────────────── */

function EarningsSection() {
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const chartData = useMemo(() => {
    const raw = [180, 210, 240, 230, 270, 310, 300, 340, 380, 360, 400, 430, 420, 460, 500, 480, 520, 550, 540, 580, 610, 600, 640, 670, 660, 700, 730, 720, 760, 810];
    return raw.map((v, i) => ({
      date: new Date(Date.now() - (29 - i) * 86400000),
      value: v,
    }));
  }, []);

  const handleClaim = () => {
    setClaiming(true);
    setTimeout(() => { setClaiming(false); setClaimed(true); }, 1400);
  };

  const unclaimedDisplay = fmtUsdc(DEMO_EARNINGS.unclaimed, 4);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <PageHeader
        title="Skill Royalties"
        subtitle="Passive income from every downstream invocation"
        action={
          <button
            onClick={handleClaim}
            disabled={claiming || claimed}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 4,
              background: claimed ? "rgba(52,211,153,0.08)" : "rgba(52,211,153,0.12)",
              border: `1px solid ${claimed ? "rgba(52,211,153,0.20)" : "rgba(52,211,153,0.30)"}`,
              color: T.mint,
              fontSize: 13,
              fontWeight: 400,
              cursor: claiming || claimed ? "not-allowed" : "pointer",
              opacity: claiming ? 0.7 : 1,
              transition: "all 0.2s",
              letterSpacing: "0.02em",
            }}
          >
            <SIcon name="zap" size={14} />
            {claimed ? "Claimed!" : claiming ? "Claiming..." : `Claim ${unclaimedDisplay}`}
          </button>
        }
      />

      {/* Stat tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        <StatTile
          label="Unclaimed"
          value={fmtUsdc(DEMO_EARNINGS.unclaimed, 4)}
          delta="Ready to claim"
          sub="in on-chain vault"
        />
        <StatTile
          label="Total Earned"
          value={fmtUsdc(DEMO_EARNINGS.totalEarned, 2)}
          delta="+$0.0341 today"
          sub="lifetime royalties"
        />
        <StatTile
          label="Total Claimed"
          value={fmtUsdc(DEMO_EARNINGS.totalClaimed, 2)}
          delta="97.2% claim rate"
          sub="settled on-chain"
        />
        <StatTile
          label="Dependencies"
          value="3"
          delta="1 upstream, 3 downstream"
          sub="royalty relationships"
        />
      </div>

      {/* Earnings chart */}
      <Card>
        <CardHead title="Royalty Earnings (30d)" />
        <div style={{ padding: "4px 0 0" }}>
          <PremiumAreaChart
            data={chartData}
            height={220}
            lineColor="rgba(52,211,153,0.6)"
            fillColorFrom="rgba(52,211,153,0.12)"
            fillColorTo="transparent"
            gridColor="rgba(255,255,255,0.04)"
            axisColor="rgba(255,255,255,0.15)"
            formatValue={(v) => `$${v.toFixed(2)}`}
            formatDate={(d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          />
        </div>
      </Card>

      {/* Two-column bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {/* Recent royalty payments table */}
        <Card>
          <CardHead title="Recent Royalty Payments" />
          <div style={{ overflowX: "auto" as const }}>
            <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {["Child Skill", "Inv. Amount", "Your Royalty", "Depth", "Time", "Status"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left" as const, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: T.text20, fontWeight: 400 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEMO_EARNINGS.recentPayments.map((p, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = T.white3; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                  >
                    <td style={{ padding: "12px 16px", fontSize: 13, color: T.text90, fontWeight: 500 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{p.childSkill}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: T.text50, fontVariantNumeric: "tabular-nums" }}>
                      {fmtUsdc(p.invocationAmount, 4)}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: T.mint, fontWeight: 400, fontVariantNumeric: "tabular-nums" }}>
                      {fmtUsdc(p.royaltyAmount, 4)}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 22, height: 22, borderRadius: 4,
                        background: T.white4, fontSize: 11, fontWeight: 400,
                        color: depthColor(p.depth), fontVariantNumeric: "tabular-nums",
                      }}>
                        {p.depth}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: T.text30 }}>{p.time}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top sources */}
        <Card>
          <CardHead title="Top Sources" />
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {DEMO_EARNINGS.topSources.map((src, i) => {
              const maxPaid = DEMO_EARNINGS.topSources[0].totalPaid;
              const pct = (src.totalPaid / maxPaid) * 100;
              return (
                <div key={src.slug}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 400, color: T.text20, fontVariantNumeric: "tabular-nums", width: 14 }}>#{i + 1}</span>
                      <span style={{ fontSize: 13, color: T.text90, fontWeight: 500 }}>{src.skillName}</span>
                    </div>
                    <span style={{ fontSize: 12, color: T.mint, fontWeight: 400, fontVariantNumeric: "tabular-nums" }}>
                      {fmtUsdc(src.totalPaid, 4)}
                    </span>
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: T.white4, overflow: "hidden" as const }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "rgba(52,211,153,0.35)", borderRadius: 2, transition: "width 0.5s ease" }} />
                  </div>
                  <div style={{ fontSize: 10, color: T.text20, marginTop: 3 }}>{src.invocations} invocations</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── Section 2: Dependencies ────────────────────────────────────────────── */

function DependenciesSection() {
  const [showForm, setShowForm] = useState(false);
  const [parentSkill, setParentSkill] = useState("");
  const [royaltyBps, setRoyaltyBps] = useState(300);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    background: T.white4,
    border: `1px solid ${T.border}`,
    borderRadius: 5,
    color: T.text90,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const DepTable = ({ items, direction }: { items: typeof DEMO_UPSTREAM_DEPS; direction: "upstream" | "downstream" }) => (
    <div style={{ overflowX: "auto" as const }}>
    <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${T.border}` }}>
          {["Skill", "", "Relationship", "Rate", "Depth", "Actions"].map((h) => (
            <th key={h} style={{ padding: "10px 14px", textAlign: "left" as const, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: T.text20, fontWeight: 400 }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((dep) => (
          <tr key={dep.slug} style={{ borderBottom: `1px solid ${T.border}` }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = T.white3; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
          >
            <td style={{ padding: "12px 14px" }}>
              <span style={{ fontSize: 12, color: T.text90, fontFamily: "'JetBrains Mono', monospace" }}>{dep.slug}</span>
            </td>
            <td style={{ padding: "12px 8px", color: direction === "upstream" ? "rgba(245,158,11,0.70)" : T.mint }}>
              <SIcon name={direction === "upstream" ? "arrow-up-right" : "corner-down-right"} size={14} />
            </td>
            <td style={{ padding: "12px 14px", fontSize: 12, color: T.text50 }}>
              {direction === "upstream" ? "You pay royalties" : "Pays you royalties"}
            </td>
            <td style={{ padding: "12px 14px" }}>
              <span style={{ fontSize: 12, color: T.mint, fontWeight: 400, fontVariantNumeric: "tabular-nums" }}>
                {(dep.royaltyBps / 100).toFixed(1)}%
              </span>
            </td>
            <td style={{ padding: "12px 14px" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 22, height: 22, borderRadius: 4, background: T.white4,
                fontSize: 11, fontWeight: 400, color: depthColor(dep.depth), fontVariantNumeric: "tabular-nums",
              }}>
                {dep.depth}
              </span>
            </td>
            <td style={{ padding: "12px 14px" }}>
              <button style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 4, padding: "4px 10px", fontSize: 11, color: T.text30, cursor: "pointer" }}>
                Remove
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <PageHeader
        title="Dependencies"
        subtitle="Manage skill dependency declarations"
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 16px", borderRadius: 4,
              background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)",
              color: T.mint, fontSize: 13, fontWeight: 400, cursor: "pointer",
            }}
          >
            <SIcon name="plus" size={14} />
            Register New Dependency
          </button>
        }
      />

      {/* Inline registration form */}
      {showForm && (
        <Card>
          <CardHead title="Register Dependency" />
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: T.text25, marginBottom: 6, fontWeight: 400 }}>
                  Parent Skill Slug
                </label>
                <input
                  style={inputStyle}
                  placeholder="e.g. pdf-extractor"
                  value={parentSkill}
                  onChange={(e) => setParentSkill(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: T.text25, marginBottom: 6, fontWeight: 400 }}>
                  Royalty Rate. {(royaltyBps / 100).toFixed(1)}% ({royaltyBps} bps)
                </label>
                <input
                  type="range" min={100} max={2000} step={50}
                  value={royaltyBps}
                  onChange={(e) => setRoyaltyBps(Number(e.target.value))}
                  style={{ width: "100%", accentColor: T.mint, marginTop: 8 }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.text20, marginTop: 2 }}>
                  <span>1% min</span>
                  <span>20% max</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{
                padding: "9px 20px", borderRadius: 4,
                background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)",
                color: T.mint, fontSize: 13, fontWeight: 400, cursor: "pointer",
              }}>
                Submit On-Chain
              </button>
              <button onClick={() => setShowForm(false)} style={{
                padding: "9px 20px", borderRadius: 4,
                background: "transparent", border: `1px solid ${T.border}`,
                color: T.text50, fontSize: 13, cursor: "pointer",
              }}>
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Two panels side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <CardHead title="My Skills Depend On" />
          <div style={{ padding: "4px 0" }}>
            <div style={{ padding: "8px 14px 4px", fontSize: 12, color: T.text30 }}>
              Skills you depend on. you pay royalties upstream
            </div>
            <DepTable items={DEMO_UPSTREAM_DEPS} direction="upstream" />
          </div>
        </Card>

        <Card>
          <CardHead title="Skills Depending On Mine" />
          <div style={{ padding: "4px 0" }}>
            <div style={{ padding: "8px 14px 4px", fontSize: 12, color: T.text30 }}>
              Downstream skills. they pay royalties to you
            </div>
            <DepTable items={DEMO_DOWNSTREAM_DEPS} direction="downstream" />
          </div>
        </Card>
      </div>

      {/* Info callout */}
      <div style={{
        display: "flex", gap: 12, padding: "14px 18px",
        background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.10)",
        borderRadius: 4,
      }}>
        <span style={{ color: T.mint, flexShrink: 0, marginTop: 1 }}><SIcon name="info" size={16} /></span>
        <div>
          <div style={{ fontSize: 13, color: T.text50, lineHeight: 1.6 }}>
            Royalty rates are set <span style={{ color: T.text90, fontWeight: 400 }}>once at registration</span> and enforced on-chain.
            Depth-1 dependencies pay the full declared rate; depth-2+ are cascaded at 50% per hop, ensuring fair diminishing returns up the graph.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Section 3: Leaderboard ─────────────────────────────────────────────── */

function LeaderboardSection() {
  const podium = DEMO_LEADERBOARD.slice(0, 3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <PageHeader
        title="Royalty Leaderboard"
        subtitle="Most-depended-on skills. the lodash of the agent economy"
      />

      {/* Podium: top 3 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {podium.map((entry) => (
          <Card key={entry.slug}>
            <div style={{ padding: "20px 20px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{
                  fontSize: 40, fontWeight: 900, fontVariantNumeric: "tabular-nums",
                  color: entry.rank === 1 ? "rgba(255,215,0,0.35)" : entry.rank === 2 ? "rgba(192,192,192,0.35)" : "rgba(205,127,50,0.35)",
                  lineHeight: 1, letterSpacing: "-0.03em",
                }}>
                  #{entry.rank}
                </div>
                <Spark data={entry.sparkData} width={60} height={24} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 400, color: T.text90, marginBottom: 4, lineHeight: 1.3 }}>{entry.name}</div>
              <div style={{ fontSize: 11, color: T.text30, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 12 }}>{entry.category}</div>
              <div style={{ fontSize: 26, fontWeight: 400, color: T.mint, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", lineHeight: 1 }}>
                {fmtUsdc(entry.totalRoyalties, 2)}
              </div>
              <div style={{ fontSize: 11, color: T.text25, marginTop: 3 }}>total royalties</div>
              <div style={{ marginTop: 10, fontSize: 12, color: T.text50 }}>
                <span style={{ color: T.text90, fontWeight: 400 }}>{entry.dependents}</span> dependents
              </div>
              <div style={{ marginTop: 10, height: 1, background: "linear-gradient(90deg, rgba(52,211,153,0.22) 0%, transparent 80%)" }} />
            </div>
          </Card>
        ))}
      </div>

      {/* Full leaderboard table */}
      <Card>
        <CardHead title="Full Rankings" />
        <div style={{ overflowX: "auto" as const }}>
          <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {["Rank", "Skill Name", "Category", "Dependents", "Total Royalties", "Avg / Day", "30d Trend"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left" as const, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: T.text20, fontWeight: 400 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEMO_LEADERBOARD.map((entry) => (
                <tr key={entry.slug} style={{ borderBottom: `1px solid ${T.border}` }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = T.white3; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      fontSize: 18, fontWeight: 900, fontVariantNumeric: "tabular-nums",
                      letterSpacing: "-0.03em",
                      color: entry.rank <= 3
                        ? (entry.rank === 1 ? "rgba(255,215,0,0.60)" : entry.rank === 2 ? "rgba(192,192,192,0.60)" : "rgba(205,127,50,0.60)")
                        : T.text20,
                    }}>
                      {entry.rank}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, color: T.text90, fontWeight: 400 }}>{entry.name}</span>
                      {entry.rank <= 3 && (
                        <span style={{ fontSize: 9, fontWeight: 400, letterSpacing: "0.08em", padding: "1px 5px", borderRadius: 3, background: "rgba(52,211,153,0.08)", color: T.mint, textTransform: "uppercase" as const }}>
                          verified
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 11, color: T.text30, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{entry.category}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: T.text90, fontVariantNumeric: "tabular-nums" }}>
                    {entry.dependents}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: T.mint, fontWeight: 400, fontVariantNumeric: "tabular-nums" }}>
                    {fmtUsdc(entry.totalRoyalties, 2)}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: T.text50, fontVariantNumeric: "tabular-nums" }}>
                    {fmtUsdc(entry.avgPerDay, 4)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Spark data={entry.sparkData} width={64} height={20} />
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

/* ── Section 4: How It Works ────────────────────────────────────────────── */

function HowItWorksSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const STEPS = [
    {
      num: 1,
      icon: "git-branch",
      title: "Declare Dependencies",
      body: "Your skill uses PDF extraction? Declare pdf-extractor as a dependency. Set a royalty rate between 1-20%. This is stored permanently on-chain as part of your skill manifest.",
    },
    {
      num: 2,
      icon: "zap",
      title: "Agent Invokes Your Skill",
      body: "An agent pays $0.10 for your report-generator. Normal fee splitting happens immediately: creator, validators, stakers, treasury, insurance, and burn shares are all calculated.",
    },
    {
      num: 3,
      icon: "layers",
      title: "Royalties Cascade Upstream",
      body: "5% of your 85% creator share flows automatically to pdf-extractor's creator. This cascade continues up the dependency graph, diminishing 50% per hop. Entirely automatic. Entirely on-chain.",
    },
    {
      num: 4,
      icon: "dollar",
      title: "Creators Claim Anytime",
      body: "Accumulated royalties sit in your on-chain vault. Claim whenever gas is favorable. Royalties never expire. Your vault balance compounds with every downstream invocation.",
    },
  ];

  const FAQS = [
    {
      q: "How is the royalty rate enforced?",
      a: "Royalty rates are encoded in the skill's on-chain manifest at registration time. The protocol enforcer contract reads these rates during fee splitting and routes funds accordingly. no intermediary, no trust required.",
    },
    {
      q: "Can I change my royalty rate after registering?",
      a: "Rates are immutable once set to protect downstream dependents from unexpected cost increases. You can register a new dependency relationship with a different rate, but existing relationships are locked in perpetuity.",
    },
    {
      q: "What happens to royalties at depth 3 and beyond?",
      a: "Each hop in the dependency graph applies a 50% multiplier to the royalty rate, creating a natural geometric decay. A depth-3 royalty pays 12.5% of the depth-1 rate, ensuring root dependencies still earn meaningfully without monopolizing fees.",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <PageHeader
        title="How Royalties Work"
        subtitle="The on-chain composable revenue system"
      />

      {/* 4-step explainer */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {STEPS.map((step) => (
          <Card key={step.num}>
            <div style={{ padding: "22px 22px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ flexShrink: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.14)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ color: T.mint }}><SIcon name={step.icon} size={18} /></span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: T.mint, letterSpacing: "0.1em" }}>STEP {step.num}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 400, color: T.text90, marginBottom: 8 }}>{step.title}</div>
                  <div style={{ fontSize: 13, color: T.text50, lineHeight: 1.7 }}>{step.body}</div>
                </div>
              </div>
              <div style={{ marginTop: 16, height: 1, background: "linear-gradient(90deg, rgba(52,211,153,0.18) 0%, transparent 80%)" }} />
            </div>
          </Card>
        ))}
      </div>

      {/* Math example card */}
      <Card>
        <CardHead title="Math Example. $0.10 Invocation with 1 Upstream Dependency at 5%" />
        <div style={{ padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr) 2px repeat(3, 1fr)", gap: 0 }}>
            {[
              { label: "Total Paid", amount: "$0.1000", note: "by calling agent", highlight: false },
              { label: "Creator Share", amount: "$0.0850", note: "85% of invocation", highlight: false },
              { label: "Royalty Pool", amount: "$0.0030", note: "5% of creator share", highlight: true },
            ].map((item) => (
              <div key={item.label} style={{ padding: "16px 20px", borderRight: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" as const, fontWeight: 400, color: T.text20, marginBottom: 8 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 400, fontVariantNumeric: "tabular-nums", color: item.highlight ? T.mint : T.text90, letterSpacing: "-0.02em" }}>
                  {item.amount}
                </div>
                <div style={{ fontSize: 11, color: T.text25, marginTop: 4 }}>{item.note}</div>
              </div>
            ))}
            <div style={{ background: T.border }} />
            {[
              { label: "Your Net", amount: "$0.0570", note: "after royalty payout", highlight: false },
              { label: "Upstream Creator", amount: "$0.0030", note: "pdf-extractor creator", highlight: true },
              { label: "Protocol Split", amount: "$0.0400", note: "validators, stakers, etc.", highlight: false },
            ].map((item) => (
              <div key={item.label} style={{ padding: "16px 20px", borderLeft: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" as const, fontWeight: 400, color: T.text20, marginBottom: 8 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 400, fontVariantNumeric: "tabular-nums", color: item.highlight ? T.mint : T.text90, letterSpacing: "-0.02em" }}>
                  {item.amount}
                </div>
                <div style={{ fontSize: 11, color: T.text25, marginTop: 4 }}>{item.note}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* FAQ accordion */}
      <Card>
        <CardHead title="Frequently Asked Questions" />
        <div>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 20px", background: "transparent", border: "none",
                  cursor: "pointer", textAlign: "left" as const,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 400, color: T.text90 }}>{faq.q}</span>
                <span style={{ color: T.text30, flexShrink: 0, transition: "transform 0.2s", transform: openFaq === i ? "rotate(90deg)" : "none" }}>
                  <SIcon name="chevron-right" size={16} />
                </span>
              </button>
              {openFaq === i && (
                <div style={{ padding: "0 20px 16px", fontSize: 13, color: T.text50, lineHeight: 1.7 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* CTA */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "24px 28px",
        background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.12)",
        borderRadius: 8,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 400, color: T.text90, marginBottom: 4 }}>Ready to earn passive royalties?</div>
          <div style={{ fontSize: 13, color: T.text30 }}>Register your first dependency and start accumulating royalties from every downstream invocation.</div>
        </div>
        <button style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "12px 24px", borderRadius: 4, flexShrink: 0,
          background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.30)",
          color: T.mint, fontSize: 14, fontWeight: 400, cursor: "pointer",
          letterSpacing: "0.01em",
        }}>
          Register your first dependency
          <SIcon name="arrow-right" size={15} />
        </button>
      </div>
    </div>
  );
}

/* ── Main Royalties page ─────────────────────────────────────────────────── */

export default function Royalties() {
  const [tab, setTab] = useState<RoyaltiesTab>("earnings");

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0B", color: T.text90, fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />

      {/* Main content */}
      <div style={{ maxWidth: 1520, margin: "0 auto", padding: "88px 48px 64px" }}>
        {/* Tab navigation */}
        <TabNav active={tab} setActive={setTab} />

        {/* Section content */}
        {tab === "earnings" && <EarningsSection />}
        {tab === "dependencies" && <DependenciesSection />}
        {tab === "leaderboard" && <LeaderboardSection />}
        {tab === "how-it-works" && <HowItWorksSection />}
      </div>
      <MobileBottomNav />
    </div>
  );
}
