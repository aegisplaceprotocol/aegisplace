import { useState } from "react";
import { useRoute } from "wouter";
import { motion } from "framer-motion";
import { fadeInView } from "@/lib/animations";
import Navbar from "@/components/Navbar";

import { toast } from "sonner";

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
      return "bg-white/80";
    case "assigned":
      return "bg-white/50";
    case "in-review":
      return "bg-white/40";
    case "completed":
      return "bg-white";
    case "cancelled":
      return "bg-white/20";
    default:
      return "bg-white/30";
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
  "text-generation": "bg-white/[0.04] text-white/50 border-white/[0.06]",
  "image-generation": "bg-white/[0.04] text-white/50 border-white/[0.06]",
  "code-review": "bg-white/[0.04] text-white/50 border-white/[0.06]",
  "security-audit": "bg-white/[0.04] text-white/50 border-white/[0.06]",
  "data-extraction": "bg-white/[0.04] text-white/50 border-white/[0.06]",
  "financial-analysis": "bg-white/[0.04] text-white/50 border-white/[0.06]",
  development: "bg-white/[0.04] text-white/50 border-white/[0.06]",
  research: "bg-white/[0.04] text-white/50 border-white/[0.06]",
  content: "bg-white/[0.04] text-white/50 border-white/[0.06]",
  design: "bg-white/[0.04] text-white/50 border-white/[0.06]",
  social: "bg-white/[0.04] text-white/50 border-white/[0.06]",
};

/* ── Proposal Status Badge ───────────────────────────────────────────── */

function proposalStatusBadge(status: string): string {
  switch (status) {
    case "pending":
      return "bg-white/[0.04] text-white/40 border-white/[0.06]";
    case "accepted":
      return "bg-white/[0.06] text-white/60 border-white/[0.10]";
    case "rejected":
      return "bg-white/[0.02] text-white/25 border-white/[0.06]";
    default:
      return "bg-white/[0.04] text-white/40 border-white/[0.06]";
  }
}

/* ── Main Component ──────────────────────────────────────────────────── */

