
import { motion } from "framer-motion";
import { fadeInView, staggerContainer, staggerItem } from "@/lib/animations";

const FEE_SPLIT = [
  { label: "Creators", pct: "60%", flex: 60, opacity: "0.50" },
  { label: "Validators", pct: "15%", flex: 15, opacity: "0.35" },
  { label: "Stakers", pct: "12%", flex: 12, opacity: "0.25" },
  { label: "Treasury", pct: "8%", flex: 8, opacity: "0.15" },
  { label: "Insurance", pct: "3%", flex: 3, opacity: "0.10" },
  { label: "Burned", pct: "2%", flex: 2, opacity: null, color: "rgba(220,100,60,0.50)" },
];

const FLYWHEEL_STEPS = [
  "Agent pays USDC via x402 micropayment",
  "USDC is swapped to $AEGIS on Jupiter",
  "60% flows to the skill creator instantly",
  "15% goes to bonded validators",
  "12% distributed to $AEGIS stakers",
  "3% builds the insurance fund",
  "2% is burned permanently, reducing supply",
];

export default function TokenSection() {
  const price: any = null; const isLoading = false;

  return (
    <section className="py-20 border-t border-white/[0.04]">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        {/* Headline */}
        <motion.h2
          {...fadeInView}
          className="text-[clamp(1.75rem,4.5vw,3rem)] font-normal text-white leading-[1.05] tracking-tight mb-4"
        >
          Real usage. Real buy pressure. Every invocation.
        </motion.h2>

        <motion.p
          {...fadeInView}
          className="text-[14px] sm:text-[15px] text-white/30 max-w-2xl leading-relaxed mb-14 sm:mb-20"
        >
          USDC payments are Jupiter-swapped to $AEGIS on every operator call.
          The token has real demand from real usage, not emissions, not
          incentives.
        </motion.p>

        {/* Two-column: Revenue Split + Flywheel */}
        <motion.div
          {...staggerContainer}
          className="grid md:grid-cols-2 gap-4 items-stretch mb-14"
        >
          {/* Revenue Split card */}
          <motion.div
            {...staggerItem}
            className="border border-white/[0.04] bg-white/[0.01] p-6 sm:p-10"
          >
            {isLoading ? (
              <div className="h-12 w-48 bg-white/[0.015] animate-pulse" />
            ) : (
              <>
                <div className="text-[11px] font-medium text-white/20 uppercase tracking-wider mb-6">
                  Revenue Split
                </div>

                {/* Bar */}
                <div className="flex h-3 mb-6 overflow-hidden gap-0.5 rounded">
                  {FEE_SPLIT.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        flex: s.flex,
                        backgroundColor: s.color || `rgba(255, 255, 255, ${s.opacity})`,
                      }}
                      className={i === 0 ? "rounded-l-sm" : i === FEE_SPLIT.length - 1 ? "rounded-r-sm" : ""}
                    />
                  ))}
                </div>

                {/* Labels */}
                <div className="space-y-2 text-[13px]">
                  {FEE_SPLIT.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-white/30">{item.label}</span>
                      <span className={`font-light ${item.color ? "text-red-400/60" : "text-white/40"}`}>
                        {item.pct}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Live price */}
                {price && (
                  <div className="mt-6 pt-5 border-t border-white/[0.04]">
                    <div className="flex gap-6 text-[13px]">
                      <div>
                        <span className="text-white/20">Price </span>
                        <span className="text-white/50 font-light">
                          ${parseFloat(price.priceUsd || "0").toFixed(6)}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/20">24h </span>
                        <span
                          className={
                            price.priceChange24h && price.priceChange24h >= 0
                              ? "text-white/50"
                              : "text-red-400"
                          }
                        >
                          {price.priceChange24h
                            ? (price.priceChange24h >= 0 ? "+" : "") +
                              price.priceChange24h.toFixed(2) +
                              "%"
                            : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/20">Vol </span>
                        <span className="text-white/50 font-light">
                          $
                          {price.volume24h
                            ? (price.volume24h / 1000).toFixed(1) + "K"
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>

          {/* Flywheel card */}
          <motion.div
            {...staggerItem}
            className="border border-white/[0.04] bg-white/[0.01] p-6 sm:p-10"
          >
            <div className="text-[11px] font-medium text-white/20 uppercase tracking-wider mb-6">
              The Flywheel
            </div>

            <div className="space-y-4">
              {FLYWHEEL_STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-white/[0.015] border border-white/[0.04] text-white/50 text-[11px] font-normal flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-[13px] text-zinc-400 leading-relaxed pt-0.5">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}
