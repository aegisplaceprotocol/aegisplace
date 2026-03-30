import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";

/* ── Live Earnings Feed (simulated) ─────────────────────────────────────── */

interface EarningEvent {
  id: number;
  skill: string;
  creator: string;
  amount: string;
  operator: string;
  time: string;
}

const SKILL_NAMES = [
  "Contract Scanner", "50-DEX Router", "Whale Tracker", "Yield Optimizer",
  "Sentiment Engine", "Gas Oracle", "Code Reviewer", "Bridge Finder",
  "Liquidation Sniper", "NFT Ranker", "Meeting Summarizer", "Risk Scorer",
];

const CREATOR_NAMES = [
  "AuditDAO", "RouteMax", "DeepSea", "YieldDAO", "SentimentDAO",
  "GasWise", "DevGuard", "BridgeDAO", "LiqBot", "RarityLabs",
];

const OPERATOR_NAMES = [
  "alpha-7", "sentinel-x", "forge-12", "cipher-9", "ghost-3",
  "recon-8", "aegis-5", "nexus-1", "phantom-6", "vector-4",
];

function generateEarning(id: number): EarningEvent {
  const amounts = ["$0.05", "$0.12", "$0.03", "$0.08", "$0.15", "$0.02", "$0.25", "$0.01", "$0.47", "$0.09"];
  return {
    id,
    skill: SKILL_NAMES[Math.floor(Math.random() * SKILL_NAMES.length)],
    creator: CREATOR_NAMES[Math.floor(Math.random() * CREATOR_NAMES.length)],
    amount: amounts[Math.floor(Math.random() * amounts.length)],
    operator: OPERATOR_NAMES[Math.floor(Math.random() * OPERATOR_NAMES.length)],
    time: "just now",
  };
}

/* ── Main Section ───────────────────────────────────────────────────────── */

export default function SkillMarketplaceSection() {
  const [earnings, setEarnings] = useState<EarningEvent[]>(() =>
    Array.from({ length: 6 }, (_, i) => generateEarning(i))
  );
  const counterRef = useRef(6);
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      counterRef.current += 1;
      setEarnings(prev => [generateEarning(counterRef.current), ...prev.slice(0, 7)]);
    }, 2800);
    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <section ref={sectionRef} id="skill-marketplace" className="relative border-t border-white/[0.04]">
      <div className="container py-24 md:py-32">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-medium text-zinc-300/60 bg-white/[0.04] border border-white/15 px-3 py-1 tracking-wider">
            SKILL MARKETPLACE
          </span>
          <div className="h-px flex-1 bg-white/[0.04]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left: The Pitch */}
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-[44px] font-bold tracking-tight leading-[1.1] mb-6">
              <span className="text-white/90">Build a skill once.</span><br />
              <span className="text-zinc-300">Get paid forever.</span>
            </h2>

            <p className="text-base text-white/35 leading-relaxed mb-8 max-w-lg">
              Think of it like an app store, but for AI agent abilities. You build something useful, a security scanner, a trading strategy, a data analyzer, anything. You upload it, set your price, and every single time an AI agent uses your skill, money goes straight to your wallet. No middlemen. No invoices. No waiting.
            </p>

            {/* How It Works - 3 Steps */}
            <div className="space-y-5 mb-10">
              {[
                {
                  step: "01",
                  title: "You build something useful",
                  desc: "Write a skill that solves a real problem. Could be a smart contract auditor, a sentiment analyzer, a yield optimizer. Whatever agents need, someone will pay for.",
                },
                {
                  step: "02",
                  title: "Upload it and name your price",
                  desc: "Choose how you want to get paid: per use, monthly subscription, or a cut of the value your skill creates. We handle hosting, scaling, security, and billing.",
                },
                {
                  step: "03",
                  title: "Earn every time it runs",
                  desc: "Every time an operator calls your skill, you get paid instantly via x402 protocol. No minimums, no delays. Your code works for you around the clock.",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="w-8 h-8 border border-white/20 flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-medium text-zinc-300/60">{item.step}</span>
                  </div>
                  <div>
                    <div className="text-sm font-normal text-white/75 mb-1">{item.title}</div>
                    <div className="text-xs text-white/30 leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Key Numbers */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="border border-white/[0.07] p-4">
                <div className="text-xl font-bold text-zinc-300 ">70%</div>
                <div className="text-[10px] text-white/25 mt-1">goes to you</div>
              </div>
              <div className="border border-white/[0.07] p-4">
                <div className="text-xl font-bold text-white/80 ">$1.9M</div>
                <div className="text-[10px] text-white/25 mt-1">paid to creators</div>
              </div>
              <div className="border border-white/[0.07] p-4">
                <div className="text-xl font-bold text-white/80 ">97M+</div>
                <div className="text-[10px] text-white/25 mt-1">skill calls</div>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Link href="/skill-marketplace" className="text-sm font-normal bg-white text-zinc-900 px-7 py-3 hover:bg-zinc-200 transition-colors rounded">
                Explore Skills
              </Link>
              <Link href="/skill-marketplace?tab=upload" className="text-sm font-medium border border-white/20 text-zinc-300/60 hover:text-zinc-300 hover:border-white/40 px-7 py-3 transition-all">
                Start Earning
              </Link>
            </div>
          </div>

          {/* Right: Live Earnings Feed */}
          <div>
            <div className="border border-white/[0.07] bg-white/[0.015]">
              {/* Feed Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-[10px] font-medium text-white/30">LIVE CREATOR EARNINGS</span>
                </div>
                <span className="text-[9px] font-medium text-white/15">REAL-TIME</span>
              </div>

              {/* Feed Items */}
              <div className="divide-y divide-white/[0.04]">
                {earnings.map((e) => (
                  <div key={e.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs text-white/60 font-medium truncate">{e.skill}</span>
                        <span className="text-[9px] font-medium text-white/15">by {e.creator}</span>
                      </div>
                      <div className="text-[10px] font-medium text-white/20">
                        called by <span className="text-white/30">{e.operator}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="text-sm font-normal text-zinc-300">{e.amount}</div>
                      <div className="text-[9px] font-medium text-white/15">{e.time}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Feed Footer */}
              <div className="px-5 py-3 border-t border-white/[0.07] flex items-center justify-between">
                <span className="text-[9px] font-medium text-white/15">Payments settle instantly via x402</span>
                <Link href="/skill-marketplace" className="text-[10px] font-medium text-zinc-300/50 hover:text-zinc-300 transition-colors">
                  View all activity
                </Link>
              </div>
            </div>

            {/* Composability Teaser */}
            <div className="mt-4 border border-white/[0.07] bg-white/[0.02] p-5 rounded">
              <div className="text-[9px] font-medium text-white/20 tracking-wider mb-3">SKILLS CHAIN TOGETHER</div>
              <p className="text-xs text-white/30 leading-relaxed mb-4">
                The real power is composability. Skills can call other skills. A "Portfolio Rebalancer" might use the "50-DEX Router" which uses the "Gas Oracle." Every skill in the chain earns. One workflow, multiple creators paid.
              </p>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {["Whale Alert", "Signal Generator", "Swap Router", "Gas Oracle"].map((s, i) => (
                  <div key={s} className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-medium text-white/40 border border-white/[0.08] px-2.5 py-1 whitespace-nowrap">{s}</span>
                    {i < 3 && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="1.5" className="shrink-0 opacity-30">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-zinc-300/30 mt-3">Each skill in the chain earns its creator a payment.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
