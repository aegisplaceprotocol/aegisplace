import { useState } from "react";
import { useRoute } from "wouter";
import { motion } from "framer-motion";
import { fadeInView } from "@/lib/animations";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";

/* ── Types ────────────────────────────────────────────────────────────── */

interface Task {
  id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  category: string;
  budget: string;
  status: "open" | "assigned" | "in-review" | "completed" | "cancelled";
  proposals: number;
  postedBy: string;
  tags: string[] | null;
  createdAt: string | Date;
}

interface Proposal {
  id: string;
  agentName: string;
  amount: string;
  coverLetter: string | null;
  timeEstimate: string | null;
  status: "pending" | "accepted" | "rejected";
  createdAt: string | Date;
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

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
      return "bg-emerald-400";
    case "assigned":
      return "bg-amber-400";
    case "in-review":
      return "bg-blue-400";
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

function truncateWallet(wallet: string): string {
  if (wallet.length <= 12) return wallet;
  return wallet.slice(0, 6) + "..." + wallet.slice(-4);
}

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  "text-generation": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "image-generation": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "code-review": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "security-audit": "bg-red-500/15 text-red-400 border-red-500/20",
  "data-extraction": "bg-amber-500/15 text-amber-400 border-amber-500/20",
  "financial-analysis": "bg-green-500/15 text-green-400 border-green-500/20",
  "development": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "research": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "content": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "design": "bg-amber-500/15 text-amber-400 border-amber-500/20",
  "social": "bg-violet-500/15 text-violet-400 border-violet-500/20",
};

/* ── Proposal Status Badge ───────────────────────────────────────────── */

function proposalStatusBadge(status: string): string {
  switch (status) {
    case "pending":
      return "bg-amber-500/10 text-amber-400 border-amber-500/15";
    case "accepted":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/15";
    case "rejected":
      return "bg-red-500/10 text-red-400 border-red-500/15";
    default:
      return "bg-white/10 text-white/50 border-white/15";
  }
}

/* ── Main Component ──────────────────────────────────────────────────── */

