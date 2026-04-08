import SectionLabel from "@/components/SectionLabel";
import { useInView } from "@/hooks/useInView";
import { useState } from "react";

interface StackLayer {
  id: string;
  label: string;
  protocol: string;
  status: string;
  statusColor: string;
  desc: string;
  isAegis: boolean;
  stats: string;
}

const STACK: StackLayer[] = [
  {
    id: "application",
    label: "APPLICATION",
    protocol: "AegisX, Codex CLI, ChatGPT, Cursor",
    status: "LIVE",
    statusColor: "text-zinc-300/80",
    desc: "End-user AI agents that invoke tools, write code, and execute tasks autonomously. Over 100M weekly active users across platforms.",
    isAegis: false,
    stats: "100M+ weekly users",
  },
  {
    id: "orchestration",
    label: "ORCHESTRATION",
    protocol: "ElizaOS, LangChain, CrewAI, AutoGen",
    status: "LIVE",
    statusColor: "text-zinc-300/80",
    desc: "Multi-agent frameworks that coordinate task delegation, memory, and tool routing. ElizaOS alone has 50K+ deployed agents.",
    isAegis: false,
    stats: "50K+ deployed agents",
  },
  {
    id: "success",
    label: "SUCCESS + VALIDATION",
    protocol: "Aegis Protocol",
    status: "BUILDING",
    statusColor: "text-zinc-300",
    desc: "Bonded validation, on-chain quality, slashing, insurance, and dispute resolution. The layer that answers: should I use this operator? ERC-8004 defined identity but explicitly left validation as 'a design space.' Aegis fills that gap.",
    isAegis: true,
    stats: "The skills marketplace",
  },
  {
    id: "payment",
    label: "PAYMENT",
    protocol: "x402 (Coinbase, Stripe, Cloudflare)",
    status: "LIVE",
    statusColor: "text-zinc-300/80",
    desc: "HTTP-native micropayments. 75M+ transactions processed, $24M 30-day volume. Solana controls 49% market share. Agents pay per-invocation via standard HTTP 402 responses.",
    isAegis: false,
    stats: "75M+ txns, $24M vol",
  },
  {
    id: "identity",
    label: "IDENTITY + DISCOVERY",
    protocol: "MCP (Anthropic), A2A (Google/IBM), ERC-8004",
    status: "LIVE",
    statusColor: "text-zinc-300/80",
    desc: "Tool discovery via MCP. Agent-to-agent communication via A2A. On-chain identity via ERC-8004 (10K+ agents registered). Solana AI Agent Registry launched on mainnet March 3, 2026 with 9K+ agents. NIST launched an Agent Standards Initiative in Feb 2026.",
    isAegis: false,
    stats: "19K+ registered agents",
  },
  {
    id: "settlement",
    label: "SETTLEMENT",
    protocol: "Solana, Ethereum, Base",
    status: "LIVE",
    statusColor: "text-zinc-300/80",
    desc: "On-chain settlement for payments, bonds, and quality. Solana: 400ms finality, $0.00025/tx, 4K TPS. Token-2022 transfer hooks enforce bonds at the protocol level.",
    isAegis: false,
    stats: "400ms finality",
  },
];

