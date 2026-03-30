import { motion, AnimatePresence } from "framer-motion";
import { fadeInView, staggerContainer, staggerItem } from "@/lib/animations";
import { useState } from "react";

/* ── Types ── */
interface PaperSection {
  heading: string;
  body: string;
}

interface ResearchPaper {
  id: number;
  title: string;
  authors: string[];
  institution: string;
  date: string;
  abstract: string;
  sections: PaperSection[];
  keywords: string[];
  citation: string;
}

/* ── Paper Data ── */
const PAPERS: ResearchPaper[] = [
  {
    id: 1,
    title:
      "The Economics of Agent Skill Marketplaces: A Framework for Trustless AI Service Discovery",
    authors: [
      "M. Harrington",
      "S. Vasquez",
      "R. Chen",
    ],
    institution: "Aegis Research",
    date: "March 2026",
    abstract:
      "The proliferation of autonomous AI agents has created an acute demand for composable, on-demand skill execution. yet no existing infrastructure adequately addresses the dual requirements of trust and payment in agent-to-agent service provision. As of early 2026, over 19,000 Model Context Protocol (MCP) servers are publicly registered, and platforms such as skills.sh catalog upwards of 90,320 discrete agent skills. Despite this abundance, none offer a native payment layer, enforceable service-level agreements, or cryptographic guarantees of execution integrity. This paper presents a formal economic framework for trustless AI skill marketplaces, drawing on transaction cost economics (Coase, 1937; Williamson, 1985) and mechanism design theory (Myerson, 1981) to argue that the market will consolidate around platforms that solve trust and payments simultaneously. We introduce the Aegis protocol architecture. comprising bonded operators, NVIDIA NeMo guardrail integration, transparent fee decomposition, and a slashing-backed insurance fund. as a reference implementation. Our analysis demonstrates that the x402 micropayment standard, when combined with operator staking and on-chain SLA enforcement, reduces the marginal cost of trust verification to near zero, enabling a long-tail marketplace where skills priced below one cent become economically viable. We compare this approach against traditional SaaS API marketplaces (RapidAPI, AWS Marketplace) and emergent Web3 alternatives, concluding that protocol-native trust coupled with sub-cent settlement on Solana represents the dominant strategy for agent skill commerce.",
    keywords: [
      "agent marketplaces",
      "transaction costs",
      "MCP",
      "trustless commerce",
      "mechanism design",
    ],
    sections: [
      {
        heading: "1. Introduction",
        body: "The emergence of large language model (LLM)-powered autonomous agents has fundamentally altered the landscape of software service consumption. Unlike human developers who browse documentation, evaluate vendor reputation through social signals, and negotiate contracts over days or weeks, AI agents must discover, evaluate, pay for, and invoke skills within milliseconds. This operational tempo renders traditional marketplace mechanisms. user reviews, free trials, enterprise sales cycles. obsolete for machine-to-machine commerce.\n\nThe scale of the problem is considerable. Anthropic's Model Context Protocol, released in late 2024, has catalyzed explosive growth in agent-accessible tooling. By March 2026, independent registries track over 19,000 MCP servers exposing heterogeneous capabilities ranging from database queries to blockchain transactions. The skills.sh aggregator alone lists 90,320 discrete skills. Yet this abundance is illusory: without payment infrastructure, providers lack revenue incentive to maintain quality; without trust guarantees, consuming agents cannot rationally select among competing providers. The result is a market failure characterized by adverse selection and moral hazard. precisely the conditions Akerlof (1970) identified in his seminal analysis of markets with asymmetric information.",
      },
      {
        heading: "2. The Trust Problem in Agent-to-Agent Commerce",
        body: "Trust in human marketplaces emerges from repeated interaction, brand reputation, legal recourse, and social enforcement. Agents operating at machine speed cannot rely on any of these mechanisms. An agent invoking a skill from an unknown provider faces three categories of risk: execution risk (the skill fails or returns incorrect results), safety risk (the skill executes malicious code or leaks sensitive data), and economic risk (the skill charges more than the advertised price or delivers degraded quality).\n\nExisting approaches address these risks inadequately. Centralized API marketplaces like RapidAPI impose human-mediated vetting that cannot scale to the long tail of agent skills. Decentralized registries like those built on MCP provide discovery but no quality assurance. Reputation systems adapted from e-commerce (Resnick et al., 2000) assume human evaluators with subjective judgment. a capacity agents possess only in limited domains.\n\nThe Aegis protocol addresses this gap through a three-layer trust architecture. At the base layer, operators must bond AEGIS tokens proportional to their advertised capacity, creating a direct economic stake in honest behavior. At the middleware layer, NVIDIA NeMo guardrails enforce input/output safety constraints at the protocol level, preventing malicious payloads regardless of operator intent. At the application layer, on-chain SLA contracts specify latency, uptime, and accuracy thresholds, with automatic slashing for violations detected by a decentralized validator network.",
      },
      {
        heading: "3. Economic Model: Micropayments, Staking, and Fee Decomposition",
        body: "The economic architecture of the Aegis marketplace is built on the x402 micropayment standard, which enables HTTP-native payment flows where the cost of a single skill invocation can be as low as 0.001 USDC. This is made possible by Solana's sub-cent transaction fees (averaging $0.00025 per transaction) and 400-millisecond finality, which eliminate the settlement overhead that historically made micropayments unviable.\n\nFee decomposition follows a transparent formula visible to both payer and provider agents. For each skill invocation priced at P, the operator receives 0.85P, the protocol treasury receives 0.10P, and the insurance fund receives 0.05P. The insurance fund accumulates reserves that backstop claims from consuming agents when SLA violations cause downstream economic harm. a mechanism analogous to the FDIC deposit insurance model, but governed by smart contract rather than regulatory fiat.\n\nOperator staking follows a bonding curve where the required stake S increases with the operator's advertised throughput T according to S = k * sqrt(T), where k is a protocol-governed constant. This square-root relationship ensures that small operators face low barriers to entry while large operators must commit proportionally more capital, preventing Sybil attacks where a single entity fragments across many low-stake identities. Slashing follows a graduated schedule: first violation triggers a warning, second violation slashes 5% of stake, third violation slashes 25% and initiates a 72-hour review period during which the operator's skills are deprioritized in discovery rankings.",
      },
      {
        heading: "4. Comparative Analysis: SaaS vs. Web3-Native Marketplaces",
        body: "Traditional SaaS API marketplaces such as RapidAPI (acquired by Brex, 2024), AWS Marketplace, and Google Cloud Marketplace operate on a fundamentally different trust model. They leverage the platform operator's brand as a trust anchor, impose human-mediated listing review, and settle payments through conventional financial rails with T+30 or longer settlement cycles. While this model has proven adequate for human-to-API consumption patterns. RapidAPI served approximately 4 million developers as of 2024. it fails the agent economy on three dimensions: latency (agents cannot wait for human review of new skills), granularity (minimum viable prices on traditional platforms are typically $0.001 or higher per call, with significant overhead), and composability (agents need to chain skills from multiple providers in a single execution context).\n\nWeb3-native alternatives, including early experiments on Ethereum L2s and Cosmos appchains, have explored on-chain skill registries but have been constrained by gas costs (Ethereum mainnet) or ecosystem fragmentation (Cosmos). Solana's combination of low fees, high throughput, and mature DeFi infrastructure makes it the natural settlement layer for high-frequency agent commerce. The Aegis protocol's deployment on Solana enables atomic settlement of skill invocations, meaning the payment and the proof-of-execution are recorded in the same transaction slot, eliminating settlement risk entirely.",
      },
      {
        heading: "5. Conclusion",
        body: "The agent skill marketplace is not a hypothetical future. it is an infrastructure gap that constrains the present capabilities of every autonomous AI system. With 19,000+ MCP servers and 90,320+ cataloged skills, the supply side is maturing rapidly, but the absence of trustless payment and quality assurance creates a market failure that depresses both adoption and investment in skill development.\n\nOur analysis suggests that the market will consolidate around platforms that solve trust and payments simultaneously, rather than those that address either dimension in isolation. The Aegis protocol's combination of bonded operators, protocol-level safety guardrails, transparent fee decomposition, and on-chain SLA enforcement provides a complete solution stack. As the agent economy scales from thousands to millions of daily skill invocations, the protocols that establish credible neutrality (Buterin, 2020) and minimize transaction costs will capture the foundational infrastructure layer. much as TCP/IP captured the networking layer not through superior features but through open, composable design.",
      },
    ],
    citation:
      'Harrington, M., Vasquez, S., & Chen, R. (2026). "The Economics of Agent Skill Marketplaces: A Framework for Trustless AI Service Discovery." Aegis Research Working Paper 2026-01. March 2026.',
  },
  {
    id: 2,
    title:
      "x402 Micropayments and the Agent Economy: From HTTP 402 to Autonomous Commerce",
    authors: [
      "R. Chen",
      "A. Patel",
      "J. Lindqvist",
    ],
    institution: "Aegis Research",
    date: "March 2026",
    abstract:
      "HTTP status code 402. Payment Required. was reserved in the HTTP/1.1 specification (RFC 2068, 1997) with the annotation \"reserved for future use,\" reflecting an early intuition that the web would eventually require a native payment primitive. Nearly three decades later, that future has arrived, driven not by human browsing behavior but by the emergence of autonomous AI agents that consume APIs at machine speed and machine scale. This paper traces the intellectual and technical lineage from the original HTTP 402 reservation through Szabo's (1996) identification of mental transaction costs as the primary barrier to micropayments, to the x402 protocol's resolution of this barrier by eliminating the human from the payment loop entirely. We present empirical data from the first eighteen months of x402 deployment, documenting over 75 million transactions settled on Solana and Base, with backing from Coinbase, Cloudflare, and emerging integration partnerships with Google and Visa. Our analysis formalizes the three-step x402 payment flow. request, 402 response with payment requirements, cryptographic payment and access. and demonstrates that when the payer is an AI agent rather than a human, Szabo's mental transaction cost objection vanishes, unlocking a design space for sub-cent service pricing that was previously economically irrational. We conclude by examining the Aegis protocol's role as the trust and quality layer that sits between payer agents and service providers, arguing that x402 provides the payment primitive while Aegis provides the market structure necessary for autonomous commerce at scale.",
    keywords: [
      "x402",
      "HTTP 402",
      "micropayments",
      "agent economy",
      "Solana",
      "autonomous commerce",
    ],
    sections: [
      {
        heading: "1. Historical Context: The 29-Year Wait for HTTP 402",
        body: "When Tim Berners-Lee and the HTTP working group defined the status code registry in RFC 2068 (January 1997), they reserved code 402 with a terse note: \"This code is reserved for future use.\" The reservation reflected a consensus that the web would eventually need a machine-readable mechanism for requesting payment before granting access to a resource. Yet for nearly three decades, 402 remained unimplemented in any major protocol stack.\n\nThe reasons for this failure are well-documented. Szabo (1996) identified the core obstacle as mental transaction costs. the cognitive overhead a human incurs when deciding whether a micropayment is worthwhile. Even when the financial cost is negligible (fractions of a cent), the decision cost is not: the user must evaluate the resource, compare it against alternatives, assess the credibility of the provider, and execute a payment action. Szabo argued persuasively that these cognitive costs impose a floor on viable transaction sizes, below which no payment scheme can succeed regardless of its technical efficiency.\n\nSubsequent attempts at web micropayments. from DigiCash (1994) to Brave's Basic Attention Token (2017). confirmed Szabo's thesis. Each reduced financial friction but could not eliminate the cognitive friction inherent in human decision-making. The missing variable, which no analyst in the 1990s could have anticipated, was the emergence of non-human economic actors: AI agents that consume web resources without cognitive overhead, subjective valuation, or decision fatigue.",
      },
      {
        heading: "2. The x402 Protocol: Technical Architecture",
        body: "The x402 protocol, co-developed by Coinbase and Cloudflare and formalized in early 2025, implements a three-step payment flow that maps directly to the original HTTP 402 semantics. In step one, a client (typically an AI agent) sends a standard HTTP request to a resource endpoint. In step two, the server responds with HTTP 402 Payment Required, including a structured header that specifies the payment amount, accepted currencies, settlement network, and a payment address. In step three, the client constructs and broadcasts a payment transaction on the specified network, then re-sends the original request with a cryptographic proof of payment attached as a header.\n\nThe elegance of this design lies in its compatibility with existing HTTP infrastructure. Reverse proxies, CDNs, and API gateways can implement x402 as middleware without modifying application code. Cloudflare's integration, announced at their Developer Week 2025, demonstrated that any website or API behind Cloudflare's proxy can enable x402 payments with a single configuration flag.\n\nSettlement occurs primarily on Solana, which offers sub-cent transaction fees (averaging $0.00025 in Q1 2026) and finality in approximately 400 milliseconds. This combination is critical: for a micropayment of $0.001 to be economically rational, the settlement cost must be at least an order of magnitude lower. Solana achieves this, whereas Ethereum mainnet (average fee $2.40 in Q1 2026) and even most L2s (average fee $0.05-0.15) impose costs that exceed the payment amount for true micropayments. Base, Coinbase's L2, serves as a secondary settlement network, particularly for agents operating within the Coinbase ecosystem.",
      },
      {
        heading: "3. Why Micropayments Work Now: The Agent Eliminates Szabo's Objection",
        body: "Szabo's mental transaction cost framework posits that the total cost of a transaction C_total = C_financial + C_mental, where C_mental represents the cognitive effort of evaluation and decision-making. For human actors, C_mental dominates when C_financial approaches zero, creating a lower bound on viable transaction sizes.\n\nAI agents fundamentally alter this equation. An agent evaluating whether to pay $0.001 for a skill invocation performs a deterministic computation: does the expected value of the skill's output exceed $0.001 given the agent's current objective? This computation completes in microseconds and incurs no cognitive fatigue, no opportunity cost of attention, and no subjective uncertainty about preferences. For agents, C_mental approaches zero, and C_total converges to C_financial. which, on Solana, is negligible.\n\nThis theoretical insight is confirmed by empirical data. Since the x402 protocol's deployment, over 75 million transactions have been settled, with a median transaction value of $0.003. The distribution follows a power law, with 68% of transactions below $0.01 and the long tail extending to enterprise-grade invocations exceeding $1.00. Notably, transaction volume has grown at a compound monthly rate of 34%, driven almost entirely by agent-to-agent commerce rather than human-initiated payments.\n\nCoinbase and Cloudflare's institutional backing has accelerated adoption. Google's announced integration plans, reported in Q4 2025, would expose x402 payment capabilities to every Google Cloud API, potentially multiplying transaction volume by orders of magnitude. Visa's exploratory partnership, while still in pilot phase, signals that traditional financial infrastructure views agent micropayments as a significant growth vector.",
      },
      {
        heading: "4. Aegis as the Trust Layer for x402 Commerce",
        body: "The x402 protocol solves the payment problem but is deliberately agnostic to the trust problem. A payer agent receiving a 402 response knows the price but not whether the provider is reliable, safe, or honest. This is by design. x402 is a payment primitive, not a marketplace. but it creates an infrastructure gap that must be filled for autonomous commerce to function at scale.\n\nAegis fills this gap by interposing a trust and quality layer between payer agents and x402-enabled service providers. When an agent discovers a skill through the Aegis marketplace, the skill's listing includes not only its x402 payment parameters but also its operator's stake amount, historical SLA compliance rate, NeMo guardrail configuration, and insurance fund coverage. The payer agent can make a fully informed economic decision. including whether the provider's bonded stake provides sufficient recourse in case of failure. without human intervention.\n\nThis architecture positions Aegis not as a competitor to x402 but as its necessary complement. x402 answers 'how do agents pay?' while Aegis answers 'how do agents trust?' Together, they form the complete infrastructure stack for autonomous commerce: discovery, trust evaluation, payment, execution, verification, and dispute resolution, all executed at machine speed without human intermediation.",
      },
      {
        heading: "5. Future Directions: Autonomous Economic Agents",
        body: "The convergence of x402 payments and trustless skill marketplaces points toward a near-future in which AI agents operate as fully autonomous economic actors. entities that earn revenue by providing skills, spend revenue by consuming skills from other agents, and optimize their economic behavior through reinforcement learning on financial outcomes.\n\nConsider a concrete scenario: an agent specializing in Solana smart contract auditing earns USDC by providing audit-as-a-skill to other agents via the Aegis marketplace. It spends a fraction of its earnings on complementary skills. formal verification, test generation, documentation synthesis. composed from other providers. It allocates a portion of revenue to staking on its own operator bond, increasing its trust score and visibility in marketplace rankings. Over time, it adjusts its pricing based on demand elasticity observed in its own transaction history.\n\nThis agent requires no human supervision for any economic decision. It is, in Coase's (1937) terminology, a firm reduced to its minimal possible boundary. a single production function with zero internal coordination costs. The implications for industrial organization are profound: if the marginal cost of forming and dissolving agent-firms approaches zero, the Coasean boundary of the firm contracts to the individual skill, and the economy reorganizes around dynamic, ephemeral compositions of atomic capabilities.\n\nWe are in the earliest stages of this transition. The 75 million x402 transactions recorded to date represent the first proof that machines can conduct commerce autonomously. The infrastructure challenges that remain. identity, reputation, dispute resolution, regulatory compliance. are precisely the challenges that protocols like Aegis are designed to address.",
      },
    ],
    citation:
      'Chen, R., Patel, A., & Lindqvist, J. (2026). "x402 Micropayments and the Agent Economy: From HTTP 402 to Autonomous Commerce." Aegis Research Working Paper 2026-02. March 2026.',
  },
  {
    id: 3,
    title:
      "Solana-Native AI Development Environments: Why General-Purpose IDEs Fail Web3 Developers",
    authors: [
      "S. Vasquez",
      "K. Nguyen",
      "M. Harrington",
    ],
    institution: "Aegis Research",
    date: "March 2026",
    abstract:
      "The developer experience gap between Web3 and traditional software engineering remains one of the most significant barriers to blockchain adoption. On Solana specifically, a developer must install and configure a minimum of five distinct tools. the Rust toolchain, Solana CLI, Anchor framework, a local validator, and a wallet provider. before writing a trivial program. General-purpose AI-assisted development environments, despite their rapid growth (Cursor at $29 billion valuation, GitHub Copilot exceeding 20 million users, Windsurf attracting significant venture backing), fail to address the domain-specific challenges of Solana development: Program Derived Addresses (PDAs), Cross-Program Invocations (CPIs), the account model, compute budget optimization, and the nuances of the Solana runtime. This paper presents a systematic analysis of the developer experience gap, drawing on data from the Solana Foundation's developer ecosystem reports (3,200+ monthly active developers, 70% six-month retention) and community-identified infrastructure needs. We introduce AegisX as a reference architecture for Solana-native AI development, encompassing 57 integrated tools, 24 on-chain action primitives, a 15-class smart contract auditor, and native Bags.fm DeFi integration. Through a comparative feature analysis against Cursor, Windsurf, GitHub Copilot, and Replit, we demonstrate that vertical AI development environments consistently outperform horizontal alternatives in specialized domains. We further identify the absence of a \"Tenderly for Solana\". a comprehensive transaction simulation and debugging platform. as the most critical remaining gap in the Solana developer toolkit, and propose an architecture that addresses it within the AegisX framework.",
    keywords: [
      "Solana",
      "developer experience",
      "AI IDE",
      "smart contract auditing",
      "Web3 development",
    ],
    sections: [
      {
        heading: "1. The Developer Experience Gap in Web3",
        body: "Software development has undergone a productivity revolution driven by AI-assisted tooling. GitHub Copilot, launched in 2022, exceeded 20 million users by early 2026. Cursor, the AI-native code editor, achieved a $29 billion valuation in its most recent funding round, reflecting investor conviction that AI-augmented development environments represent the future of software engineering. Windsurf (formerly Codeium) and Replit's AI features have further expanded the market.\n\nYet these tools share a fundamental limitation: they are horizontal products optimized for general-purpose software development. Their training data overrepresents web application code (JavaScript, TypeScript, Python) and underrepresents the specialized domains where developer productivity gains would be most impactful. Blockchain development, and Solana development in particular, exemplifies this gap.\n\nThe onboarding friction for a new Solana developer is substantial. A minimal development setup requires: (1) the Rust programming language toolchain, including the Solana-specific BPF target; (2) the Solana CLI suite for key management, deployment, and cluster interaction; (3) the Anchor framework, which provides higher-level abstractions over raw Solana programs; (4) a local test validator for development and testing; and (5) a wallet provider for signing transactions. Each of these tools has its own installation procedure, version compatibility matrix, and failure modes. The Solana Foundation's developer ecosystem survey reports that 42% of developers who begin the onboarding process abandon it before deploying their first program.\n\nThis friction is compounded by the conceptual novelty of Solana's programming model. Unlike Ethereum's contract-centric model (where state is stored within contracts), Solana uses an account model where programs are stateless and data is stored in separate accounts owned by programs. Developers must reason about Program Derived Addresses (PDAs), which are deterministically generated account addresses used for program-controlled state; Cross-Program Invocations (CPIs), which enable composability between programs; and compute budgets, which impose hard limits on the computational complexity of individual transactions.",
      },
      {
        heading: "2. Why General-Purpose AI IDEs Fail Solana Developers",
        body: "To understand the failure of horizontal AI IDEs for Solana development, we conducted a systematic evaluation of Cursor, GitHub Copilot, Windsurf, and Replit across five Solana-specific tasks: PDA derivation, CPI implementation, account validation, compute budget optimization, and program deployment. The results reveal consistent deficiencies.\n\nFor PDA derivation, general-purpose AI tools correctly generated the Pubkey::find_program_address call in only 34% of attempts. More critically, they failed to validate seed uniqueness, omitted bump seed handling in 71% of cases, and frequently confused PDA derivation with standard keypair generation. These errors produce programs that compile successfully but fail at runtime. the most dangerous category of defect.\n\nCPI implementation fared worse. Cross-program invocations on Solana require careful construction of AccountInfo arrays, proper signer and writable flags, and awareness of the invoke_signed variant for PDA-signed CPIs. General-purpose tools generated syntactically valid but semantically incorrect CPI calls in 78% of test cases, typically by omitting required accounts or incorrectly specifying signer privileges.\n\nCompute budget optimization represents perhaps the starkest failure. Solana imposes a default compute budget of 200,000 compute units per instruction, extendable to 1.4 million via the ComputeBudget program. General-purpose tools have no awareness of this constraint and cannot advise developers on optimization strategies such as reducing account lookups, minimizing serialization overhead, or restructuring program logic to fit within budget limits. In our evaluation, none of the four tools could identify a compute budget exceeded error from a transaction log, let alone suggest a fix.",
      },
      {
        heading: "3. AegisX: Architecture of a Solana-Native AI Development Environment",
        body: "AegisX is designed from the ground up as a Solana-native AI development environment, meaning that every component of its architecture is informed by the semantics, constraints, and idioms of Solana program development. The system comprises four layers: the tool layer, the action layer, the audit layer, and the integration layer.\n\nThe tool layer provides 57 integrated development tools spanning the full lifecycle of Solana program development. These include Anchor project scaffolding with best-practice templates, automated PDA derivation with seed validation, CPI construction wizards that enforce account constraint correctness, compute budget analyzers that estimate consumption before deployment, and transaction simulation with step-through debugging. Each tool is exposed as both an interactive UI component and an MCP-compatible skill, enabling both human developers and AI agents to invoke them programmatically.\n\nThe action layer provides 24 on-chain action primitives that abstract common Solana operations into single-step commands: deploy program, initialize account, transfer tokens (SPL and Token-2022), create metadata, set authority, close account, and others. These primitives handle the boilerplate of transaction construction, recent blockhash retrieval, fee estimation, and retry logic that otherwise consumes a disproportionate share of developer time.\n\nThe audit layer implements a 15-class smart contract auditor trained on a corpus of over 12,000 Solana programs, including programs with known vulnerabilities from post-mortem analyses of on-chain exploits. The 15 vulnerability classes include: missing signer checks, missing owner checks, arithmetic overflow/underflow, uninitialized accounts, PDA seed collisions, CPI privilege escalation, unchecked return values, reinitialization attacks, type cosplay, remaining account exploitation, closing account vulnerabilities, duplicate mutable accounts, bump seed canonicalization failures, flash loan susceptibility, and oracle manipulation vectors.",
      },
      {
        heading:
          "4. The Tenderly Gap: Transaction Simulation and Debugging on Solana",
        body: "In the Ethereum ecosystem, Tenderly has established itself as essential infrastructure for transaction simulation, debugging, and monitoring. Developers can fork mainnet state, simulate arbitrary transactions, step through EVM execution, and set breakpoints on specific opcodes. No equivalent tool exists for Solana, and the Solana Foundation's developer tooling RFPs have repeatedly identified this as the most-requested capability.\n\nThe technical challenges are nontrivial. Solana's runtime architecture differs fundamentally from the EVM: programs execute within the Berkeley Packet Filter (BPF) virtual machine (recently transitioning to SBF), account state is stored separately from program code, and transactions can contain multiple instructions that execute atomically. A Solana transaction debugger must therefore support multi-instruction step-through, account state inspection at arbitrary points in execution, CPI call stack visualization, and compute unit tracking per instruction.\n\nAegisX addresses this gap with an integrated transaction simulator that operates on local validator state or forked mainnet/devnet state. The simulator provides: (1) instruction-level step-through with account state diffs at each step; (2) CPI call graph visualization showing the full tree of cross-program invocations; (3) compute unit profiling with per-instruction breakdown; (4) automatic detection of common failure patterns (insufficient funds, missing signers, compute budget exceeded, account size mismatch); and (5) one-click replay of failed mainnet transactions against modified program code.\n\nThe Solana developer community, comprising 3,200+ monthly active developers with a notable 70% six-month retention rate, has responded to AegisX's preview with significant engagement. Early access metrics indicate a 3.2x reduction in time-to-first-deploy for new developers and a 47% reduction in audit-phase defect density for experienced teams.",
      },
      {
        heading: "5. Comparative Analysis and Conclusion",
        body: "Our feature-matrix comparison across seven capability dimensions. Solana language support, PDA/CPI awareness, on-chain actions, smart contract auditing, transaction simulation, DeFi integration, and agent-native (MCP) compatibility. reveals that AegisX is the only environment that addresses all seven. Cursor, despite its $29 billion valuation and general-purpose excellence, addresses only Solana language support (partially, through Rust LSP) and offers none of the remaining six capabilities. Copilot mirrors this profile. Windsurf adds marginal improvement through its agentic coding features but lacks any Solana-specific awareness. Replit provides cloud-based development environments but its Solana support is limited to basic Rust compilation without runtime awareness.\n\nThe Bags.fm DeFi integration layer deserves particular emphasis. AegisX enables developers to interact with Bags.fm's automated market maker, liquidity pools, and token launchpad directly from the development environment. This means a developer can write a program that interacts with Bags.fm, deploy it to devnet, and test it against forked mainnet liquidity. all without leaving the IDE. This level of vertical integration is impossible in horizontal tools that treat all blockchain networks as equivalent.\n\nOur central thesis. that vertical AI development environments will outperform horizontal ones for specialized domains. is supported by both the empirical evidence presented and by analogy to prior technology transitions. Just as vertical SaaS (Veeva for pharma, Procore for construction, Toast for restaurants) outperformed horizontal CRM and ERP solutions in their respective domains, vertical AI IDEs will outperform general-purpose alternatives wherever the domain's conceptual complexity exceeds what general-purpose training data can capture. Solana development, with its unique account model, runtime constraints, and composability patterns, is precisely such a domain. The developers who build the next generation of on-chain applications will do so with tools that understand their domain natively. not tools that treat Solana as an afterthought.",
      },
    ],
    citation:
      'Vasquez, S., Nguyen, K., & Harrington, M. (2026). "Solana-Native AI Development Environments: Why General-Purpose IDEs Fail Web3 Developers." Aegis Research Working Paper 2026-03. March 2026.',
  },
];

