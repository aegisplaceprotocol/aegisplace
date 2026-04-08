import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { T } from "./theme";
import { PageHeader, Card, CardHead, FilterChips, ActionButton, StatusBadge, StatTile } from "./primitives";

type Domain = "All" | "Trust & quality" | "Agent Safety" | "Payment Protocols" | "Solana" | "NVIDIA";

interface Paper {
  id: number;
  title: string;
  authors: string;
  abstract: string;
  tags: string[];
  relevance: number;
  date: string;
  link: string;
  domain: Domain;
}

const PAPERS: Paper[] = [
  {
    id: 1,
    title: "Computational Trust in Multi-Agent Systems",
    authors: "Piotr Zielinski, MIT CSAIL",
    abstract: "Formalizes computational approaches to trust evaluation in distributed systems. Develops mathematical models for quantifying trustworthiness based on observable behavior, establishing foundations for automated trust assessment. Addresses the cold-start problem, trust propagation across networks, and the integration of multiple evidence sources into coherent quality scores. Directly applicable to on-chain quality systems for autonomous agent marketplaces.",
    tags: ["Trust Systems", "Multi-Agent", "quality"],
    relevance: 96,
    date: "2006",
    link: "https://groups.csail.mit.edu/medg/people/psz/home/",
    domain: "Trust & quality",
  },
  {
    id: 2,
    title: "quality systems for Online Marketplaces",
    authors: "Resnick, Zeckhauser, Swanson, Lockwood",
    abstract: "Seminal paper on the design principles of quality systems for online marketplaces. Analyzes feedback mechanisms, strategic manipulation, and the conditions under which quality systems produce reliable signals. Identifies key challenges including name-changing attacks, ballot stuffing, and the tension between privacy and accountability that remain central to modern agent quality design.",
    tags: ["quality", "Marketplace", "Trust Systems"],
    relevance: 94,
    date: "2000",
    link: "https://doi.org/10.1145/355112.355122",
    domain: "Trust & quality",
  },
  {
    id: 3,
    title: "NeMo Guardrails: Controllable and Safe LLM Applications",
    authors: "Rebedea, Dinu, Sreedhar, Parisien, Cohen (NVIDIA)",
    abstract: "Introduces NeMo Guardrails, an open-source toolkit for adding programmable safety constraints to LLM-powered applications. Presents the Colang modeling language for defining conversational guardrails, content moderation flows, and topical boundaries. Demonstrates that safety constraints can be applied at the infrastructure level without modifying underlying models, enabling protocol-level safety guarantees for autonomous operators.",
    tags: ["NVIDIA", "Safety", "Guardrails"],
    relevance: 97,
    date: "2023",
    link: "https://doi.org/10.18653/v1/2023.emnlp-demo.40",
    domain: "NVIDIA",
  },
  {
    id: 4,
    title: "Constitutional AI: Harmlessness from AI Feedback",
    authors: "Bai, Kadavath, Kundu et al. (Anthropic)",
    abstract: "Proposes a method for training AI systems to be helpful, harmless, and honest using AI-generated feedback guided by a set of principles (a constitution). Demonstrates that self-supervision against explicit principles can reduce harmful outputs while maintaining helpfulness, establishing a scalable approach to alignment that informs runtime safety check design for agent marketplaces.",
    tags: ["AI Safety", "Alignment", "Constitutional AI"],
    relevance: 91,
    date: "2022",
    link: "https://arxiv.org/abs/2212.08073",
    domain: "Agent Safety",
  },
  {
    id: 5,
    title: "x402: HTTP Payment Protocol for Machine-to-Machine Commerce",
    authors: "Coinbase, Cloudflare",
    abstract: "Defines the x402 protocol for native HTTP payments, enabling machines to pay for API access using the HTTP 402 Payment Required status code. Specifies payment negotiation, verification, and settlement flows that allow agents to autonomously purchase services. Establishes the payment primitive for agent-to-agent economic transactions without human intermediation.",
    tags: ["Payments", "x402", "HTTP"],
    relevance: 98,
    date: "2025",
    link: "https://www.x402.org/",
    domain: "Payment Protocols",
  },
  {
    id: 6,
    title: "Solana: A New Architecture for High Performance Blockchain",
    authors: "Anatoly Yakovenko",
    abstract: "Introduces Proof of History, a cryptographic clock that enables high-throughput consensus without the coordination overhead of traditional BFT protocols. Achieves sub-second finality and theoretical throughput of 710,000 transactions per second. The low-latency, low-cost settlement layer is essential for micropayment-based agent economies where transaction costs must be negligible.",
    tags: ["Solana", "Blockchain", "Infrastructure"],
    relevance: 93,
    date: "2018",
    link: "https://solana.com/solana-whitepaper.pdf",
    domain: "Solana",
  },
  {
    id: 7,
    title: "Generative Agents: Interactive Simulacra of Human Behavior",
    authors: "Park, O'Brien, Cai, Morris, Liang, Bernstein (Stanford)",
    abstract: "Demonstrates that LLM-powered agents with memory, reflection, and planning can exhibit believable individual and emergent social behaviors in a simulated environment. Twenty-five agents autonomously form relationships, coordinate activities, and spread information. Establishes that current language models are sufficient substrates for autonomous agents requiring no human intervention.",
    tags: ["Multi-Agent", "Simulation", "Stanford"],
    relevance: 89,
    date: "2023",
    link: "https://arxiv.org/abs/2304.03442",
    domain: "Agent Safety",
  },
  {
    id: 8,
    title: "Liberal Radicalism: Flexible Design for Philanthropic Matching Funds",
    authors: "Buterin, Hitzig, Weyl",
    abstract: "Proposes quadratic funding, a mechanism where matching funds are allocated proportionally to the square of the sum of square roots of individual contributions. Proves this achieves optimal public goods provision under broad conditions. The mechanism directly informs incentive design for decentralized validation networks where collective funding of infrastructure must be efficient and democratic.",
    tags: ["Mechanism Design", "Quadratic Funding", "Incentives"],
    relevance: 86,
    date: "2018",
    link: "https://arxiv.org/abs/1809.06421",
    domain: "Payment Protocols",
  },
];

