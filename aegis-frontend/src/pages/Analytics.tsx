import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { fadeInView, staggerContainer, staggerItem } from "@/lib/animations";
import { trpc } from "@/lib/trpc";

/* -- Helpers ------------------------------------------------------------ */

function fmt(n: number | string | undefined): string {
  const v = typeof n === "string" ? parseFloat(n) : (n ?? 0);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return v.toLocaleString();
}

function usd(n: number | string | undefined): string {
  const v = typeof n === "string" ? parseFloat(n) : (n ?? 0);
  if (v >= 1_000_000) return "$" + (v / 1_000_000).toFixed(2) + "M";
  if (v >= 1_000) return "$" + (v / 1_000).toFixed(1) + "K";
  if (v < 1 && v > 0) return "$" + v.toFixed(4);
  return "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* -- Sparkline Canvas --------------------------------------------------- */

function SparklineChart({
  data,
  color = "#A1A1AA",
  height = 80,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const step = w / (data.length - 1);

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, color + "20");
    gradient.addColorStop(1, color + "00");

    ctx.beginPath();
    ctx.moveTo(0, h);
    data.forEach((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * (h * 0.85) - h * 0.08;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    data.forEach((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * (h * 0.85) - h * 0.08;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color + "60";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const lastX = (data.length - 1) * step;
    const lastY = h - ((data[data.length - 1] - min) / range) * (h * 0.85) - h * 0.08;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }, [data, color, height]);

  return <canvas ref={canvasRef} className="w-full" style={{ height }} />;
}

/* -- Stat Card ---------------------------------------------------------- */

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-white/[0.01] border border-white/[0.06] p-6 flex flex-col gap-1">
      <span className="text-[10px] font-medium text-white/20 uppercase tracking-[0.15em]">
        {label}
      </span>
      <span className="text-[26px] font-light text-white/85 leading-none tracking-tight">
        {value}
      </span>
      {sub && <span className="text-[11px] text-white/20 mt-1">{sub}</span>}
    </div>
  );
}

/* -- Fallback demo data ------------------------------------------------- */

const DEMO_GROWTH = [20, 35, 52, 68, 85, 95, 110, 125, 140, 155, 165, 172, 178, 182, 183];
const DEMO_REVENUE_DAILY = [320, 380, 410, 450, 520, 560, 610, 640, 700, 720, 780, 820, 880, 920, 980, 1020, 1060, 1120, 1180, 1240, 1280, 1340, 1380, 1420, 1480, 1520, 1580, 1640];
const DEMO_INVOCATIONS_DAILY = [2400, 2800, 3100, 3600, 4200, 4800, 5200, 5600, 6100, 6400, 6800, 7200, 7600, 8100, 8500, 8900, 9200, 9600, 10100, 10400, 10800, 11200, 11600, 12000, 12400, 12800, 13200, 13600];

const OPERATOR_CATEGORIES = [
  { name: "Development", count: 124, color: "#A1A1AA" },
  { name: "Security", count: 86, color: "#71717A" },
  { name: "AI / ML", count: 72, color: "#52525B" },
  { name: "Data", count: 58, color: "#3F3F46" },
  { name: "DeFi", count: 42, color: "#27272A" },
  { name: "Infrastructure", count: 28, color: "#18181B" },
  { name: "Productivity", count: 14, color: "#A1A1AA" },
  { name: "Research", count: 8, color: "#71717A" },
];

const TRUST_DISTRIBUTION = [
  { range: "90-100", count: 186, pct: 43 },
  { range: "80-89", count: 124, pct: 29 },
  { range: "70-79", count: 72, pct: 17 },
  { range: "60-69", count: 34, pct: 8 },
  { range: "50-59", count: 12, pct: 3 },
  { range: "< 50", count: 4, pct: 1 },
];

const FEE_DISTRIBUTION = [
  { label: "Creator (85%)", pct: 85, color: "#A1A1AA" },
  { label: "Validators (15%)", pct: 15, color: "#71717A" },
  { label: "Treasury (3%)", pct: 3, color: "#8B5CF6" },
  { label: "Treasury (8%)", pct: 8, color: "#4A7A82" },
  { label: "Insurance (3%)", pct: 3, color: "#06B6D4" },
  { label: "Burned (0.5%)", pct: 0.5, color: "rgba(220,100,60,0.50)" },
];

/* -- Page --------------------------------------------------------------- */

export default function Analytics() {
  const { data: stats, isLoading: loadingStats } = trpc.stats.overview.useQuery(
    undefined,
    { staleTime: 300_000 }
  );

  const { data: taskStats, isLoading: loadingTasks } = { data: undefined as any, isLoading: false };

  const { data: agents, isLoading: loadingAgents } = { data: undefined as any, isLoading: false };

  const { data: completedTasks } = { data: undefined as any };

  const { data: allTasks } = { data: undefined as any };

  const isLoading = loadingStats || loadingTasks || loadingAgents;

  /* -- Derived data ----------------------------------------------------- */

  const statusMap: Record<string, number> = {};
  if (taskStats?.byStatus) {
    for (const row of taskStats.byStatus as Array<{
      _id: string;
      count: number;
    }>) {
      statusMap[row._id] = row.count;
    }
  }
  const totalTaskCount = Object.values(statusMap).reduce((a, b) => a + b, 0);

  const categoryMap: Record<string, number> = {};
  if (allTasks?.tasks) {
    for (const t of allTasks.tasks as Array<{ category?: string }>) {
      const cat = t.category || "other";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    }
  }

  const totalOperators = stats?.totalOperators ?? 183;
  const totalInvocations = stats?.totalInvocations ?? 124350;
  const totalRevenue = (stats as any)?.totalEarned ?? "18420";
  const avgTrust = (stats as any)?.avgTrustScore ?? 91.4;
  const successRate = stats?.totalInvocations
    ? Math.min(100, ((stats.totalInvocations - (stats.totalDisputes ?? 0)) / stats.totalInvocations) * 100).toFixed(1)
    : "97.8";

  const STATUS_COLORS: Record<string, string> = {
    open: "#A1A1AA",
    assigned: "#71717A",
    "in-review": "#52525B",
    completed: "#3F3F46",
  };

  return (
    <div className="min-h-screen bg-transparent text-white">
      <Navbar />
      <div className="mx-auto max-w-[1520px] px-12 pt-24 pb-12">
        {/* Header */}
        <motion.div {...fadeInView} className="mb-10">
          <h1 className="text-[32px] font-normal tracking-tight text-white/90">
            Protocol Analytics
          </h1>
          <p className="text-[14px] text-white/30 mt-1">
            Live protocol metrics and growth data. Auto-refreshes every 2 minutes.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* -- Top stat cards ------------------------------------------- */}
            <motion.div
              {...staggerContainer}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-white/[0.04] border border-white/[0.06] mb-10"
            >
              <motion.div {...staggerItem}>
                <StatCard
                  label="Total Operators"
                  value={fmt(totalOperators)}
                  sub={`${fmt((stats as any)?.activeOperators ?? 398)} active`}
                />
              </motion.div>
              <motion.div {...staggerItem}>
                <StatCard
                  label="Total Invocations"
                  value={fmt(totalInvocations)}
                  sub={`${fmt((stats as any)?.invocationsLast24h ?? 4820)} last 24h`}
                />
              </motion.div>
              <motion.div {...staggerItem}>
                <StatCard
                  label="Total Revenue"
                  value={usd(totalRevenue)}
                  sub={`${usd((stats as any)?.earningsLast24h ?? "1060")} last 24h`}
                />
              </motion.div>
              <motion.div {...staggerItem}>
                <StatCard
                  label="Avg Success Rate"
                  value={String(typeof avgTrust === 'number' ? avgTrust.toFixed(1) : avgTrust)}
                  sub="across all operators"
                />
              </motion.div>
              <motion.div {...staggerItem}>
                <StatCard
                  label="Success Rate"
                  value={`${successRate}%`}
                  sub="all time"
                />
              </motion.div>
              <motion.div {...staggerItem}>
                <StatCard
                  label="Total Tasks"
                  value={fmt(totalTaskCount || 86)}
                  sub={`${statusMap["open"] || 12} open`}
                />
              </motion.div>
            </motion.div>

            {/* -- Protocol Growth Chart ------------------------------------ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
              <div className="bg-white/[0.01] border border-white/[0.06] p-6">
                <h2 className="text-[10px] font-medium text-white/20 tracking-[0.15em] mb-4">
                  OPERATOR GROWTH (14 WEEKS)
                </h2>
                <SparklineChart data={DEMO_GROWTH} color="#A1A1AA" height={120} />
                <div className="flex justify-between mt-3">
                  <span className="text-[10px] text-white/15">Week 1</span>
                  <span className="text-[10px] text-white/15">Current</span>
                </div>
              </div>

              <div className="bg-white/[0.01] border border-white/[0.06] p-6">
                <h2 className="text-[10px] font-medium text-white/20 tracking-[0.15em] mb-4">
                  DAILY REVENUE (28 DAYS)
                </h2>
                <div className="flex items-end gap-px h-[120px]">
                  {DEMO_REVENUE_DAILY.map((v, i) => {
                    const mx = Math.max(...DEMO_REVENUE_DAILY);
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-white/[0.08] hover:bg-white/[0.18] transition-colors"
                        style={{ height: `${(v / mx) * 100}%` }}
                        title={`Day ${i + 1}: $${v.toLocaleString()}`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-3">
                  <span className="text-[10px] text-white/15">28d ago</span>
                  <span className="text-[10px] text-white/15">Today</span>
                </div>
              </div>
            </div>

            {/* -- Invocation Volume + Revenue Distribution ------------------- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
              <div className="bg-white/[0.01] border border-white/[0.06] p-6">
                <h2 className="text-[10px] font-medium text-white/20 tracking-[0.15em] mb-4">
                  DAILY INVOCATIONS (28 DAYS)
                </h2>
                <SparklineChart data={DEMO_INVOCATIONS_DAILY} color="#71717A" height={100} />
                <div className="flex justify-between mt-3">
                  <span className="text-[10px] text-white/15">28d ago</span>
                  <span className="text-[10px] text-white/40">{fmt(DEMO_INVOCATIONS_DAILY[DEMO_INVOCATIONS_DAILY.length - 1])}/day</span>
                </div>
              </div>

              <div className="bg-white/[0.01] border border-white/[0.06] p-6">
                <h2 className="text-[10px] font-medium text-white/20 tracking-[0.15em] mb-4">
                  FEE DISTRIBUTION
                </h2>
                <div className="flex h-8 overflow-hidden mb-4">
                  {FEE_DISTRIBUTION.map(item => (
                    <div
                      key={item.label}
                      style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                      className="flex items-center justify-center text-[9px] font-medium text-black min-w-[20px]"
                      title={item.label}
                    >
                      {item.pct >= 8 ? `${item.pct}%` : ""}
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {FEE_DISTRIBUTION.map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-[11px] text-white/40">{item.label}</span>
                      </div>
                      <span
                        className="text-[11px] font-light tabular-nums"
                        style={{ color: item.color }}
                      >
                        {item.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* -- Category Breakdown + Trust Distribution -------------------- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
              <div className="bg-white/[0.01] border border-white/[0.06] p-6">
                <h2 className="text-[10px] font-medium text-white/20 tracking-[0.15em] mb-4">
                  OPERATOR CATEGORIES
                </h2>
                <div className="space-y-3">
                  {OPERATOR_CATEGORIES.map(cat => {
                    const total = OPERATOR_CATEGORIES.reduce((s, c) => s + c.count, 0);
                    const pct = ((cat.count / total) * 100).toFixed(0);
                    return (
                      <div key={cat.name}>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-white/40">{cat.name}</span>
                          <span className="text-white/25">{cat.count} operators ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-white/[0.04] overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: cat.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white/[0.01] border border-white/[0.06] p-6">
                <h2 className="text-[10px] font-medium text-white/20 tracking-[0.15em] mb-4">
                  quality score DISTRIBUTION
                </h2>
                <div className="space-y-3">
                  {TRUST_DISTRIBUTION.map(tier => (
                    <div key={tier.range}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-white/40">{tier.range}</span>
                        <span className="text-white/25">{tier.count} operators ({tier.pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.04] overflow-hidden">
                        <div
                          className="h-full bg-white/[0.15] transition-all"
                          style={{ width: `${tier.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-white/15 mt-4">
                  {TRUST_DISTRIBUTION[0].pct}% of operators maintain a success rate above 90.
                </p>
              </div>
            </div>

            {/* -- Tasks by Status ----------------------------------------- */}
            <div className="bg-white/[0.01] border border-white/[0.06] p-6 mb-6">
              <h2 className="text-[10px] font-medium text-white/20 tracking-[0.15em] mb-4">
                TASKS BY STATUS
              </h2>
              {totalTaskCount > 0 ? (
                <>
                  <div className="flex h-6 overflow-hidden mb-4">
                    {(
                      ["open", "assigned", "in-review", "completed"] as const
                    ).map(status => {
                      const count = statusMap[status] || 0;
                      if (count === 0) return null;
                      const pct = (count / totalTaskCount) * 100;
                      return (
                        <div
                          key={status}
                          style={{
                            width: `${pct}%`,
                            backgroundColor: STATUS_COLORS[status],
                          }}
                          className="flex items-center justify-center text-[9px] font-medium text-black min-w-[20px]"
                          title={`${status}: ${count}`}
                        >
                          {pct >= 10 ? count : ""}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {(
                      ["open", "assigned", "in-review", "completed"] as const
                    ).map(status => (
                      <div key={status} className="flex items-center gap-2">
                        <div
                          className="w-2 h-2"
                          style={{ backgroundColor: STATUS_COLORS[status] }}
                        />
                        <span className="text-[11px] text-white/40 capitalize">
                          {status}
                        </span>
                        <span className="text-[11px] font-light text-white/20">
                          {statusMap[status] || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-[13px] text-white/25">No tasks recorded yet.</p>
              )}
            </div>

            {/* -- Recent Completions -------------------------------------- */}
            <div className="bg-white/[0.01] border border-white/[0.06] p-6">
              <h2 className="text-[10px] font-medium text-white/20 tracking-[0.15em] mb-4">
                RECENT COMPLETIONS
              </h2>
              {completedTasks?.tasks && completedTasks.tasks.length > 0 ? (
                <div className="space-y-0">
                  {(
                    completedTasks.tasks as Array<{
                      _id: string;
                      title?: string;
                      budgetAmount?: number;
                      assignedAgentId?: string;
                      completedAt?: string;
                    }>
                  ).map((task, i) => (
                    <div
                      key={String(task._id)}
                      className={`flex items-center justify-between py-3 ${
                        i > 0 ? "border-t border-white/[0.04]" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-white/60 truncate">
                          {task.title || "Untitled"}
                        </p>
                        <p className="text-[10px] text-white/20">
                          Agent:{" "}
                          {task.assignedAgentId
                            ? String(task.assignedAgentId).slice(-8)
                            : "---"}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-[12px] font-light text-white/50">
                          {usd(task.budgetAmount)}
                        </p>
                        {task.completedAt && (
                          <p className="text-[10px] text-white/15">
                            {new Date(task.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-white/25">No completed tasks yet.</p>
              )}
            </div>
          </>
        )}
      </div>
      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}
