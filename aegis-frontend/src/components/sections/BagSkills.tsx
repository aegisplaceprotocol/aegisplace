import { motion } from "framer-motion";
import { fadeInView } from "@/lib/animations";
import { trpc } from "@/lib/trpc";

const SKILLS = [
  {
    name: "Token Launch",
    desc: "Launch tokens directly through Bags via MCP. One call creates the token, sets the bonding curve, and lists it. No UI needed. Backed by $5B in Bags.fm volume.",
    flow: "Agent → Aegis MCP → Bags API → Token Live",
    metric: "$5B",
    metricLabel: "Bags.fm volume",
  },
  {
    name: "Smart Trade Execution",
    desc: "Buy, sell, and swap tokens on Bags with AI-powered analysis. Sentiment scoring, holder distribution checks, and rug pattern detection before every trade decision.",
    flow: "Token mint → Risk score → Trade → Settle on Solana",
    metric: "47 signals",
    metricLabel: "Per token scan",
  },
  {
    name: "Fee Vault Manager",
    desc: "Manage fee vaults with 4 configurable modes and up to 100 claimers per vault. Auto-claim when gas-optimal, compound earnings, and never leave fees on the table.",
    flow: "Monitor fees → Gas check → Claim → Compound",
    metric: "4 modes",
    metricLabel: "Vault configurations",
  },
  {
    name: "Social & Community",
    desc: "Scrape Bags social feeds, X mentions, and on-chain activity for real-time sentiment. Creator royalties flow across Twitter, TikTok, Kick, GitHub, and Moltbook.",
    flow: "Social + On-chain → NLP → Sentiment score",
    metric: "$40M",
    metricLabel: "Creator payouts",
  },
  {
    name: "Apps & Integrations",
    desc: "Connect to the full Bags ecosystem: liquidity pools, dividend tracking, holder analytics, and cross-DEX arbitrage routes. All accessible through a single MCP endpoint.",
    flow: "Bags API → Aegis MCP → Agent action → Settled",
    metric: "10+",
    metricLabel: "Integration points",
  },
  {
    name: "Analytics & Intelligence",
    desc: "Real-time analytics across the Bags ecosystem. Token health scoring, whale tracking, portfolio rebalancing, and creator revenue dashboards. $4M hackathon fund fuels new tooling.",
    flow: "On-chain data → Health model → Score → Alert",
    metric: "$4M",
    metricLabel: "Hackathon fund",
  },
];

const INTEGRATION_POINTS = [
  { label: "Token Launch", desc: "Create and list tokens via MCP" },
  { label: "Smart Trading", desc: "Buy/sell with AI risk analysis" },
  { label: "Fee Vaults", desc: "4 modes, up to 100 claimers" },
  { label: "Creator Royalties", desc: "Twitter, TikTok, Kick, GitHub, Moltbook" },
  { label: "Dividend Tracking", desc: "Monitor top-100 holder payouts" },
  { label: "Analytics", desc: "Real-time token health scoring" },
  { label: "$5B Volume", desc: "Bags.fm total trading volume" },
  { label: "$40M Payouts", desc: "Creator earnings distributed" },
  { label: "$4M Fund", desc: "Hackathon and builder grants" },
  { label: "6 Core Tools", desc: "Launch, trade, fees, social, apps, analytics" },
];

