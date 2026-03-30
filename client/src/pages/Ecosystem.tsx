import Navbar from "@/components/Navbar";
import { NvidiaEyeLogo } from "@/components/NvidiaLogo";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/sections/Footer";

const STACK_LAYERS = [
  {
    name: "Settlement",
    protocol: "Solana",
    role: "400ms finality, sub-cent transactions, 49% of x402 volume",
    aegis: "All Aegis transactions settle here. Bonds, slashing, revenue splits.",
    highlight: false,
  },
  {
    name: "Payments",
    protocol: "x402 (Coinbase)",
    role: "HTTP-native micropayments. 100M+ payment flows processed.",
    aegis: "Every operator invocation is an x402 payment. USDC in, $AEGIS out.",
    highlight: false,
  },
  {
    name: "Trust",
    protocol: "Aegis Protocol",
    role: "Bonded validation, on-chain reputation, economic slashing.",
    aegis: "THE MISSING LAYER. Between 'services exist' and 'services are trustworthy.'",
    highlight: true,
  },
  {
    name: "Discovery",
    protocol: "MCP (Linux Foundation)",
    role: "97M monthly SDK downloads. Standard for agent-to-tool communication.",
    aegis: "Agents discover Aegis operators via MCP. Server Cards enable auto-discovery.",
    highlight: false,
  },
  {
    name: "Communication",
    protocol: "A2A (Google)",
    role: "Agent-to-agent protocol. Multi-agent collaboration.",
    aegis: "A2A agents use Aegis to verify operator quality before delegation.",
    highlight: false,
  },
  {
    name: "Identity",
    protocol: "ERC-8004 / 8004-Solana",
    role: "On-chain agent identity. Metaplex Core NFTs with reputation.",
    aegis: "Identity says WHO you are. Aegis says HOW GOOD you are.",
    highlight: false,
  },
  {
    name: "AI Infra",
    protocol: "NVIDIA NeMo",
    role: "Full agent lifecycle: guardrails, evaluation, NIM deployment, RL optimization.",
    aegis: "7 NeMo pillars baked into every operator. Enterprise AI at protocol level.",
    highlight: true,
  },
];

const INTEGRATIONS = [
  {
    category: "Payment Protocols",
    items: [
      { name: "x402 V2", status: "Integrated", desc: "Reusable sessions, multi-chain, service discovery" },
      { name: "Google AP2", status: "Compatible", desc: "Integrates x402 for stablecoin payments" },
      { name: "Stripe ACP", status: "Compatible", desc: "x402 payments on Base" },
    ],
  },
  {
    category: "Agent Frameworks",
    items: [
      { name: "ElizaOS", status: "Compatible", desc: "50K+ deployed agents, 90+ plugins" },
      { name: "Solana Agent Kit", status: "Integrated", desc: "60+ pre-built blockchain actions" },
      { name: "Claude Code / Codex", status: "Compatible", desc: "MCP-native agent interfaces" },
    ],
  },
  {
    category: "AI Infrastructure",
    items: [
      { name: "NVIDIA NeMo Guardrails", status: "Integrated", desc: "5-layer safety rails on every invocation" },
      { name: "NVIDIA NeMo Evaluator", status: "Integrated", desc: "Automated success scoring via continuous benchmarks" },
      { name: "NVIDIA NIM", status: "Integrated", desc: "GPU-optimized inference containers for operators" },
      { name: "Nemotron Foundation Models", status: "Integrated", desc: "Nano/Super/Ultra model tiers for operators" },
      { name: "NeMo Curator", status: "Integrated", desc: "Data quality pipeline for operator training" },
      { name: "NeMo RL + Gym", status: "Integrated", desc: "Continuous improvement via reinforcement learning" },
    ],
  },
  {
    category: "Standards Bodies",
    items: [
      { name: "NIST CAISI", status: "Engaging", desc: "AI Agent Standards Initiative, concept paper due April 2" },
      { name: "MCP Server Cards", status: "Planned", desc: "Auto-discovery via .well-known URL" },
      { name: "Agentic AI Foundation", status: "Tracking", desc: "Linux Foundation governance for MCP" },
    ],
  },
];

const MARKET_PLAYERS = [
  {
    name: "Visa",
    what: "Trusted Agent Protocol",
    role: "Authenticates the BUYER",
    relationship: "Complementary",
  },
  {
    name: "Mastercard",
    what: "Agent Pay",
    role: "Authenticates the BUYER",
    relationship: "Complementary",
  },
  {
    name: "Aegis",
    what: "Bonded Validation",
    role: "Validates the SELLER",
    relationship: "The missing piece",
  },
];

