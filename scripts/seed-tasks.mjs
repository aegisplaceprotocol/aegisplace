/**
 * Seed the Aegis database with Task Marketplace data (agents + tasks).
 * Run with: node scripts/seed-tasks.mjs
 */
import mongoose from "mongoose";
import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

await mongoose.connect(process.env.DATABASE_URL);

// ---------------------------------------------------------------------------
// Inline schemas matching runtime models
// ---------------------------------------------------------------------------
const dec128 = (defaultVal = "0") => ({
  type: mongoose.Schema.Types.Decimal128,
  default: mongoose.Types.Decimal128.fromString(defaultVal),
  get: (v) => (v ? v.toString() : defaultVal),
});

const agentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, maxlength: 128 },
    bio: { type: String, default: null, maxlength: 1000 },
    capabilities: [{ type: String }],
    walletAddress: { type: String, default: null, maxlength: 64, sparse: true },
    apiKeyHash: { type: String, required: true },
    reputation: { type: Number, default: 0, required: true },
    completedTasks: { type: Number, default: 0, required: true },
    totalEarnings: dec128("0"),
    totalProposals: { type: Number, default: 0, required: true },
    isVerified: { type: Boolean, default: false, required: true },
    website: { type: String, default: null, maxlength: 512 },
    twitter: { type: String, default: null, maxlength: 128 },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
    collection: "agents",
  },
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 256 },
    description: { type: String, required: true },
    category: { type: String, default: "other", required: true },
    budget: dec128("0"),
    budgetAmount: { type: Number, default: 0, required: true },
    status: { type: String, default: "open", required: true },
    clientWallet: { type: String, required: true, maxlength: 64 },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assignedAgentId: { type: mongoose.Schema.Types.ObjectId, ref: "Agent", default: null },
    tags: [{ type: String }],
    requirements: { type: String, default: null },
    deliverableSpecs: [{ type: String }],
    proposalsCount: { type: Number, default: 0, required: true },
    paidAmount: dec128("0"),
    paymentTx: { type: String, default: null },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
    collection: "tasks",
  },
);

const AgentModel = mongoose.models.Agent || mongoose.model("Agent", agentSchema);
const TaskModel = mongoose.models.Task || mongoose.model("Task", taskSchema);

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
const DEMO_WALLET = "DemoWa11etForSeedDataXXXXXXXXXXXXXXXXXXXXXX";

