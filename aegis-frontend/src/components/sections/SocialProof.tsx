import { motion } from "framer-motion";
import { fadeInView } from "@/lib/animations";
import { LogoBar } from "@/components/BrandLogos";

const PROTOCOL_STACK = [
  { name: "Solana", role: "Settlement" },
  { name: "x402", role: "Payments" },
  { name: "MCP", role: "Discovery" },
  { name: "A2A", role: "Communication" },
  { name: "ERC-8004", role: "Identity" },
];

const MARKET_VALIDATION = [
  {
    name: "Visa",
    detail: "Verified Agent Protocol. 100+ partners. Millions of agent purchases predicted by 2026 holidays.",
    role: "Authenticates the buyer",
  },
  {
    name: "Mastercard",
    detail: "Agent Pay. Rolled out to all US cardholders. Agentic Tokens for dynamic credentials.",
    role: "Authenticates the buyer",
  },
  {
    name: "Google AP2",
    detail: "Agent Payments Protocol. Integrates x402 for stablecoin payments. Backed by PayPal, Coinbase, Shopify.",
    role: "Payment rails",
  },
  {
    name: "NIST",
    detail: "AI Agent Standards Initiative. Concept paper due April 2. Explicitly calling for quality solutions.",
    role: "Federal standards",
  },
];

const COMPATIBLE_WITH = [
  "AegisX",
  "Codex CLI",
  "ChatGPT",
  "Cursor",
  "ElizaOS",
  "Solana Agent Kit",
];

/* Trending repos that prove the market gap */
const TRENDING_REPOS = [
  {
    name: "Agency Agents",
    stars: "49.8k",
    desc: "Organizes AI agents into divisions. No monetization layer.",
  },
  {
    name: "MiroFish",
    stars: "25.1k",
    desc: "Swarm intelligence with thousands of agents. No payment rails.",
  },
  {
    name: "PromptFoo",
    stars: "16.9k",
    desc: "LLM testing and red teaming. No marketplace for results.",
  },
  {
    name: "Composio",
    stars: "4.5k",
    desc: "Orchestrates fleets of coding agents. No skill economy.",
  },
  {
    name: "OpenViking",
    stars: "14.5k",
    desc: "File system paradigm for agent context. No revenue model.",
  },
  {
    name: "NanoChat",
    stars: "49.1k",
    desc: "Minimal LLM training on single GPU. No way to sell the output.",
  },
];