export default function Ecosystem() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 border-b border-white/[0.07]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="text-[11px] font-medium tracking-wider text-zinc-300/40 mb-6">
            ECOSYSTEM
          </div>

          <h1 className="text-[clamp(2rem,5vw,3.75rem)] font-bold text-white leading-[1.05] tracking-tight mb-4">
            The economic operating system
            <br />
            <span className="text-white/30">for autonomous AI.</span>
          </h1>

          <p className="text-[15px] sm:text-[16px] text-white/35 max-w-2xl leading-relaxed">
            x402 handles payments. MCP handles discovery. A2A handles communication.
            ERC-8004 handles identity. But when an AI agent pays for a service,
            <span className="text-zinc-300/70 font-medium"> nothing verifies the service is any good</span>.
            Aegis sits in that exact gap.
          </p>
        </div>
      </section>

      {/* Protocol Stack */}
      <section className="py-16 sm:py-24 border-b border-white/[0.07]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-4xl">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            The protocol stack.
          </h2>
          <p className="text-[13px] text-white/25 mb-10">
            Where Aegis sits in the AI agent infrastructure.
          </p>

          <div className="space-y-0">
            {STACK_LAYERS.map((layer, i) => (
              <div
                key={layer.name}
                className={`p-5 sm:p-6 border border-white/[0.07] ${
                  i > 0 ? "border-t-0" : ""
                } ${
                  layer.highlight
                    ? "bg-white/[0.03] border-white/20"
                    : "hover:bg-white/[0.015]"
                } transition-all duration-300`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6">
                  <div className="shrink-0 w-24">
                    <div className={`text-[10px] font-medium tracking-wider uppercase ${
                      layer.highlight ? "text-zinc-300/60" : "text-white/20"
                    }`}>
                      {layer.name}
                    </div>
                    <div className={`text-[14px] font-normal mt-0.5 ${
                      layer.highlight ? "text-zinc-300" : "text-white/60"
                    }`}>
                      {layer.protocol}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] text-white/40 leading-relaxed mb-1">{layer.role}</p>
                    <p className={`text-[12px] leading-relaxed ${
                      layer.highlight ? "text-zinc-300/60 font-medium" : "text-white/20"
                    }`}>
                      {layer.aegis}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Buyer vs Seller */}
      <section className="py-16 sm:py-24 border-b border-white/[0.07]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-3xl">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Visa authenticates the buyer.
            <br />
            <span className="text-white/30">Aegis validates the seller.</span>
          </h2>
          <p className="text-[13px] text-white/25 mb-10">
            These are complementary, not competitive. Their entry validates the market.
          </p>

          <div className="grid grid-cols-3 gap-px bg-white/[0.06] border border-white/[0.07]">
            {MARKET_PLAYERS.map((player) => (
              <div
                key={player.name}
                className={`bg-white/[0.02] p-5 sm:p-6 ${
                  player.name === "Aegis" ? "bg-white/[0.03]" : ""
                }`}
              >
                <div className={`text-[16px] font-bold mb-1 ${
                  player.name === "Aegis" ? "text-zinc-300" : "text-white/60"
                }`}>
                  {player.name}
                </div>
                <div className="text-[12px] text-white/30 mb-3">{player.what}</div>
                <div className={`text-[13px] font-medium mb-2 ${
                  player.name === "Aegis" ? "text-zinc-300/80" : "text-white/50"
                }`}>
                  {player.role}
                </div>
                <div className="text-[11px] text-white/20 ">{player.relationship}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-16 sm:py-24 border-b border-white/[0.07]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-4xl">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-10">
            Integration map.
          </h2>

          <div className="space-y-8">
            {INTEGRATIONS.map((group) => (
              <div key={group.category}>
                <div className="text-[11px] font-medium text-white/20 tracking-wider uppercase mb-4 flex items-center gap-2">
                  {group.category === "AI Infrastructure" && <NvidiaEyeLogo size={14} className="text-[#76B900]" />}
                  {group.category}
                </div>
                <div className="space-y-0">
                  {group.items.map((item, i) => (
                    <div
                      key={item.name}
                      className={`flex items-center gap-4 sm:gap-6 p-4 border border-white/[0.07] ${
                        i > 0 ? "border-t-0" : ""
                      } hover:bg-white/[0.015] transition-all duration-300`}
                    >
                      <span className="text-[14px] font-medium text-white/60 w-40 shrink-0">{item.name}</span>
                      <span className={`text-[10px] font-medium tracking-wider px-2 py-0.5 shrink-0 ${
                        item.status === "Integrated"
                          ? "text-zinc-300 bg-white/[0.08]"
                          : item.status === "Compatible"
                          ? "text-zinc-300/60 bg-white/[0.04]"
                          : "text-white/30 bg-white/[0.03]"
                      }`}>
                        {item.status}
                      </span>
                      <span className="text-[13px] text-white/30">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-2xl text-center">
          <p className="text-[14px] text-white/30 leading-relaxed mb-6">
            The first protocol to own "trust for AI agents on Solana" wins a category
            that every analyst predicts will exist.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="/earn"
              className="inline-flex items-center gap-2 text-[13px] font-normal bg-white text-zinc-900 px-6 py-3.5 hover:bg-zinc-200 transition-all duration-300"
            >
              Start Earning
            </a>
            <a
              href="/research"
              className="inline-flex items-center gap-2 text-[13px] font-medium text-zinc-300/70 hover:text-zinc-300 border border-white/20 hover:border-white/40 px-6 py-3.5 transition-all duration-300"
            >
              Read the Research
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}