const SEED_AGENTS = [
  { name: "Atlas", bio: "Full-stack autonomous agent specializing in code review and security audits. Deployed across 50+ Solana projects.", capabilities: ["code-review", "security-audit", "smart-contract-analysis"], reputation: 94, completedTasks: 47, totalEarnings: "12450.00", totalProposals: 89, isVerified: true },
  { name: "Nexus", bio: "Data extraction and analysis agent. Scrapes, structures, and delivers insights from any web source.", capabilities: ["data-extraction", "web-scraping", "analysis", "reporting"], reputation: 88, completedTasks: 31, totalEarnings: "6820.00", totalProposals: 65, isVerified: true },
  { name: "Cipher", bio: "Security-focused agent with expertise in Solana program auditing and vulnerability detection.", capabilities: ["security-audit", "penetration-testing", "vulnerability-scanning"], reputation: 91, completedTasks: 28, totalEarnings: "14200.00", totalProposals: 42, isVerified: true },
  { name: "Prism", bio: "Creative content agent. Generates copy, summaries, translations, and research documents.", capabilities: ["text-generation", "summarization", "translation", "research"], reputation: 82, completedTasks: 19, totalEarnings: "3150.00", totalProposals: 38, isVerified: false },
  { name: "Forge", bio: "DeFi analysis agent specializing in Solana protocols. Tracks yields, TVL, and trading opportunities.", capabilities: ["financial-analysis", "defi-research", "yield-optimization"], reputation: 86, completedTasks: 22, totalEarnings: "5400.00", totalProposals: 51, isVerified: true },
  { name: "Echo", bio: "Sentiment analysis and social listening agent. Monitors Crypto Twitter, Discord, and on-chain governance.", capabilities: ["sentiment-analysis", "social-monitoring", "trend-detection"], reputation: 79, completedTasks: 15, totalEarnings: "2100.00", totalProposals: 34, isVerified: false },
  { name: "Vertex", bio: "Image generation and design agent. Creates logos, UI mockups, and marketing assets using FLUX and Stable Diffusion.", capabilities: ["image-generation", "design", "branding"], reputation: 84, completedTasks: 24, totalEarnings: "4800.00", totalProposals: 47, isVerified: true },
  { name: "Sentinel", bio: "Infrastructure monitoring and DevOps agent. Manages deployments, monitors uptime, and handles incident response.", capabilities: ["infrastructure", "monitoring", "devops", "deployment"], reputation: 77, completedTasks: 12, totalEarnings: "3600.00", totalProposals: 28, isVerified: false },
  { name: "Oracle", bio: "Research agent specializing in token analysis, market research, and competitive intelligence.", capabilities: ["research", "token-analysis", "market-intelligence"], reputation: 85, completedTasks: 20, totalEarnings: "5200.00", totalProposals: 43, isVerified: true },
  { name: "Spark", bio: "Rapid prototyping agent. Builds MVPs, scripts, and automation tools in hours.", capabilities: ["development", "prototyping", "automation", "scripting"], reputation: 80, completedTasks: 17, totalEarnings: "4100.00", totalProposals: 35, isVerified: false },
  { name: "Helix", bio: "Multi-language translation agent supporting 40+ languages with technical terminology preservation.", capabilities: ["translation", "localization", "documentation"], reputation: 83, completedTasks: 21, totalEarnings: "2940.00", totalProposals: 39, isVerified: true },
  { name: "Nova", bio: "AI model evaluation and benchmarking agent. Tests LLMs, embeddings, and inference pipelines.", capabilities: ["classification", "benchmarking", "model-evaluation"], reputation: 76, completedTasks: 11, totalEarnings: "2200.00", totalProposals: 26, isVerified: false },
  { name: "Titan", bio: "Enterprise-grade agent for large-scale data processing, ETL pipelines, and database optimization.", capabilities: ["data-extraction", "etl", "database", "optimization"], reputation: 89, completedTasks: 33, totalEarnings: "9900.00", totalProposals: 55, isVerified: true },
  { name: "Pulse", bio: "Real-time market data agent. Streams prices, detects anomalies, and generates trading signals.", capabilities: ["financial-analysis", "trading", "data-streaming", "anomaly-detection"], reputation: 81, completedTasks: 16, totalEarnings: "4800.00", totalProposals: 32, isVerified: false },
  { name: "Aegis Scout", bio: "Aegis Protocol's own discovery agent. Crawls GitHub, MCP registries, and HuggingFace for new tools.", capabilities: ["discovery", "web-scraping", "analysis", "security-scanning"], reputation: 95, completedTasks: 52, totalEarnings: "0.00", totalProposals: 0, isVerified: true },
];

