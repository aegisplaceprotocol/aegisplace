import { useState } from "react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/sections/Footer";

/* -- Competitors ---------------------------------------------------------- */
const COMPETITORS = [
  { name: "AegisX", highlight: true },
  { name: "Cursor", highlight: false },
  { name: "Windsurf", highlight: false },
  { name: "Copilot", highlight: false },
  { name: "Bolt.new", highlight: false },
  { name: "Replit", highlight: false },
];

/* -- Feature comparison rows ---------------------------------------------- */
interface CompareRow {
  feature: string;
  category: string;
  values: string[];
}

const FEATURES: CompareRow[] = [
  {
    feature: "Solana-native tools",
    category: "Blockchain",
    values: ["24 actions", "None", "None", "None", "None", "None"],
  },
  {
    feature: "Smart contract audit",
    category: "Blockchain",
    values: ["15 classes", "None", "None", "None", "None", "None"],
  },
  {
    feature: "Bags.fm integration",
    category: "Blockchain",
    values: ["6 tools", "None", "None", "None", "None", "None"],
  },
  {
    feature: "x402 micropayments",
    category: "Blockchain",
    values: ["Native", "None", "None", "None", "None", "None"],
  },
  {
    feature: "MCP tools",
    category: "Platform",
    values: ["57", "Extensions", "Extensions", "Extensions", "None", "Limited"],
  },
  {
    feature: "Browser-based",
    category: "Platform",
    values: ["Yes", "No", "No", "Codespaces", "Yes", "Yes"],
  },
  {
    feature: "Multi-agent swarms",
    category: "Platform",
    values: ["16 agents", "8 agents", "Cascade", "None", "None", "Agent"],
  },
  {
    feature: "NeMo Guardrails",
    category: "Safety",
    values: ["4 rail types", "None", "None", "None", "None", "None"],
  },
  {
    feature: "Input validation",
    category: "Safety",
    values: ["Automated", "None", "None", "None", "None", "None"],
  },
  {
    feature: "Output filtering",
    category: "Safety",
    values: ["Automated", "None", "None", "None", "None", "None"],
  },
  {
    feature: "Hallucination detection",
    category: "Safety",
    values: ["Automated", "None", "None", "None", "None", "None"],
  },
  {
    feature: "On-chain trust scores",
    category: "Trust",
    values: ["6-pillar", "None", "None", "None", "None", "None"],
  },
  {
    feature: "Bonded validation",
    category: "Trust",
    values: ["$AEGIS stake", "None", "None", "None", "None", "None"],
  },
  {
    feature: "GPU-native rendering",
    category: "Performance",
    values: ["Zed (120fps)", "Electron", "Electron", "Varies", "Browser", "Browser"],
  },
  {
    feature: "Price",
    category: "Pricing",
    values: ["TBD", "$20/mo", "$15/mo", "$10/mo", "$25/mo", "$17/mo"],
  },
];

const CATEGORIES = ["All", "Blockchain", "Platform", "Safety", "Trust", "Performance", "Pricing"];

function getCellStyle(value: string, isAegis: boolean): string {
  if (value === "None") return "text-white/15";
  if (isAegis) return "text-emerald-400/80 font-medium";
  return "text-white/50";
}

function getCellBg(value: string, isAegis: boolean): string {
  if (isAegis && value !== "None" && value !== "TBD") return "bg-emerald-400/[0.03]";
  return "";
}

