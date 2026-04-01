import SectionLabel from "@/components/SectionLabel";
import { useInView } from "@/hooks/useInView";

interface Milestone {
  quarter: string;
  title: string;
  status: "done" | "active" | "planned";
  items: string[];
}

const MILESTONES: Milestone[] = [
  {
    quarter: "Q4 2025",
    title: "Research + Architecture",
    status: "done",
    items: [
      "Published whitepaper: bonded validation, x402 micropayments, deflationary tokenomics",
      "Designed PDA state architecture for Solana (operator, bond, reputation accounts)",
      "Analyzed 5 academic papers on agent quality, observation loops, and AI safety",
      "Competitive landscape mapped: ERC-8004, Warden, Olas, ElizaOS, operators.sh, ACP",
    ],
  },
  {
    quarter: "Q1 2026",
    title: "Protocol Design + Site Launch",
    status: "done",
    items: [
      "Aegis Protocol site launched with full documentation",
      "18 protocol primitives designed and documented",
      "Operator taxonomy: 5 classes (RECON, FORGE, CIPHER, AEGIS, GHOST)",
      "Mission Blueprints: 6 pre-built pipelines with economic projections",
      "Agent Economy Stack positioning: success layer between x402 (payment) and MCP (discovery)",
    ],
  },
  {
    quarter: "Q2 2026",
    title: "Devnet + Token Launch",
    status: "active",
    items: [
      "Deploy $AEGIS token on Solana devnet (Token-2022 with transfer hooks)",
      "Anchor program: operator registry, bond vault, reputation PDA",
      "x402 payment integration: USDC-to-$AEGIS swap on invocation",
      "CLI tool: agent-aegis register, invoke, validate, inspect",
      "Open source repository on GitHub (MIT license)",
    ],
  },
  {
    quarter: "Q3 2026",
    title: "Mainnet + Validator Corps",
    status: "planned",
    items: [
      "Mainnet deployment of $AEGIS token and registry program",
      "Validator Corps launch: bonded validation with slashing",
      "ERC-8004 bridge: cross-chain agent identity verification",
      "A2A protocol integration: success-gated agent-to-agent delegation",
      "Coinbase Agentic Wallet support",
    ],
  },
  {
    quarter: "Q4 2026",
    title: "Scale + Insurance",
    status: "planned",
    items: [
      "Scoped Invocation Bonds: pipeline-level escrow with auto-refund",
      "Aegis Insurance Fund: protocol-level consumer protection",
      "Prediction market dispute resolution",
      "Target: 1,000 bonded operators, 100 active validators",
      "First deflationary burn event",
    ],
  },
  {
    quarter: "2027",
    title: "Ecosystem Expansion",
    status: "planned",
    items: [
      "Validator-as-a-Service marketplace",
      "Cross-chain reputation portability (Solana, Ethereum, Base)",
      "NIST Agent Standards compliance certification",
      "Target: 10,000 bonded operators, $1M+ monthly x402 volume",
    ],
  },
];

const STATUS_CONFIG = {
  done: {
    dot: "bg-white",
    glow: "",
    line: "bg-white/30",
    label: "SHIPPED",
    labelColor: "text-zinc-300",
    labelBg: "bg-white/10",
  },
  active: {
    dot: "bg-amber-400",
    glow: "shadow-[0_0_8px_rgba(251,191,36,0.4)]",
    line: "bg-amber-400/30",
    label: "IN PROGRESS",
    labelColor: "text-amber-400",
    labelBg: "bg-amber-400/10",
  },
  planned: {
    dot: "bg-white/20",
    glow: "",
    line: "bg-white/[0.04]",
    label: "PLANNED",
    labelColor: "text-white/30",
    labelBg: "bg-white/[0.04]",
  },
};

export default function Roadmap() {
  const { ref, inView } = useInView(0.05);

  return (
    <section id="roadmap" className="py-16 sm:py-32 lg:py-40 border-t border-white/[0.04]" ref={ref}>
      <div className="container">
        <SectionLabel text="ROADMAP" />

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16">
          <h2
            className={`text-[clamp(2rem,4.5vw,3.5rem)] font-normal text-white leading-[1.05] tracking-tight`}
          >
            Deployment timeline.
            <br />
            <span className="text-white/30">Honest milestones.</span>
          </h2>
          <p
            className={`text-[14px] text-white/30 max-w-md leading-relaxed lg:text-right`}
          >
            What we have shipped, what we are building now, and what comes next.
            No vague promises. Concrete deliverables with target dates.
          </p>
        </div>

        {/* Timeline */}
        <div
          className={`relative`}
        >
          {MILESTONES.map((m, i) => {
            const config = STATUS_CONFIG[m.status];
            const isLast = i === MILESTONES.length - 1;

            return (
              <div key={m.quarter} className="relative flex gap-4 sm:gap-8 lg:gap-12">
                {/* Timeline spine */}
                <div className="flex flex-col items-center shrink-0 w-8">
                  {/* Dot */}
                  <div
                    className={`w-3 h-3 rounded-full ${config.dot} ${config.glow} mt-1.5 z-10 relative`}
                  />
                  {/* Line */}
                  {!isLast && (
                    <div className={`w-px flex-1 ${config.line}`} />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-8 sm:pb-12 lg:pb-16 flex-1 ${isLast ? "pb-0" : ""}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[13px] font-medium text-white/50 tracking-wider">
                      {m.quarter}
                    </span>
                    <span
                      className={`text-[10px] font-medium tracking-wider px-2 py-0.5 rounded ${config.labelColor} ${config.labelBg}`}
                    >
                      {config.label}
                    </span>
                  </div>

                  <h3
                    className={`text-[18px] font-normal mb-4 ${
                      m.status === "done"
                        ? "text-white/60"
                        : m.status === "active"
                        ? "text-amber-400/90"
                        : "text-white/35"
                    }`}
                  >
                    {m.title}
                  </h3>

                  <ul className="space-y-2">
                    {m.items.map((item, j) => (
                      <li
                        key={j}
                        className={`flex items-start gap-3 text-[13px] leading-relaxed ${
                          m.status === "done"
                            ? "text-white/30"
                            : m.status === "active"
                            ? "text-white/40"
                            : "text-white/20"
                        }`}
                      >
                        <span
                          className={`w-1 h-1 rounded-full mt-2 shrink-0 ${
                            m.status === "done"
                              ? "bg-white/40"
                              : m.status === "active"
                              ? "bg-amber-400/40"
                              : "bg-white/10"
                          }`}
                        />
                        {m.status === "done" ? (
                          <span className="line-through decoration-white/10">{item}</span>
                        ) : (
                          item
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <div
          className={`mt-8 sm:mt-12 p-4 sm:p-6 border border-white/[0.04] bg-white/[0.01]`}
        >
          <div className="text-[10px] font-medium text-white/15 tracking-wider mb-2">TRANSPARENCY NOTE</div>
          <p className="text-[13px] text-white/25 leading-relaxed">
            This roadmap reflects our current plan and may change based on ecosystem developments,
            technical constraints, and community feedback. We will update it publicly as milestones
            are hit or timelines shift. No vaporware. No moving goalposts without disclosure.
          </p>
        </div>
      </div>
    </section>
  );
}
