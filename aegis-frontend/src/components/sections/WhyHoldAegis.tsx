import { motion } from "framer-motion";
import { fadeInView } from "@/lib/animations";

const REASONS = [
  {
    num: "01",
    title: "Creator Earnings",
    desc: "Build a skill, set your price. 85% of every invocation fee goes directly to you. Revenue settles in 400ms on Solana.",
  },
  {
    num: "02",
    title: "Validator Income",
    desc: "Stake tokens, attest to operator quality. Validators earn 10% of every fee for operators they vouch for.",
  },
  {
    num: "03",
    title: "Staking Yield",
    desc: "10% of all protocol revenue flows to validators. Not inflation. Real yield from real usage that grows with the network.",
  },
  {
    num: "04",
    title: "Fee Discounts",
    desc: "Hold tokens to reduce invocation costs. High-volume agents save proportionally. The more you hold, the less you spend.",
  },
  {
    num: "05",
    title: "On-Chain Governance",
    desc: "Vote on fee rates, slash amounts, treasury allocation, and upgrades. Every vote executes on-chain. No multisig.",
  },
  {
    num: "06",
    title: "Deflationary by Design",
    desc: "0.5% of every fee is burned permanently. Every new skill, every new agent, every call reduces the supply forever.",
  },
];

export default function WhyHoldAegis() {
  return (
    <section className="py-24 sm:py-32 border-t border-white/[0.04]">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <motion.div {...fadeInView}>
          <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-normal text-white leading-[1.1] tracking-tight mb-4">
            Built into every transaction.
          </h2>
          <p className="text-[14px] sm:text-[15px] text-zinc-500 max-w-2xl leading-relaxed mb-12 sm:mb-16">
            The utility token that powers every interaction in the agent economy.
            Earning, validating, governing, and accessing the marketplace all flow through it.
          </p>
        </motion.div>

        <motion.div {...fadeInView} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REASONS.map((r) => (
            <div
              key={r.num}
              className="rounded border border-zinc-800 bg-zinc-900/40 p-6"
            >
              <span className="inline-block text-[11px] font-normal text-white/50 bg-white/[0.015] border border-white/[0.04] rounded px-2.5 py-0.5 mb-4">
                {r.num}
              </span>
              <h3 className="text-[16px] font-medium text-white mb-2">{r.title}</h3>
              <p className="text-[13px] text-zinc-500 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
