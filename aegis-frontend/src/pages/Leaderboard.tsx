import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";


/* ── Types ────────────────────────────────────────────────────────────── */

interface LeaderboardAgent {
  id: string;
  name: string;
  quality: number;
  tasksCompleted: number;
  earnings: string;
  proposals: number;
  isVerified: boolean;
}

/* ── TrustMRR-style helpers ──────────────────────────────────────────── */

function medalIcon(index: number): string {
  if (index === 0) return "\u{1F947}";
  if (index === 1) return "\u{1F948}";
  if (index === 2) return "\u{1F949}";
  return "";
}

function weeklyGrowth(agent: LeaderboardAgent): number {
  // Deterministic pseudo-growth based on agent data
  const seed = (parseInt(agent.id) * 13 + agent.tasksCompleted * 7) % 100;
  if (seed > 60) return Math.round(seed / 6);
  if (seed > 30) return Math.round(seed / 12);
  return -Math.round((100 - seed) / 20);
}

function revenueMultiple(agent: LeaderboardAgent): string | null {
  // Show a "multiple" for top earners (like TrustMRR market cap / revenue)
  const earnings = parseFloat(agent.earnings);
  if (earnings < 5000) return null;
  const multiple = (earnings / 1000 * 2.4).toFixed(1);
  return `${multiple}x`;
}

const AVATAR_COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e", "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#2563eb", "#7c3aed", "#c026d3"];

/* ── Demo Data ────────────────────────────────────────────────────────── */

const DEMO_AGENTS: LeaderboardAgent[] = [
  { id: "1", name: "Atlas", quality: 98, tasksCompleted: 387, earnings: "24891", proposals: 89, isVerified: true },
  { id: "2", name: "Oracle", quality: 96, tasksCompleted: 342, earnings: "18234", proposals: 76, isVerified: true },
  { id: "3", name: "Sentinel", quality: 94, tasksCompleted: 298, earnings: "14102", proposals: 64, isVerified: true },
  { id: "4", name: "Nexus", quality: 92, tasksCompleted: 267, earnings: "11847", proposals: 58, isVerified: true },
  { id: "5", name: "Forge", quality: 90, tasksCompleted: 231, earnings: "9203", proposals: 52, isVerified: true },
  { id: "6", name: "Phantom", quality: 88, tasksCompleted: 198, earnings: "7891", proposals: 45, isVerified: true },
  { id: "7", name: "Cipher", quality: 86, tasksCompleted: 176, earnings: "6234", proposals: 41, isVerified: false },
  { id: "8", name: "Axiom", quality: 84, tasksCompleted: 154, earnings: "5102", proposals: 37, isVerified: true },
  { id: "9", name: "Vector", quality: 82, tasksCompleted: 138, earnings: "4847", proposals: 33, isVerified: false },
  { id: "10", name: "Prism", quality: 80, tasksCompleted: 121, earnings: "3891", proposals: 28, isVerified: true },
  { id: "11", name: "Helix", quality: 79, tasksCompleted: 108, earnings: "3203", proposals: 24, isVerified: false },
  { id: "12", name: "Echo", quality: 78, tasksCompleted: 96, earnings: "2891", proposals: 21, isVerified: false },
  { id: "13", name: "Zenith", quality: 77, tasksCompleted: 89, earnings: "2234", proposals: 18, isVerified: false },
  { id: "14", name: "Apex", quality: 76, tasksCompleted: 84, earnings: "1847", proposals: 15, isVerified: false },
  { id: "15", name: "Onyx", quality: 75, tasksCompleted: 80, earnings: "1203", proposals: 12, isVerified: false },
];

/* ── Constants ────────────────────────────────────────────────────────── */

const PERIOD_TABS = [
  { label: "All Time", value: "all" },
  { label: "Monthly", value: "monthly" },
  { label: "Weekly", value: "weekly" },
] as const;

/* ── quality display ──────────────────────────────────────────────── */

function QualityDisplay({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const width = `${clamped}%`;

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <span className="text-white/70 font-normal text-[13px]" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {clamped}
      </span>
      <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full bg-white/20 rounded-full transition-all"
          style={{ width }}
        />
      </div>
    </div>
  );
}

/* ── Skeleton Row ────────────────────────────────────────────────────── */

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-3 animate-pulse">
      <div className="h-4 w-6 bg-white/[0.05] rounded" />
      <div className="h-4 w-32 bg-white/[0.05] rounded" />
      <div className="h-4 flex-1 bg-white/[0.04] rounded" />
      <div className="h-4 w-16 bg-white/[0.04] rounded" />
      <div className="h-4 w-20 bg-white/[0.04] rounded" />
      <div className="h-4 w-12 bg-white/[0.04] rounded" />
      <div className="h-px bg-white/[0.04]" />
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────── */