export default function TaskDetail() {
  const [, params] = useRoute("/tasks/:id");
  const taskId = params?.id || "";

  const [showProposalForm, setShowProposalForm] = useState(false);

  const { data: taskData, isLoading, error } = trpc.task.get.useQuery(
    { id: taskId },
    { enabled: !!taskId }
  );

  const { data: proposalData } = trpc.proposal.list.useQuery(
    { taskId },
    { enabled: !!taskId }
  );

  const task = taskData as Task | undefined;
  const proposalResult = proposalData as { proposals?: Proposal[] } | undefined;
  const proposals = (proposalResult?.proposals || []) as Proposal[];

  const badgeColor = task
    ? CATEGORY_BADGE_COLORS[task.category] || "bg-white/10 text-white/50 border-white/15"
    : "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="pt-[72px]">
        <div className="container py-12 md:py-16 max-w-4xl">
          {/* Loading */}
          {isLoading && (
            <div className="space-y-6 animate-pulse">
              <div className="h-8 bg-white/[0.05] w-2/3 rounded" />
              <div className="h-4 bg-white/[0.04] w-1/4 rounded" />
              <div className="h-32 bg-white/[0.03]" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="border border-red-500/20 bg-red-500/5 p-6 text-center">
              <p className="text-red-400/80 text-sm">Failed to load task.</p>
              <p className="text-white/20 text-xs mt-2">Error: {error.message}</p>
            </div>
          )}

          {/* Task Content */}
          {task && (
            <motion.div {...fadeInView}>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 flex-wrap mb-4">
                  <span
                    className={`inline-block text-[10px] font-medium px-2.5 py-0.5 border rounded-full ${badgeColor}`}
                  >
                    {task.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`block w-2.5 h-2.5 rounded-full ${statusDotColor(task.status)}`}
                    />
                    <span className="text-[12px] text-white/40">{statusLabel(task.status)}</span>
                  </div>
                  <span className="text-[11px] text-white/20">{timeAgo(task.createdAt)}</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-white/95 tracking-tight mb-4">
                  {task.title}
                </h1>

                <div className="flex items-center gap-4 flex-wrap">
                  <span
                    className="text-[14px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-4 py-1.5 rounded-full"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    ${parseFloat(task.budget).toLocaleString()} USDC
                  </span>
                  <span className="text-[12px] text-white/25">
                    Posted by{" "}
                    <span className="text-white/40 font-mono text-[11px]">
                      {truncateWallet(task.postedBy)}
                    </span>
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="border border-white/[0.06] bg-white/[0.01] p-6 mb-6">
                <h2 className="text-[13px] font-semibold text-white/60 tracking-wider uppercase mb-4">
                  Description
                </h2>
                <p className="text-[14px] text-white/40 leading-relaxed whitespace-pre-wrap">
                  {task.description || "No description provided."}
                </p>
              </div>

              {/* Requirements */}
              {task.requirements && (
                <div className="border border-white/[0.06] bg-white/[0.01] p-6 mb-6">
                  <h2 className="text-[13px] font-semibold text-white/60 tracking-wider uppercase mb-4">
                    Requirements
                  </h2>
                  <p className="text-[14px] text-white/40 leading-relaxed whitespace-pre-wrap">
                    {task.requirements}
                  </p>
                </div>
              )}

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-8">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] text-white/30 bg-white/[0.04] border border-white/[0.06] px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Proposals Section */}
              <div className="border-t border-white/[0.07] pt-8 mt-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white/90">
                    Proposals ({proposals.length})
                  </h2>
                  {task.status === "open" && (
                    <button
                      onClick={() => setShowProposalForm(!showProposalForm)}
                      className="text-[13px] font-semibold bg-emerald-500 text-white px-5 py-2.5 hover:bg-emerald-400 transition-colors"
                    >
                      {showProposalForm ? "Cancel" : "Submit Proposal"}
                    </button>
                  )}
                </div>

                {/* Inline Proposal Form */}
                {showProposalForm && (
                  <div className="border border-white/[0.06] bg-white/[0.01] p-6 mb-6">
                    <h3 className="text-[14px] font-semibold text-white/70 mb-4">
                      Your Proposal
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[12px] text-white/30 mb-1.5">
                          Amount (USDC)
                        </label>
                        <input
                          type="number"
                          placeholder="0.00"
                          className="w-full bg-white/[0.03] border border-white/[0.10] text-sm text-white/70 px-4 py-3 placeholder:text-white/15 focus:border-white/25 focus:outline-none transition-all"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] text-white/30 mb-1.5">
                          Time Estimate
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 2 hours, 3 days"
                          className="w-full bg-white/[0.03] border border-white/[0.10] text-sm text-white/70 px-4 py-3 placeholder:text-white/15 focus:border-white/25 focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] text-white/30 mb-1.5">
                          Cover Letter
                        </label>
                        <textarea
                          rows={4}
                          placeholder="Describe your approach..."
                          className="w-full bg-white/[0.03] border border-white/[0.10] text-sm text-white/70 px-4 py-3 placeholder:text-white/15 focus:border-white/25 focus:outline-none transition-all resize-none"
                        />
                      </div>
                      <button className="text-[13px] font-semibold bg-emerald-500 text-white px-6 py-2.5 hover:bg-emerald-400 transition-colors">
                        Submit
                      </button>
                    </div>
                  </div>
                )}

                {/* Proposals List */}
                {proposals.length > 0 ? (
                  <div className="space-y-3">
                    {proposals.map((proposal) => (
                      <div
                        key={proposal.id}
                        className="border border-white/[0.06] bg-white/[0.01] p-6"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-[14px] font-semibold text-white/80">
                              {proposal.agentName}
                            </span>
                            <span
                              className={`text-[10px] font-medium px-2.5 py-0.5 border rounded-full ${proposalStatusBadge(proposal.status)}`}
                            >
                              {proposal.status}
                            </span>
                          </div>
                          <span
                            className="text-[13px] font-medium text-emerald-400/80"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            ${parseFloat(proposal.amount).toLocaleString()} USDC
                          </span>
                        </div>
                        {proposal.coverLetter && (
                          <p className="text-[12px] text-white/35 leading-relaxed line-clamp-3 mb-2">
                            {proposal.coverLetter}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-[11px] text-white/20">
                          {proposal.timeEstimate && (
                            <span>Est: {proposal.timeEstimate}</span>
                          )}
                          <span>{timeAgo(proposal.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-sm text-white/15">
                      No proposals yet. Be the first to submit one.
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
