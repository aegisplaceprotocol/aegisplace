import { motion } from "framer-motion";
import { fadeInView, staggerContainer, staggerItem } from "@/lib/animations";
import { useState } from "react";

/* ── Research Domains ── */
type Domain =
  | "All"
  | "Agent Economics"
  | "Success & Reputation"
  | "AI Safety"
  | "Mechanism Design"
  | "Infrastructure"
  | "Multi-Agent";

interface Paper {
  id: number;
  title: string;
  authors: string;
  venue: string;
  year: string;
  domain: Domain;
  abstract: string;
  link: string;
}

const PAPERS: Paper[] = [
  /* ── Domain 1: Agent Economics ── */
  {
    id: 1,
    title: "The Nature of the Firm",
    authors: "R.H. Coase",
    venue: "Economica",
    year: "1937",
    domain: "Agent Economics",
    abstract:
      "Foundational work establishing that firms exist because market transaction costs make it cheaper to coordinate production internally. Introduces the concept of transaction cost economics, arguing that the boundary of the firm is determined by the relative costs of external versus internal coordination. Directly relevant to understanding how autonomous agents reduce coordination costs to near zero, collapsing traditional firm boundaries.",
    link: "https://doi.org/10.1111/j.1468-0335.1937.tb00002.x",
  },
  {
    id: 2,
    title: "The Economics of Artificial Intelligence",
    authors: "Agrawal, Gans, Goldfarb",
    venue: "NBER",
    year: "2019",
    domain: "Agent Economics",
    abstract:
      "A comprehensive research agenda examining how AI, framed as a drop in the cost of prediction, reshapes economic activity. Covers the implications for labor markets, firm strategy, innovation, and trade. Establishes the analytical framework for understanding AI not as a general-purpose technology but as a specific economic input whose declining cost transforms decision-making across industries.",
    link: "https://www.nber.org/books-and-chapters/economics-artificial-intelligence-agenda",
  },
  {
    id: 3,
    title: "Prediction Machines",
    authors: "Agrawal, Gans, Goldfarb",
    venue: "Harvard Business Review Press",
    year: "2018",
    domain: "Agent Economics",
    abstract:
      "Extends the prediction-cost framework into actionable strategy. Argues that as prediction becomes cheap, the value of complementary human judgment increases. Provides a systematic approach to decomposing tasks into prediction and judgment components, directly informing the design of human-agent collaboration systems where agents handle prediction and humans retain oversight.",
    link: "https://www.predictionmachines.ai",
  },
  {
    id: 4,
    title: "The Governance of AI",
    authors: "Allan Dafoe",
    venue: "Oxford Future of Humanity Institute",
    year: "2020",
    domain: "Agent Economics",
    abstract:
      "Maps the governance landscape for artificial intelligence across technical, institutional, and political dimensions. Identifies key challenges including the concentration of AI capabilities, the difficulty of international coordination, and the need for governance mechanisms that scale with the technology. Proposes a research agenda spanning AI policy, safety governance, and the political economy of automation.",
    link: "https://www.fhi.ox.ac.uk/govaiagenda/",
  },

  /* ── Domain 2: Success & Reputation ── */
  {
    id: 5,
    title: "Computational Success",
    authors: "Piotr Zielinski",
    venue: "MIT CSAIL",
    year: "2006",
    domain: "Success & Reputation",
    abstract:
      "Formalizes computational approaches to success evaluation in distributed systems. Develops mathematical models for quantifying trustworthiness based on observable behavior, establishing foundations for automated success assessment. Addresses the cold-start problem, success propagation across networks, and the integration of multiple evidence sources into coherent success scores.",
    link: "https://groups.csail.mit.edu/medg/people/psz/home/",
  },
  {
    id: 6,
    title: "Success in Multi-Agent Systems",
    authors: "Ramchurn, Huynh, Jennings",
    venue: "The Knowledge Engineering Review",
    year: "2004",
    domain: "Success & Reputation",
    abstract:
      "Comprehensive survey of quality and reputation mechanisms in multi-agent systems. Categorizes approaches into individual-level success models, reputation-based systems, and socio-cognitive frameworks. Evaluates the effectiveness of different quality architectures for agent cooperation, delegation, and coalition formation in open, dynamic environments.",
    link: "https://doi.org/10.1017/S0269888904000116",
  },
  {
    id: 7,
    title: "Reputation Systems",
    authors: "Resnick, Zeckhauser, Swanson, Lockwood",
    venue: "Communications of the ACM",
    year: "2000",
    domain: "Success & Reputation",
    abstract:
      "Seminal paper on the design principles of reputation systems for online marketplaces. Analyzes feedback mechanisms, strategic manipulation, and the conditions under which reputation systems produce reliable signals. Identifies key challenges including name-changing attacks, ballot stuffing, and the tension between privacy and accountability that remain central to modern agent reputation design.",
    link: "https://doi.org/10.1145/355112.355122",
  },
  {
    id: 8,
    title: "Decentralized Quality Management",
    authors: "Artz, Gil",
    venue: "IEEE Intelligent Systems",
    year: "2007",
    domain: "Success & Reputation",
    abstract:
      "Surveys decentralized approaches to quality management on the semantic web and in peer-to-peer systems. Examines how quality can be established, maintained, and propagated without central authorities. Covers policy-based trust, reputation aggregation, and credential-based approaches, providing a taxonomy that maps directly to blockchain-based agent quality architectures.",
    link: "https://doi.org/10.1109/MIS.2007.4338496",
  },
  {
    id: 9,
    title: "AI Governance",
    authors: "Dafoe, Zwetsloot",
    venue: "Oxford GovAI",
    year: "2021",
    domain: "Success & Reputation",
    abstract:
      "Research program examining governance mechanisms for AI systems at institutional and international scales. Investigates how existing governance frameworks can be adapted for AI, proposes novel mechanisms for ensuring AI development benefits humanity broadly, and analyzes the strategic dynamics between nations and organizations competing in AI development.",
    link: "https://www.governance.ai/research-paper/",
  },

  /* ── Domain 3: AI Safety & Guardrails ── */
  {
    id: 10,
    title: "NeMo Guardrails: A Toolkit for Controllable and Safe LLM Applications",
    authors: "Rebedea, Dinu, Sreedhar, Parisien, Cohen",
    venue: "EMNLP 2023 (NVIDIA)",
    year: "2023",
    domain: "AI Safety",
    abstract:
      "Introduces NeMo Guardrails, an open-source toolkit for adding programmable safety constraints to LLM-powered applications. Presents the Colang modeling language for defining conversational guardrails, content moderation flows, and topical boundaries. Demonstrates that safety constraints can be applied at the infrastructure level without modifying underlying models, enabling protocol-level safety guarantees.",
    link: "https://doi.org/10.18653/v1/2023.emnlp-demo.40",
  },
  {
    id: 11,
    title: "Constitutional AI: Harmlessness from AI Feedback",
    authors: "Bai, Kadavath, Kundu et al.",
    venue: "Anthropic",
    year: "2022",
    domain: "AI Safety",
    abstract:
      "Proposes a method for training AI systems to be helpful, harmless, and honest using AI-generated feedback guided by a set of principles (a constitution). Demonstrates that self-supervision against explicit principles can reduce harmful outputs while maintaining helpfulness, establishing a scalable approach to alignment that informs runtime safety check design.",
    link: "https://arxiv.org/abs/2212.08073",
  },
  {
    id: 12,
    title: "Training a Helpful and Harmless Assistant from Human Feedback",
    authors: "Bai, Jones, Kaplan et al.",
    venue: "Anthropic",
    year: "2022",
    domain: "AI Safety",
    abstract:
      "Presents RLHF techniques for training language model assistants that are both helpful and harmless. Demonstrates the tension between helpfulness and safety, showing that naive optimization for either objective degrades the other. Introduces methods for balancing these objectives through careful reward modeling and iterative training, providing empirical foundations for safety-utility tradeoff analysis.",
    link: "https://arxiv.org/abs/2204.05862",
  },
  {
    id: 13,
    title: "Llama Guard: LLM-based Input-Output Safeguard for Human-AI Conversations",
    authors: "Inan, Karber, Rezatofighi et al.",
    venue: "Meta / NeurIPS 2023",
    year: "2023",
    domain: "AI Safety",
    abstract:
      "Introduces Llama Guard, a model-based approach to classifying safety risks in LLM inputs and outputs. Defines a taxonomy of unsafe content categories and trains a classifier that can be applied as a modular safety layer. Achieves strong performance on multiple safety benchmarks while maintaining low latency, demonstrating the viability of LLM-based guardrails for production systems.",
    link: "https://arxiv.org/abs/2312.06674",
  },
  {
    id: 14,
    title: "The Malicious Use of Artificial Intelligence",
    authors: "Brundage, Avin, Clark et al.",
    venue: "Oxford / Cambridge / OpenAI",
    year: "2018",
    domain: "AI Safety",
    abstract:
      "Comprehensive analysis of the threat landscape arising from malicious applications of AI. Covers digital security threats (automated exploitation, adversarial attacks), physical security risks (autonomous weapons, drone swarms), and political security concerns (surveillance, manipulation). Recommends proactive safety measures including monitoring, access controls, and red-teaming that inform protocol-level safety architecture.",
    link: "https://arxiv.org/abs/1802.07228",
  },

  /* ── Domain 4: Mechanism Design ── */
  {
    id: 15,
    title: "Liberal Radicalism: A Flexible Design for Philanthropic Matching Funds",
    authors: "Buterin, Hitzig, Weyl",
    venue: "arXiv",
    year: "2018",
    domain: "Mechanism Design",
    abstract:
      "Proposes quadratic funding, a mechanism where matching funds are allocated proportionally to the square of the sum of square roots of individual contributions. Proves this achieves optimal public goods provision under broad conditions. The mechanism directly informs incentive design for decentralized validation networks where collective funding of infrastructure must be both efficient and democratic.",
    link: "https://arxiv.org/abs/1809.06421",
  },
  {
    id: 16,
    title: "Automated Mechanism Design",
    authors: "Conitzer, Sandholm",
    venue: "AAAI / JAIR",
    year: "2002",
    domain: "Mechanism Design",
    abstract:
      "Introduces the computational approach to mechanism design where optimal mechanisms are derived algorithmically rather than analytically. Demonstrates that for many settings, automated search over mechanism space yields superior results to known analytical mechanisms. Establishes the foundation for designing agent interaction protocols where the rules of engagement are computationally optimized for desired outcomes.",
    link: "https://doi.org/10.1613/jair.1498",
  },
  {
    id: 17,
    title: "Token-Curated Registries 1.0",
    authors: "Mike Goldin",
    venue: "AdChain",
    year: "2017",
    domain: "Mechanism Design",
    abstract:
      "Specifies token-curated registries (TCRs), a decentralized curation mechanism where token holders stake tokens to propose, challenge, and vote on list entries. Demonstrates how economic incentives can maintain high-quality curated lists without central authority. Directly relevant to validator-curated operator registries where quality assurance is achieved through bonded participation.",
    link: "https://medium.com/@ilovebagels/token-curated-registries-1-0-61a232f8dac7",
  },
  {
    id: 18,
    title: "Credible Neutrality as a Guiding Principle",
    authors: "Vitalik Buterin",
    venue: "Nakamoto",
    year: "2020",
    domain: "Mechanism Design",
    abstract:
      "Argues that the most important property of mechanism design for platforms is credible neutrality: the quality of not discriminating for or against any specific participant. Defines four criteria for credible neutrality and analyzes existing mechanisms against them. Establishes the design philosophy for protocol-level infrastructure that must serve diverse, competing agents without favoring any subset.",
    link: "https://nakamoto.com/credible-neutrality/",
  },

  /* ── Domain 5: Decentralized Infrastructure ── */
  {
    id: 19,
    title: "Model Context Protocol Specification",
    authors: "Anthropic",
    venue: "Anthropic",
    year: "2024",
    domain: "Infrastructure",
    abstract:
      "Specifies the Model Context Protocol (MCP), an open standard for connecting AI models to external data sources and tools. Defines a client-server architecture with standardized message formats for tool discovery, invocation, and result handling. Enables interoperable agent-tool communication, providing the connectivity layer for autonomous agents to access and compose arbitrary capabilities.",
    link: "https://modelcontextprotocol.io/specification",
  },
  {
    id: 20,
    title: "x402: HTTP Payment Protocol",
    authors: "Coinbase, Cloudflare",
    venue: "x402.org",
    year: "2025",
    domain: "Infrastructure",
    abstract:
      "Defines the x402 protocol for native HTTP payments, enabling machines to pay for API access using the HTTP 402 Payment Required status code. Specifies payment negotiation, verification, and settlement flows that allow agents to autonomously purchase services. Establishes the payment primitive for agent-to-agent economic transactions without human intermediation.",
    link: "https://www.x402.org/",
  },
  {
    id: 21,
    title: "Solana: A New Architecture for a High Performance Blockchain",
    authors: "Anatoly Yakovenko",
    venue: "Solana Foundation",
    year: "2018",
    domain: "Infrastructure",
    abstract:
      "Introduces Proof of History, a cryptographic clock that enables high-throughput consensus without the coordination overhead of traditional BFT protocols. Achieves sub-second finality and theoretical throughput of 710,000 transactions per second. The low-latency, low-cost settlement layer is essential for micropayment-based agent economies where transaction costs must be negligible relative to invocation prices.",
    link: "https://solana.com/solana-whitepaper.pdf",
  },
  {
    id: 22,
    title: "SPL Token-2022: Next-Generation Token Program",
    authors: "Solana Foundation",
    venue: "Solana Program Library",
    year: "2023",
    domain: "Infrastructure",
    abstract:
      "Specifies extensions to the Solana Program Library token standard including transfer fees, interest-bearing tokens, confidential transfers, and permanent delegates. These programmable token primitives enable protocol-level fee collection, automated revenue splitting, and on-chain governance without custom smart contract development, providing the financial infrastructure for autonomous agent marketplaces.",
    link: "https://spl.solana.com/token-2022",
  },

  /* ── Domain 6: Multi-Agent Systems ── */
  {
    id: 23,
    title: "Generative Agents: Interactive Simulacra of Human Behavior",
    authors: "Park, O'Brien, Cai, Morris, Liang, Bernstein",
    venue: "Stanford / UIST 2023",
    year: "2023",
    domain: "Multi-Agent",
    abstract:
      "Demonstrates that LLM-powered agents with memory, reflection, and planning can exhibit believable individual and emergent social behaviors in a simulated environment. Twenty-five agents autonomously form relationships, coordinate activities, and spread information. Establishes that current language models are sufficient substrates for autonomous agents that require no human intervention for extended operation.",
    link: "https://arxiv.org/abs/2304.03442",
  },
  {
    id: 24,
    title: "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation",
    authors: "Wu, Bansal, Zhang, Wu et al.",
    venue: "Microsoft Research",
    year: "2023",
    domain: "Multi-Agent",
    abstract:
      "Presents a framework for building LLM applications through multi-agent conversations. Agents with different roles and capabilities collaborate through structured dialogue to solve complex tasks. Demonstrates that decomposing problems across specialized agents and enabling inter-agent communication produces superior results to monolithic approaches, validating the marketplace model for agent skill composition.",
    link: "https://arxiv.org/abs/2308.08155",
  },
  {
    id: 25,
    title: "Voyager: An Open-Ended Embodied Agent with Large Language Models",
    authors: "Wang, Xian, Liu, Gururani et al.",
    venue: "NVIDIA / NeurIPS 2023",
    year: "2023",
    domain: "Multi-Agent",
    abstract:
      "Introduces the first LLM-powered agent capable of continuous, open-ended learning in Minecraft. Voyager autonomously explores, acquires skills, and composes them into increasingly complex behaviors without human intervention. Demonstrates three key mechanisms: automatic curriculum generation, a skill library for code-as-knowledge storage, and iterative prompting for program refinement. Validates that agents can autonomously expand their capability sets.",
    link: "https://arxiv.org/abs/2305.16291",
  },
  {
    id: 26,
    title: "CAMEL: Communicative Agents for Mind Exploration of Large Language Model Society",
    authors: "Li, Zhang, Sun, Chen et al.",
    venue: "KAUST",
    year: "2023",
    domain: "Multi-Agent",
    abstract:
      "Proposes role-playing as a scalable approach for studying cooperative behaviors in multi-agent systems. Two agents assigned complementary roles collaborate through structured conversation to complete tasks autonomously. Analyzes emergent behaviors, failure modes, and the conditions under which agent cooperation succeeds or breaks down, providing empirical grounding for multi-agent marketplace design.",
    link: "https://arxiv.org/abs/2303.17760",
  },
];