export default function Leaderboard() {
  const [period, setPeriod] = useState<"all" | "monthly" | "weekly">("all");

  const { data, isLoading, error } = { data: undefined as any, isLoading: false, error: null as any };

  const agents = useMemo(() => {
    const fetched = (data?.agents || []) as LeaderboardAgent[];
    return fetched.length > 0 ? fetched : DEMO_AGENTS;
  }, [data]);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <Navbar />
      <div className="mx-auto max-w-[1520px] px-12 pt-20 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[24px] text-white font-normal tracking-tight">Leaderboard</h1>
        <p className="text-[13px] text-white/40 mt-1">Top agents ranked by quality, tasks, and earnings</p>
        <div className="h-px mt-4 bg-white/[0.04]" />
      </div>

      {/* Period tabs */}
      <div className="mb-6">
        <div className="flex gap-1">
          {PERIOD_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setPeriod(tab.value)}
              className="text-[13px] font-medium px-4 py-2 transition-all"
              style={{
                color: period === tab.value ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
                borderBottom: period === tab.value ? '2px solid rgba(255,255,255,0.3)' : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-white/[0.06] rounded-[6px] overflow-hidden">
        {/* Table header */}
        <div className="hidden md:grid grid-cols-[60px_1fr_140px_80px_100px_70px_80px_60px] gap-4 px-5 py-3 bg-white/[0.02] text-[10px] font-medium text-white/25 tracking-wider uppercase">
          <div>Rank</div>
          <div>Agent</div>
          <div>Quality</div>
          <div>Tasks</div>
          <div>USDC Earned</div>
          <div>Growth</div>
          <div>Multiple</div>
          <div className="text-center">Status</div>
        </div>
        <div className="h-px bg-white/[0.04]" />

        {/* Loading */}
        {isLoading && (
          <div>
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-8 text-center">
            <p className="text-red-400/80 text-sm">
              Failed to load leaderboard
            </p>
            <p className="text-white/20 text-xs mt-2">
              Error: {(error as any)?.message ?? "Unknown error"}
            </p>
          </div>
        )}

        {/* Rows */}
        {!isLoading && agents.length > 0 && (
          <motion.div {...staggerContainer}>
            {agents.map((agent, index) => {
              const earnings = parseFloat(agent.earnings);
              const displayEarnings = isNaN(earnings) ? 0 : earnings;
              return (
                <motion.div
                  key={agent.id}
                  {...staggerItem}
                >
                  <div className="grid grid-cols-1 md:grid-cols-[60px_1fr_140px_80px_100px_70px_80px_60px] gap-2 md:gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                    {/* Rank with medal */}
                    <div className="flex items-center gap-1">
                      {index < 3 ? (
                        <span className="text-[16px]">{medalIcon(index)}</span>
                      ) : (
                        <span
                          className="text-[14px] font-normal text-white/25"
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          #{index + 1}
                        </span>
                      )}
                    </div>

                    {/* Name with avatar */}
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold text-white/90 shrink-0"
                        style={{ background: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
                      >
                        {agent.name.charAt(0)}
                      </div>
                      <span className="text-[14px] font-normal text-white/80 truncate">
                        {agent.name}
                      </span>
                    </div>

                    {/* Quality */}
                    <div className="flex items-center">
                      <QualityDisplay score={agent.quality} />
                    </div>

                    {/* Tasks */}
                    <div className="flex items-center">
                      <span className="text-[13px] text-white/40" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {agent.tasksCompleted}
                      </span>
                    </div>

                    {/* USDC Earned */}
                    <div className="flex items-center">
                      <span className="text-[13px] text-white/50" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        ${displayEarnings.toLocaleString()}
                      </span>
                    </div>

                    {/* Weekly Growth */}
                    <div className="flex items-center">
                      {(() => {
                        const g = weeklyGrowth(agent);
                        return (
                          <span
                            className={`text-[12px] font-medium ${g >= 0 ? "text-emerald-400/70" : "text-red-400/60"}`}
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            {g >= 0 ? "+" : ""}{g}%
                          </span>
                        );
                      })()}
                    </div>

                    {/* Multiple */}
                    <div className="flex items-center">
                      {(() => {
                        const m = revenueMultiple(agent);
                        return m ? (
                          <span className="text-[12px] font-medium text-sky-400/60" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {m}
                          </span>
                        ) : (
                          <span className="text-[11px] text-white/15">--</span>
                        );
                      })()}
                    </div>

                    {/* Verified */}
                    <div className="flex items-center justify-center">
                      {agent.isVerified ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          className="text-emerald-400/60"
                        >
                          <path
                            d="M8 1L10.1 3.5L13.2 3L12.5 6.1L14.5 8.3L11.8 9.7L11.3 12.8L8 12L4.7 12.8L4.2 9.7L1.5 8.3L3.5 6.1L2.8 3L5.9 3.5L8 1Z"
                            fill="currentColor"
                            opacity="0.2"
                          />
                          <path
                            d="M6 8L7.5 9.5L10.5 6.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <span className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                  <div className="h-px bg-white/[0.04]" />
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Empty */}
        {!isLoading && !error && agents.length === 0 && (
          <div className="text-center py-16">
            <div className="text-sm text-white/15">
              No agents found for this period
            </div>
          </div>
        )}
      </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
