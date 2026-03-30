import SectionLabel from "@/components/SectionLabel";
import { useInView } from "@/hooks/useInView";
import { useState } from "react";

const COMPETITORS = [
  { name: "Aegis Protocol", highlight: true, tag: "Pre-launch", chain: "Solana" },
  { name: "ERC-8004", highlight: false, tag: "Ethereum Std", chain: "Ethereum" },
  { name: "Warden", highlight: false, tag: "$WARD", chain: "Own L1" },
  { name: "operators.sh", highlight: false, tag: "Vercel Labs", chain: "N/A" },
  { name: "Olas / Autonolas", highlight: false, tag: "$OLAS", chain: "Multi" },
  { name: "ElizaOS", highlight: false, tag: "$ELIZAOS", chain: "Multi" },
  { name: "ACP (Stripe)", highlight: false, tag: "Fiat Rails", chain: "N/A" },
  { name: "Virtuals", highlight: false, tag: "$VIRTUAL", chain: "Base" },
  { name: "SkillMarket", highlight: false, tag: "Registry", chain: "N/A" },
];

type CellValue = true | false | "partial";

interface CriteriaRow {
  label: string;
  values: CellValue[];
  aegisStatus: "live" | "dev" | "design";
}

const CRITERIA: CriteriaRow[] = [
  { label: "Agent Identity Registry", values: [true, true, true, false, false, false, false, false, false], aegisStatus: "dev" },
  { label: "On-Chain Reputation", values: [true, true, "partial", false, false, false, false, "partial", false], aegisStatus: "design" },
  { label: "Validation Registry (Active)", values: [true, false, false, false, false, false, false, false, false], aegisStatus: "design" },
  { label: "Bonded Validation + Slashing", values: [true, false, false, false, false, false, false, false, false], aegisStatus: "design" },
  { label: "x402 Micropayments", values: [true, false, false, false, false, false, false, true, false], aegisStatus: "dev" },
  { label: "Sub-Cent Settlement", values: [true, false, false, false, false, false, false, true, false], aegisStatus: "dev" },
  { label: "Creator Revenue Split", values: [true, false, false, false, false, false, false, true, false], aegisStatus: "design" },
  { label: "Deflationary Token Burn", values: [true, false, false, false, false, false, false, false, false], aegisStatus: "design" },
  { label: "MCP + A2A Compatible", values: [true, "partial", true, true, false, true, false, false, "partial"], aegisStatus: "dev" },
  { label: "Operator-Level Granularity", values: [true, false, false, true, false, false, "partial", true, "partial"], aegisStatus: "dev" },
  { label: "Multi-Agent Orchestration", values: [true, false, true, false, true, true, false, true, false], aegisStatus: "design" },
  { label: "Agentic Wallet Support", values: [true, false, true, false, false, false, true, false, false], aegisStatus: "design" },
  { label: "Scoped Invocation Bonds", values: [true, false, false, false, false, false, false, false, false], aegisStatus: "design" },
  { label: "Insurance Fund", values: [true, false, false, false, false, false, false, false, false], aegisStatus: "design" },
  { label: "Dispute Resolution", values: [true, false, false, false, false, false, false, false, false], aegisStatus: "design" },
  { label: "Open Source", values: [true, true, true, true, true, true, true, false, true], aegisStatus: "dev" },
  { label: "Crypto-Native Payments", values: [true, false, true, false, true, false, false, true, false], aegisStatus: "dev" },
  { label: "Security Audits", values: [true, false, false, "partial", false, false, false, false, false], aegisStatus: "design" },
  { label: "Quality Enforcement", values: [true, false, false, false, false, false, false, false, false], aegisStatus: "design" },
];

const STATUS_LABELS: Record<CriteriaRow["aegisStatus"], { text: string; color: string; bg: string }> = {
  live: { text: "Live", color: "text-zinc-300", bg: "bg-white/10" },
  dev: { text: "In Dev", color: "text-amber-400", bg: "bg-amber-400/10" },
  design: { text: "Designed", color: "text-white/30", bg: "bg-white/[0.04]" },
};

