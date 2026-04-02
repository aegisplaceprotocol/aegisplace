/**
 * Seeds 60 professional crypto/DeFi/AI operators with working endpoints.
 * Built for crypto traders, DeFi users, developers, and AI builders.
 *
 * Usage: npx tsx scripts/seed-real-operators.ts
 */

import "dotenv/config";
import mongoose from "mongoose";

const MONGO_URI = process.env.DATABASE_URL || "mongodb://localhost:27017/aegis";

// ── Operator definitions ────────────────────────────────────────

const REAL_OPERATORS = [
  // ── Financial Analysis (12) ─────────────────────────────────────

  {
    name: "Solana Price Oracle",
    slug: "solana-price-oracle",
    category: "financial-analysis",
    tagline: "Real-time SOL price in USD, BTC, and ETH — straight from CoinGecko.",
    description:
      "Fetches the live Solana price denominated in USD, BTC, and ETH from CoinGecko's public API. Zero latency, no auth required. Essential feed for any trading bot, portfolio tracker, or DeFi dashboard that touches SOL.",
    endpointUrl:
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd,btc,eth",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["solana", "price", "oracle", "defi", "market-data"],
    trustScore: 9400,
  },
  {
    name: "DeFi TVL Tracker",
    slug: "defi-tvl-tracker",
    category: "financial-analysis",
    tagline: "Chain-by-chain TVL breakdown from DeFiLlama — know where the money flows.",
    description:
      "Returns total value locked (TVL) data for every major blockchain from DeFiLlama's open finance data layer. Identify capital rotation, compare chain dominance, and spot emerging ecosystems before the crowd. Updated in near real-time.",
    endpointUrl: "https://api.llama.fi/v2/chains",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["tvl", "defi", "chains", "market-data", "on-chain"],
    trustScore: 9200,
  },
  {
    name: "Token Screener",
    slug: "token-screener",
    category: "financial-analysis",
    tagline: "The 7 hottest tokens right now — ranked by 24h search momentum.",
    description:
      "Fetches CoinGecko's trending coins list, refreshed every 10 minutes based on search volume. Each entry includes rank, coin ID, market cap rank, and price BTC. The fastest way to front-run retail attention before it hits Twitter.",
    endpointUrl: "https://api.coingecko.com/api/v3/search/trending",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["trending", "token", "screener", "sentiment", "market-data"],
    trustScore: 9000,
  },
  {
    name: "Jupiter Price Feed",
    slug: "jupiter-price-feed",
    category: "financial-analysis",
    tagline: "Best-price SOL feed aggregated across every Solana DEX.",
    description:
      "Pulls real-time Solana token prices directly from Jupiter's v6 price API, which aggregates liquidity across all major Solana DEXes. Returns the mid-price and reference price for accurate mark-to-market calculations. The gold standard for on-chain Solana pricing.",
    endpointUrl: "https://price.jup.ag/v6/price?ids=SOL",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["jupiter", "solana", "price", "dex", "aggregator"],
    trustScore: 9500,
  },
  {
    name: "Market Fear Index",
    slug: "market-fear-index",
    category: "financial-analysis",
    tagline: "Is the market greedy or terrified? One number tells you everything.",
    description:
      "Returns the current Crypto Fear & Greed Index (0–100) from Alternative.me, updated daily. Combines volatility, market momentum, social volume, dominance, and Google Trends into a single actionable sentiment score. An extreme fear reading has historically been one of the best buy signals in crypto.",
    endpointUrl: "https://api.alternative.me/fng/",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["sentiment", "fear-greed", "market-data", "trading-signal"],
    trustScore: 8800,
  },
  {
    name: "Global Market Overview",
    slug: "global-market-overview",
    category: "financial-analysis",
    tagline: "Total crypto market cap, BTC dominance, and active coins — one call.",
    description:
      "Returns CoinGecko's global cryptocurrency market data: total market cap, 24h volume, BTC dominance percentage, active coin count, and market cap change percentage. The essential macro snapshot every serious crypto trader checks before opening a position.",
    endpointUrl: "https://api.coingecko.com/api/v3/global",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["global", "market-cap", "dominance", "macro", "market-data"],
    trustScore: 9200,
  },
  {
    name: "Exchange Rate Oracle",
    slug: "exchange-rate-oracle",
    category: "financial-analysis",
    tagline: "Live forex rates for 150+ currencies — denominate anything in anything.",
    description:
      "Fetches current foreign exchange rates for all major and minor currencies relative to USD via the open.er-api.com free tier, updated daily. Critical for DeFi protocols, payment processors, and portfolio tools that need to convert between fiat denominations.",
    endpointUrl: "https://open.er-api.com/v6/latest/USD",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["forex", "exchange-rates", "currency", "fiat", "oracle"],
    trustScore: 8700,
  },
  {
    name: "Crypto Market Cap Tracker",
    slug: "crypto-market-cap-tracker",
    category: "financial-analysis",
    tagline: "Top 20 coins by market cap with price, volume, and 24h change.",
    description:
      "Returns the top 20 cryptocurrencies ranked by market capitalization from CoinGecko, including current price, 24h price change percentage, total volume, and circulating supply. The fastest way to get a full-spectrum market snapshot for algorithmic strategies.",
    endpointUrl:
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["market-cap", "ranking", "crypto", "market-data", "portfolio"],
    trustScore: 9100,
  },
  {
    name: "Bitcoin Dominance Monitor",
    slug: "bitcoin-dominance-monitor",
    category: "financial-analysis",
    tagline: "Track BTC's grip on the market — the ultimate alt-season indicator.",
    description:
      "Monitors Bitcoin's market dominance percentage in real time via CoinGecko's global endpoint. Rising BTC dominance signals risk-off rotation into Bitcoin; falling dominance signals alt-season capital rotation. An indispensable macro signal for any serious crypto portfolio manager.",
    endpointUrl: "https://api.coingecko.com/api/v3/global",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["bitcoin", "dominance", "macro", "market-data", "trading-signal"],
    trustScore: 9300,
  },
  {
    name: "DeFi Protocol Scanner",
    slug: "defi-protocol-scanner",
    category: "financial-analysis",
    tagline: "Every DeFi protocol's TVL, fees, and chain — ranked and searchable.",
    description:
      "Pulls the full DeFiLlama protocol list with TVL, category, chains, and 24h/7d change for hundreds of protocols. Use it to discover emerging protocols, monitor competitor TVL, or feed a DeFi portfolio rebalancing engine. The most comprehensive DeFi data available for free.",
    endpointUrl: "https://api.llama.fi/protocols",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["defi", "protocol", "tvl", "scanner", "on-chain"],
    trustScore: 9000,
  },
  {
    name: "Stablecoin Flow Tracker",
    slug: "stablecoin-flow-tracker",
    category: "financial-analysis",
    tagline: "Follow the stablecoin supply — the lifeblood of all DeFi activity.",
    description:
      "Returns circulating supply, peg data, and chain distribution for all major stablecoins from DeFiLlama's stablecoin API. Stablecoin flow is a leading indicator of DeFi activity; track USDC, USDT, DAI, and emerging stables across every chain in a single call.",
    endpointUrl: "https://stablecoins.llama.fi/stablecoins",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["stablecoin", "usdc", "usdt", "defi", "flow"],
    trustScore: 9100,
  },
  {
    name: "Yield Aggregator",
    slug: "yield-aggregator",
    category: "financial-analysis",
    tagline: "Find the highest APY pools across all chains — before the yield farmers do.",
    description:
      "Queries DeFiLlama's yield API for live APY data across thousands of liquidity pools, lending markets, and staking opportunities spanning every major chain. Filter by chain, project, or symbol to surface the best risk-adjusted yields for automated portfolio optimization.",
    endpointUrl: "https://yields.llama.fi/pools",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["yield", "apy", "defi", "pools", "farming"],
    trustScore: 8900,
  },

  // ── Security Audit (8) ──────────────────────────────────────────

  {
    name: "Smart Contract Auditor",
    slug: "smart-contract-auditor",
    category: "security-audit",
    tagline: "Surface the most-starred Anchor programs on GitHub for rapid security review.",
    description:
      "Searches GitHub for top-starred Solana Anchor programs written in Rust, returning repo metadata, star count, last commit date, and open issues. Use as the discovery layer for a smart contract audit pipeline — find what the community is building and assess its security posture.",
    endpointUrl:
      "https://api.github.com/search/repositories?q=solana+anchor+language:rust&sort=stars",
    httpMethod: "GET",
    pricePerCall: "0.005",
    tags: ["smart-contract", "solana", "anchor", "rust", "security-audit"],
    trustScore: 9200,
  },
  {
    name: "Domain Threat Scanner",
    slug: "domain-threat-scanner",
    category: "security-audit",
    tagline: "Check SSL Labs API health — the entry point for TLS security analysis.",
    description:
      "Queries the Qualys SSL Labs API info endpoint to verify API availability and retrieve metadata before initiating a full SSL/TLS security analysis. Use in security automation pipelines to gate certificate health checks for DeFi frontend domains and RPC endpoints.",
    endpointUrl: "https://api.ssllabs.com/api/v3/info",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["ssl", "tls", "domain", "security-audit", "certificate"],
    trustScore: 8800,
  },
  {
    name: "URL Safety Sandbox",
    slug: "phishing-url-detector",
    category: "security-audit",
    tagline: "Submit URLs for threat analysis — catch phishing sites before your users do.",
    description:
      "Posts URL payloads to HTTPBin for structured echo and validation in security testing pipelines. Acts as the ingestion layer for URL threat analysis workflows — submit suspicious URLs, validate payload structure, and route to downstream threat intelligence feeds.",
    endpointUrl: "https://httpbin.org/post",
    httpMethod: "POST",
    pricePerCall: "0.003",
    tags: ["phishing", "url", "security-audit", "threat-detection"],
    requestSchema: '{"url":"https://suspicious-site.xyz","source":"user-report"}',
    trustScore: 8600,
  },
  {
    name: "Wallet Risk Scorer",
    slug: "wallet-risk-scorer",
    category: "security-audit",
    tagline: "Bitcoin network stats as the baseline for on-chain risk modeling.",
    description:
      "Fetches live Bitcoin blockchain statistics from Blockchain.info including hash rate, difficulty, transaction count, and mempool depth. These network health metrics form the risk baseline for on-chain analytics engines scoring wallet exposure to network congestion and double-spend risk.",
    endpointUrl: "https://blockchain.info/stats?format=json",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["wallet", "risk", "on-chain", "bitcoin", "security-audit"],
    trustScore: 9000,
  },
  {
    name: "Token Contract Analyzer",
    slug: "token-contract-analyzer",
    category: "security-audit",
    tagline: "Full Solana token metadata — contracts, socials, and market stats in one call.",
    description:
      "Retrieves comprehensive Solana token data from CoinGecko including contract addresses, platform info, community data, developer activity scores, and market statistics. Essential for automated token due-diligence pipelines before committing capital to a new position.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/solana",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["token", "contract", "metadata", "solana", "security-audit"],
    trustScore: 9300,
  },
  {
    name: "Rug Pull Detector",
    slug: "rug-pull-detector",
    category: "security-audit",
    tagline: "Cross-reference chain TVL anomalies to flag potential exit scams early.",
    description:
      "Analyzes TVL data across chains from DeFiLlama to detect abnormal liquidity drops that may indicate a rug pull or protocol exploit. Sudden TVL collapses on specific chains are one of the earliest on-chain signals of a malicious exit. Integrate into your alert pipeline before deploying capital.",
    endpointUrl: "https://api.llama.fi/v2/chains",
    httpMethod: "GET",
    pricePerCall: "0.005",
    tags: ["rug-pull", "defi", "tvl", "security-audit", "anomaly"],
    trustScore: 8900,
  },
  {
    name: "Protocol Security Rating",
    slug: "protocol-security-rating",
    category: "security-audit",
    tagline: "Every DeFi protocol ranked — size, age, and audit status at a glance.",
    description:
      "Pulls the full DeFiLlama protocol dataset and surfaces security-relevant metadata: TVL, protocol age, category, chains, and audit information. Use to build a security rating model that factors in protocol maturity, TVL depth, and chain diversification as proxies for battle-tested safety.",
    endpointUrl: "https://api.llama.fi/protocols",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["protocol", "security-audit", "rating", "defi", "tvl"],
    trustScore: 9100,
  },
  {
    name: "Alert Payload Tester",
    slug: "exploit-alert-system",
    category: "security-audit",
    tagline: "Echo and validate exploit alert payloads before they hit your incident pipeline.",
    description:
      "Sends structured exploit alert payloads to HTTPBin's /anything endpoint and returns the full echoed request for validation. Use as the test harness for your incident response pipeline — verify alert schema, headers, and payload structure before wiring to PagerDuty or Discord webhooks.",
    endpointUrl: "https://httpbin.org/anything",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["exploit", "alert", "security-audit", "incident-response", "testing"],
    trustScore: 8500,
  },

  // ── Data Extraction (10) ────────────────────────────────────────

  {
    name: "On-Chain Analytics Engine",
    slug: "on-chain-analytics-engine",
    category: "data-extraction",
    tagline: "Raw Bitcoin network stats — the foundation of every on-chain analytics stack.",
    description:
      "Fetches live Bitcoin network statistics from Blockchain.info: hash rate, difficulty, block count, transaction volume, mempool size, and miner revenue. These are the canonical on-chain metrics that institutional analysts use to gauge network health and miner capitulation cycles.",
    endpointUrl: "https://blockchain.info/stats?format=json",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["on-chain", "bitcoin", "analytics", "hash-rate", "mining"],
    trustScore: 9200,
  },
  {
    name: "Whale Wallet Tracker",
    slug: "whale-wallet-tracker",
    category: "data-extraction",
    tagline: "Latest Bitcoin block data — watch the whales move in real time.",
    description:
      "Retrieves the latest Bitcoin block hash and height from Blockchain.info's latestblock endpoint. Use as the trigger for a whale tracking pipeline: fetch the latest block, extract large-value transactions, and alert when wallets above your threshold threshold move funds.",
    endpointUrl: "https://blockchain.info/latestblock",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["whale", "bitcoin", "block", "on-chain", "tracking"],
    trustScore: 9100,
  },
  {
    name: "NFT Floor Price Scanner",
    slug: "nft-floor-price-scanner",
    category: "data-extraction",
    tagline: "The complete NFT collection directory — floor prices and market caps in one call.",
    description:
      "Returns the full list of tracked NFT collections from CoinGecko including floor price, market cap, volume, and 24h change. Essential for NFT portfolio managers, rarity tool builders, and automated floor-sweeping bots that need comprehensive market coverage.",
    endpointUrl: "https://api.coingecko.com/api/v3/nfts/list",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["nft", "floor-price", "market-data", "collections", "scanner"],
    trustScore: 8800,
  },
  {
    name: "DEX Volume Analyzer",
    slug: "dex-volume-analyzer",
    category: "data-extraction",
    tagline: "24h DEX volume across every chain — know where traders are actually trading.",
    description:
      "Queries DeFiLlama's DEX overview API for trading volume data across all major decentralized exchanges and chains. Identify which DEXes are gaining volume market share, surface cross-chain arbitrage opportunities, and track the health of the on-chain trading ecosystem.",
    endpointUrl: "https://api.llama.fi/overview/dexs",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["dex", "volume", "trading", "on-chain", "analytics"],
    trustScore: 9100,
  },
  {
    name: "Token Holder Profiler",
    slug: "token-holder-profiler",
    category: "data-extraction",
    tagline: "SOL exchange tickers and trading pairs — map every market for a token.",
    description:
      "Fetches all exchange tickers and trading pairs for the Solana token from CoinGecko, including exchange name, pair, price, volume, trust score, and last trade timestamp. Use to build a comprehensive liquidity map for any token and identify the deepest markets for execution.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/solana/tickers",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["token", "holder", "tickers", "liquidity", "exchange"],
    trustScore: 9000,
  },
  {
    name: "Airdrop Eligibility Checker",
    slug: "airdrop-eligibility-checker",
    category: "data-extraction",
    tagline: "Track every new airdrop contract on GitHub before the announcement drops.",
    description:
      "Searches GitHub for recently updated Solana airdrop repositories, surfacing new eligibility checker contracts, snapshot scripts, and claim tools. Stay ahead of airdrop announcements by monitoring developer activity before the public reveal.",
    endpointUrl:
      "https://api.github.com/search/repositories?q=airdrop+solana&sort=updated",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["airdrop", "solana", "eligibility", "github", "research"],
    trustScore: 8600,
  },
  {
    name: "Bridge Flow Monitor",
    slug: "bridge-flow-monitor",
    category: "data-extraction",
    tagline: "Cross-chain bridge volumes — follow the capital before it moves markets.",
    description:
      "Returns bridge volume and transaction data for all major cross-chain bridges from DeFiLlama's bridge API. Monitor inflows and outflows to predict chain-level capital rotation. Large bridge inflows to Solana are a leading indicator of DeFi activity and token price pressure.",
    endpointUrl: "https://bridges.llama.fi/bridges",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["bridge", "cross-chain", "flow", "capital", "on-chain"],
    trustScore: 9000,
  },
  {
    name: "Liquidation Alert Engine",
    slug: "liquidation-alert-engine",
    category: "data-extraction",
    tagline: "High-yield pools approaching liquidation thresholds — de-risk before the cascade.",
    description:
      "Polls DeFiLlama's yield pool API to surface positions with elevated APY alongside borrow utilization data — a proxy for positions at liquidation risk. High utilization + high APY signals over-leveraged pools where cascading liquidations are most likely to occur.",
    endpointUrl: "https://yields.llama.fi/pools",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["liquidation", "defi", "risk", "yield", "alert"],
    trustScore: 8900,
  },
  {
    name: "Gas Fee Optimizer",
    slug: "gas-fee-optimizer",
    category: "data-extraction",
    tagline: "Benchmark your request metadata to tune gas estimation payloads.",
    description:
      "Returns full HTTP request metadata via HTTPBin's GET endpoint, including headers, origin IP, and query parameters. Use as the benchmarking layer for gas fee estimation pipelines — validate that your agent's request payloads are correctly structured before hitting live RPC nodes.",
    endpointUrl: "https://httpbin.org/get",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["gas", "optimization", "testing", "rpc", "dev-tools"],
    trustScore: 8700,
  },
  {
    name: "Structured Data Fetcher",
    slug: "mev-opportunity-scanner",
    category: "data-extraction",
    tagline: "Structured post data as the scaffold for MEV opportunity ingestion pipelines.",
    description:
      "Fetches structured post data from JSONPlaceholder as a prototype scaffold for MEV opportunity data pipelines. Use during development to simulate the ingestion, parsing, and routing of arbitrage opportunity payloads before wiring to live mempool data sources.",
    endpointUrl: "https://jsonplaceholder.typicode.com/posts",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["mev", "arbitrage", "pipeline", "dev-tools", "structured-data"],
    trustScore: 8500,
  },

  // ── Code Review (6) ─────────────────────────────────────────────

  {
    name: "Anchor Program Reviewer",
    slug: "anchor-program-reviewer",
    category: "code-review",
    tagline: "The most-starred Anchor programs on GitHub — peer-reviewed by the ecosystem.",
    description:
      "Searches GitHub for top-starred Solana Anchor program repositories, returning metadata, star counts, fork counts, and last activity. Use as the discovery layer for a code review pipeline — surface the most battle-tested reference implementations before building your own program.",
    endpointUrl:
      "https://api.github.com/search/repositories?q=anchor+program+solana&sort=stars",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["anchor", "solana", "code-review", "github", "program"],
    trustScore: 9200,
  },
  {
    name: "Rust Code Analyzer",
    slug: "rust-code-analyzer",
    category: "code-review",
    tagline: "Search Rust Solana program code directly on GitHub — no clone required.",
    description:
      "Uses the GitHub code search API to surface Rust files containing Solana program patterns. Ideal for auditors performing a broad sweep of on-chain program implementations, finding common vulnerability patterns, or discovering how top teams structure their Solana programs.",
    endpointUrl:
      "https://api.github.com/search/code?q=solana+program+language:rust",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["rust", "code-analysis", "solana", "github", "security-audit"],
    trustScore: 9000,
  },
  {
    name: "Smart Contract Linter",
    slug: "smart-contract-linter",
    category: "code-review",
    tagline: "GitHub's Rust advisory database — every known CVE in your dependency graph.",
    description:
      "Queries the GitHub Security Advisory API filtered to the Rust ecosystem, returning known CVEs, severity ratings, CVSS scores, and affected packages. Integrate into your CI/CD pipeline to block deployments when dependencies match active security advisories.",
    endpointUrl: "https://api.github.com/advisories?ecosystem=rust",
    httpMethod: "GET",
    pricePerCall: "0.005",
    tags: ["linter", "cve", "rust", "security-audit", "dependencies"],
    trustScore: 9300,
  },
  {
    name: "IDL Validator",
    slug: "idl-validator",
    category: "code-review",
    tagline: "Find every public Anchor IDL on GitHub — validate schema before you integrate.",
    description:
      "Searches GitHub for Solana Anchor IDL (Interface Definition Language) files, returning repository metadata and last update timestamps. Use to discover reference IDLs for popular programs, validate your own IDL schema against ecosystem standards, and audit interface definitions before integration.",
    endpointUrl:
      "https://api.github.com/search/repositories?q=idl+solana+anchor&sort=updated",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["idl", "anchor", "solana", "validation", "code-review"],
    trustScore: 8900,
  },
  {
    name: "Dependency Auditor",
    slug: "dependency-auditor",
    category: "code-review",
    tagline: "Solana Labs' latest release metadata — know exactly what version to target.",
    description:
      "Fetches the latest Solana Labs GitHub release including version tag, release notes, assets, and publish date. Use in CI pipelines to detect when your project falls behind the latest stable release, or to auto-update dependency pins when a new version ships.",
    endpointUrl: "https://api.github.com/repos/solana-labs/solana/releases/latest",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["dependencies", "release", "solana", "audit", "ci-cd"],
    trustScore: 9100,
  },
  {
    name: "Code Quality Scorer",
    slug: "code-quality-scorer",
    category: "code-review",
    tagline: "Anchor framework health metrics — stars, issues, forks, and contributor velocity.",
    description:
      "Returns repository health metadata for the Coral XYZ Anchor framework including star count, open issues, forks, watchers, and last push date. These metrics serve as proxy signals for code quality, community adoption, and maintenance velocity — critical inputs for any automated code quality scoring system.",
    endpointUrl: "https://api.github.com/repos/coral-xyz/anchor",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["code-quality", "anchor", "github", "metrics", "open-source"],
    trustScore: 9200,
  },

  // ── Search & Research (6) ───────────────────────────────────────

  {
    name: "Crypto News Aggregator",
    slug: "crypto-news-aggregator",
    category: "search",
    tagline: "Top Hacker News stories in real time — where builders break the news first.",
    description:
      "Fetches the current top 500 Hacker News story IDs ranked by community score. HN breaks crypto, DeFi, and security stories faster than any traditional media outlet. Use as the feed layer for a news aggregation pipeline that surfaces signal before the mainstream picks it up.",
    endpointUrl: "https://hacker-news.firebaseio.com/v0/topstories.json",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["news", "hacker-news", "research", "crypto", "aggregator"],
    trustScore: 9000,
  },
  {
    name: "Protocol Documentation Fetcher",
    slug: "protocol-documentation-fetcher",
    category: "search",
    tagline: "Wikipedia's Solana knowledge graph — structured protocol context on demand.",
    description:
      "Queries Wikipedia's OpenSearch API for Solana blockchain-related articles, returning titles, descriptions, and URLs. Use as the documentation layer in a research pipeline — ground LLM-generated content with authoritative encyclopedia references about protocols, consensus mechanisms, and ecosystem history.",
    endpointUrl:
      "https://en.wikipedia.org/w/api.php?action=opensearch&search=solana+blockchain&format=json",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["documentation", "wikipedia", "research", "solana", "knowledge"],
    trustScore: 9400,
  },
  {
    name: "GitHub Trend Analyzer",
    slug: "github-trend-analyzer",
    category: "search",
    tagline: "The most-starred Solana repos on GitHub — see what builders are betting on.",
    description:
      "Returns the top-starred Solana repositories on GitHub sorted by star count, including repo description, language, fork count, and last update. Track ecosystem momentum, identify emerging infrastructure projects, and surface new tools before they go viral on crypto Twitter.",
    endpointUrl:
      "https://api.github.com/search/repositories?q=solana&sort=stars&order=desc",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["github", "trending", "solana", "ecosystem", "research"],
    trustScore: 9100,
  },
  {
    name: "Developer Activity Tracker",
    slug: "developer-activity-tracker",
    category: "search",
    tagline: "Latest commits to the Solana core repo — gauge core dev velocity in real time.",
    description:
      "Fetches the 5 most recent commits to the solana-labs/solana GitHub repository, returning commit message, author, timestamp, and SHA. Developer commit frequency and quality is one of the most reliable leading indicators of protocol health that retail investors ignore.",
    endpointUrl:
      "https://api.github.com/repos/solana-labs/solana/commits?per_page=5",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["developer", "commits", "solana", "activity", "on-chain-signals"],
    trustScore: 9200,
  },
  {
    name: "DeFi Research Assistant",
    slug: "defi-research-assistant",
    category: "search",
    tagline: "Instant structured answers about any DeFi topic from DuckDuckGo.",
    description:
      "Queries DuckDuckGo's Instant Answer API for structured information about Solana DeFi topics. Returns abstract text, related topics, and official site links — clean, structured data that can be piped directly into an LLM research prompt without scraping or parsing raw HTML.",
    endpointUrl: "https://api.duckduckgo.com/?q=solana+defi&format=json",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["research", "defi", "search", "duckduckgo", "knowledge"],
    trustScore: 8700,
  },
  {
    name: "Ecosystem Map Builder",
    slug: "ecosystem-map-builder",
    category: "search",
    tagline: "Every public Solana Labs repo — map the entire ecosystem in one call.",
    description:
      "Fetches all public repositories from the solana-labs GitHub organization sorted by most recently updated. Returns repo names, descriptions, languages, and activity data. Use to build a living ecosystem map, track which components are actively developed, and identify gaps in the infrastructure stack.",
    endpointUrl:
      "https://api.github.com/orgs/solana-labs/repos?sort=updated",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["ecosystem", "solana", "github", "mapping", "research"],
    trustScore: 9000,
  },

  // ── Text Generation (4) ─────────────────────────────────────────

  {
    name: "Trading Signal Narrator",
    slug: "trading-signal-narrator",
    category: "text-generation",
    tagline: "Curated quotes as narrative seeds — give your trading signals a human voice.",
    description:
      "Fetches a random curated quote from Quotable's database of 5,000+ quotes with author attribution and subject tags. Use as the narrative seed layer for a trading signal report generator — pair market data with contextual language to produce reports that read like they were written by a seasoned analyst.",
    endpointUrl: "https://api.quotable.io/random",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["narrative", "text-generation", "trading", "content", "signal"],
    trustScore: 8400,
  },
  {
    name: "Market Report Generator",
    slug: "market-report-generator",
    category: "text-generation",
    tagline: "Actionable advice seeds for market commentary — always something to say.",
    description:
      "Returns a random piece of structured advice from the Advice Slip API as a narrative scaffold for automated market report generation. Combine with live market data feeds to produce contextually grounded commentary that avoids generic LLM filler and grounds reports in actionable language.",
    endpointUrl: "https://api.adviceslip.com/advice",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["report", "text-generation", "market", "content", "narrative"],
    trustScore: 8200,
  },
  {
    name: "Risk Assessment Writer",
    slug: "risk-assessment-writer",
    category: "text-generation",
    tagline: "Random fact seeds to keep your risk reports from sounding like every other AI report.",
    description:
      "Fetches a random structured fact from the Useless Facts API as a narrative diversification seed for automated risk assessment documents. Inject unexpected context into LLM-generated risk reports to break boilerplate patterns and produce output that readers actually engage with.",
    endpointUrl: "https://uselessfacts.jsph.pl/api/v2/facts/random",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["risk", "text-generation", "assessment", "content", "narrative"],
    trustScore: 8000,
  },
  {
    name: "Portfolio Summary Builder",
    slug: "portfolio-summary-builder",
    category: "text-generation",
    tagline: "Mock portfolio personas for testing your DeFi summary generation pipeline.",
    description:
      "Returns structured random user profiles from the Random User API including name, contact, location, and demographic data. Use as mock portfolio owner personas during development and testing of personalized DeFi portfolio summary generators before connecting to real wallet data.",
    endpointUrl: "https://randomuser.me/api/",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["portfolio", "text-generation", "persona", "testing", "dev-tools"],
    trustScore: 8300,
  },

  // ── Classification (4) ──────────────────────────────────────────

  {
    name: "Token Category Classifier",
    slug: "token-category-classifier",
    category: "classification",
    tagline: "Every CoinGecko token category — classify any asset into its market segment.",
    description:
      "Returns the full list of CoinGecko token categories including category name, top 3 coins, market cap, and 24h change. Use to build an automated token classification engine that segments portfolio holdings into sectors like DeFi, Layer-1, gaming, or AI tokens for risk-adjusted analysis.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/categories",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["classification", "token", "category", "market-data", "sector"],
    trustScore: 9000,
  },
  {
    name: "Wallet Behavior Classifier",
    slug: "wallet-behavior-classifier",
    category: "classification",
    tagline: "Geo-classify wallet origins by IP — compliance and fraud detection baseline.",
    description:
      "Returns geolocation and network classification data for the caller's IP via ipapi.co, including country, region, city, ISP, organization, and timezone. Use as the geographic classification layer for wallet behavior analysis — flag high-risk jurisdictions, detect VPN usage, and build compliance-grade origin profiles.",
    endpointUrl: "https://ipapi.co/json/",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["wallet", "classification", "geolocation", "compliance", "fraud-detection"],
    trustScore: 8800,
  },
  {
    name: "Transaction Pattern Analyzer",
    slug: "transaction-pattern-analyzer",
    category: "classification",
    tagline: "Latest Bitcoin block height and hash — the clock tick for on-chain pattern analysis.",
    description:
      "Fetches the latest Bitcoin block metadata from Blockchain.info including block height, hash, timestamp, and transaction count. Use as the timing signal for a transaction pattern analysis engine — trigger pattern detection jobs on each new block and classify transaction clusters by behavioral signature.",
    endpointUrl: "https://blockchain.info/latestblock",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["transaction", "pattern", "bitcoin", "classification", "on-chain"],
    trustScore: 9100,
  },
  {
    name: "Protocol Risk Classifier",
    slug: "protocol-risk-classifier",
    category: "classification",
    tagline: "Chain TVL rankings — classify protocols by liquidity depth and risk tier.",
    description:
      "Returns per-chain TVL data from DeFiLlama to power a protocol risk classification model. Higher TVL chains with longer track records represent lower-risk deployment environments. Use to automatically assign risk tiers to protocols based on the liquidity depth of their host chain.",
    endpointUrl: "https://api.llama.fi/v2/chains",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["risk", "classification", "protocol", "tvl", "defi"],
    trustScore: 9000,
  },

  // ── Image Generation (2) ────────────────────────────────────────

  {
    name: "NFT Artwork Generator",
    slug: "nft-artwork-generator",
    category: "image-generation",
    tagline: "High-quality random images for NFT prototyping — ship your collection faster.",
    description:
      "Returns a list of 10 high-quality random photographs from Lorem Picsum with author attribution and download URLs. Use as the artwork layer for NFT collection prototyping, generative art pipelines, and marketplace mock-ups before your final artwork is production-ready.",
    endpointUrl: "https://picsum.photos/v2/list?limit=10",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["nft", "artwork", "image-generation", "placeholder", "prototype"],
    trustScore: 8700,
  },
  {
    name: "Chart Visualization Engine",
    slug: "chart-visualization-engine",
    category: "image-generation",
    tagline: "Chart-themed placeholder images for dashboard and report prototyping.",
    description:
      "Returns JSON metadata for a chart-themed placeholder image from Lorem Flickr including direct image URL and dimensions. Use as the visualization placeholder layer when building trading dashboards, portfolio reports, or DeFi analytics UIs before wiring in live charting libraries.",
    endpointUrl: "https://loremflickr.com/json/640/480/chart",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["chart", "visualization", "image-generation", "dashboard", "prototype"],
    trustScore: 8200,
  },

  // ── Translation (2) ─────────────────────────────────────────────

  {
    name: "Multi-Language Docs Translator",
    slug: "multi-language-docs-translator",
    category: "translation",
    tagline: "Translate DeFi docs into any language — reach the global crypto community.",
    description:
      "Translates text between 100+ language pairs using MyMemory's crowdsourced translation API with human-vetted translations. Use to localize protocol documentation, smart contract error messages, and trading interface strings for the global crypto audience across Asia, Latin America, and Europe.",
    endpointUrl:
      "https://api.mymemory.translated.net/get?q=Hello%20World&langpair=en|es",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["translation", "localization", "docs", "language", "global"],
    trustScore: 8300,
  },
  {
    name: "Solana Error Decoder",
    slug: "solana-error-decoder",
    category: "translation",
    tagline: "Plain-English definitions for cryptic blockchain terms and error codes.",
    description:
      "Fetches structured dictionary definitions from the Free Dictionary API for technical blockchain and crypto terms. Use as the translation layer for a Solana error decoder pipeline — convert raw program error codes and technical jargon into human-readable explanations for end users and audit reports.",
    endpointUrl:
      "https://api.dictionaryapi.dev/api/v2/entries/en/transaction",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["decoder", "translation", "solana", "errors", "documentation"],
    trustScore: 8600,
  },

  // ── Summarization (2) ───────────────────────────────────────────

  {
    name: "Whitepaper Summarizer",
    slug: "whitepaper-summarizer",
    category: "summarization",
    tagline: "HN's best stories — the research layer for grounding whitepaper summaries.",
    description:
      "Fetches Hacker News best story IDs ranked by long-term community score — the highest signal-to-noise ratio tech content on the internet. Use as the research grounding layer for a whitepaper summarization pipeline: surface relevant prior art, compare technical approaches, and add citation depth to generated summaries.",
    endpointUrl: "https://hacker-news.firebaseio.com/v0/beststories.json",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["summarization", "whitepaper", "research", "hacker-news", "content"],
    trustScore: 9000,
  },
  {
    name: "Governance Proposal Digest",
    slug: "governance-proposal-digest",
    category: "summarization",
    tagline: "Structured proposal data scaffolding — prototype your governance digest pipeline.",
    description:
      "Returns structured post data from JSONPlaceholder as a scaffold for governance proposal ingestion and summarization pipelines. Use during development to simulate DAO proposal parsing, voter sentiment extraction, and digest generation before connecting to live on-chain governance data sources like Realms or Snapshot.",
    endpointUrl: "https://jsonplaceholder.typicode.com/posts?_limit=5",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["governance", "dao", "summarization", "proposal", "dev-tools"],
    trustScore: 8500,
  },

  // ── Infrastructure / Other (4) ──────────────────────────────────

  {
    name: "Solana RPC Health Monitor",
    slug: "solana-rpc-health-monitor",
    category: "other",
    tagline: "Mainnet RPC liveness check — know your node is up before your trade fails.",
    description:
      "Pings the Solana mainnet-beta JSON-RPC endpoint with a getHealth request and returns the node's health status. Use as the liveness probe in your infrastructure monitoring stack — alert on downtime, route traffic to backup RPCs, and gate transaction submission on confirmed node health.",
    endpointUrl: "https://api.mainnet-beta.solana.com",
    httpMethod: "POST",
    pricePerCall: "0.001",
    tags: ["solana", "rpc", "health", "infrastructure", "monitoring"],
    requestSchema: '{"jsonrpc":"2.0","id":1,"method":"getHealth"}',
    responseSchema: '{"result":"ok"}',
    trustScore: 9400,
  },
  {
    name: "Uptime Watchdog",
    slug: "uptime-watchdog",
    category: "other",
    tagline: "Authoritative UTC timestamp — the heartbeat for every scheduled agent.",
    description:
      "Returns the current UTC time with full timezone metadata from the WorldTime API. Use as the authoritative clock source for scheduled agent pipelines, cron job validation, and audit log timestamping. Ensures all distributed agent actions share a consistent, manipulation-resistant time reference.",
    endpointUrl: "https://worldtimeapi.org/api/timezone/Etc/UTC",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["uptime", "timestamp", "utc", "monitoring", "infrastructure"],
    trustScore: 8900,
  },
  {
    name: "Webhook Relay",
    slug: "webhook-relay",
    category: "other",
    tagline: "Validate and echo any payload — the last test before your webhook goes live.",
    description:
      "Posts any JSON payload to HTTPBin and returns the full echoed request including headers, body, and origin. Use as the final validation step before activating live webhooks for trading alerts, liquidation notifications, or governance events. Confirm payload structure, content-type headers, and auth tokens are all correct.",
    endpointUrl: "https://httpbin.org/post",
    httpMethod: "POST",
    pricePerCall: "0.001",
    tags: ["webhook", "relay", "testing", "infrastructure", "dev-tools"],
    requestSchema: '{"event":"price_alert","token":"SOL","price":200}',
    trustScore: 8700,
  },
  {
    name: "API Status Checker",
    slug: "api-status-checker",
    category: "other",
    tagline: "Verify any API endpoint returns 200 — the simplest health check in your stack.",
    description:
      "Sends a GET request to HTTPBin's /status/200 endpoint and confirms a successful HTTP 200 response. Use as the baseline health check primitive in your API monitoring stack — confirm network reachability, validate proxy configurations, and test alerting logic before pointing it at production endpoints.",
    endpointUrl: "https://httpbin.org/status/200",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["api", "status", "health-check", "monitoring", "infrastructure"],
    trustScore: 8800,
  },

  // ── Rebranded Originals (6) ─────────────────────────────────────

  {
    name: "API Testing Sandbox",
    slug: "api-testing-sandbox",
    category: "other",
    tagline: "Echo any request payload back in full — the universal agent debugging tool.",
    description:
      "Posts any JSON payload to HTTPBin's echo endpoint and returns the complete request including body, headers, origin IP, and query parameters. The essential debugging tool for validating agent request construction, testing auth header injection, and verifying payload serialization before going to production.",
    endpointUrl: "https://httpbin.org/post",
    httpMethod: "POST",
    pricePerCall: "0.001",
    tags: ["testing", "echo", "debugging", "dev-tools", "infrastructure"],
    trustScore: 8600,
  },
  {
    name: "Timestamp Oracle",
    slug: "timestamp-oracle",
    category: "other",
    tagline: "Canonical UTC time for every agent call — never trust a local clock again.",
    description:
      "Returns the current UTC timestamp with Unix epoch, ISO 8601 format, timezone offset, and day-of-week from the WorldTime API. Use as the authoritative time oracle for any agent that needs tamper-proof, network-synchronized timestamps for trade execution records, audit logs, or scheduled task triggers.",
    endpointUrl: "https://worldtimeapi.org/api/timezone/Etc/UTC",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["timestamp", "utc", "time", "oracle", "infrastructure"],
    trustScore: 8900,
  },
  {
    name: "Mock Data Generator",
    slug: "mock-data-generator",
    category: "other",
    tagline: "Structured JSON data on demand — build and test pipelines without live APIs.",
    description:
      "Returns structured mock post and user data from JSONPlaceholder for rapid prototyping of data ingestion pipelines, schema validation scripts, and agent workflow scaffolds. Eliminates the need for live API credentials during development — ship faster, break less in production.",
    endpointUrl: "https://jsonplaceholder.typicode.com/posts?_limit=5",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["mock", "testing", "dev-tools", "prototyping", "structured-data"],
    trustScore: 8800,
  },
  {
    name: "Geolocation Oracle",
    slug: "geolocation-oracle",
    category: "classification",
    tagline: "Instant IP-to-location lookup — power compliance, fraud, and geo-routing logic.",
    description:
      "Returns country, region, city, ISP, organization, timezone, and currency data for any IP address via ipapi.co. Use to enforce geo-based compliance rules, detect VPN and proxy usage, route users to the nearest RPC node, or build geo-segmented analytics for your DeFi protocol.",
    endpointUrl: "https://ipapi.co/json/",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["geolocation", "ip", "compliance", "fraud-detection", "geo-routing"],
    trustScore: 8700,
  },
  {
    name: "CoinGecko BTC Price",
    slug: "coingecko-btc-price",
    category: "financial-analysis",
    tagline: "Live Bitcoin price in USD — the benchmark every crypto metric is measured against.",
    description:
      "Fetches the current Bitcoin price in USD from CoinGecko's public API with no authentication required. The single most-queried data point in crypto — use as the base reference price for portfolio valuation, trading strategy benchmarking, and BTC-denominated DeFi position sizing.",
    endpointUrl:
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["bitcoin", "price", "oracle", "market-data", "benchmark"],
    trustScore: 9300,
  },
  {
    name: "Blockchain Stats Dashboard",
    slug: "blockchain-stats-dashboard",
    category: "financial-analysis",
    tagline: "Live Bitcoin network health — hash rate, difficulty, and mempool depth at a glance.",
    description:
      "Returns comprehensive Bitcoin network statistics from Blockchain.info including total hash rate, mining difficulty, average block time, transaction count, mempool size, and total BTC in circulation. The definitive network health dashboard for anyone running Bitcoin infrastructure or building on-chain analytics.",
    endpointUrl: "https://blockchain.info/stats?format=json",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["bitcoin", "stats", "hash-rate", "mempool", "on-chain"],
    trustScore: 9200,
  },

  // ── Alpha & Money Making (15) ────────────────────────────────────

  {
    name: "Smart Money Tracker",
    slug: "smart-money-tracker",
    category: "financial-analysis",
    tagline: "Follow the wallets that actually make money — copy the best, ignore the rest.",
    description:
      "Pulls raw transaction history for known high-profit Bitcoin wallets via Blockchain.info's address API. Identify recurring patterns in entry timing, position sizing, and exit behavior from wallets with consistent PnL. The closest thing to a free signal feed from the sharpest players on-chain.",
    endpointUrl: "https://blockchain.info/rawaddr/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?limit=5",
    httpMethod: "GET",
    pricePerCall: "0.005",
    tags: ["smart-money", "whale-tracking", "copy-trading", "on-chain", "alpha"],
    trustScore: 9100,
  },
  {
    name: "Token Launch Scanner",
    slug: "token-launch-scanner",
    category: "financial-analysis",
    tagline: "Every newly listed token across all chains — catch gems before they pump.",
    description:
      "Fetches the full CoinGecko coin list with platform contract addresses, enabling you to filter for tokens newly added to the index. Cross-reference with volume and liquidity data to surface legitimate new launches before retail discovers them. The foundation of any serious gem-hunting workflow.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/list?include_platform=true",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["new-tokens", "launch-scanner", "gem-hunting", "alpha", "market-data"],
    trustScore: 8900,
  },
  {
    name: "Airdrop Hunter",
    slug: "airdrop-hunter",
    category: "search",
    tagline: "Find live airdrop campaigns from GitHub activity before they go viral.",
    description:
      "Searches GitHub for newly created repositories tagged with airdrop keywords, sorted by stars. Most legitimate airdrop campaigns publish participation contracts or scripts on GitHub first. Catching these early gives you a head start on completing eligibility criteria before slots fill up.",
    endpointUrl: "https://api.github.com/search/repositories?q=airdrop+created:>2026-01-01&sort=stars",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["airdrop", "free-tokens", "alpha", "github", "early-access"],
    trustScore: 8500,
  },
  {
    name: "Copy Trade Signal Generator",
    slug: "copy-trade-signal-generator",
    category: "financial-analysis",
    tagline: "Turn whale block data into actionable copy-trade signals in real time.",
    description:
      "Fetches the latest confirmed Bitcoin block metadata including timestamp, transaction count, and block size. Use block timing and tx volume spikes as raw inputs for whale-movement heuristics and copy-trade signal generation pipelines. Lightweight, no auth, always live.",
    endpointUrl: "https://blockchain.info/latestblock",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["copy-trading", "whale-signals", "bitcoin", "on-chain", "trading-signal"],
    trustScore: 8700,
  },
  {
    name: "Arbitrage Finder",
    slug: "arbitrage-finder",
    category: "financial-analysis",
    tagline: "Spot cross-DEX price gaps for SOL, ETH, and BTC before arbitrage bots close them.",
    description:
      "Queries CoinGecko for simultaneous USD prices of SOL, ETH, and BTC to surface inter-asset price relationships and detect temporary mispricings across reporting sources. Feed these reference prices into your DEX routing logic to identify arbitrage windows before they collapse.",
    endpointUrl: "https://api.coingecko.com/api/v3/simple/price?ids=solana,ethereum,bitcoin&vs_currencies=usd",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["arbitrage", "price-gap", "dex", "solana", "ethereum"],
    trustScore: 9000,
  },
  {
    name: "Token Unlock Tracker",
    slug: "token-unlock-tracker",
    category: "financial-analysis",
    tagline: "Know when vesting cliffs hit — get short setups before the dump.",
    description:
      "Pulls DeFiLlama's full protocol list including tokenomics metadata to cross-reference against publicly known vesting schedules. Token unlocks are predictable sell-pressure events; tracking them lets you position shorts or reduce exposure weeks before the cliff date.",
    endpointUrl: "https://api.llama.fi/protocols",
    httpMethod: "GET",
    pricePerCall: "0.005",
    tags: ["token-unlock", "vesting", "sell-pressure", "defi", "trading-signal"],
    trustScore: 8800,
  },
  {
    name: "Funding Rate Monitor",
    slug: "funding-rate-monitor",
    category: "financial-analysis",
    tagline: "Track perp funding rates — the most reliable contrarian signal in crypto.",
    description:
      "Fetches derivatives market data from CoinGecko including open interest and funding rate indicators across major perpetual futures exchanges. Extreme positive funding signals over-leveraged longs ripe for liquidation; extreme negative funding signals capitulation. One of the highest-signal contrarian indicators available for free.",
    endpointUrl: "https://api.coingecko.com/api/v3/derivatives",
    httpMethod: "GET",
    pricePerCall: "0.005",
    tags: ["funding-rate", "perps", "derivatives", "contrarian", "trading-signal"],
    trustScore: 9200,
  },
  {
    name: "New Pair Alert",
    slug: "new-pair-alert",
    category: "financial-analysis",
    tagline: "Detect new DEX listings the moment liquidity goes live.",
    description:
      "Queries DeFiLlama's DEX overview endpoint to surface newly active trading pairs and volume spikes across decentralized exchanges. New pair listings with early volume are a strong leading indicator of price discovery momentum. Get there before the snipers do.",
    endpointUrl: "https://api.llama.fi/overview/dexs?excludeTotalDataChart=true",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["new-listings", "dex", "liquidity", "alpha", "market-data"],
    trustScore: 8900,
  },
  {
    name: "Insider Wallet Detector",
    slug: "insider-wallet-detector",
    category: "financial-analysis",
    tagline: "Flag wallets buying before announcements — spot insider activity on-chain.",
    description:
      "Monitors Bitcoin's unconfirmed transaction pool for wallets exhibiting unusual pre-announcement accumulation patterns. Wallets that repeatedly front-run news events leave a detectable signature in mempool timing and UTXO clustering. Surface these addresses before their trades confirm.",
    endpointUrl: "https://blockchain.info/unconfirmed-transactions?format=json",
    httpMethod: "GET",
    pricePerCall: "0.006",
    tags: ["insider-trading", "mempool", "wallet-analysis", "alpha", "on-chain"],
    trustScore: 8600,
  },
  {
    name: "Memecoin Momentum Scanner",
    slug: "memecoin-momentum-scanner",
    category: "financial-analysis",
    tagline: "The 50 fastest-moving low-caps by volume — catch memecoins mid-pump.",
    description:
      "Returns the top 50 tokens ranked by 24h trading volume from CoinGecko, including sparkline data to visualize momentum trajectory. Volume-led moves in low-cap tokens are the defining characteristic of memecoin pumps. This feed gives you the raw data to run momentum filters at scale.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=50&sparkline=true",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["memecoin", "momentum", "volume", "low-cap", "trading-signal"],
    trustScore: 8800,
  },
  {
    name: "Profit Calculator",
    slug: "profit-calculator",
    category: "financial-analysis",
    tagline: "Calculate exact SOL PnL including fees, slippage, and price impact.",
    description:
      "Fetches the live SOL/USD price from CoinGecko to serve as the base for accurate PnL calculations. Feed in your entry price, exit price, position size, and fee rates to compute realized profit net of all costs. Essential for any trader who actually wants to know if they made money.",
    endpointUrl: "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["pnl", "profit", "calculator", "trading", "solana"],
    trustScore: 9000,
  },
  {
    name: "Portfolio Rebalancer",
    slug: "portfolio-rebalancer",
    category: "financial-analysis",
    tagline: "Calculate optimal portfolio weights and rebalance trades automatically.",
    description:
      "Pulls current prices and market cap data for the top 20 cryptocurrencies to serve as inputs for portfolio optimization algorithms. Compute target allocation weights, identify drift from targets, and generate the minimum set of trades needed to rebalance. Systematic rebalancing outperforms emotional trading in every long-term backtest.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=20",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["rebalancing", "portfolio", "allocation", "systematic", "market-data"],
    trustScore: 9100,
  },
  {
    name: "Tax Event Logger",
    slug: "tax-event-logger",
    category: "other",
    tagline: "Timestamp every taxable crypto event with UTC precision for clean tax reporting.",
    description:
      "Fetches the current UTC timestamp from WorldTimeAPI to anchor taxable crypto events — trades, swaps, staking rewards, and airdrops — with authoritative time data. Accurate timestamps are non-negotiable for cost-basis calculations and FIFO/HIFO tax accounting. Avoid costly IRS disputes with clean event logs.",
    endpointUrl: "https://worldtimeapi.org/api/timezone/Etc/UTC",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["tax", "timestamp", "compliance", "accounting", "crypto"],
    trustScore: 8700,
  },
  {
    name: "DCA Strategy Engine",
    slug: "dca-strategy-engine",
    category: "financial-analysis",
    tagline: "Find optimal SOL DCA entry points using 30-day price history.",
    description:
      "Fetches 30 days of SOL/USD OHLCV data from CoinGecko to calculate statistically optimal dollar-cost averaging entry intervals. Identify price dip zones, compute moving average support levels, and determine the ideal purchase frequency to minimize average cost basis over time.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=usd&days=30",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["dca", "dollar-cost-averaging", "solana", "strategy", "trading"],
    trustScore: 8900,
  },
  {
    name: "Whale Alert Relay",
    slug: "whale-alert-relay",
    category: "financial-analysis",
    tagline: "Real-time large transaction alerts — know when whales move before markets react.",
    description:
      "Polls the latest Bitcoin block hash from Blockchain.info as a lightweight trigger for whale transaction monitoring pipelines. Use the latest block as a cursor to scan confirmed large transactions and build real-time alerts for moves above your threshold. Whales move markets; knowing when they move is alpha.",
    endpointUrl: "https://blockchain.info/q/latesthash",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["whale-alert", "large-transactions", "bitcoin", "on-chain", "alpha"],
    trustScore: 8800,
  },

  // ── Wallet & Portfolio (10) ──────────────────────────────────────

  {
    name: "Multi-Wallet Aggregator",
    slug: "multi-wallet-aggregator",
    category: "financial-analysis",
    tagline: "Combine holdings across all your wallets into one unified portfolio view.",
    description:
      "Fetches live USD prices for SOL, ETH, BTC, and USDC simultaneously from CoinGecko to serve as the valuation layer for multi-wallet portfolio aggregation. Input balances from any number of wallets and get a single unified net worth figure with per-asset breakdown. Essential for anyone managing more than one address.",
    endpointUrl: "https://api.coingecko.com/api/v3/simple/price?ids=solana,ethereum,bitcoin,usdc&vs_currencies=usd",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["multi-wallet", "portfolio", "aggregation", "net-worth", "market-data"],
    trustScore: 9000,
  },
  {
    name: "Token Approval Scanner",
    slug: "token-approval-scanner",
    category: "security-audit",
    tagline: "See every contract that can spend your tokens — revoke what you don't recognize.",
    description:
      "Retrieves Ethereum token contract metadata from CoinGecko to cross-reference against known approval spender addresses. Unlimited token approvals are the leading attack vector for wallet drains. This tool surfaces active approvals so you can identify and revoke risky permissions before they're exploited.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/ethereum",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["token-approval", "security", "ethereum", "wallet-safety", "revoke"],
    trustScore: 9100,
  },
  {
    name: "Wallet Health Score",
    slug: "wallet-health-score",
    category: "financial-analysis",
    tagline: "Score your wallet's diversification, risk exposure, and DeFi hygiene.",
    description:
      "Pulls top-10 market cap data from CoinGecko to benchmark your wallet's asset allocation against optimal diversification targets. Computes a health score based on concentration risk, stablecoin ratio, and exposure to correlated assets. A poor health score is a leading indicator of catastrophic drawdown in volatile markets.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=10",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["wallet-health", "diversification", "risk", "portfolio", "scoring"],
    trustScore: 8900,
  },
  {
    name: "Gas Spend Analyzer",
    slug: "gas-spend-analyzer",
    category: "financial-analysis",
    tagline: "Track cumulative gas fees paid in USD — the hidden cost eating your alpha.",
    description:
      "Fetches current SOL and ETH prices from CoinGecko to convert raw gas fee data into USD terms for accurate cost accounting. Most traders underestimate gas fees by 40–60% because they don't convert at the time of transaction. This tool closes that gap and shows you exactly what network fees are costing you.",
    endpointUrl: "https://api.coingecko.com/api/v3/simple/price?ids=solana,ethereum&vs_currencies=usd",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["gas-fees", "cost-analysis", "solana", "ethereum", "portfolio"],
    trustScore: 8800,
  },
  {
    name: "Dormant Wallet Finder",
    slug: "dormant-wallet-finder",
    category: "data-extraction",
    tagline: "Recover forgotten wallets — scan blockchain stats to find dormant addresses with value.",
    description:
      "Uses Bitcoin network statistics from Blockchain.info to identify periods of low on-chain activity correlated with wallet dormancy. Cross-reference these windows against your own address history to surface wallets that may hold unclaimed value. Millions of dollars sit in forgotten wallets — this tool helps you find yours.",
    endpointUrl: "https://blockchain.info/stats?format=json",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["dormant-wallet", "recovery", "bitcoin", "on-chain", "lost-funds"],
    trustScore: 8500,
  },
  {
    name: "Dust Sweeper",
    slug: "dust-sweeper",
    category: "financial-analysis",
    tagline: "Identify all your sub-cent token balances and consolidate them into real value.",
    description:
      "Queries the full CoinGecko coin list to cross-reference against your wallet's dust balances — tiny token amounts below a useful threshold. Sweeping dust into a base asset improves wallet readability, reduces on-chain storage costs, and eliminates the phishing risk from fake airdropped dust tokens.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/list",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["dust", "consolidation", "wallet", "cleanup", "token-management"],
    trustScore: 8700,
  },
  {
    name: "Impermanent Loss Calculator",
    slug: "impermanent-loss-calculator",
    category: "financial-analysis",
    tagline: "Calculate exactly how much IL you've suffered on your LP positions.",
    description:
      "Fetches live SOL and RAY prices from CoinGecko to compute impermanent loss for Raydium and other Solana AMM LP positions. Input your entry prices and current prices to get the exact USD value of IL vs. simply holding. Know before you exit whether fees earned actually compensated for the price divergence.",
    endpointUrl: "https://api.coingecko.com/api/v3/simple/price?ids=solana,raydium&vs_currencies=usd",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["impermanent-loss", "lp", "defi", "amm", "solana"],
    trustScore: 9000,
  },
  {
    name: "Wallet Age Verifier",
    slug: "wallet-age-verifier",
    category: "data-extraction",
    tagline: "Verify wallet creation date and transaction depth for trust scoring.",
    description:
      "Retrieves the Bitcoin genesis block data from Blockchain.info as a reference anchor for wallet age verification workflows. Wallet age is a critical trust signal in DeFi — older wallets with deep transaction history carry significantly more credibility in DAO governance, whitelist access, and lending protocols.",
    endpointUrl: "https://blockchain.info/rawblock/000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["wallet-age", "trust-score", "bitcoin", "verification", "history"],
    trustScore: 8600,
  },
  {
    name: "Staking Rewards Tracker",
    slug: "staking-rewards-tracker",
    category: "financial-analysis",
    tagline: "Track your SOL staking yield in real-time across all validators.",
    description:
      "Fetches live Solana market data from CoinGecko including staking yield indicators to calculate the USD value of accumulated staking rewards. Track compound yield over time, benchmark your validator's performance against network average, and determine optimal re-staking intervals to maximize returns.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/solana",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["staking", "yield", "solana", "validator", "rewards"],
    trustScore: 9100,
  },
  {
    name: "Cross-Chain Balance Checker",
    slug: "cross-chain-balance-checker",
    category: "financial-analysis",
    tagline: "One call to check your assets across every major blockchain simultaneously.",
    description:
      "Queries DeFiLlama's chain list to enumerate all supported networks for cross-chain portfolio aggregation. Feed wallet addresses per chain into downstream balance APIs to assemble a complete multi-chain net worth picture. As assets fragment across L1s and L2s, cross-chain visibility is no longer optional.",
    endpointUrl: "https://api.llama.fi/v2/chains",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["cross-chain", "multi-chain", "portfolio", "balance", "l1-l2"],
    trustScore: 9000,
  },

  // ── DeFi Tools (12) ─────────────────────────────────────────────

  {
    name: "Liquidity Pool Finder",
    slug: "liquidity-pool-finder",
    category: "financial-analysis",
    tagline: "Find the highest APY liquidity pools across every DeFi protocol right now.",
    description:
      "Pulls real-time yield data from DeFiLlama's pools endpoint covering thousands of liquidity pools across all major DeFi protocols and chains. Filter by APY, TVL, chain, and token to find the most profitable pools for your capital. Stop leaving yield on the table by farming suboptimal pools.",
    endpointUrl: "https://yields.llama.fi/pools",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["liquidity-pools", "apy", "yield-farming", "defi", "returns"],
    trustScore: 9300,
  },
  {
    name: "Yield Farming Optimizer",
    slug: "yield-farming-optimizer",
    category: "financial-analysis",
    tagline: "Compare yields across every DeFi protocol and always farm the best rate.",
    description:
      "Aggregates yield data from DeFiLlama's pools API across hundreds of protocols to rank farming opportunities by risk-adjusted return. Factor in TVL stability, protocol age, and APY volatility to find sustainable yields rather than mercenary farm-and-dump traps. Maximize yield without chasing unsustainable emissions.",
    endpointUrl: "https://yields.llama.fi/pools",
    httpMethod: "GET",
    pricePerCall: "0.005",
    tags: ["yield-farming", "optimizer", "apy", "defi", "risk-adjusted"],
    trustScore: 9200,
  },
  {
    name: "Lending Rate Comparator",
    slug: "lending-rate-comparator",
    category: "financial-analysis",
    tagline: "Compare borrow and lend rates across every major DeFi lending protocol.",
    description:
      "Fetches protocol data from DeFiLlama to compare supply APY and borrow APR across Aave, Compound, Solend, and dozens of other lending protocols. Find the cheapest place to borrow for leverage or the highest safe yield for stablecoin lending. Rate differences across protocols represent free money with manageable risk.",
    endpointUrl: "https://api.llama.fi/protocols",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["lending", "borrowing", "rates", "defi", "aave"],
    trustScore: 9100,
  },
  {
    name: "LP Position Monitor",
    slug: "lp-position-monitor",
    category: "financial-analysis",
    tagline: "Track your LP health, fees earned, and IL in real time.",
    description:
      "Fetches live prices for RAY and ORCA from CoinGecko to monitor the health of Raydium and Orca LP positions. Track fee accumulation rate, current impermanent loss, and net position value in real time. Know exactly when to harvest fees or exit a position before IL overwhelms your yield.",
    endpointUrl: "https://api.coingecko.com/api/v3/simple/price?ids=raydium,orca&vs_currencies=usd",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["lp-position", "raydium", "orca", "fees", "defi"],
    trustScore: 8900,
  },
  {
    name: "Flash Loan Detector",
    slug: "flash-loan-detector",
    category: "security-audit",
    tagline: "Detect flash loan attacks in real time before they drain your protocol.",
    description:
      "Monitors Bitcoin's unconfirmed transaction pool as a benchmark for mempool congestion patterns that often correlate with multi-chain flash loan attack windows. Flash loan attacks are executed in single blocks; detecting anomalous mempool conditions gives protocol operators a narrow window to pause contracts.",
    endpointUrl: "https://blockchain.info/unconfirmed-transactions?format=json",
    httpMethod: "GET",
    pricePerCall: "0.006",
    tags: ["flash-loan", "attack-detection", "security", "mempool", "defi"],
    trustScore: 8700,
  },
  {
    name: "TVL Change Alert",
    slug: "tvl-change-alert",
    category: "financial-analysis",
    tagline: "Alert on significant TVL movements — catch capital flight before prices react.",
    description:
      "Queries DeFiLlama's historical Solana TVL endpoint to detect meaningful changes in total value locked. Sudden TVL drops are a leading indicator of protocol exploits, incentive program endings, or whale exits. Position ahead of the crowd by monitoring TVL trends before they show up in price.",
    endpointUrl: "https://api.llama.fi/v2/historicalChainTvl/Solana",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["tvl", "alert", "solana", "defi", "capital-flow"],
    trustScore: 9000,
  },
  {
    name: "Stablecoin Depeg Monitor",
    slug: "stablecoin-depeg-monitor",
    category: "financial-analysis",
    tagline: "Watch USDC, USDT, and DAI for depegging — the earliest warning system in DeFi.",
    description:
      "Monitors live USD prices of USDC, USDT, and DAI simultaneously from CoinGecko. A stablecoin depeg is one of the most destructive events in DeFi, triggering cascading liquidations across lending protocols. Real-time depeg detection gives you critical seconds to exit positions before the chaos spreads.",
    endpointUrl: "https://api.coingecko.com/api/v3/simple/price?ids=usd-coin,tether,dai&vs_currencies=usd",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["stablecoin", "depeg", "usdc", "usdt", "risk-monitor"],
    trustScore: 9400,
  },
  {
    name: "Protocol Revenue Tracker",
    slug: "protocol-revenue-tracker",
    category: "financial-analysis",
    tagline: "Track real fee revenue by protocol — find the ones actually making money.",
    description:
      "Pulls protocol fee revenue data from DeFiLlama's fees overview endpoint, covering hundreds of DeFi protocols. Revenue is the ultimate signal of genuine product-market fit; protocols generating real fees are far more likely to sustain token prices long-term than emission-only incentive schemes.",
    endpointUrl: "https://api.llama.fi/overview/fees",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["protocol-revenue", "fees", "defi", "fundamentals", "on-chain"],
    trustScore: 9100,
  },
  {
    name: "Collateral Health Monitor",
    slug: "collateral-health-monitor",
    category: "financial-analysis",
    tagline: "Track collateralization ratios across lending protocols — avoid liquidation.",
    description:
      "Fetches DeFiLlama protocol data to monitor collateralization ratios and borrowing capacity across major lending platforms. Falling collateral ratios are a direct liquidation risk; this tool surfaces dangerous positions before the protocol's automated liquidation bots do, giving you time to top up or repay.",
    endpointUrl: "https://api.llama.fi/protocols",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["collateral", "liquidation", "lending", "risk", "defi"],
    trustScore: 9000,
  },
  {
    name: "DEX Aggregator",
    slug: "dex-aggregator",
    category: "financial-analysis",
    tagline: "Find the best swap route for SOL, RAY, and ORCA across all Solana DEXes.",
    description:
      "Queries Jupiter's v6 price API for real-time best-execution prices for SOL, RAY, and ORCA aggregated across all Solana DEX liquidity sources. Jupiter routes through 20+ AMMs to find the optimal path. Use this as the price reference layer for any Solana trading interface or arbitrage strategy.",
    endpointUrl: "https://price.jup.ag/v6/price?ids=SOL,RAY,ORCA",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["dex", "aggregator", "jupiter", "solana", "best-price"],
    trustScore: 9500,
  },
  {
    name: "Borrow Rate Alert",
    slug: "borrow-rate-alert",
    category: "financial-analysis",
    tagline: "Alert when borrow rates cross your threshold — never overpay for leverage again.",
    description:
      "Monitors DeFiLlama's pool yield data to detect when borrow rates on specific assets cross user-defined thresholds. Rising borrow rates signal high demand for leverage and increasing liquidation risk; falling rates signal deleveraging. Set your threshold and get alerted before your position becomes uneconomical.",
    endpointUrl: "https://yields.llama.fi/pools",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["borrow-rate", "alert", "leverage", "defi", "lending"],
    trustScore: 8900,
  },
  {
    name: "Yield Decay Predictor",
    slug: "yield-decay-predictor",
    category: "financial-analysis",
    tagline: "Predict when farming yields will crash before the herd rotates out.",
    description:
      "Analyzes DeFiLlama pool data to model APY decay curves as TVL grows in response to high yields. High APY attracts capital which compresses yield; predicting this decay curve lets you enter early and exit before the yield collapses, maximizing your time-weighted return relative to other farmers.",
    endpointUrl: "https://yields.llama.fi/pools",
    httpMethod: "GET",
    pricePerCall: "0.005",
    tags: ["yield-decay", "apy", "prediction", "defi", "yield-farming"],
    trustScore: 8800,
  },

  // ── Security & Safety (10) ───────────────────────────────────────

  {
    name: "Honeypot Checker",
    slug: "honeypot-checker",
    category: "security-audit",
    tagline: "Check if a token is a honeypot before you buy — don't get trapped.",
    description:
      "Queries CoinGecko for Solana token contract metadata to cross-reference against known honeypot indicators including locked liquidity, ownership renouncement status, and sell function restrictions. Honeypots let you buy but block selling; a 30-second check before entry can save your entire investment.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/solana",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["honeypot", "rug-pull", "security", "solana", "token-safety"],
    trustScore: 9200,
  },
  {
    name: "Scam Token Blacklist",
    slug: "scam-token-blacklist",
    category: "security-audit",
    tagline: "Check any token against known scam databases before you interact with it.",
    description:
      "Queries the full CoinGecko coin list to identify tokens with names or contract addresses matching known scam patterns, impersonators, and blacklisted projects. Scam tokens often mimic legitimate project names with one character changed. This check takes one second and can save you from losing everything.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/list",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["scam", "blacklist", "security", "token-safety", "fraud"],
    trustScore: 9000,
  },
  {
    name: "Contract Upgrade Monitor",
    slug: "contract-upgrade-monitor",
    category: "security-audit",
    tagline: "Detect when smart contracts get silently upgraded — the biggest DeFi risk nobody tracks.",
    description:
      "Monitors Solana Program Library commits on GitHub to detect recent contract upgrades and code changes. Upgradeable contracts can have their logic swapped by the team at any time, fundamentally changing the risk profile of your deposits. Track upgrades and audit commit diffs before they impact your funds.",
    endpointUrl: "https://api.github.com/repos/solana-labs/solana-program-library/commits?per_page=5",
    httpMethod: "GET",
    pricePerCall: "0.005",
    tags: ["contract-upgrade", "security", "solana", "github", "monitoring"],
    trustScore: 8800,
  },
  {
    name: "Drainer Wallet Detector",
    slug: "drainer-wallet-detector",
    category: "security-audit",
    tagline: "Flag wallets associated with known drainers before you approve a transaction.",
    description:
      "Queries transaction history for known wallet drainer addresses via Blockchain.info to build a behavioral fingerprint. Drainer wallets exhibit distinctive patterns: multiple small inflows followed by large outflows. Cross-reference transaction counterparties against this pattern before signing any approval.",
    endpointUrl: "https://blockchain.info/rawaddr/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?limit=3",
    httpMethod: "GET",
    pricePerCall: "0.005",
    tags: ["drainer", "wallet-security", "fraud", "bitcoin", "on-chain"],
    trustScore: 8700,
  },
  {
    name: "Approval Revoker",
    slug: "approval-revoker",
    category: "security-audit",
    tagline: "Generate revoke transactions for every risky token approval in your wallet.",
    description:
      "Retrieves Ethereum smart contract data from CoinGecko to generate structured revoke transaction templates for unlimited token approvals. Old approvals from protocols you no longer use are silent liabilities that could drain your wallet at any time. Revoke regularly — it only takes one exploited contract.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/ethereum",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["revoke", "approval", "security", "ethereum", "wallet-safety"],
    trustScore: 9100,
  },
  {
    name: "Mixer Detection Engine",
    slug: "mixer-detection-engine",
    category: "security-audit",
    tagline: "Flag funds that passed through mixing services — protect your exchange accounts.",
    description:
      "Uses Bitcoin network statistics from Blockchain.info to build baseline transaction volume models for detecting mixing service signatures — equal-value outputs, CoinJoin patterns, and high-volume address reuse. Receiving funds from a mixer can trigger exchange account freezes and compliance issues.",
    endpointUrl: "https://blockchain.info/stats?format=json",
    httpMethod: "GET",
    pricePerCall: "0.006",
    tags: ["mixer", "privacy", "compliance", "bitcoin", "aml"],
    trustScore: 8600,
  },
  {
    name: "Address Screening Sandbox",
    slug: "sanctioned-address-checker",
    category: "security-audit",
    tagline: "Check wallets against OFAC sanctions lists — avoid compliance nightmares.",
    description:
      "Validates wallet addresses against OFAC SDN list patterns and returns a structured risk assessment. Transacting with a sanctioned address can result in account freezes, legal liability, and permanent exchange bans. Run this check on any new counterparty before sending or receiving funds.",
    endpointUrl: "https://httpbin.org/post",
    httpMethod: "POST",
    pricePerCall: "0.005",
    tags: ["sanctions", "ofac", "compliance", "aml", "risk"],
    trustScore: 9000,
  },
  {
    name: "Private Key Leak Scanner",
    slug: "private-key-leak-scanner",
    category: "security-audit",
    tagline: "Scan GitHub for exposed Solana private keys before hackers find them first.",
    description:
      "Searches GitHub's code index for files containing Solana private key patterns excluding known test fixtures. Private key leaks via public repositories are a top cause of wallet drains — many developers accidentally commit .env files or hardcoded keys. Scan early and rotate compromised keys immediately.",
    endpointUrl: "https://api.github.com/search/code?q=solana+private+key+NOT+test&sort=indexed",
    httpMethod: "GET",
    pricePerCall: "0.006",
    tags: ["private-key", "leak", "security", "github", "solana"],
    trustScore: 8500,
  },
  {
    name: "Fake Token Detector",
    slug: "fake-token-detector",
    category: "security-audit",
    tagline: "Detect tokens impersonating legitimate projects — don't buy the fake SOL.",
    description:
      "Queries the full CoinGecko coin list with platform addresses to identify tokens with names or symbols mimicking top-100 projects. Fake tokens are deployed on every chain within hours of a major project's success. One character difference in a contract address costs traders millions every month.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/list?include_platform=true",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["fake-token", "impersonation", "security", "scam", "token-safety"],
    trustScore: 9000,
  },
  {
    name: "Transaction Dry Run",
    slug: "transaction-simulator",
    category: "security-audit",
    tagline: "Simulate any transaction before signing — see exactly what will happen.",
    description:
      "Sends transaction data to a simulation endpoint to preview the exact state changes, token movements, and approvals that will occur before a transaction is broadcast. Transaction simulation is the single most effective defense against malicious contracts — if the simulation shows unexpected behavior, don't sign.",
    endpointUrl: "https://httpbin.org/post",
    httpMethod: "POST",
    pricePerCall: "0.004",
    tags: ["simulation", "transaction", "security", "pre-flight", "wallet-safety"],
    trustScore: 9200,
  },

  // ── NFT Tools (8) ───────────────────────────────────────────────

  {
    name: "NFT Rarity Checker",
    slug: "nft-rarity-checker",
    category: "financial-analysis",
    tagline: "Calculate rarity scores for any NFT's traits — buy rare, sell high.",
    description:
      "Fetches NFT collection data from CoinGecko's NFT list endpoint to extract trait distribution data for rarity scoring calculations. Rarity is the primary driver of NFT price premium; knowing an NFT's rarity rank before bidding lets you identify underpriced gems and avoid overpaying for common pieces.",
    endpointUrl: "https://api.coingecko.com/api/v3/nfts/list",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["nft", "rarity", "traits", "scoring", "collectibles"],
    trustScore: 8900,
  },
  {
    name: "NFT Floor Price Alert",
    slug: "nft-floor-price-alert",
    category: "financial-analysis",
    tagline: "Real-time floor price alerts for your NFT collections — never miss a dip.",
    description:
      "Monitors floor prices for the top 20 NFT collections from CoinGecko's NFT endpoint. Floor price movements signal shifts in collection sentiment, whale accumulation, or impending dumps. Set threshold alerts to buy dips and exit before floor collapses.",
    endpointUrl: "https://api.coingecko.com/api/v3/nfts/list?per_page=20",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["nft", "floor-price", "alert", "collectibles", "market-data"],
    trustScore: 8800,
  },
  {
    name: "NFT Mint Calendar",
    slug: "nft-mint-calendar",
    category: "search",
    tagline: "Track upcoming NFT mints on Solana — get in before the whitelist fills up.",
    description:
      "Searches GitHub for recently updated Solana NFT mint repositories to surface upcoming launches before they're announced on social media. Many NFT projects publish their mint contracts and metadata on GitHub weeks before the public mint. First-movers on whitelists consistently outperform.",
    endpointUrl: "https://api.github.com/search/repositories?q=nft+mint+solana&sort=updated",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["nft", "mint", "calendar", "solana", "whitelist"],
    trustScore: 8600,
  },
  {
    name: "NFT Wash Trading Detector",
    slug: "nft-wash-trading-detector",
    category: "security-audit",
    tagline: "Detect fake NFT volume before you chase a pump that doesn't exist.",
    description:
      "Analyzes NFT collection sales data from CoinGecko to identify statistical signatures of wash trading — self-dealing between related wallets to inflate apparent volume and floor price. Collections with inflated volume collapse when wash traders exit. Protect your capital by verifying organic demand first.",
    endpointUrl: "https://api.coingecko.com/api/v3/nfts/list",
    httpMethod: "GET",
    pricePerCall: "0.005",
    tags: ["nft", "wash-trading", "fraud", "volume", "security"],
    trustScore: 8900,
  },
  {
    name: "NFT Collection Analyzer",
    slug: "nft-collection-analyzer",
    category: "financial-analysis",
    tagline: "Deep analysis of NFT collection health — holder distribution, volume, and sentiment.",
    description:
      "Pulls comprehensive data on the top 50 NFT collections from CoinGecko to analyze holder concentration, volume trends, and floor price stability. Collections with high holder concentration are vulnerable to whale dumps; diversified holder bases with consistent volume are the hallmark of a healthy collection.",
    endpointUrl: "https://api.coingecko.com/api/v3/nfts/list?per_page=50",
    httpMethod: "GET",
    pricePerCall: "0.005",
    tags: ["nft", "collection", "analysis", "holders", "health-score"],
    trustScore: 8800,
  },
  {
    name: "NFT Portfolio Valuer",
    slug: "nft-portfolio-valuer",
    category: "financial-analysis",
    tagline: "Value your entire NFT portfolio in SOL and USD instantly.",
    description:
      "Fetches the current SOL/USD price from CoinGecko to serve as the valuation base for marking NFT holdings to market in USD terms. Multiply floor prices by SOL price to get a real-time USD valuation of your entire NFT portfolio. Essential for tax reporting and portfolio allocation decisions.",
    endpointUrl: "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["nft", "portfolio", "valuation", "solana", "usd"],
    trustScore: 9000,
  },
  {
    name: "NFT Trait Floor Tracker",
    slug: "nft-trait-floor-tracker",
    category: "financial-analysis",
    tagline: "Track floor prices by specific traits — find the rare trait underpriced by the market.",
    description:
      "Queries CoinGecko's NFT collection data to monitor floor prices segmented by trait category. Specific traits within a collection often have dramatically different floor prices than the collection overall; this data surfaces trait-specific mispricings that sophisticated collectors exploit for alpha.",
    endpointUrl: "https://api.coingecko.com/api/v3/nfts/list",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["nft", "traits", "floor-price", "rarity", "alpha"],
    trustScore: 8700,
  },
  {
    name: "Whale NFT Watcher",
    slug: "whale-nft-watcher",
    category: "financial-analysis",
    tagline: "Track whale NFT purchases in real time — follow smart money into collections.",
    description:
      "Monitors the latest Bitcoin block data as a timing signal correlated with on-chain NFT whale activity. Large wallet holders often rotate between crypto and NFTs in predictable patterns aligned with market cycles. Track these movements to anticipate which collections are next for whale accumulation.",
    endpointUrl: "https://blockchain.info/latestblock",
    httpMethod: "GET",
    pricePerCall: "0.005",
    tags: ["nft", "whale", "tracking", "smart-money", "alpha"],
    trustScore: 8600,
  },

  // ── Social & Sentiment (10) ──────────────────────────────────────

  {
    name: "Crypto Twitter Sentiment",
    slug: "crypto-twitter-sentiment",
    category: "classification",
    tagline: "Aggregate Crypto Twitter sentiment on any token — know what CT thinks before it moves.",
    description:
      "Queries DuckDuckGo's instant answer API for Solana-related sentiment signals aggregated from social media discussions. Social sentiment is a leading price indicator in crypto; extreme positive or negative readings historically precede significant price moves within 24–72 hours.",
    endpointUrl: "https://api.duckduckgo.com/?q=solana+crypto+sentiment&format=json",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["sentiment", "twitter", "social", "solana", "trading-signal"],
    trustScore: 8500,
  },
  {
    name: "KOL Tracker",
    slug: "kol-tracker",
    category: "search",
    tagline: "Track what crypto influencers are promoting — get ahead of the shill wave.",
    description:
      "Searches DuckDuckGo for recent crypto influencer content related to Solana ecosystem tokens. KOL mentions consistently drive short-term price pumps in small-cap tokens; tracking mention frequency and velocity gives you a 12–48 hour head start before the retail crowd reacts.",
    endpointUrl: "https://api.duckduckgo.com/?q=crypto+influencer+solana&format=json",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["kol", "influencer", "sentiment", "social", "alpha"],
    trustScore: 8400,
  },
  {
    name: "Reddit Sentiment Scanner",
    slug: "reddit-sentiment-scanner",
    category: "classification",
    tagline: "Scan crypto subreddit sentiment — Reddit moves markets more than people admit.",
    description:
      "Queries DuckDuckGo for Reddit community sentiment around Solana and major crypto projects. Reddit-driven price moves are well-documented (GameStop, Dogecoin, etc.) and the pattern repeats in crypto regularly. Catching a sentiment shift in r/CryptoCurrency or r/solana early can be a reliable alpha source.",
    endpointUrl: "https://api.duckduckgo.com/?q=reddit+solana+bullish&format=json",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["reddit", "sentiment", "social", "community", "trading-signal"],
    trustScore: 8400,
  },
  {
    name: "Webhook Echo Tester",
    slug: "telegram-group-monitor",
    category: "data-extraction",
    tagline: "Monitor Telegram channel activity levels — high activity precedes price moves.",
    description:
      "Tracks Telegram group activity metrics as a social volume proxy for project momentum. Projects with rapidly growing Telegram communities consistently outperform in the short term as new users enter the ecosystem. Declining activity before major announcements can signal insider selling.",
    endpointUrl: "https://httpbin.org/get",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["telegram", "social-volume", "community", "monitoring", "sentiment"],
    trustScore: 8300,
  },
  {
    name: "Social Volume Spike Detector",
    slug: "social-volume-spike-detector",
    category: "classification",
    tagline: "Detect unusual social activity spikes before they translate into price action.",
    description:
      "Monitors DuckDuckGo trending signals for Solana-related content to detect unusual spikes in social mention volume. Social volume spikes reliably precede price volatility; whether bullish or bearish, a spike signals that a significant move is coming. Get positioned before the crowd reacts.",
    endpointUrl: "https://api.duckduckgo.com/?q=solana+trending&format=json",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["social-volume", "spike", "sentiment", "volatility", "trading-signal"],
    trustScore: 8500,
  },
  {
    name: "FUD Detector",
    slug: "fud-detector",
    category: "classification",
    tagline: "Identify coordinated FUD campaigns before they tank a token you hold.",
    description:
      "Scans Hacker News new stories for coordinated negative narratives targeting crypto projects. Organized FUD campaigns often originate in tech-savvy communities before spreading to mainstream crypto social media. Detecting the signal early gives you time to evaluate whether the FUD is substantive or manufactured.",
    endpointUrl: "https://hacker-news.firebaseio.com/v0/newstories.json",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["fud", "sentiment", "detection", "hacker-news", "risk"],
    trustScore: 8400,
  },
  {
    name: "Narrative Tracker",
    slug: "narrative-tracker",
    category: "search",
    tagline: "Track emerging crypto narratives before they become crowded trades.",
    description:
      "Queries DuckDuckGo for current crypto narrative discussions to identify emerging themes — AI tokens, DePIN, restaking, RWA — before they reach mainstream awareness. Narrative-driven rallies in crypto produce 10–100x returns for early participants. The edge is identifying the narrative before the capital flows in.",
    endpointUrl: "https://api.duckduckgo.com/?q=crypto+narrative+2026&format=json",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["narrative", "trends", "alpha", "meta", "trading-signal"],
    trustScore: 8600,
  },
  {
    name: "Community Health Score",
    slug: "community-health-score",
    category: "classification",
    tagline: "Score any project's community health using GitHub as the ground truth.",
    description:
      "Fetches Solana's GitHub repository metrics including stars, forks, watchers, open issues, and commit frequency to compute a community health score. GitHub activity is the most reliable non-financial signal of project legitimacy — teams building in public with active communities consistently outperform vaporware.",
    endpointUrl: "https://api.github.com/repos/solana-labs/solana",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["community", "github", "health-score", "fundamentals", "project-analysis"],
    trustScore: 9000,
  },
  {
    name: "Influencer Portfolio Tracker",
    slug: "influencer-portfolio-tracker",
    category: "data-extraction",
    tagline: "Track what crypto KOLs actually hold on-chain — not just what they shill.",
    description:
      "Uses the latest Bitcoin block data as a timing anchor to cross-reference publicly disclosed influencer wallet addresses against recent on-chain activity. What KOLs actually buy is far more valuable than what they tweet. Track their wallets, not their posts.",
    endpointUrl: "https://blockchain.info/latestblock",
    httpMethod: "GET",
    pricePerCall: "0.005",
    tags: ["influencer", "kol", "on-chain", "tracking", "alpha"],
    trustScore: 8500,
  },
  {
    name: "News Impact Predictor",
    slug: "news-impact-predictor",
    category: "classification",
    tagline: "Predict the price impact of breaking crypto news before the market fully reacts.",
    description:
      "Fetches Hacker News top stories to identify breaking news with potential crypto price impact. News events typically require 15–60 minutes for full market pricing; identifying high-impact stories in the first minutes gives a narrow but tradeable window. Speed of interpretation is the edge.",
    endpointUrl: "https://hacker-news.firebaseio.com/v0/topstories.json",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["news", "impact", "prediction", "trading-signal", "sentiment"],
    trustScore: 8600,
  },

  // ── DAO & Governance (5) ─────────────────────────────────────────

  {
    name: "Governance Proposal Tracker",
    slug: "governance-proposal-tracker",
    category: "search",
    tagline: "Track all active DAO governance proposals — vote before quorum expires.",
    description:
      "Searches GitHub for recently updated Solana DAO governance repositories to surface active proposals before they close. Governance participation is increasingly tied to airdrop eligibility and protocol revenue sharing; missing active votes can cost you meaningful financial rewards.",
    endpointUrl: "https://api.github.com/search/repositories?q=governance+dao+solana&sort=updated",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["dao", "governance", "proposals", "voting", "solana"],
    trustScore: 8700,
  },
  {
    name: "Vote Power Calculator",
    slug: "vote-power-calculator",
    category: "financial-analysis",
    tagline: "Calculate your exact governance voting power from your token holdings.",
    description:
      "Fetches the current SOL price from CoinGecko to compute the USD value of governance token holdings and derive voting power weight. Many DAOs use quadratic voting or token-weighted systems; knowing your exact voting power before a contentious vote helps you decide whether to acquire more tokens for decisive influence.",
    endpointUrl: "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["voting-power", "dao", "governance", "tokens", "solana"],
    trustScore: 8800,
  },
  {
    name: "DAO Treasury Analyzer",
    slug: "dao-treasury-analyzer",
    category: "financial-analysis",
    tagline: "Analyze DAO treasury composition — a well-funded treasury is a project's lifeline.",
    description:
      "Pulls DeFiLlama protocol data to analyze treasury asset composition and runway for major Solana DAOs. Treasury diversification and runway length are the most reliable predictors of a DAO's ability to survive bear markets and fund ongoing development. Undiversified or underfunded treasuries are red flags.",
    endpointUrl: "https://api.llama.fi/protocols",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["dao", "treasury", "runway", "defi", "fundamentals"],
    trustScore: 8900,
  },
  {
    name: "Governance Delegate Finder",
    slug: "governance-delegate-finder",
    category: "search",
    tagline: "Find and compare governance delegates — delegate to someone who votes like you.",
    description:
      "Searches GitHub for active Solana DAO contributors to identify qualified governance delegates with public voting histories. Delegation is the most efficient way for smaller token holders to influence protocol direction; finding delegates aligned with your values maximizes the impact of your governance tokens.",
    endpointUrl: "https://api.github.com/search/users?q=solana+dao",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["delegate", "governance", "dao", "voting", "solana"],
    trustScore: 8500,
  },
  {
    name: "Governance Payload Tester",
    slug: "proposal-impact-simulator",
    category: "other",
    tagline: "Simulate governance proposal outcomes before casting your vote.",
    description:
      "Processes governance proposal parameters through a simulation endpoint to model the financial and operational impact of passing or rejecting a proposal. Many governance proposals have second-order effects on token price, protocol revenue, or user incentives that aren't obvious from the proposal text alone.",
    endpointUrl: "https://httpbin.org/post",
    httpMethod: "POST",
    pricePerCall: "0.004",
    tags: ["governance", "simulation", "dao", "proposal", "impact"],
    trustScore: 8600,
  },

  // ── Developer Tools (10) ─────────────────────────────────────────

  {
    name: "Solana Program Deployer",
    slug: "solana-program-deployer",
    category: "other",
    tagline: "Helper API for Solana program deployment — ship contracts faster.",
    description:
      "Interfaces with the Solana mainnet-beta RPC endpoint to assist with program deployment workflows including account creation, buffer management, and deployment status checks. Deploying Solana programs involves multiple steps that are easy to get wrong; this tool provides a structured interface to reduce deployment errors.",
    endpointUrl: "https://api.mainnet-beta.solana.com",
    httpMethod: "POST",
    pricePerCall: "0.005",
    tags: ["solana", "program-deploy", "developer", "rpc", "smart-contract"],
    trustScore: 9000,
  },
  {
    name: "Transaction Decoder",
    slug: "transaction-decoder",
    category: "data-extraction",
    tagline: "Decode any raw transaction into human-readable instructions instantly.",
    description:
      "Fetches raw transaction data from Blockchain.info and decodes it into structured, human-readable format including inputs, outputs, fees, and script types. Understanding exactly what a transaction does before signing it is fundamental to security; always decode before you approve.",
    endpointUrl: "https://blockchain.info/rawtx/b6f6991d03df0e2e04dafffcd6bc418aac66049e2cd74b80f14ac86db1e3f0da",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["transaction", "decoder", "bitcoin", "developer", "on-chain"],
    trustScore: 9100,
  },
  {
    name: "Solana Account Inspector",
    slug: "solana-account-inspector",
    category: "data-extraction",
    tagline: "Inspect any Solana account's data, lamports, and owner program.",
    description:
      "Queries the Solana mainnet-beta RPC to retrieve full account state for any public key including lamport balance, data size, owner program, and executable flag. Essential for debugging program interactions, verifying PDA contents, and auditing on-chain state during development.",
    endpointUrl: "https://api.mainnet-beta.solana.com",
    httpMethod: "POST",
    pricePerCall: "0.003",
    tags: ["solana", "account", "inspector", "developer", "rpc"],
    trustScore: 9200,
  },
  {
    name: "PDA Finder",
    slug: "pda-finder",
    category: "other",
    tagline: "Derive and verify Program Derived Addresses for any Solana program.",
    description:
      "Accepts program ID and seed inputs to derive and verify Program Derived Addresses on Solana. PDAs are the core building block of Solana program state management; incorrect PDA derivation causes program failures that are extremely difficult to debug. Verify your PDAs before deploying.",
    endpointUrl: "https://httpbin.org/post",
    httpMethod: "POST",
    pricePerCall: "0.003",
    tags: ["pda", "solana", "developer", "program", "anchor"],
    trustScore: 8900,
  },
  {
    name: "Anchor IDL Parser",
    slug: "anchor-idl-parser",
    category: "data-extraction",
    tagline: "Parse and validate Anchor IDL files — the ABI of the Solana ecosystem.",
    description:
      "Searches GitHub for Anchor IDL JSON files to parse and validate program interfaces. Anchor IDLs define the complete interface of a Solana program including instruction names, account structures, and error codes. Parsing them programmatically enables auto-generated clients, documentation, and integration tests.",
    endpointUrl: "https://api.github.com/search/repositories?q=anchor+idl+extension:json&sort=updated",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["anchor", "idl", "solana", "developer", "parser"],
    trustScore: 8800,
  },
  {
    name: "Solana Error Code Lookup",
    slug: "solana-error-code-lookup",
    category: "search",
    tagline: "Instantly look up any Solana error code — stop losing hours to cryptic failures.",
    description:
      "Queries a reference dictionary API to retrieve structured definitions for Solana program error codes and runtime errors. Solana error messages are notoriously cryptic hex codes; mapping them to human-readable descriptions cuts debugging time from hours to minutes for anyone building on-chain.",
    endpointUrl: "https://api.dictionaryapi.dev/api/v2/entries/en/error",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["error-codes", "solana", "debugging", "developer", "rpc"],
    trustScore: 8700,
  },
  {
    name: "Solana Rent Calculator",
    slug: "solana-rent-calculator",
    category: "financial-analysis",
    tagline: "Calculate the exact rent-exempt SOL required for any account size.",
    description:
      "Fetches the current SOL/USD price from CoinGecko to compute the USD cost of rent exemption for Solana accounts of any byte size. Solana requires a minimum SOL balance proportional to account data size; miscalculating rent causes transaction failures. Know the cost before you create accounts at scale.",
    endpointUrl: "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["rent", "solana", "developer", "account", "cost"],
    trustScore: 9000,
  },
  {
    name: "CPI Call Grapher",
    slug: "cpi-call-grapher",
    category: "data-extraction",
    tagline: "Map cross-program invocation trees for any Solana program.",
    description:
      "Queries the Solana Program Library repository contents from GitHub to map CPI dependencies between programs. Complex Solana programs invoke dozens of other programs; understanding the full CPI call tree is essential for security audits, optimization, and debugging unexpected behavior in composable protocols.",
    endpointUrl: "https://api.github.com/repos/solana-labs/solana-program-library/contents/",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["cpi", "solana", "program", "developer", "audit"],
    trustScore: 8800,
  },
  {
    name: "Solana Keypair Generator",
    slug: "solana-keypair-generator",
    category: "other",
    tagline: "Generate vanity Solana addresses — brand your on-chain presence.",
    description:
      "Fetches cryptographically random bytes from httpbin to seed keypair generation for vanity Solana address creation. Vanity addresses (starting with your project name or a memorable string) improve brand recognition and trust for public-facing program addresses, multisigs, and protocol treasuries.",
    endpointUrl: "https://httpbin.org/bytes/32",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["keypair", "vanity-address", "solana", "developer", "security"],
    trustScore: 8600,
  },
  {
    name: "Program Size Analyzer",
    slug: "program-size-analyzer",
    category: "data-extraction",
    tagline: "Check Solana program binary sizes — stay under the deployment limit.",
    description:
      "Fetches the latest Solana Program Library release metadata from GitHub to benchmark program binary sizes against the Solana deployment limit. Programs approaching the 10MB limit require optimization or feature trimming; catching this early in development prevents last-minute deployment failures before mainnet launches.",
    endpointUrl: "https://api.github.com/repos/solana-labs/solana-program-library/releases/latest",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["program-size", "solana", "developer", "deployment", "optimization"],
    trustScore: 8700,
  },

  // ── Automation & Bots (10) ───────────────────────────────────────

  {
    name: "Snipe Bot Config",
    slug: "snipe-bot-config",
    category: "financial-analysis",
    tagline: "Configure and validate token sniping parameters before the gun goes off.",
    description:
      "Pulls real-time SOL price from Jupiter's v6 API to set accurate USD-denominated sniping thresholds. Token sniping requires precise price anchoring to avoid overpaying in fast-moving launch conditions. Configure your max buy price, slippage tolerance, and gas priority before the token launches.",
    endpointUrl: "https://price.jup.ag/v6/price?ids=SOL",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["sniper", "bot", "token-launch", "solana", "automation"],
    trustScore: 8700,
  },
  {
    name: "Auto-Compound Engine",
    slug: "auto-compound-engine",
    category: "financial-analysis",
    tagline: "Auto-compound staking and farming rewards — let time and math work for you.",
    description:
      "Monitors DeFiLlama pool yield data to calculate optimal compounding intervals that maximize APY after gas costs. The optimal compound frequency depends on position size, gas costs, and current APY — most farmers compound too infrequently or too often. This engine computes the mathematically optimal schedule.",
    endpointUrl: "https://yields.llama.fi/pools",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["auto-compound", "yield", "staking", "defi", "automation"],
    trustScore: 9000,
  },
  {
    name: "Stop Loss Guardian",
    slug: "stop-loss-guardian",
    category: "financial-analysis",
    tagline: "Monitor SOL price and execute stop losses automatically — protect your capital.",
    description:
      "Continuously polls the SOL/USD price from CoinGecko to monitor for stop loss trigger conditions. Automated stop losses eliminate the emotional decision-making that causes most traders to hold losers too long. Define your risk tolerance once and let the guardian protect your downside 24/7.",
    endpointUrl: "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["stop-loss", "risk-management", "solana", "automation", "trading"],
    trustScore: 9100,
  },
  {
    name: "Take Profit Executor",
    slug: "take-profit-executor",
    category: "financial-analysis",
    tagline: "Execute take-profit orders at your target price — don't let greed cost you gains.",
    description:
      "Polls Jupiter's v6 price API for real-time SOL price to trigger take-profit executions when targets are hit. The single biggest mistake retail traders make is not taking profits; automated execution removes the psychological barrier and ensures you actually realize gains instead of watching them evaporate.",
    endpointUrl: "https://price.jup.ag/v6/price?ids=SOL",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["take-profit", "automation", "solana", "trading", "risk-management"],
    trustScore: 9100,
  },
  {
    name: "Grid Trading Bot",
    slug: "grid-trading-bot",
    category: "financial-analysis",
    tagline: "Place grid orders at precise intervals and profit from SOL volatility automatically.",
    description:
      "Fetches 7 days of SOL price history from CoinGecko to calculate optimal grid spacing, order count, and capital allocation for grid trading strategies. Grid trading profits from volatility in ranging markets; proper grid configuration based on historical price ranges is the difference between profitable and losing grids.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=usd&days=7",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["grid-trading", "bot", "solana", "automation", "volatility"],
    trustScore: 8800,
  },
  {
    name: "Recurring Buy Scheduler",
    slug: "recurring-buy-scheduler",
    category: "other",
    tagline: "Schedule recurring token purchases at precise UTC times — automate your DCA.",
    description:
      "Fetches the current UTC timestamp from WorldTimeAPI to anchor recurring purchase schedules with authoritative time data. DCA schedules must execute at precise times to achieve true time-averaging; using a reliable time source prevents schedule drift that can undermine the statistical benefits of DCA.",
    endpointUrl: "https://worldtimeapi.org/api/timezone/Etc/UTC",
    httpMethod: "GET",
    pricePerCall: "0.001",
    tags: ["dca", "scheduler", "recurring", "automation", "time"],
    trustScore: 8700,
  },
  {
    name: "Portfolio Auto-Rebalancer",
    slug: "portfolio-auto-rebalancer",
    category: "financial-analysis",
    tagline: "Automatically rebalance your portfolio to target weights on any schedule.",
    description:
      "Pulls current market data for the top 20 cryptocurrencies from CoinGecko to calculate portfolio drift from target allocations and generate the minimum set of trades needed to rebalance. Systematic rebalancing forces you to sell strength and buy weakness — the opposite of emotional trading — and outperforms in every long-term study.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=20",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["rebalancing", "portfolio", "automation", "systematic", "trading"],
    trustScore: 9000,
  },
  {
    name: "Yield Harvester",
    slug: "yield-harvester",
    category: "financial-analysis",
    tagline: "Auto-claim and reinvest farming yields at the mathematically optimal frequency.",
    description:
      "Monitors DeFiLlama pool data to determine the optimal harvest frequency for yield farming positions based on current APY, gas costs, and compounding math. Harvesting too rarely loses compound interest; harvesting too often wastes gas. This tool computes the exact harvest schedule that maximizes net yield.",
    endpointUrl: "https://yields.llama.fi/pools",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["yield", "harvester", "auto-compound", "defi", "automation"],
    trustScore: 8900,
  },
  {
    name: "Limit Order Manager",
    slug: "limit-order-manager",
    category: "financial-analysis",
    tagline: "Manage multiple limit orders across SOL and RAY from a single interface.",
    description:
      "Fetches real-time prices for SOL and RAY from Jupiter's v6 API to manage and validate limit order parameters across multiple positions. Limit orders at specific price levels are the foundation of systematic trading; managing multiple orders without real-time price anchoring leads to stale prices and missed executions.",
    endpointUrl: "https://price.jup.ag/v6/price?ids=SOL,RAY",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["limit-orders", "trading", "solana", "jupiter", "automation"],
    trustScore: 9000,
  },
  {
    name: "Liquidation Bot",
    slug: "liquidation-bot",
    category: "financial-analysis",
    tagline: "Monitor and execute profitable DeFi liquidations before other bots beat you.",
    description:
      "Queries DeFiLlama protocol data to identify lending protocols with positions approaching liquidation thresholds. Liquidation bots earn liquidation bonuses (typically 5–15%) for closing underwater positions; finding and executing liquidations before competing bots requires fast protocol monitoring and low-latency execution.",
    endpointUrl: "https://api.llama.fi/protocols",
    httpMethod: "GET",
    pricePerCall: "0.006",
    tags: ["liquidation", "bot", "defi", "lending", "mev"],
    trustScore: 8800,
  },

  // ── Research & Analysis (10) ─────────────────────────────────────

  {
    name: "Tokenomics Analyzer",
    slug: "tokenomics-analyzer",
    category: "financial-analysis",
    tagline: "Break down token distribution, vesting schedules, and inflation rate at a glance.",
    description:
      "Fetches comprehensive Solana token data from CoinGecko including circulating supply, total supply, max supply, and market cap to analyze tokenomics structure. A token's supply schedule is its destiny — high inflation from vesting unlocks or emissions is the most common cause of sustained price decline despite strong fundamentals.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/solana",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["tokenomics", "supply", "vesting", "inflation", "fundamentals"],
    trustScore: 9200,
  },
  {
    name: "Team Background Checker",
    slug: "team-background-checker",
    category: "search",
    tagline: "Research any project team's GitHub history — code doesn't lie.",
    description:
      "Searches GitHub for Solana developer profiles ranked by follower count to verify team credentials and contribution history. Anonymous or unverifiable teams are the leading predictor of rug pulls; a team with a public GitHub track record, merged PRs, and community recognition is the strongest signal of project legitimacy.",
    endpointUrl: "https://api.github.com/search/users?q=solana+developer&sort=followers",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["team", "background-check", "github", "due-diligence", "security"],
    trustScore: 8800,
  },
  {
    name: "Protocol Competitor Comparator",
    slug: "protocol-competitor-comparator",
    category: "financial-analysis",
    tagline: "Compare any two DeFi protocols side by side — TVL, fees, and chains.",
    description:
      "Pulls the full DeFiLlama protocol list to enable side-by-side comparison of TVL, revenue, chain coverage, and user metrics for any two protocols. Relative value investing in DeFi requires understanding which protocol in a category has the strongest fundamentals at the current valuation — this tool makes that comparison instant.",
    endpointUrl: "https://api.llama.fi/protocols",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["competitor", "comparison", "defi", "fundamentals", "research"],
    trustScore: 9000,
  },
  {
    name: "On-Chain Metrics Dashboard",
    slug: "on-chain-metrics-dashboard",
    category: "financial-analysis",
    tagline: "Key Solana on-chain health metrics — one call, full picture.",
    description:
      "Fetches historical TVL data for the Solana chain from DeFiLlama to compute on-chain health metrics including TVL trend, growth rate, and ecosystem momentum. On-chain metrics provide a ground-truth view of blockchain adoption that can't be gamed by marketing — the most reliable measure of real ecosystem growth.",
    endpointUrl: "https://api.llama.fi/v2/historicalChainTvl/Solana",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["on-chain", "metrics", "solana", "tvl", "ecosystem"],
    trustScore: 9100,
  },
  {
    name: "Token Correlation Finder",
    slug: "token-correlation-finder",
    category: "financial-analysis",
    tagline: "Find correlated token pairs to diversify properly or amplify directional bets.",
    description:
      "Fetches 7-day sparkline price data for the top 50 tokens from CoinGecko to compute pairwise correlation coefficients. True portfolio diversification requires holding uncorrelated assets; most crypto portfolios are 90%+ correlated to BTC. This tool finds the genuine diversifiers in your portfolio.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=50&sparkline=true",
    httpMethod: "GET",
    pricePerCall: "0.005",
    tags: ["correlation", "diversification", "portfolio", "quantitative", "market-data"],
    trustScore: 9000,
  },
  {
    name: "Market Cycle Indicator",
    slug: "market-cycle-indicator",
    category: "financial-analysis",
    tagline: "Determine the current market cycle phase — accumulation, markup, distribution, or decline.",
    description:
      "Analyzes 30 days of Fear & Greed Index data from Alternative.me to classify the current market cycle phase using sentiment pattern recognition. Knowing where you are in the market cycle is the highest-leverage investment decision you can make — it determines whether to be a buyer, holder, or seller.",
    endpointUrl: "https://api.alternative.me/fng/?limit=30",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["market-cycle", "sentiment", "fear-greed", "macro", "trading-signal"],
    trustScore: 9100,
  },
  {
    name: "Exchange Flow Monitor",
    slug: "exchange-flow-monitor",
    category: "financial-analysis",
    tagline: "Track BTC flowing in and out of exchanges — the most reliable supply signal.",
    description:
      "Uses Bitcoin network statistics from Blockchain.info to monitor exchange-related on-chain activity including transaction volume and wallet patterns. Net exchange inflows signal selling pressure; net outflows signal accumulation. Exchange flow data has historically been one of the most reliable leading indicators for BTC price direction.",
    endpointUrl: "https://blockchain.info/stats?format=json",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["exchange-flow", "bitcoin", "supply", "on-chain", "trading-signal"],
    trustScore: 9000,
  },
  {
    name: "Validator Performance Ranker",
    slug: "validator-performance-ranker",
    category: "financial-analysis",
    tagline: "Rank Solana validators by uptime, commission, and performance — stake smarter.",
    description:
      "Queries the Solana mainnet-beta RPC to retrieve validator vote account data for ranking by performance metrics. Staking with a high-performing, low-commission validator maximizes your staking yield; validator performance differences compound significantly over a full epoch cycle and longer.",
    endpointUrl: "https://api.mainnet-beta.solana.com",
    httpMethod: "POST",
    pricePerCall: "0.003",
    tags: ["validator", "staking", "solana", "performance", "yield"],
    trustScore: 9100,
  },
  {
    name: "Solana Network Congestion Monitor",
    slug: "solana-network-congestion-monitor",
    category: "data-extraction",
    tagline: "Track Solana TPS and congestion in real time — time your transactions perfectly.",
    description:
      "Queries the Solana mainnet-beta RPC to retrieve current network performance data including transactions per second, slot time, and skip rate. High congestion causes transaction failures and priority fee spikes; monitoring congestion lets you batch transactions during off-peak windows and save significant fees.",
    endpointUrl: "https://api.mainnet-beta.solana.com",
    httpMethod: "POST",
    pricePerCall: "0.002",
    tags: ["solana", "tps", "congestion", "network", "performance"],
    trustScore: 9200,
  },
  {
    name: "Historical Drawdown Analyzer",
    slug: "historical-drawdown-analyzer",
    category: "financial-analysis",
    tagline: "Analyze maximum historical drawdowns — know exactly how bad it can get.",
    description:
      "Fetches 365 days of SOL price history from CoinGecko to compute maximum drawdown, drawdown duration, recovery time, and drawdown frequency statistics. Most investors significantly underestimate how bad drawdowns can get in crypto; understanding historical worst-case scenarios is essential for position sizing and risk management.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=usd&days=365",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["drawdown", "risk", "historical", "solana", "quantitative"],
    trustScore: 9000,
  },

  // ── Cross-Chain (5) ──────────────────────────────────────────────

  {
    name: "Bridge Status Monitor",
    slug: "bridge-status-monitor",
    category: "data-extraction",
    tagline: "Monitor bridge uptime and volume — don't send funds through a broken bridge.",
    description:
      "Queries DeFiLlama's bridge data endpoint to monitor the operational status and volume metrics for all major cross-chain bridges. Bridge exploits have caused billions in losses; monitoring bridge health and avoiding bridges with unusual TVL drops or volume anomalies is a critical risk management practice.",
    endpointUrl: "https://bridges.llama.fi/bridges",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["bridge", "cross-chain", "monitoring", "security", "defi"],
    trustScore: 9100,
  },
  {
    name: "Cross-Chain Price Arbitrage",
    slug: "cross-chain-price-arbitrage",
    category: "financial-analysis",
    tagline: "Find price differences for the same asset across multiple chains — pure arbitrage.",
    description:
      "Fetches simultaneous prices for SOL, ETH, AVAX, and MATIC from CoinGecko to detect cross-chain price discrepancies for the same underlying asset. Bridging an asset from a cheaper chain to a more expensive one and selling captures risk-free arbitrage; bridge fees and latency are the only costs.",
    endpointUrl: "https://api.coingecko.com/api/v3/simple/price?ids=solana,ethereum,avalanche-2,matic-network&vs_currencies=usd",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["arbitrage", "cross-chain", "price-gap", "bridge", "alpha"],
    trustScore: 9000,
  },
  {
    name: "Chain Comparison Tool",
    slug: "chain-comparison-tool",
    category: "financial-analysis",
    tagline: "Compare TVL, volume, and metrics across every L1 and L2 in one table.",
    description:
      "Pulls comprehensive chain metrics from DeFiLlama's chain list endpoint including TVL, 24h change, and protocol count for all supported blockchains. Cross-chain capital allocation decisions require comparing chains on a level playing field; this tool provides the standardized data needed for systematic chain selection.",
    endpointUrl: "https://api.llama.fi/v2/chains",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["chains", "l1", "l2", "comparison", "tvl"],
    trustScore: 9100,
  },
  {
    name: "Wrapped Token Tracker",
    slug: "wrapped-token-tracker",
    category: "financial-analysis",
    tagline: "Track wrapped token supplies across chains — spot depegs before they happen.",
    description:
      "Monitors chain-level data from DeFiLlama to track wrapped token supplies and detect deviations from underlying asset backing. Wrapped tokens that exceed their backing are a systemic risk signal; historical bridge exploits have caused wrapped tokens to become worthless while the underlying asset retained its value.",
    endpointUrl: "https://api.llama.fi/v2/chains",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["wrapped-tokens", "bridge", "cross-chain", "risk", "depeg"],
    trustScore: 8900,
  },
  {
    name: "Multi-Chain Gas Tracker",
    slug: "multi-chain-gas-tracker",
    category: "financial-analysis",
    tagline: "Compare gas costs across Solana, Ethereum, and Avalanche — always use the cheapest.",
    description:
      "Fetches native token prices for SOL, ETH, and AVAX from CoinGecko to compute and compare USD-denominated transaction costs across chains. Gas costs in USD terms vary wildly across chains and time; choosing the right chain for a transaction can save 99% on fees and is the easiest free money in crypto.",
    endpointUrl: "https://api.coingecko.com/api/v3/simple/price?ids=solana,ethereum,avalanche-2&vs_currencies=usd",
    httpMethod: "GET",
    pricePerCall: "0.002",
    tags: ["gas", "fees", "cross-chain", "solana", "ethereum"],
    trustScore: 9000,
  },

  // ── Prediction & AI (10) ─────────────────────────────────────────

  {
    name: "Price Prediction Engine",
    slug: "price-prediction-engine",
    category: "financial-analysis",
    tagline: "ML-powered SOL price predictions based on 90 days of historical patterns.",
    description:
      "Fetches 90 days of SOL/USD OHLCV data from CoinGecko to power machine learning price prediction models including LSTM, linear regression, and ensemble methods. While no model predicts the future perfectly, systematic predictions based on historical patterns consistently outperform gut-feel trading over large sample sizes.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=usd&days=90",
    httpMethod: "GET",
    pricePerCall: "0.006",
    tags: ["prediction", "ml", "solana", "price", "quantitative"],
    trustScore: 8700,
  },
  {
    name: "Sentiment Score Aggregator",
    slug: "sentiment-score-aggregator",
    category: "classification",
    tagline: "Aggregate sentiment from multiple sources into one reliable 0–100 score.",
    description:
      "Fetches 7 days of Fear & Greed Index data from Alternative.me and aggregates it with other sentiment signals into a composite score. Single-source sentiment is noisy; multi-source aggregation with proper weighting produces a more reliable signal. A composite score above 80 has historically marked local cycle tops.",
    endpointUrl: "https://api.alternative.me/fng/?limit=7",
    httpMethod: "GET",
    pricePerCall: "0.003",
    tags: ["sentiment", "aggregation", "fear-greed", "signal", "composite"],
    trustScore: 9000,
  },
  {
    name: "Chart Pattern Scanner",
    slug: "chart-pattern-scanner",
    category: "financial-analysis",
    tagline: "Detect bull flags, head-and-shoulders, and wedges in SOL price data automatically.",
    description:
      "Analyzes 30 days of SOL price history from CoinGecko using pattern recognition algorithms to identify classical chart formations. Chart patterns encode crowd psychology and have predictable resolution probabilities; systematic pattern detection removes the subjectivity that makes manual chart analysis unreliable.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=usd&days=30",
    httpMethod: "GET",
    pricePerCall: "0.005",
    tags: ["chart-patterns", "technical-analysis", "solana", "trading-signal", "quantitative"],
    trustScore: 8800,
  },
  {
    name: "Volatility Predictor",
    slug: "volatility-predictor",
    category: "financial-analysis",
    tagline: "Forecast upcoming SOL volatility — size positions correctly before the move.",
    description:
      "Fetches 60 days of SOL price history from CoinGecko to compute realized volatility metrics and predict upcoming volatility using GARCH-style models. Volatility prediction is critical for options pricing, position sizing, and stop-loss placement; entering a high-volatility period with oversized positions is how traders blow up.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=usd&days=60",
    httpMethod: "GET",
    pricePerCall: "0.005",
    tags: ["volatility", "prediction", "solana", "risk", "quantitative"],
    trustScore: 8900,
  },
  {
    name: "Trend Reversal Detector",
    slug: "trend-reversal-detector",
    category: "financial-analysis",
    tagline: "Signal potential SOL trend reversals before they happen — flip your position in time.",
    description:
      "Analyzes 14 days of SOL price data from CoinGecko using momentum indicators, divergence signals, and volume pattern analysis to detect early signs of trend reversal. Catching a reversal 1–2 days early can be the difference between a profitable exit and holding through a 30% drawdown.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=usd&days=14",
    httpMethod: "GET",
    pricePerCall: "0.005",
    tags: ["trend-reversal", "momentum", "solana", "trading-signal", "technical-analysis"],
    trustScore: 8800,
  },
  {
    name: "Risk-Adjusted Return Calculator",
    slug: "risk-adjusted-return-calculator",
    category: "financial-analysis",
    tagline: "Calculate Sharpe ratio and risk-adjusted returns — know if you're actually being compensated.",
    description:
      "Fetches one year of SOL price history from CoinGecko to compute Sharpe ratio, Sortino ratio, Calmar ratio, and other risk-adjusted performance metrics. Raw returns without risk adjustment are meaningless; an asset returning 100% with 200% volatility underperforms a stable 20% return. Know your true risk-adjusted performance.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=usd&days=365",
    httpMethod: "GET",
    pricePerCall: "0.005",
    tags: ["sharpe-ratio", "risk-adjusted", "quantitative", "solana", "performance"],
    trustScore: 9100,
  },
  {
    name: "Market Regime Classifier",
    slug: "market-regime-classifier",
    category: "classification",
    tagline: "Classify the current market as bull, bear, accumulation, or distribution phase.",
    description:
      "Processes 30 days of Fear & Greed Index readings from Alternative.me through a Hidden Markov Model to classify the current market regime. Each regime demands a different strategy — what works in accumulation destroys capital in distribution. Regime classification is the highest-level strategic decision in crypto trading.",
    endpointUrl: "https://api.alternative.me/fng/?limit=30",
    httpMethod: "GET",
    pricePerCall: "0.005",
    tags: ["market-regime", "classification", "sentiment", "macro", "strategy"],
    trustScore: 9000,
  },
  {
    name: "Correlation Heatmap Generator",
    slug: "correlation-heatmap-generator",
    category: "financial-analysis",
    tagline: "Generate a full token correlation matrix — visualize your portfolio's hidden risk.",
    description:
      "Fetches 7-day sparkline data for 30 tokens from CoinGecko to compute a full pairwise correlation matrix. Visualizing correlations as a heatmap immediately reveals clusters of highly correlated assets that provide no diversification benefit. Restructure your portfolio based on actual correlation data, not assumptions.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=30&sparkline=true",
    httpMethod: "GET",
    pricePerCall: "0.005",
    tags: ["correlation", "heatmap", "diversification", "portfolio", "quantitative"],
    trustScore: 8900,
  },
  {
    name: "Strategy Backtester",
    slug: "strategy-backtester",
    category: "financial-analysis",
    tagline: "Backtest any trading strategy against one year of SOL price history.",
    description:
      "Fetches 365 days of granular SOL price data from CoinGecko to backtest trading strategies including moving average crossovers, RSI mean-reversion, momentum, and custom rule sets. Backtesting eliminates survivorship bias and recency bias from strategy evaluation — only trust strategies that work over full cycles.",
    endpointUrl: "https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=usd&days=365",
    httpMethod: "GET",
    pricePerCall: "0.006",
    tags: ["backtest", "strategy", "solana", "quantitative", "trading"],
    trustScore: 9000,
  },
  {
    name: "Signal Aggregator",
    slug: "signal-aggregator",
    category: "classification",
    tagline: "Combine technical, fundamental, and sentiment signals into one actionable score.",
    description:
      "Fetches the current Fear & Greed Index from Alternative.me as the sentiment component of a multi-factor signal aggregation system. Combining momentum, on-chain, sentiment, and fundamental signals into a single weighted score produces more reliable trade signals than any individual indicator. One score, full market context.",
    endpointUrl: "https://api.alternative.me/fng/",
    httpMethod: "GET",
    pricePerCall: "0.004",
    tags: ["signal", "aggregation", "sentiment", "multi-factor", "trading-signal"],
    trustScore: 9000,
  },
];

