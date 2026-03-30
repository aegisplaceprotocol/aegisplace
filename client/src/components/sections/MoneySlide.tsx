import { useState } from "react";
import { motion } from "framer-motion";
import { fadeInView } from "@/lib/animations";
import GlowCard from "@/components/GlowCard";

const SPLITS = [
  { label: "Operator Creator", pct: 70, color: "#A1A1AA" },
  { label: "Validator", pct: 20, color: "#71717A" },
  { label: "Treasury", pct: 9, color: "#4A7A82" },
  { label: "Burned Forever", pct: 1, color: "#FF4444" },
];

const FLYWHEEL = [
  "Agent discovers operator via MCP",
  "Agent pays USDC via x402",
  "USDC swapped to $AEGIS on Jupiter",
  "Revenue splits automatically on-chain",
  "Creators reinvest in better operators",
  "Better operators attract more agents",
  "More agents = more buy pressure + more burns",
];

export default function MoneySlide() {
  const [hoveredSplit, setHoveredSplit] = useState<number | null>(null);

  return (
    <section className="py-24 sm:py-32 border-t border-white/[0.05]">
      <div className="container">
        {/* Section label */}
        <motion.div {...fadeInView} className="flex items-center gap-2 mb-6">
          <span className="w-1.5 h-1.5 bg-white/60 rounded-full" />
          <span className="text-[11px] font-medium tracking-wider uppercase text-white/30 font-medium">
            THE ECONOMICS
          </span>
        </motion.div>

        {/* App Store comparison headline */}
        <motion.h2 {...fadeInView} className="text-[clamp(1.75rem,4.5vw,3rem)] font-bold text-white leading-[1.05] tracking-tight mb-4">
          The App Store does $85B/year.
          <br />
          <span className="text-zinc-300">This market is $110B.</span>
        </motion.h2>

        <motion.p {...fadeInView} className="text-[14px] sm:text-[15px] text-white/30 max-w-2xl leading-relaxed mb-6">
          1 billion agents making 100 calls a day at $0.003 each. The apps run themselves.
          The customers are AI agents. The marketplace never closes.
        </motion.p>

        {/* The key insight */}
        <div className="border border-white/20 bg-white/[0.03] p-5 sm:p-6 mb-14 sm:mb-20 max-w-2xl">
          <p className="text-[14px] sm:text-[15px] text-white/60 leading-relaxed">
            Every agent that uses an operator is buying <span className="text-zinc-300 font-normal">$AEGIS</span>.
            Every transaction makes the next one more valuable.
            <span className="text-white/30"> No invoices. No net-30. Payments settle in 400ms on Solana.</span>
          </p>
        </div>

        {/* Revenue split visual */}
        <motion.div {...fadeInView} className="mb-12 sm:mb-16">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
            Everyone gets paid. Every single time.
          </h3>
          <p className="text-[13px] text-white/25 mb-6">
            One Solana transaction. Sub-cent cost. Atomic revenue splits.
          </p>

          {/* Bar */}
          <div className="flex h-3 sm:h-4 mb-6 overflow-hidden">
            {SPLITS.map((s, i) => (
              <div
                key={s.label}
                className="relative transition-all duration-300"
                style={{
                  width: `${s.pct}%`,
                  backgroundColor: hoveredSplit === i ? s.color : `${s.color}66`,
                }}
                onMouseEnter={() => setHoveredSplit(i)}
                onMouseLeave={() => setHoveredSplit(null)}
              />
            ))}
          </div>

          {/* Split cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06] border border-white/[0.07]">
            {SPLITS.map((s, i) => (
              <div
                key={s.label}
                className={`bg-white/[0.02] p-4 sm:p-6 lg:p-8 transition-all duration-300 cursor-default ${
                  hoveredSplit === i ? "bg-white/[0.025]" : ""
                }`}
                onMouseEnter={() => setHoveredSplit(i)}
                onMouseLeave={() => setHoveredSplit(null)}
              >
                <div
                  className="text-[28px] sm:text-[36px] lg:text-[44px] font-bold tracking-tight leading-none mb-1 sm:mb-2"
                  style={{ color: s.color }}
                >
                  {s.pct}%
                </div>
                <div className="text-[12px] sm:text-[13px] text-white/40 font-medium">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Flywheel + callouts */}
        <motion.div {...fadeInView} className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          {/* Left: flywheel steps */}
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              The buy pressure flywheel.
            </h3>
            <p className="text-[13px] text-white/25 mb-8">
              Self-reinforcing. Every transaction makes the next one more valuable.
            </p>

            <div className="relative">
              <div className="absolute left-[11px] top-3 bottom-3 w-px bg-white/[0.06]" />
              <div className="space-y-0">
                {FLYWHEEL.map((step, i) => (
                  <div key={i} className="relative flex items-center gap-4 py-2.5">
                    <div className={`w-[23px] h-[23px] flex items-center justify-center border shrink-0 relative z-10 ${
                      i === 2 || i === 6
                        ? "bg-white/15 border-white/30"
                        : "bg-white/[0.02] border-white/[0.08]"
                    }`}>
                      <span className={`text-[10px] font-medium font-bold ${
                        i === 2 || i === 6 ? "text-zinc-300" : "text-white/30"
                      }`}>
                        {i + 1}
                      </span>
                    </div>
                    <span className={`text-[13px] sm:text-[14px] ${
                      i === 2 || i === 6 ? "text-zinc-300 font-medium" : "text-white/50"
                    }`}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: callout cards */}
          <div className="space-y-4">
            {[
              {
                title: "Creator earnings",
                desc: "Upload a skill. Earn 60% of every invocation fee. A researcher in Lagos wakes up to $280 from 40,000 overnight agent calls. No employer needed.",
              },
              {
                title: "Deflationary by design",
                desc: "2% of every revenue split is burned permanently. Supply decreases over time. More usage, more burns, more scarcity.",
              },
              {
                title: "No gatekeepers",
                desc: "No approval queues. No app review board. No middleman deciding who gets to participate. You build it. You own it. You earn from it.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-5 sm:p-6 border border-white/[0.07] bg-white/[0.015] hover:border-white/[0.1] hover:bg-white/[0.025] transition-all duration-300"
              >
                <div className="text-[14px] sm:text-[15px] font-normal text-white/80 mb-2">
                  {item.title}
                </div>
                <div className="text-[13px] text-white/30 leading-relaxed">
                  {item.desc}
                </div>
              </div>
            ))}

            {/* CTA to /earn and full tokenomics */}
            <div className="flex flex-wrap gap-4 mt-2">
              <a
                href="/earn"
                className="inline-flex items-center gap-2 text-[13px] font-normal text-zinc-300 hover:text-[#D4D4D8] transition-colors"
              >
                Start earning
              </a>
              <a
                href="/tokenomics"
                className="inline-flex items-center gap-2 text-[13px] font-medium text-white/30 hover:text-white/60 transition-colors"
              >
                Full tokenomics
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
