/**
 * Aegis Dashboard. Icon System
 *
 * SVG icon paths, brand icon resolver, category icons, and Spark sparkline.
 */

/* ── SVG Icon Paths ────────────────────────────────────────────────────── */

export const ICON_PATHS: Record<string, string> = {
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
  clock: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2",
  target: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 18a6 6 0 100-12 6 6 0 000 12zM12 14a2 2 0 100-4 2 2 0 000 4z",
  "git-branch": "M6 3v12M18 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM18 9a9 9 0 01-9 9",
  database: "M12 2C6.48 2 2 4.02 2 6.5S6.48 11 12 11s10-2.02 10-4.5S17.52 2 12 2zM2 6.5V12c0 2.48 4.48 4.5 10 4.5s10-2.02 10-4.5V6.5M2 12v5.5C2 19.98 6.48 22 12 22s10-2.02 10-4.5V12",
  flame: "M12 22c4.97 0 9-3.58 9-8 0-4-4-6-4-6s-1.5 2-3 2-2.5-2-2.5-2S9 10 9 14c0 4.42 1.34 8 3 8zM12 22c-1.66 0-3-3.58-3-8 0-1 .5-2.5.5-2.5S11 13 12 13s1.5-1.5 1.5-1.5.5 1.5.5 2.5c0 4.42-1.34 8-3 8z",
  "trending-up": "M23 6l-9.5 9.5-5-5L1 18",
  "alert-triangle": "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  hexagon: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
  wind: "M9.59 4.59A2 2 0 1111 8H2M12.59 19.41A2 2 0 1014 16H2M17.73 7.73A2.5 2.5 0 1119.5 12H2",
  "book-open": "M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z",
  server: "M2 7a2 2 0 012-2h16a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2V7zM2 17a2 2 0 012-2h16a2 2 0 012 2v.5a2 2 0 01-2 2H4a2 2 0 01-2-2V17zM6 8h.01M6 18h.01",
  key: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
};

/* ── SIcon ─────────────────────────────────────────────────────────────── */