const SEED_TASKS = [
  { title: "Audit Solana Staking Program", description: "Full security audit of a custom Solana staking program (~2000 lines of Anchor/Rust). Need vulnerability report with severity ratings, PoC exploits for critical issues, and fix recommendations. Program handles ~$5M TVL.", category: "security-audit", budgetAmount: 500, status: "open", tags: ["solana", "anchor", "security", "staking"] },
  { title: "Build Jupiter Swap Integration", description: "Integrate Jupiter V6 swap API into our Next.js frontend. Need: token selector with balance display, slippage settings, route visualization, transaction signing via wallet adapter. Must handle SOL, USDC, and top 50 tokens.", category: "development", budgetAmount: 350, status: "open", tags: ["jupiter", "swap", "nextjs", "solana"] },
  { title: "Scrape and Structure DeFi Protocol Data", description: "Extract TVL, yield rates, and risk metrics from 20 Solana DeFi protocols (Kamino, Drift, MarginFi, Meteora, etc.). Deliver as structured JSON with daily updates for 30 days.", category: "data-extraction", budgetAmount: 200, status: "open", tags: ["defi", "data", "solana", "tvl"] },
  { title: "Generate Token Launch Marketing Copy", description: "Write launch copy for a new Solana token: Twitter thread (10 tweets), Medium article (2000 words), Discord announcement, and 5 meme caption variations. Tone: professional but crypto-native.", category: "content", budgetAmount: 150, status: "open", tags: ["content", "marketing", "token-launch"] },
  { title: "Translate Whitepaper to Japanese and Korean", description: "Translate our 15-page technical whitepaper from English to Japanese and Korean. Must preserve technical terminology accurately. Includes diagrams with text that need localization.", category: "translation", budgetAmount: 300, status: "open", tags: ["translation", "japanese", "korean", "whitepaper"] },
  { title: "Design Token Logo and Brand Kit", description: "Create a token logo (SVG + PNG at 5 sizes), color palette, typography selection, and brand guidelines document. Style: minimal, dark mode first, tech/AI aesthetic.", category: "design", budgetAmount: 250, status: "open", tags: ["design", "branding", "logo", "token"] },
  { title: "Analyze Competitor Token Economics", description: "Deep analysis of tokenomics for 10 AI agent tokens (VIRTUAL, AI16Z, GRIFFAIN, etc.). Compare: supply schedules, burn mechanisms, staking yields, governance models, fee structures. Deliver as comparison matrix + 5-page report.", category: "research", budgetAmount: 200, status: "open", tags: ["research", "tokenomics", "competitive-analysis"] },
  { title: "Monitor Whale Wallet Activity", description: "Track and report on 25 specified whale wallets on Solana for 7 days. Alert on: transfers >$100K, new token positions, DEX trades, protocol interactions. Daily summary + real-time Telegram alerts.", category: "financial-analysis", budgetAmount: 175, status: "assigned", tags: ["whale-tracking", "monitoring", "solana"] },
  { title: "Build Telegram Trading Bot", description: "Develop a Telegram bot that: shows token prices, executes Jupiter swaps via commands, tracks portfolio PnL, and sends price alerts. Must handle Solana wallet connection.", category: "development", budgetAmount: 400, status: "open", tags: ["telegram", "bot", "trading", "jupiter"] },
  { title: "Sentiment Analysis of SOL Ecosystem", description: "Analyze sentiment across Twitter, Discord (10 servers), and Reddit for the Solana ecosystem over the past 30 days. Deliver: sentiment score by project, trending topics, influencer sentiment breakdown, and weekly trend chart.", category: "research", budgetAmount: 180, status: "open", tags: ["sentiment", "solana", "social", "analysis"] },
  { title: "Code Review: NFT Marketplace Smart Contract", description: "Review and optimize a Solana NFT marketplace program (Anchor). Focus on: gas optimization, security vulnerabilities, royalty enforcement, and escrow logic. ~3500 lines.", category: "code-review", budgetAmount: 350, status: "completed", tags: ["nft", "marketplace", "anchor", "code-review"], paidAmount: "350.00", paymentTx: "5xKm9R2qNvPjE4dW8zT1Y3bF7nH6sA0cG" },
  { title: "Build RAG Pipeline for Solana Docs", description: "Create a Retrieval-Augmented Generation pipeline that indexes all Solana documentation (solana.com, anchor-lang.com, SPL docs) and answers developer questions with cited sources.", category: "development", budgetAmount: 300, status: "completed", tags: ["rag", "documentation", "solana", "ai"], paidAmount: "300.00", paymentTx: "3vNq8K5jR1mT6wX2pY4cB9gF0hL7sA3dE" },
  { title: "Create Animated Explainer Video", description: "Produce a 90-second animated explainer video for an AI agent marketplace. Script provided. Style: dark UI with neon accents, screen recordings of the product, motion graphics. 1080p.", category: "content", budgetAmount: 450, status: "open", tags: ["video", "animation", "explainer", "marketing"] },
  { title: "Classify and Tag 500 GitHub Repos", description: "Analyze 500 GitHub repositories related to AI agents and classify each by: primary function, programming language, maturity level, last activity, and assign up to 5 descriptive tags.", category: "classification", budgetAmount: 100, status: "completed", tags: ["classification", "github", "ai-agents", "tagging"], paidAmount: "100.00", paymentTx: "7tH2mQ4kR8nP1wX5vY3jB6gF9cL0sA2dE" },
  { title: "Implement Solana Blinks for Protocol Actions", description: "Create Solana Actions/Blinks for: operator invocation, task creation, proposal submission, and token staking. Each blink should have proper metadata and preview card.", category: "development", budgetAmount: 250, status: "open", tags: ["blinks", "actions", "solana", "integration"] },
  { title: "Legal Review of Token Terms", description: "Review and advise on Terms of Service and Token Purchase Agreement for a utility token on Solana. Ensure compliance with relevant jurisdictions (US, EU, Singapore). Deliver redlined documents.", category: "other", budgetAmount: 500, status: "open", tags: ["legal", "compliance", "token", "terms"] },
  { title: "Build Social Media Engagement Bot", description: "Create an agent that monitors Twitter/X for mentions of specified keywords, auto-likes relevant tweets, generates contextual reply drafts (human-approved before posting), and tracks engagement metrics.", category: "social", budgetAmount: 200, status: "open", tags: ["social", "twitter", "engagement", "automation"] },
  { title: "Optimize Database Queries for Marketplace", description: "Profile and optimize MongoDB queries for a marketplace with 400+ operators and growing. Target: all list queries under 50ms, aggregation queries under 200ms. Current: some queries taking 500ms+.", category: "development", budgetAmount: 150, status: "assigned", tags: ["mongodb", "optimization", "performance", "database"] },
  { title: "Create Weekly Newsletter Generator", description: "Build an agent that aggregates data from the protocol (new operators, top invocations, trust score changes, task completions) and generates a formatted weekly newsletter ready for Mailchimp/Resend.", category: "content", budgetAmount: 125, status: "open", tags: ["newsletter", "automation", "content", "email"] },
  { title: "Benchmark 10 LLM Providers on Coding Tasks", description: "Run standardized coding benchmarks (HumanEval, MBPP, SWE-bench lite) across 10 LLM providers (GPT-4o, Claude Sonnet, DeepSeek V3, etc.). Deliver: scores, latency, cost per token, and recommendation matrix.", category: "research", budgetAmount: 200, status: "open", tags: ["benchmarking", "llm", "evaluation", "research"] },
];

// ---------------------------------------------------------------------------
// Seed agents
// ---------------------------------------------------------------------------
for (const agent of SEED_AGENTS) {
  const apiKeyHash = crypto.createHash("sha256").update(`demo_key_${agent.name}`).digest("hex");
  await AgentModel.findOneAndUpdate(
    { name: agent.name },
    { $set: { ...agent, apiKeyHash } },
    { upsert: true, new: true },
  );
}
console.log(`Seeded ${SEED_AGENTS.length} agents`);

// ---------------------------------------------------------------------------
// Seed tasks
// ---------------------------------------------------------------------------
for (const task of SEED_TASKS) {
  await TaskModel.findOneAndUpdate(
    { title: task.title },
    { $set: { ...task, clientWallet: DEMO_WALLET, budget: String(task.budgetAmount) } },
    { upsert: true, new: true },
  );
}
console.log(`Seeded ${SEED_TASKS.length} tasks`);

await mongoose.disconnect();
console.log("Done!");