export default function BagSkills() {
  const { data: stats } = trpc.stats.overview.useQuery(undefined, { staleTime: 60_000 });

  return (
    <section className="py-24 sm:py-32 border-t border-white/[0.04]">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <motion.div {...fadeInView}>
          <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-normal text-white leading-[1.05] tracking-tight mb-4">
            6 Bags.fm Tools.
            <br />
            <span className="text-zinc-500 font-normal">$5B volume. $40M in creator payouts.</span>
          </h2>
          <p className="text-[15px] text-zinc-400 max-w-2xl leading-relaxed mb-16">
            Launch, trade, manage fees, track social, integrate apps, and analyze. all through
            a single MCP endpoint. Fee vaults support 4 modes with up to 100 claimers.
            Creator royalties flow across Twitter, TikTok, Kick, GitHub, and Moltbook.
          </p>
        </motion.div>

        {/* How it connects */}
        <motion.div {...fadeInView} className="mb-20">
          <div className="border border-white/[0.04] bg-white/[0.015] rounded p-8">
            <div className="text-[11px] font-normal text-zinc-500 tracking-wider uppercase mb-6">
              AEGIS × BAGS INTEGRATION
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {INTEGRATION_POINTS.map((p) => (
                <div key={p.label} className="text-center">
                  <div className="text-[13px] font-normal text-white mb-1">{p.label}</div>
                  <div className="text-[11px] text-zinc-500">{p.desc}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-white/[0.04]">
              <div className="flex items-center justify-center gap-3 text-[12px] text-zinc-500 flex-wrap">
                <span className="text-white font-normal">Agent</span>
                <span>→</span>
                <span className="border border-white/[0.04] rounded px-2 py-0.5 text-zinc-400">Aegis MCP</span>
                <span>→</span>
                <span className="border border-white/[0.04] rounded px-2 py-0.5 text-zinc-400">Bags API</span>
                <span>→</span>
                <span className="border border-white/[0.04] rounded px-2 py-0.5 text-zinc-400">Solana</span>
                <span>→</span>
                <span className="text-white/50 font-normal">Settled</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* The 6 core Bags tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SKILLS.map((skill, i) => (
            <motion.div
              key={skill.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="border border-white/[0.04] bg-white/[0.015] rounded p-6 flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-[15px] font-normal text-white">{skill.name}</h3>
                <div className="text-right flex-shrink-0 ml-3">
                  <div className="text-[16px] font-normal text-white/50 font-mono">{skill.metric}</div>
                  <div className="text-[10px] text-zinc-600">{skill.metricLabel}</div>
                </div>
              </div>
              <p className="text-[13px] text-zinc-400 leading-relaxed flex-1 mb-4">{skill.desc}</p>
              <div className="pt-3 border-t border-white/[0.04]">
                <div className="text-[10px] text-zinc-600 font-mono">{skill.flow}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* The clever part */}
        <motion.div {...fadeInView} className="mt-16">
          <div className="border border-white/[0.04] bg-white/[0.015] rounded p-8">
            <h3 className="text-[16px] font-normal text-white mb-3">
              The flywheel nobody else has.
            </h3>
            <p className="text-[14px] text-zinc-400 leading-relaxed mb-6">
              Every Bag Skill invocation pays in USDC. That USDC buys $AEGIS on Jupiter.
              Every fee splits five ways on Solana. Creator earns 85%, validators 10%, treasury 3%, insurance 1.5%, and 0.5% is burned forever.
              But here's the part that matters for Bags:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-[24px] font-normal text-white font-mono mb-1">1</div>
                <div className="text-[13px] font-normal text-white mb-1">Operator tokens on Bags</div>
                <div className="text-[12px] text-zinc-500 leading-relaxed">
                  Every skill operator can launch their own token on Bags. Skill usage drives token value.
                  More invocations = more revenue = more demand for the operator token.
                </div>
              </div>
              <div>
                <div className="text-[24px] font-normal text-white font-mono mb-1">2</div>
                <div className="text-[13px] font-normal text-white mb-1">Trading fees compound</div>
                <div className="text-[12px] text-zinc-500 leading-relaxed">
                  Operator tokens trade on Bags. Trading fees accrue to the creator.
                  So creators earn from invocations (85%) AND from their token's trading volume. Two revenue streams.
                </div>
              </div>
              <div>
                <div className="text-[24px] font-normal text-white font-mono mb-1">3</div>
                <div className="text-[13px] font-normal text-white mb-1">Bags volume grows</div>
                <div className="text-[12px] text-zinc-500 leading-relaxed">
                  Every new skill operator = a new token on Bags. Every agent invocation = buy pressure
                  on $AEGIS and operator tokens. Aegis becomes the largest source of organic trading
                  volume in the Bags ecosystem.
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom line */}
        <motion.div {...fadeInView} className="mt-12 text-center">
          <p className="text-[14px] text-zinc-500">
            $5B in volume. $40M paid to creators. $4M hackathon fund.
            <br />
            6 core tools. 4 fee vault modes. Royalties across 5 platforms.
            <br />
            <span className="text-zinc-300">Aegis doesn't just use Bags. Aegis feeds Bags.</span>
          </p>
        </motion.div>

        <div className="mt-12 flex items-center justify-center gap-3">
          <img src="/BagsFMLogo.png" alt="Bags" className="w-6 h-6 opacity-60" />
          <span className="text-[12px] text-white/20 font-light">Powered by Bags.fm</span>
        </div>
      </div>
    </section>
  );
}
