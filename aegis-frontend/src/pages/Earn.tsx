import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/sections/Footer";
import RequireWallet from "@/components/RequireWallet";

/* -- Earnings Calculator ------------------------------------------------ */
function EarningsCalculator() {
  const [dailyCalls, setDailyCalls] = useState(10000);
  const [feePerCall, setFeePerCall] = useState(0.003);

  const earnings = useMemo(() => {
    const gross = dailyCalls * feePerCall;
    return {
      daily: gross * 0.85,
      weekly: gross * 0.85 * 7,
      monthly: gross * 0.85 * 30,
      yearly: gross * 0.85 * 365,
      validatorDaily: gross * 0.15,
      burnedDaily: gross * 0.02,
    };
  }, [dailyCalls, feePerCall]);

  return (
    <div className="border border-white/[0.04] bg-white/[0.015]">
      <div className="p-6 sm:p-8 lg:p-10 border-b border-white/[0.04]">
        <h3 className="text-xl sm:text-2xl font-normal text-white mb-2">
          How much could you earn?
        </h3>
        <p className="text-[13px] text-white/30 mb-8">
          Adjust the sliders to model your operator earnings. You keep 85% of every invocation fee.
        </p>

        <div className="space-y-8">
          {/* Daily calls slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[13px] text-white/50 font-medium">Daily agent calls</label>
              <span className="font-normal text-[15px] text-zinc-300">
                {dailyCalls.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={100}
              max={100000}
              step={100}
              value={dailyCalls}
              onChange={(e) => setDailyCalls(Number(e.target.value))}
              className="w-full h-1 bg-white/[0.08] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-none"
            />
            <div className="flex justify-between text-[10px] text-white/15 mt-1">
              <span>100</span>
              <span>100,000</span>
            </div>
          </div>

          {/* Fee per call slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[13px] text-white/50 font-medium">Fee per call (USDC)</label>
              <span className="font-normal text-[15px] text-zinc-300">
                ${feePerCall.toFixed(4)}
              </span>
            </div>
            <input
              type="range"
              min={0.0005}
              max={0.05}
              step={0.0005}
              value={feePerCall}
              onChange={(e) => setFeePerCall(Number(e.target.value))}
              className="w-full h-1 bg-white/[0.08] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-none"
            />
            <div className="flex justify-between text-[10px] text-white/15 mt-1">
              <span>$0.0005</span>
              <span>$0.05</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06]">
        {[
          { label: "Daily", value: earnings.daily },
          { label: "Weekly", value: earnings.weekly },
          { label: "Monthly", value: earnings.monthly },
          { label: "Yearly", value: earnings.yearly },
        ].map((item) => (
          <div key={item.label} className="bg-white/[0.02] p-4 sm:p-6">
            <div className="text-[11px] text-white/25 uppercase mb-2">{item.label}</div>
            <div className="text-[22px] sm:text-[28px] font-normal text-zinc-300 tracking-tight leading-none">
              ${item.value < 1000 ? item.value.toFixed(2) : item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        ))}
      </div>

      {/* Breakdown */}
      <div className="p-4 sm:p-6 border-t border-white/[0.04] flex flex-wrap gap-6 text-[12px] text-white/25">
        <span>Validators earn: <span className="text-white/50">${earnings.validatorDaily.toFixed(2)}/day</span></span>
        <span>Burned daily: <span className="text-red-400/60">${earnings.burnedDaily.toFixed(2)}</span></span>
        <span>Treasury: <span className="text-white/50">${(earnings.daily / 0.85 * 0.03).toFixed(2)}/day</span></span>
      </div>
    </div>
  );
}

