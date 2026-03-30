import SectionLabel from "@/components/SectionLabel";
import { useInView } from "@/hooks/useInView";
import { useEffect, useState } from "react";

function useCountUp(end: number, duration: number, start: boolean, isDecimal = false) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    let raf: number;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(isDecimal ? parseFloat((eased * end).toFixed(3)) : Math.floor(eased * end));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, start, isDecimal]);
  return current;
}

const BENEFITS = [
  {
    role: "Operator Creators",
    statNum: 70,
    statSuffix: "%",
    statFormat: "int",
    desc: "of every invocation fee goes directly to you. No middleman. No app store cut. Stake $AEGIS to list, earn per call.",
    math: "1,000 invocations/day at $0.001 = $0.70 passive income per operator",
    details: [
      "Automatic SOL/USDC payouts per invocation",
      "Reputation score increases discoverability",
      "$AEGIS bond protects against copycats",
      "Multiple operators compound revenue streams",
    ],
  },
  {
    role: "Validators",
    statNum: 20,
    statSuffix: "%",
    statFormat: "int",
    desc: "of invocation revenue for accurate quality attestation. Stake $AEGIS to bond, review operators, earn passive income.",
    math: "Validate 50 popular operators = $10+/day from attestation revenue",
    details: [
      "Earn by verifying operator quality",
      "$AEGIS stake-weighted attestation authority",
      "Slashing for inaccurate reviews",
      "Compound earnings across operator portfolio",
    ],
  },
  {
    role: "Consumer Agents",
    statNum: 0.001,
    statSuffix: "",
    statFormat: "usd",
    desc: "average cost per operator invocation. Sub-cent micropayments mean your agent can call hundreds of operators without breaking the bank.",
    math: "100 operator calls/day = $0.10 total cost, quality guaranteed",
    details: [
      "Pay only for what you use",
      "Quality guaranteed by bonded validators",
      "Reputation scores filter bad operators",
      "Dispute resolution if operator underperforms",
    ],
  },
];

function BenefitCard({ benefit, index, inView }: { benefit: typeof BENEFITS[0]; index: number; inView: boolean }) {
  const [hovered, setHovered] = useState(false);
  const count = useCountUp(benefit.statNum, 2000, inView, benefit.statFormat === "usd");

  const displayStat = benefit.statFormat === "usd"
    ? `$${count.toFixed(3)}`
    : `${count}${benefit.statSuffix}`;

  return (
    <div
      className={`relative p-5 sm:p-8 lg:p-12 border-b lg:border-b-0 border-r-0 lg:border-r border-white/[0.04] last:border-b-0 last:border-r-0 ${hovered ? "bg-white/[0.015]" : ""}`}
      style={{ transitionDelay: `${index * 120}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="text-[13px] text-white/25 font-medium mb-8 tracking-wide">
        {benefit.role}
      </div>

      <div className="text-[clamp(2.5rem,7vw,5rem)] font-normal leading-none mb-4 sm:mb-6 tabular-nums text-zinc-300 tracking-tight">
        {displayStat}
      </div>

      <p className="text-[14px] leading-[1.7] text-white/35 mb-8">{benefit.desc}</p>

      {/* Revenue math */}
      <div className={`text-[12px] font-medium px-4 py-3 border mb-8 transition-all duration-300 ${
        hovered ? "border-white/15 bg-white/[0.015] text-white/40" : "border-white/[0.04] bg-white/[0.015] text-white/20"
      }`}>
        {benefit.math}
      </div>

      <div className="space-y-3 pt-8 border-t border-white/[0.04]">
        {benefit.details.map((d) => (
          <div key={d} className="flex items-start gap-3">
            <span className="mt-2 w-1 h-1 bg-white/30 rounded-full shrink-0" />
            <span className="text-[13px] text-white/30 leading-relaxed">{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Benefits() {
  const { ref, inView } = useInView(0.05);

  return (
    <section id="benefits" className="py-16 sm:py-32 lg:py-40 border-t border-white/[0.04]" ref={ref}>
      <div className="container">
        <SectionLabel text="BENEFITS" />

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-20">
          <h2 className={`text-[clamp(2rem,4.5vw,3.5rem)] font-normal text-white leading-[1.05] tracking-tight`}>
            Three roles. One atomic transaction.
            <br />
            <span className="text-white/35 font-normal">Everyone earns. Everyone has skin in the game.</span>
          </h2>
          <p className={`text-[14px] text-white/30 max-w-md leading-relaxed lg:text-right`}>
            The 60/15/12/8/3/2 revenue split executes in a single Solana instruction.
            No invoices. No net-30. No payment disputes. Just code.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 border-t border-white/[0.04]">
          {BENEFITS.map((b, i) => (
            <BenefitCard key={b.role} benefit={b} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
