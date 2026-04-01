import SectionLabel from "@/components/SectionLabel";
import { useInView } from "@/hooks/useInView";
import { useState } from "react";



const UTILITIES = [
  {
    title: "Validator Staking",
    desc: "Validators must stake $AEGIS to bond. Slashed if they rubber-stamp garbage. The token secures the network.",
    cmd: "agent-aegis stake --validator --amount 1000",
  },
  {
    title: "Operator Registration",
    desc: "Creators stake $AEGIS to register operators. Creates organic buy pressure from every new operator listing.",
    cmd: "agent-aegis register --bond 500",
  },
  {
    title: "Fee Discounts",
    desc: "Holding $AEGIS reduces invocation fees. Proportional discounts based on stake size.",
    cmd: "agent-aegis config set --fee-discount true",
  },
  {
    title: "Governance",
    desc: "Token holders vote on protocol parameters: fee rates, slash amounts, treasury allocation.",
    cmd: "agent-aegis governance vote --proposal 42",
  },
  {
    title: "Dispute Staking",
    desc: "Prediction market disputes require $AEGIS stakes. Winners earn losers' stakes.",
    cmd: "agent-aegis challenge --stake 200",
  },
  {
    title: "Transfer Fee Burn",
    desc: "2% of every invocation fee burned permanently via Token-2022. Deflationary over time.",
    cmd: "// Enforced at protocol level via Token-2022",
  },
  {
    title: "x402 USDC Swap",
    desc: "Agents pay in USDC via x402. Aegis swaps to $AEGIS via Jupiter. Every invocation creates buy pressure.",
    cmd: "agent-aegis invoke operator --pay x402 --amount 0.05",
  },
];

const FLYWHEEL_STEPS = [
  { label: "Agent discovers operator via MCP", accent: false },
  { label: "Agent pays USDC via x402", accent: false },
  { label: "USDC swapped to $AEGIS on Jupiter", accent: true },
  { label: "Revenue splits: 60% creator, 15% validator", accent: false },
  { label: "Creator reinvests in better operators", accent: false },
  { label: "Better operators attract more agents", accent: true },
  { label: "More agents = more buy pressure", accent: true },
];



