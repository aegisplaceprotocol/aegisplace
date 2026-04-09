import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import SkillUploadModal from "@/components/SkillUploadModal";
import { apiUrl } from "@/lib/api";

/* ─────────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS
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
interface Operator {
  _id?: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  trustScore: number;
  price: any;
  invocations: number;
  creatorWallet: string;
  health: string;
  tags: string[];
  isVerified?: boolean;
  createdAt?: string;
  serverUrl?: string;
}
interface Category {
  name: string;
  count: number;
}
interface Stats {
  totalOperators?: number;
  totalInvocations?: number;
  totalCreators?: number;
  categories?: number;
  [key: string]: any;
}

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
function parseDecimal(val: any): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (val.$numberDecimal) return parseFloat(val.$numberDecimal);
  return parseFloat(String(val)) || 0;
}
function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}
function catLabel(cat: string): string {
  return cat
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
function priceDisplay(price: number): string {
  if (price <= 0) return "Free";
  if (price < 0.001) return `$${price.toFixed(6)}`;
  if (price < 0.01) return `$${price.toFixed(5)}`;
  if (price < 0.1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(3)}`;
}
function matchesPriceFilter(price: number, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "free") return price <= 0;
  if (filter === "lt001") return price > 0 && price < 0.01;
  if (filter === "001to005") return price >= 0.01 && price <= 0.05;
  if (filter === "gt005") return price > 0.05;
  return true;
}
function shortWallet(w: string): string {
  if (!w) return "";
  return `${w.slice(0, 4)}…${w.slice(-4)}`;
}

function isTrendingEligible(op: Operator): boolean {
  return Number(op.invocations ?? 0) > 0 || Number(op.trustScore ?? 0) >= 90;
}

function isRecentEligible(op: Operator): boolean {
  if (!op.createdAt) return false;
  const createdAt = new Date(op.createdAt).getTime();
  if (Number.isNaN(createdAt)) return false;
  return Date.now() - createdAt <= 1000 * 60 * 60 * 24 * 30;
}

function normalizeOperator(op: any): Operator {
  return {
    ...op,
    description: op.description || op.tagline || "",
    price: op.price ?? op.pricePerCall ?? "0",
    invocations: Number(op.invocations ?? op.totalInvocations ?? 0),
    tags: Array.isArray(op.tags) ? op.tags : [],
    isVerified: Boolean(
      op.isVerified ?? op.onChain?.syncStatus === "confirmed",
    ),
    health: op.health || op.healthStatus || "healthy",
    createdAt: op.createdAt,
  };
}

async function fetchOperatorsPage(params: {
  pageSize: number;
  page?: number;
  sortBy?: string;
  category?: string;
  query?: string;
}) {
  const searchParams = new URLSearchParams({
    pageSize: String(params.pageSize),
    page: String(params.page || 1),
  });

  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.category) searchParams.set("category", params.category);
  if (params.query) searchParams.set("q", params.query);

  const response = await fetch(
    apiUrl(`/api/v1/operators?${searchParams.toString()}`),
  );
  const data = await response.json();
  return {
    operators: ((data?.operators || []) as any[]).map(normalizeOperator),
    total: Number(data?.total || 0),
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   ICONS
───────────────────────────────────────────────────────────────────────────── */
function IconSearch({ color = T.text30 }: { color?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 15 15"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <circle cx="6.5" cy="6.5" r="4.5" stroke={color} strokeWidth="1.2" />
      <path
        d="M10.5 10.5L13 13"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconBars() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path
        d="M1 9V5M3.5 9V3M6 9V6M8.5 9V1"
        stroke={T.text20}
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconFilter() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path
        d="M2 4h11M4 7.5h7M6 11h3"
        stroke={T.text50}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconArrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M2.5 6h7M6.5 3l3 3-3 3"
        stroke={T.text50}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconChevron({ dir = "down" }: { dir?: "down" | "up" }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      style={{
        transform: dir === "up" ? "rotate(180deg)" : undefined,
        transition: "transform 0.2s ease",
      }}
    >
      <path
        d="M2 4l3 3 3-3"
        stroke={T.text30}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   LIVE DOT — pulses to indicate real-time
───────────────────────────────────────────────────────────────────────────── */
function LiveDot() {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 8,
        height: 8,
      }}
    >
      <motion.span
        animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "rgba(52,211,153,0.4)",
        }}
      />
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "#34D399",
          flexShrink: 0,
        }}
      />
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   VERIFIED CHECK
───────────────────────────────────────────────────────────────────────────── */
function VerifiedMark() {
  return (
    <img
      src="/icon.png"
      alt="Aegis Official"
      title="Aegis Official Skill"
      style={{ width: 14, height: 14, objectFit: "contain", flexShrink: 0 }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────────────────────────────────────── */
function SkeletonCard({ index = 0 }: { index?: number }) {
  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        minHeight: 200,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <motion.div
        animate={{ x: ["-100%", "200%"] }}
        transition={{
          repeat: Infinity,
          duration: 1.6,
          ease: "linear",
          delay: index * 0.07,
        }}
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.02), transparent)",
        }}
      />
      <div style={{ padding: 20 }}>
        <div
          style={{
            width: "35%",
            height: 8,
            background: T.white4,
            borderRadius: 4,
            marginBottom: 14,
          }}
        />
        <div
          style={{
            width: "75%",
            height: 11,
            background: T.white6,
            borderRadius: 4,
            marginBottom: 8,
          }}
        />
        <div
          style={{
            width: "55%",
            height: 9,
            background: T.white4,
            borderRadius: 4,
            marginBottom: 16,
          }}
        />
        <div
          style={{
            width: "100%",
            height: 7,
            background: T.white2,
            borderRadius: 3,
            marginBottom: 6,
          }}
        />
        <div
          style={{
            width: "80%",
            height: 7,
            background: T.white2,
            borderRadius: 3,
            marginBottom: 6,
          }}
        />
        <div
          style={{
            width: "60%",
            height: 7,
            background: T.white2,
            borderRadius: 3,
          }}
        />
      </div>
    </div>
  );
}

