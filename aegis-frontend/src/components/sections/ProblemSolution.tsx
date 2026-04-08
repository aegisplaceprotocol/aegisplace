import { motion } from "framer-motion";
import { fadeInView } from "@/lib/animations";

const DATA_CARDS = [
  {
    stat: "19,000+",
    source: "MCP ecosystem, 2025",
    desc: "MCP servers exist but zero have a trust or payment layer. Discovery without accountability is just a directory.",
  },
  {
    stat: "None",
    source: "Agent payments gap",
    desc: "AI agents cannot pay for services autonomously. Until x402, there was no protocol for machine-to-machine micropayments.",
  },
  {
    stat: "None",
    source: "Solana-native IDEs",
    desc: "No IDE understands Solana natively. Cursor, Windsurf, and Copilot are general-purpose. None ship with on-chain tools built in.",
  },
];

export default function ProblemSolution() {
  return (
    <section className="py-16 sm:py-20 border-t border-white/[0.04]">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <motion.div {...fadeInView}>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-[11px] font-medium tracking-wider uppercase text-zinc-500">
            </span>
          </div>

          <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-normal text-white leading-[1.1] tracking-tight mb-4">
            Three unsolved problems. One platform.
          </h2>

          <p className="text-[14px] sm:text-[15px] text-zinc-500 max-w-2xl leading-relaxed mb-12 sm:mb-16">
            Aegis solves all three: a marketplace with trust and discovery, x402 for autonomous agent payments, and AegisX, the first Solana-native IDE with 86 built-in modules.
          </p>
        </motion.div>

        <motion.div {...fadeInView} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DATA_CARDS.map((card, i) => (
            <div
              key={i}
              className="rounded border border-zinc-800 bg-zinc-900/40 p-8"
            >
              <div className="text-[36px] sm:text-[42px] font-normal text-red-400/70 leading-none tracking-tight mb-2">
                {card.stat}
              </div>
              <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-4">
                {card.source}
              </div>
              <p className="text-[13px] sm:text-[14px] text-zinc-500 leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
