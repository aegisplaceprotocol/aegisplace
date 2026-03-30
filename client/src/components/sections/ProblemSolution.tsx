import { motion } from "framer-motion";
import { fadeInView } from "@/lib/animations";

const DATA_CARDS = [
  {
    stat: "48%",
    source: "Stanford HAI, 2025",
    desc: "of agent transactions may be experimental or gamified. Nobody can tell the difference.",
  },
  {
    stat: "40%",
    source: "Gartner, 2025",
    desc: "of agentic AI projects will be canceled by 2027 due to quality failures and poor quality enforcement.",
  },
  {
    stat: "$0",
    source: "Industry standard",
    desc: "at stake when an operator fails. Reputation badges without money behind them mean nothing.",
  },
];

export default function ProblemSolution() {
  return (
    <section className="py-24 sm:py-32 border-t border-white/[0.05]">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <motion.div {...fadeInView}>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-[11px] font-medium tracking-wider uppercase text-zinc-500">
            </span>
          </div>

          <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-normal text-white leading-[1.1] tracking-tight mb-4">
            The agent economy has zero quality guarantee.
          </h2>

          <p className="text-[14px] sm:text-[15px] text-zinc-500 max-w-2xl leading-relaxed mb-12 sm:mb-16">
            The agent economy is exploding. Skill marketplaces are growing exponentially.
            But when an AI agent pays for a service, nothing verifies the service is any good.
          </p>
        </motion.div>

        <motion.div {...fadeInView} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DATA_CARDS.map((card, i) => (
            <div
              key={i}
              className="rounded border border-zinc-800 bg-zinc-900/40 p-8"
            >
              <div className="text-[36px] sm:text-[42px] font-bold text-red-400/70 leading-none tracking-tight mb-2">
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