const DOMAINS: Domain[] = [
  "All",
  "Agent Economics",
  "Success & Reputation",
  "AI Safety",
  "Mechanism Design",
  "Infrastructure",
  "Multi-Agent",
];

const DOMAIN_COUNTS: Record<string, number> = {};
for (const p of PAPERS) {
  DOMAIN_COUNTS[p.domain] = (DOMAIN_COUNTS[p.domain] || 0) + 1;
}

/* ── Paper Card ── */
function PaperCard({ paper }: { paper: Paper }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      variants={staggerItem}
      className="bg-white/[0.02] border border-white/[0.06] rounded-[6px] p-6 group hover:border-white/[0.12] transition-colors duration-300"
    >
      {/* Title */}
      <h3 className="text-[15px] font-bold text-white/90 leading-snug mb-2">
        {paper.title}
      </h3>

      {/* Authors */}
      <p className="text-[13px] text-white/30 mb-1.5">{paper.authors}</p>

      {/* Venue + Year */}
      <p className="text-[12px] text-white/20 mb-4">
        {paper.venue} &middot; {paper.year}
      </p>

      {/* Abstract (expandable) */}
      <div className="mb-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[12px] text-white/25 hover:text-white/50 transition-colors uppercase tracking-wider font-medium cursor-pointer"
        >
          {expanded ? "Hide abstract" : "Show abstract"}
          <span className="ml-1.5 inline-block transition-transform duration-200" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
            &#9662;
          </span>
        </button>
        {expanded && (
          <p className="text-[13px] leading-[1.75] text-white/30 mt-3">
            {paper.abstract}
          </p>
        )}
      </div>

      {/* Read paper link */}
      <a
        href={paper.link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/40 hover:text-white/80 transition-colors"
      >
        Read paper
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="mt-px"
        >
          <path
            d="M1 11L11 1M11 1H5M11 1V7"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      </a>
    </motion.div>
  );
}

