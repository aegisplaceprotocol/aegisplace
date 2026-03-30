import SectionLabel from "@/components/SectionLabel";
import { useInView } from "@/hooks/useInView";
import { useState } from "react";

/* ── Operator class colors ──────────────────────────────────────────── */
const CLASS_COLORS: Record<string, string> = {
  RECON: "#A1A1AA",
  FORGE: "#71717A",
  CIPHER: "#52525B",
  AEGIS: "#A1A1AA",
  GHOST: "#6B7280",
};

const CLASS_LABELS: Record<string, string> = {
  RECON: "Intelligence",
  FORGE: "Builder",
  CIPHER: "Security",
  AEGIS: "Validator",
  GHOST: "Stealth",
};

/* ── Blueprint data ─────────────────────────────────────────────────── */
interface BlueprintStep {
  name: string;
  class: string;
  cost: string;
}

interface Blueprint {
  id: string;
  name: string;
  description: string;
  steps: BlueprintStep[];
  totalCost: string;
  avgEarnings: string;
  forks: number;
  successRate: string;
}

const BLUEPRINTS: Blueprint[] = [
  {
    id: "smart-audit",
    name: "Smart Contract Audit Pipeline",
    description: "Automated security audit for Solana programs. Scans for common vulnerabilities, checks PDA derivation, validates authority patterns, and generates a signed audit report.",
    steps: [
      { name: "code-scanner", class: "RECON", cost: "$0.02" },
      { name: "vuln-detector", class: "CIPHER", cost: "$0.08" },
      { name: "pda-validator", class: "CIPHER", cost: "$0.04" },
      { name: "report-gen", class: "FORGE", cost: "$0.03" },
    ],
    totalCost: "$0.17",
    avgEarnings: "$0.12",
    forks: 847,
    successRate: "94.2%",
  },
  {
    id: "data-enrichment",
    name: "On-Chain Data Enrichment",
    description: "Enrich wallet addresses with transaction history, token holdings, DeFi positions, and risk scoring. Output feeds into compliance or trading systems.",
    steps: [
      { name: "wallet-resolver", class: "RECON", cost: "$0.01" },
      { name: "tx-analyzer", class: "RECON", cost: "$0.05" },
      { name: "risk-scorer", class: "CIPHER", cost: "$0.06" },
      { name: "data-formatter", class: "FORGE", cost: "$0.02" },
    ],
    totalCost: "$0.14",
    avgEarnings: "$0.10",
    forks: 1243,
    successRate: "97.8%",
  },
  {
    id: "content-pipeline",
    name: "Research-to-Report Pipeline",
    description: "Autonomous research pipeline. Crawls sources, extracts key findings, cross-references claims, and produces a structured report with citations.",
    steps: [
      { name: "web-crawler", class: "RECON", cost: "$0.03" },
      { name: "fact-checker", class: "CIPHER", cost: "$0.04" },
      { name: "report-writer", class: "FORGE", cost: "$0.06" },
    ],
    totalCost: "$0.13",
    avgEarnings: "$0.09",
    forks: 2156,
    successRate: "91.5%",
  },
  {
    id: "defi-monitor",
    name: "DeFi Position Monitor",
    description: "Continuous monitoring of DeFi positions across protocols. Alerts on liquidation risk, yield changes, and impermanent loss thresholds.",
    steps: [
      { name: "position-scanner", class: "RECON", cost: "$0.01" },
      { name: "risk-calculator", class: "CIPHER", cost: "$0.03" },
      { name: "alert-dispatcher", class: "GHOST", cost: "$0.01" },
    ],
    totalCost: "$0.05",
    avgEarnings: "$0.04",
    forks: 3421,
    successRate: "99.1%",
  },
  {
    id: "code-review",
    name: "Automated Code Review",
    description: "Multi-stage code review pipeline. Lints, checks for anti-patterns, validates test coverage, and produces a PR-ready review summary.",
    steps: [
      { name: "lint-runner", class: "FORGE", cost: "$0.01" },
      { name: "pattern-checker", class: "CIPHER", cost: "$0.04" },
      { name: "coverage-analyzer", class: "RECON", cost: "$0.02" },
      { name: "review-writer", class: "FORGE", cost: "$0.03" },
      { name: "quality-gate", class: "AEGIS", cost: "$0.02" },
    ],
    totalCost: "$0.12",
    avgEarnings: "$0.08",
    forks: 1876,
    successRate: "96.3%",
  },
  {
    id: "token-launch",
    name: "Token Launch Checklist",
    description: "End-to-end token launch validation. Verifies tokenomics, audits mint authority, checks liquidity pool setup, and validates metadata.",
    steps: [
      { name: "tokenomics-check", class: "RECON", cost: "$0.02" },
      { name: "authority-audit", class: "CIPHER", cost: "$0.06" },
      { name: "lp-validator", class: "CIPHER", cost: "$0.04" },
      { name: "metadata-check", class: "FORGE", cost: "$0.01" },
      { name: "launch-report", class: "AEGIS", cost: "$0.03" },
    ],
    totalCost: "$0.16",
    avgEarnings: "$0.11",
    forks: 654,
    successRate: "92.7%",
  },
];

