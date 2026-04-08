import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { T } from "./theme";
import { PageHeader, Card, FilterChips, CodeBlock } from "./primitives";

type Category = "All" | "Security" | "Payment" | "Identity" | "Infrastructure" | "NVIDIA";

interface Feature {
  title: string;
  desc: string;
  shortDesc: string;
  cmd: string;
  paper: string;
  category: Category;
  nvidia?: boolean;
  color: string;
}

const FEATURES: Feature[] = [
  {
    title: "Bonded Operator Registration",
    shortDesc: "Operators stake $AEGIS to list. Slashed if malicious.",
    desc: "Operator creators stake $AEGIS to list. The bond is slashed if the operator is malicious, broken, or misrepresented. Economic accountability replaces GitHub stars.",
    cmd: "agent-aegis register --stake 1000",
    paper: "Haupt et al., MIT CSAIL",
    category: "Security",
    color: T.positive,
  },
  {
    title: "x402 Micropayments",
    shortDesc: "Native HTTP 402 payments with USDC-to-$AEGIS swap.",
    desc: "Native x402 protocol integration. Agents pay for operator invocations with USDC via standard HTTP 402. Aegis swaps USDC to $AEGIS on the backend, creating constant buy pressure from every call.",
    cmd: "agent-aegis invoke code-review --pay x402",
    paper: "x402 Open Standard",
    category: "Payment",
    color: T.text50,
  },
  {
    title: "Bonded Validation + Observation Loops",
    shortDesc: "Validators stake bonds to attest operator quality.",
    desc: "Validators stake $AEGIS bonds to attest operator quality. Every challenge produces a replayable audit trace, deterministic scaffolding around non-deterministic AI. Accurate reviews earn 15% of invocation revenue.",
    cmd: "agent-aegis validate --attest --trace",
    paper: "Chan & Anderljung, GovAI",
    category: "Security",
    color: T.positive,
  },
  {
    title: "on-chain quality",
    shortDesc: "Immutable invocation, completion, and failure records.",
    desc: "Every invocation, completion, and failure is recorded immutably. Success scores from 0-100 with time decay. quality is earned, not claimed.",
    cmd: "agent-aegis inspect code-review",
    paper: "Hadfield, Oxford",
    category: "Identity",
    color: T.text50,
  },
  {
    title: "82K Operator Index",
    shortDesc: "Wraps operators.sh with bonded validation and quality.",
    desc: "The Aegis Index wraps operators.sh (82K+ operators from Vercel Labs) with bonded validation, x402 micropayments, and on-chain quality. Compatible with AegisX, Codex CLI, ChatGPT, Cursor, and Agent Aegis.",
    cmd: "agent-aegis search code-review",
    paper: "operators.sh, Vercel Labs",
    category: "Infrastructure",
    color: T.text50,
  },
  {
    title: "Solana Native + Token-2022",
    shortDesc: "4,000 TPS, $0.00025/tx, 400ms finality.",
    desc: "4,000 TPS. $0.00025 per transaction. 400ms finality. Token-2022 transfer hooks enforce the $AEGIS bond at the protocol level. Confidential transfers enable private validator staking.",
    cmd: "agent-aegis balance",
    paper: "Solana Token-2022 Spec",
    category: "Infrastructure",
    color: T.text50,
  },
  {
    title: "Wasm-Sandboxed Execution",
    shortDesc: "Every operator runs in its own WebAssembly container.",
    desc: "Every operator runs in its own WebAssembly container with capability-based permissions. No shared memory, no filesystem access, no outbound connections beyond the allowlist.",
    cmd: "agent-aegis invoke --sandbox strict --wasm",
    paper: "Alibaba ROME Breach, Mar 2026",
    category: "Security",
    color: T.positive,
  },
  {
    title: "Encrypted Credential Vault",
    shortDesc: "API keys encrypted at rest, never enter the context window.",
    desc: "Agent API keys, tokens, and secrets are encrypted at rest and injected only at the network boundary. The LLM never sees raw credentials. Prompt injection cannot exfiltrate secrets.",
    cmd: "agent-aegis vault add --key OPENAI_KEY --encrypt",
    paper: "TEE Credential Isolation",
    category: "Security",
    color: T.positive,
  },
  {
    title: "Network Allowlisting",
    shortDesc: "Operators can only reach pre-approved endpoints.",
    desc: "Operators can only reach endpoints the invoking agent has pre-approved. All outbound traffic is scanned in real-time. Anything resembling a credential heading to an unapproved destination is blocked.",
    cmd: "agent-aegis config set --allowlist api.openai.com,github.com",
    paper: "Zero-Trust Network Architecture",
    category: "Security",
    color: T.positive,
  },
  {
    title: "ERC-8004 Bridge",
    shortDesc: "Full compatibility with Agent Registration standard.",
    desc: "Full compatibility with the Agent Registration standard (10K+ agents on Ethereum mainnet). ERC-8004 defines identity and metadata. Aegis fills the unfinished Validation Registry gap with bonded validation and slashing.",
    cmd: "agent-aegis bridge --erc8004 --verify crypto-economic",
    paper: "ERC-8004 Spec, Feb 2026",
    category: "Identity",
    color: T.text50,
  },
  {
    title: "A2A Protocol Support",
    shortDesc: "Native Google/IBM Agent-to-Agent protocol support.",
    desc: "Agents discover each other via Agent Cards, negotiate capabilities, and delegate tasks. Aegis verifies operator skills on-chain before an agent accepts or delegates any task.",
    cmd: "agent-aegis a2a discover --filter success>80",
    paper: "Google A2A Spec, 2025",
    category: "Infrastructure",
    color: T.text50,
  },
  {
    title: "Coinbase Agentic Wallet Integration",
    shortDesc: "Agents hold their own wallets and sign transactions.",
    desc: "Support for Coinbase's Agentic Wallets. Agents hold their own wallets, sign transactions, and manage funds autonomously. Aegis validates identity and quality before any wallet operation.",
    cmd: "agent-aegis wallet connect --coinbase --verify",
    paper: "Coinbase CDP, Feb 2026",
    category: "Payment",
    color: T.text50,
  },
  {
    title: "Prediction Market Disputes",
    shortDesc: "Challenges resolved via prediction market primitive.",
    desc: "Challenges resolved via prediction market primitive. Disputants stake bonds. The market converges on truth. No central arbitrator needed.",
    cmd: "agent-aegis challenge code-review --stake 500",
    paper: "Vitalik Buterin",
    category: "Security",
    color: T.positive,
  },
  {
    title: "PDA State Architecture",
    shortDesc: "Isolated Program Derived Accounts for parallel execution.",
    desc: "Operator metadata, bond vaults, and quality scores each live in separate Program Derived Accounts. Stateless programs with isolated state. Parallel execution without blocking.",
    cmd: "agent-aegis inspect --pdan operator:code-review",
    paper: "Solana Account Model",
    category: "Infrastructure",
    color: T.text50,
  },
  {
    title: "Scoped Invocation Bonds",
    shortDesc: "USDC locked in scoped escrow PDAs per pipeline.",
    desc: "Before a pipeline runs, USDC is locked in a scoped escrow PDA that can only be claimed by specific Operators in that pipeline. Time-limited, pipeline-scoped, auto-refunding on failure.",
    cmd: "agent-aegis pipeline run --escrow scoped --timeout 30s",
    paper: "Stripe ACP / SPT Model",
    category: "Payment",
    color: T.text50,
  },
  {
    title: "Aegis Insurance Fund",
    shortDesc: "Protocol-level consumer protection and restitution.",
    desc: "A slice of treasury funds an insurance pool. If a bonded Operator causes demonstrable damage, the consumer files a claim and gets compensated. Beyond slashing, actual restitution.",
    cmd: "agent-aegis claim --operator bad-actor --evidence tx:abc123",
    paper: "Protocol Insurance Design",
    category: "Payment",
    color: T.text50,
  },
  {
    title: "Validator-as-a-Service",
    shortDesc: "Validators bid to cover operators in a two-sided marketplace.",
    desc: "Aegis lets validators offer coverage to creators. A creator deploys an Operator and requests bonded validation. Available validators bid to cover it. Two-sided marketplace.",
    cmd: "agent-aegis validator bid --operator my-translate --stake 2000",
    paper: "Two-Sided Market Design",
    category: "Security",
    color: T.positive,
  },
  {
    title: "Operator Evolution",
    shortDesc: "Operators self-improve across 6 axes over time.",
    desc: "Operators specialize, learn, equip new tools, earn more, network with peers, and harden against failures. A generic code reviewer becomes a world-class Rust security auditor in 90 days.",
    cmd: "agent-aegis evolve code-review --strategy balanced",
    paper: "Aegis Evolution Framework",
    category: "Identity",
    color: T.text50,
  },
  {
    title: "NeMo Guardrails",
    shortDesc: "Input/output rails screen for jailbreaks and PII.",
    desc: "Every operator invocation passes through NeMo Guardrails before and after execution. Input rails screen for jailbreaks, off-topic prompts, and PII. Output rails verify safety and compliance.",
    cmd: "agent-aegis invoke code-review --guardrails strict",
    paper: "NVIDIA NeMo Guardrails",
    category: "NVIDIA",
    nvidia: true,
    color: T.text30,
  },
  {
    title: "NeMo Evaluator",
    shortDesc: "Automated benchmarks replace user ratings for success scores.",
    desc: "Success scores come from automated NeMo Evaluator benchmarks, not user ratings. Accuracy, BLEU, ROUGE, code execution pass rates, and LLM-as-a-judge evaluations run on a recurring schedule.",
    cmd: "agent-aegis eval code-review --suite full --judge llm",
    paper: "NVIDIA NeMo Evaluator",
    category: "NVIDIA",
    nvidia: true,
    color: T.text30,
  },
  {
    title: "NIM Inference Containers",
    shortDesc: "Pre-optimized GPU inference with OpenAI-compatible API.",
    desc: "Operators deploy as NVIDIA NIM containers: pre-optimized inference runtimes with GPU batching, quantization, and OpenAI-compatible API endpoints. NIM-deployed operators get priority marketplace placement.",
    cmd: "agent-aegis deploy code-review --runtime nim --gpu a100",
    paper: "NVIDIA NIM",
    category: "NVIDIA",
    nvidia: true,
    color: T.text30,
  },
  {
    title: "Nemotron Foundation Models",
    shortDesc: "Open-weight reasoning models in Nano, Super, Ultra tiers.",
    desc: "Build on NVIDIA Nemotron: open-weight reasoning models in Nano (edge), Super (balanced), and Ultra (maximum) tiers. Hybrid mixture-of-experts architecture with open weights and fine-tuning recipes.",
    cmd: "agent-aegis build --base nemotron-super --finetune domain",
    paper: "NVIDIA Nemotron",
    category: "NVIDIA",
    nvidia: true,
    color: T.text30,
  },
  {
    title: "NeMo Curator Data Pipeline",
    shortDesc: "Quality filtering, deduplication, and PII removal for training data.",
    desc: "Operator training data passes through NeMo Curator. Quality filtering, deduplication (exact and fuzzy), PII detection and removal, and language classification across 30+ languages.",
    cmd: "agent-aegis curate --dataset training --pii strip --dedup fuzzy",
    paper: "NVIDIA NeMo Curator",
    category: "NVIDIA",
    nvidia: true,
    color: T.text30,
  },
  {
    title: "NeMo RL Data Flywheel",
    shortDesc: "Reinforcement learning loop that compounds operator quality.",
    desc: "Operators improve through reinforcement learning. NeMo RL supports GRPO and PPO post-training alignment. Real invocation feedback feeds back into the training loop. Every invocation makes every operator better.",
    cmd: "agent-aegis optimize code-review --rl grpo --gym simulate",
    paper: "NVIDIA NeMo RL",
    category: "NVIDIA",
    nvidia: true,
    color: T.text30,
  },
];

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "All", label: "All" },
  { id: "Security", label: "Security" },
  { id: "Payment", label: "Payment" },
  { id: "Identity", label: "Identity" },
  { id: "Infrastructure", label: "Infrastructure" },
  { id: "NVIDIA", label: "NVIDIA" },
];

