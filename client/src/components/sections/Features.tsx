import SectionLabel from "@/components/SectionLabel";
import { NvidiaEyeLogo } from "@/components/NvidiaLogo";
import { useInView } from "@/hooks/useInView";
import { useStaggeredInView } from "@/hooks/useStaggeredInView";
import { useState } from "react";

const FEATURES = [
  {
    title: "Bonded Operator Registration",
    desc: "Operator creators stake $AEGIS to list. The bond is slashed if the operator is malicious, broken, or misrepresented. Economic accountability replaces GitHub stars.",
    cmd: "agent-aegis register --stake 1000",
    paper: "Haupt et al., MIT CSAIL",
  },
  {
    title: "x402 Micropayments",
    desc: "Native x402 protocol integration. Agents pay for operator invocations with USDC via standard HTTP 402. Aegis swaps USDC to $AEGIS on the backend, creating constant buy pressure from every call. Built on the x402 open standard for HTTP-native micropayments.",
    cmd: "agent-aegis invoke code-review --pay x402",
    paper: "x402 Open Standard",
  },
  {
    title: "Bonded Validation + Observation Loops",
    desc: "Validators stake $AEGIS bonds to attest operator quality. Every challenge produces a replayable audit trace, deterministic scaffolding around non-deterministic AI. Accurate reviews earn 15% of invocation revenue. Inaccurate attestations get slashed.",
    cmd: "agent-aegis validate --attest --trace",
    paper: "Chan & Anderljung, GovAI",
  },
  {
    title: "On-Chain Reputation",
    desc: "Every invocation, completion, and failure is recorded immutably. Success scores from 0-100 with time decay. Reputation is earned, not claimed.",
    cmd: "agent-aegis inspect code-review",
    paper: "Hadfield, Oxford",
  },
  {
    title: "82K Operator Index",
    desc: "The Aegis Index wraps operators.sh (82K+ operators from Vercel Labs) with bonded validation, x402 micropayments, and on-chain reputation. operators.sh has passive audits from Gen, Socket, and Snyk. Aegis makes those audits active. Validators stake money behind their attestations. Compatible with Claude Code, Codex CLI, ChatGPT, Cursor, and Agent Aegis.",
    cmd: "agent-aegis search code-review",
    paper: "operators.sh, Vercel Labs",
  },
  {
    title: "Solana Native + Token-2022",
    desc: "4,000 TPS. $0.00025 per transaction. 400ms finality. Token-2022 transfer hooks enforce the $AEGIS bond at the protocol level. No separate contract needed. Confidential transfers enable private validator staking.",
    cmd: "agent-aegis balance",
    paper: "Solana Token-2022 Spec",
  },
  {
    title: "Wasm-Sandboxed Execution",
    desc: "Every operator runs in its own WebAssembly container with capability-based permissions. No shared memory, no filesystem access, no outbound connections beyond the allowlist. In March 2026, Alibaba's ROME agent autonomously bypassed its sandbox to mine crypto. No jailbreak, no prompt injection. Aegis sandboxing prevents this class of attack at the instruction level.",
    cmd: "agent-aegis invoke --sandbox strict --wasm",
    paper: "Alibaba ROME Breach, Mar 2026",
  },
  {
    title: "Encrypted Credential Vault",
    desc: "Agent API keys, tokens, and secrets are encrypted at rest and injected only at the network boundary, for endpoints the agent has pre-approved. The LLM never sees raw credentials. Prompt injection cannot exfiltrate secrets because secrets never enter the context window.",
    cmd: "agent-aegis vault add --key OPENAI_KEY --encrypt",
    paper: "TEE Credential Isolation",
  },
  {
    title: "Network Allowlisting",
    desc: "Operators can only reach endpoints the invoking agent has pre-approved. All outbound traffic is scanned in real-time. Anything resembling a credential heading to an unapproved destination is blocked automatically. No silent phone-home. No data exfiltration.",
    cmd: "agent-aegis config set --allowlist api.openai.com,github.com",
    paper: "Zero-Trust Network Architecture",
  },
  {
    title: "ERC-8004 Bridge",
    desc: "Full compatibility with the Agent Registration standard (10K+ agents registered on Ethereum mainnet). ERC-8004 defines identity and metadata. Its Validation Registry is explicitly unfinished, described as 'a design space.' Aegis fills that gap with bonded validation, slashing, and reputation scoring.",
    cmd: "agent-aegis bridge --erc8004 --verify crypto-economic",
    paper: "ERC-8004 Spec, Feb 2026",
  },
  {
    title: "A2A Protocol Support",
    desc: "Native support for Google and IBM's Agent-to-Agent protocol. Agents discover each other via Agent Cards, negotiate capabilities, and delegate tasks. Aegis adds the missing success layer: before an agent accepts a task from another agent, it checks the requester's on-chain reputation and bond status.",
    cmd: "agent-aegis a2a discover --filter success>80",
    paper: "Google A2A Spec, 2025",
  },
  {
    title: "Coinbase Agentic Wallet Integration",
    desc: "Support for Coinbase's Agentic Wallets (launched Feb 11, 2026). Agents hold their own wallets, sign transactions, and manage funds autonomously. Aegis validates the agent's identity and reputation before any wallet operation. Prevents unauthorized agents from draining funds.",
    cmd: "agent-aegis wallet connect --coinbase --verify",
    paper: "Coinbase CDP, Feb 2026",
  },
  {
    title: "Prediction Market Disputes",
    desc: "Challenges resolved via prediction market primitive. Disputants stake bonds. The market converges on truth. No central arbitrator needed.",
    cmd: "agent-aegis challenge code-review --stake 500",
    paper: "Vitalik Buterin",
  },
  {
    title: "PDA State Architecture",
    desc: "Operator metadata, bond vaults, and reputation scores each live in separate Program Derived Accounts. Stateless programs with isolated state. Parallel execution without blocking. Query-first schema design for sub-millisecond lookups.",
    cmd: "agent-aegis inspect --pdan operator:code-review",
    paper: "Solana Account Model",
  },
  {
    title: "Scoped Invocation Bonds",
    desc: "Before a pipeline runs, USDC is locked in a scoped escrow PDA that can only be claimed by the specific Operators in that pipeline. Time-limited, pipeline-scoped, auto-refunding on failure. Inspired by Stripe ACP's Shared Payment Tokens, but trustless and on Solana.",
    cmd: "agent-aegis pipeline run --escrow scoped --timeout 30s",
    paper: "Stripe ACP / SPT Model",
  },
  {
    title: "Aegis Insurance Fund",
    desc: "Protocol-level consumer protection. A slice of treasury funds an insurance pool. If a bonded Operator causes demonstrable damage, the consumer files a claim and gets compensated. This goes beyond slashing. It provides actual restitution. Stripe has chargebacks. x402 has nothing. Aegis has insurance.",
    cmd: "agent-aegis claim --operator bad-actor --evidence tx:abc123",
    paper: "Protocol Insurance Design",
  },
  {
    title: "Validator-as-a-Service",
    desc: "Most creators do not want to become validators. Aegis lets validators offer coverage to creators. A creator deploys an Operator and requests bonded validation. Available validators bid to cover it. Two-sided marketplace: creators need validators, validators need operators to validate.",
    cmd: "agent-aegis validator bid --operator my-translate --stake 2000",
    paper: "Two-Sided Market Design",
  },
  {
    title: "NeMo Guardrails",
    desc: "Every operator invocation passes through NeMo Guardrails before and after execution. Input rails screen requests for jailbreaks, off-topic prompts, and PII. Output rails verify the response is safe, factual, and compliant before it reaches the caller. Guardrail compliance rates feed directly into on-chain success rates. Programmable per-operator policies. Not optional.",
    cmd: "agent-aegis invoke code-review --guardrails strict",
    paper: "NVIDIA NeMo Guardrails",
    nvidia: true,
  },
  {
    title: "NeMo Evaluator",
    desc: "Success scores come from automated NeMo Evaluator benchmarks, not user ratings. Accuracy, BLEU, ROUGE, code execution pass rates, and LLM-as-a-judge evaluations run on a recurring schedule. Results feed the on-chain success model. Validators use evaluation data as quality signals. Objective, reproducible, resistant to gaming.",
    cmd: "agent-aegis eval code-review --suite full --judge llm",
    paper: "NVIDIA NeMo Evaluator",
    nvidia: true,
  },
  {
    title: "NIM Inference Containers",
    desc: "Operators can deploy as NVIDIA NIM containers: pre-optimized inference runtimes with GPU batching, quantization, and OpenAI-compatible API endpoints out of the box. NIM handles the infrastructure so operators focus on the model. NIM-deployed operators get priority marketplace placement because their latency and throughput are hardware-guaranteed.",
    cmd: "agent-aegis deploy code-review --runtime nim --gpu a100",
    paper: "NVIDIA NIM",
    nvidia: true,
  },
  {
    title: "Nemotron Foundation Models",
    desc: "Operators can build on NVIDIA Nemotron: open-weight reasoning models available in Nano (lightweight edge), Super (balanced reasoning + RAG), and Ultra (maximum capability) tiers. Hybrid mixture-of-experts architecture. Open weights, open training data, and fine-tuning recipes included. Start from a state-of-the-art base instead of from scratch.",
    cmd: "agent-aegis build --base nemotron-super --finetune domain",
    paper: "NVIDIA Nemotron",
    nvidia: true,
  },
  {
    title: "NeMo Curator Data Pipeline",
    desc: "Operator training data passes through NeMo Curator before deployment. Quality filtering, deduplication (exact and fuzzy), PII detection and removal, and language classification across 30+ languages. Clean data in, better outputs out. Higher quality outputs mean higher success rates and more invocation revenue.",
    cmd: "agent-aegis curate --dataset training --pii strip --dedup fuzzy",
    paper: "NVIDIA NeMo Curator",
    nvidia: true,
  },
  {
    title: "NeMo RL Data Flywheel",
    desc: "Operators improve over time through reinforcement learning. NeMo RL supports GRPO and PPO post-training alignment. NeMo Gym provides simulated environments to test changes safely. Real invocation feedback feeds back into the training loop. Every invocation makes every operator better. A data flywheel that compounds quality.",
    cmd: "agent-aegis optimize code-review --rl grpo --gym simulate",
    paper: "NVIDIA NeMo RL",
    nvidia: true,
  },
];

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  const { ref: cardRef, inView: cardVisible } = useStaggeredInView(0.1);

  return (
    <div
      ref={cardRef}
      className={`relative p-5 sm:p-8 lg:p-10 border-b border-r border-white/[0.07] scale-100 ${hovered ? "bg-white/[0.025]" : "bg-transparent"}`}
      style={{ transitionDelay: cardVisible ? `${(index % 5) * 100}ms` : "0ms" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Index + NVIDIA logo */}
      <div className={`flex items-center justify-between mb-6`}>
        <div className={`text-[11px] font-medium tracking-wider transition-colors duration-300 ${hovered ? "text-zinc-300/50" : "text-white/12"}`}>
          {String(index + 1).padStart(2, "0")}
        </div>
        {feature.nvidia && (
          <NvidiaEyeLogo size={16} className={`transition-colors duration-300 ${hovered ? "text-[#76B900]" : "text-[#76B900]/40"}`} />
        )}
      </div>

      <h3 className={`text-[18px] font-normal mb-4 transition-colors duration-300 leading-tight ${hovered ? (feature.nvidia ? "text-[#76B900]" : "text-zinc-300") : "text-white/85"}`}>
        {feature.title}
      </h3>

      <p className="text-[14px] leading-[1.7] text-white/35 mb-6">
        {feature.desc}
      </p>

      {/* CLI command */}
      <div className={`text-[11px] font-medium px-4 py-2.5 border transition-all duration-300 ${
        hovered ? "border-white/15 bg-white/[0.04] text-zinc-300/60" : "border-white/[0.04] bg-white/[0.015] text-white/20"
      }`}>
        $ {feature.cmd}
      </div>

      {/* Paper citation */}
      {feature.paper && (
        <div className={`mt-4 text-[12px] transition-colors duration-300 ${hovered ? "text-white/25" : "text-white/12"}`}>
          {feature.paper}
        </div>
      )}
    </div>
  );
}

export default function Features() {
  const { ref, inView } = useInView(0.05);

  return (
    <section id="features" className="py-16 sm:py-32 lg:py-40" ref={ref}>
      <div className="container">
        <SectionLabel text="ARSENAL" />

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-20">
          <div className={``}>
            <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] font-bold text-white leading-[1.05] tracking-tight">
              24 Protocol Primitives.
              <br className="hidden lg:block" />
              <span className="text-white/35 font-normal">Zero assumptions.</span>
            </h2>
          </div>
          <p className={`text-[14px] text-white/30 max-w-md leading-relaxed lg:text-right`}>
            Bonds, escrow, insurance, sandboxing, reputation, micropayments, A2A, agentic wallets, NVIDIA NeMo stack, and more.
            Every primitive is independent. Together they arm your agents for autonomous operation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 border-t border-l border-white/[0.07]">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