const MARKET_DATA = [
  { label: "Valuation", values: ["Pre-launch", "N/A (EIP)", "$200M", "N/A", "~$9.5M", "~$180M", "N/A", "$508M", "N/A"] },
  { label: "Agents / Users", values: ["Pre-launch", "10K+ agents", "Early", "82K+ ops", "3.2K DAAs", "50K+ agents", "ChatGPT", "25K wkly txns", "351K skills"] },
  { label: "Chain", values: ["Solana", "Ethereum", "Own L1", "Off-chain", "Multi", "Multi", "Off-chain", "Base", "N/A"] },
  { label: "x402 Support", values: ["Native", "Via bridge", "Planned", "None", "None", "None", "Fiat only", "Native", "None"] },
  { label: "Success Layer", values: ["Bonded", "Identity only", "Planned", "None", "None", "None", "None", "None", "None"] },
];

const SCORES = COMPETITORS.map((_, ci) =>
  CRITERIA.reduce((sum, row) => sum + (row.values[ci] === true ? 1 : row.values[ci] === "partial" ? 0.5 : 0), 0)
);

export default function Competitive() {
  const { ref, inView } = useInView(0.05);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [showMarketData, setShowMarketData] = useState(false);

  const liveCount = CRITERIA.filter((r) => r.aegisStatus === "live").length;
  const devCount = CRITERIA.filter((r) => r.aegisStatus === "dev").length;
  const designCount = CRITERIA.filter((r) => r.aegisStatus === "design").length;

  return (
    <section id="competitive" className="py-16 sm:py-32 lg:py-40 border-t border-white/[0.07]" ref={ref}>
      <div className="container">
        <SectionLabel text="LANDSCAPE" />
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <h2 className={`text-[clamp(2rem,4.5vw,3.5rem)] font-bold text-white leading-[1.05] tracking-tight`}>
            Named competitors.<br />
            <span className="text-white/30">Honest comparison.</span>
          </h2>
          <p className={`text-[14px] text-white/30 max-w-md leading-relaxed lg:text-right`}>
            The actual projects building in the AI agent economy.
            The Status column shows what Aegis has shipped vs. what is still in development.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setShowMarketData(false)}
            className={`px-4 py-2 text-[12px] font-medium tracking-wider rounded transition-all ${!showMarketData ? "bg-white/10 text-zinc-300 border border-white/20" : "bg-white/[0.03] text-white/30 border border-white/[0.07] hover:text-white/50"}`}
          >
            FEATURES
          </button>
          <button
            onClick={() => setShowMarketData(true)}
            className={`px-4 py-2 text-[12px] font-medium tracking-wider rounded transition-all ${showMarketData ? "bg-white/10 text-zinc-300 border border-white/20" : "bg-white/[0.03] text-white/30 border border-white/[0.07] hover:text-white/50"}`}
          >
            MARKET DATA
          </button>
        </div>

        {/* Table */}
        <div className={`overflow-x-auto`}>
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="text-left py-4 pr-6 text-[11px] font-medium text-white/20 tracking-wider w-[220px]">
                  {showMarketData ? "METRIC" : "CAPABILITY"}
                </th>
                {!showMarketData && (
                  <th className="text-center py-4 px-2 text-[11px] font-medium text-white/20 tracking-wider w-[80px]">
                    STATUS
                  </th>
                )}
                {COMPETITORS.map((c, i) => (
                  <th key={i} className="text-center py-4 px-2 min-w-[100px]">
                    <div className={`text-[12px] font-normal tracking-tight ${c.highlight ? "text-zinc-300" : "text-white/60"}`}>
                      {c.name}
                    </div>
                    <div className="text-[10px] font-medium text-white/20 mt-0.5">{c.tag}</div>
                    <div className="text-[9px] font-medium text-white/10 mt-0.5">{c.chain}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!showMarketData ? CRITERIA.map((row, ri) => {
                const status = STATUS_LABELS[row.aegisStatus];
                return (
                  <tr
                    key={ri}
                    className={`border-b border-white/[0.04] transition-colors duration-200 ${hoveredRow === ri ? "bg-white/[0.02]" : ""}`}
                    onMouseEnter={() => setHoveredRow(ri)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td className="py-3.5 pr-6 text-[13px] text-white/50 font-medium">{row.label}</td>
                    <td className="text-center py-3.5 px-2">
                      <span className={`inline-block text-[10px] font-medium tracking-wider px-2 py-0.5 rounded ${status.color} ${status.bg}`}>
                        {status.text}
                      </span>
                    </td>
                    {row.values.map((v, ci) => (
                      <td key={ci} className="text-center py-3.5 px-2">
                        {v === true ? (
                          <span className={`inline-block w-5 h-5 rounded-full ${COMPETITORS[ci].highlight ? "bg-white/20 text-zinc-300" : "bg-white/10 text-white/60"} text-[11px] leading-5 font-bold`}>
                            {"\u2713"}
                          </span>
                        ) : v === "partial" ? (
                          <span className="inline-block w-5 h-5 rounded-full bg-amber-500/10 text-amber-400/60 text-[11px] leading-5">
                            ~
                          </span>
                        ) : (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/10" />
                        )}
                      </td>
                    ))}
                  </tr>
                );
              }) : MARKET_DATA.map((row, ri) => (
                <tr
                  key={ri}
                  className={`border-b border-white/[0.04] transition-colors duration-200 ${hoveredRow === ri ? "bg-white/[0.02]" : ""}`}
                  onMouseEnter={() => setHoveredRow(ri)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td className="py-3.5 pr-6 text-[13px] text-white/50 font-medium">{row.label}</td>
                  {row.values.map((v, ci) => (
                    <td key={ci} className={`text-center py-3.5 px-2 text-[12px] font-medium ${COMPETITORS[ci].highlight ? "text-zinc-300/80" : "text-white/40"}`}>
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Score bar + status legend */}
          {!showMarketData && (
            <>
              <div className="flex items-center mt-6 pt-6 border-t border-white/[0.07]">
                <div className="w-[220px] pr-6 text-[11px] font-medium text-white/20 tracking-wider">SCORE</div>
                <div className="w-[80px]" />
                {SCORES.map((s, i) => (
                  <div key={i} className="flex-1 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-1 rounded-full bg-white/[0.06] flex-1 max-w-[60px] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${COMPETITORS[i].highlight ? "bg-white" : "bg-white/20"}`}
                          style={{ width: `${(s / CRITERIA.length) * 100}%` }}
                        />
                      </div>
                      <span className={`text-[14px] font-normal ${COMPETITORS[i].highlight ? "text-zinc-300" : "text-white/30"}`}>
                        {s}/{CRITERIA.length}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status legend */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-4 pt-4 border-t border-white/[0.03]">
                <span className="text-[10px] font-medium text-white/15 tracking-wider">AEGIS STATUS:</span>
                <span className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-300/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  Live ({liveCount})
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-medium text-amber-400/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  In Development ({devCount})
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-medium text-white/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/25" />
                  Designed ({designCount})
                </span>
              </div>
            </>
          )}
        </div>

        {/* Bottom insight -- honest framing */}
        <div className={`mt-8 sm:mt-16 p-4 sm:p-8 bg-white/[0.02] border border-white/[0.07] rounded`}>
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1">
              <div className="text-[11px] font-medium text-white/20 tracking-wider mb-3">HONEST ASSESSMENT</div>
              <p className="text-[14px] text-white/40 leading-relaxed">
                Aegis is <span className="text-white/60">pre-launch</span>. The feature set is designed and partially in development, not fully deployed.
                ERC-8004 is <span className="text-white/60">live on Ethereum mainnet</span> with 10K+ agents registered, but its Validation Registry is explicitly unfinished, described as "a design space."
                Warden Protocol raised at a <span className="text-white/60">$200M valuation</span> but is building an entire L1 chain (heavier, slower to ship).
                ElizaOS has <span className="text-white/60">50K+ deployed agents</span> but zero success infrastructure.
                What Aegis is building is the active validation layer that ERC-8004 left unfinished, on the chain that controls <span className="text-white/60">49% of x402 payments</span>.
                ERC-8004 is the identity card. Aegis is the credit bureau.
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[28px] sm:text-[36px] font-bold text-zinc-300 tracking-tight">{SCORES[0]}/{CRITERIA.length}</div>
              <div className="text-[11px] font-medium text-white/20">PLANNED COVERAGE</div>
              <div className="text-[10px] text-white/12 mt-1">vs next best: {Math.max(...SCORES.slice(1))}/{CRITERIA.length}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
