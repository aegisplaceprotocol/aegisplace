import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { BrandIcon, cleanOperatorName } from "./Dashboard/brand-icons";
import { trpc } from "@/lib/trpc";

/* ─────────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS — matches SkillsMarketplace exactly
───────────────────────────────────────────────────────────────────────────── */
const T = {
  bg: "#0A0A0B",
  card: "rgba(255,255,255,0.015)",
  cardHover: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.05)",
  borderSubtle: "rgba(255,255,255,0.03)",
  borderHover: "rgba(255,255,255,0.08)",
  text95: "rgba(255,255,255,0.92)",
  text80: "rgba(255,255,255,0.72)",
  text50: "rgba(255,255,255,0.44)",
  text30: "rgba(255,255,255,0.28)",
  text20: "rgba(255,255,255,0.18)",
  text12: "rgba(255,255,255,0.10)",
  accent: "rgba(52,211,153,0.60)",
  accentSubtle: "rgba(52,211,153,0.12)",
  accentBorder: "rgba(52,211,153,0.25)",
  white2: "rgba(255,255,255,0.02)",
  white4: "rgba(255,255,255,0.04)",
  white6: "rgba(255,255,255,0.06)",
};

const FONT_SANS = "'DM Sans', 'Helvetica Neue', sans-serif";
const FONT_MONO = "'DM Mono', 'SF Mono', 'Fira Code', monospace";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */
interface DbOperator {
  id: number | string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  category: string;
  pricePerCall: unknown;
  creatorWallet: string;
  qualityScore: number;
  totalInvocations: number;
  successfulInvocations: number;
  totalEarned: unknown;
  avgResponseMs: number;
  isActive: boolean;
  isVerified: boolean;
  tags: string[] | null;
  createdAt: string | Date;
}

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
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

const CATEGORIES = [
  "All", "Development", "Security", "Data", "AI / ML",
  "DeFi", "Infrastructure", "Other",
];

function shortWallet(w: string): string {
  if (!w) return "";
  return `${w.slice(0, 4)}…${w.slice(-4)}`;
}

function parseDecimal(val: unknown): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "object" && val !== null && "$numberDecimal" in val) {
    return parseFloat(String((val as { $numberDecimal?: unknown }).$numberDecimal)) || 0;
  }
  return parseFloat(String(val)) || 0;
}

