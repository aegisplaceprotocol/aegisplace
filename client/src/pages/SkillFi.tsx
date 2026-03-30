import { useState } from "react";
import { motion } from "framer-motion";
import { fadeInView } from "@/lib/animations";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/sections/Footer";


/* ── Step card data ──────────────────────────────────────── */
const STEPS = [
  {
    number: "01",
    title: "Register Operator",
    description:
      "Upload your AI skill to Aegis. Set pricing, define input/output schemas, and get listed in the marketplace.",
  },
  {
    number: "02",
    title: "Token Auto-Launches",
    description:
      "A Bags token is created for your operator. Token economics tied directly to real skill usage and demand.",
  },
  {
    number: "03",
    title: "Usage Drives Volume",
    description:
      "Every agent invocation generates trading activity. More usage means more volume, more fees, more value.",
  },
  {
    number: "04",
    title: "Dual Revenue Streams",
    description:
      "Creators earn from invocation fees AND trading fees. Token holders share in the upside of every skill call.",
  },
];

/* ── Status badge ────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PRE_LAUNCH: "text-white/40 border-white/[0.08]",
    PRE_GRAD: "text-white/60 border-white/[0.12]",
    MIGRATING: "text-white/50 border-white/[0.10]",
    MIGRATED: "text-white/70 border-white/[0.15]",
  };
  return (
    <span
      className={`inline-block text-[10px] tracking-wider uppercase px-2 py-0.5 border ${styles[status] ?? styles.PRE_LAUNCH}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

/* ── Main page ───────────────────────────────────────────── */
export default function SkillFi() {
  const [feedPage] = useState(0);

  const tokenFeed = { data: undefined as any };

  const partnerStats = { data: undefined as any };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="pt-24">
        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="py-20 sm:py-28 border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div {...fadeInView} className="text-center">
              <p className="text-[11px] tracking-[0.25em] uppercase text-white/30 mb-4">
                Powered by Bags
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6">
                Every AI skill is a<br />
                tradeable asset
              </h1>
              <p className="text-[15px] sm:text-base text-white/40 max-w-2xl mx-auto leading-relaxed mb-10">
                Aegis Skill-Fi turns operator usage into on-chain financial
                primitives. Register a skill, auto-launch a token, and earn from
                both invocations and trading fees.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/submit"
                  className="inline-block px-6 py-3 text-[13px] font-medium text-black bg-white hover:bg-white/90 transition-colors"
                >
                  Launch Your Operator Token
                </a>
                <a
                  href="/marketplace"
                  className="inline-block px-6 py-3 text-[13px] font-medium text-white/60 border border-white/[0.12] hover:border-white/[0.20] transition-colors"
                >
                  Browse Marketplace
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Stats bar ────────────────────────────────────── */}
        <section className="border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/[0.06]">
              {[
                {
                  label: "Operators",
                  value: "452",
                },
                {
                  label: "Token Launches",
                  value: tokenFeed.data?.total?.toString() ?? "--",
                },
                {
                  label: "Total Claimed",
                  value: partnerStats.data?.totalClaimed
                    ? `$${parseFloat(partnerStats.data.totalClaimed).toFixed(2)}`
                    : "--",
                },
                {
                  label: "Claimable",
                  value: partnerStats.data?.claimableAmount
                    ? `$${parseFloat(partnerStats.data.claimableAmount).toFixed(2)}`
                    : "--",
                },
              ].map(stat => (
                <div key={stat.label} className="py-6 px-4 text-center">
                  <p className="text-lg sm:text-xl font-bold text-white">
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-white/30 uppercase tracking-wider mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────── */}
        <section className="py-20 sm:py-24 border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div {...fadeInView}>
              <p className="text-[11px] tracking-[0.25em] uppercase text-white/30 mb-3">
                How it works
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-12">
                From skill to financial asset in 4 steps
              </h2>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-px bg-white/[0.06]">
              {STEPS.map(step => (
                <motion.div
                  key={step.number}
                  {...fadeInView}
                  className="bg-background p-8 sm:p-10"
                >
                  <span className="text-[11px] font-light text-white/20 tracking-wider">
                    {step.number}
                  </span>
                  <h3 className="text-lg font-normal text-white mt-2 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-[13px] text-white/35 leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Revenue model ────────────────────────────────── */}
        <section className="py-20 sm:py-24 border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div {...fadeInView}>
              <p className="text-[11px] tracking-[0.25em] uppercase text-white/30 mb-3">
                Revenue model
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Two income streams, one token
              </h2>
              <p className="text-[13px] text-white/35 max-w-xl mb-12">
                Bags fee-sharing means every trade of an operator token routes
                fees back to the creator. Combined with per-invocation fees,
                this is DeFi-native creator monetization.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-px bg-white/[0.06]">
              <motion.div {...fadeInView} className="bg-background p-8 sm:p-10">
                <h3 className="text-base font-normal text-white mb-2">
                  Invocation Fees
                </h3>
                <p className="text-[13px] text-white/35 leading-relaxed mb-4">
                  Agents pay per call. 60% goes to the creator, 15% to
                  validators, 2% burned, rest to treasury.
                </p>
                <div className="text-[11px] text-white/20 font-light">
                  Creator: 60% | Validator: 15% | Burn: 2%
                </div>
              </motion.div>
              <motion.div {...fadeInView} className="bg-background p-8 sm:p-10">
                <h3 className="text-base font-normal text-white mb-2">
                  Trading Fees (Bags)
                </h3>
                <p className="text-[13px] text-white/35 leading-relaxed mb-4">
                  Every buy/sell of the operator token generates trading fees.
                  Configurable fee-share routes a portion to the creator wallet.
                </p>
                <div className="text-[11px] text-white/20 font-light">
                  Configurable via Bags fee-share config
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Token feed ───────────────────────────────────── */}
        <section className="py-20 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div {...fadeInView}>
              <p className="text-[11px] tracking-[0.25em] uppercase text-white/30 mb-3">
                Live tokens
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-10">
                Operator tokens launched on Bags
              </h2>
            </motion.div>

            {tokenFeed.isLoading && (
              <div className="text-center py-12">
                <p className="text-[13px] text-white/25">
                  Loading token feed...
                </p>
              </div>
            )}

            {tokenFeed.data && tokenFeed.data.tokens.length > 0 ? (
              <div className="border border-white/[0.06] divide-y divide-white/[0.06]">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[10px] uppercase tracking-wider text-white/25">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-2">Symbol</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-3">Mint</div>
                  <div className="col-span-2 text-right">Created</div>
                </div>

                {tokenFeed.data.tokens.map(token => (
                  <div
                    key={token.tokenMint}
                    className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-white/[0.015] transition-colors"
                  >
                    <div className="col-span-3 text-[13px] text-white/70 font-medium truncate">
                      {token.name}
                    </div>
                    <div className="col-span-2 text-[12px] text-white/40 font-light">
                      {token.symbol}
                    </div>
                    <div className="col-span-2">
                      <StatusBadge status={token.status} />
                    </div>
                    <div className="col-span-3 text-[11px] text-white/20 font-light truncate">
                      {token.tokenMint}
                    </div>
                    <div className="col-span-2 text-[11px] text-white/20 text-right">
                      {token.createdAt
                        ? new Date(token.createdAt).toLocaleDateString()
                        : "--"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !tokenFeed.isLoading && (
                <div className="border border-white/[0.06] p-12 text-center">
                  <p className="text-white/30 text-[13px] mb-1">
                    No operator tokens launched yet
                  </p>
                  <p className="text-white/15 text-[12px]">
                    Be the first to launch an operator token on Bags
                  </p>
                </div>
              )
            )}
          </div>
        </section>
      </div>

      <Footer />
      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}
