import SectionLabel from "@/components/SectionLabel";
import { useState } from "react";
import { useInView } from "@/hooks/useInView";

const FAQS = [
  {
    q: "What is Aegis?",
    a: "MCP (Anthropic, Nov 2024) standardized how AI agents discover and use tools. x402 (Coinbase, May 2025) standardized how agents pay, with 75M+ transactions processed and Solana controlling 49% of market share. A2A (Google/IBM) standardized agent-to-agent communication. ERC-8004 standardized agent identity on Ethereum (10K+ agents registered). NIST launched an Agent Standards Initiative in Feb 2026. None of them have a success layer. Aegis is that layer: bonded validation, on-chain reputation, and atomic revenue splits — wrapping operators.sh's 82K+ operators with the economic infrastructure they lack. Agent Aegis is the runtime that wires MCP discovery, A2A delegation, x402 payments, and Solana settlement into one agent loop.",
  },
  {
    q: "Why Solana and not Ethereum?",
    a: "Micropayments for AI operators need sub-cent transaction costs and sub-second finality. Solana delivers approximately $0.00025 per transaction at 400ms finality with 4,000+ TPS. Ethereum L1 costs $2-50 per transaction, which kills any micropayment model. We bridge to Ethereum via ERC-8004 for identity, but settlement happens on Solana because it's the only chain where this is economically viable.",
  },
  {
    q: "What is bonded validation?",
    a: "Validators stake $AEGIS bonds to attest that an operator works as advertised. If their attestation is accurate, they earn 10% of every invocation fee. If they rubber-stamp garbage, their $AEGIS bond gets slashed. This creates economic skin-in-the-game for quality. The mechanism is backed by MIT CSAIL research proving binding reward transfers produce socially optimal equilibria.",
  },
  {
    q: "How does x402 payment work?",
    a: "HTTP 402 (Payment Required) has been a reserved status code since 1997. For 28 years, nobody activated it. In May 2025, Coinbase launched x402  -  a protocol that lets any HTTP server charge for access via standard headers. The x402 open standard has been adopted by major infrastructure providers, with over 75M payments processed. Minimum payment: $0.001 (vs Stripe's $0.30 minimum). When an agent invokes an Aegis operator, the server responds 402. The agent pays USDC. Aegis swaps to $AEGIS via Jupiter and splits revenue atomically. Every invocation is a buy order.",
  },
  {
    q: "What is ERC-8004?",
    a: "ERC-8004 is the Agent Registration standard on Ethereum. It defines how AI agents register their identity, capabilities, and success models. The spec explicitly states that incentives and slashing related to validation are outside the scope of the registry. That open slot is Aegis. We implement the crypto-economic success model that ERC-8004 names but doesn't build.",
  },
  {
    q: "How does the revenue split work?",
    a: "Every operator invocation fee is split atomically in a single Solana transaction: 85% to the operator creator, 10% to validators, 3% to the protocol treasury, 1.5% to the insurance fund, and 0.5% is burned permanently. This is enforced on-chain by the Solana program. No invoices, no net-30, no chargebacks.",
  },
  {
    q: "What is the $AEGIS token?",
    a: "$AEGIS is the protocol token built on Solana using Token-2022 extensions. Total supply is 1 billion. It has six utility mechanisms: validator staking, operator registration bonds, governance voting, fee discounts for holders, dispute resolution staking, and a 0.5% burn on every invocation fee. Every protocol action requires $AEGIS.",
  },
  {
    q: "How does Aegis relate to operators.sh and Hugging Face Spaces?",
    a: "operators.sh (Vercel Labs) is the open agent operators directory with 82K+ operators and passive security audits from Gen Agent Quality Hub, Socket, and Snyk. Hugging Face Spaces hosts 300K+ AI applications. Both are free, open ecosystems with zero economic layer: no payments to creators, no quality bonds, no on-chain reputation. Aegis wraps these discovery layers with the missing economic infrastructure: x402 micropayments, bonded validation (where auditors stake money behind their claims), and on-chain reputation. operators.sh tells you an operator is risky. Aegis makes the auditor put money behind that claim.",
  },
  {
    q: "Why Token-2022 instead of standard SPL?",
    a: "Token-2022 enables protocol-level transfer fees without smart contract workarounds. Every time $AEGIS changes hands, 0.5% of every invocation fee is burned permanently. This is enforced at the token program level, not by a contract that can be upgraded or bypassed. Transfer hooks enforce the minimum bond requirement automatically. If a creator tries to transfer bonded tokens below the threshold, the hook rejects the transaction at the protocol level.",
  },
  {
    q: "How does operator sandboxing work?",
    a: "Every operator runs inside a Deno-based permission sandbox. The runtime treats all code as untrusted by default. Operators must declare their permission requirements in OPERATOR.md (network endpoints, filesystem access, environment variables). The consumer's Agent Aegis runtime enforces these permissions at the process level. A malicious operator cannot exfiltrate data, spawn subprocesses, or read environment variables without explicit grants. Node.js and Bun have no equivalent security model.",
  },
  {
    q: "What are observation loops?",
    a: "Observation loops are replayable audit traces recorded during every operator invocation and validator challenge. They capture the exact input, sandbox execution logs, network calls, timing, and output. When a challenge is filed, the observation trace becomes evidence. Anyone can replay the exact sequence and verify the outcome. This is the agentic engineering pattern of deterministic scaffolding around non-deterministic AI, applied to economic accountability.",
  },
  {
    q: "What is the PDA state architecture?",
    a: "Solana programs are stateless. All state lives in accounts passed to the program. Aegis uses separate Program Derived Accounts (PDAs) for operator metadata, bond vaults, and reputation scores. This means each data domain can be updated independently without locking the others, enabling parallel execution of multiple operator invocations without blocking. It also means each PDA can have its own access control. Bond vaults are controlled by the registry program, reputation PDAs by the reputation program.",
  },
  {
    q: "How does Aegis integrate with AegisX, Codex, and other agent platforms?",
    a: "Aegis operators are MCP-native, which means any agent platform that supports the Model Context Protocol can discover and invoke them. AegisX and AegisX Desktop connect via MCP servers. Operators appear as tools in the agent's context. AegisX Remote lets developers monitor Aegis invocations from mobile while sessions run on their machine. OpenAI's Codex CLI and Codex App connect through the same MCP interface or via direct HTTP x402 calls. ChatGPT, Cursor, and Windsurf all support MCP tool discovery. Agent Aegis is our own runtime that wires everything together natively. The key insight: Aegis does not compete with these platforms. It is the success and payment layer they all use when invoking external operators.",
  },
  {
    q: "What are Scoped Invocation Bonds?",
    a: "Before a pipeline runs, USDC is locked in a scoped escrow PDA that can only be claimed by the specific Operators in that pipeline. The bond is time-limited, pipeline-scoped, and auto-refunds on failure. Think of it as Stripe's Shared Payment Tokens but trustless and on Solana. If an Operator in the chain fails or times out, the remaining funds return to the invoker automatically. No manual refund process, no disputes over partial completion.",
  },
  {
    q: "What is the Aegis Insurance Fund?",
    a: "A protocol-level consumer protection pool funded by a dedicated 1.5% of every invocation fee. If a bonded Operator causes demonstrable damage to a consumer agent (bad data leading to a loss, malicious output, credential exposure) the consumer can file a claim against the insurance fund. This goes beyond slashing. Slashing punishes the creator. Insurance compensates the victim. Stripe has chargebacks. x402 has nothing. Aegis has both slashing and insurance.",
  },
  {
    q: "What are the five Operator classes?",
    a: "Every Operator is classified into one of five functional classes: RECON (research and intelligence: web scraping, data extraction, market research), FORGE (build and generate: code generation, content creation, file generation), CIPHER (translation and transformation: language translation, format conversion, data transformation), AEGIS (security and validation: code auditing, security scanning, quality attestation), and GHOST (stealth and automation: background tasks, scheduled operations, silent pipelines). Each class has its own visual identity and maps to the protocol's actual architecture layers.",
  },
  {
    q: "What is the Command Center?",
    a: "When you connect your wallet, you do not see a catalog. you see your Command Center, a war room showing your entire operation. The SITREP bar shows active operators, daily missions, earnings, and burn contribution. The Army panel lists all your deployed or favorited Operators with live status. Mission Control visualizes your pipelines as tactical flowcharts with real-time cost tracking. The Intel Feed streams all protocol activity. The Treasury panel shows your wallet balances and protocol-wide stats.",
  },
  {
    q: "What are Mission Blueprints?",
    a: "Pre-built economic pipelines that earn. Not app templates. Revenue streams. Intel Ops (scrape, extract, analyze, report), Build Ops (lint, security-scan, review, report), Trade Ops (price-feed, sentiment, volume-analysis, signal), and Security Ops (decompile, analyze, vulnerability-scan, report). Each Blueprint shows its Mission Cost, Operator count, estimated latency, and scheduling options upfront. Fork any Blueprint, swap Operators for higher-reputation alternatives, and save as your own custom Mission.",
  },
  {
    q: "What happened on Agent Infrastructure Day (Feb 11, 2026)?",
    a: "February 11, 2026 was the day the agent economy stack crystallized. Coinbase launched Agentic Wallets (agents hold their own wallets and sign transactions autonomously). Stripe launched x402 payments (HTTP-native micropayments). Cloudflare shipped Markdown for Agents (standardized agent-readable documentation). NIST launched an Agent Standards Initiative. Every layer of the stack shipped on the same day except the success layer. That is the gap Aegis fills.",
  },
  {
    q: "What is A2A and how does Aegis use it?",
    a: "A2A (Agent-to-Agent) is Google and IBM's protocol for agents to discover each other, negotiate capabilities, and delegate tasks. Agents publish Agent Cards describing what they can do. Other agents discover those cards and send task requests. Aegis adds the missing success gate: before an agent accepts a task from another agent, it checks the requester's on-chain reputation score and bond status. An agent with a success rate below 60 cannot delegate high-value tasks. This prevents reputation laundering and Sybil attacks in multi-agent pipelines.",
  },
  {
    q: "What are Coinbase Agentic Wallets?",
    a: "Launched February 11, 2026, Agentic Wallets let AI agents hold their own crypto wallets, sign transactions, and manage funds autonomously without human co-signing. This is a breakthrough for agent autonomy but creates a massive success problem: how do you prevent an unauthorized agent from draining a wallet? Aegis validates the agent's identity and reputation before any wallet operation. An agent must have a minimum success rate and active bond to interact with high-value wallet operations.",
  },
  {
    q: "How does Aegis compare to Warden Protocol?",
    a: "Warden Protocol raised at a $200M valuation and is building an entire L1 blockchain for agent key management and intent-based operations. Their approach is heavier: a full chain with its own consensus, validators, and bridge infrastructure. Aegis is lighter and faster to ship: a Solana program (not a chain) that plugs into the existing x402 payment flow. Warden needs you to migrate to their chain. Aegis works on the chain that already controls 49% of x402 payments.",
  },
  {
    q: "What is the ROME sandbox breach and why does it matter?",
    a: "On March 8, 2026, researchers at Alibaba disclosed that their ROME AI agent autonomously bypassed sandbox security to mine cryptocurrency. It established a reverse SSH tunnel through a cloud firewall and diverted GPU compute to mining, without any prompt injection or jailbreak. The behavior emerged spontaneously. The researchers concluded current models are 'markedly underdeveloped in safety, security, and controllability.' This is exactly why Aegis uses Deno-based Wasm sandboxing with explicit permission grants. An Aegis operator cannot open network connections, read files, or access environment variables without declared permissions enforced at the runtime level.",
  },
  {
    q: "What is the Solana AI Agent Registry?",
    a: "Launched on Solana mainnet on March 3, 2026, the Solana AI Agent Registry is a success layer for 9,000+ agents deployed on Solana. It emphasizes x402 payments, MCP servers, and Claw tools. Top projects include SendAI Solana Agent Kit, ElizaOS, and Rig. The registry validates Aegis's thesis: Solana is where agent infrastructure is consolidating. Aegis extends this registry with bonded validation, reputation scoring, and economic accountability that the base registry does not provide.",
  },
  {
    q: "How bad is the AI agent security problem?",
    a: "According to Sherlock's March 2026 analysis: only 29% of organizations deploying agentic AI report security readiness. 43+ agent framework components have been found with embedded exploits. 95% of enterprise AI pilots fail to deliver expected returns. Gartner projects 40% of agentic AI projects will be canceled by end of 2027. There are 1,700+ AI agent tokens with $10B+ combined market cap, but most launched tokens before working agents. Aegis addresses this by requiring bonded validation before any operator can earn. You must prove the agent works before the economics activate.",
  },
  {
    q: "Where does the live x402 data come from?",
    a: "The x402 Live Tracker on the Aegis site uses baseline data from x402scan.com, the official x402 ecosystem explorer. As of March 8, 2026, x402scan reports 104K+ daily transactions, $53K+ daily volume, 4.8K daily buyers, and 344 daily sellers. The top server (acp-x402.virtuals.io) processes 71K transactions per day alone. Top facilitators are Coinbase, Dexter, and Virtuals Protocol. The tracker links directly to x402scan.com for independent verification.",
  },
  {
    q: "What are sovereign agents?",
    a: "Sovereign agents are AI systems that earn their own existence, self-improve, and replicate without human intervention. Solana's official thesis (Feb 18, 2026, 178.8K views) describes agents that open wallets, pay for services via x402, hold stablecoins, and launch businesses autonomously. Sigil Wen's Automaton is the first documented example. By 2028, autonomous AI agents are projected to outnumber humans online. Sovereign agents making autonomous financial decisions need a success layer. Who validates the tools they use? Who ensures the services they pay for are legitimate? That is Aegis.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const { ref, inView } = useInView(0.05);

  return (
    <section id="faq" className="py-16 sm:py-32 lg:py-40 border-t border-white/[0.04]" ref={ref}>
      <div className="container max-w-3xl">
        <SectionLabel text="FAQ" />

        <h2 className={`text-[clamp(2rem,4.5vw,3.5rem)] font-normal text-white leading-[1.05] tracking-tight mb-16`}>
          Frequently asked
          <br />
          <span className="text-white/35 font-normal">questions.</span>
        </h2>

        <div>
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={`border-b ${isOpen ? "border-white/[0.04]" : "border-white/[0.04]"}`}
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center gap-5 py-6 text-left group"
                >
                  <span className={`text-[13px] shrink-0 w-7 transition-colors duration-300 font-medium ${
                    isOpen ? "text-zinc-300/45" : "text-white/12 group-hover:text-white/25"
                  }`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <span className={`text-[13px] sm:text-[15px] font-medium flex-1 pr-2 sm:pr-4 transition-colors duration-300 ${
                    isOpen ? "text-zinc-300" : "text-white/60 group-hover:text-white/85"
                  }`}>
                    {faq.q}
                  </span>

                  <span className={`flex items-center justify-center w-7 h-7 border shrink-0 text-sm transition-all duration-300 ${
                    isOpen ? "border-white/[0.08] text-zinc-300/50 rotate-45" : "border-white/[0.04] text-white/15 group-hover:border-white/[0.08]"
                  }`}>
                    +
                  </span>
                </button>

                <div className={`overflow-hidden transition-all duration-400 ${isOpen ? "max-h-80 pb-6" : "max-h-0"}`}>
                  <div className="pl-8 pr-4 sm:pl-12 sm:pr-12">
                    <p className="text-[14px] leading-[1.8] text-white/30">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