/* -- 3-Step Guide ------------------------------------------------------- */
function ThreeStepGuide() {
  const steps = [
    {
      number: "01",
      title: "Build your operator",
      desc: "Any AI capability: code review, translation, summarization, data analysis, image generation. If an agent can use it, you can monetize it.",
      detail: "Use any language. Any framework. Expose it as an MCP-compatible endpoint.",
    },
    {
      number: "02",
      title: "Upload and stake",
      desc: "Register your operator on Aegis. Stake $AEGIS as a quality bond. This tells agents: 'I am putting my money where my code is.'",
      detail: "Higher stakes signal higher confidence. Validators can then vouch for your quality by staking their own money.",
    },
    {
      number: "03",
      title: "Earn while you sleep",
      desc: "AI agents discover your operator via MCP, pay via x402, and you earn 85% of every fee. Automatically. On Solana. In under a second.",
      detail: "No invoices. No contracts. No employer. No permission needed. Your operator earns 24/7/365.",
    },
  ];

  return (
    <div>
      <h3 className="text-xl sm:text-2xl font-normal text-white mb-2">
        Three steps. That is it.
      </h3>
      <p className="text-[13px] text-white/25 mb-10">
        From zero to earning in under 10 minutes.
      </p>

      <div className="space-y-0">
        {steps.map((step, i) => (
          <div
            key={step.number}
            className={`relative flex gap-6 sm:gap-8 p-6 sm:p-8 border border-white/[0.04] ${
              i > 0 ? "border-t-0" : ""
            } hover:bg-white/[0.015] transition-all duration-300 group`}
          >
            <div className="shrink-0">
              <div className="w-12 h-12 flex items-center justify-center border border-white/20 bg-white/[0.04] group-hover:bg-white/[0.08] group-hover:border-white/40 transition-all duration-300">
                <span className="font-normal text-[16px] text-zinc-300">{step.number}</span>
              </div>
            </div>
            <div>
              <h4 className="text-[16px] sm:text-[18px] font-normal text-white/80 mb-2">
                {step.title}
              </h4>
              <p className="text-[14px] text-white/40 leading-relaxed mb-2">
                {step.desc}
              </p>
              <p className="text-[12px] text-white/20 leading-relaxed">
                {step.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -- Marketplace Demand ------------------------------------------------- */
function MarketplaceDemand() {
  const categories = [
    { name: "Code Review & Analysis", demand: "Very High", operators: 2400, growth: "+340%" },
    { name: "Translation & Localization", demand: "High", operators: 1800, growth: "+210%" },
    { name: "Data Extraction & ETL", demand: "High", operators: 1200, growth: "+180%" },
    { name: "Content Summarization", demand: "Medium", operators: 3100, growth: "+120%" },
    { name: "Image & Video Analysis", demand: "Very High", operators: 800, growth: "+520%" },
    { name: "Financial Analysis", demand: "High", operators: 600, growth: "+290%" },
    { name: "Security Auditing", demand: "Very High", operators: 340, growth: "+680%" },
    { name: "Medical Reasoning", demand: "Medium", operators: 180, growth: "+150%" },
  ];

  return (
    <div>
      <h3 className="text-xl sm:text-2xl font-normal text-white mb-2">
        What is in demand?
      </h3>
      <p className="text-[13px] text-white/25 mb-8">
        Categories with the highest agent invocation rates and the biggest gaps in quality operators.
      </p>

      <div className="border border-white/[0.04] overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-5 py-3 bg-white/[0.02] border-b border-white/[0.04]">
          <div className="text-[11px] font-medium text-white/25 uppercase tracking-wider">Category</div>
          <div className="text-[11px] font-medium text-white/25 uppercase tracking-wider text-center">Demand</div>
          <div className="text-[11px] font-medium text-white/25 uppercase tracking-wider text-right">Operators</div>
          <div className="text-[11px] font-medium text-white/25 uppercase tracking-wider text-right">Growth</div>
        </div>

        {/* Rows */}
        {categories.map((cat, i) => (
          <div
            key={cat.name}
            className={`grid grid-cols-2 sm:grid-cols-4 gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors ${
              i > 0 ? "border-t border-white/[0.04]" : ""
            }`}
          >
            <div className="text-[13px] text-white/60 font-medium">{cat.name}</div>
            <div className="text-center">
              <span className={`text-[11px] font-medium px-2 py-0.5 ${
                cat.demand === "Very High"
                  ? "text-zinc-300 bg-white/[0.08]"
                  : cat.demand === "High"
                  ? "text-zinc-300/70 bg-white/[0.04]"
                  : "text-white/40 bg-white/[0.03]"
              }`}>
                {cat.demand}
              </span>
            </div>
            <div className="text-[13px] text-white/40 text-right">{cat.operators.toLocaleString()}</div>
            <div className="text-[13px] text-zinc-300/70 text-right font-medium">{cat.growth}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -- Main Page ---------------------------------------------------------- */
export default function Earn() {
  return (
    <RequireWallet>
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 border-b border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="text-[11px] font-medium tracking-wider text-zinc-300/40 mb-6">
            THE CREATOR ECONOMY
          </div>

          <h1 className="text-[clamp(2rem,5vw,3.75rem)] font-normal text-white leading-[1.05] tracking-tight mb-4">
            Where AI skills earn money
            <br />
            <span className="text-white/30">for their creators.</span>
          </h1>

          <p className="text-[15px] sm:text-[16px] text-white/35 max-w-2xl leading-relaxed mb-8">
            Anyone on Earth can upload an AI skill, and every time any AI agent anywhere in the world
            uses it, the creator gets paid. Automatically. Forever. On Solana. In under a second.
            Skills you upload are instantly available to every AegisX user across the IDE, CLI, and MCP.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="/submit"
              className="inline-flex items-center gap-2.5 text-[13px] sm:text-[15px] font-normal bg-white text-zinc-900 px-6 py-3.5 hover:bg-zinc-200 transition-all duration-300"
            >
              Upload Your Operator
            </a>
            <a
              href="/marketplace"
              className="inline-flex items-center gap-2 text-[13px] sm:text-[15px] font-medium text-zinc-300/70 hover:text-zinc-300 border border-white/20 hover:border-white/40 px-6 py-3.5 transition-all duration-300"
            >
              Explore Marketplace
            </a>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-16 sm:py-24 border-b border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-4xl">
          <EarningsCalculator />
        </div>
      </section>

      {/* 3-Step Guide */}
      <section className="py-16 sm:py-24 border-b border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-3xl">
          <ThreeStepGuide />
        </div>
      </section>

      {/* Marketplace Demand */}
      <section className="py-16 sm:py-24 border-b border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-4xl">
          <MarketplaceDemand />
        </div>
      </section>

      {/* The Apple comparison */}
      <section className="py-16 sm:py-24 border-b border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-3xl">
          <div className="border border-white/[0.04] bg-white/[0.015] p-6 sm:p-10 lg:p-12">
            <div className="text-[11px] font-medium tracking-wider text-zinc-300/40 uppercase mb-6">
              THE ANALOGY
            </div>
            <h3 className="text-xl sm:text-2xl font-normal text-white mb-4">
              The App Store moment for AI.
            </h3>
            <p className="text-[14px] sm:text-[15px] text-white/40 leading-relaxed mb-6">
              When Apple launched the App Store, they did not sell it as "a software distribution mechanism
              with revenue sharing." They said: "There is an app for that." And suddenly a 14-year-old in
              a bedroom could build something that earns money while they sleep.
            </p>
            <p className="text-[14px] sm:text-[15px] text-white/40 leading-relaxed mb-6">
              Aegis is the same thing, but for AI capabilities. A researcher in Lagos builds a better
              sentiment analysis model. Uploads it as an Aegis operator. Stakes a bond. Goes to sleep.
              Wakes up to find that 40,000 AI agents across 12 countries used it overnight.
              $280 in their wallet.
            </p>
            <p className="text-[14px] sm:text-[15px] text-white/50 leading-relaxed font-medium">
              That is not a protocol feature. That is economic liberation for anyone who can build AI.
            </p>

            {/* Comparison stats */}
            <div className="grid grid-cols-2 gap-px bg-white/[0.06] mt-8">
              <div className="bg-white/[0.02] p-5 sm:p-6">
                <div className="text-[11px] font-medium text-white/20 uppercase mb-2">Apple App Store</div>
                <div className="text-[28px] sm:text-[36px] font-normal text-white/40 tracking-tight leading-none">$85B</div>
                <div className="text-[12px] text-white/20 mt-1">annual revenue (2025)</div>
              </div>
              <div className="bg-white/[0.02] p-5 sm:p-6">
                <div className="text-[11px] font-medium text-zinc-300/40 uppercase mb-2">AI Agent Economy</div>
                <div className="text-[28px] sm:text-[36px] font-normal text-zinc-300 tracking-tight leading-none">$110B</div>
                <div className="text-[12px] text-zinc-300/30 mt-1">projected TAM</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-2xl text-center">
          <h2 className="text-[clamp(1.5rem,4vw,2.5rem)] font-normal text-white leading-[1.1] tracking-tight mb-4">
            You build it. You own it.
            <br />
            <span className="text-zinc-300">You earn from it. Forever.</span>
          </h2>
          <p className="text-[14px] text-white/30 mb-8">
            No gatekeepers. No approval queues. No middleman.
          </p>
          <a
            href="/submit"
            className="inline-flex items-center gap-2.5 text-[14px] font-normal bg-white text-zinc-900 px-8 py-4 hover:bg-zinc-200 transition-all duration-300"
          >
            Upload Your First Operator
          </a>
        </div>
      </section>

      <Footer />
      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
    </RequireWallet>
  );
}
