import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

/* ═══════════════════════════════════════════════════════════════════════════
   INTERFACES
   ═══════════════════════════════════════════════════════════════════════════ */

interface Operator {
  id?: string;
  slug: string;
  name: string;
  trustScore: number;
  totalInvocations: number;
  successfulInvocations?: number;
  totalEarned?: string;
  avgResponseMs: number;
  isActive: boolean;
}

interface EarningsByOperator {
  operatorId: string;
  operatorSlug: string;
  operatorName: string;
  total: string;
}

interface Earnings {
  total: string;
  last24h: string;
  last7d: string;
  last30d: string;
  byOperator: EarningsByOperator[];
}

interface ActivityItem {
  _id?: string;
  operatorSlug?: string;
  operatorName?: string;
  operator?: { slug: string };
  callerWallet?: string;
  amountPaid?: string;
  creatorShare?: string;
  latencyMs?: number;
  responseTimeMs?: number;
  createdAt?: string | Date;
  success?: boolean;
  invocation?: {
    _id?: string;
    callerWallet?: string;
    operatorName?: string;
    amountPaid?: string;
    creatorShare?: string;
    latencyMs?: number;
    responseTimeMs?: number;
    createdAt?: string | Date;
    success?: boolean;
  };
}

interface Task {
  _id?: string;
  id?: string;
  title: string;
  status?: string;
  budget?: string;
  budgetAmount?: string;
  proposalCount?: number;
  createdAt?: string | Date;
  clientWallet?: string;
}