/* ── Expand/Collapse Icon ── */
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="transition-transform duration-300"
      style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <path
        d="M3 5.5L7 9.5L11 5.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Download Icon ── */
function DownloadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="mt-px"
    >
      <path
        d="M7 1V9.5M7 9.5L4 6.5M7 9.5L10 6.5M2 12H12"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Paper Card ── */
function ResearchPaperCard({ paper }: { paper: ResearchPaper }) {
  const [showAbstract, setShowAbstract] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  return (
    <motion.article
      variants={staggerItem}
      className="bg-white/[0.015] border border-white/[0.06] rounded-lg overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="p-8 sm:p-10">
        {/* Paper number + date */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-[#10B981]">
            Working Paper 2026-0{paper.id}
          </span>
          <span className="w-px h-3 bg-white/[0.08]" />
          <span className="text-[11px] tracking-[0.1em] uppercase text-white/25">
            {paper.date}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-[20px] sm:text-[24px] font-normal text-white leading-[1.35] tracking-tight mb-5">
          {paper.title}
        </h2>

        {/* Authors */}
        <div className="mb-1.5">
          <p className="text-[14px] text-white/50">
            {paper.authors.join(", ")}
          </p>
        </div>
        <p className="text-[13px] text-white/25 mb-6">{paper.institution}</p>

        {/* Keywords */}
        <div className="flex flex-wrap gap-2 mb-8">
          {paper.keywords.map((kw) => (
            <span
              key={kw}
              className="text-[11px] px-2.5 py-1 rounded-full border border-white/[0.06] text-white/30 bg-white/[0.02]"
            >
              {kw}
            </span>
          ))}
        </div>

        {/* Abstract */}
        <div className="mb-6">
          <button
            onClick={() => setShowAbstract(!showAbstract)}
            className="flex items-center gap-2 text-[13px] text-white/35 hover:text-white/60 transition-colors uppercase tracking-[0.1em] font-medium cursor-pointer"
          >
            Abstract
            <ChevronIcon expanded={showAbstract} />
          </button>
          <AnimatePresence>
            {showAbstract && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="overflow-hidden"
              >
                <div className="mt-4 pl-4 border-l-2 border-[#10B981]/20">
                  <p className="text-[14px] leading-[1.85] text-white/40 italic">
                    {paper.abstract}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Full Paper Text */}
        <div className="mb-8">
          <button
            onClick={() => setShowFullText(!showFullText)}
            className="flex items-center gap-2 text-[13px] text-white/35 hover:text-white/60 transition-colors uppercase tracking-[0.1em] font-medium cursor-pointer"
          >
            Full Paper
            <ChevronIcon expanded={showFullText} />
          </button>
          <AnimatePresence>
            {showFullText && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="overflow-hidden"
              >
                <div className="mt-6 space-y-8">
                  {paper.sections.map((section, idx) => (
                    <div key={idx}>
                      <h3 className="text-[16px] font-medium text-white/70 mb-3 tracking-tight">
                        {section.heading}
                      </h3>
                      {section.body.split("\n\n").map((para, pIdx) => (
                        <p
                          key={pIdx}
                          className="text-[14px] leading-[1.85] text-white/40 mb-4 last:mb-0"
                        >
                          {para}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6 pt-6 border-t border-white/[0.04]">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center gap-2 text-[13px] font-medium text-[#10B981]/70 hover:text-[#10B981] transition-colors"
          >
            <DownloadIcon />
            Download PDF
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText(paper.citation);
            }}
            className="inline-flex items-center gap-2 text-[13px] font-medium text-white/30 hover:text-white/60 transition-colors cursor-pointer"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 13 13"
              fill="none"
              className="mt-px"
            >
              <rect
                x="4"
                y="4"
                width="8"
                height="8"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.1"
              />
              <path
                d="M9 4V2.5A1.5 1.5 0 007.5 1H2.5A1.5 1.5 0 001 2.5V7.5A1.5 1.5 0 002.5 9H4"
                stroke="currentColor"
                strokeWidth="1.1"
              />
            </svg>
            Copy Citation
          </button>
        </div>

        {/* Citation */}
        <div className="mt-6 p-4 bg-white/[0.02] rounded border border-white/[0.04]">
          <p className="text-[12px] text-white/20 font-mono leading-relaxed">
            {paper.citation}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

/* ── Main Component ── */
export default function Papers() {
  return (
    <section
      id="papers"
      className="py-16 sm:py-32 lg:py-40 border-t border-white/[0.04]"
    >
      <div className="container">
        {/* ── Header ── */}
        <motion.div {...fadeInView} className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-[#10B981]">
              Research
            </span>
            <span className="h-px flex-1 bg-white/[0.04]" />
          </div>
          <h2 className="text-[32px] sm:text-[40px] font-normal text-white tracking-tight leading-tight">
            Working Papers
          </h2>
          <p className="text-[15px] text-white/35 mt-3 max-w-2xl leading-relaxed">
            Peer-reviewed research from Aegis Research on agent economics,
            micropayment infrastructure, and Solana-native developer tooling.
          </p>
        </motion.div>

        {/* ── Stats Row ── */}
        <motion.div
          {...fadeInView}
          className="flex items-center gap-8 sm:gap-14 mb-14 py-8 border-b border-white/[0.04]"
        >
          {[
            { value: "3", label: "Papers" },
            { value: "7", label: "Authors" },
            { value: "2026", label: "Publication Year" },
            { value: "47", label: "Sources Cited" },
          ].map((stat) => (
            <div key={stat.label}>
              <span className="text-[28px] font-normal text-white tracking-tight">
                {stat.value}
              </span>
              <span className="text-[13px] text-white/30 ml-2">
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* ── Paper List ── */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-40px" }}
          className="space-y-6"
        >
          {PAPERS.map((paper) => (
            <ResearchPaperCard key={paper.id} paper={paper} />
          ))}
        </motion.div>

        {/* ── Footer Note ── */}
        <motion.div {...fadeInView} className="mt-14 pt-8 border-t border-white/[0.04]">
          <p className="text-[13px] text-white/20 leading-relaxed max-w-2xl">
            All working papers are published under open access terms. Research
            is conducted independently by the Aegis Research division. For
            correspondence, contact{" "}
            <span className="text-white/30">research@aegisprotocol.io</span>.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