export function SIcon({ name, size = 16, className = "" }: { name: string; size?: number; className?: string }) {
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

/* ── Brand icon resolver ───────────────────────────────────────────────── */

export const BRAND_MAP: Record<string, { icon: string; color: string }> = {
  openai:     { icon: "/assets/icons/openai.svg",     color: "rgba(255,255,255,0.80)" },
  claude:     { icon: "/assets/icons/claude.svg",      color: "rgba(217,119,87,0.70)" },
  anthropic:  { icon: "/assets/icons/anthropic.svg",   color: "rgba(217,119,87,0.70)" },
  gemini:     { icon: "/assets/icons/google.svg",      color: "rgba(66,133,244,0.60)" },
  google:     { icon: "/assets/icons/google.svg",      color: "rgba(66,133,244,0.60)" },
  deepmind:   { icon: "/assets/icons/deepmind.svg",   color: "rgba(66,133,244,0.60)" },
  mistral:    { icon: "/assets/icons/mistral.svg",     color: "rgba(255,128,0,0.60)" },
  meta:       { icon: "/assets/icons/meta.svg",        color: "rgba(0,136,255,0.55)" },
  llama:      { icon: "/assets/icons/meta.svg",        color: "rgba(0,136,255,0.55)" },
  nvidia:     { icon: "/assets/icons/nvidia.svg",      color: "rgba(118,185,0,0.60)" },
  nemo:       { icon: "/assets/icons/nvidia.svg",      color: "rgba(118,185,0,0.60)" },
  solana:     { icon: "/assets/icons/solana.svg",      color: "rgba(153,69,255,0.60)" },
  jupiter:    { icon: "/assets/icons/jupiter.svg",     color: "rgba(123,97,255,0.60)" },
  cursor:     { icon: "/assets/icons/cursor.svg",      color: "rgba(255,255,255,0.50)" },
  helius:     { icon: "/assets/icons/helius.svg",      color: "rgba(232,98,44,0.60)" },
  jito:       { icon: "/assets/icons/jito.svg",        color: "rgba(0,191,165,0.55)" },
  raydium:    { icon: "/assets/icons/raydium.svg",     color: "rgba(97,122,255,0.55)" },
  pyth:       { icon: "/assets/icons/pyth.svg",        color: "rgba(230,218,254,0.50)" },
  orca:       { icon: "/assets/icons/orca.svg",        color: "rgba(255,209,102,0.55)" },
  deepseek:   { icon: "/assets/icons/deepseek.svg",   color: "rgba(0,102,255,0.55)" },
  perplexity: { icon: "/assets/icons/perplexity.svg",  color: "rgba(32,178,170,0.55)" },
  stripe:     { icon: "/assets/icons/stripe.svg",      color: "rgba(99,91,255,0.55)" },
  coinbase:   { icon: "/assets/icons/coinbase.svg",    color: "rgba(0,82,255,0.55)" },
  firecrawl:  { icon: "/assets/icons/openai.svg",      color: "rgba(255,107,53,0.50)" },
  semgrep:    { icon: "/assets/icons/deepseek.svg",    color: "rgba(0,180,100,0.50)" },
  whisper:    { icon: "/assets/icons/openai.svg",      color: "rgba(255,255,255,0.50)" },
  bags:       { icon: "/assets/icons/bags.svg",        color: "rgba(255,107,53,0.60)" },
};

function detectBrand(name: string): { icon: string; color: string } | null {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(BRAND_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

export function BrandIcon({ name, size = 16 }: { name: string; size?: number }) {
  const brand = detectBrand(name);
  if (!brand) {
    return (
      <img
        src="/assets/vectorwhite.svg"
        alt=""
        width={size}
        height={size}
        style={{ opacity: 0.25, flexShrink: 0 }}
        loading="lazy"
      />
    );
  }
  return (
    <img
      src={brand.icon}
      alt=""
      width={size}
      height={size}
      style={{ opacity: 0.70, flexShrink: 0 }}
      loading="lazy"
    />
  );
}

/* ── Category icon (small, for tables) ─────────────────────────────────── */

const CATEGORY_ICONS: Record<string, string> = {
  "defi": "💰", "search": "🔍", "security": "🛡", "dev-tools": "⚙",
  "ai / ml": "🧠", "data": "📊", "infrastructure": "🏗", "communication": "💬",
  "other": "◆", "content": "✦", "analysis": "◇", "language": "📝",
};

export function CategoryDot({ category }: { category: string }) {
  const icon = CATEGORY_ICONS[category?.toLowerCase()] || "◆";
  return <span style={{ fontSize: 10, opacity: 0.5 }}>{icon}</span>;
}

/* ── Spark (smooth cubic bezier sparkline) ─────────────────────────────── */

export function Spark({ data, width = 64, height = 20, variant = "mint" }: { data: number[]; width?: number; height?: number; variant?: "mint" | "negative" }) {
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
  const uid = `sp-${variant}-${width}-${height}-${data.length}`;

  const isMint = variant === "mint";
  const strokeFrom = isMint ? "rgba(52,211,153,0.55)" : "rgba(234,142,68,0.50)";
  const strokeTo = isMint ? "rgba(16,185,129,0.40)" : "rgba(220,80,60,0.45)";
  const fillFrom = isMint ? "rgba(52,211,153,0.12)" : "rgba(234,142,68,0.08)";
  const fillTo = isMint ? "rgba(16,185,129,0)" : "rgba(220,80,60,0)";

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillFrom} />
          <stop offset="100%" stopColor={fillTo} />
        </linearGradient>
        <linearGradient id={`${uid}-stroke`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={strokeFrom} />
          <stop offset="100%" stopColor={strokeTo} />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${uid}-fill)`} />
      <path d={linePath} fill="none" stroke={`url(#${uid}-stroke)`} strokeWidth="1.2" />
    </svg>
  );
}
