/**
 * Structured task composer: title, category, tags, deliverables, acceptance criteria.
 * Generates a clean mission spec card with economic preview.
 * Rebranded from AGIJobManager's job builder into Aegis military language.
 */
import ComingSoon from "@/components/ComingSoon";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import RequireWallet from "@/components/RequireWallet";

/* ── Category data ───────────────────────────────────────────────────── */
const MISSION_CATEGORIES = [
  { id: "code-review", label: "Code Review", icon: "{ }", color: "#A1A1AA" },
  { id: "security-audit", label: "Security Audit", icon: "!!", color: "#FF6B6B" },
  { id: "data-analysis", label: "Data Analysis", icon: ">>", color: "#A1A1AA" },
  { id: "translation", label: "Translation", icon: "AB", color: "#FFD93D" },
  { id: "defi-execution", label: "DeFi Execution", icon: "$>", color: "#A78BFA" },
  { id: "content-gen", label: "Content Generation", icon: "Aa", color: "#F472B6" },
  { id: "research", label: "Research", icon: "?!", color: "#60A5FA" },
  { id: "infrastructure", label: "Infrastructure", icon: "[]", color: "#34D399" },
];

const PRIORITY_LEVELS = [
  { id: "routine", label: "ROUTINE", color: "#A1A1AA", multiplier: 1 },
  { id: "priority", label: "PRIORITY", color: "#FFD93D", multiplier: 1.25 },
  { id: "urgent", label: "URGENT", color: "#FF6B6B", multiplier: 1.75 },
];

const SUGGESTED_TAGS: Record<string, string[]> = {
  "code-review": ["Solidity", "Rust", "TypeScript", "Python", "Gas Optimization", "Logic Audit"],
  "security-audit": ["Smart Contract", "Penetration Test", "Vulnerability Scan", "Formal Verification"],
  "data-analysis": ["On-chain", "Market Data", "Sentiment", "Whale Tracking", "MEV"],
  "translation": ["EN->ZH", "EN->ES", "EN->JP", "Technical", "Legal", "Marketing"],
  "defi-execution": ["Swap", "Yield Farm", "Liquidity", "Bridge", "Arbitrage", "Rebalance"],
  "content-gen": ["Blog Post", "Documentation", "Tweet Thread", "Whitepaper", "Newsletter"],
  "research": ["Protocol Analysis", "Competitor Intel", "Market Report", "Token Economics"],
  "infrastructure": ["Node Setup", "RPC Endpoint", "Indexer", "Monitoring", "DevOps"],
};