/* ── Main Component ── */
export default function Papers() {
  const [activeDomain, setActiveDomain] = useState<Domain>("All");

  const filtered =
    activeDomain === "All"
      ? PAPERS
      : PAPERS.filter((p) => p.domain === activeDomain);

  const institutions = new Set(
    PAPERS.flatMap((p) => {
      const parts = p.venue.split(/[/,&]/).map((s) => s.trim());
      return parts;
    })
  );

  return (
    <section id="papers" className="py-16 sm:py-32 lg:py-40 border-t border-white/[0.07]">
      <div className="container">
        {/* ── Header ── */}
        <motion.div {...fadeInView} className="mb-12">
          <h2 className="text-[32px] font-bold text-white tracking-tight leading-tight">
            Research
          </h2>
          <p className="text-[15px] text-white/35 mt-2 max-w-lg">
            26 papers across 18 institutions powering the Aegis thesis
          </p>
        </motion.div>

        {/* ── Stats Row ── */}
        <motion.div
          {...fadeInView}
          className="flex items-center gap-8 sm:gap-12 mb-12 pb-8 border-b border-white/[0.06]"
        >
          {[
            { value: "26", label: "Papers" },
            { value: "18", label: "Institutions" },
            { value: "6", label: "Domains" },
          ].map((stat) => (
            <div key={stat.label}>
              <span className="text-[28px] font-bold text-white tracking-tight">
                {stat.value}
              </span>
              <span className="text-[13px] text-white/30 ml-2">
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* ── Filter Tabs ── */}
        <motion.div
          {...fadeInView}
          className="flex flex-wrap gap-2 mb-10"
        >
          {DOMAINS.map((domain) => (
            <button
              key={domain}
              onClick={() => setActiveDomain(domain)}
              className={`px-4 py-2 text-[13px] font-medium rounded-[6px] border transition-all duration-200 cursor-pointer ${
                activeDomain === domain
                  ? "bg-white/[0.08] border-white/[0.15] text-white/90"
                  : "bg-transparent border-white/[0.06] text-white/30 hover:text-white/50 hover:border-white/[0.10]"
              }`}
            >
              {domain}
              {domain !== "All" && (
                <span className="ml-1.5 text-[11px] text-white/20">
                  {DOMAIN_COUNTS[domain]}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* ── Paper Grid ── */}
        <motion.div
          key={activeDomain}
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {filtered.map((paper) => (
            <PaperCard key={paper.id} paper={paper} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