interface DashboardStats {
  totalOperators: number;
  activeOperators: number;
  totalInvocations: number;
  totalEarned: string;
  avgTrustScore: number;
  averageTrust?: number;
  activeValidators?: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

function timeAgo(date: Date | string): string {
  const now = Date.now();
  const d =
    typeof date === "string" ? new Date(date).getTime() : date.getTime();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function truncAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr || "";
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function fmtUsd(val: string | number): string {
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n) || n === 0) return "$0.00";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function trustTier(score: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (score >= 90)
    return {
      label: "Excellent",
      color: "text-white/90",
      bg: "bg-white/[0.08]",
    };
  if (score >= 75)
    return { label: "Good", color: "text-white/70", bg: "bg-white/[0.06]" };
  if (score >= 50)
    return { label: "Fair", color: "text-white/50", bg: "bg-white/[0.04]" };
  return { label: "Low", color: "text-white/30", bg: "bg-white/[0.03]" };
}

function successRate(total: number, success: number): string {
  if (total === 0) return "0";
  return ((success / total) * 100).toFixed(1);
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRIMITIVES
   ═══════════════════════════════════════════════════════════════════════════ */

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.4,
    ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
  },
};

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/[0.04] rounded ${className}`} />
  );
}

function StatCard({
  label,
  value,
  sub,
  loading,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  loading?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="p-5 md:p-6">
      <div className="text-[10px] font-medium text-white/20 tracking-[0.15em] mb-3">
        {label}
      </div>
      {loading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <>
          <div
            className={`text-[26px] md:text-[30px] font-light leading-none tracking-tight ${accent ? "text-white" : "text-white/80"}`}
          >
            {value}
          </div>
          {sub && (
            <div className="text-[11px] text-white/20 mt-1.5 font-light">
              {sub}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* Mini sparkline bar chart for earnings visualization */
function MiniBar({ data, height = 32 }: { data: number[]; height?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[2px]" style={{ height }}>
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 bg-white/[0.08] hover:bg-white/[0.15] transition-colors rounded-[1px] min-w-[2px]"
          style={{ height: `${Math.max((v / max) * 100, 4)}%` }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   EMPTY STATE. THE PITCH
   ═══════════════════════════════════════════════════════════════════════════ */

function EmptyDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 pt-28 pb-20">
        <motion.div {...fadeUp}>
          {/* Hero */}
          <div className="max-w-2xl mb-20">
            <h1 className="text-[36px] md:text-[48px] font-normal text-white leading-[1.1] tracking-tight mb-5">
              Turn your AI skills into revenue
            </h1>
            <p className="text-[15px] text-white/40 leading-relaxed max-w-lg">
              Upload an operator, set your price, and earn 60% of every
              invocation. Aegis handles discovery, payments, success scoring, and
              safety checks. You focus on building great tools.
            </p>
          </div>

          {/* How it works. 3 steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.04] border border-white/[0.06] mb-16 items-stretch">
            {[
              {
                step: "01",
                title: "Register your operator",
                desc: "Define your skill endpoint, set pricing per invocation, add a description. Takes 2 minutes.",
              },
              {
                step: "02",
                title: "Agents discover and invoke",
                desc: "Your operator appears in the marketplace. AI agents find it via search, MCP, or direct link and pay per call.",
              },
              {
                step: "03",
                title: "Earn on every call",
                desc: "60% of each invocation fee goes directly to you. Track earnings, invocations, and success rate in real time.",
              },
            ].map(item => (
              <div key={item.step} className="bg-background p-6 md:p-8">
                <div className="text-[11px] font-light text-white/15 mb-4">
                  {item.step}
                </div>
                <h3 className="text-[15px] font-normal text-white/90 mb-2">
                  {item.title}
                </h3>
                <p className="text-[13px] text-white/30 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Revenue model */}
          <div className="border border-white/[0.06] bg-white/[0.01] p-6 md:p-8 mb-16">
            <div className="text-[10px] font-medium text-white/20 tracking-[0.15em] mb-5">
              REVENUE MODEL
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <p className="text-[14px] text-white/50 leading-relaxed">
                  Every time an agent invokes your operator, USDC payment is
                  split automatically. No invoicing, no waiting, no minimum
                  payout. Revenue accumulates with every call.
                </p>
              </div>
              <div className="flex gap-px shrink-0">
                {[
                  { pct: "60%", label: "Creator", opacity: "text-white/90" },
                  { pct: "15%", label: "Validators", opacity: "text-white/50" },
                  { pct: "12%", label: "Stakers", opacity: "text-white/40" },
                  { pct: "8%", label: "Treasury", opacity: "text-white/25" },
                  { pct: "3%", label: "Insurance", opacity: "text-white/20" },
                  { pct: "2%", label: "Burn", opacity: "text-white/15" },
                ].map(s => (
                  <div
                    key={s.label}
                    className="bg-white/[0.03] px-3 py-3 text-center min-w-[60px]"
                  >
                    <div
                      className={`text-[16px] font-light ${s.opacity}`}
                    >
                      {s.pct}
                    </div>
                    <div className="text-[9px] text-white/20 mt-1">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Earnings projection */}
          <div className="border border-white/[0.06] bg-white/[0.01] p-6 md:p-8 mb-16">
            <div className="text-[10px] font-medium text-white/20 tracking-[0.15em] mb-5">
              EARNINGS PROJECTION
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {[
                {
                  calls: "100/day",
                  price: "$0.05",
                  daily: "$3.00",
                  monthly: "$90",
                  yearly: "$1,080",
                },
                {
                  calls: "1,000/day",
                  price: "$0.05",
                  daily: "$30",
                  monthly: "$900",
                  yearly: "$10,800",
                },
                {
                  calls: "10,000/day",
                  price: "$0.05",
                  daily: "$300",
                  monthly: "$9,000",
                  yearly: "$108,000",
                },
              ].map(tier => (
                <div key={tier.calls} className="bg-white/[0.02] p-5">
                  <div className="text-[12px] font-light text-white/30 mb-4">
                    {tier.calls} at {tier.price}/call
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[12px] text-white/25">Daily</span>
                      <span className="text-[13px] font-light text-white/60">
                        {tier.daily}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[12px] text-white/25">Monthly</span>
                      <span className="text-[13px] font-light text-white/70">
                        {tier.monthly}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-white/[0.04] pt-2">
                      <span className="text-[12px] text-white/25">Yearly</span>
                      <span className="text-[15px] font-light text-white/90">
                        {tier.yearly}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-white/15 mt-4">
              Based on 60% creator share. Actual earnings depend on invocation
              volume and pricing.
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-start gap-3">
            <Link href="/submit">
              <span className="inline-flex items-center gap-2 text-[13px] font-normal text-[#0A0A0A] bg-white hover:bg-white/90 px-6 py-3 transition-colors cursor-pointer">
                Register your first operator
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2 7h10M8 3l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Link>
            <Link href="/docs">
              <span className="inline-flex items-center text-[13px] font-medium text-white/40 hover:text-white/60 border border-white/[0.08] hover:border-white/[0.15] px-6 py-3 transition-all cursor-pointer">
                Read the docs
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════ */

export default function Dashboard() {
  const { user } = useAuth();
  const walletAddress = user?.walletAddress || "";
  const [activeTab, setActiveTab] = useState<
    "overview" | "operators" | "activity" | "tasks"
  >("overview");

  const earningsQuery = trpc.creator.earnings.useQuery(undefined, {
    enabled: !!walletAddress,
    staleTime: 300_000,
  });
  const operatorsQuery = trpc.creator.operators.useQuery(undefined, {
    enabled: !!walletAddress,
  });
  const recentQuery = trpc.invoke.recent.useQuery(
    { limit: 50 },
    { staleTime: 120_000 }
  );
  const tasksQuery = { data: undefined as any, isLoading: false };
  const statsQuery = trpc.stats.overview.useQuery(undefined, {
    staleTime: 300_000,
  });

  const earnings = earningsQuery.data;
  const operators = operatorsQuery.data;
  const stats = statsQuery.data as DashboardStats | undefined;

  const totalOperators = operators?.length ?? 0;
  const activeOperators = operators?.filter(op => op.isActive).length ?? 0;
  const totalEarned = earnings ? parseFloat(earnings.total) : 0;
  const totalInvocations =
    operators?.reduce((sum, op) => sum + (op.totalInvocations || 0), 0) ?? 0;

  const myOperatorSlugs = new Set(operators?.map(op => op.slug) ?? []);
  const myRecentActivity =
    (recentQuery.data as ActivityItem[] | undefined)
      ?.filter((item: ActivityItem) => {
        const slug = item.operatorSlug || item.operator?.slug;
        const caller = item.invocation?.callerWallet || item.callerWallet;
        return (slug != null && myOperatorSlugs.has(slug)) || caller === walletAddress;
      })
      ?.slice(0, 15) ?? [];

  const myTasks = (
    (tasksQuery.data as unknown as { tasks?: Task[] })?.tasks ??
    (tasksQuery.data as unknown as Task[]) ??
    []
  ).filter((t: Task) => t.clientWallet === walletAddress);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Show pitch page for users with no operators
  if (
    !earningsQuery.isLoading &&
    !operatorsQuery.isLoading &&
    totalOperators === 0
  ) {
    return <EmptyDashboard />;
  }

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    {
      key: "operators" as const,
      label: `Operators${totalOperators > 0 ? ` (${totalOperators})` : ""}`,
    },
    { key: "activity" as const, label: "Activity" },
    {
      key: "tasks" as const,
      label: `Tasks${myTasks.length > 0 ? ` (${myTasks.length})` : ""}`,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 pt-24 pb-0">
        <motion.div {...fadeUp}>
          {/* Breadcrumb line */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-[11px] font-light text-white/20">
              {truncAddr(walletAddress)}
            </span>
            <span className="text-white/10">·</span>
            <span className="text-[11px] text-white/20">
              {activeOperators} active operator
              {activeOperators !== 1 ? "s" : ""}
            </span>
          </div>

          {/* ─── KPI Strip ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.04] border border-white/[0.06] items-stretch">
            <StatCard
              label="TOTAL EARNED"
              value={fmtUsd(totalEarned)}
              sub={
                earnings?.last24h && parseFloat(earnings.last24h) > 0
                  ? `+${fmtUsd(earnings.last24h)} today`
                  : undefined
              }
              loading={earningsQuery.isLoading}
              accent
            />
            <StatCard
              label="INVOCATIONS"
              value={fmtNum(totalInvocations)}
              sub={
                operators && operators.length > 0
                  ? `across ${operators.length} operator${operators.length > 1 ? "s" : ""}`
                  : undefined
              }
              loading={operatorsQuery.isLoading}
            />
            <StatCard
              label="AVG TRUST SCORE"
              value={
                operators && operators.length > 0
                  ? (
                      operators.reduce((s, o) => s + o.trustScore, 0) /
                      operators.length
                    ).toFixed(0)
                  : "0"
              }
              sub={
                operators && operators.length > 0
                  ? trustTier(
                      operators.reduce((s, o) => s + o.trustScore, 0) /
                        operators.length
                    ).label
                  : undefined
              }
              loading={operatorsQuery.isLoading}
            />
            <StatCard
              label="SUCCESS RATE"
              value={
                operators && operators.length > 0
                  ? successRate(
                      operators.reduce(
                        (s, o) => s + (o.totalInvocations || 0),
                        0
                      ),
                      operators.reduce(
                        (s, o) => s + (o.successfulInvocations || 0),
                        0
                      )
                    ) + "%"
                  : "0%"
              }
              sub="all time"
              loading={operatorsQuery.isLoading}
            />
          </div>

          {/* ─── Tab bar ───────────────────────────────────────────────── */}
          <div className="flex items-center gap-0 border-b border-white/[0.06] mt-8">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`text-[12px] font-medium px-4 py-3 transition-colors relative ${
                  activeTab === tab.key
                    ? "text-white/90"
                    : "text-white/30 hover:text-white/50"
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-px bg-white/40"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </button>
            ))}

            <div className="flex-1" />
            <Link href="/submit">
              <span className="text-[11px] font-medium text-white/30 hover:text-white/60 border border-white/[0.08] hover:border-white/[0.15] px-3 py-1.5 transition-all cursor-pointer">
                + New Operator
              </span>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ─── Tab Content ─────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-8 pb-20">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div key="overview" {...fadeUp}>
              <OverviewTab
                earnings={earnings}
                operators={operators}
                recentActivity={myRecentActivity}
                earningsLoading={earningsQuery.isLoading}
                operatorsLoading={operatorsQuery.isLoading}
                stats={stats}
              />
            </motion.div>
          )}
          {activeTab === "operators" && (
            <motion.div key="operators" {...fadeUp}>
              <OperatorsTab
                operators={operators}
                loading={operatorsQuery.isLoading}
              />
            </motion.div>
          )}
          {activeTab === "activity" && (
            <motion.div key="activity" {...fadeUp}>
              <ActivityTab
                activity={myRecentActivity}
                loading={recentQuery.isLoading}
              />
            </motion.div>
          )}
          {activeTab === "tasks" && (
            <motion.div key="tasks" {...fadeUp}>
              <TasksTab tasks={myTasks} loading={tasksQuery.isLoading} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   OVERVIEW TAB
   ═══════════════════════════════════════════════════════════════════════════ */

function OverviewTab({
  earnings,
  operators,
  recentActivity,
  earningsLoading,
  operatorsLoading,
  stats,
}: {
  earnings: Earnings | undefined;
  operators: Operator[] | undefined;
  recentActivity: ActivityItem[];
  earningsLoading: boolean;
  operatorsLoading: boolean;
  stats: DashboardStats | undefined;
}) {
  return (
    <div className="space-y-6">
      {/* Row 1: Earnings breakdown + Top operators */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Earnings periods */}
        <div className="lg:col-span-3 border border-white/[0.06] bg-white/[0.01]">
          <div className="px-6 pt-5 pb-4 border-b border-white/[0.04]">
            <div className="text-[10px] font-medium text-white/20 tracking-[0.15em]">
              EARNINGS
            </div>
          </div>
          {earningsLoading ? (
            <div className="p-6">
              <Skeleton className="h-32 w-full" />
            </div>
          ) : !earnings || parseFloat(earnings.total) === 0 ? (
            <div className="p-6">
              <p className="text-[13px] text-white/25">
                No earnings recorded yet. Revenue from operator invocations will
                appear here.
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 items-stretch">
                {[
                  { label: "All time", val: earnings.total },
                  { label: "Last 24h", val: earnings.last24h },
                  { label: "Last 7d", val: earnings.last7d },
                  { label: "Last 30d", val: earnings.last30d },
                ].map(p => (
                  <div key={p.label}>
                    <div className="text-[10px] text-white/15 mb-1">
                      {p.label}
                    </div>
                    <div className="text-[18px] font-light text-white/80">
                      {fmtUsd(p.val)}
                    </div>
                  </div>
                ))}
              </div>
              {/* Per-operator mini chart */}
              {earnings.byOperator?.length > 0 && (
                <div className="space-y-3">
                  {earnings.byOperator.slice(0, 5).map((row: EarningsByOperator) => {
                    const total = parseFloat(earnings.total) || 1;
                    const rowTotal = parseFloat(row.total) || 0;
                    const pct = ((rowTotal / total) * 100).toFixed(0);
                    return (
                      <div key={row.operatorId}>
                        <div className="flex items-center justify-between mb-1">
                          <Link href={`/marketplace/${row.operatorSlug}`}>
                            <span className="text-[12px] text-white/50 hover:text-white/70 transition-colors cursor-pointer">
                              {row.operatorName}
                            </span>
                          </Link>
                          <span className="text-[12px] font-light text-white/40">
                            {fmtUsd(row.total)}
                          </span>
                        </div>
                        <div className="h-1 bg-white/[0.04] overflow-hidden">
                          <div
                            className="h-full bg-white/[0.15] transition-all duration-500"
                            style={{
                              width: `${Math.max(parseFloat(pct), 2)}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top performing operators */}
        <div className="lg:col-span-2 border border-white/[0.06] bg-white/[0.01]">
          <div className="px-6 pt-5 pb-4 border-b border-white/[0.04]">
            <div className="text-[10px] font-medium text-white/20 tracking-[0.15em]">
              TOP OPERATORS
            </div>
          </div>
          {operatorsLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !operators || operators.length === 0 ? (
            <div className="p-6">
              <p className="text-[13px] text-white/25">
                No operators registered.
              </p>
            </div>
          ) : (
            <div>
              {[...operators]
                .sort(
                  (a, b) =>
                    (b.totalInvocations || 0) - (a.totalInvocations || 0)
                )
                .slice(0, 5)
                .map((op, i) => (
                  <Link key={op.id || op.slug} href={`/marketplace/${op.slug}`}>
                    <div
                      className={`flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer ${
                        i > 0 ? "border-t border-white/[0.04]" : ""
                      }`}
                    >
                      <span className="text-[11px] font-light text-white/15 w-4">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-white/70 truncate">
                          {op.name}
                        </div>
                        <div className="text-[10px] text-white/20">
                          {fmtNum(op.totalInvocations || 0)} invocations
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[13px] font-light text-white/50">
                          {fmtUsd(op.totalEarned || "0")}
                        </div>
                        <div className="text-[10px] text-white/20">
                          trust {op.trustScore}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Recent activity + Platform stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent activity feed */}
        <div className="lg:col-span-3 border border-white/[0.06] bg-white/[0.01]">
          <div className="px-6 pt-5 pb-4 border-b border-white/[0.04]">
            <div className="text-[10px] font-medium text-white/20 tracking-[0.15em]">
              RECENT ACTIVITY
            </div>
          </div>
          {recentActivity.length === 0 ? (
            <div className="p-6">
              <p className="text-[13px] text-white/25">
                No recent activity. Invocations involving your operators will
                appear here.
              </p>
            </div>
          ) : (
            <div>
              {recentActivity.slice(0, 8).map((item: ActivityItem, idx: number) => {
                const inv = item.invocation || item;
                const opName =
                  item.operatorName || inv.operatorName || "Unknown";
                const amount = inv.amountPaid || inv.creatorShare || "0";
                const latency = inv.latencyMs || inv.responseTimeMs || 0;
                const created = inv.createdAt;

                return (
                  <div
                    key={inv._id || idx}
                    className={`flex items-center gap-4 px-6 py-3 ${
                      idx > 0 ? "border-t border-white/[0.04]" : ""
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white/[0.15] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] text-white/60">
                        {opName}
                      </span>
                    </div>
                    <span className="text-[11px] font-light text-white/30">
                      {latency > 0 ? `${latency}ms` : ""}
                    </span>
                    <span className="text-[12px] font-light text-white/50">
                      {fmtUsd(amount)}
                    </span>
                    <span className="text-[10px] text-white/15 w-14 text-right">
                      {created ? timeAgo(created) : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Platform health */}
        <div className="lg:col-span-2 border border-white/[0.06] bg-white/[0.01]">
          <div className="px-6 pt-5 pb-4 border-b border-white/[0.04]">
            <div className="text-[10px] font-medium text-white/20 tracking-[0.15em]">
              NETWORK
            </div>
          </div>
          <div className="p-6 space-y-4">
            {[
              {
                label: "Total operators on Aegis",
                value: fmtNum(stats?.totalOperators ?? 0),
              },
              {
                label: "Total invocations processed",
                value: fmtNum(stats?.totalInvocations ?? 0),
              },
              {
                label: "Average success rate",
                value: String(stats?.avgTrustScore ?? stats?.averageTrust ?? 0),
              },
              {
                label: "Active validators",
                value: fmtNum(stats?.activeValidators ?? 0),
              },
            ].map(row => (
              <div
                key={row.label}
                className="flex items-center justify-between"
              >
                <span className="text-[12px] text-white/25">{row.label}</span>
                <span className="text-[14px] font-light text-white/50">
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="px-6 pb-6 pt-2 border-t border-white/[0.04] mt-2">
            <div className="text-[10px] font-medium text-white/20 tracking-[0.15em] mb-3">
              QUICK ACTIONS
            </div>
            <div className="space-y-2">
              <Link href="/submit">
                <span className="block text-[12px] text-white/40 hover:text-white/70 py-1.5 transition-colors cursor-pointer">
                  Register new operator
                </span>
              </Link>
              <Link href="/connect">
                <span className="block text-[12px] text-white/40 hover:text-white/70 py-1.5 transition-colors cursor-pointer">
                  Connect via MCP
                </span>
              </Link>
              <Link href="/create">
                <span className="block text-[12px] text-white/40 hover:text-white/70 py-1.5 transition-colors cursor-pointer">
                  Post a task
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   OPERATORS TAB
   ═══════════════════════════════════════════════════════════════════════════ */

function OperatorsTab({
  operators,
  loading,
}: {
  operators: Operator[] | undefined;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        {[0, 1, 2].map(i => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (!operators || operators.length === 0) {
    return (
      <div className="border border-white/[0.06] bg-white/[0.01] p-12 text-center">
        <p className="text-[14px] text-white/30 mb-4">
          No operators registered yet.
        </p>
        <Link href="/submit">
          <span className="inline-flex items-center gap-2 text-[13px] font-normal text-[#0A0A0A] bg-white hover:bg-white/90 px-5 py-2.5 transition-colors cursor-pointer">
            Register First Operator
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
      {operators.map(op => {
        const tier = trustTier(op.trustScore);
        const rate =
          op.totalInvocations > 0
            ? (
                ((op.successfulInvocations || 0) / op.totalInvocations) *
                100
              ).toFixed(1)
            : "0";

        return (
          <Link key={op.id || op.slug} href={`/marketplace/${op.slug}`}>
            <div className="group border border-white/[0.06] hover:border-white/[0.12] bg-white/[0.01] hover:bg-white/[0.02] transition-all duration-300 cursor-pointer h-full">
              {/* Header */}
              <div className="px-5 pt-5 pb-4 border-b border-white/[0.04]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-normal text-white/85 group-hover:text-white transition-colors truncate">
                      {op.name}
                    </h3>
                    <span className="text-[10px] font-light text-white/15">
                      {op.slug}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-medium px-2 py-0.5 shrink-0 ${
                      op.isActive
                        ? "text-white/60 bg-white/[0.06]"
                        : "text-white/20 bg-white/[0.02]"
                    }`}
                  >
                    {op.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="px-5 py-4">
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <div className="text-[9px] text-white/15 mb-1">Trust</div>
                    <div className="flex items-center gap-2">
                      <span className="text-[16px] font-light text-white/70">
                        {op.trustScore}
                      </span>
                      <span className={`text-[9px] ${tier.color}`}>
                        {tier.label}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-white/15 mb-1">
                      Invocations
                    </div>
                    <span className="text-[16px] font-light text-white/60">
                      {fmtNum(op.totalInvocations || 0)}
                    </span>
                  </div>
                  <div>
                    <div className="text-[9px] text-white/15 mb-1">Earned</div>
                    <span className="text-[16px] font-light text-white/60">
                      {fmtUsd(op.totalEarned || "0")}
                    </span>
                  </div>
                  <div>
                    <div className="text-[9px] text-white/15 mb-1">
                      Success rate
                    </div>
                    <span className="text-[16px] font-light text-white/60">
                      {rate}%
                    </span>
                  </div>
                </div>

                {/* Latency bar */}
                {op.avgResponseMs > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/[0.04]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/15">
                        Avg latency
                      </span>
                      <span className="text-[11px] font-light text-white/30">
                        {op.avgResponseMs}ms
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ACTIVITY TAB
   ═══════════════════════════════════════════════════════════════════════════ */

function ActivityTab({
  activity,
  loading,
}: {
  activity: ActivityItem[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="border border-white/[0.06] bg-white/[0.01] p-6">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="flex gap-4 py-3 border-b border-white/[0.04]">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (activity.length === 0) {
    return (
      <div className="border border-white/[0.06] bg-white/[0.01] p-12 text-center">
        <p className="text-[13px] text-white/25">
          No recent activity involving your operators.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-white/[0.06] bg-white/[0.01] overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="text-[10px] font-medium text-white/20 px-6 py-3 tracking-[0.1em]">
              OPERATOR
            </th>
            <th className="text-[10px] font-medium text-white/20 px-4 py-3 tracking-[0.1em]">
              CALLER
            </th>
            <th className="text-[10px] font-medium text-white/20 px-4 py-3 tracking-[0.1em] text-right">
              AMOUNT
            </th>
            <th className="text-[10px] font-medium text-white/20 px-4 py-3 tracking-[0.1em] text-right hidden md:table-cell">
              LATENCY
            </th>
            <th className="text-[10px] font-medium text-white/20 px-6 py-3 tracking-[0.1em] text-right">
              TIME
            </th>
          </tr>
        </thead>
        <tbody>
          {activity.map((item: ActivityItem, idx: number) => {
            const inv = item.invocation || item;
            return (
              <tr
                key={inv._id || idx}
                className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors"
              >
                <td className="px-6 py-3">
                  <span className="text-[13px] text-white/60">
                    {item.operatorName || inv.operatorName || "Unknown"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[11px] font-light text-white/25">
                    {truncAddr(inv.callerWallet || "")}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-[12px] font-light text-white/50">
                    {fmtUsd(inv.amountPaid || inv.creatorShare || "0")}
                  </span>
                </td>
                <td className="px-4 py-3 text-right hidden md:table-cell">
                  <span className="text-[11px] font-light text-white/25">
                    {(inv.latencyMs || inv.responseTimeMs || 0) > 0
                      ? `${inv.latencyMs || inv.responseTimeMs}ms`
                      : ""}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  <span className="text-[10px] text-white/15">
                    {inv.createdAt ? timeAgo(inv.createdAt) : ""}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TASKS TAB
   ═══════════════════════════════════════════════════════════════════════════ */

function TasksTab({ tasks, loading }: { tasks: Task[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] font-medium text-white/20 tracking-[0.15em]">
          {tasks.length} TASK{tasks.length !== 1 ? "S" : ""}
        </div>
        <Link href="/create">
          <span className="text-[11px] font-medium text-white/30 hover:text-white/60 border border-white/[0.08] hover:border-white/[0.15] px-3 py-1.5 transition-all cursor-pointer">
            + Post Task
          </span>
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="border border-white/[0.06] bg-white/[0.01] p-12 text-center">
          <p className="text-[13px] text-white/25 mb-4">
            You haven't posted any tasks yet. Post a task to get work done by
            operators on the network.
          </p>
          <Link href="/create">
            <span className="inline-flex items-center text-[13px] font-normal text-[#0A0A0A] bg-white hover:bg-white/90 px-5 py-2.5 transition-colors cursor-pointer">
              Post Your First Task
            </span>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task: Task) => (
            <Link
              key={task._id || task.id}
              href={`/tasks/${task._id || task.id}`}
            >
              <div className="group border border-white/[0.06] hover:border-white/[0.12] bg-white/[0.01] hover:bg-white/[0.02] transition-all p-5 cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="text-[14px] font-normal text-white/75 group-hover:text-white/90 transition-colors truncate">
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-2">
                      <span
                        className={`text-[9px] font-medium px-2 py-0.5 ${
                          task.status === "open"
                            ? "text-white/50 bg-white/[0.06]"
                            : task.status === "completed"
                              ? "text-white/40 bg-white/[0.04]"
                              : "text-white/35 bg-white/[0.03]"
                        }`}
                      >
                        {task.status?.toUpperCase() || "OPEN"}
                      </span>
                      <span className="text-[11px] font-light text-white/25">
                        {fmtUsd(task.budget || task.budgetAmount || "0")}
                      </span>
                      {task.proposalCount !== undefined &&
                        task.proposalCount > 0 && (
                          <span className="text-[10px] text-white/15">
                            {task.proposalCount} proposal
                            {task.proposalCount !== 1 ? "s" : ""}
                          </span>
                        )}
                    </div>
                  </div>
                  <span className="text-[10px] text-white/10 shrink-0">
                    {task.createdAt ? timeAgo(task.createdAt) : ""}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