/* ── Tag pill ────────────────────────────────────────────────────────── */
function TagPill({ tag, active, onClick }: { tag: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-[10px] font-medium tracking-wider border transition-all ${
        active
          ? "border-white/30 bg-white/10 text-zinc-300"
          : "border-white/[0.07] text-white/20 hover:text-white/40 hover:border-white/[0.1]"
      }`}
    >
      {tag}
    </button>
  );
}

/* ── Deliverable row ─────────────────────────────────────────────────── */
function DeliverableRow({ value, onChange, onRemove, index }: {
  value: string; onChange: (v: string) => void; onRemove: () => void; index: number;
}) {
  return (
    <div className="flex items-center gap-2 group">
      <span className="text-[9px] font-medium text-white/15 w-5">{String(index + 1).padStart(2, "0")}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe deliverable..."
        className="flex-1 bg-white/[0.02] border border-white/[0.07] px-3 py-2 text-xs text-white/60 placeholder:text-white/10 focus:outline-none focus:border-white/20 transition-colors"
      />
      <button onClick={onRemove} className="text-white/10 hover:text-red-400/60 transition-colors text-xs opacity-0 group-hover:opacity-100">
        x
      </button>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────── */
export default function MissionBuilder() {
  return <ComingSoon title="Mission Builder" description="Compose multi-operator workflows with structured task briefings." />;
}

function _MissionBuilder() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("code-review");
  const [priority, setPriority] = useState("routine");
  const [tags, setTags] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [deliverables, setDeliverables] = useState(["", ""]);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState(["", ""]);
  const [budget, setBudget] = useState(5000);
  const [maxDuration, setMaxDuration] = useState(600);
  const [minTrustScore, setMinTrustScore] = useState(75);
  const [showPreview, setShowPreview] = useState(false);

  const selectedCategory = MISSION_CATEGORIES.find(c => c.id === category)!;
  const selectedPriority = PRIORITY_LEVELS.find(p => p.id === priority)!;
  const suggestedTags = SUGGESTED_TAGS[category] || [];

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const economics = useMemo(() => {
    const adjustedBudget = budget * selectedPriority.multiplier;
    const protocolFee = adjustedBudget * 0.025;
    const operatorPayout = adjustedBudget - protocolFee;
    const burnAmount = protocolFee * 0.4;
    const operatorBond = adjustedBudget * 0.05;
    return { adjustedBudget, protocolFee, operatorPayout, burnAmount, operatorBond };
  }, [budget, selectedPriority]);

  const missionId = useMemo(() => {
    const hash = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `MSN-${hash}`;
  }, []);

  const isValid = title.length > 0 && summary.length > 0 && deliverables.some(d => d.length > 0);

  return (
    <RequireWallet>
    <div className="min-h-screen bg-white/[0.02]">
      <Navbar />

      <main className="pt-24 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Link href="/marketplace" className="text-[10px] font-medium text-white/20 hover:text-white/40 transition-colors">MARKETPLACE</Link>
              <span className="text-white/10">/</span>
              <span className="text-[10px] font-medium text-zinc-300/40">NEW MISSION</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white/90 tracking-tight mb-2">
              Mission Briefing<span className="text-zinc-300">.</span>
            </h1>
            <p className="text-white/25 text-sm max-w-lg">
              Define task parameters, acceptance criteria, and economic constraints. The protocol matches your briefing to qualified operators automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Left: Builder Form ─────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title + Category */}
              <div className="border border-white/[0.07] bg-white/[0.015] p-6">
                <div className="text-[10px] font-medium text-white/25 tracking-wider mb-4">MISSION PARAMETERS</div>

                {/* Title */}
                <div className="mb-5">
                  <label className="text-[10px] font-medium text-white/20 tracking-wider block mb-2">TITLE</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Audit Solana token swap contract for reentrancy vulnerabilities"
                    className="w-full bg-white/[0.02] border border-white/[0.07] px-4 py-3 text-sm text-white/70 placeholder:text-white/10 focus:outline-none focus:border-white/20 transition-colors "
                  />
                </div>

                {/* Category */}
                <div className="mb-5">
                  <label className="text-[10px] font-medium text-white/20 tracking-wider block mb-2">CATEGORY</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {MISSION_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { setCategory(cat.id); setTags([]); }}
                        className={`flex items-center gap-2 px-3 py-2.5 border text-left transition-all ${
                          category === cat.id
                            ? "border-white/20 bg-white/[0.04]"
                            : "border-white/[0.04] hover:border-white/[0.08]"
                        }`}
                      >
                        <span className="text-[10px] font-medium" style={{ color: cat.color }}>{cat.icon}</span>
                        <span className={`text-[10px] font-medium tracking-wider ${category === cat.id ? "text-white/60" : "text-white/20"}`}>
                          {cat.label.toUpperCase()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div className="mb-5">
                  <label className="text-[10px] font-medium text-white/20 tracking-wider block mb-2">PRIORITY LEVEL</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRIORITY_LEVELS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPriority(p.id)}
                        className={`py-2.5 text-[10px] font-medium tracking-wider border transition-all ${
                          priority === p.id
                            ? `bg-white/[0.04]`
                            : "border-white/[0.04] text-white/15 hover:text-white/30"
                        }`}
                        style={priority === p.id ? { borderColor: `${p.color}33`, color: p.color } : {}}
                      >
                        {p.label}
                        <span className="block text-[8px] text-white/15 mt-0.5">{p.multiplier}x rate</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="text-[10px] font-medium text-white/20 tracking-wider block mb-2">TAGS</label>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedTags.map((tag) => (
                      <TagPill key={tag} tag={tag} active={tags.includes(tag)} onClick={() => toggleTag(tag)} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="border border-white/[0.07] bg-white/[0.015] p-6">
                <div className="text-[10px] font-medium text-white/25 tracking-wider mb-4">MISSION BRIEF</div>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Describe the task in detail. What needs to be done, why, and any context the operator needs..."
                  rows={4}
                  className="w-full bg-white/[0.02] border border-white/[0.07] px-4 py-3 text-xs text-white/60 placeholder:text-white/10 focus:outline-none focus:border-white/20 transition-colors resize-none leading-relaxed"
                />
                <div className="text-right mt-1">
                  <span className="text-[9px] font-medium text-white/10">{summary.length} chars</span>
                </div>
              </div>

              {/* Deliverables */}
              <div className="border border-white/[0.07] bg-white/[0.015] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[10px] font-medium text-white/25 tracking-wider">DELIVERABLES</div>
                  <button
                    onClick={() => setDeliverables([...deliverables, ""])}
                    className="text-[10px] font-medium text-zinc-300/40 hover:text-zinc-300/70 transition-colors"
                  >
                    + ADD
                  </button>
                </div>
                <div className="space-y-2">
                  {deliverables.map((d, i) => (
                    <DeliverableRow
                      key={i}
                      index={i}
                      value={d}
                      onChange={(v) => {
                        const next = [...deliverables];
                        next[i] = v;
                        setDeliverables(next);
                      }}
                      onRemove={() => setDeliverables(deliverables.filter((_, j) => j !== i))}
                    />
                  ))}
                </div>
              </div>

              {/* Acceptance Criteria */}
              <div className="border border-white/[0.07] bg-white/[0.015] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[10px] font-medium text-white/25 tracking-wider">ACCEPTANCE CRITERIA</div>
                  <button
                    onClick={() => setAcceptanceCriteria([...acceptanceCriteria, ""])}
                    className="text-[10px] font-medium text-zinc-300/40 hover:text-zinc-300/70 transition-colors"
                  >
                    + ADD
                  </button>
                </div>
                <div className="space-y-2">
                  {acceptanceCriteria.map((c, i) => (
                    <DeliverableRow
                      key={i}
                      index={i}
                      value={c}
                      onChange={(v) => {
                        const next = [...acceptanceCriteria];
                        next[i] = v;
                        setAcceptanceCriteria(next);
                      }}
                      onRemove={() => setAcceptanceCriteria(acceptanceCriteria.filter((_, j) => j !== i))}
                    />
                  ))}
                </div>
              </div>

              {/* Constraints */}
              <div className="border border-white/[0.07] bg-white/[0.015] p-6">
                <div className="text-[10px] font-medium text-white/25 tracking-wider mb-4">CONSTRAINTS</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="text-[10px] font-medium text-white/20 tracking-wider block mb-2">BUDGET ($AEGIS)</label>
                    <input
                      type="range"
                      min={100}
                      max={50000}
                      step={100}
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="w-full h-1 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                    <div className="text-center mt-1">
                      <span className="text-sm font-bold text-zinc-300">{budget.toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-white/20 tracking-wider block mb-2">MAX DURATION</label>
                    <input
                      type="range"
                      min={60}
                      max={3600}
                      step={60}
                      value={maxDuration}
                      onChange={(e) => setMaxDuration(Number(e.target.value))}
                      className="w-full h-1 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                    <div className="text-center mt-1">
                      <span className="text-sm font-bold text-white/60">{maxDuration >= 60 ? `${Math.floor(maxDuration / 60)}m` : `${maxDuration}s`}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-white/20 tracking-wider block mb-2">MIN TRUST SCORE</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={minTrustScore}
                      onChange={(e) => setMinTrustScore(Number(e.target.value))}
                      className="w-full h-1 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                    <div className="text-center mt-1">
                      <span className="text-sm font-bold text-white/60">{minTrustScore}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right: Preview + Economics ─────────────────────────── */}
            <div className="lg:col-span-1 space-y-6">
              {/* Mission Spec Card Preview */}
              <div className="border border-white/[0.07] bg-white/[0.02] p-5 rounded sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[10px] font-medium text-white/25 tracking-wider">MISSION SPEC</div>
                  <div className="text-[9px] font-medium text-white/10">{missionId}</div>
                </div>

                {/* Card */}
                <div className="border border-white/[0.08] bg-white/[0.02] p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs " style={{ color: selectedCategory.color }}>{selectedCategory.icon}</span>
                    <span className="text-[10px] font-medium text-white/30">{selectedCategory.label.toUpperCase()}</span>
                    <span className="ml-auto text-[9px] font-medium px-1.5 py-0.5 border" style={{ borderColor: `${selectedPriority.color}33`, color: selectedPriority.color }}>
                      {selectedPriority.label}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white/70 mb-2 leading-snug min-h-[2.5rem]">
                    {title || "Untitled Mission"}
                  </h3>

                  {summary && (
                    <p className="text-[10px] font-medium text-white/20 mb-3 line-clamp-3 leading-relaxed">{summary}</p>
                  )}

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {tags.map(t => (
                        <span key={t} className="text-[8px] text-zinc-300/40 border border-white/10 px-1.5 py-0.5">{t}</span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.04]">
                    <div>
                      <div className="text-xs font-bold text-zinc-300">{economics.adjustedBudget.toLocaleString()}</div>
                      <div className="text-[7px] text-white/15">$AEGIS</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white/50">{maxDuration >= 60 ? `${Math.floor(maxDuration / 60)}m` : `${maxDuration}s`}</div>
                      <div className="text-[7px] text-white/15">MAX DUR</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white/50">{minTrustScore}</div>
                      <div className="text-[7px] text-white/15">MIN TRUST</div>
                    </div>
                  </div>
                </div>

                {/* Economics */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-[10px] font-medium">
                    <span className="text-white/20">Operator payout</span>
                    <span className="text-zinc-300/60">{economics.operatorPayout.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-medium">
                    <span className="text-white/20">Protocol fee</span>
                    <span className="text-white/40">{economics.protocolFee.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-medium">
                    <span className="text-white/20">Token burn</span>
                    <span className="text-[#FF6B6B]/60">{economics.burnAmount.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-medium">
                    <span className="text-white/20">Operator bond req.</span>
                    <span className="text-white/40">{economics.operatorBond.toFixed(0)}</span>
                  </div>
                </div>

                {/* Deliverables count */}
                <div className="flex items-center gap-3 py-3 border-t border-white/[0.04] mb-4">
                  <div className="text-center flex-1">
                    <div className="text-sm font-bold text-white/50">{deliverables.filter(d => d.length > 0).length}</div>
                    <div className="text-[7px] text-white/15">DELIVERABLES</div>
                  </div>
                  <div className="w-px h-6 bg-white/[0.04]" />
                  <div className="text-center flex-1">
                    <div className="text-sm font-bold text-white/50">{acceptanceCriteria.filter(c => c.length > 0).length}</div>
                    <div className="text-[7px] text-white/15">CRITERIA</div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={() => setShowPreview(true)}
                  disabled={!isValid}
                  className={`w-full py-3 text-[11px] font-medium tracking-wider border transition-all ${
                    isValid
                      ? "border-white/30 bg-white/10 text-zinc-300 hover:bg-white/20"
                      : "border-white/[0.04] text-white/10 cursor-not-allowed"
                  }`}
                >
                  DEPLOY MISSION
                </button>

                {!isValid && (
                  <p className="text-[8px] text-white/10 text-center mt-2">
                    Title, summary, and at least one deliverable required
                  </p>
                )}

                {/* Export options */}
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 py-2 text-[9px] font-medium text-white/15 border border-white/[0.04] hover:text-white/30 hover:border-white/[0.08] transition-all">
                    EXPORT JSON
                  </button>
                  <button className="flex-1 py-2 text-[9px] font-medium text-white/15 border border-white/[0.04] hover:text-white/30 hover:border-white/[0.08] transition-all">
                    COPY SPEC
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mission deployed modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" onClick={() => setShowPreview(false)}>
          <div className="max-w-lg w-full border border-white/20 bg-white/[0.02] p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 border border-white/20 bg-white/5 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <div>
                <div className="text-sm font-bold text-white/80">Mission Deployed</div>
                <div className="text-[10px] font-medium text-white/25">{missionId}</div>
              </div>
            </div>

            <div className="border border-white/[0.07] bg-white/[0.02] p-4 mb-6">
              <div className="text-xs font-bold text-white/60 mb-1">{title || "Untitled Mission"}</div>
              <div className="text-[10px] font-medium text-white/20">{selectedCategory.label} / {selectedPriority.label}</div>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                <div className="text-center">
                  <div className="text-sm font-bold text-zinc-300">{economics.adjustedBudget.toLocaleString()}</div>
                  <div className="text-[7px] text-white/15">ESCROWED</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-white/50">{deliverables.filter(d => d.length > 0).length}</div>
                  <div className="text-[7px] text-white/15">DELIVERABLES</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-white/50">{minTrustScore}+</div>
                  <div className="text-[7px] text-white/15">TRUST REQ</div>
                </div>
              </div>
            </div>

            <p className="text-[10px] font-medium text-white/20 leading-relaxed mb-6">
              Your mission briefing has been published to the operator network. Qualified operators matching your trust and category requirements will be notified. Funds are escrowed in the protocol smart contract until completion and validation.
            </p>

            <div className="flex gap-3">
              <button onClick={() => setShowPreview(false)} className="flex-1 py-2.5 text-[10px] font-medium text-white/30 border border-white/[0.07] rounded hover:text-white/50 transition-colors">
                CLOSE
              </button>
              <Link href="/dashboard" className="flex-1 py-2.5 text-[10px] font-medium text-zinc-300 border border-white/20 bg-white/5 hover:bg-white/10 transition-colors text-center">
                VIEW IN DASHBOARD
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
    </RequireWallet>
  );
}