function priceDisplay(val: unknown): string {
  const n = parseDecimal(val);
  if (!n || n <= 0) return "Free";
  if (n < 0.001) return `$${n.toFixed(6)}`;
  if (n < 0.01)  return `$${n.toFixed(5)}`;
  if (n < 0.1)   return `$${n.toFixed(4)}`;
  return `$${n.toFixed(3)}`;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

/* ─────────────────────────────────────────────────────────────────────────────
   ICONS
───────────────────────────────────────────────────────────────────────────── */
function IconSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="6.5" cy="6.5" r="4.5" stroke={T.text50} strokeWidth="1.2" />
      <path d="M10.5 10.5L13 13" stroke={T.text50} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function IconBars() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M1 9V5M3.5 9V3M6 9V6M8.5 9V1" stroke={T.text20} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke={T.text50} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SKELETON CARD
───────────────────────────────────────────────────────────────────────────── */
function SkeletonCard({ index = 0 }: { index?: number }) {
  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 8,
      minHeight: 200,
      position: "relative",
      overflow: "hidden",
    }}>
      <motion.div
        animate={{ x: ["-100%", "200%"] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: "linear", delay: index * 0.07 }}
        style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.02), transparent)",
        }}
      />
      <div style={{ padding: 20 }}>
        <div style={{ width: "35%", height: 8, background: T.white4, borderRadius: 4, marginBottom: 14 }} />
        <div style={{ width: "75%", height: 11, background: T.white6, borderRadius: 4, marginBottom: 8 }} />
        <div style={{ width: "55%", height: 9, background: T.white4, borderRadius: 4, marginBottom: 16 }} />
        <div style={{ width: "100%", height: 7, background: T.white2, borderRadius: 3, marginBottom: 6 }} />
        <div style={{ width: "80%", height: 7, background: T.white2, borderRadius: 3, marginBottom: 6 }} />
        <div style={{ width: "60%", height: 7, background: T.white2, borderRadius: 3 }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   OPERATOR CARD
───────────────────────────────────────────────────────────────────────────── */
function OperatorCard({ op, index = 0 }: { op: DbOperator; index?: number }) {
  const [hovered, setHovered] = useState(false);
  const displayCategory = CATEGORY_MAP[op.category] || op.category;
  const pricePerCall = parseDecimal(op.pricePerCall);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.025, 0.4), ease: "easeOut" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? T.cardHover : T.card,
        border: `1px solid ${hovered ? T.borderHover : T.border}`,
        borderRadius: 8,
        padding: "20px",
        cursor: "pointer",
        transition: "background 0.2s ease, border-color 0.2s ease",
        display: "flex",
        flexDirection: "column",
        minHeight: 200,
        boxShadow: hovered ? "inset 0 0 30px rgba(255,255,255,0.01)" : "none",
      }}
    >
      {/* Top row: category */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <span style={{
          fontSize: 10, fontWeight: 500, color: T.text20,
          letterSpacing: "0.08em", textTransform: "uppercase", flex: 1,
          fontFamily: FONT_SANS, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {displayCategory}
        </span>
        {op.isVerified && (
          <img src="/icon.png" alt="Aegis Official" title="Aegis Official" style={{ width: 14, height: 14, objectFit: "contain", flexShrink: 0 }} />
        )}
      </div>

      {/* Name */}
      <div style={{
        fontSize: 14.5, fontWeight: 500, color: T.text95,
        letterSpacing: "-0.01em", marginBottom: 4, fontFamily: FONT_SANS,
        lineHeight: 1.35, display: "flex", alignItems: "center", gap: 6,
      }}>
        <BrandIcon name={op.name} size={14} />
        {cleanOperatorName(op.name)}
      </div>

      {/* Creator wallet */}
      {op.creatorWallet && (
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10, color: T.text20,
          letterSpacing: "0.02em", marginBottom: 10,
        }}>
          {shortWallet(op.creatorWallet)}
        </div>
      )}

      {/* Description */}
      <div style={{
        fontSize: 12.5, color: T.text50, lineHeight: 1.6,
        display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
        overflow: "hidden", flex: 1, marginBottom: 12, fontFamily: FONT_SANS,
      } as React.CSSProperties}>
        {op.tagline || op.description || "No description provided."}
      </div>

      {/* Tags — dot-separated */}
      {(op.tags || []).length > 0 && (
        <div style={{ marginBottom: 14, minHeight: 16 }}>
          {(op.tags || []).slice(0, 3).map((tag, i) => (
            <span key={tag} style={{ fontFamily: FONT_SANS }}>
              {i > 0 && <span style={{ fontSize: 9, color: T.text12, margin: "0 5px" }}>·</span>}
              <span style={{ fontSize: 10, color: T.text30, letterSpacing: "0.01em" }}>{tag}</span>
            </span>
          ))}
          {(op.tags || []).length > 3 && (
            <span style={{ fontSize: 10, color: T.text20, marginLeft: 6, fontFamily: FONT_SANS }}>
              +{(op.tags || []).length - 3}
            </span>
          )}
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: T.borderSubtle, marginBottom: 14 }} />

      {/* Bottom: price + invocations */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <span style={{
            fontSize: 15, fontWeight: 500, color: T.text80,
            letterSpacing: "-0.02em", fontFamily: FONT_MONO,
            fontVariantNumeric: "tabular-nums",
          }}>
            {priceDisplay(pricePerCall)}
          </span>
          {pricePerCall > 0 && (
            <span style={{ fontSize: 10, fontWeight: 400, color: T.text30, fontFamily: FONT_SANS }}>/call</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <IconBars />
          <span style={{ fontSize: 10.5, color: T.text30, fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" }}>
            {formatNum(op.totalInvocations)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION HEADER
───────────────────────────────────────────────────────────────────────────── */
function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: 10, fontWeight: 600, color: T.text20,
        letterSpacing: "0.09em", textTransform: "uppercase",
        fontFamily: FONT_SANS, marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        height: 1,
        background: "linear-gradient(90deg, rgba(52,211,153,0.35) 0%, rgba(52,211,153,0.08) 30%, transparent 70%)",
      }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STAT BLOCK
───────────────────────────────────────────────────────────────────────────── */
function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{
        fontSize: 28, fontWeight: 300, color: T.text95,
        letterSpacing: "-0.03em", lineHeight: 1,
        fontVariantNumeric: "tabular-nums", fontFamily: FONT_MONO,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 10, fontWeight: 500, color: T.text30,
        letterSpacing: "0.09em", textTransform: "uppercase",
        fontFamily: FONT_SANS,
      }}>
        {label}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────────── */
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

  const topPerformers = useMemo(() =>
    [...operators].sort((a, b) => b.totalInvocations - a.totalInvocations).slice(0, 5),
    [operators]
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      fontFamily: FONT_SANS,
      color: T.text95,
      overflowX: "hidden",
    }}>
      {/* Font import + grid styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=DM+Mono:wght@300;400;500&display=swap');

        .mkt-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        @media (max-width: 1200px) {
          .mkt-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 700px) {
          .mkt-grid { grid-template-columns: 1fr; }
          .mkt-hero-stats { grid-template-columns: repeat(2, 1fr) !important; }
        }

        input::placeholder { color: rgba(255,255,255,0.20); }
        ::-webkit-scrollbar { width: 0; height: 0; }
        * { -webkit-font-smoothing: antialiased; box-sizing: border-box; }

        .mkt-cat-btn {
          background: none;
          border: none;
          padding: 10px 16px;
          cursor: pointer;
          white-space: nowrap;
          transition: color 0.2s ease;
          font-family: 'DM Sans', sans-serif;
          font-size: 12.5px;
          letter-spacing: 0.01em;
          display: flex;
          align-items: baseline;
          gap: 5px;
          margin-bottom: -1px;
        }
        .mkt-cat-btn:hover span.cat-label { color: rgba(255,255,255,0.72) !important; }

        .mkt-leaderboard-row {
          transition: background 0.15s ease;
        }
        .mkt-leaderboard-row:hover {
          background: rgba(255,255,255,0.025) !important;
        }
      `}</style>

      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div style={{
        width: "100%",
        paddingTop: 64,
        position: "relative",
        overflow: "hidden",
        borderBottom: `1px solid ${T.borderSubtle}`,
      }}>
        {/* Background video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: "absolute",
            top: 0, left: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            opacity: 0.18,
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          <source src="/videos/AegisSprite.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(180deg, rgba(10,10,11,0.3) 0%, rgba(10,10,11,0.7) 70%, ${T.bg} 100%)`,
          zIndex: 1, pointerEvents: "none",
        }} />
        {/* Subtle emerald accents */}
        <div style={{
          position: "absolute", inset: 0,
          background: `
            radial-gradient(ellipse 60% 40% at 80% 20%, rgba(52,211,153,0.04) 0%, transparent 60%),
            radial-gradient(ellipse 40% 60% at 10% 80%, rgba(52,211,153,0.025) 0%, transparent 50%)
          `,
          zIndex: 2, pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 1520, margin: "0 auto", padding: "52px 48px 36px", position: "relative", zIndex: 3 }}>
          {/* Icon + heading */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}
          >
            <img src="/icon.png" alt="" style={{ width: 36, height: 36, objectFit: "contain" }} />
            <h1 style={{
              fontSize: "clamp(30px, 4.5vw, 46px)",
              fontWeight: 300,
              color: T.text95,
              letterSpacing: "-0.03em",
              margin: 0,
              lineHeight: 1.1,
              fontFamily: FONT_SANS,
            }}>
              Operator Marketplace
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{
              fontSize: 16, color: T.text50, margin: "0 0 40px",
              lineHeight: 1.6, maxWidth: 520, fontFamily: FONT_SANS, fontWeight: 400,
            }}
          >
            Specialized AI operators with auditable on-chain execution. Every operator earns its creator 85% of every invocation fee.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{ position: "relative", maxWidth: 560 }}
          >
            <div style={{
              position: "absolute", left: 16, top: "50%",
              transform: "translateY(-50%)", pointerEvents: "none",
            }}>
              <IconSearch />
            </div>
            <input
              type="text"
              placeholder="Search operators by name, description, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", height: 48,
                background: T.white4,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                padding: "0 44px 0 42px",
                fontSize: 14, color: T.text95,
                outline: "none", letterSpacing: "0.01em",
                transition: "border-color 0.2s ease, background 0.2s ease",
                fontFamily: FONT_SANS,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = T.accentBorder;
                e.target.style.background = T.white6;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = T.border;
                e.target.style.background = T.white4;
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  position: "absolute", right: 14, top: "50%",
                  transform: "translateY(-50%)", background: "none",
                  border: "none", color: T.text30, cursor: "pointer",
                  fontSize: 18, lineHeight: 1, padding: 2,
                }}
              >
                ×
              </button>
            )}
          </motion.div>

          {/* Hero stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mkt-hero-stats"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, auto)",
              gap: "32px 48px",
              marginTop: 48,
              justifyContent: "start",
            }}
          >
            <StatBlock
              label="Active Operators"
              value={String(stats?.totalOperators || operators.length || "—")}
            />
            <StatBlock
              label="Total Invocations"
              value={formatNum(stats?.totalInvocations || 0)}
            />
            <StatBlock
              label="Revenue Earned"
              value={`$${parseFloat(stats?.totalEarnings || "0").toFixed(0)}`}
            />
            <StatBlock
              label="Categories"
              value={String(CATEGORIES.length - 1)}
            />
          </motion.div>
        </div>
      </div>

      {/* ── CATEGORY NAV ─────────────────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 56, zIndex: 40,
        background: T.bg,
        borderBottom: `1px solid ${T.borderSubtle}`,
      }}>
        <div style={{
          maxWidth: 1520, margin: "0 auto", padding: "0 48px",
          display: "flex", gap: 0, overflowX: "auto",
        }}>
          {CATEGORIES.map((cat) => {
            const isActive = category === cat;
            const count = cat === "All"
              ? (data?.operators || []).length
              : (data?.operators || []).filter(op => (CATEGORY_MAP[op.category] || op.category) === cat).length;
            return (
              <button
                key={cat}
                className="mkt-cat-btn"
                onClick={() => setCategory(cat)}
                style={{
                  borderBottom: isActive ? `2px solid #34D399` : "2px solid transparent",
                  color: isActive ? T.text95 : T.text30,
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                <span className="cat-label" style={{ color: "inherit", transition: "color 0.2s ease" }}>
                  {cat}
                </span>
                <span style={{
                  fontSize: 9, color: isActive ? T.text50 : T.text20,
                  fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums",
                  transition: "color 0.2s ease",
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SORT ROW ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1520, margin: "0 auto", padding: "20px 48px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 11, color: T.text30, fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" }}>
            {isLoading ? "—" : `${formatNum(operators.length)} operators`}
            {search && ` matching "${search}"`}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            style={{
              background: T.white4,
              border: `1px solid ${T.border}`,
              borderRadius: 7,
              padding: "7px 12px",
              fontSize: 12,
              color: T.text50,
              outline: "none",
              cursor: "pointer",
              fontFamily: FONT_SANS,
              appearance: "none",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = T.accentBorder; }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = T.border; }}
          >
            <option value="trust"       style={{ background: "#111" }}>Sort: Success Rate</option>
            <option value="invocations" style={{ background: "#111" }}>Sort: Invocations</option>
            <option value="earnings"    style={{ background: "#111" }}>Sort: Earnings</option>
            <option value="newest"      style={{ background: "#111" }}>Sort: Newest</option>
          </select>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1520, margin: "0 auto", padding: "32px 48px 80px" }}>

        {/* Loading */}
        {isLoading && (
          <div className="mkt-grid">
            {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} index={i} />)}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            borderRadius: 8, padding: "24px",
            border: `1px solid rgba(220,100,60,0.15)`,
            background: "rgba(220,100,60,0.04)",
            textAlign: "center",
          }}>
            <p style={{ color: "rgba(220,100,60,0.70)", fontSize: 13, fontWeight: 500, margin: 0 }}>
              Failed to load operators from the database.
            </p>
            <p style={{ color: T.text30, fontSize: 11, marginTop: 6, marginBottom: 0 }}>{error.message}</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* Leaderboard */}
            {topPerformers.length > 0 && !search && category === "All" && (
              <div style={{ marginBottom: 56 }}>
                <SectionHeader label="Top Performers" />
                <div style={{
                  borderRadius: 8, overflow: "hidden",
                  border: `1px solid ${T.border}`,
                }}>
                  {/* Table header */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "40px 1fr 100px 120px 110px",
                    gap: 16,
                    padding: "10px 20px",
                    borderBottom: `1px solid ${T.border}`,
                    background: T.white2,
                  }}>
                    {["#", "Operator", "Price", "Invocations", "Earned"].map((h) => (
                      <span key={h} style={{
                        fontSize: 9, fontWeight: 600, letterSpacing: "0.12em",
                        color: T.text20, textTransform: "uppercase", fontFamily: FONT_SANS,
                        textAlign: h === "#" || h === "Operator" ? "left" : "right",
                      }}>
                        {h}
                      </span>
                    ))}
                  </div>

                  {topPerformers.map((op, i) => (
                    <Link
                      key={op.id}
                      href={`/marketplace/${op.slug}`}
                      className="mkt-leaderboard-row"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "40px 1fr 100px 120px 110px",
                        gap: 16,
                        padding: "14px 20px",
                        alignItems: "center",
                        textDecoration: "none",
                        color: "inherit",
                        borderBottom: i < topPerformers.length - 1 ? `1px solid ${T.borderSubtle}` : "none",
                        background: i % 2 === 0 ? "transparent" : T.white2,
                      }}
                    >
                      <span style={{
                        fontSize: 12, fontFamily: FONT_MONO,
                        fontVariantNumeric: "tabular-nums",
                        color: i < 3 ? T.text80 : T.text30,
                        fontWeight: i < 3 ? 600 : 400,
                      }}>
                        {i + 1}
                      </span>
                      <span style={{
                        fontSize: 13, color: T.text80, fontWeight: 500,
                        fontFamily: FONT_SANS, overflow: "hidden",
                        textOverflow: "ellipsis", whiteSpace: "nowrap",
                        display: "flex", alignItems: "center", gap: 8,
                      }}>
                        <BrandIcon name={op.name} size={15} />
                        {cleanOperatorName(op.name)}
                      </span>
                      <span style={{
                        fontSize: 11, color: T.text50, fontFamily: FONT_MONO,
                        fontVariantNumeric: "tabular-nums", textAlign: "right",
                      }}>
                        {priceDisplay(op.pricePerCall)}
                      </span>
                      <span style={{
                        fontSize: 11, color: T.text50, fontFamily: FONT_MONO,
                        fontVariantNumeric: "tabular-nums", textAlign: "right",
                      }}>
                        {op.totalInvocations.toLocaleString()}
                      </span>
                      <span style={{
                        fontSize: 11, color: T.text50, fontFamily: FONT_MONO,
                        fontVariantNumeric: "tabular-nums", textAlign: "right",
                      }}>
                        ${parseDecimal(op.totalEarned).toFixed(2)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* All Operators Grid */}
            <div style={{ marginBottom: 56 }}>
              <SectionHeader
                label={category === "All" ? "All Operators" : category}
              />

              {operators.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: "80px 0",
                  color: T.text30, fontSize: 13, fontFamily: FONT_SANS,
                }}>
                  {search ? `No operators found for "${search}"` : "No operators match these filters."}
                </div>
              ) : (
                <div className="mkt-grid">
                  <AnimatePresence>
                    {operators.map((op, i) => (
                      <Link
                        key={op.id}
                        href={`/marketplace/${op.slug}`}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <OperatorCard op={op} index={i} />
                      </Link>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── FOOTER CTA ───────────────────────────────────────────────────── */}
      <div style={{
        borderTop: `1px solid ${T.borderSubtle}`,
        padding: "80px 48px",
        textAlign: "center",
        maxWidth: 1520,
        margin: "0 auto",
      }}>
        <h2 style={{
          fontSize: "clamp(20px, 3vw, 32px)",
          fontWeight: 300,
          color: T.text95,
          letterSpacing: "-0.025em",
          marginBottom: 12,
          fontFamily: FONT_SANS,
        }}>
          Ship your first operator today.
        </h2>
        <p style={{
          color: T.text50, marginBottom: 36, maxWidth: 400,
          marginLeft: "auto", marginRight: "auto",
          lineHeight: 1.6, fontSize: 14, fontFamily: FONT_SANS,
        }}>
          Each operator is a specialized AI skill with bonded quality and staked validators.
          Upload yours and earn <span style={{ color: T.text80, fontWeight: 500 }}>85%</span> of every invocation fee.
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <a
            href="/submit"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 13, fontWeight: 500, padding: "10px 24px",
              borderRadius: 8, textDecoration: "none",
              background: "transparent",
              border: `1px solid ${T.border}`,
              color: T.text80,
              fontFamily: FONT_SANS,
              letterSpacing: "0.02em",
              transition: "border-color 0.2s ease, color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = T.accentBorder;
              el.style.color = T.text95;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = T.border;
              el.style.color = T.text80;
            }}
          >
            Upload Operator <IconArrow />
          </a>
          <a
            href="/playground"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 13, fontWeight: 500, padding: "10px 24px",
              borderRadius: 8, textDecoration: "none",
              background: "transparent",
              border: `1px solid ${T.borderSubtle}`,
              color: T.text30,
              fontFamily: FONT_SANS,
              letterSpacing: "0.02em",
              transition: "border-color 0.2s ease, color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = T.border;
              el.style.color = T.text50;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = T.borderSubtle;
              el.style.color = T.text30;
            }}
          >
            Try Playground
          </a>
        </div>
      </div>

      <MobileBottomNav />
      <div style={{ height: 56 }} className="lg-hidden" />
    </div>
  );
}