/* ── Step visualization ─────────────────────────────────────────────── */
function StepChain({ steps }: { steps: BlueprintStep[] }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-1 flex-shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 border border-white/[0.04] bg-white/[0.015] hover:border-white/[0.08] transition-colors group">
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: CLASS_COLORS[step.class] || "#666" }}
            />
            <span className="text-[10px] font-medium text-white/40 group-hover:text-white/60 transition-colors whitespace-nowrap">
              {step.name}
            </span>
            <span className="text-[9px] font-medium text-white/15">{step.cost}</span>
          </div>
          {i < steps.length - 1 && (
            <svg width="12" height="8" viewBox="0 0 12 8" className="text-white/10 flex-shrink-0">
              <path d="M0 4H10M8 1L11 4L8 7" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Blueprint card ─────────────────────────────────────────────────── */
function BlueprintCard({ bp, index, inView }: { bp: Blueprint; index: number; inView: boolean }) {
  return (
    <div
      className={`border border-white/[0.04] bg-white/[0.01] p-4 sm:p-6 hover:border-white/[0.08] hover:bg-white/[0.008]`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-[15px] font-normal text-white/80 leading-tight">{bp.name}</h3>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[9px] font-medium text-white/15">{bp.steps.length} operators</span>
            <span className="text-[9px] font-medium text-white/15">{bp.forks.toLocaleString()} forks</span>
            <span className="text-[9px] font-medium text-zinc-300/40">{bp.successRate} success</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-[12px] text-white/30 leading-relaxed mb-4 line-clamp-2">{bp.description}</p>

      {/* Step chain */}
      <StepChain steps={bp.steps} />

      {/* Economics */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.04]">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[9px] font-medium text-white/15 tracking-wider">COST/RUN</div>
            <div className="text-[13px] font-medium text-white/50">{bp.totalCost}</div>
          </div>
          <div>
            <div className="text-[9px] font-medium text-white/15 tracking-wider">CREATOR EARNS</div>
            <div className="text-[13px] font-medium text-zinc-300/60">{bp.avgEarnings}</div>
          </div>
        </div>
        <button className="text-[10px] font-medium text-white/20 border border-white/[0.04] px-3 py-1.5 hover:text-zinc-300 hover:border-white/[0.08] transition-all">
          FORK
        </button>
      </div>
    </div>
  );
}

/* ── Operator class legend ──────────────────────────────────────────── */
function ClassLegend() {
  return (
    <div className="flex flex-wrap gap-4">
      {Object.entries(CLASS_COLORS).map(([cls, color]) => (
        <div key={cls} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span className="text-[10px] font-medium text-white/25">{cls}</span>
          <span className="text-[9px] font-medium text-white/12">{CLASS_LABELS[cls]}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Main section ───────────────────────────────────────────────────── */
export default function MissionBlueprints() {
  const { ref, inView } = useInView(0.05);
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? BLUEPRINTS : BLUEPRINTS.slice(0, 4);

  return (
    <section id="blueprints" className="py-16 sm:py-32 lg:py-40 border-t border-white/[0.04]" ref={ref}>
      <div className="container">
        <SectionLabel text="MISSION BLUEPRINTS" />

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16">
          <div className={``}>
            <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] font-normal text-white leading-[1.05] tracking-tight">
              Pre-built Pipelines.
              <br className="hidden lg:block" />
              <span className="text-white/35 font-normal">Fork. Customize. Deploy.</span>
            </h2>
          </div>
          <p className={`text-[14px] text-white/30 max-w-md leading-relaxed lg:text-right`}>
            Chain operators into missions with real-time cost tracking.
            Every blueprint shows exactly what it costs and what it earns.
          </p>
        </div>

        {/* Class legend */}
        <div className={`mb-10`}>
          <ClassLegend />
        </div>

        {/* Blueprint grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {visible.map((bp, i) => (
            <BlueprintCard key={bp.id} bp={bp} index={i} inView={inView} />
          ))}
        </div>

        {/* Show more */}
        {!showAll && BLUEPRINTS.length > 4 && (
          <div className={`mt-8 text-center`}>
            <button
              onClick={() => setShowAll(true)}
              className="text-[12px] font-medium text-white/20 border border-white/[0.04] px-6 py-2.5 hover:text-zinc-300 hover:border-white/[0.08] transition-all"
            >
              VIEW ALL {BLUEPRINTS.length} BLUEPRINTS
            </button>
          </div>
        )}

        {/* Economics summary */}
        <div className={`mt-8 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-6 sm:pt-10 border-t border-white/[0.04]`}>
          <div>
            <div className="text-2xl font-normal text-white/80 tracking-tight">{BLUEPRINTS.length}</div>
            <div className="text-[10px] font-medium text-white/20 mt-1">BLUEPRINTS</div>
          </div>
          <div>
            <div className="text-2xl font-normal text-white/80 tracking-tight">{BLUEPRINTS.reduce((a, b) => a + b.forks, 0).toLocaleString()}</div>
            <div className="text-[10px] font-medium text-white/20 mt-1">TOTAL FORKS</div>
          </div>
          <div>
            <div className="text-2xl font-normal text-zinc-300/70 tracking-tight">$0.13</div>
            <div className="text-[10px] font-medium text-white/20 mt-1">AVG COST/RUN</div>
          </div>
          <div>
            <div className="text-2xl font-normal text-zinc-300/70 tracking-tight">95.3%</div>
            <div className="text-[10px] font-medium text-white/20 mt-1">AVG SUCCESS RATE</div>
          </div>
        </div>
      </div>
    </section>
  );
}