export default function TaskDetail() {
  const [, params] = useRoute("/tasks/:id");
  const taskId = params?.id || "";

  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalAmount, setProposalAmount] = useState("");
  const [proposalCoverLetter, setProposalCoverLetter] = useState("");
  const [proposalTimeEstimate, setProposalTimeEstimate] = useState("");

  const submitProposal = { mutateAsync: async () => ({}), isPending: false, mutate: () => {} } as any;

  const handleProposalSubmit = () => {
    const amount = parseFloat(proposalAmount);
    if (isNaN(amount) || amount < 0.01) {
      toast.error("Please enter a valid amount (minimum $0.01)");
      return;
    }
    if (!proposalCoverLetter || proposalCoverLetter.length < 10) {
      toast.error("Cover letter must be at least 10 characters");
      return;
    }
    submitProposal.mutate({
      taskId,
      amount,
      coverLetter: proposalCoverLetter,
      timeEstimate: proposalTimeEstimate || undefined,
    });
  };

  const {
    data: taskData,
    isLoading,
    error,
  } = { data: undefined as any, isLoading: false, error: null };

  const { data: proposalData } = { data: undefined as any };

  const task = taskData as Task | undefined;
  const proposalResult = proposalData as { proposals?: Proposal[] } | undefined;
  const proposals = (proposalResult?.proposals || []) as Proposal[];

  const badgeColor = task
    ? CATEGORY_BADGE_COLORS[task.category] ||
      "bg-white/10 text-white/50 border-white/15"
    : "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="pt-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-12 md:py-16">
          {/* Loading */}
          {isLoading && (
            <div className="space-y-6 animate-pulse">
              <div className="h-8 bg-white/[0.05] w-2/3" />
              <div className="h-4 bg-white/[0.04] w-1/4" />
              <div className="h-32 bg-white/[0.03]" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="border border-white/[0.10] bg-white/[0.02] p-6 text-center">
              <p className="text-white/60 text-sm">Failed to load task.</p>
              <p className="text-white/20 text-xs mt-2">
                Error: {error.message}
              </p>
            </div>
          )}

          {/* Task Content */}
          {task && (
            <motion.div {...fadeInView}>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 flex-wrap mb-4">
                  <span
                    className={`inline-block text-[10px] font-medium px-2.5 py-0.5 border ${badgeColor}`}
                  >
                    {task.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`block w-2 h-2 ${statusDotColor(task.status)}`}
                    />
                    <span className="text-[12px] text-white/40">
                      {statusLabel(task.status)}
                    </span>
                  </div>
                  <span className="text-[11px] text-white/20">
                    {timeAgo(task.createdAt)}
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-white/95 tracking-tight mb-4">
                  {task.title}
                </h1>

                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-[14px] font-light text-white/70 bg-white/[0.04] border border-white/[0.06] px-4 py-1.5">
                    ${parseFloat(task.budget).toLocaleString()} USDC
                  </span>
                  <span className="text-[12px] text-white/25">
                    Posted by{" "}
                    <span className="text-white/40 font-light text-[11px]">
                      {truncateWallet(task.postedBy)}
                    </span>
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="border border-white/[0.06] bg-white/[0.01] p-6 mb-6 rounded-[6px]">
                <h2 className="text-[13px] font-normal text-white/60 tracking-wider uppercase mb-4">
                  Description
                </h2>
                <p className="text-[14px] text-white/40 leading-relaxed whitespace-pre-wrap">
                  {task.description || "No description provided."}
                </p>
              </div>

              {/* Requirements */}
              {task.requirements && (
                <div className="border border-white/[0.06] bg-white/[0.01] p-6 mb-6 rounded-[6px]">
                  <h2 className="text-[13px] font-normal text-white/60 tracking-wider uppercase mb-4">
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
                  {task.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-[11px] text-white/30 bg-white/[0.04] border border-white/[0.06] px-3 py-1"
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
                      className="text-[13px] font-normal bg-white text-[#0A0A0A] px-5 py-2.5 hover:bg-white transition-colors"
                    >
                      {showProposalForm ? "Cancel" : "Submit Proposal"}
                    </button>
                  )}
                </div>

                {/* Inline Proposal Form */}
                {showProposalForm && (
                  <div className="border border-white/[0.06] bg-white/[0.01] p-6 mb-6 rounded-[6px]">
                    <h3 className="text-[14px] font-normal text-white/70 mb-4">
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
                          value={proposalAmount}
                          onChange={e => setProposalAmount(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/[0.10] text-sm text-white/70 px-4 py-3 placeholder:text-white/15 focus:border-white/25 focus:outline-none transition-all font-light"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] text-white/30 mb-1.5">
                          Time Estimate
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 2 hours, 3 days"
                          value={proposalTimeEstimate}
                          onChange={e =>
                            setProposalTimeEstimate(e.target.value)
                          }
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
                          value={proposalCoverLetter}
                          onChange={e => setProposalCoverLetter(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/[0.10] text-sm text-white/70 px-4 py-3 placeholder:text-white/15 focus:border-white/25 focus:outline-none transition-all resize-none"
                        />
                      </div>
                      <button
                        onClick={handleProposalSubmit}
                        disabled={submitProposal.isPending}
                        className="text-[13px] font-normal bg-white text-[#0A0A0A] px-6 py-2.5 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitProposal.isPending ? "Submitting..." : "Submit"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Proposals List */}
                {proposals.length > 0 ? (
                  <div className="space-y-3">
                    {proposals.map(proposal => (
                      <div
                        key={proposal.id}
                        className="border border-white/[0.06] bg-white/[0.01] p-6 rounded-[6px]"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-[14px] font-normal text-white/80">
                              {proposal.agentName}
                            </span>
                            <span
                              className={`text-[10px] font-medium px-2.5 py-0.5 border ${proposalStatusBadge(proposal.status)}`}
                            >
                              {proposal.status}
                            </span>
                          </div>
                          <span className="text-[13px] font-light text-white/60">
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
