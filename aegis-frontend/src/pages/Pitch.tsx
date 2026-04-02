/**
 * Clean, data-rich, designed for VC due diligence
 * Sections: Hero, Problem, Solution, TAM, Traction, Competitive, Token, Team, CTA
 */
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import { NvidiaEyeLogo } from "@/components/NvidiaLogo";

/* ── Animated Counter ─────────────────────────────────────────────────── */
function AnimatedNumber({ target, prefix = "", suffix = "", duration = 2000 }: { target: number; prefix?: string; suffix?: string; duration?: number }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCurrent(Math.round(target * eased));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{prefix}{current.toLocaleString()}{suffix}</span>;
}

/* ── Section Divider ──────────────────────────────────────────────────── */
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="h-px flex-1 bg-white/[0.06]" />
      <span className="text-[9px] font-medium text-white/15 tracking-wider">{label}</span>
      <div className="h-px flex-1 bg-white/[0.06]" />
    </div>
  );
}

export default function Pitch() {
  return (
    <div className="min-h-screen bg-white/[0.02] text-white/80">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-[10px] font-medium text-zinc-300/40 tracking-wider mb-6">CONFIDENTIAL -- INVESTOR OVERVIEW</div>
          <h1 className="text-4xl md:text-6xl font-normal tracking-tight text-white/95 leading-[1.1] mb-6">
            The only platform combining marketplace +<br />
            <span className="text-zinc-300">trust layer + payments + IDE for the $52B agent economy.</span>
          </h1>
          <p className="text-lg text-white/30 leading-relaxed max-w-2xl mb-10">
            Cursor raised at $29B. Copilot has 20M users. 19K MCP servers exist. 75M x402 transactions have settled. But nobody built what agents actually need: trust + payments + IDE in one platform. Aegis has AegisX with 86 modules including Solana-native capabilities no competitor offers, NeMo guardrails for trust, x402 for payments, and direct Bags.fm integration ($5B volume, $40M creator payouts). Every invocation generates protocol revenue. Every transaction burns $AEGIS.
          </p>
          <div className="flex flex-wrap gap-4 mb-12">
            <a href="mailto:invest@aegisplace.com" className="text-sm font-normal bg-white text-zinc-900 px-8 py-3.5 hover:bg-zinc-200 transition-colors rounded">
              Schedule a Call
            </a>
            <a href="/execution-manifest.json" target="_blank" className="text-sm font-medium border border-white/[0.04] text-white/35 hover:text-white/55 hover:border-white/[0.12] px-8 py-3.5 transition-all">
              Execution Manifest
            </a>
          </div>

          {/* Product Demo Video */}
          <div className="relative group">
            <div className="absolute -inset-px bg-gradient-to-b from-[#A1A1AA]/10 via-transparent to-transparent rounded opacity-0 group-hover:opacity-100" />
            <div className="relative border border-white/[0.04] rounded overflow-hidden bg-white/[0.02]">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.04] bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[rgba(220,100,60,0.45)]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/50" />
                </div>
                <span className="text-[10px] font-medium text-white/20 ml-2">aegis-protocol-demo.mp4</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                  <span className="text-[9px] font-medium text-zinc-300/40">36s</span>
                </div>
              </div>
              <video
                className="w-full aspect-video"
                autoPlay
                muted
                loop
                playsInline
                poster=""
              >
                <source src="https://d2xsxph8kpxj0f.cloudfront.net/310519663305557175/YNULcqsamfwqB8eQkc2VNX/aegis_demo_v2_8073d8e4.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="text-center mt-3">
              <span className="text-[10px] font-medium text-white/15 tracking-widest">PRODUCT DEMO // DISCOVERY + x402 PAYMENT + THREAT ASSESSMENT + TELEMETRY</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Metrics ───────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.04]">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {[
            { value: 57, suffix: "", label: "AegisX Tools", prefix: "" },
            { value: 19000, suffix: "+", label: "MCP Servers", prefix: "" },
            { value: 75, suffix: "M+", label: "x402 Transactions", prefix: "" },
            { value: 29, suffix: "B", label: "Cursor Valuation", prefix: "$" },
          ].map((m, i) => (
            <div key={i} className={`p-6 md:p-8 ${i < 3 ? "border-r border-white/[0.04]" : ""} ${i < 2 ? "border-b md:border-b-0 border-white/[0.04]" : ""}`}>
              <div className="text-2xl md:text-3xl font-normal text-white/90 ">
                <AnimatedNumber target={m.value} prefix={m.prefix} suffix={m.suffix} />
              </div>
              <div className="text-[10px] font-medium text-white/20 tracking-wider mt-1">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Problem ───────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <SectionDivider label="THE PROBLEM" />
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-normal text-white/90 tracking-tight mb-6">
                AI agents cannot discover, trust, pay, and execute autonomously.
              </h2>
              <p className="text-sm text-white/30 leading-relaxed mb-4">
                Cursor raised at $29B building IDE tools. Copilot has 20M users for code completion. But neither enables autonomous agent commerce. 19K MCP servers have zero trust verification. 75M x402 transactions flow without quality guarantees. Agents default to centralized APIs because there is no unified platform for discovery, trust, payment, and execution.
              </p>
              <p className="text-sm text-white/30 leading-relaxed">
                The result: a $7B x402 ecosystem and a $5B Solana DeFi market (Bags.fm alone) are disconnected from agent infrastructure. Aegis is the only platform that unifies marketplace, trust layer (NeMo guardrails + bonded operators), payments (x402), and IDE (AegisX with 86 modules) in one protocol.
              </p>
            </div>
            <div className="space-y-3">
              {[
                { problem: "No payment rails", detail: "Agents cannot pay other agents for work. Skills are free or API-key gated." },
                { problem: "No quality guarantees", detail: "No way to verify if a skill actually works before paying for it." },
                { problem: "No reputation system", detail: "No on-chain history of skill performance, reliability, or trustworthiness." },
                { problem: "No dispute resolution", detail: "When a skill fails, there is no recourse. Payment is lost." },
                { problem: "No economic incentive", detail: "Skill creators have no revenue model. Validators have no reward." },
              ].map((p, i) => (
                <div key={i} className="border border-white/[0.04] bg-white/[0.01] p-4 hover:bg-white/[0.02] transition-colors">
                  <div className="text-sm font-normal text-[rgba(220,100,60,0.50)] mb-1">{p.problem}</div>
                  <div className="text-[12px] text-white/25 leading-relaxed">{p.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Solution ──────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <SectionDivider label="THE SOLUTION" />
          <div className="mt-10">
            <h2 className="text-2xl md:text-3xl font-normal text-white/90 tracking-tight mb-8">
              Aegis: the full stack for autonomous agent commerce.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: "Bonded Registration",
                  desc: "Operators stake $AEGIS to register. Bond gets slashed if the operator is malicious or broken. Skin in the game from day one.",
                  metric: "$AEGIS staked",
                  value: "Per operator",
                },
                {
                  title: "x402 Micropayments",
                  desc: "HTTP 402-native payments settle in under 50ms on Solana. Agents pay per invocation. No API keys, no subscriptions, no minimums.",
                  metric: "Settlement time",
                  value: "<50ms",
                },
                {
                  title: "Validator Attestation",
                  desc: "Independent validators stake $AEGIS to verify output quality. Accurate attestations earn 10% of revenue. Inaccurate ones get slashed.",
                  metric: "Revenue share",
                  value: "15%",
                },
                {
                  title: "6-Pillar Trust Scoring",
                  desc: "Composite success rate across Operational Readiness, Verification, Combat Record, Network Attestation, Economic Stake, and Ecosystem Reach.",
                  metric: "Assessment pillars",
                  value: "6",
                },
                {
                  title: "Pipeline Delegation",
                  desc: "Multi-step task chains where Aegis selects optimal operators for each step. One API call, multiple operators, aggregated results.",
                  metric: "Orchestration",
                  value: "Multi-step",
                },
                {
                  title: "Burn Flywheel",
                  desc: "0.5% of every invocation fee is permanently burned. The busier the protocol gets, the scarcer $AEGIS becomes. Usage drives deflation.",
                  metric: "Burn rate",
                  value: "2% per tx",
                },
              ].map((s, i) => (
                <div key={i} className="border border-white/[0.04] bg-white/[0.01] p-5 hover:bg-white/[0.02] transition-colors">
                  <div className="text-sm font-normal text-white/70 mb-2">{s.title}</div>
                  <p className="text-[12px] text-white/25 leading-relaxed mb-4">{s.desc}</p>
                  <div className="border-t border-white/[0.04] pt-3 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-white/15">{s.metric}</span>
                    <span className="text-[11px] font-medium text-zinc-300/60">{s.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Now ──────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <SectionDivider label="WHY NOW" />
          <div className="mt-10">
            <h2 className="text-2xl md:text-3xl font-normal text-white/90 tracking-tight mb-4">
              Five market signals in five weeks.
            </h2>
            <p className="text-sm text-white/25 leading-relaxed mb-8 max-w-2xl">
              The agent economy just hit an inflection point. Infrastructure is shipping fast, but trust is missing from every layer. Aegis exists to fill that gap.
            </p>
            <div className="space-y-3">
              {[
                {
                  signal: "Cursor raised at $29B, Copilot hit 20M users",
                  implication: "AI coding tools are the fastest-growing software category. But none offer agent-to-agent commerce, trust infrastructure, or Solana-native capabilities. Aegis fills the gap with AegisX (86 modules).",
                },
                {
                  signal: "Stripe MPP launched March 18 with Visa/Mastercard/OpenAI",
                  implication: "Validates agent payments as a category. Creates immediate need for a trust layer on top of payment rails.",
                },
                {
                  signal: "19K+ MCP servers with zero trust model",
                  implication: "McpInject malware is already harvesting secrets from MCP servers. The ecosystem has no verification, no reputation, no safety layer.",
                },
                {
                  signal: "351K+ skills indexed, no quality verification",
                  implication: "The open-source agent skill ecosystem is exploding but completely unverified. Anyone can publish, no one validates.",
                },
                {
                  signal: "Bags.fm hit $5B volume, $40M creator payouts",
                  implication: "Solana DeFi is liquid and real. Aegis integrates directly with Bags.fm, giving agents access to trading, portfolio management, and DeFi strategies through AegisX.",
                },
                {
                  signal: "A2A v1.0 shipped",
                  implication: "Google's Agent-to-Agent protocol means agent interop is here. But interop without trust is a security nightmare.",
                },
              ].map((s, i) => (
                <div key={i} className="border border-white/[0.04] bg-white/[0.01] p-5 hover:bg-white/[0.02] transition-colors">
                  <div className="text-sm font-normal text-zinc-300/70 mb-1">{s.signal}</div>
                  <div className="text-[12px] text-white/25 leading-relaxed">{s.implication}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TAM / SAM / SOM ───────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <SectionDivider label="MARKET OPPORTUNITY" />
          <div className="mt-10">
            <h2 className="text-2xl md:text-3xl font-normal text-white/90 tracking-tight mb-4">
              Three converging markets. One platform.
            </h2>
            <p className="text-sm text-white/25 leading-relaxed mb-10 max-w-2xl">
              AI coding tools ($29B Cursor valuation alone), agent infrastructure ($7B x402 ecosystem, 75M transactions), and Solana DeFi ($5B+ Bags.fm volume). The AI agent market is growing at 46.3% CAGR to $52.62B by 2030. Aegis is the only platform spanning all three markets: IDE (AegisX, 86 modules), trust (NeMo guardrails, bonded operators), and payments (x402 micropayments).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              {[
                {
                  label: "TAM",
                  title: "AI Coding + Agent Infrastructure",
                  value: "$52.62B",
                  desc: "AI coding tools ($29B Cursor alone), AI agent market ($7.84B growing to $52.62B by 2030 at 46.3% CAGR), and Solana DeFi ($5B+ Bags.fm). Three markets converging into one platform.",
                  source: "MarketsandMarkets, Cursor Series C, Bags.fm Analytics",
                },
                {
                  label: "SAM",
                  title: "Agent Commerce + DeFi",
                  value: "$7B",
                  desc: "x402 ecosystem ($7B, 75M transactions), 19K MCP servers, 20M Copilot users. Bags.fm alone has $5B volume and $40M creator payouts. 65% of agentic payments settle on Solana.",
                  source: "x402 Foundation, GitHub, Bags.fm, Dune Analytics",
                },
                {
                  label: "SOM",
                  title: "Platform Capture",
                  value: "$4.2B",
                  desc: "Aegis captures across three revenue streams: marketplace fees (trust layer), IDE subscriptions (AegisX 86 modules), and DeFi integration (Bags.fm). Only platform combining all four: marketplace + trust + payments + IDE.",
                  source: "Internal projections",
                },
              ].map((m, i) => (
                <div key={i} className="border border-white/[0.04] bg-white/[0.01] p-6">
                  <div className="text-[10px] font-medium text-zinc-300/40 tracking-wider mb-3">{m.label}</div>
                  <div className="text-3xl font-normal text-white/90 mb-1">{m.value}</div>
                  <div className="text-xs text-white/40 mb-3">{m.title}</div>
                  <p className="text-[12px] text-white/20 leading-relaxed mb-3">{m.desc}</p>
                  <div className="text-[10px] font-medium text-white/10">{m.source}</div>
                </div>
              ))}
            </div>

            {/* Ecosystem Adoption */}
            <div className="border border-white/[0.04] bg-white/[0.01] p-6 mb-4">
              <div className="text-[10px] font-medium text-white/15 tracking-wider mb-4">ECOSYSTEM ADOPTION</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { metric: "19K+", label: "MCP Servers", detail: "Model Context Protocol ecosystem" },
                  { metric: "57", label: "AegisX Tools", detail: "Solana, Trading, Bags.fm, AI, Intel, Browser" },
                  { metric: "75M+", label: "x402 Transactions", detail: "Autonomous agent payments" },
                  { metric: "$5B", label: "Bags.fm Volume", detail: "$40M creator payouts integrated" },
                ].map((e, i) => (
                  <div key={i} className="text-center">
                    <div className="text-xl md:text-2xl font-normal text-white/90">{e.metric}</div>
                    <div className="text-[11px] font-medium text-white/40 mt-1">{e.label}</div>
                    <div className="text-[10px] text-white/15 mt-0.5">{e.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth drivers */}
            <div className="border border-white/[0.04] bg-white/[0.01] p-6">
              <div className="text-[10px] font-medium text-white/15 tracking-wider mb-4">GROWTH CATALYSTS</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { driver: "AI coding market proven ($29B Cursor, 20M Copilot)", detail: "AegisX with 86 modules competes directly. Solana-native capabilities and x402 payments are unique moats no incumbent can replicate." },
                  { driver: "x402 Foundation + Bags.fm integration", detail: "75M x402 transactions. $5B Bags.fm volume. $40M creator payouts. Aegis connects agent infrastructure to real DeFi liquidity." },
                  { driver: "MCP ecosystem (19K+ servers, zero trust)", detail: "McpInject malware already exploiting the gap. NeMo guardrails and bonded operators solve the trust crisis." },
                  { driver: "Solana dominance (65% of agentic payments)", detail: "Sub-second finality, sub-cent fees. Aegis is Solana-native with direct Bags.fm DeFi integration." },
                ].map((g, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-1 bg-white/20 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-normal text-white/60 mb-1">{g.driver}</div>
                      <div className="text-[12px] text-white/20 leading-relaxed">{g.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Traction ──────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <SectionDivider label="TRACTION" />
          <div className="mt-10">
            <h2 className="text-2xl md:text-3xl font-normal text-white/90 tracking-tight mb-8">
              Built in public. Shipping weekly.
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
              {[
                { value: "57", label: "AegisX Tools Live", trend: "Solana, Trading, Bags.fm, AI" },
                { value: "1", label: "Working IDE", trend: "aegisx CLI + MCP bridge" },
                { value: "19K+", label: "MCP Servers Bridged", trend: "Growing" },
                { value: "Live", label: "Dashboard + Marketplace", trend: "aegisplace.com" },
              ].map((t, i) => (
                <div key={i} className="border border-white/[0.04] bg-white/[0.01] p-4 md:p-5">
                  <div className="text-xl md:text-2xl font-normal text-white/90 ">{t.value}</div>
                  <div className="text-[10px] font-medium text-white/20 tracking-wider mt-1">{t.label}</div>
                  <div className="text-[10px] font-medium text-zinc-300/40 mt-2">{t.trend}</div>
                </div>
              ))}
            </div>

            {/* Milestones */}
            <div className="border border-white/[0.04] bg-white/[0.01] p-6">
              <div className="text-[10px] font-medium text-white/15 tracking-wider mb-4">MILESTONES</div>
              <div className="space-y-4">
                {[
                  { date: "Q1 2026", milestone: "Protocol design complete", status: "done", detail: "Solana program architecture, x402 integration spec, success scoring model, tokenomics finalized." },
                  { date: "Q1 2026", milestone: "Frontend and marketplace live", status: "done", detail: "Full operator marketplace, skill directory, ops dashboard, interactive playground, investor pitch page." },
                  { date: "Q2 2026", milestone: "Solana program deployment", status: "active", detail: "Deploy bonded registration, x402 payment settlement, and validator attestation programs to devnet." },
                  { date: "Q2 2026", milestone: "Validator network launch", status: "upcoming", detail: "Onboard first 50 validators with staked bonds. Begin attestation scoring on live invocations." },
                  { date: "Q3 2026", milestone: "$AEGIS token launch", status: "upcoming", detail: "Token Generation Event. Liquidity provision on Jupiter. Staking rewards activation." },
                  { date: "Q4 2026", milestone: "Mainnet and full decentralization", status: "upcoming", detail: "Governance transfer, community validator elections, cross-chain bridge activation." },
                ].map((m, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-20 flex-shrink-0">
                      <div className="text-[11px] font-medium text-white/25">{m.date}</div>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${
                      m.status === "done" ? "bg-white" : m.status === "active" ? "bg-white/50 animate-pulse" : "bg-white/10"
                    }`} />
                    <div className="flex-1">
                      <div className={`text-sm font-normal ${m.status === "done" ? "text-white/60" : m.status === "active" ? "text-zinc-300/70" : "text-white/30"}`}>
                        {m.milestone}
                      </div>
                      <div className="text-[12px] text-white/20 leading-relaxed mt-0.5">{m.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Competitive ───────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <SectionDivider label="COMPETITIVE LANDSCAPE" />
          <div className="mt-10">
            <h2 className="text-2xl md:text-3xl font-normal text-white/90 tracking-tight mb-4">
              Our moat: the only platform combining all five.
            </h2>
            <p className="text-sm text-white/25 leading-relaxed mb-8 max-w-2xl">
              Cursor ($29B) has an IDE but no payments or trust. Copilot (20M users) has code completion but no agent commerce. x402 has payments but no validation. MCP has discovery but no safety. Bags.fm has DeFi liquidity but no agent infrastructure. Aegis is the only platform that combines marketplace + trust layer + payments + IDE + DeFi integration.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-[10px] font-medium text-white/20 tracking-wider py-3 pr-4">PLATFORM</th>
                    <th className="text-[10px] font-medium text-white/20 tracking-wider py-3 px-3 text-center">PAYMENTS</th>
                    <th className="text-[10px] font-medium text-white/20 tracking-wider py-3 px-3 text-center">VALIDATION</th>
                    <th className="text-[10px] font-medium text-white/20 tracking-wider py-3 px-3 text-center">REPUTATION</th>
                    <th className="text-[10px] font-medium text-white/20 tracking-wider py-3 px-3 text-center">SAFETY LAYER</th>
                    <th className="text-[10px] font-medium text-[#76B900]/40 tracking-wider py-3 px-3 text-center">NVIDIA NeMo</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Aegis Protocol", payments: true, validation: true, reputation: true, safety: true, nvidia: true, highlight: true, note: "86 modules, NeMo guardrails, x402, Bags.fm, IDE" },
                    { name: "Cursor ($29B)", payments: false, validation: false, reputation: false, safety: false, nvidia: false, highlight: false, note: "IDE only -- no payments, no trust, no agents" },
                    { name: "GitHub Copilot (20M)", payments: false, validation: false, reputation: false, safety: false, nvidia: false, highlight: false, note: "Code completion -- no agent commerce" },
                    { name: "Stripe MPP / x402", payments: true, validation: false, reputation: false, safety: false, nvidia: false, highlight: false, note: "75M tx -- payment rail only, no trust layer" },
                    { name: "MCP Ecosystem (19K)", payments: false, validation: false, reputation: false, safety: false, nvidia: false, highlight: false, note: "Discovery only -- zero trust, McpInject exploits" },
                    { name: "Warden Protocol", payments: true, validation: false, reputation: false, safety: false, nvidia: false, highlight: false, note: "$200M val -- separate L1, no safety or IDE" },
                    { name: "Bags.fm ($5B vol)", payments: true, validation: false, reputation: false, safety: false, nvidia: false, highlight: false, note: "DeFi only -- Aegis integrates their liquidity" },
                  ].map((c, i) => (
                    <tr key={i} className={`border-b border-white/[0.04] ${c.highlight ? "bg-white/[0.02]" : ""}`}>
                      <td className={`py-3 pr-4 ${c.highlight ? "text-zinc-300 font-normal" : "text-white/40"}`}>
                        <div className="text-sm">{c.name}</div>
                        <div className="text-[10px] text-white/15 mt-0.5">{c.note}</div>
                      </td>
                      {[c.payments, c.validation, c.reputation, c.safety, c.nvidia].map((v, j) => (
                        <td key={j} className="py-3 px-3 text-center">
                          <span className={`text-sm ${v ? "text-zinc-300" : "text-white/10"}`}>{v ? "\u2713" : "\u2717"}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[12px] text-white/15 mt-4 leading-relaxed">
              Cursor ($29B) and Copilot (20M users) prove the AI coding market is massive but offer no agent commerce. x402 has 75M transactions but no trust layer. MCP has 19K servers but zero validation. Bags.fm has $5B volume but no agent infrastructure. Aegis is the only platform that combines all five: micropayments (x402), bonded validation (NeMo guardrails), on-chain reputation, a safety layer, and a full IDE (AegisX with 86 Solana-native modules). Our team has deep expertise in MCP, x402, Solana, and NeMo guardrails -- we understand the market because we built the integrations.
            </p>

            {/* NVIDIA Moat */}
            <div className="mt-10 border border-[#76B900]/10 bg-[#76B900]/[0.02] p-6 rounded">
              <div className="flex items-center gap-2 mb-4">
                <NvidiaEyeLogo size={16} className="text-[#76B900]" />
                <span className="text-[10px] font-medium text-[#76B900]/60 tracking-wider">NeMo MOAT</span>
              </div>
              <p className="text-[13px] text-white/35 leading-relaxed mb-4">
                Aegis is the only AI agent marketplace with the full NVIDIA NeMo stack integrated at the protocol level. Seven enterprise components create compounding advantages that are extremely difficult to replicate:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { name: "NeMo Guardrails", desc: "5-layer safety on every invocation. Compliance rates feed success rates." },
                  { name: "NeMo Evaluator", desc: "24+ automated metrics replace user ratings. Objective, reproducible, gaming-resistant." },
                  { name: "NVIDIA NIM", desc: "GPU-optimized containers. 4.2x speedup. Priority marketplace placement." },
                  { name: "Nemotron Models", desc: "Nano/Super/Ultra tiers. Open weights. Fine-tuning recipes included." },
                  { name: "NeMo Curator", desc: "Data quality pipeline. 30+ languages. Clean data = better operators." },
                  { name: "NeMo RL + Gym", desc: "Every invocation improves operators. Self-improving marketplace." },
                ].map((item) => (
                  <div key={item.name} className="border border-[#76B900]/10 bg-[#76B900]/[0.02] p-3 rounded">
                    <div className="text-[12px] font-normal text-[#76B900]/80 mb-0.5">{item.name}</div>
                    <div className="text-[11px] text-white/25 leading-relaxed">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Token Economics ────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <SectionDivider label="TOKEN ECONOMICS" />
          <div className="mt-10">
            <h2 className="text-2xl md:text-3xl font-normal text-white/90 tracking-tight mb-4">
              Usage burns tokens. Validation locks tokens.
            </h2>
            <p className="text-sm text-white/25 leading-relaxed mb-8 max-w-2xl">
              $AEGIS is the native token of the protocol. Every invocation payment flows through $AEGIS. A percentage of every transaction is permanently burned. Validators must stake $AEGIS to participate. Both mechanisms reduce circulating supply over time.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {/* Revenue Split */}
              <div className="border border-white/[0.04] bg-white/[0.01] p-6">
                <div className="text-[10px] font-medium text-white/15 tracking-wider mb-4">REVENUE SPLIT</div>
                <div className="space-y-3">
                  {[
                    { label: "Operator (creator)", pct: 85, color: "#A1A1AA" },
                    { label: "Validators", pct: 15, color: "#71717A" },
                    { label: "Stakers", pct: 3, color: "#6B7280" },
                    { label: "Protocol Treasury", pct: 8, color: "#eab308" },
                    { label: "Insurance", pct: 3, color: "#3b82f6" },
                    { label: "Permanent Burn", pct: 0.5, color: "rgba(220,100,60,0.50)" },
                  ].map((r, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] text-white/40">{r.label}</span>
                        <span className="text-[12px] font-medium" style={{ color: r.color }}>{r.pct}%</span>
                      </div>
                      <div className="w-full bg-white/[0.04] h-1.5">
                        <div className="h-1.5 transition-all" style={{ width: `${r.pct}%`, background: r.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Token Allocation */}
              <div className="border border-white/[0.04] bg-white/[0.01] p-6">
                <div className="text-[10px] font-medium text-white/15 tracking-wider mb-4">TOKEN ALLOCATION</div>
                <div className="space-y-3">
                  {[
                    { label: "Protocol Treasury", pct: 30, color: "#A1A1AA", vesting: "4-year linear unlock" },
                    { label: "Creator Rewards", pct: 25, color: "#71717A", vesting: "Earned via invocations" },
                    { label: "Validator Staking", pct: 20, color: "#3b82f6", vesting: "Locked while validating" },
                    { label: "Community / Airdrop", pct: 15, color: "#eab308", vesting: "TGE + 6-month distribution" },
                    { label: "Team", pct: 10, color: "#8b5cf6", vesting: "1-year cliff, 3-year vest" },
                  ].map((a, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] text-white/40">{a.label}</span>
                        <span className="text-[12px] font-medium" style={{ color: a.color }}>{a.pct}%</span>
                      </div>
                      <div className="w-full bg-white/[0.04] h-1.5">
                        <div className="h-1.5 transition-all" style={{ width: `${a.pct}%`, background: a.color }} />
                      </div>
                      <div className="text-[10px] font-medium text-white/10 mt-0.5">{a.vesting}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Flywheel */}
            <div className="border border-white/[0.04] bg-white/[0.01] p-6">
              <div className="text-[10px] font-medium text-white/15 tracking-wider mb-4">DEFLATIONARY FLYWHEEL</div>
              <div className="flex flex-wrap items-center justify-center gap-3 text-[12px] font-medium">
                {[
                  "Agent invokes operator",
                  "x402 payment in $AEGIS",
                  "0.5% burned permanently",
                  "Validator attests quality",
                  "Reputation score updates",
                  "Higher trust attracts more agents",
                  "More invocations, more burns",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-white/30 bg-white/[0.03] border border-white/[0.04] px-3 py-1.5">{step}</span>
                    {i < 6 && <span className="text-zinc-300/30">&rarr;</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Research Backing ───────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <SectionDivider label="RESEARCH BACKING" />
          <div className="mt-10">
            <h2 className="text-2xl md:text-3xl font-normal text-white/90 tracking-tight mb-8">
              Grounded in peer-reviewed research.
            </h2>
            <div className="space-y-3">
              {[
                { title: "The Coasean Singularity", authors: "Cowen & Zhang", venue: "NBER 2019", insight: "Identity, credentials, and reputation enable small purchases that were previously uneconomical. Aegis implements this for agent-to-agent transactions." },
                { title: "Regulatory Markets for AI Agents", authors: "Hadfield", venue: "Oxford 2023", insight: "Infrastructure that allows artificial agents to participate in regulated economic activity. Aegis provides the trust and payment infrastructure." },
                { title: "Infrastructure for AI Agents", authors: "Chan, Anderljung et al.", venue: "GovAI 2024", insight: "Attribution, Shaping, and Oversight as the three functions of agent infrastructure. Aegis implements all three via bonded registration, validation, and reputation." },
                { title: "Formal Contracts for AI Agents", authors: "Haupt & Christoffersen", venue: "MIT CSAIL 2024", insight: "Binding reward transfers produce socially optimal outcomes in multi-agent systems. Aegis's x402 payments are exactly this mechanism." },
                { title: "Ethereum as AI Settlement Layer", authors: "Vitalik Buterin", venue: "2026", insight: "Bots paying bots, security deposits, reputations, dispute resolution. Aegis builds this vision on Solana for speed and cost." },
              ].map((p, i) => (
                <div key={i} className="border border-white/[0.04] bg-white/[0.01] p-5 hover:bg-white/[0.02] transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                    <div className="text-sm font-normal text-white/60">{p.title}</div>
                    <div className="text-[10px] font-medium text-white/15">{p.authors} -- {p.venue}</div>
                  </div>
                  <p className="text-[12px] text-white/25 leading-relaxed">{p.insight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── The Ask ────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <SectionDivider label="THE ASK" />
          <div className="mt-10 border border-white/15 bg-white/[0.02] p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-normal text-white/90 tracking-tight mb-4">
              Live product. Working IDE. 86 modules. MCP bridge functional. Raising to scale.
            </h2>
            <p className="text-sm text-white/30 leading-relaxed mb-8 max-w-2xl">
              The live dashboard, working AegisX IDE with 86 modules, MCP server bridge, marketplace, and protocol design are complete. Traction: functional aegisx CLI, Bags.fm integration, NeMo guardrails, x402 payment flow. The vision: autonomous agents that discover, evaluate, pay for, and execute skills without human intervention. We are looking for strategic investors who understand that the next $29B company in AI is not another IDE -- it is the trust and payment infrastructure underneath all of them.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: "Use of Funds", items: ["Solana program development", "Validator onboarding incentives", "Security audits (2x)", "Liquidity provision"] },
                { label: "Timeline", items: ["Q2 2026: Devnet deployment", "Q2 2026: Validator network", "Q3 2026: Token launch", "Q4 2026: Mainnet"] },
                { label: "What We Need", items: ["Strategic capital", "Solana ecosystem connections", "Agent framework partnerships", "Exchange relationships"] },
              ].map((col, i) => (
                <div key={i}>
                  <div className="text-[10px] font-medium text-zinc-300/40 tracking-wider mb-3">{col.label}</div>
                  <div className="space-y-2">
                    {col.items.map((item, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <span className="text-zinc-300/30 text-[6px] mt-1.5">&#9679;</span>
                        <span className="text-[12px] text-white/35">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              <a href="mailto:invest@aegisplace.com" className="text-sm font-normal bg-white text-zinc-900 px-8 py-3.5 hover:bg-zinc-200 transition-colors rounded">
                Schedule a Call
              </a>
              <Link href="/dashboard" className="text-sm font-medium border border-white/20 text-zinc-300/60 hover:text-zinc-300 hover:border-white/40 px-8 py-3.5 transition-all">
                View Live Dashboard
              </Link>
              <Link href="/marketplace" className="text-sm font-medium border border-white/[0.04] text-white/35 hover:text-white/55 hover:border-white/[0.12] px-8 py-3.5 transition-all">
                Browse Marketplace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.04] py-10 px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[10px] font-medium text-white/15">
            AEGIS PROTOCOL -- CONFIDENTIAL INVESTOR OVERVIEW
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-[11px] text-white/20 hover:text-white/40 transition-colors">Home</Link>
            <Link href="/marketplace" className="text-[11px] text-white/20 hover:text-white/40 transition-colors">Marketplace</Link>
            <Link href="/dashboard" className="text-[11px] text-white/20 hover:text-white/40 transition-colors">Dashboard</Link>
            <Link href="/playground" className="text-[11px] text-white/20 hover:text-white/40 transition-colors">Playground</Link>
            <a href="mailto:invest@aegisplace.com" className="text-[11px] text-zinc-300/40 hover:text-zinc-300 transition-colors">invest@aegisplace.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
