import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/sections/Footer";
import { NvidiaEyeLogo, NvidiaBadge } from "@/components/NvidiaLogo";
import RequireWallet from "@/components/RequireWallet";

const Features = lazy(() => import("@/components/sections/Features"));
const FeatureHighlights = lazy(() => import("@/components/sections/FeatureHighlights"));
const X402LiveTracker = lazy(() => import("@/components/sections/X402LiveTracker"));

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                    */
/* ------------------------------------------------------------------ */
const TABS = [
  { id: "stack", label: "The Stack", hash: "#stack" },
  { id: "arsenal", label: "Arsenal", hash: "#arsenal" },
  { id: "economics", label: "Economics", hash: "#economics" },
  { id: "nvidia", label: "NVIDIA", hash: "#nvidia" },
  { id: "compute", label: "Compute", hash: "#compute" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ================================================================== */
/*  STACK TAB  (from Ecosystem page)                                   */
/* ================================================================== */

const STACK_LAYERS = [
  {
    name: "Settlement",
    protocol: "Solana",
    role: "400ms finality, sub-cent transactions, 49% of x402 volume",
    aegis: "All Aegis transactions settle here. Bonds, slashing, revenue splits.",
    highlight: false,
  },
  {
    name: "Payments",
    protocol: "x402 (Coinbase)",
    role: "HTTP-native micropayments. 100M+ payment flows processed.",
    aegis: "Every operator invocation is an x402 payment. USDC in, $AEGIS out.",
    highlight: false,
  },
  {
    name: "Quality",
    protocol: "Aegis Protocol",
    role: "Bonded validation, on-chain quality, economic slashing.",
    aegis: "The skills marketplace for Solana. Bonded operators, verified quality, pay per call.",
    highlight: true,
  },
  {
    name: "Discovery",
    protocol: "MCP (Linux Foundation)",
    role: "97M monthly SDK downloads. Standard for agent-to-tool communication.",
    aegis: "Agents discover Aegis operators via MCP. Server Cards enable auto-discovery.",
    highlight: false,
  },
  {
    name: "Communication",
    protocol: "A2A (Google)",
    role: "Agent-to-agent protocol. Multi-agent collaboration.",
    aegis: "A2A agents use Aegis to verify operator quality before delegation.",
    highlight: false,
  },
  {
    name: "Identity",
    protocol: "ERC-8004 / 8004-Solana",
    role: "On-chain agent identity. Metaplex Core NFTs with quality history.",
    aegis: "Identity says WHO you are. Aegis says HOW GOOD you are.",
    highlight: false,
  },
  {
    name: "AI Infra",
    protocol: "NVIDIA NeMo",
    role: "Full agent lifecycle: guardrails, evaluation, NIM deployment, RL optimization.",
    aegis: "7 NeMo pillars baked into every operator. Enterprise AI at protocol level.",
    highlight: true,
  },
];

const INTEGRATIONS = [
  {
    category: "Payment Protocols",
    items: [
      { name: "x402 V2", status: "Integrated", desc: "Reusable sessions, multi-chain, service discovery" },
      { name: "Google AP2", status: "Compatible", desc: "Integrates x402 for stablecoin payments" },
      { name: "Stripe ACP", status: "Compatible", desc: "x402 payments on Base" },
    ],
  },
  {
    category: "Agent Frameworks",
    items: [
      { name: "ElizaOS", status: "Compatible", desc: "50K+ deployed agents, 90+ plugins" },
      { name: "Solana Agent Kit", status: "Integrated", desc: "60+ pre-built blockchain actions" },
      { name: "AegisX / Cursor", status: "Compatible", desc: "MCP-native agent interfaces" },
    ],
  },
  {
    category: "AI Infrastructure",
    items: [
      { name: "NVIDIA NeMo Guardrails", status: "Integrated", desc: "5-layer safety rails on every invocation" },
      { name: "NVIDIA NeMo Evaluator", status: "Integrated", desc: "Automated success scoring via continuous benchmarks" },
      { name: "NVIDIA NIM", status: "Integrated", desc: "GPU-optimized inference containers for operators" },
      { name: "Nemotron Foundation Models", status: "Integrated", desc: "Nano/Super/Ultra model tiers for operators" },
      { name: "NeMo Curator", status: "Integrated", desc: "Data quality pipeline for operator training" },
      { name: "NeMo RL + Gym", status: "Integrated", desc: "Continuous improvement via reinforcement learning" },
    ],
  },
  {
    category: "Standards Bodies",
    items: [
      { name: "NIST CAISI", status: "Engaging", desc: "AI Agent Standards Initiative, concept paper published" },
      { name: "MCP Server Cards", status: "Planned", desc: "Auto-discovery via .well-known URL" },
      { name: "Agentic AI Foundation", status: "Tracking", desc: "Linux Foundation governance for MCP" },
    ],
  },
];

const MARKET_PLAYERS = [
  { name: "Visa", what: "Trusted Agent Protocol", role: "Authenticates the BUYER", relationship: "Complementary" },
  { name: "Mastercard", what: "Agent Pay", role: "Authenticates the BUYER", relationship: "Complementary" },
  { name: "Aegis", what: "Bonded Validation", role: "Validates the SELLER", relationship: "The missing piece" },
];

function StackContent() {
  return (
    <div className="space-y-0">
      {/* Hero text */}
      <section className="pb-12 border-b border-white/[0.04]">
        <p className="text-[15px] sm:text-[16px] text-white/35 max-w-2xl leading-relaxed">
          x402 handles payments. MCP handles discovery. A2A handles communication.
          ERC-8004 handles identity. But when an AI agent pays for a service,
          <span className="text-zinc-300/70 font-medium"> nothing verifies the service is any good</span>.
          Aegis sits in that exact gap.
        </p>
      </section>

      {/* Protocol Stack */}
      <section className="py-12 border-b border-white/[0.04]">
        <h2 className="text-xl sm:text-2xl font-normal text-white mb-2">
          The protocol stack.
        </h2>
        <p className="text-[13px] text-white/25 mb-10">
          Where Aegis sits in the AI agent infrastructure.
        </p>
        <div className="space-y-0">
          {STACK_LAYERS.map((layer, i) => (
            <div
              key={layer.name}
              className={`p-5 sm:p-6 border border-white/[0.04] ${
                i > 0 ? "border-t-0" : ""
              } ${
                layer.highlight
                  ? "bg-white/[0.03] border-white/20"
                  : "hover:bg-white/[0.015]"
              } transition-all duration-300`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6">
                <div className="shrink-0 w-24">
                  <div className={`text-[10px] font-medium tracking-wider uppercase ${
                    layer.highlight ? "text-zinc-300/60" : "text-white/20"
                  }`}>
                    {layer.name}
                  </div>
                  <div className={`text-[14px] font-normal mt-0.5 ${
                    layer.highlight ? "text-zinc-300" : "text-white/60"
                  }`}>
                    {layer.protocol}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-[13px] text-white/40 leading-relaxed mb-1">{layer.role}</p>
                  <p className={`text-[12px] leading-relaxed ${
                    layer.highlight ? "text-zinc-300/60 font-medium" : "text-white/20"
                  }`}>
                    {layer.aegis}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Buyer vs Seller */}
      <section className="py-12 border-b border-white/[0.04]">
        <h2 className="text-xl sm:text-2xl font-normal text-white mb-2">
          Visa authenticates the buyer.
          <br />
          <span className="text-white/30">Aegis validates the seller.</span>
        </h2>
        <p className="text-[13px] text-white/25 mb-10">
          These are complementary, not competitive. Their entry validates the market.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.06] border border-white/[0.04]">
          {MARKET_PLAYERS.map((player) => (
            <div
              key={player.name}
              className={`bg-white/[0.02] p-5 sm:p-6 ${
                player.name === "Aegis" ? "bg-white/[0.03]" : ""
              }`}
            >
              <div className={`text-[16px] font-normal mb-1 ${
                player.name === "Aegis" ? "text-zinc-300" : "text-white/60"
              }`}>
                {player.name}
              </div>
              <div className="text-[12px] text-white/30 mb-3">{player.what}</div>
              <div className={`text-[13px] font-medium mb-2 ${
                player.name === "Aegis" ? "text-zinc-300/80" : "text-white/50"
              }`}>
                {player.role}
              </div>
              <div className="text-[11px] text-white/20">{player.relationship}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Integrations */}
      <section className="py-12">
        <h2 className="text-xl sm:text-2xl font-normal text-white mb-10">
          Integration map.
        </h2>
        <div className="space-y-8">
          {INTEGRATIONS.map((group) => (
            <div key={group.category}>
              <div className="text-[11px] font-medium text-white/20 tracking-wider uppercase mb-4 flex items-center gap-2">
                {group.category === "AI Infrastructure" && <NvidiaEyeLogo size={14} className="text-[#76B900]" />}
                {group.category}
              </div>
              <div className="space-y-0">
                {group.items.map((item, i) => (
                  <div
                    key={item.name}
                    className={`flex items-center gap-4 sm:gap-6 p-4 border border-white/[0.04] ${
                      i > 0 ? "border-t-0" : ""
                    } hover:bg-white/[0.015] transition-all duration-300`}
                  >
                    <span className="text-[14px] font-medium text-white/60 w-40 shrink-0">{item.name}</span>
                    <span className={`text-[10px] font-medium tracking-wider px-2 py-0.5 shrink-0 ${
                      item.status === "Integrated"
                        ? "text-zinc-300 bg-white/[0.08]"
                        : item.status === "Compatible"
                        ? "text-zinc-300/60 bg-white/[0.04]"
                        : "text-white/30 bg-white/[0.03]"
                    }`}>
                      {item.status}
                    </span>
                    <span className="text-[13px] text-white/30">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ================================================================== */
/*  ARSENAL TAB  (from Arsenal page)                                   */
/* ================================================================== */

function ArsenalContent() {
  return (
    <Suspense fallback={<TabLoading />}>
      <div className="space-y-0">
        <Features />
        <FeatureHighlights />
      </div>
    </Suspense>
  );
}

/* ================================================================== */
/*  ECONOMICS TAB  (from Earn + X402 pages)                            */
/* ================================================================== */

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
      validatorDaily: gross * 0.10,
      burnedDaily: gross * 0.005,
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
      <div className="p-4 sm:p-6 border-t border-white/[0.04] flex flex-wrap gap-6 text-[12px] text-white/25">
        <span>Validators earn: <span className="text-white/50">${earnings.validatorDaily.toFixed(2)}/day</span></span>
        <span>Burned daily: <span className="text-[rgba(220,100,60,0.45)]">${earnings.burnedDaily.toFixed(2)}</span></span>
        <span>Treasury: <span className="text-white/50">${(earnings.daily / 0.85 * 0.03).toFixed(2)}/day</span></span>
      </div>
    </div>
  );
}

function EconomicsContent() {
  return (
    <div className="space-y-0">
      {/* Earn hero */}
      <section className="pb-12 border-b border-white/[0.04]">
        <p className="text-[15px] sm:text-[16px] text-white/35 max-w-2xl leading-relaxed mb-8">
          Anyone on Earth can upload an AI skill, and every time any AI agent anywhere in the world
          uses it, the creator gets paid. Automatically. Forever. On Solana. In under a second.
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
      </section>

      {/* Calculator */}
      <section className="py-12 border-b border-white/[0.04]">
        <EarningsCalculator />
      </section>

      {/* Three steps */}
      <section className="py-12 border-b border-white/[0.04]">
        <h3 className="text-xl sm:text-2xl font-normal text-white mb-2">
          Three steps. That is it.
        </h3>
        <p className="text-[13px] text-white/25 mb-10">
          From zero to earning in under 10 minutes.
        </p>
        <div className="space-y-0">
          {[
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
          ].map((step, i) => (
            <div
              key={step.number}
              className={`relative flex gap-6 sm:gap-8 p-6 sm:p-8 border border-white/[0.04] ${
                i > 0 ? "border-t-0" : ""
              } hover:bg-white/[0.015] transition-all duration-300 group`}
            >
              <div className="shrink-0">
                <div className="w-12 h-12 flex items-center justify-center border border-white/20 bg-white/[0.04] group-hover:bg-white/[0.08] group-hover:border-white/40 transition-all duration-300">
                  <span className="font-medium text-[16px] font-normal text-zinc-300">{step.number}</span>
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
      </section>

      {/* x402 Live Tracker */}
      <section className="py-12">
        <Suspense fallback={<TabLoading />}>
          <X402LiveTracker />
        </Suspense>
      </section>
    </div>
  );
}

/* ================================================================== */
/*  NVIDIA TAB  (from NvidiaStack page)                                */
/* ================================================================== */

const NEMO_COMPONENTS = [
  {
    id: "guardrails",
    phase: "GUARD",
    title: "NeMo Guardrails",
    oneLiner: "Programmable safety rules that screen every AI interaction.",
    explanation:
      "NeMo Guardrails is an open-source toolkit that lets you define rules for what an AI model can and cannot do. It works by intercepting requests and responses at runtime. Input rails screen what goes into the model (blocking jailbreak attempts, off-topic requests, or PII). Output rails screen what comes out (filtering unsafe content, enforcing format compliance, fact-checking against sources). Dialog rails control conversation flow so the model stays on task. You write these rules in a simple configuration language called Colang. The toolkit adds roughly 0.5 seconds of latency but catches policy violations that the model itself would miss.",
    aegisIntegration:
      "Every operator invocation on Aegis passes through NeMo Guardrails before and after execution. Operators define their own rail configurations (what topics they handle, what content they block). Guardrail compliance rates feed directly into the on-chain success rate. An operator that consistently passes all rails earns a higher quality. An operator that triggers output rails gets flagged for validator review.",
    stats: [
      { label: "Rail types", value: "4" },
      { label: "Detection improvement", value: "1.4x" },
      { label: "Latency overhead", value: "~0.5s" },
    ],
    links: [
      { label: "GitHub", href: "https://github.com/NVIDIA/NeMo-Guardrails" },
      { label: "Docs", href: "https://docs.nvidia.com/nemo/guardrails/" },
    ],
  },
  {
    id: "evaluator",
    phase: "SCORE",
    title: "NeMo Evaluator",
    oneLiner: "Automated benchmarking that tests AI models against real metrics.",
    explanation:
      "NeMo Evaluator runs standardized tests against AI models and agents. It supports academic benchmarks (MMLU, HumanEval, GSM8K), generative quality metrics (BLEU, ROUGE, code execution pass rates), and LLM-as-a-judge evaluations where a separate model grades the output. You define evaluation suites with specific test cases, expected outputs, and scoring rubrics. The evaluator runs these automatically and produces numerical scores. This replaces subjective user ratings with reproducible, objective measurements.",
    aegisIntegration:
      "Aegis uses NeMo Evaluator to generate the quantitative component of every operator's success rate. When an operator is registered, it goes through an initial evaluation suite. After that, periodic re-evaluations run every few hours using fresh test cases. The scores feed into the 6-pillar quality model alongside validator attestations, invocation success rates, and economic signals. Operators cannot game their success rate because the evaluation is automated and the test cases rotate.",
    stats: [
      { label: "Benchmark types", value: "24+" },
      { label: "Eval methods", value: "3" },
      { label: "Re-eval cycle", value: "6h" },
    ],
    links: [
      { label: "Docs", href: "https://docs.nvidia.com/nemo/evaluator/" },
    ],
  },
  {
    id: "nim",
    phase: "DEPLOY",
    title: "NVIDIA NIM",
    oneLiner: "Pre-optimized containers that run AI models on GPUs with maximum efficiency.",
    explanation:
      "NIM (NVIDIA Inference Microservices) takes an AI model and packages it into a container that is already optimized for GPU inference. It handles quantization (reducing model precision to run faster without losing quality), batching (grouping multiple requests together), and memory management automatically. The result is an OpenAI-compatible API endpoint that runs significantly faster than a naive deployment. NIM supports hundreds of models out of the box and works on any NVIDIA GPU from consumer cards to data center hardware.",
    aegisIntegration:
      "Operators on Aegis can deploy their models as NIM containers instead of managing their own inference infrastructure. NIM-deployed operators get a performance badge in the marketplace because their latency and throughput are hardware-guaranteed. The x402 payment protocol measures response time, and NIM operators consistently deliver sub-second responses. This matters because agents paying per invocation want fast, reliable results.",
    stats: [
      { label: "Inference speedup", value: "Up to 4x" },
      { label: "API format", value: "OpenAI" },
      { label: "GPU support", value: "All NVIDIA" },
    ],
    links: [
      { label: "NIM Hub", href: "https://build.nvidia.com/" },
    ],
  },
  {
    id: "nemotron",
    phase: "BUILD",
    title: "Nemotron Models",
    oneLiner: "NVIDIA's open-weight foundation models available at three capability tiers.",
    explanation:
      "Nemotron is NVIDIA's family of open-weight language models. They come in three tiers: Nano (small, fast, good for simple tasks and edge deployment), Super (balanced, handles complex reasoning and multi-step tasks), and Ultra (maximum capability for the hardest problems). All models use a hybrid latent mixture-of-experts architecture, which means they activate only the relevant parts of the model for each request, keeping inference efficient. The weights, training data provenance, and fine-tuning recipes are all published openly.",
    aegisIntegration:
      "Operators building on Aegis can use Nemotron as their base model instead of starting from scratch or paying for proprietary API access. The three tiers map to different operator categories: Nano for lightweight utility operators (formatting, parsing, simple lookups), Super for reasoning-heavy operators (code review, analysis, research), and Ultra for complex multi-agent workflows. Using Nemotron means operators own their model weights and can fine-tune freely.",
    stats: [
      { label: "Model tiers", value: "3" },
      { label: "Architecture", value: "MoE" },
      { label: "License", value: "Open" },
    ],
    links: [
      { label: "Models", href: "https://build.nvidia.com/explore/reasoning" },
    ],
  },
  {
    id: "curator",
    phase: "CURATE",
    title: "NeMo Curator",
    oneLiner: "Data cleaning pipeline that turns raw datasets into quality training data.",
    explanation:
      "NeMo Curator is a set of GPU-accelerated data processing tools for preparing training data. It does heuristic quality filtering (removing low-quality samples based on rules like length, language, formatting), ML-based quality classification (using a trained model to score each sample), exact and fuzzy deduplication (finding and removing duplicate or near-duplicate content), PII detection and removal (automatically stripping personal information), and language identification across 30+ languages. The entire pipeline runs on GPUs, which makes it fast enough to process terabyte-scale datasets.",
    aegisIntegration:
      "Operators who fine-tune their own models can use NeMo Curator to prepare their training data before submission. Clean training data produces better operators, which earn higher evaluation scores, which attract more invocations, which generate more revenue. Aegis provides Curator as a protocol-level tool so that even solo developers building operators have access to enterprise-grade data preparation.",
    stats: [
      { label: "Languages", value: "30+" },
      { label: "PII handling", value: "Auto" },
      { label: "Dedup methods", value: "3" },
    ],
    links: [
      { label: "GitHub", href: "https://github.com/NVIDIA/NeMo-Curator" },
    ],
  },
  {
    id: "rl",
    phase: "OPTIMIZE",
    title: "NeMo RL + Gym",
    oneLiner: "Reinforcement learning tools that improve models using real feedback.",
    explanation:
      "NeMo RL provides post-training alignment using reinforcement learning algorithms like GRPO (Group Relative Policy Optimization) and PPO (Proximal Policy Optimization). These take a base model and improve it based on feedback signals: which responses were preferred, which were rejected, which led to successful task completion. NeMo Gym complements this by providing simulated environments where agents can practice tasks and generate training data without real-world consequences. Together, they create a loop where models get better over time.",
    aegisIntegration:
      "Aegis creates a natural data flywheel for NeMo RL. Every operator invocation generates real usage data: was the response accepted or rejected? Did the agent retry? Did the invocation succeed? This data feeds back into the RL training loop. Operators that opt into continuous improvement use NeMo RL to fine-tune their models on actual marketplace usage patterns. The result is operators that get measurably better with every thousand invocations.",
    stats: [
      { label: "RL algorithms", value: "GRPO, PPO" },
      { label: "Training env", value: "NeMo Gym" },
      { label: "Feedback loop", value: "Active" },
    ],
    links: [
      { label: "Docs", href: "https://docs.nvidia.com/nemo/rl/" },
    ],
  },
  {
    id: "toolkit",
    phase: "OBSERVE",
    title: "NeMo Agent Toolkit",
    oneLiner: "Profiling and observability tools for debugging and optimizing AI agents.",
    explanation:
      "NeMo Agent Toolkit provides instrumentation for AI agents regardless of which framework they use (LangChain, LlamaIndex, CrewAI, or custom). It captures telemetry and traces for every step of agent execution: which tools were called, what the model generated at each step, where time was spent, and where errors occurred. Performance profiling identifies bottlenecks. The toolkit is framework-agnostic, meaning it works the same way whether an operator is built with LangChain or raw Python.",
    aegisIntegration:
      "Validators on Aegis use Agent Toolkit data to verify that operators actually do what their descriptions claim. If an operator says it performs code review, the toolkit traces show whether it actually analyzes code or just generates generic responses. This observability layer makes the validator attestation process more rigorous and harder to game. Operators with full toolkit instrumentation get a transparency badge in the marketplace.",
    stats: [
      { label: "Trace depth", value: "Full" },
      { label: "Frameworks", value: "5+" },
      { label: "Profiling", value: "Real-time" },
    ],
    links: [
      { label: "Docs", href: "https://docs.nvidia.com/nemo/agent-toolkit/" },
    ],
  },
];

const ARCH_LAYERS = [
  { layer: "Data", tool: "NeMo Curator", desc: "Clean, filter, and deduplicate training data at scale" },
  { layer: "Build", tool: "Nemotron + Agent Toolkit", desc: "Foundation models and framework-agnostic agent building" },
  { layer: "Evaluate", tool: "NeMo Evaluator", desc: "Continuous automated benchmarking and success scoring" },
  { layer: "Deploy", tool: "NVIDIA NIM", desc: "GPU-optimized inference containers with OpenAI-compatible APIs" },
  { layer: "Guard", tool: "NeMo Guardrails", desc: "Programmable input/output/dialog/retrieval safety rails" },
  { layer: "Optimize", tool: "NeMo RL + Gym", desc: "Reinforcement learning from real invocation feedback" },
  { layer: "Settle", tool: "Solana + x402", desc: "Sub-second payment settlement with 85/10/3/1.5/0.5 revenue split" },
];

function NvidiaContent() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-0">
      {/* Hero text */}
      <section className="pb-12 border-b border-white/[0.04]">
        <div className="flex items-center gap-3 mb-8">
          <NvidiaBadge text="NVIDIA NeMo" size="md" />
          <span className="text-[10px] font-medium text-white/20 tracking-wider">PROTOCOL INTEGRATION</span>
        </div>
        <p className="text-[15px] text-white/35 max-w-2xl leading-relaxed mb-4">
          NeMo is NVIDIA's modular software suite for managing the full AI agent lifecycle: building, deploying, guarding, evaluating, and continuously improving AI models and agents. It is not one product. It is 7+ distinct tools that cover every stage from raw data to production inference.
        </p>
        <p className="text-[15px] text-white/35 max-w-2xl leading-relaxed">
          Aegis integrates the full NeMo stack at the protocol level. Every operator on the marketplace benefits from enterprise-grade data curation, automated evaluation, programmable safety rails, GPU-optimized deployment, and reinforcement learning. No other AI marketplace has any of this infrastructure built in.
        </p>
      </section>

      {/* 7 Components */}
      <section className="py-12 border-b border-white/[0.04]">
        <div className="flex items-center gap-2 mb-6">
          <NvidiaEyeLogo size={14} className="text-[#76B900]/60" />
          <span className="text-[11px] font-medium tracking-wider uppercase text-white/30">
            SEVEN COMPONENTS
          </span>
        </div>
        <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-normal text-white leading-[1.1] tracking-tight mb-3">
          The full stack, explained plainly.
        </h2>
        <p className="text-[14px] text-white/30 max-w-2xl leading-relaxed mb-12">
          Each component does one thing well. Together they cover the entire operator lifecycle.
          Click any component to see what it actually does and how Aegis integrates it.
        </p>
        <div className="space-y-px">
          {NEMO_COMPONENTS.map((comp, i) => {
            const isOpen = openId === comp.id;
            return (
              <div
                key={comp.id}
                className={`border transition-colors duration-200 cursor-pointer ${
                  isOpen
                    ? "bg-white/[0.02] border-white/[0.08]"
                    : "bg-transparent border-white/[0.05] hover:bg-white/[0.015] hover:border-white/[0.04]"
                }`}
                onClick={() => setOpenId(isOpen ? null : comp.id)}
              >
                <div className="flex items-center gap-4 sm:gap-5 p-5 sm:p-6">
                  <div className={`shrink-0 px-2 py-0.5 border text-[10px] font-medium tracking-wider ${
                    isOpen
                      ? "border-[#76B900]/20 text-[#76B900]/70 bg-[#76B900]/[0.03]"
                      : "border-white/[0.04] text-white/15"
                  }`}>
                    {comp.phase}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isOpen && <NvidiaEyeLogo size={13} className="text-[#76B900]/50 shrink-0" />}
                      <h3 className={`text-[15px] font-normal leading-snug ${
                        isOpen ? "text-white/90" : "text-white/70"
                      }`}>
                        {comp.title}
                      </h3>
                    </div>
                    <p className="text-[12px] text-white/25 mt-0.5">{comp.oneLiner}</p>
                  </div>
                  <span className="hidden lg:inline text-[11px] font-medium text-white/10 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <svg
                    className={`w-4 h-4 text-white/15 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="square" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className={`overflow-hidden transition-all duration-300 ${
                  isOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                }`}>
                  <div className="px-5 sm:px-6 pb-6 space-y-5">
                    <div>
                      <div className="text-[10px] font-medium text-white/20 tracking-wider mb-2">WHAT IT DOES</div>
                      <p className="text-[13px] text-white/40 leading-relaxed max-w-3xl">
                        {comp.explanation}
                      </p>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-[#76B900]/50 tracking-wider mb-2">HOW AEGIS USES IT</div>
                      <p className="text-[13px] text-white/40 leading-relaxed max-w-3xl">
                        {comp.aegisIntegration}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.03] border border-white/[0.05]">
                      {comp.stats.map((s) => (
                        <div key={s.label} className="bg-white/[0.02] p-3 sm:p-4">
                          <div className="text-[15px] font-normal text-white/60">{s.value}</div>
                          <div className="text-[10px] text-white/20">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    {comp.links.length > 0 && (
                      <div className="flex gap-3">
                        {comp.links.map((link) => (
                          <a
                            key={link.label}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] font-medium text-white/25 hover:text-white/50 underline underline-offset-2 transition-colors"
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Architecture Stack */}
      <section className="py-12">
        <h2 className="text-xl sm:text-2xl font-normal text-white mb-2">
          The operator lifecycle, layer by layer.
        </h2>
        <p className="text-[13px] text-white/25 mb-10">
          Each layer maps to a NeMo component. The settlement layer is Solana.
        </p>
        <div className="space-y-0">
          {ARCH_LAYERS.map((layer, i) => {
            const isNvidia = layer.layer !== "Settle";
            return (
              <div
                key={layer.layer}
                className={`flex items-center gap-4 sm:gap-6 p-4 sm:p-5 border border-white/[0.05] ${
                  i > 0 ? "border-t-0" : ""
                } hover:bg-white/[0.01] transition-colors duration-200`}
              >
                <div className="text-[10px] font-medium tracking-wider w-16 shrink-0 text-white/20">
                  {layer.layer.toUpperCase()}
                </div>
                {isNvidia ? (
                  <NvidiaEyeLogo size={10} className="text-[#76B900]/40 shrink-0" />
                ) : (
                  <div className="w-2.5 h-2.5 shrink-0 bg-white/10 border border-white/20" />
                )}
                <div className="flex-1">
                  <span className={`text-[13px] font-normal ${isNvidia ? "text-white/60" : "text-white/50"}`}>
                    {layer.tool}
                  </span>
                  <span className="text-[12px] text-white/20 ml-3">{layer.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* ================================================================== */
/*  COMPUTE TAB  (from Compute page)                                   */
/* ================================================================== */

const COMPUTE_LAYERS = [
  { layer: "Layer 1", name: "Silicon", desc: "NVIDIA GPUs, custom ASICs", color: "#4A7A82" },
  { layer: "Layer 2", name: "Compute", desc: "GPU marketplace via Aegis operators", color: "#71717A" },
  { layer: "Layer 3", name: "NIM Runtime", desc: "NVIDIA NIM containers for GPU-optimized inference", color: "#76B900" },
  { layer: "Layer 4", name: "Models", desc: "Nemotron Nano/Super/Ultra foundation models", color: "#76B900" },
  { layer: "Layer 5", name: "Skills", desc: "Task-specific operators with NeMo Guardrails", color: "#A1A1AA" },
  { layer: "Layer 6", name: "Agents", desc: "Autonomous consumers", color: "#71717A" },
  { layer: "Layer 7", name: "Quality", desc: "Aegis bonded validation + NeMo Evaluator", color: "#A1A1AA" },
  { layer: "Layer 8", name: "Settlement", desc: "Solana", color: "#4A7A82" },
];

const COMPUTE_FEATURES = [
  {
    title: "GPU compute as an operator",
    desc: "8x H100s sitting idle at night become an Aegis operator earning per-second. Any AI agent anywhere can discover your GPUs, pay per-second for inference, and the revenue splits atomically.",
  },
  {
    title: "NVIDIA NIM deployment",
    desc: "Every GPU operator runs inside NVIDIA NIM containers. Pre-optimized inference with OpenAI-compatible APIs, 4.2x speedup over raw deployment, and auto-scaling. NIM-deployed operators get priority marketplace placement because performance is hardware-guaranteed.",
  },
  {
    title: "Hardware-attested validation",
    desc: "Execution happens inside hardware-secured enclaves. The silicon itself attests that the output was not tampered with. Bonded validation plus hardware attestation plus NeMo Evaluator benchmarks. No protocol on Earth has all three.",
  },
  {
    title: "Nemotron foundation models",
    desc: "Operators built on NVIDIA Nemotron across three tiers. Nano for lightweight edge inference. Super for balanced reasoning and RAG. Ultra for maximum capability. Open weights, training data, and fine-tuning recipes. A researcher fine-tunes Nemotron on medical data, uploads it as an Aegis operator, and earns 85% of every call.",
  },
  {
    title: "NeMo RL data flywheel",
    desc: "Every invocation generates training data. NeMo RL uses GRPO and PPO to continuously improve operators. NeMo Gym provides simulated environments. The more an operator is used, the better it gets. A self-improving marketplace that compounds quality over time.",
  },
  {
    title: "Darwinian marketplace",
    desc: "NeMo Evaluator benchmarks run every 6 hours. The best models rise via objective metrics, not marketing. Bad models get slashed and disappear. The marketplace self-optimizes without human curation.",
  },
];

function ComputeContent() {
  return (
    <div className="space-y-0">
      {/* Hero */}
      <section className="pb-12 border-b border-white/[0.04]">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/20 bg-white/[0.04] mb-6">
          <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" />
          <span className="text-[11px] font-medium text-zinc-300/60 tracking-wider">IN DEVELOPMENT</span>
        </div>
        <p className="text-[15px] sm:text-[16px] text-white/35 max-w-2xl leading-relaxed">
          Register your GPUs as Aegis operators. Earn per-second for idle compute.
          Hardware-attested validation ensures agents get the compute they paid for.
          Every data center becomes an operator factory.
        </p>
      </section>

      {/* AI Supply Chain */}
      <section className="py-12 border-b border-white/[0.04]">
        <h2 className="text-xl sm:text-2xl font-normal text-white mb-2">
          The AI supply chain.
        </h2>
        <p className="text-[13px] text-white/25 mb-10">
          Every layer pays the layer below it. Every creator at every layer earns.
          The entire stack is economically self-sustaining.
        </p>
        <div className="space-y-0">
          {COMPUTE_LAYERS.map((layer, i) => (
            <div
              key={layer.name}
              className={`flex items-center gap-4 sm:gap-6 p-4 sm:p-5 border border-white/[0.04] ${
                i > 0 ? "border-t-0" : ""
              } hover:bg-white/[0.015] transition-all duration-300`}
            >
              <div className="text-[10px] font-medium text-white/15 tracking-wider w-14 shrink-0">
                {layer.layer}
              </div>
              <div
                className="w-3 h-3 shrink-0"
                style={{ backgroundColor: `${layer.color}40`, border: `1px solid ${layer.color}60` }}
              />
              <div className="flex-1">
                <span className="text-[14px] font-normal text-white/70">{layer.name}</span>
                <span className="text-[13px] text-white/25 ml-3">{layer.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-12 border-b border-white/[0.04]">
        <h2 className="text-xl sm:text-2xl font-normal text-white mb-10">
          What this enables.
        </h2>
        <div className="grid sm:grid-cols-2 gap-px bg-white/[0.06] border border-white/[0.04]">
          {COMPUTE_FEATURES.map((feat) => (
            <div
              key={feat.title}
              className="bg-white/[0.02] p-6 sm:p-8 hover:bg-white/[0.015] transition-all duration-300"
            >
              <h3 className="text-[15px] font-normal text-white/80 mb-3">{feat.title}</h3>
              <p className="text-[13px] text-white/30 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The math */}
      <section className="py-12">
        <div className="border border-white/[0.12] bg-white/[0.03] p-6 rounded sm:p-10">
          <div className="text-[11px] font-medium tracking-wider text-zinc-300/40 uppercase mb-4">
            THE MATH
          </div>
          <div className="space-y-3 text-[14px] text-white/40 leading-relaxed">
            <p>1 billion agents making 100 calls a day at $0.003 each.</p>
            <p><span className="text-zinc-300 font-normal">$300M per day</span> in operator fees.</p>
            <p>8% treasury fee = <span className="text-white/60">$24M per day</span> in protocol revenue.</p>
            <p>0.5% per-invocation burn = <span className="text-[rgba(220,100,60,0.45)]">$3M in $AEGIS burned per day</span>.</p>
            <p className="text-[16px] text-white/60 font-medium pt-2">
              Annual: $110B in operator fees. $9.9B in protocol revenue.
            </p>
            <p className="text-[13px] text-white/25 pt-2">
              The App Store does $85B/year. Aegis is the App Store for AI.
              Except the apps run themselves, the customers are AI agents,
              and the marketplace never closes.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ================================================================== */
/*  Shared loading fallback                                            */
/* ================================================================== */

function TabLoading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-5 h-5 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
    </div>
  );
}

/* ================================================================== */
/*  MAIN PAGE                                                          */
/* ================================================================== */

export default function Protocol() {
  const [tab, setTab] = useState<TabId>(() => {
    const hash = window.location.hash.slice(1);
    return (TABS.find((t) => t.id === hash)?.id as TabId) ?? "stack";
  });

  useEffect(() => {
    window.history.replaceState(null, "", `/protocol#${tab}`);
  }, [tab]);

  return (
    <RequireWallet>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="pt-24 pb-16">
          <div className="mx-auto max-w-[1520px] px-12">
            {/* Hero */}
            <div className="mb-10">
              <div className="text-[11px] font-medium tracking-wider text-zinc-300/40 mb-6">
                PROTOCOL
              </div>
              <h1 className="text-[clamp(2rem,5vw,3.75rem)] font-normal text-white leading-[1.05] tracking-tight mb-4">
                How Aegis Works
              </h1>
              <p className="text-[15px] sm:text-[16px] text-white/35 max-w-2xl leading-relaxed">
                The economic operating system for autonomous AI. Explore the protocol stack,
                arsenal, economics, NVIDIA integration, and compute infrastructure.
              </p>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 mb-12 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 px-4 py-2.5 text-[13px] font-medium transition-all duration-200 border ${
                    tab === t.id
                      ? "text-white bg-white/[0.06] border-white/20"
                      : "text-white/30 bg-transparent border-white/[0.05] hover:text-white/50 hover:bg-white/[0.02] hover:border-white/[0.08]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <Suspense fallback={<TabLoading />}>
              {tab === "stack" && <StackContent />}
              {tab === "arsenal" && <ArsenalContent />}
              {tab === "economics" && <EconomicsContent />}
              {tab === "nvidia" && <NvidiaContent />}
              {tab === "compute" && <ComputeContent />}
            </Suspense>
          </div>
        </div>
        <Footer />
        <MobileBottomNav />
        <div className="h-14 lg:hidden" />
      </div>
    </RequireWallet>
  );
}
