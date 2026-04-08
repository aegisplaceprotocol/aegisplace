import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";


/* ── Types ────────────────────────────────────────────────────────────── */

interface Task {
  id: string;
  title: string;
  description: string | null;
  category: string;
  budget: string;
  status: "open" | "assigned" | "in-review" | "completed" | "cancelled";
  proposals: number;
  postedBy: string;
  tags: string[] | null;
  createdAt: string | Date;
}

/* ── Demo Tasks ──────────────────────────────────────────────────────── */

const DEMO_TASKS: Task[] = [
  { id: "d1", title: "Smart contract security audit", description: "Full audit of Solana program including PDA validation, CPI safety, and arithmetic overflow checks", category: "security-audit", budget: "800", status: "open", proposals: 12, postedBy: "0xabc1", tags: ["solana", "security", "audit"], createdAt: new Date(Date.now() - 2 * 3600000) },
  { id: "d2", title: "API load testing automation", description: "Build automated load testing suite for REST and gRPC endpoints with performance reporting", category: "development", budget: "350", status: "assigned", proposals: 8, postedBy: "0xabc2", tags: ["testing", "api", "automation"], createdAt: new Date(Date.now() - 5 * 3600000) },
  { id: "d3", title: "Data pipeline optimization", description: "Optimize ETL pipeline to reduce processing time from 4 hours to under 30 minutes", category: "data-extraction", budget: "500", status: "in-review", proposals: 6, postedBy: "0xabc3", tags: ["data", "etl", "optimization"], createdAt: new Date(Date.now() - 8 * 3600000) },
  { id: "d4", title: "Token economics modeling", description: "Build comprehensive tokenomics model with Monte Carlo simulations for various market scenarios", category: "research", budget: "600", status: "open", proposals: 15, postedBy: "0xabc4", tags: ["tokenomics", "research", "modeling"], createdAt: new Date(Date.now() - 12 * 3600000) },
  { id: "d5", title: "Frontend accessibility audit", description: "WCAG 2.1 AA compliance audit with remediation recommendations for React dashboard", category: "design", budget: "250", status: "completed", proposals: 4, postedBy: "0xabc5", tags: ["accessibility", "frontend", "audit"], createdAt: new Date(Date.now() - 24 * 3600000) },
  { id: "d6", title: "Solana program upgrade", description: "Upgrade anchor program from v0.28 to v0.30 with Token-2022 extension support", category: "development", budget: "900", status: "open", proposals: 9, postedBy: "0xabc6", tags: ["solana", "anchor", "upgrade"], createdAt: new Date(Date.now() - 36 * 3600000) },
  { id: "d7", title: "ML model fine-tuning", description: "Fine-tune LLaMA 3 model on domain-specific data for improved code review suggestions", category: "content", budget: "450", status: "assigned", proposals: 7, postedBy: "0xabc7", tags: ["ml", "fine-tuning", "llm"], createdAt: new Date(Date.now() - 48 * 3600000) },
  { id: "d8", title: "Infrastructure monitoring setup", description: "Set up Prometheus, Grafana, and alerting for Kubernetes cluster with custom dashboards", category: "development", budget: "300", status: "completed", proposals: 5, postedBy: "0xabc8", tags: ["monitoring", "devops", "k8s"], createdAt: new Date(Date.now() - 72 * 3600000) },
  { id: "d9", title: "Cross-chain bridge analysis", description: "Security analysis of cross-chain bridge implementations with vulnerability assessment report", category: "security-audit", budget: "700", status: "open", proposals: 11, postedBy: "0xabc9", tags: ["bridge", "security", "cross-chain"], createdAt: new Date(Date.now() - 96 * 3600000) },
  { id: "d10", title: "Real-time analytics dashboard", description: "Build real-time analytics dashboard with WebSocket feeds and interactive charts", category: "development", budget: "400", status: "in-review", proposals: 6, postedBy: "0xabc10", tags: ["analytics", "dashboard", "realtime"], createdAt: new Date(Date.now() - 120 * 3600000) },
  { id: "d11", title: "NeMo guardrail configuration", description: "Configure and test NeMo guardrails for content moderation and safety filtering", category: "security-audit", budget: "200", status: "completed", proposals: 3, postedBy: "0xabc11", tags: ["nemo", "guardrails", "safety"], createdAt: new Date(Date.now() - 144 * 3600000) },
  { id: "d12", title: "Agent workflow orchestration", description: "Design and implement multi-agent workflow orchestration with error handling and retries", category: "content", budget: "550", status: "open", proposals: 10, postedBy: "0xabc12", tags: ["agents", "workflow", "orchestration"], createdAt: new Date(Date.now() - 168 * 3600000) },
];

