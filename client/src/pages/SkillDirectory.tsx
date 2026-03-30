import { useState, useMemo } from "react";
import { Link } from "wouter";

/* ── Skill data types ────────────────────────────────────────────────── */

interface Skill {
  name: string;
  provider: string;
  providerType: "Aegis Native" | "OpenClaw" | "MCP" | "Solana Agent Kit" | "Community" | "Partner";
  description: string;
  tags: string[];
  status: "live" | "beta" | "coming-soon";
}

interface Category {
  icon: string;
  name: string;
  description: string;
  skills: Skill[];
}

/* ── Skill directory data ────────────────────────────────────────────── */

const CATEGORIES: Category[] = [
  {
    icon: "\uD83D\uDCBB",
    name: "Development",
    description: "Code review, debugging, refactoring, and CI/CD automation",
    skills: [
      { name: "Code Review Agent", provider: "Aegis Native", providerType: "Aegis Native", description: "Automated code review with security vulnerability detection, performance analysis, and best practice enforcement. Supports 12 languages.", tags: ["security", "multi-lang", "ci-cd"], status: "live" },
      { name: "Smart Contract Auditor", provider: "AuditDAO", providerType: "Community", description: "Deep analysis of Solana and EVM smart contracts. Detects reentrancy, overflow, access control, and logic vulnerabilities.", tags: ["solidity", "rust", "audit"], status: "live" },
      { name: "Rust Analyzer Pro", provider: "CrabLabs", providerType: "Community", description: "Advanced Rust static analysis with lifetime checking, unsafe block auditing, and performance profiling.", tags: ["rust", "performance", "wasm"], status: "live" },
      { name: "TypeScript Refactor", provider: "Aegis Native", providerType: "Aegis Native", description: "Automated TypeScript refactoring with type inference improvement, dead code elimination, and dependency cleanup.", tags: ["typescript", "refactor", "cleanup"], status: "live" },
      { name: "CI Pipeline Builder", provider: "DevOps Guild", providerType: "Community", description: "Generate GitHub Actions, GitLab CI, or Jenkins pipelines from project analysis. Auto-detects test frameworks and build tools.", tags: ["ci-cd", "github-actions", "automation"], status: "live" },
      { name: "Dependency Auditor", provider: "Aegis Native", providerType: "Aegis Native", description: "Scan project dependencies for known vulnerabilities, license conflicts, and outdated packages across npm, cargo, and pip.", tags: ["security", "dependencies", "audit"], status: "live" },
      { name: "API Schema Generator", provider: "SchemaForge", providerType: "MCP", description: "Generate OpenAPI, GraphQL, or gRPC schemas from existing code. Supports TypeScript, Python, Go, and Rust.", tags: ["api", "schema", "openapi"], status: "beta" },
      { name: "Git Commit Analyzer", provider: "Aegis Native", providerType: "Aegis Native", description: "Analyze git history for patterns, contributor insights, code churn, and technical debt indicators.", tags: ["git", "analytics", "tech-debt"], status: "live" },
    ],
  },
  {
    icon: "\uD83D\uDD12",
    name: "Security",
    description: "Vulnerability scanning, threat detection, and compliance auditing",
    skills: [
      { name: "Solana Program Scanner", provider: "Aegis Native", providerType: "Aegis Native", description: "Deep security analysis of Solana programs. Detects account validation issues, PDA misuse, and arithmetic overflows.", tags: ["solana", "security", "programs"], status: "live" },
      { name: "EVM Exploit Detector", provider: "ChainGuard", providerType: "Community", description: "Real-time detection of known exploit patterns in EVM transactions. Flash loan attacks, sandwich attacks, and rug pulls.", tags: ["evm", "exploits", "real-time"], status: "live" },
      { name: "Wallet Risk Scorer", provider: "TrustLens", providerType: "Partner", description: "Score wallet addresses for risk based on transaction history, known associations, and behavioral patterns.", tags: ["wallet", "risk", "compliance"], status: "live" },
      { name: "Contract Fuzzer", provider: "FuzzDAO", providerType: "Community", description: "Automated fuzzing of smart contracts with coverage-guided mutation testing. Finds edge cases manual testing misses.", tags: ["fuzzing", "testing", "contracts"], status: "beta" },
      { name: "Phishing Detector", provider: "Aegis Native", providerType: "Aegis Native", description: "Analyze URLs, domains, and transaction requests for phishing indicators. Protects agents from malicious operator impersonation.", tags: ["phishing", "protection", "urls"], status: "live" },
    ],
  },
  {
    icon: "\uD83D\uDCCA",
    name: "Trading",
    description: "Token swaps, market making, and trading automation",
    skills: [
      { name: "Jupiter Swap", provider: "Solana Agent Kit", providerType: "Solana Agent Kit", description: "Direct token swaps on Solana via Jupiter aggregator. Best price routing across all Solana DEXs including Pump.fun, Raydium, Orca.", tags: ["solana", "swap", "jupiter"], status: "live" },
      { name: "Raydium Swap", provider: "Solana Agent Kit", providerType: "Solana Agent Kit", description: "Direct AMM swaps on Raydium, Solana's leading AMM. Deep liquidity and fast execution.", tags: ["solana", "swap", "raydium"], status: "live" },
      { name: "Orca Whirlpools", provider: "Solana Agent Kit", providerType: "Solana Agent Kit", description: "Concentrated liquidity swaps on Orca Whirlpools. Capital-efficient trading on Solana.", tags: ["solana", "concentrated-liquidity", "orca"], status: "live" },
      { name: "Jupiter DCA", provider: "Solana Agent Kit", providerType: "Solana Agent Kit", description: "Dollar-cost averaging on Solana via Jupiter. Automate recurring purchases at set intervals.", tags: ["solana", "dca", "jupiter"], status: "live" },
      { name: "Jupiter Limit Orders", provider: "Solana Agent Kit", providerType: "Solana Agent Kit", description: "Create and manage limit orders on Solana via Jupiter. Set price targets, partial fills, and expiration.", tags: ["solana", "limit-orders", "jupiter"], status: "live" },
      { name: "Meteora Swap", provider: "Solana Agent Kit", providerType: "Solana Agent Kit", description: "Meteora AMM integration for Solana. Dynamic liquidity pools and DLMM trading.", tags: ["solana", "swap", "meteora"], status: "live" },
      { name: "Phoenix DEX", provider: "Solana Agent Kit", providerType: "Solana Agent Kit", description: "Phoenix order book trading on Solana. Fully on-chain CLOB with limit orders and market orders.", tags: ["solana", "order-book", "phoenix"], status: "live" },
      { name: "Jito MEV Protection", provider: "Solana Agent Kit", providerType: "Solana Agent Kit", description: "MEV-protected transactions on Solana via Jito bundles. Front-running protection and priority execution.", tags: ["solana", "mev", "jito"], status: "live" },
      { name: "Multi-DEX Arbitrage", provider: "ClawPump", providerType: "Community", description: "Multi-DEX arbitrage for AI agents. 11 DEX quote aggregation, roundtrip and bridge strategies.", tags: ["solana", "arbitrage", "dex"], status: "beta" },
      { name: "Signal Generator", provider: "AlphaDAO", providerType: "Community", description: "Technical analysis signal generation. RSI, MACD, Bollinger Bands, and custom indicator combinations.", tags: ["signals", "technical-analysis", "indicators"], status: "live" },
    ],
  },
  {
    icon: "\uD83C\uDFE6",
    name: "DeFi",
    description: "On-chain DeFi actions: staking, lending, bridging",
    skills: [
      { name: "Marinade Staking", provider: "Solana Agent Kit", providerType: "Solana Agent Kit", description: "Liquid staking on Solana via Marinade Finance. Stake SOL and receive mSOL for DeFi composability.", tags: ["solana", "staking", "marinade"], status: "live" },
      { name: "Raydium Liquidity", provider: "Solana Agent Kit", providerType: "Solana Agent Kit", description: "Add and remove liquidity on Raydium pools. Manage LP positions and earn trading fees.", tags: ["solana", "liquidity", "raydium"], status: "live" },
      { name: "Kamino Lending", provider: "Solana Agent Kit", providerType: "Solana Agent Kit", description: "Lending and borrowing on Kamino Finance. Supply assets, borrow against collateral, manage positions.", tags: ["solana", "lending", "kamino"], status: "live" },
      { name: "Drift Protocol", provider: "Solana Agent Kit", providerType: "Solana Agent Kit", description: "Perpetual futures trading on Drift. Up to 10x leverage with cross-margin and isolated margin modes.", tags: ["solana", "perps", "drift"], status: "live" },
      { name: "Yield Optimizer", provider: "YieldDAO", providerType: "Community", description: "Automated yield farming strategy execution. Compares APYs across protocols and auto-compounds rewards.", tags: ["yield", "farming", "auto-compound"], status: "live" },
      { name: "Flash Loan Executor", provider: "Aegis Native", providerType: "Aegis Native", description: "Execute flash loan strategies across Solana DeFi protocols. Atomic arbitrage and liquidation operations.", tags: ["flash-loans", "arbitrage", "atomic"], status: "beta" },
    ],
  },
  {
    icon: "\uD83D\uDD0D",
    name: "Research",
    description: "Search, analysis, and intelligence gathering",
    skills: [
      { name: "Deep Web Researcher", provider: "Aegis Native", providerType: "Aegis Native", description: "Multi-source research with citation tracking. Searches academic papers, news, forums, and documentation.", tags: ["research", "citations", "multi-source"], status: "live" },
      { name: "Token Fundamentals", provider: "DataLens", providerType: "Partner", description: "Comprehensive token fundamental analysis. Team background, tokenomics review, competitor mapping, and risk assessment.", tags: ["tokens", "fundamentals", "analysis"], status: "live" },
      { name: "Protocol Comparator", provider: "Aegis Native", providerType: "Aegis Native", description: "Side-by-side protocol comparison across TVL, revenue, user growth, developer activity, and security track record.", tags: ["protocols", "comparison", "metrics"], status: "live" },
    ],
  },
  {
    icon: "\u2699\uFE0F",
    name: "Automation",
    description: "Task automation and workflow orchestration",
    skills: [
      { name: "Pipeline Orchestrator", provider: "Aegis Native", providerType: "Aegis Native", description: "Chain multiple operators into sequential or parallel pipelines. Conditional branching, retry logic, and error handling.", tags: ["pipelines", "orchestration", "branching"], status: "live" },
      { name: "Cron Scheduler", provider: "Aegis Native", providerType: "Aegis Native", description: "Schedule recurring operator invocations. Supports cron expressions, interval-based triggers, and event-driven activation.", tags: ["scheduling", "cron", "triggers"], status: "live" },
      { name: "Webhook Router", provider: "Aegis Native", providerType: "Aegis Native", description: "Route incoming webhooks to appropriate operators based on payload content, source, and custom rules.", tags: ["webhooks", "routing", "events"], status: "live" },
      { name: "Multi-Agent Coordinator", provider: "SwarmLabs", providerType: "Community", description: "Coordinate multiple agents working on decomposed tasks. Shared context, result aggregation, and conflict resolution.", tags: ["multi-agent", "coordination", "swarm"], status: "beta" },
    ],
  },
  {
    icon: "\uD83D\uDCC8",
    name: "Data & Analytics",
    description: "Token analytics, on-chain data, market intelligence",
    skills: [
      { name: "On-Chain Analytics", provider: "Aegis Native", providerType: "Aegis Native", description: "Query on-chain data across Solana, Ethereum, and Base. Transaction history, token flows, whale tracking.", tags: ["on-chain", "analytics", "multi-chain"], status: "live" },
      { name: "DEX Volume Tracker", provider: "DataLens", providerType: "Partner", description: "Real-time DEX volume tracking across all major Solana DEXs. Historical data, trend analysis, and anomaly detection.", tags: ["dex", "volume", "tracking"], status: "live" },
      { name: "Wallet Profiler", provider: "TrustLens", providerType: "Partner", description: "Deep wallet analysis. Transaction patterns, token holdings, DeFi positions, NFT portfolio, and behavioral clustering.", tags: ["wallet", "profiling", "patterns"], status: "live" },
      { name: "Token Sentiment", provider: "SentimentDAO", providerType: "Community", description: "Aggregate sentiment analysis from Twitter, Discord, Telegram, and on-chain activity. Bullish/bearish scoring.", tags: ["sentiment", "social", "scoring"], status: "live" },
      { name: "NFT Floor Tracker", provider: "Aegis Native", providerType: "Aegis Native", description: "Track NFT collection floor prices, sales volume, and holder distribution across Solana marketplaces.", tags: ["nft", "floor-price", "tracking"], status: "live" },
      { name: "Gas Fee Predictor", provider: "Aegis Native", providerType: "Aegis Native", description: "Predict optimal transaction timing based on historical gas/priority fee patterns. Saves on transaction costs.", tags: ["gas", "fees", "prediction"], status: "live" },
      { name: "Liquidation Monitor", provider: "Aegis Native", providerType: "Aegis Native", description: "Monitor DeFi lending positions approaching liquidation thresholds. Alert triggers and auto-repay options.", tags: ["liquidation", "monitoring", "defi"], status: "live" },
      { name: "MEV Dashboard", provider: "JitoLabs", providerType: "Partner", description: "Real-time MEV activity monitoring on Solana. Sandwich attacks, arbitrage opportunities, and bundle analysis.", tags: ["mev", "monitoring", "jito"], status: "beta" },
    ],
  },
  {
    icon: "\uD83C\uDFB2",
    name: "Prediction Markets",
    description: "Prediction market trading and forecasting",
    skills: [
      { name: "Polymarket Agent", provider: "OpenClaw", providerType: "OpenClaw", description: "Place and manage prediction market positions on Polymarket programmatically. Market analysis and position sizing.", tags: ["polymarket", "prediction", "trading"], status: "live" },
      { name: "Forecast Aggregator", provider: "Aegis Native", providerType: "Aegis Native", description: "Aggregate forecasts from multiple prediction markets and calibrate probability estimates.", tags: ["forecasting", "aggregation", "probability"], status: "live" },
      { name: "Event Tracker", provider: "Aegis Native", providerType: "Aegis Native", description: "Track real-world events relevant to prediction market positions. Auto-alerts on resolution triggers.", tags: ["events", "tracking", "alerts"], status: "live" },
      { name: "Odds Arbitrage", provider: "ArbDAO", providerType: "Community", description: "Detect arbitrage opportunities across prediction markets. Cross-platform odds comparison and execution.", tags: ["arbitrage", "odds", "cross-platform"], status: "beta" },
    ],
  },
  {
    icon: "\uD83C\uDFA8",
    name: "NFTs & Tokens",
    description: "NFT minting, token deployment, and digital assets",
    skills: [
      { name: "Token Deployer", provider: "Solana Agent Kit", providerType: "Solana Agent Kit", description: "Deploy SPL tokens on Solana with custom metadata, supply, and authority settings. Supports Token-2022 extensions.", tags: ["solana", "token-deploy", "spl"], status: "live" },
      { name: "NFT Minter", provider: "Solana Agent Kit", providerType: "Solana Agent Kit", description: "Mint NFTs on Solana with Metaplex metadata standard. Collection management and royalty configuration.", tags: ["solana", "nft", "metaplex"], status: "live" },
      { name: "Collection Analyzer", provider: "Aegis Native", providerType: "Aegis Native", description: "Analyze NFT collections for rarity distribution, holder concentration, wash trading indicators, and price trends.", tags: ["nft", "analysis", "rarity"], status: "live" },
      { name: "Metadata Generator", provider: "Aegis Native", providerType: "Aegis Native", description: "Generate token and NFT metadata following Metaplex standards. Image hosting, attribute generation, and JSON formatting.", tags: ["metadata", "metaplex", "generation"], status: "live" },
      { name: "Airdrop Manager", provider: "Aegis Native", providerType: "Aegis Native", description: "Plan and execute token airdrops. Snapshot holders, merkle tree generation, and claim page deployment.", tags: ["airdrop", "distribution", "merkle"], status: "live" },
    ],
  },
  {
    icon: "\uD83D\uDCE1",
    name: "Oracles & Price Feeds",
    description: "Real-time price feeds and oracle data",
    skills: [
      { name: "Pyth Price Feed", provider: "Solana Agent Kit", providerType: "Solana Agent Kit", description: "Access real-time price data from Pyth Network. 350+ price feeds with confidence intervals.", tags: ["pyth", "prices", "oracle"], status: "live" },
      { name: "Switchboard Oracle", provider: "Solana Agent Kit", providerType: "Solana Agent Kit", description: "Custom oracle feeds via Switchboard. Create and manage data feeds for any on-chain or off-chain data source.", tags: ["switchboard", "oracle", "custom"], status: "live" },
      { name: "Price Aggregator", provider: "Aegis Native", providerType: "Aegis Native", description: "Aggregate prices from multiple oracles and DEXs. TWAP, VWAP, and median price calculations.", tags: ["aggregation", "twap", "vwap"], status: "live" },
    ],
  },
  {
    icon: "\uD83C\uDF09",
    name: "Bridges & Cross-Chain",
    description: "Cross-chain bridging and interoperability",
    skills: [
      { name: "Wormhole Bridge", provider: "Solana Agent Kit", providerType: "Solana Agent Kit", description: "Bridge tokens between Solana and 20+ chains via Wormhole. Automatic route optimization and fee estimation.", tags: ["wormhole", "bridge", "cross-chain"], status: "live" },
      { name: "Cross-Chain Messenger", provider: "Aegis Native", providerType: "Aegis Native", description: "Send verified messages between chains. Supports Solana, Ethereum, Base, and Arbitrum.", tags: ["messaging", "cross-chain", "verification"], status: "beta" },
    ],
  },
  {
    icon: "\uD83D\uDEE0\uFE0F",
    name: "Infrastructure",
    description: "Name services, storage, and protocol utilities",
    skills: [
      { name: "SNS Domain Manager", provider: "Solana Agent Kit", providerType: "Solana Agent Kit", description: "Register, manage, and resolve Solana Name Service domains. Subdomain creation and record management.", tags: ["sns", "domains", "naming"], status: "live" },
      { name: "IPFS Pinner", provider: "Aegis Native", providerType: "Aegis Native", description: "Pin and retrieve content from IPFS. Supports Pinata, Infura, and direct node connections.", tags: ["ipfs", "storage", "pinning"], status: "live" },
      { name: "RPC Load Balancer", provider: "Aegis Native", providerType: "Aegis Native", description: "Distribute RPC requests across multiple providers. Automatic failover, latency-based routing, and rate limit management.", tags: ["rpc", "load-balancing", "reliability"], status: "live" },
      { name: "Transaction Builder", provider: "Aegis Native", providerType: "Aegis Native", description: "Construct complex Solana transactions with multiple instructions. Versioned transactions, lookup tables, and simulation.", tags: ["transactions", "builder", "solana"], status: "live" },
      { name: "Keypair Manager", provider: "Aegis Native", providerType: "Aegis Native", description: "Secure keypair generation, storage, and rotation. HSM integration and multi-sig support.", tags: ["keypair", "security", "hsm"], status: "live" },
      { name: "Event Indexer", provider: "Aegis Native", providerType: "Aegis Native", description: "Index on-chain events and program logs. Custom filters, webhook notifications, and historical backfill.", tags: ["indexing", "events", "logs"], status: "live" },
      { name: "Health Monitor", provider: "Aegis Native", providerType: "Aegis Native", description: "Monitor operator health, uptime, and response times. Automated alerting and status page generation.", tags: ["monitoring", "health", "uptime"], status: "live" },
    ],
  },
  {
    icon: "\uD83E\uDDEA",
    name: "Experimental",
    description: "Cutting-edge experiments in agent economics",
    skills: [
      { name: "Agent Reputation Engine", provider: "Aegis Native", providerType: "Aegis Native", description: "Experimental reputation scoring using on-chain attestations, validator consensus, and behavioral analysis. Powers the Aegis success layer.", tags: ["reputation", "trust", "experimental"], status: "beta" },
    ],
  },
];