export default function SocialProof() {
  return (
    <section className="py-24 sm:py-32 border-t border-white/[0.04]">
      <div className="container">
        {/* Section label */}
        <motion.div {...fadeInView}>
          <div className="flex items-center gap-2 mb-6">
            <span className="w-1.5 h-1.5 bg-white/60 rounded-full" />
            <span className="text-[11px] font-medium tracking-wider uppercase text-white/30">
              MARKET VALIDATION
            </span>
          </div>

          <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-normal text-white leading-[1.1] tracking-tight mb-4">
            Everyone is building payments and identity.
            <br />
            <span className="text-white/30">Nobody has solved quality.</span>
          </h2>

          <p className="text-[14px] sm:text-[15px] text-white/30 max-w-2xl leading-relaxed mb-12 sm:mb-16">
            Visa authenticates the buyer. Mastercard authenticates the buyer.
            Aegis validates the <span className="text-zinc-300/70 font-medium">seller</span>.
            These are complementary, not competitive.
          </p>
        </motion.div>

        {/* Market validation cards */}
        <div className="grid sm:grid-cols-2 gap-px bg-white/[0.04] border border-white/[0.04] mb-12 sm:mb-16">
          {MARKET_VALIDATION.map((item) => (
            <div
              key={item.name}
              className="bg-white/[0.015] p-5 sm:p-7 hover:bg-white/[0.015] transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[15px] sm:text-[16px] font-normal text-white/80">
                  {item.name}
                </span>
                <span className="text-[10px] font-medium tracking-wider text-zinc-300/40 uppercase">
                  {item.role}
                </span>
              </div>
              <p className="text-[13px] text-white/30 leading-relaxed">
                {item.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Trending repos: the market gap */}
        <motion.div {...fadeInView} className="mb-12 sm:mb-16">
          <div className="text-[11px] font-medium text-white/20 tracking-wider uppercase mb-5">
            The biggest agent projects have no monetization layer
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TRENDING_REPOS.map((repo) => (
              <div
                key={repo.name}
                className="border border-white/[0.04] bg-white/[0.01] p-4 hover:border-white/[0.08] transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-normal text-zinc-300 group-hover:text-white transition-colors">
                    {repo.name}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-600">
                    {repo.stars} stars
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-relaxed">
                  {repo.desc}
                </p>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-zinc-600 mt-4 max-w-xl">
            Combined: 160k+ stars. Zero revenue infrastructure. Aegis is the missing layer that turns open source skills into income streams.
          </p>
        </motion.div>

        {/* Protocol stack */}
        <div className="mb-12 sm:mb-16">
          <div className="text-[11px] font-medium text-white/20 tracking-wider uppercase mb-5">
            Built on proven infrastructure
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-8">
            {PROTOCOL_STACK.map((proto) => (
              <div key={proto.name} className="flex items-center gap-2 group">
                <div className="w-2 h-2 border border-white/[0.04] bg-white/[0.015] group-hover:bg-white/[0.04] transition-colors" />
                <div>
                  <span className="text-[13px] font-medium sm:text-[14px] text-white/50 group-hover:text-white/70 transition-colors font-mono">
                    {proto.name}
                  </span>
                  <span className="hidden sm:inline text-[11px] text-white/15 ml-2">
                    {proto.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compatible with */}
        <div className="mb-14 sm:mb-20">
          <div className="text-[11px] font-medium text-white/20 tracking-wider uppercase mb-4">
            Compatible with
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-10">
            {COMPATIBLE_WITH.map((tool) => (
              <span
                key={tool}
                className="text-[12px] font-medium font-mono sm:text-[13px] px-3 sm:px-4 py-2 border border-white/[0.04] text-white/35 bg-white/[0.015] hover:border-white/[0.08] hover:text-white/55 transition-all duration-300"
              >
                {tool}
              </span>
            ))}
          </div>

          {/* AI model providers with real logos */}
          <LogoBar
            variant="ai"
            label="Skills leverage the full AI stack"
            className="mb-10"
          />

          {/* Blockchain ecosystem with real logos */}
          <LogoBar
            variant="blockchain"
            label="Payments and settlement"
          />
        </div>

        {/* Key stat */}
        <div className="border border-white/[0.04] bg-white/[0.015] p-6 sm:p-10 lg:p-12 mb-10 sm:mb-14">
          <div className="text-[36px] sm:text-[48px] lg:text-[56px] font-normal text-zinc-300 leading-none tracking-tight mb-3">
            49%
          </div>
          <div className="text-[14px] sm:text-[16px] text-white/50 max-w-lg leading-relaxed">
            of all x402 transactions settle on Solana.
            <span className="text-white/25"> Aegis is the success layer they are all missing.</span>
          </div>
        </div>

        {/* Vitalik quote */}
        <div className="border-l-2 border-white/[0.08] pl-6 sm:pl-8 py-2">
          <blockquote className="text-[16px] sm:text-[18px] lg:text-[20px] text-white/50 leading-relaxed mb-4 italic">
            "Bots paying bots, security deposits, reputations, dispute resolution
            : the four pillars of crypto and AI."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center">
              <span className="text-[11px] font-normal text-white/30">VB</span>
            </div>
            <div>
              <div className="text-[13px] text-white/60 font-medium">Vitalik Buterin</div>
              <div className="text-[11px] text-white/25">2026</div>
            </div>
          </div>
          <p className="text-[13px] text-white/25 mt-4 max-w-lg">
            Those are the four pillars of Aegis. We built it on Solana.
          </p>
        </div>
      </div>
    </section>
  );
}