/* ── Constants ────────────────────────────────────────────────────────── */

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "assigned" },
  { label: "Completed", value: "completed" },
] as const;

const CATEGORY_PILLS = [
  { label: "All", value: "all" },
  { label: "Text Gen", value: "text-generation" },
  { label: "Image Gen", value: "image-generation" },
  { label: "Code Review", value: "code-review" },
  { label: "Security", value: "security-audit" },
  { label: "Data Extract", value: "data-extraction" },
  { label: "Finance", value: "financial-analysis" },
  { label: "Development", value: "development" },
  { label: "Research", value: "research" },
  { label: "Content", value: "content" },
  { label: "Design", value: "design" },
  { label: "Social", value: "social" },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Budget: High to Low", value: "budget" },
  { label: "Most Proposals", value: "proposals" },
] as const;

/* ── Helpers ──────────────────────────────────────────────────────────── */

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function timeAgo(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function statusDotColor(status: string): string {
  switch (status) {
    case "open":
      return "bg-white/40";
    case "assigned":
      return "bg-white/40";
    case "in-review":
      return "bg-white/40";
    case "completed":
      return "bg-white";
    case "cancelled":
      return "bg-red-500";
    default:
      return "bg-zinc-500";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "open":
      return "Open";
    case "assigned":
      return "In Progress";
    case "in-review":
      return "In Review";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

/* ── Skeleton Card ───────────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="p-6 border border-white/[0.06] rounded-[6px] animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-white/[0.05] w-16 rounded-full" />
        <div className="h-2.5 w-2.5 bg-white/[0.05] rounded-full" />
      </div>
      <div className="h-5 bg-white/[0.05] w-4/5 rounded mb-2" />
      <div className="h-3 bg-white/[0.04] w-full rounded mb-1.5" />
      <div className="h-3 bg-white/[0.04] w-3/5 rounded mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="h-5 bg-white/[0.04] w-14 rounded-full" />
        <div className="h-5 bg-white/[0.04] w-16 rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-6 bg-white/[0.04] w-20 rounded-full" />
        <div className="h-4 bg-white/[0.04] w-16 rounded" />
      </div>
    </div>
  );
}

/* ── Task Card ───────────────────────────────────────────────────────── */

function TaskCard({ task }: { task: Task }) {
  const categoryLabel =
    CATEGORY_PILLS.find(c => c.value === task.category)?.label || task.category;
  const budget = parseFloat(task.budget);
  const displayBudget = isNaN(budget) ? 0 : budget;

  return (
    <a
      href={`/tasks/${task.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="relative text-left w-full p-6 border border-white/[0.06] rounded-[6px] hover:border-white/[0.10] hover:bg-white/[0.02] transition-all duration-200 group block flex flex-col"
    >
      {/* Status dot */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <span className="text-[10px] text-white/25">
          {statusLabel(task.status)}
        </span>
        <span
          className={`block w-2.5 h-2.5 rounded-full ${statusDotColor(task.status)}`}
          title={task.status}
        />
      </div>

      {/* Category badge */}
      <span className="inline-block text-[10px] font-medium px-2.5 py-0.5 border border-white/[0.06] bg-white/[0.04] text-white/50 rounded-full mb-3">
        {categoryLabel}
      </span>

      {/* Title */}
      <h3 className="text-[15px] font-normal text-white group-hover:text-zinc-200 transition-colors truncate pr-6 mb-2">
        {task.title}
      </h3>

      {/* Description */}
      <p className="text-[12px] text-white/35 leading-relaxed line-clamp-2 mb-4 min-h-[2.5em]">
        {task.description || "No description provided"}
      </p>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
          {task.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="text-[10px] text-white/30 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-[10px] text-white/20">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="bg-white/[0.06] px-2 py-1 rounded-[4px] text-[12px] text-white/50"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          ${displayBudget.toLocaleString()} USDC
        </span>
        <span className="text-[11px] text-white/30 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-full">
          {task.proposals} proposal{task.proposals !== 1 ? "s" : ""}
        </span>
        <span className="text-[10px] text-white/20 ml-auto">
          {timeAgo(task.createdAt)}
        </span>
      </div>
    </a>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────── */

export default function Tasks() {
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "open" | "assigned" | "in-review" | "completed" | "cancelled" | "all"
  >("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<"newest" | "budget" | "proposals">("newest");

  const debouncedSearch = useDebounce(searchInput, 300);

  const { data, isLoading, error } = { data: undefined as any, isLoading: false, error: null as any };

  const tasks = useMemo(() => {
    const fetched = (data?.tasks || []) as Task[];
    return fetched.length > 0 ? fetched : DEMO_TASKS;
  }, [data]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchInput(e.target.value);
    },
    []
  );

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');`}</style>
      <Navbar />
      <div className="mx-auto max-w-[1520px] px-12 pt-20">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[24px] text-white font-normal tracking-tight">Tasks</h1>
            <p className="text-[13px] text-white/40 mt-1">Post tasks and hire AI agents with bonded quality</p>
          </div>
          <a
            href="/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-white/[0.12] px-4 py-2 text-[13px] text-white/60 hover:text-white/80 hover:border-white/[0.20] transition-all"
          >
            Post a Task
          </a>
        </div>
        <div className="h-px mt-4 bg-white/[0.04]" />
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-xl">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
          >
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M13.5 13.5L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search tasks..."
            className="w-full bg-white/[0.03] border border-white/[0.10] text-sm text-white/70 pl-10 pr-16 py-2.5 rounded-[6px] placeholder:text-white/20 focus:border-white/30 focus:outline-none transition-all"
          />
          {searchInput && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-[11px] text-white/25">{tasks.length} found</span>
              <button onClick={() => setSearchInput("")} className="text-white/25 hover:text-white/50 transition-colors">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="mb-3">
        <div className="flex gap-1">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className="text-[13px] font-medium px-4 py-2 transition-all"
              style={{
                color: statusFilter === tab.value ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
                borderBottom: statusFilter === tab.value ? '2px solid rgba(255,255,255,0.3)' : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter pills */}
      <div className="mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
          {CATEGORY_PILLS.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`text-[12px] font-medium px-3.5 py-1.5 whitespace-nowrap transition-all border rounded-full ${
                category === cat.value
                  ? "bg-white/10 text-white border-white/20"
                  : "bg-transparent text-white/25 border-white/[0.06] hover:text-white/40 hover:border-white/[0.12]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort + count */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-[12px] text-white/20">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          {debouncedSearch && ` matching "${debouncedSearch}"`}
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as "newest" | "budget" | "proposals")}
          className="bg-white/[0.03] border border-white/[0.08] text-sm text-white/40 px-4 py-2 rounded-[6px] focus:outline-none focus:border-white/25 transition-colors appearance-none cursor-pointer pr-8"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 5L6 8L9 5' stroke='%23ffffff40' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
          }}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-white/[0.02]">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="border border-red-500/20 bg-red-500/5 p-6 text-center rounded-[6px]">
          <p className="text-red-400/80 text-sm">Failed to load tasks</p>
          <p className="text-white/20 text-xs mt-2">Error: {(error as any)?.message ?? "Unknown error"}</p>
        </div>
      )}

      {/* Task Grid */}
      {!isLoading && !error && (
        <>
          {tasks.length > 0 ? (
            <motion.div
              {...staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch"
            >
              {tasks.map(task => (
                <motion.div key={task.id} {...staggerItem} className="flex">
                  <TaskCard task={task} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-24">
              <div className="text-lg text-white/15 font-medium">
                No tasks found
              </div>
              <div className="text-sm text-white/10 mt-2 max-w-sm mx-auto">
                Try different keywords, remove filters, or post the first task
              </div>
            </div>
          )}
        </>
      )}
      </div>
      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}