const DOMAIN_OPTIONS: { id: Domain; label: string }[] = [
  { id: "All", label: "All" },
  { id: "Trust & quality", label: "Trust & quality" },
  { id: "Agent Safety", label: "Agent Safety" },
  { id: "Payment Protocols", label: "Payment Protocols" },
  { id: "Solana", label: "Solana" },
  { id: "NVIDIA", label: "NVIDIA" },
];

const COLLECTION_IDS = [1, 3, 5];
const TRENDING_IDS = [3, 5, 7];

function relevanceColor(r: number): string {
  if (r >= 95) return T.positive;
  if (r >= 90) return T.text50;
  if (r >= 85) return T.text50;
  return T.text50;
}

export default function ResearchPanel() {
  const stats = trpc.stats.overview.useQuery(undefined, { staleTime: 60_000 });
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState<Domain>("All");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [collection, setCollection] = useState<Set<number>>(new Set(COLLECTION_IDS));

  const filtered = useMemo(() => {
    let results = PAPERS;
    if (domain !== "All") results = results.filter((p) => p.domain === domain);
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authors.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return results;
  }, [domain, search]);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCollection = (id: number) => {
    setCollection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const collectionPapers = PAPERS.filter((p) => collection.has(p.id));
  const trendingPapers = PAPERS.filter((p) => TRENDING_IDS.includes(p.id));

  return (
    <div>
      <PageHeader
        title="Research Library"
        subtitle="Academic papers and whitepapers relevant to Aegis"
      />

      {/* Protocol Metrics */}
      {stats.data && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}>
          <StatTile label="Protocol Operators" value={stats.data.totalOperators.toLocaleString()} accent={T.positive} />
          <StatTile label="Total Invocations" value={stats.data.totalInvocations.toLocaleString()} accent={T.text50} />
          <StatTile label="Active Validators" value={stats.data.totalValidators.toLocaleString()} accent={T.text50} />
        </div>
      )}

      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
        >
          <circle cx="7" cy="7" r="5" stroke={T.text25} strokeWidth="1.5" />
          <line x1="11" y1="11" x2="14" y2="14" stroke={T.text25} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search papers, authors, tags..."
          style={{
            width: "100%",
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            color: T.text80,
            padding: "10px 12px 10px 36px",
            fontSize: 13,
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Filter chips */}
      <div style={{ marginBottom: 24 }}>
        <FilterChips options={DOMAIN_OPTIONS} active={domain} onChange={setDomain} />
      </div>

      {/* Paper list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((paper) => {
          const isExpanded = expanded.has(paper.id);
          const inCollection = collection.has(paper.id);

          return (
            <Card key={paper.id}>
              <div style={{ padding: "18px 20px" }}>
                {/* Title row */}
                <div
                  style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, cursor: "pointer" }}
                  onClick={() => toggleExpand(paper.id)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: T.text80, lineHeight: 1.35, marginBottom: 4 }}>
                      {paper.title}
                    </div>
                    <div style={{ fontSize: 12, color: T.text30, marginBottom: 6 }}>
                      {paper.authors}
                    </div>

                    {/* Abstract preview (2 lines) */}
                    {!isExpanded && (
                      <div
                        style={{
                          fontSize: 12,
                          color: T.text25,
                          lineHeight: 1.6,
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {paper.abstract}
                      </div>
                    )}
                  </div>

                  {/* Relevance score */}
                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 400, color: relevanceColor(paper.relevance), fontVariantNumeric: "tabular-nums" }}>
                      {paper.relevance}%
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 500, color: T.text20, letterSpacing: "0.02em" }}>RELEVANT</div>
                  </div>
                </div>

                {/* Expanded abstract */}
                {isExpanded && (
                  <div style={{ fontSize: 13, color: T.text50, lineHeight: 1.7, marginTop: 8, marginBottom: 12 }}>
                    {paper.abstract}
                  </div>
                )}

                {/* Tags + date + actions row */}
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  {paper.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: T.text30,
                        background: T.white4,
                        padding: "2px 8px",
                        borderRadius: 3,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {tag}
                    </span>
                  ))}

                  <span style={{ fontSize: 11, color: T.text20, marginLeft: "auto" }}>
                    {paper.date}
                  </span>

                  <a
                    href={paper.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: T.text50,
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    Read Paper
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1 9L9 1M9 1H4M9 1V6" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  </a>

                  <button
                    onClick={(e) => { e.stopPropagation(); toggleCollection(paper.id); }}
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: inCollection ? T.text50 : T.text30,
                      background: inCollection ? `${T.text50}18` : "transparent",
                      border: `1px solid ${inCollection ? `${T.text50}40` : T.border}`,
                      borderRadius: 4,
                      padding: "3px 8px",
                      cursor: "pointer",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {inCollection ? "In Collection" : "Add to Collection"}
                  </button>
                </div>
              </div>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: T.text25, fontSize: 13 }}>
            No papers match your search criteria.
          </div>
        )}
      </div>

      {/* ─── Collections section ─── */}
      <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {/* My Collection */}
        <Card>
          <CardHead label="My Collection" action={
            <span style={{ fontSize: 10, color: T.text20 }}>{collectionPapers.length} papers</span>
          } />
          <div style={{ padding: "4px 0" }}>
            {collectionPapers.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: T.text20 }}>
                No papers in collection yet.
              </div>
            ) : (
              collectionPapers.map((paper, i) => (
                <div
                  key={paper.id}
                  style={{
                    padding: "10px 20px",
                    borderBottom: i < collectionPapers.length - 1 ? `1px solid ${T.border}` : undefined,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text50, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {paper.title}
                    </div>
                    <div style={{ fontSize: 10, color: T.text20, marginTop: 2 }}>{paper.authors}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: relevanceColor(paper.relevance), flexShrink: 0, marginLeft: 8 }}>
                    {paper.relevance}%
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Trending This Week */}
        <Card>
          <CardHead label="Trending This Week" action={
            <StatusBadge status="Popular" color="amber" />
          } />
          <div style={{ padding: "4px 0" }}>
            {trendingPapers.map((paper, i) => (
              <div
                key={paper.id}
                style={{
                  padding: "10px 20px",
                  borderBottom: i < trendingPapers.length - 1 ? `1px solid ${T.border}` : undefined,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: i === 0 ? T.text50 : T.text30,
                    width: 18,
                    flexShrink: 0,
                  }}>
                    #{i + 1}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text50, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {paper.title}
                    </div>
                    <div style={{ fontSize: 10, color: T.text20, marginTop: 2 }}>{paper.date}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: relevanceColor(paper.relevance), flexShrink: 0, marginLeft: 8 }}>
                  {paper.relevance}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