export default function AgentStack() {
  const { ref, inView } = useInView(0.05);
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);
  const activeLayer = STACK.find((l) => l.id === hoveredLayer) || STACK.find((l) => l.isAegis)!;

  return (
    <section id="stack" className="py-16 sm:py-32 lg:py-40 border-t border-white/[0.04]" ref={ref}>
      <div className="container">
        <SectionLabel text="INFRASTRUCTURE" />

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16">
          <h2
            className={`text-[clamp(2rem,4.5vw,3.5rem)] font-normal text-white leading-[1.05] tracking-tight`}
          >
            The Agent Economy Stack.
            <br />
            <span className="text-white/30">Five layers. One gap.</span>
          </h2>
          <p
            className={`text-[14px] text-white/30 max-w-md leading-relaxed lg:text-right`}
          >
            Discovery, communication, payment, identity, and settlement are all shipping.
            The success and validation layer is still missing. That is where Aegis sits.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-16">
          {/* Stack visualization */}
          <div
            className={``}
          >
            <div className="space-y-1">
              {STACK.map((layer, i) => {
                const isHovered = hoveredLayer === layer.id;
                const isDefault = !hoveredLayer && layer.isAegis;
                const isActive = isHovered || isDefault;

                return (
                  <div
                    key={layer.id}
                    className={`relative group cursor-pointer transition-all duration-300 ${
                      isActive
                        ? layer.isAegis
                          ? "bg-white/[0.04] border border-white/[0.08]"
                          : "bg-white/[0.04] border border-white/[0.04]"
                        : "bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.015]"
                    }`}
                    style={{ transitionDelay: `${i * 60}ms` }}
                    onMouseEnter={() => setHoveredLayer(layer.id)}
                    onMouseLeave={() => setHoveredLayer(null)}
                  >
                    <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4">
                      <div className="flex items-center gap-4">
                        {/* Layer number */}
                        <span
                          className={`text-[11px] font-medium tracking-wider w-6 transition-colors duration-300 ${
                            isActive && layer.isAegis
                              ? "text-zinc-300"
                              : isActive
                              ? "text-white/60"
                              : "text-white/15"
                          }`}
                        >
                          L{STACK.length - i}
                        </span>

                        {/* Layer name */}
                        <span
                          className={`text-[11px] sm:text-[13px] font-medium tracking-wider transition-colors duration-300 ${
                            isActive && layer.isAegis
                              ? "text-zinc-300"
                              : isActive
                              ? "text-white/80"
                              : "text-white/35"
                          }`}
                        >
                          {layer.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Status */}
                        <span
                          className={`text-[10px] font-medium tracking-wider ${layer.statusColor} ${
                            isActive ? "opacity-100" : "opacity-40"
                          } duration-300`}
                        >
                          {layer.status}
                        </span>

                        {/* Indicator */}
                        <span
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            layer.isAegis
                              ? isActive
                                ? "bg-white "
                                : "bg-white/30"
                              : isActive
                              ? "bg-white"
                              : "bg-white/10"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Aegis marker */}
                    {layer.isAegis && (
                      <div
                        className={`absolute -left-px top-0 bottom-0 w-[3px] transition-all duration-300 ${
                          isActive ? "bg-white" : "bg-white/20"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Connection lines hint */}
            <div className="mt-4 sm:mt-6 flex items-center gap-3">
              <span className="text-[10px] font-medium text-white/15 tracking-wider">TAP TO EXPLORE</span>
              <div className="flex-1 h-px bg-white/[0.04]" />
            </div>
          </div>

          {/* Detail panel */}
          <div
            className={``}
          >
            <div
              className={`p-5 sm:p-8 lg:p-10 border transition-all duration-300 ${
                activeLayer.isAegis
                  ? "border-white/20 bg-white/[0.015]"
                  : "border-white/[0.04] bg-white/[0.015]"
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <div
                  className={`text-[11px] font-medium tracking-wider ${
                    activeLayer.isAegis ? "text-zinc-300/60" : "text-white/20"
                  }`}
                >
                  {activeLayer.label}
                </div>
                <span
                  className={`text-[10px] font-medium tracking-wider px-2.5 py-1 rounded ${
                    activeLayer.isAegis
                      ? "bg-white/[0.04] text-zinc-300"
                      : "bg-white/[0.04] text-zinc-300/80"
                  }`}
                >
                  {activeLayer.status}
                </span>
              </div>

              <h3
                className={`text-[18px] sm:text-[22px] font-normal mb-3 ${
                  activeLayer.isAegis ? "text-zinc-300" : "text-white/85"
                }`}
              >
                {activeLayer.protocol}
              </h3>

              <p className="text-[14px] text-white/40 leading-relaxed mb-8">
                {activeLayer.desc}
              </p>

              <div className="flex items-center justify-between pt-6 border-t border-white/[0.04]">
                <span className="text-[12px] font-medium text-white/20">{activeLayer.stats}</span>
                {activeLayer.isAegis && (
                  <a
                    href="/docs"
                    className="text-[12px] font-medium text-zinc-300/60 hover:text-zinc-300 transition-colors"
                  >
                    Read the docs →
                  </a>
                )}
              </div>
            </div>

            {/* Key insight */}
            <div className="mt-4 sm:mt-6 p-4 sm:p-6 border border-white/[0.04] bg-white/[0.01]">
              <div className="text-[10px] font-medium text-white/15 tracking-wider mb-3">KEY INSIGHT</div>
              <p className="text-[13px] text-white/30 leading-relaxed">
                February 11, 2026 was{" "}
                <span className="text-white/50">Agent Infrastructure Day</span>. Coinbase launched
                Agentic Wallets. Stripe launched x402 payments. Cloudflare shipped Markdown for Agents.
                NIST launched an Agent Standards Initiative. Every layer is shipping except success.
                That is the gap Aegis fills.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