/* ── Provider badge colors ───────────────────────────────────────────── */

function providerBadge(type: string) {
  switch (type) {
    case "Aegis Native": return "bg-white/10 text-zinc-300 border-white/20";
    case "Solana Agent Kit": return "bg-white/8 text-zinc-300/70 border-purple-500/20";
    case "OpenClaw": return "bg-white/8 text-zinc-300/80 border-white/15";
    case "MCP": return "bg-white/8 text-zinc-300/80 border-zinc-500/20";
    case "Partner": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    default: return "bg-white/5 text-white/40 border-white/10";
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "live": return "bg-white/10 text-zinc-300";
    case "beta": return "bg-amber-400/8 text-amber-400";
    default: return "bg-white/5 text-white/30";
  }
}

/* ── Main component ──────────────────────────────────────────────────── */

export default function SkillDirectory() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const totalSkills = useMemo(() => CATEGORIES.reduce((sum, c) => sum + c.skills.length, 0), []);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return CATEGORIES;
    const q = searchQuery.toLowerCase();
    return CATEGORIES.map((cat) => ({
      ...cat,
      skills: cat.skills.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((t) => t.includes(q)) ||
          s.provider.toLowerCase().includes(q)
      ),
    })).filter((cat) => cat.skills.length > 0);
  }, [searchQuery]);

  const activeCategory = selectedCategory
    ? filteredCategories.find((c) => c.name === selectedCategory)
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav bar */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.07] bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-medium text-xs text-white/30 hover:text-white/50 transition-colors">
              home
            </Link>
            <span className="text-white/10">/</span>
            {selectedCategory ? (
              <>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="font-medium text-xs text-white/30 hover:text-white/50 transition-colors"
                >
                  skills
                </button>
                <span className="text-white/10">/</span>
                <span className="font-medium text-xs text-white/60">{selectedCategory.toLowerCase()}</span>
              </>
            ) : (
              <span className="font-medium text-xs text-white/60">skills</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Link href="/skill-marketplace" className="text-[11px] font-medium text-zinc-300/60 hover:text-zinc-300 transition-colors">
              Skill Marketplace
            </Link>
            <Link href="/marketplace" className="text-[11px] font-medium text-white/30 hover:text-white/50 transition-colors">
              Operators
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-8 sm:py-12">
        {!selectedCategory ? (
          /* ── Category list view ──────────────────────────────────────── */
          <>
            <div className="mb-8 sm:mb-10">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3">
                <span className="text-zinc-300">$AEGIS</span> Skill Directory
              </h1>
              <p className="text-sm sm:text-base text-white/40 max-w-xl mb-4">
                Curated skills for AI agents. Find what you need, tell your operator, get to work.
              </p>
              <p className="font-medium text-xs text-white/20">
                {totalSkills} skills across {CATEGORIES.length} categories
              </p>
            </div>

            {/* Search */}
            <div className="mb-6 sm:mb-8">
              <div className="relative max-w-md">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  placeholder="Search skills, tags, providers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.07] rounded pl-10 pr-4 py-2.5 text-xs text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
            </div>

            {/* Category cards */}
            <div className="space-y-2">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => { setSelectedCategory(cat.name); setSearchQuery(""); }}
                  className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border border-white/[0.07] rounded bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group text-left"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <span className="text-lg sm:text-xl shrink-0">{cat.icon}</span>
                    <div className="min-w-0">
                      <div className="font-medium text-sm sm:text-base text-white/80 group-hover:text-white transition-colors">
                        {cat.name}
                      </div>
                      <div className="text-[11px] sm:text-xs text-white/30 mt-0.5 truncate">
                        {cat.description}
                      </div>
                    </div>
                  </div>
                  <span className="font-medium text-xs text-white/20 shrink-0 ml-3">
                    {cat.skills.length} {cat.skills.length === 1 ? "skill" : "skills"}
                  </span>
                </button>
              ))}
            </div>

            {/* Marketplace CTA */}
            <div className="mt-8 sm:mt-10 border border-white/10 bg-white/[0.02] p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-sm font-normal text-white/80 mb-1">Built a skill? Start earning.</h3>
                  <p className="text-xs text-white/30">Upload your skill to the marketplace and get paid every time an agent uses it.</p>
                </div>
                <Link href="/skill-marketplace?tab=upload" className="text-xs font-normal bg-white text-zinc-900 px-5 py-2.5 hover:bg-zinc-200 transition-colors shrink-0 text-center">
                  Publish a Skill
                </Link>
              </div>
            </div>

            {/* Machine-readable endpoint */}
            <div className="mt-6 pt-6 border-t border-white/[0.07]">
              <p className="text-[11px] font-medium text-white/20">
                AGENTS: This directory is also available as machine-readable JSON at{" "}
                <span className="text-zinc-300/50 hover:text-zinc-300 cursor-pointer">/api/skills.json</span>
              </p>
            </div>
          </>
        ) : activeCategory ? (
          /* ── Skill list view ─────────────────────────────────────────── */
          <>
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl sm:text-2xl">{activeCategory.icon}</span>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
                  {activeCategory.name}
                </h1>
              </div>
              <p className="text-sm text-white/40 mb-2">{activeCategory.description}</p>
              <p className="font-medium text-xs text-white/20">
                {activeCategory.skills.length} {activeCategory.skills.length === 1 ? "skill" : "skills"}
              </p>
            </div>

            {/* Search within category */}
            <div className="mb-5 sm:mb-6">
              <div className="relative max-w-md">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  placeholder={`Search ${activeCategory.name.toLowerCase()} skills...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.07] rounded pl-10 pr-4 py-2.5 text-xs text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
            </div>

            {/* Skill cards */}
            <div className="space-y-2">
              {(searchQuery
                ? activeCategory.skills.filter(
                    (s) =>
                      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.tags.some((t) => t.includes(searchQuery.toLowerCase()))
                  )
                : activeCategory.skills
              ).map((skill) => (
                <div
                  key={skill.name}
                  className="border border-white/[0.07] rounded p-3.5 sm:p-4 bg-white/[0.02] hover:bg-white/[0.03] hover:border-white/[0.1] transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm sm:text-base text-white/80">{skill.name}</span>
                        <span className={`text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded border ${providerBadge(skill.providerType)}`}>
                          {skill.provider}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded ${statusBadge(skill.status)}`}>
                        {skill.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] sm:text-xs text-white/40 leading-relaxed mb-2.5">
                    {skill.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5 flex-wrap">
                      {skill.tags.map((t) => (
                        <span key={t} className="text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 bg-white/[0.04] text-white/25 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                    <Link
                      href="/skill-marketplace"
                      className="text-[10px] font-medium sm:text-[11px] text-zinc-300/50 hover:text-zinc-300 transition-colors shrink-0 ml-2"
                    >
                      marketplace &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Back button */}
            <div className="mt-6 sm:mt-8">
              <button
                onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}
                className="font-medium text-xs text-white/30 hover:text-white/50 transition-colors flex items-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Back to all categories
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