export default function Compare() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const filteredFeatures = activeCategory === "All"
    ? FEATURES
    : FEATURES.filter((f) => f.category === activeCategory);

  // Count AegisX advantages
  const aegisOnlyCount = FEATURES.filter(
    (f) => f.values[0] !== "None" && f.values[0] !== "TBD" && f.values.slice(1).every((v) => v === "None")
  ).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 border-b border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="text-[11px] font-medium tracking-wider text-zinc-300/40 mb-6">
            COMPARISON
          </div>

          <h1 className="text-[clamp(2rem,5vw,3.75rem)] font-normal text-white leading-[1.05] tracking-tight mb-4">
            AegisX vs. everything else.
            <br />
            <span className="text-white/30">Feature-by-feature. No marketing.</span>
          </h1>

          <p className="text-[15px] sm:text-[16px] text-white/35 max-w-2xl leading-relaxed">
            A transparent comparison of AegisX against the leading AI development environments.
            We include every feature where AegisX leads and every feature where competitors match or exceed us.
          </p>
        </div>
      </section>

      {/* Key metrics */}
      <section className="py-12 border-b border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.04]">
            {[
              { value: String(aegisOnlyCount), label: "AegisX-only features" },
              { value: "57", label: "MCP tools integrated" },
              { value: "4", label: "Guardrail types (vs 0)" },
              { value: "120fps", label: "GPU rendering (vs Electron)" },
            ].map((m) => (
              <div key={m.label} className="bg-white/[0.015] p-5 sm:p-8 text-center">
                <div className="text-[24px] sm:text-[32px] font-normal text-zinc-300 tracking-tight">{m.value}</div>
                <div className="text-[10px] sm:text-[11px] font-medium text-white/20 tracking-wider mt-1">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category filter */}
      <section className="py-8 border-b border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-[11px] font-medium tracking-wider transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-white/[0.06] text-zinc-300 border border-white/[0.12]"
                    : "bg-white/[0.015] text-white/30 border border-white/[0.04] hover:text-white/50 hover:border-white/[0.08]"
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left py-5 pr-6 text-[11px] font-medium text-white/20 tracking-wider w-[200px]">
                    FEATURE
                  </th>
                  {COMPETITORS.map((c) => (
                    <th key={c.name} className="text-center py-5 px-3 min-w-[120px]">
                      <div className={`text-[13px] font-normal tracking-tight ${
                        c.highlight ? "text-emerald-400/80" : "text-white/50"
                      }`}>
                        {c.name}
                      </div>
                      {c.highlight && (
                        <div className="text-[9px] font-medium tracking-wider text-emerald-400/40 mt-1">
                          THIS IS US
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredFeatures.map((row, ri) => (
                  <tr
                    key={ri}
                    className={`border-b border-white/[0.04] transition-colors duration-150 ${
                      hoveredRow === ri ? "bg-white/[0.015]" : ""
                    }`}
                    onMouseEnter={() => setHoveredRow(ri)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td className="py-4 pr-6">
                      <div className="text-[13px] text-white/60 font-medium">{row.feature}</div>
                      <div className="text-[10px] text-white/15 font-medium tracking-wider mt-0.5">{row.category}</div>
                    </td>
                    {row.values.map((v, ci) => {
                      const isAegis = ci === 0;
                      return (
                        <td
                          key={ci}
                          className={`text-center py-4 px-3 ${getCellBg(v, isAegis)}`}
                        >
                          {v === "None" ? (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/10" />
                          ) : (
                            <span className={`text-[12px] ${getCellStyle(v, isAegis)}`}>
                              {v}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Score summary */}
          <div className="mt-8 border-t border-white/[0.06] pt-6">
            <div className="flex items-center gap-6">
              <div className="text-[11px] font-medium text-white/15 tracking-wider">CAPABILITY SCORE</div>
              {COMPETITORS.map((c, ci) => {
                const score = FEATURES.filter((f) => f.values[ci] !== "None").length;
                const pct = (score / FEATURES.length) * 100;
                return (
                  <div key={c.name} className="flex-1">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="h-1.5 rounded-full bg-white/[0.04] flex-1 max-w-[80px] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            c.highlight ? "bg-emerald-400/60" : "bg-white/20"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-[13px] font-normal ${
                        c.highlight ? "text-emerald-400/70" : "text-white/25"
                      }`}>
                        {score}/{FEATURES.length}
                      </span>
                    </div>
                    <div className={`text-[10px] text-center mt-1 ${
                      c.highlight ? "text-emerald-400/40" : "text-white/15"
                    }`}>
                      {c.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Guardrails callout */}
      <section className="py-12 sm:py-16 border-t border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-4xl">
          <div className="border border-white/[0.06] bg-white/[0.015] p-6 sm:p-10">
            <div className="text-[11px] font-medium text-emerald-400/50 tracking-wider mb-4">
              KEY DIFFERENTIATOR
            </div>
            <h3 className="text-[20px] sm:text-[24px] font-normal text-white leading-tight mb-4">
              The guardrails gap.
            </h3>
            <p className="text-[14px] text-white/40 leading-relaxed mb-6">
              AegisX integrates NVIDIA NeMo Guardrails at the protocol level. Every operator invocation passes through
              four types of safety rails: input validation, output filtering, topic control, and hallucination detection.
              No competitor has any of this. Cursor, Windsurf, Copilot, Bolt.new, and Replit rely entirely on
              the base model's built-in alignment, which means jailbreaks, topic drift, PII leaks, and hallucinations
              go undetected.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.04]">
              {[
                { label: "Input validation", aegis: "Yes", others: "0/5" },
                { label: "Output filtering", aegis: "Yes", others: "0/5" },
                { label: "Topic control", aegis: "Yes", others: "0/5" },
                { label: "Hallucination detection", aegis: "Yes", others: "0/5" },
              ].map((g) => (
                <div key={g.label} className="bg-white/[0.02] p-4">
                  <div className="text-[11px] font-medium text-white/30 mb-2">{g.label}</div>
                  <div className="text-[14px] text-emerald-400/70 font-medium">AegisX: {g.aegis}</div>
                  <div className="text-[12px] text-white/20 mt-0.5">Others: {g.others}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blockchain exclusives */}
      <section className="py-12 sm:py-16 border-t border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-4xl">
          <div className="border border-white/[0.06] bg-white/[0.015] p-6 sm:p-10">
            <div className="text-[11px] font-medium text-emerald-400/50 tracking-wider mb-4">
              BLOCKCHAIN-NATIVE
            </div>
            <h3 className="text-[20px] sm:text-[24px] font-normal text-white leading-tight mb-4">
              Features no general-purpose IDE can match.
            </h3>
            <p className="text-[14px] text-white/40 leading-relaxed mb-6">
              AegisX is the only AI development environment built for Solana. 24 native blockchain actions,
              15-class smart contract auditing, 6 Bags.fm trading tools, and x402 micropayments are not features
              you can add with an extension. They require deep protocol integration.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.04]">
              {[
                { feature: "Solana actions", detail: "24 pre-built actions: token transfers, swaps, staking, program deployment, account queries" },
                { feature: "Contract auditing", detail: "15 vulnerability classes: reentrancy, integer overflow, access control, logic errors, more" },
                { feature: "Bags.fm tools", detail: "6 tools: portfolio tracking, social signals, creator earnings, trade execution, market analysis, alerts" },
                { feature: "x402 payments", detail: "HTTP-native micropayments. Sub-cent USDC. 400ms settlement. Automatic revenue splits." },
              ].map((item) => (
                <div key={item.feature} className="bg-white/[0.02] p-5">
                  <div className="text-[14px] font-medium text-emerald-400/70 mb-1">{item.feature}</div>
                  <div className="text-[12px] text-white/30 leading-relaxed">{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 sm:py-24 border-t border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-2xl text-center">
          <p className="text-[14px] text-white/30 leading-relaxed mb-6">
            The comparison speaks for itself. AegisX is the only AI development environment with
            Solana-native tools, NeMo Guardrails, on-chain trust scores, and GPU-native rendering.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="/earn"
              className="inline-flex items-center gap-2 text-[13px] font-normal bg-white text-zinc-900 px-6 py-3.5 hover:bg-zinc-200 transition-all duration-300"
            >
              Get Started
            </a>
            <a
              href="/nvidia-stack"
              className="inline-flex items-center gap-2 text-[13px] font-medium text-zinc-300/70 hover:text-zinc-300 border border-white/20 hover:border-white/40 px-6 py-3.5 transition-all duration-300"
            >
              Explore NVIDIA Stack
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}