export default function ArsenalPanel() {
  const stats = trpc.stats.overview.useQuery(undefined, { staleTime: 60_000 });
  const [filter, setFilter] = useState<Category>("All");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const filtered = useMemo(
    () => filter === "All" ? FEATURES : FEATURES.filter((f) => f.category === filter),
    [filter],
  );

  const toggle = (idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const nvidiaCount = FEATURES.filter((f) => f.nvidia).length;
  const paymentCount = FEATURES.filter((f) => f.category === "Payment").length;

  return (
    <div>
      <PageHeader
        title="Protocol Arsenal"
        subtitle="24 technologies powering the Aegis skills marketplace"
      />

      <div style={{ marginBottom: 24 }}>
        <FilterChips options={CATEGORIES} active={filter} onChange={setFilter} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 12,
        }}
      >
        {filtered.map((feature, i) => {
          const globalIdx = FEATURES.indexOf(feature);
          const isExpanded = expanded.has(globalIdx);

          return (
            <Card
              key={feature.title}
              style={undefined}
            >
              <div
                style={{ padding: "20px", cursor: "pointer" }}
                onClick={() => toggle(globalIdx)}
              >
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  {/* Colored dot icon */}
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: feature.color,
                      flexShrink: 0,
                      boxShadow: "none",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: T.text20,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {String(globalIdx + 1).padStart(2, "0")}
                  </span>
                  {feature.nvidia && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 500,
                        letterSpacing: "0.02em",
                        color: T.text30,
                        background: `${T.text30}18`,
                        padding: "2px 6px",
                        borderRadius: 3,
                      }}
                    >
                      NVIDIA
                    </span>
                  )}
                </div>

                {/* Title */}
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: T.text80,
                    marginBottom: 6,
                    lineHeight: 1.3,
                  }}
                >
                  {feature.title}
                </div>

                {/* Short description */}
                <div
                  style={{
                    fontSize: 12,
                    color: T.text30,
                    lineHeight: 1.5,
                  }}
                >
                  {feature.shortDesc}
                </div>

                {/* Expand indicator */}
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 10,
                    fontWeight: 600,
                    color: T.text20,
                    letterSpacing: "0.06em",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      transition: "transform 0.2s",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    &#9662;
                  </span>
                  {isExpanded ? "COLLAPSE" : "EXPAND"}
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div
                    style={{ marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: T.text50,
                        lineHeight: 1.7,
                        marginBottom: 16,
                      }}
                    >
                      {feature.desc}
                    </div>

                    <CodeBlock code={`$ ${feature.cmd}`} language="bash" />

                    {feature.paper && (
                      <div
                        style={{
                          marginTop: 12,
                          fontSize: 11,
                          color: T.text20,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2 1h8v10H2V1z"
                            stroke="currentColor"
                            strokeWidth="1"
                            fill="none"
                          />
                          <path d="M4 4h4M4 6h4M4 8h2" stroke="currentColor" strokeWidth="0.8" />
                        </svg>
                        {feature.paper}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Bottom stats */}
      <div
        style={{
          marginTop: 28,
          padding: "16px 20px",
          background: T.white3,
          borderRadius: 8,
          fontSize: 12,
          color: T.text30,
          textAlign: "center",
          letterSpacing: "0.02em",
        }}
      >
        24 active technologies &middot; {nvidiaCount} NVIDIA integrations &middot; {paymentCount} payment protocols
        {stats.data && (
          <span> &middot; {stats.data.totalOperators.toLocaleString()} operators registered &middot; {stats.data.totalInvocations.toLocaleString()} invocations</span>
        )}
      </div>
    </div>
  );
}