function SkeletonBanner() {
  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        height: 100,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <motion.div
        animate={{ x: ["-100%", "200%"] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.02), transparent)",
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STAT BLOCK
───────────────────────────────────────────────────────────────────────────── */
function StatBlock({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {loading ? (
        <div
          style={{
            width: 64,
            height: 28,
            background: T.white4,
            borderRadius: 4,
          }}
        />
      ) : (
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
          style={{
            fontSize: 28,
            fontWeight: 300,
            color: T.text95,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            fontFamily: FONT_MONO,
          }}
        >
          {value}
        </motion.div>
      )}
      <div
        style={{
          fontSize: 10,
          fontWeight: 500,
          color: T.text30,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
          fontFamily: FONT_SANS,
        }}
      >
        {label}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   FEATURED BANNER — rotates through 3-4 featured skills every 5s
───────────────────────────────────────────────────────────────────────────── */
function FeaturedBanner({
  operators,
  loading,
}: {
  operators: Operator[];
  loading: boolean;
}) {
  const [index, setIndex] = useState(0);
  const items = operators.slice(0, 4);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(id);
  }, [items.length]);

  if (loading) return <SkeletonBanner />;
  if (!items.length) return null;

  const op = items[index];
  const price = parseDecimal(op.price);

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 10,
        overflow: "hidden",
        border: `1px solid ${T.accentBorder}`,
        background: `linear-gradient(135deg, rgba(52,211,153,0.04) 0%, rgba(255,255,255,0.01) 60%, transparent 100%)`,
      }}
    >
      {/* Subtle emerald glow top-left */}
      <div
        style={{
          position: "absolute",
          top: -60,
          left: -60,
          width: 200,
          height: 200,
          background:
            "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "22px 28px",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        {/* Left */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            minWidth: 0,
            flex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: T.text30,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontFamily: FONT_SANS,
              }}
            >
              Featured Skill
            </span>
            {op.isVerified && <VerifiedMark />}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  color: T.text95,
                  letterSpacing: "-0.025em",
                  marginBottom: 4,
                  fontFamily: FONT_SANS,
                }}
              >
                {op.name}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: T.text50,
                  lineHeight: 1.5,
                  maxWidth: 520,
                  fontFamily: FONT_SANS,
                }}
              >
                {op.description || "No description available."}
              </div>
            </motion.div>
          </AnimatePresence>
          {/* Category + tags */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: T.text30,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontFamily: FONT_SANS,
              }}
            >
              {catLabel(op.category)}
            </span>
            {op.tags?.slice(0, 3).map((t, i) => (
              <span
                key={i}
                style={{ fontSize: 10, color: T.text20, fontFamily: FONT_SANS }}
              >
                {i > 0 && (
                  <span style={{ marginRight: 6, color: T.text12 }}>·</span>
                )}
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 300,
              color: T.text95,
              letterSpacing: "-0.03em",
              fontVariantNumeric: "tabular-nums",
              fontFamily: FONT_MONO,
            }}
          >
            {priceDisplay(price)}
            {price > 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 400,
                  color: T.text30,
                  marginLeft: 4,
                  fontFamily: FONT_SANS,
                }}
              >
                /call
              </span>
            )}
          </div>
          <Link
            href={`/marketplace/${op.slug}`}
            style={{ textDecoration: "none" }}
          >
            <button
              style={{
                background: "transparent",
                border: `1px solid ${T.border}`,
                borderRadius: 7,
                padding: "8px 18px",
                color: T.text80,
                fontSize: 12,
                fontWeight: 500,
                fontFamily: FONT_SANS,
                letterSpacing: "0.02em",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "border-color 0.2s ease, color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = T.accentBorder;
                e.currentTarget.style.color = T.text95;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.color = T.text80;
              }}
            >
              View Skill <IconArrow />
            </button>
          </Link>
          {/* Dot indicators */}
          {items.length > 1 && (
            <div style={{ display: "flex", gap: 5 }}>
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  style={{
                    width: i === index ? 14 : 4,
                    height: 4,
                    borderRadius: 2,
                    background: i === index ? T.accent : T.text12,
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "width 0.3s ease, background 0.2s ease",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CATEGORY NAV BAR — horizontally scrollable, sticky
───────────────────────────────────────────────────────────────────────────── */
function CategoryNav({
  categories,
  active,
  onChange,
}: {
  categories: Category[];
  active: string;
  onChange: (c: string) => void;
}) {
  const allCount = categories.reduce((a, c) => a + c.count, 0);
  const items = [{ name: "All", count: allCount }, ...categories];

  return (
    <div
      style={
        {
          display: "flex",
          gap: 0,
          overflowX: "auto",
          scrollbarWidth: "none",
          borderBottom: `1px solid ${T.borderSubtle}`,
        } as any
      }
    >
      {items.map((cat) => {
        const isActive = cat.name === active;
        return (
          <button
            key={cat.name}
            onClick={() => onChange(cat.name)}
            style={{
              background: "none",
              border: "none",
              borderBottom: isActive
                ? `2px solid #34D399`
                : "2px solid transparent",
              marginBottom: -1,
              padding: "10px 16px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "baseline",
              gap: 5,
            }}
          >
            <span
              style={{
                fontSize: 12.5,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? T.text95 : T.text30,
                fontFamily: FONT_SANS,
                letterSpacing: "0.01em",
                transition: "color 0.2s ease",
              }}
            >
              {catLabel(cat.name)}
            </span>
            <span
              style={{
                fontSize: 9,
                color: isActive ? T.text50 : T.text20,
                fontFamily: FONT_MONO,
                fontVariantNumeric: "tabular-nums",
                transition: "color 0.2s ease",
              }}
            >
              {formatNum(cat.count)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   TRENDING CARD — with ghost rank number
───────────────────────────────────────────────────────────────────────────── */
function TrendingCard({
  op,
  rank,
  index = 0,
}: {
  op: Operator;
  rank: number;
  index?: number;
}) {
  const [hovered, setHovered] = useState(false);
  const price = parseDecimal(op.price);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: "easeOut" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? T.cardHover : T.card,
        border: `1px solid ${hovered ? T.borderHover : T.border}`,
        borderRadius: 10,
        padding: "22px 20px 18px",
        cursor: "pointer",
        transition: "background 0.2s ease, border-color 0.2s ease",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: 240,
      }}
    >
      {/* Ghost rank number */}
      <div
        style={{
          position: "absolute",
          top: -6,
          right: 14,
          fontSize: 72,
          fontWeight: 700,
          color: T.white2,
          lineHeight: 1,
          fontFamily: FONT_MONO,
          userSelect: "none",
          pointerEvents: "none",
          letterSpacing: "-0.05em",
        }}
      >
        {String(rank).padStart(2, "0")}
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {/* Category */}
        <div
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: T.text30,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontFamily: FONT_SANS,
            marginBottom: 10,
          }}
        >
          {catLabel(op.category)}
        </div>

        {/* Name */}
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: T.text95,
            letterSpacing: "-0.01em",
            marginBottom: 6,
            fontFamily: FONT_SANS,
            lineHeight: 1.3,
          }}
        >
          {op.name}
        </div>

        {/* Description — 2 lines */}
        <div
          style={
            {
              fontSize: 12,
              color: T.text50,
              lineHeight: 1.55,
              fontFamily: FONT_SANS,
              marginBottom: 6,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              flex: 1,
            } as any
          }
        >
          {op.description || "—"}
        </div>

        {/* Creator */}
        {op.creatorWallet && (
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              color: T.text20,
              letterSpacing: "0.02em",
              marginBottom: 14,
            }}
          >
            {shortWallet(op.creatorWallet)}
          </div>
        )}

        {/* Divider */}
        <div
          style={{ height: 1, background: T.borderSubtle, marginBottom: 14 }}
        />

        {/* Bottom row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: T.text80,
              letterSpacing: "-0.02em",
              fontFamily: FONT_MONO,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {priceDisplay(price)}
            {price > 0 && (
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 400,
                  color: T.text30,
                  marginLeft: 3,
                  fontFamily: FONT_SANS,
                }}
              >
                /call
              </span>
            )}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <IconBars />
            <span
              style={{
                fontSize: 10,
                color: T.text30,
                fontFamily: FONT_MONO,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatNum(op.invocations)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   RECENTLY ADDED CARD
───────────────────────────────────────────────────────────────────────────── */
function RecentCard({ op, index = 0 }: { op: Operator; index?: number }) {
  const [hovered, setHovered] = useState(false);
  const price = parseDecimal(op.price);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.05, ease: "easeOut" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? T.cardHover : T.card,
        border: `1px solid ${hovered ? T.borderHover : T.border}`,
        borderRadius: 10,
        padding: "22px 20px 18px",
        cursor: "pointer",
        transition: "background 0.2s ease, border-color 0.2s ease",
        display: "flex",
        flexDirection: "column",
        minHeight: 240,
      }}
    >
      {/* Top: category + NEW */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: T.text30,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontFamily: FONT_SANS,
          }}
        >
          {catLabel(op.category)}
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 500,
            color: T.text20,
            letterSpacing: "0.06em",
            fontFamily: FONT_MONO,
            background: T.white4,
            padding: "2px 6px",
            borderRadius: 3,
          }}
        >
          NEW
        </span>
      </div>

      {/* Name */}
      <div
        style={{
          fontSize: 15,
          fontWeight: 500,
          color: T.text95,
          letterSpacing: "-0.01em",
          marginBottom: 6,
          fontFamily: FONT_SANS,
          lineHeight: 1.3,
        }}
      >
        {op.name}
      </div>

      {/* Description — 2 lines */}
      <div
        style={
          {
            fontSize: 12,
            color: T.text50,
            lineHeight: 1.55,
            fontFamily: FONT_SANS,
            marginBottom: 6,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            flex: 1,
          } as any
        }
      >
        {op.description || "—"}
      </div>

      {/* Creator */}
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          color: T.text20,
          letterSpacing: "0.02em",
          marginBottom: 14,
        }}
      >
        {shortWallet(op.creatorWallet)}
      </div>

      {/* Divider */}
      <div
        style={{ height: 1, background: T.borderSubtle, marginBottom: 14 }}
      />

      {/* Bottom */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: T.text80,
            letterSpacing: "-0.01em",
            fontFamily: FONT_MONO,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {priceDisplay(price)}
          {price > 0 && (
            <span
              style={{
                fontSize: 9,
                color: T.text30,
                marginLeft: 3,
                fontFamily: FONT_SANS,
              }}
            >
              /call
            </span>
          )}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <IconBars />
          <span
            style={{
              fontSize: 10,
              color: T.text30,
              fontFamily: FONT_MONO,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatNum(op.invocations)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SKILL CARD — main grid card
───────────────────────────────────────────────────────────────────────────── */
function SkillCard({ op, index = 0 }: { op: Operator; index?: number }) {
  const [hovered, setHovered] = useState(false);
  const price = parseDecimal(op.price);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.26,
        delay: Math.min(index * 0.025, 0.4),
        ease: "easeOut",
      }}
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
      {/* Top row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: T.text20,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            flex: 1,
            fontFamily: FONT_SANS,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {catLabel(op.category)}
        </span>
        {op.isVerified && <VerifiedMark />}
        {op.health === "healthy" && (
          <span
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "rgba(52,211,153,0.6)",
              flexShrink: 0,
            }}
          />
        )}
      </div>

      {/* Name */}
      <div
        style={{
          fontSize: 14.5,
          fontWeight: 500,
          color: T.text95,
          letterSpacing: "-0.01em",
          marginBottom: 4,
          fontFamily: FONT_SANS,
          lineHeight: 1.35,
        }}
      >
        {op.name}
      </div>

      {/* Creator */}
      {op.creatorWallet && (
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            color: T.text20,
            letterSpacing: "0.02em",
            marginBottom: 10,
          }}
        >
          {shortWallet(op.creatorWallet)}
        </div>
      )}

      {/* Description */}
      <div
        style={
          {
            fontSize: 12.5,
            color: T.text50,
            lineHeight: 1.6,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            flex: 1,
            marginBottom: 12,
            fontFamily: FONT_SANS,
          } as any
        }
      >
        {op.description || "No description available."}
      </div>

      {/* Tags */}
      {op.tags && op.tags.length > 0 && (
        <div style={{ marginBottom: 14, minHeight: 16 }}>
          {op.tags.slice(0, 3).map((tag, i) => (
            <span key={tag} style={{ fontFamily: FONT_SANS }}>
              {i > 0 && (
                <span style={{ fontSize: 9, color: T.text12, margin: "0 5px" }}>
                  ·
                </span>
              )}
              <span
                style={{
                  fontSize: 10,
                  color: T.text30,
                  letterSpacing: "0.01em",
                }}
              >
                {tag}
              </span>
            </span>
          ))}
          {op.tags.length > 3 && (
            <span
              style={{
                fontSize: 10,
                color: T.text20,
                marginLeft: 6,
                fontFamily: FONT_SANS,
              }}
            >
              +{op.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Divider */}
      <div
        style={{ height: 1, background: T.borderSubtle, marginBottom: 14 }}
      />

      {/* Bottom */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <span
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: T.text80,
              letterSpacing: "-0.02em",
              fontFamily: FONT_MONO,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {priceDisplay(price)}
          </span>
          {price > 0 && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 400,
                color: T.text30,
                fontFamily: FONT_SANS,
              }}
            >
              /call
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <IconBars />
          <span
            style={{
              fontSize: 10.5,
              color: T.text30,
              fontFamily: FONT_MONO,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatNum(op.invocations)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION HEADER with gradient line
───────────────────────────────────────────────────────────────────────────── */
function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: T.text80,
          letterSpacing: "-0.01em",
          fontFamily: FONT_SANS,
        }}
      >
        {label}
      </div>
      {count !== undefined && (
        <span
          style={{
            fontSize: 11,
            color: T.text20,
            fontFamily: FONT_MONO,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {count}
        </span>
      )}
      <div style={{ flex: 1, height: 1, background: T.borderSubtle }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SIDEBAR ITEM
───────────────────────────────────────────────────────────────────────────── */
function SideItem({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number | string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        background: "none",
        border: "none",
        padding: "5px 0",
        cursor: "pointer",
        textAlign: "left",
        gap: 8,
      }}
    >
      <span
        style={{
          fontSize: 12.5,
          color: active ? T.text95 : T.text30,
          fontWeight: active ? 500 : 400,
          letterSpacing: "0.01em",
          transition: "color 0.12s ease",
          fontFamily: FONT_SANS,
        }}
      >
        {label}
      </span>
      {count !== undefined && (
        <span
          style={{
            fontSize: 10,
            color: active ? T.text50 : T.text20,
            fontVariantNumeric: "tabular-nums",
            flexShrink: 0,
            fontFamily: FONT_MONO,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function SideLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 9.5,
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: T.text12,
        marginBottom: 6,
        marginTop: 22,
        fontFamily: FONT_SANS,
      }}
    >
      {children}
    </div>
  );
}

function SidebarContent({
  search,
  setSearch,
  sort,
  setSort,
  priceFilter,
  setPriceFilter,
  verifiedOnly,
  setVerifiedOnly,
}: {
  search: string;
  setSearch: (value: string) => void;
  sort: string;
  setSort: (value: string) => void;
  priceFilter: string;
  setPriceFilter: (value: string) => void;
  verifiedOnly: boolean;
  setVerifiedOnly: (value: boolean) => void;
}) {
  return (
    <div style={{ padding: "24px 20px 60px" }}>
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: T.text30,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontFamily: FONT_SANS,
            marginBottom: 12,
          }}
        >
          Filters
        </div>
        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          >
            <IconSearch />
          </div>
          <input
            type="text"
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              background: T.white4,
              border: `1px solid ${T.border}`,
              borderRadius: 7,
              padding: "8px 10px 8px 30px",
              fontSize: 12,
              color: T.text95,
              outline: "none",
              boxSizing: "border-box",
              letterSpacing: "0.01em",
              transition: "border-color 0.15s ease",
              fontFamily: FONT_SANS,
            }}
            onFocus={(e) => (e.target.style.borderColor = T.accentBorder)}
            onBlur={(e) => (e.target.style.borderColor = T.border)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: T.text30,
                cursor: "pointer",
                fontSize: 14,
                lineHeight: 1,
                padding: 2,
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      <SideLabel>Sort By</SideLabel>
      {SORT_OPTIONS.map((opt) => (
        <SideItem
          key={opt.value}
          label={opt.label}
          active={sort === opt.value}
          onClick={() => setSort(opt.value)}
        />
      ))}

      <SideLabel>Price Range</SideLabel>
      {PRICE_OPTIONS.map((opt) => (
        <SideItem
          key={opt.value}
          label={opt.label}
          active={priceFilter === opt.value}
          onClick={() => setPriceFilter(opt.value)}
        />
      ))}

      <SideLabel>Status</SideLabel>
      <SideItem
        label="All Skills"
        active={!verifiedOnly}
        onClick={() => setVerifiedOnly(false)}
      />
      <SideItem
        label="Verified Only"
        active={verifiedOnly}
        onClick={() => setVerifiedOnly(true)}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   LIVE ACTIVITY TICKER
───────────────────────────────────────────────────────────────────────────── */
const MOCK_TICKER = [
  "Jupiter Swap invoked · $0.003 · 142ms",
  "Solana Token Scanner invoked · $0.001 · 89ms",
  "Code Review Pro invoked · $0.012 · 310ms",
  "DeFi Yield Optimizer invoked · $0.005 · 201ms",
  "NFT Metadata Fetcher invoked · $0.002 · 97ms",
  "On-chain Analytics invoked · $0.004 · 188ms",
  "Sentiment Analyzer invoked · $0.001 · 76ms",
  "Smart Contract Auditor invoked · $0.018 · 450ms",
  "Token Price Oracle invoked · $0.001 · 55ms",
  "Wallet Risk Scorer invoked · $0.006 · 224ms",
];

function LiveTicker({ operators }: { operators: Operator[] }) {
  const items =
    operators.length > 0
      ? operators.map((op) => {
          const p = parseDecimal(op.price);
          const latency = Math.floor(Math.random() * 400 + 60);
          return `${op.name} invoked · ${priceDisplay(p)} · ${latency}ms`;
        })
      : MOCK_TICKER;

  const doubled = [...items, ...items];

  return (
    <div
      style={{
        borderTop: `1px solid ${T.borderSubtle}`,
        borderBottom: `1px solid ${T.borderSubtle}`,
        overflow: "hidden",
        padding: "9px 0",
        position: "relative",
      }}
    >
      {/* Fade edges */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 80,
          zIndex: 1,
          background: `linear-gradient(90deg, ${T.bg}, transparent)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 80,
          zIndex: 1,
          background: `linear-gradient(270deg, ${T.bg}, transparent)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          paddingLeft: 24,
          marginBottom: 1,
        }}
      >
        <span
          style={{
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: T.text20,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 9,
            fontWeight: 500,
            color: T.text20,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontFamily: FONT_SANS,
          }}
        >
          Recent Activity
        </span>
      </div>

      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          repeat: Infinity,
          duration: items.length * 4,
          ease: "linear",
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          whiteSpace: "nowrap",
        }}
      >
        {doubled.map((msg, i) => (
          <span
            key={i}
            style={{
              fontSize: 11,
              color: T.text20,
              fontFamily: FONT_MONO,
              letterSpacing: "0.01em",
              padding: "0 28px",
              borderRight: `1px solid ${T.white2}`,
            }}
          >
            {msg}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────────────────── */
const SORT_OPTIONS = [
  { value: "invocations", label: "Most Used" },
  { value: "newest", label: "Newest First" },
  { value: "trust", label: "Highest Rated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];
const PRICE_OPTIONS = [
  { value: "all", label: "All Prices" },
  { value: "free", label: "Free" },
  { value: "lt001", label: "< $0.01" },
  { value: "001to005", label: "$0.01 to $0.05" },
  { value: "gt005", label: "> $0.05" },
];

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function SkillsMarketplace() {
  /* State */
  const [operators, setOperators] = useState<Operator[]>([]);
  const [trending, setTrending] = useState<Operator[]>([]);
  const [newest, setNewest] = useState<Operator[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [sort, setSort] = useState("invocations");
  const [priceFilter, setPriceFilter] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const categoryBarRef = useRef<HTMLDivElement>(null);
  const LIMIT = 24;

  const closeUpload = useCallback(() => {
    setShowUpload(false);
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") !== "earn") return;
    params.delete("tab");
    const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState({}, "", next);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "earn") {
      setShowUpload(true);
    }
  }, []);

  /* Fetch meta + row data once */
  useEffect(() => {
    Promise.all([
      fetch(apiUrl("/api/v1/stats"))
        .then((r) => r.json())
        .catch(() => ({})),
      fetch(apiUrl("/api/v1/categories"))
        .then((r) => r.json())
        .catch(() => ({ categories: [] })),
      fetchOperatorsPage({ pageSize: 8, sortBy: "invocations" }).catch(() => ({
        operators: [],
        total: 0,
      })),
      fetchOperatorsPage({ pageSize: 8, sortBy: "newest" }).catch(() => ({
        operators: [],
        total: 0,
      })),
    ]).then(([s, c, tr, nw]) => {
      setStats(s || {});
      setCategories(c?.categories || []);
      const trendingOps: Operator[] = (tr?.operators || []).filter(
        isTrendingEligible,
      );
      setTrending(trendingOps);
      const newestOps: Operator[] = (nw?.operators || []).filter(
        isRecentEligible,
      );
      setNewest(newestOps);
      setLoadingMeta(false);
    });
  }, []);

  /* Fetch grid on filter change */
  useEffect(() => {
    setLoading(true);
    setPage(1);
    const cat = activeCategory === "All" ? "" : activeCategory;
    const apiSort =
      sort === "price_asc" || sort === "price_desc" ? "invocations" : sort;
    const query = search.trim();
    fetchOperatorsPage({
      pageSize: LIMIT,
      page: 1,
      category: cat || undefined,
      sortBy: apiSort,
      query: query || undefined,
    })
      .then((d) => {
        const ops: Operator[] = d.operators || [];
        setOperators(ops);
        setHasMore(d.total > LIMIT);
      })
      .catch(() => setOperators([]))
      .finally(() => setLoading(false));
  }, [activeCategory, sort, search]);

  /* Load more */
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const cat = activeCategory === "All" ? "" : activeCategory;
    const apiSort =
      sort === "price_asc" || sort === "price_desc" ? "invocations" : sort;
    const nextPage = page + 1;
    const query = search.trim();
    fetchOperatorsPage({
      pageSize: LIMIT,
      page: nextPage,
      category: cat || undefined,
      sortBy: apiSort,
      query: query || undefined,
    })
      .then((d) => {
        const ops: Operator[] = d.operators || [];
        setOperators((prev) => [...prev, ...ops]);
        setHasMore(d.total > nextPage * LIMIT);
        setPage(nextPage);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, page, activeCategory, sort, search]);

  /* Client-side filter + sort */
  const filtered = operators
    .filter((op) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !op.name.toLowerCase().includes(q) &&
          !op.description?.toLowerCase().includes(q) &&
          !op.category?.toLowerCase().includes(q) &&
          !op.tags?.some((t) => t.toLowerCase().includes(q))
        )
          return false;
      }
      if (verifiedOnly && !op.isVerified) return false;
      const price = parseDecimal(op.price);
      if (!matchesPriceFilter(price, priceFilter)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "price_asc")
        return parseDecimal(a.price) - parseDecimal(b.price);
      if (sort === "price_desc")
        return parseDecimal(b.price) - parseDecimal(a.price);
      return 0;
    });

  const s = stats as any;
  const totalSkills = s.operators ?? s.totalOperators ?? 148;
  const totalInvocations = s.invocations ?? s.totalInvocations ?? 0;
  const totalRevenue = s.revenue
    ? `$${Number(s.revenue).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : "$0";
  const catCount = categories.length || 12;
  const protocols = s.protocols?.length ?? 3;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        fontFamily: FONT_SANS,
        color: T.text95,
        overflowX: "hidden",
      }}
    >
      {/* Font import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=DM+Mono:wght@300;400;500&display=swap');

        .sm-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .trending-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        .recent-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        @media (max-width: 1200px) {
          .sm-grid { grid-template-columns: repeat(2, 1fr); }
          .trending-grid { grid-template-columns: repeat(2, 1fr); }
          .recent-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 860px) {
          .desktop-sidebar { display: none !important; }
          .mobile-filter-btn { display: flex !important; }
        }
        @media (min-width: 861px) {
          .mobile-filter-btn { display: none !important; }
        }
        @media (max-width: 700px) {
          .sm-grid { grid-template-columns: 1fr; }
          .trending-grid { grid-template-columns: repeat(2, 1fr); }
          .recent-grid { grid-template-columns: repeat(2, 1fr); }
          .hero-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .featured-inner { flex-direction: column !important; }
        }
        @media (max-width: 420px) {
          .trending-grid { grid-template-columns: 1fr; }
          .recent-grid { grid-template-columns: 1fr; }
        }

        input::placeholder { color: rgba(255,255,255,0.20); }
        ::-webkit-scrollbar { width: 0; height: 0; }
        * { -webkit-font-smoothing: antialiased; box-sizing: border-box; }
      `}</style>

      <Navbar />

      {/* ── HERO BANNER ──────────────────────────────────────────────────── */}
      <div
        style={{
          width: "100%",
          paddingTop: 64,
          position: "relative",
          overflow: "hidden",
          borderBottom: `1px solid ${T.borderSubtle}`,
        }}
      >
        {/* Background video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.18,
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          <source src="/videos/AegisSprite.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay to keep text readable */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, rgba(10,10,11,0.3) 0%, rgba(10,10,11,0.7) 70%, ${T.bg} 100%)`,
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
        {/* Emerald radial accents on top */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `
            radial-gradient(ellipse 60% 40% at 80% 20%, rgba(52,211,153,0.04) 0%, transparent 60%),
            radial-gradient(ellipse 40% 60% at 10% 80%, rgba(52,211,153,0.025) 0%, transparent 50%)
          `,
            zIndex: 2,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            maxWidth: 1520,
            margin: "0 auto",
            padding: "52px 48px 36px",
            position: "relative",
            zIndex: 3,
          }}
        >
          {/* Logo + Heading */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 14,
            }}
          >
            <img
              src="/icon.png"
              alt=""
              style={{ width: 36, height: 36, objectFit: "contain" }}
            />
            <h1
              style={{
                fontSize: "clamp(30px, 4.5vw, 46px)",
                fontWeight: 300,
                color: T.text95,
                letterSpacing: "-0.03em",
                margin: 0,
                lineHeight: 1.1,
                fontFamily: FONT_SANS,
              }}
            >
              Skills Marketplace
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{
              fontSize: 16,
              color: T.text50,
              margin: "0 0 40px",
              lineHeight: 1.6,
              maxWidth: 520,
              fontFamily: FONT_SANS,
              fontWeight: 400,
            }}
          >
            AI agent skills on Solana. Pay per call. Every invocation guarded by
            NeMo.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{ position: "relative", maxWidth: 560 }}
          >
            <div
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              <IconSearch color={T.text50} />
            </div>
            <input
              type="text"
              placeholder="Search skills across 18 categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                height: 48,
                background: T.white4,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                padding: "0 44px 0 42px",
                fontSize: 14,
                color: T.text95,
                outline: "none",
                letterSpacing: "0.01em",
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
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: T.text30,
                  cursor: "pointer",
                  fontSize: 18,
                  lineHeight: 1,
                  padding: 2,
                }}
              >
                ×
              </button>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ───────────────────────────────────────────── */}
      <div style={{ maxWidth: 1520, margin: "0 auto", padding: "0 48px" }}>
        {/* ── TRENDING NOW ─────────────────────────────────────────────── */}
        <div style={{ paddingTop: 44 }}>
          <SectionHeader label="Trending Now" count={trending.length} />
          {loadingMeta ? (
            <div className="trending-grid" style={{ marginBottom: 48 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    height: 140,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.6,
                      ease: "linear",
                      delay: i * 0.1,
                    }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.022), transparent)",
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="trending-grid" style={{ marginBottom: 48 }}>
              {trending.slice(0, 4).map((op, i) => (
                <Link
                  key={op.slug || op.name}
                  href={`/marketplace/${op.slug}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <TrendingCard op={op} rank={i + 1} index={i} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── RECENTLY ADDED ───────────────────────────────────────────── */}
        <div style={{ marginBottom: 48 }}>
          <SectionHeader label="Recently Added" count={newest.length} />
          {loadingMeta ? (
            <div className="recent-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    height: 120,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.6,
                      ease: "linear",
                      delay: i * 0.1,
                    }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.022), transparent)",
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="recent-grid">
              {newest.slice(0, 4).map((op, i) => (
                <Link
                  key={op.slug || op.name}
                  href={`/marketplace/${op.slug}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <RecentCard op={op} index={i} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── CATEGORY NAV ─────────────────────────────────────────────── */}
        <div
          style={{
            position: "sticky",
            top: 56,
            zIndex: 40,
            background: T.bg,
            borderBottom: `1px solid ${T.borderSubtle}`,
            margin: "0 -48px",
            padding: "0 48px",
            marginBottom: 32,
          }}
        >
          <CategoryNav
            categories={categories}
            active={activeCategory}
            onChange={(c) => {
              setActiveCategory(c);
              setSidebarOpen(false);
            }}
          />
        </div>

        {/* ── BROWSE ALL — sidebar + grid ──────────────────────────────── */}
        <div style={{ display: "flex", gap: 0, alignItems: "flex-start" }}>
          {/* Desktop Sidebar */}
          <aside
            className="desktop-sidebar"
            style={
              {
                width: 220,
                flexShrink: 0,
                borderRight: `1px solid ${T.borderSubtle}`,
                position: "sticky",
                top: 100,
                maxHeight: "calc(100vh - 110px)",
                overflowY: "auto",
                scrollbarWidth: "none",
                marginRight: 32,
              } as any
            }
          >
            <SidebarContent
              search={search}
              setSearch={setSearch}
              sort={sort}
              setSort={setSort}
              priceFilter={priceFilter}
              setPriceFilter={setPriceFilter}
              verifiedOnly={verifiedOnly}
              setVerifiedOnly={setVerifiedOnly}
            />
          </aside>

          {/* Grid column */}
          <div style={{ flex: 1, minWidth: 0, paddingBottom: 80 }}>
            {/* Grid header row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
                paddingTop: 4,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: T.text20,
                    letterSpacing: "0.09em",
                    textTransform: "uppercase",
                    fontFamily: FONT_SANS,
                    marginBottom: 2,
                  }}
                >
                  {activeCategory === "All"
                    ? "Browse All"
                    : catLabel(activeCategory)}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: T.text30,
                    fontFamily: FONT_MONO,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {loading ? "—" : `${formatNum(filtered.length)} skills`}
                </div>
              </div>
              <button
                className="mobile-filter-btn"
                style={{
                  display: "none",
                  alignItems: "center",
                  gap: 6,
                  background: T.white4,
                  border: `1px solid ${T.border}`,
                  borderRadius: 7,
                  padding: "7px 12px",
                  cursor: "pointer",
                  color: T.text50,
                  fontSize: 12,
                  fontFamily: FONT_SANS,
                }}
                onClick={() => setSidebarOpen(true)}
              >
                <IconFilter /> Filters
              </button>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="sm-grid">
                {Array.from({ length: 9 }).map((_, i) => (
                  <SkeletonCard key={i} index={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "80px 0",
                  color: T.text30,
                  fontSize: 13,
                  fontFamily: FONT_SANS,
                }}
              >
                {search
                  ? `No skills found for "${search}"`
                  : "No skills match these filters."}
              </div>
            ) : (
              <>
                <div className="sm-grid">
                  <AnimatePresence>
                    {filtered.map((op, i) => (
                      <Link
                        key={op.slug || op.name || i}
                        href={`/marketplace/${op.slug}`}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <SkillCard op={op} index={i} />
                      </Link>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Load more */}
                {hasMore && (
                  <div style={{ marginTop: 32 }}>
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      style={{
                        width: "100%",
                        background: "transparent",
                        border: `1px solid ${T.border}`,
                        borderRadius: 8,
                        padding: "13px 0",
                        color: loadingMore ? T.text20 : T.text50,
                        fontSize: 12.5,
                        fontWeight: 500,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        cursor: loadingMore ? "not-allowed" : "pointer",
                        fontFamily: FONT_SANS,
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!loadingMore) {
                          e.currentTarget.style.borderColor = T.borderHover;
                          e.currentTarget.style.color = T.text95;
                          e.currentTarget.style.background = T.white2;
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = T.border;
                        e.currentTarget.style.color = T.text50;
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {loadingMore ? "Loading..." : "Show More Skills"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── LIVE ACTIVITY TICKER ─────────────────────────────────────────── */}
      <div style={{ marginTop: 48, marginBottom: 80 }}>
        <LiveTicker operators={trending} />
      </div>

      {/* ── MOBILE SIDEBAR DRAWER ────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setSidebarOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 200,
                background: "rgba(0,0,0,0.7)",
              }}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={
                {
                  position: "fixed",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: 290,
                  zIndex: 201,
                  background: "#0C0C0D",
                  borderRight: `1px solid ${T.border}`,
                  overflowY: "auto",
                  paddingTop: 60,
                  scrollbarWidth: "none",
                } as any
              }
            >
              <SidebarContent
                search={search}
                setSearch={setSearch}
                sort={sort}
                setSort={setSort}
                priceFilter={priceFilter}
                setPriceFilter={setPriceFilter}
                verifiedOnly={verifiedOnly}
                setVerifiedOnly={setVerifiedOnly}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <MobileBottomNav />
      <SkillUploadModal open={showUpload} onClose={closeUpload} />
    </div>
  );
}
