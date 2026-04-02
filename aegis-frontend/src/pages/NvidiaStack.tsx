import { useState } from "react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/sections/Footer";
import { NvidiaEyeLogo, NvidiaBadge } from "@/components/NvidiaLogo";

/* -- NeMo Components with real descriptions -------------------------------- */
const NEMO_COMPONENTS = [
  {
    id: "guardrails",
    phase: "GUARD",
    title: "NeMo Guardrails",
    oneLiner: "Programmable safety rules that screen every AI interaction.",
    explanation:
      "NeMo Guardrails is an open-source toolkit that lets you define rules for what an AI model can and cannot do. It works by intercepting requests and responses at runtime. Input rails screen what goes into the model (blocking jailbreak attempts, off-topic requests, or PII). Output rails screen what comes out (filtering unsafe content, enforcing format compliance, fact-checking against sources). Dialog rails control conversation flow so the model stays on task. You write these rules in a simple configuration language called Colang. The toolkit adds roughly 0.5 seconds of latency but catches policy violations that the model itself would miss.",
    aegisIntegration:
      "Every operator invocation on Aegis passes through NeMo Guardrails before and after execution. Operators define their own rail configurations (what topics they handle, what content they block). Guardrail compliance rates feed directly into the on-chain success rate. An operator that consistently passes all rails earns a higher reputation. An operator that triggers output rails gets flagged for validator review.",
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
      "Aegis uses NeMo Evaluator to generate the quantitative component of every operator's success rate. When an operator is registered, it goes through an initial evaluation suite. After that, periodic re-evaluations run every few hours using fresh test cases. The scores feed into the 6-pillar trust model alongside validator attestations, invocation success rates, and economic signals. Operators cannot game their success rate because the evaluation is automated and the test cases rotate.",
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

/* -- Guardrail types detail ----------------------------------------------- */
const GUARDRAIL_TYPES = [
  {
    type: "Input Validation",
    description: "Screens every request before it reaches the operator. Blocks jailbreak attempts, prompt injection attacks, off-topic queries, and PII leakage. Uses pattern matching and classifier models to detect adversarial inputs in real-time.",
    examples: ["Jailbreak detection", "Prompt injection blocking", "PII stripping", "Topic boundary enforcement"],
    competitors: "None of Cursor, Windsurf, Copilot, Bolt.new, or Replit have input validation guardrails.",
  },
  {
    type: "Output Filtering",
    description: "Inspects every operator response before delivery. Catches unsafe content, format violations, leaked credentials, and responses that contradict the operator's stated capabilities. Enforces compliance with operator-specific content policies.",
    examples: ["Unsafe content filtering", "Format compliance", "Credential leak prevention", "Policy enforcement"],
    competitors: "Competing IDEs rely solely on the model's built-in alignment. No post-generation filtering layer exists.",
  },
  {
    type: "Topic Control",
    description: "Constrains operators to their declared domain. A Solana smart contract auditor cannot suddenly start giving medical advice. Topic rails use Colang definitions to create hard boundaries around operator capabilities.",
    examples: ["Domain boundary enforcement", "Capability scope limiting", "Off-topic rejection", "Context switching prevention"],
    competitors: "No competitor enforces topic boundaries at the infrastructure level. Agents can drift freely.",
  },
  {
    type: "Hallucination Detection",
    description: "Cross-references operator outputs against source data and known facts. Uses retrieval-augmented verification to flag claims that cannot be traced to source material. Particularly critical for code auditing and financial data operators.",
    examples: ["Fact verification", "Source attribution", "Confidence scoring", "Ungrounded claim flagging"],
    competitors: "Zero competitors have automated hallucination detection. Users must manually verify all outputs.",
  },
];

/* -- Architecture layers ---------------------------------------------------- */
const ARCH_LAYERS = [
  { layer: "Data", tool: "NeMo Curator", desc: "Clean, filter, and deduplicate training data at scale" },
  { layer: "Build", tool: "Nemotron + Agent Toolkit", desc: "Foundation models and framework-agnostic agent building" },
  { layer: "Evaluate", tool: "NeMo Evaluator", desc: "Continuous automated benchmarking and success scoring" },
  { layer: "Deploy", tool: "NVIDIA NIM", desc: "GPU-optimized inference containers with OpenAI-compatible APIs" },
  { layer: "Guard", tool: "NeMo Guardrails", desc: "Programmable input/output/dialog/retrieval safety rails" },
  { layer: "Optimize", tool: "NeMo RL + Gym", desc: "Reinforcement learning from real invocation feedback" },
  { layer: "Settle", tool: "Solana + x402", desc: "Sub-second payment settlement with 85/10/3/1.5/0.5 revenue split" },
];

export default function NvidiaStack() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-white/[0.02] text-foreground">
      <Navbar />

      {/* -- Hero ------------------------------------------------------------ */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 border-b border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <NvidiaBadge text="NVIDIA NeMo" size="md" />
            <span className="text-[10px] font-medium text-white/20 tracking-wider">PROTOCOL INTEGRATION</span>
          </div>

          <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-normal text-white leading-[1.1] tracking-tight mb-5">
            What NVIDIA NeMo actually is,
            <br />
            <span className="text-white/40">and how Aegis uses every piece of it.</span>
          </h1>

          <p className="text-[15px] text-white/35 max-w-2xl leading-relaxed mb-4">
            NeMo is NVIDIA's modular software suite for managing the full AI agent lifecycle: building, deploying, guarding, evaluating, and continuously improving AI models and agents. It is not one product. It is 7+ distinct tools that cover every stage from raw data to production inference.
          </p>
          <p className="text-[15px] text-white/35 max-w-2xl leading-relaxed">
            Aegis integrates the full NeMo stack at the protocol level. Every operator on the marketplace benefits from enterprise-grade data curation, automated evaluation, programmable safety rails, GPU-optimized deployment, and reinforcement learning. No other AI marketplace has any of this infrastructure built in.
          </p>
        </div>
      </section>

      {/* -- Guardrails Deep Dive (NEW) -------------------------------------- */}
      <section className="py-16 sm:py-24 border-b border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-4xl">
          <div className="flex items-center gap-2 mb-6">
            <NvidiaEyeLogo size={14} className="text-[#76B900]/60" />
            <span className="text-[11px] font-medium tracking-wider uppercase text-white/30">
              GUARDRAILS DEEP DIVE
            </span>
          </div>

          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-normal text-white leading-[1.1] tracking-tight mb-3">
            The safety layer no competitor has.
          </h2>
          <p className="text-[14px] text-white/30 max-w-2xl leading-relaxed mb-12">
            NeMo Guardrails gives Aegis four types of runtime safety enforcement. Every operator invocation
            passes through these rails. Guardrail compliance rates feed directly into on-chain trust scores.
            No other AI IDE or marketplace has anything comparable.
          </p>

          <div className="space-y-px">
            {GUARDRAIL_TYPES.map((rail) => (
              <div
                key={rail.type}
                className="border border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.025] transition-colors duration-200 p-6 sm:p-8"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <NvidiaEyeLogo size={12} className="text-[#76B900]/40" />
                      <h3 className="text-[16px] font-normal text-white/80">{rail.type}</h3>
                    </div>
                    <p className="text-[13px] text-white/40 leading-relaxed mb-4">
                      {rail.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {rail.examples.map((ex) => (
                        <span
                          key={ex}
                          className="text-[11px] font-medium text-white/30 bg-white/[0.03] border border-white/[0.06] px-2.5 py-1"
                        >
                          {ex}
                        </span>
                      ))}
                    </div>
                    <div className="border-t border-white/[0.04] pt-3">
                      <div className="text-[10px] font-medium tracking-wider text-emerald-400/50 mb-1">COMPETITIVE ADVANTAGE</div>
                      <p className="text-[12px] text-white/25 leading-relaxed">{rail.competitors}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Guardrails metrics */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.04]">
            {[
              { value: "4", label: "Rail Types" },
              { value: "~0.5s", label: "Added Latency" },
              { value: "1.4x", label: "Detection vs Baseline" },
              { value: "None", label: "Competitors with Guardrails" },
            ].map((m) => (
              <div key={m.label} className="bg-white/[0.02] p-4 sm:p-6 text-center">
                <div className="text-[22px] sm:text-[28px] font-normal text-zinc-300 tracking-tight">{m.value}</div>
                <div className="text-[10px] font-medium text-white/20 tracking-wider mt-1">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- 7 Components ---------------------------------------------------- */}
      <section className="py-16 sm:py-24 border-b border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-4xl">
          <div className="flex items-center gap-2 mb-6">
            <NvidiaEyeLogo size={14} className="text-[#76B900]/60" />
            <span className="text-[11px] font-medium tracking-wider uppercase text-white/30 font-medium">
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
                  {/* Header row */}
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

                  {/* Expanded content */}
                  <div className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                  }`}>
                    <div className="px-5 sm:px-6 pb-6 space-y-5">
                      {/* What it does */}
                      <div>
                        <div className="text-[10px] font-medium text-white/20 tracking-wider mb-2">WHAT IT DOES</div>
                        <p className="text-[13px] text-white/40 leading-relaxed max-w-3xl">
                          {comp.explanation}
                        </p>
                      </div>

                      {/* How Aegis uses it */}
                      <div>
                        <div className="text-[10px] font-medium text-[#76B900]/50 tracking-wider mb-2">HOW AEGIS USES IT</div>
                        <p className="text-[13px] text-white/40 leading-relaxed max-w-3xl">
                          {comp.aegisIntegration}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-white/[0.03] border border-white/[0.05]">
                        {comp.stats.map((s) => (
                          <div key={s.label} className="bg-white/[0.02] p-3 sm:p-4">
                            <div className="text-[15px] font-normal text-white/60 ">{s.value}</div>
                            <div className="text-[10px] text-white/20">{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Links */}
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
        </div>
      </section>

      {/* -- Architecture Stack ---------------------------------------------- */}
      <section className="py-16 sm:py-24 border-b border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-3xl">
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
        </div>
      </section>

      {/* -- Why this matters ------------------------------------------------ */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 max-w-3xl">
          <div className="border border-white/[0.04] p-6 rounded sm:p-10">
            <div className="flex items-center gap-2 mb-4">
              <NvidiaEyeLogo size={16} className="text-[#76B900]/50" />
              <span className="text-[10px] font-medium tracking-wider text-white/20 uppercase">
                WHY THIS MATTERS
              </span>
            </div>
            <p className="text-[15px] sm:text-[16px] text-white/50 leading-relaxed mb-4">
              Most AI marketplaces are just directories. They list models or agents and let users pick one. There is no quality guarantee, no safety enforcement, no automated evaluation, and no continuous improvement.
            </p>
            <p className="text-[15px] sm:text-[16px] text-white/50 leading-relaxed mb-4">
              Aegis integrates the full NVIDIA NeMo stack so that every operator is curated, evaluated, guarded, and optimized at the protocol level. Combined with bonded economic validation on Solana, this creates a marketplace where quality is not optional. It is enforced by infrastructure.
            </p>
            <p className="text-[15px] sm:text-[16px] text-white/50 leading-relaxed mb-6">
              The guardrails integration alone is a category differentiator. Cursor, Windsurf, Copilot, Bolt.new, and Replit have <span className="text-zinc-300 font-medium">zero guardrails</span>. Their AI agents can hallucinate, drift off-topic, leak PII, and produce unsafe outputs with no automated detection. AegisX catches all of this at the infrastructure level before it reaches the user.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/submit"
                className="inline-flex items-center gap-2 text-[13px] font-normal bg-white text-zinc-900 px-5 py-2.5 hover:bg-zinc-200 transition-colors duration-200"
              >
                Upload Your Operator
              </a>
              <a
                href="/marketplace"
                className="inline-flex items-center gap-2 text-[13px] font-medium text-white/40 hover:text-white/60 border border-white/[0.08] hover:border-white/[0.15] px-5 py-2.5 transition-colors duration-200"
              >
                Explore the Marketplace
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}