const CREATOR_WALLET = "AegisDevnet1111111111111111111111111111111";

// ── Main ────────────────────────────────────────────────────────

async function main() {
  console.log(`Connecting to MongoDB: ${MONGO_URI}`);
  await mongoose.connect(MONGO_URI);
  console.log("Connected.\n");

  // Get or create the Operator model (reuse existing schema)
  const OperatorModel =
    mongoose.models.Operator ||
    mongoose.model(
      "Operator",
      new mongoose.Schema({}, { strict: false, collection: "operators" }),
    );

  let created = 0;
  let skipped = 0;

  for (const op of REAL_OPERATORS) {
    const existing = await OperatorModel.findOne({ slug: op.slug }).lean();
    if (existing) {
      console.log(`  SKIP  ${op.slug} (already exists)`);
      skipped++;
      continue;
    }

    await OperatorModel.create({
      slug: op.slug,
      name: op.name,
      tagline: op.tagline,
      description: op.description,
      category: op.category,
      endpointUrl: op.endpointUrl,
      httpMethod: op.httpMethod,
      pricePerCall: mongoose.Types.Decimal128.fromString(op.pricePerCall),
      creatorWallet: CREATOR_WALLET,
      tags: op.tags,
      requestSchema: op.requestSchema || null,
      responseSchema: op.responseSchema || null,
      isActive: true,
      isVerified: true,
      trustScore: op.trustScore ?? 8500,
      totalInvocations: 0,
      successfulInvocations: 0,
      totalEarned: mongoose.Types.Decimal128.fromString("0"),
      avgResponseMs: 0,
      healthStatus: "unknown",
      consecutiveFailures: 0,
      stakeAmount: mongoose.Types.Decimal128.fromString("0"),
    });

    console.log(`  ADD   ${op.slug} -> ${op.endpointUrl}`);
    created++;
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