export default function Tokenomics() {
  const { ref, inView } = useInView(0.05);

  const [hoveredUtil, setHoveredUtil] = useState<number | null>(null);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  return (
    <section id="tokenomics" className="py-16 sm:py-32 lg:py-40 border-t border-white/[0.04]" ref={ref}>
      <div className="container">
        <SectionLabel text="TOKENOMICS" />

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-20">
          <h2 className={`text-[clamp(2rem,4.5vw,3.5rem)] font-normal text-white leading-[1.05] tracking-tight`}>
            $AEGIS on Solana.
            <br />
            <span className="text-white/35 font-normal">Every agent that pays is buying.</span>
          </h2>
          <p className={`text-[14px] text-white/30 max-w-md leading-relaxed lg:text-right`}>
            100M+ x402 payments already flowing. Every USDC payment swaps to $AEGIS
            via Jupiter. 2% burned per invocation. The more agents use operators, the more
            $AEGIS gets bought and burned.
          </p>
        </div>

        {/* Token-2022 stats row */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.04] border border-white/[0.04] mb-12 sm:mb-20`}>
          {[
            { label: "Transfer Fee", value: "1%" },
            { label: "Burn Rate", value: "0.5%" },
            { label: "Total Supply", value: "1B" },
            { label: "Chain", value: "Solana" },
          ].map((item) => (
            <div key={item.label} className="bg-white/[0.015] p-4 sm:p-6 lg:p-8">
              <div className="text-[22px] sm:text-[28px] lg:text-[36px] font-normal text-zinc-300 tracking-tight leading-none mb-1 sm:mb-2">
                {item.value}
              </div>
              <div className="text-[11px] sm:text-[13px] text-white/30 font-medium">{item.label}</div>
            </div>
          ))}
        </div>



        {/* Buy Pressure Flywheel  -  replaces vesting schedule */}
        <div className={`mb-12 sm:mb-24`}>
          <h3 className="text-[clamp(1.5rem,3vw,2.25rem)] font-normal text-white leading-tight tracking-tight mb-3">
            The buy pressure flywheel.
            <span className="text-white/35 font-normal"> Self-reinforcing.</span>
          </h3>
          <p className="text-[14px] text-white/25 max-w-lg mb-10">
            Every agent that uses an operator creates organic demand for $AEGIS.
            More usage. More burns. More value.
          </p>

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-white/[0.04] hidden lg:block" />

            <div className="space-y-1">
              {FLYWHEEL_STEPS.map((step, i) => (
                <div
                  key={i}
                  className={`relative flex items-center gap-3 sm:gap-6 p-3 sm:p-5 lg:pl-16 border transition-all duration-300 cursor-default ${
                    hoveredStep === i
                      ? "border-white/[0.04] bg-white/[0.015]"
                      : "border-white/[0.04] bg-white/[0.01]"
                  }`}
                  onMouseEnter={() => setHoveredStep(i)}
                  onMouseLeave={() => setHoveredStep(null)}
                >
                  {/* Step indicator */}
                  <div className={`hidden lg:flex absolute left-3 w-7 h-7 items-center justify-center border transition-all duration-300 ${
                    step.accent
                      ? "bg-white/[0.04] border-white/[0.08]"
                      : hoveredStep === i
                        ? "bg-white/[0.04] border-white/[0.08]"
                        : "bg-white/[0.015] border-white/[0.04]"
                  }`}>
                    <span className={`text-[11px] font-normal ${step.accent ? "text-zinc-300" : "text-white/30"}`}>
                      {i + 1}
                    </span>
                  </div>

                  {/* Mobile step number */}
                  <div className={`lg:hidden w-7 h-7 flex items-center justify-center border shrink-0 ${
                    step.accent ? "bg-white/[0.04] border-white/[0.08]" : "bg-white/[0.015] border-white/[0.04]"
                  }`}>
                    <span className={`text-[11px] font-normal ${step.accent ? "text-zinc-300" : "text-white/30"}`}>
                      {i + 1}
                    </span>
                  </div>

                  <span className={`text-[14px] font-medium transition-colors duration-200 ${
                    step.accent
                      ? "text-zinc-300"
                      : hoveredStep === i ? "text-white" : "text-white/50"
                  }`}>
                    {step.label}
                  </span>

                  {/* Arrow for non-last items */}
                  {i < FLYWHEEL_STEPS.length - 1 && (
                    <svg className="w-4 h-4 text-white/10 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="square" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  )}
                  {i === FLYWHEEL_STEPS.length - 1 && (
                    <svg className="w-4 h-4 text-zinc-300/30 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="square" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Value capture callout */}
        <div className={`grid md:grid-cols-3 gap-px bg-white/[0.04] border border-white/[0.04] mb-12 sm:mb-24`}>
          {[
            { title: "Organic Demand", desc: "Every operator registration, validator bond, and dispute requires $AEGIS. Protocol usage creates buy pressure." },
            { title: "Deflationary", desc: "2% of every invocation fee is burned permanently. Supply decreases over time. More usage, more burns." },
            { title: "Protocol Revenue", desc: "12% treasury fee on every invocation. x402 USDC payments are swapped to $AEGIS via Jupiter. Every agent invocation across the ecosystem drives buy pressure." },
          ].map((item) => (
            <div key={item.title} className="bg-white/[0.015] p-4 sm:p-8 lg:p-10">
              <div className="text-[15px] font-normal text-white/70 mb-3">{item.title}</div>
              <div className="text-[13px] text-white/30 leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Utility mechanisms */}
        <div className="mb-12">
          <h3 className="text-[clamp(1.5rem,3vw,2.25rem)] font-normal text-white leading-tight tracking-tight mb-3">
            Seven utility mechanisms.
            <span className="text-white/35 font-normal"> Built into the protocol.</span>
          </h3>
          <p className="text-[14px] text-white/25 max-w-xl">
            Every utility below creates either buy pressure, lock-up, or burn.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-white/[0.04] border border-white/[0.04]">
          {UTILITIES.map((u, i) => (
            <div
              key={u.title}
              className={`bg-white/[0.015] p-4 sm:p-8 lg:p-10 ${hoveredUtil === i ? "bg-white/[0.015]" : ""}`}
              style={{ transitionDelay: `${i * 80}ms` }}
              onMouseEnter={() => setHoveredUtil(i)}
              onMouseLeave={() => setHoveredUtil(null)}
            >
              <h4 className={`text-[16px] font-normal mb-3 transition-colors duration-300 ${hoveredUtil === i ? "text-zinc-300" : "text-white/75"}`}>
                {u.title}
              </h4>
              <p className="text-[13px] leading-[1.7] text-white/30 mb-5">
                {u.desc}
              </p>
              <div className={`text-[11px] font-medium px-4 py-2.5 border transition-all duration-300 ${
                hoveredUtil === i ? "border-white/15 bg-white/[0.04] text-zinc-300/60" : "border-white/[0.04] bg-white/[0.015] text-white/18"
              }`}>
                $ {u.cmd}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
