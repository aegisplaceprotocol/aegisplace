/**
 * Aegis Dashboard - Design System
 *
 * Swiss International Typographic Style.
 * Light weights. Generous whitespace. Pure information.
 * The interface disappears. The data remains.
 */

/* ── Design tokens ─────────────────────────────────────────────────────── */

export const T = {
  bg: "#0A0A0B",
  card: "rgba(255,255,255,0.015)",
  cardHover: "rgba(255,255,255,0.025)",

  border: "rgba(255,255,255,0.05)",
  borderSubtle: "rgba(255,255,255,0.03)",
  borderHover: "rgba(255,255,255,0.08)",

  // Text - light weights, careful hierarchy
  text95: "rgba(255,255,255,0.92)",
  text80: "rgba(255,255,255,0.72)",
  text50: "rgba(255,255,255,0.44)",
  text30: "rgba(255,255,255,0.28)",
  text20: "rgba(255,255,255,0.18)",
  text12: "rgba(255,255,255,0.10)",

  // Functional - mint for positive, warm orange→red for negative
  positive: "rgba(52,211,153,0.55)",
  negative: "rgba(220,100,60,0.50)",

  white2: "rgba(255,255,255,0.02)",
  white4: "rgba(255,255,255,0.04)",
  white6: "rgba(255,255,255,0.06)",

  // Backward-compat aliases (all muted)
  text90: "rgba(255,255,255,0.92)",
  text70: "rgba(255,255,255,0.72)",
  text25: "rgba(255,255,255,0.18)",
  white3: "rgba(255,255,255,0.03)",
  mint: "rgba(52,211,153,0.55)",
  gold: "rgba(255,255,255,0.28)",
  red: "rgba(220,100,60,0.50)",
  blue: "rgba(255,255,255,0.28)",
  purple: "rgba(255,255,255,0.22)",
} as const;

/* ── DashSection type ──────────────────────────────────────────────────── */

export type DashSection =
  | "overview" | "live-feed" | "activity"
  | "operators" | "earnings" | "royalties" | "missions" | "delegation"
  | "skill-marketplace" | "operator-directory" | "leaderboard" | "mission-blueprints"
  | "validators" | "x402-tracker" | "burn-tracker" | "economics" | "disputes"
  | "arsenal" | "evolution" | "swarms" | "research"
  | "connect" | "compute" | "nvidia" | "ecosystem" | "playground"
  | "bags"
  | "settings" | "api-keys" | "notifications";

/* ── Nav config ────────────────────────────────────────────────────────── */

export interface NavItem { label: string; section: DashSection; icon: string }
export interface NavGroup { title: string; items: NavItem[] }

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Command Center",
    items: [
      { label: "Overview",  section: "overview",  icon: "grid" },
      { label: "Live Feed", section: "live-feed", icon: "activity" },
      { label: "Activity",  section: "activity",  icon: "clock" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Operators",  section: "operators",  icon: "cpu" },
      { label: "Earnings",   section: "earnings",   icon: "dollar" },
      { label: "Royalties",  section: "royalties",  icon: "layers" },
      { label: "Missions",   section: "missions",   icon: "target" },
      { label: "Delegation", section: "delegation", icon: "git-branch" },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { label: "Skills",     section: "skill-marketplace",  icon: "search" },
      { label: "Operators",   section: "operator-directory", icon: "database" },
      { label: "Leaderboard", section: "leaderboard",        icon: "bar-chart" },
      { label: "Blueprints",  section: "mission-blueprints", icon: "copy" },
    ],
  },
  {
    title: "Protocol",
    items: [
      { label: "Validators", section: "validators",   icon: "shield" },
      { label: "x402",       section: "x402-tracker", icon: "zap" },
      { label: "Burns",      section: "burn-tracker",  icon: "flame" },
      { label: "Economics",  section: "economics",    icon: "trending-up" },
      { label: "Disputes",   section: "disputes",     icon: "alert-triangle" },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { label: "Arsenal",   section: "arsenal",   icon: "box" },
      { label: "Evolution",  section: "evolution", icon: "hexagon" },
      { label: "Swarms",    section: "swarms",    icon: "wind" },
      { label: "Research",   section: "research",  icon: "book-open" },
    ],
  },
  {
    title: "Bags",
    items: [
      { label: "Bag Skills", section: "bags", icon: "zap" },
    ],
  },
  {
    title: "Infrastructure",
    items: [
      { label: "MCP",       section: "connect",    icon: "link" },
      { label: "Compute",   section: "compute",    icon: "server" },
      { label: "NVIDIA",    section: "nvidia",     icon: "cpu" },
      { label: "Ecosystem", section: "ecosystem",  icon: "globe" },
      { label: "Playground", section: "playground", icon: "terminal" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Settings",      section: "settings",      icon: "settings" },
      { label: "API Keys",      section: "api-keys",      icon: "key" },
      { label: "Notifications", section: "notifications", icon: "bell" },
    ],
  },
];
