/**
 * Seeds 10 real operators with working endpoints.
 * These are actual APIs that respond to HTTP requests.
 *
 * Usage: npx tsx scripts/seed-real-operators.ts
 */

import "dotenv/config";
import mongoose from "mongoose";

const MONGO_URI = process.env.DATABASE_URL || "mongodb://localhost:27017/aegis";

// ── Operator definitions ────────────────────────────────────────

const REAL_OPERATORS = [
  {
    name: "Helius RPC Status",
    slug: "helius-rpc-status",
    category: "other",
    description: "Check Solana RPC health and latest slot via Helius public endpoint",
    endpointUrl: "https://api.mainnet-beta.solana.com",
    httpMethod: "POST",
    pricePerCall: "0",
    tags: ["solana", "rpc", "infrastructure"],
    requestSchema: '{"jsonrpc":"2.0","id":1,"method":"getHealth"}',
    responseSchema: '{"result":"ok"}',
  },
  {
    name: "CoinGecko SOL Price",
    slug: "coingecko-sol-price",
    category: "financial-analysis",
    description: "Get current Solana price from CoinGecko free API",
    endpointUrl: "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
    httpMethod: "GET",
    pricePerCall: "0",
    tags: ["price", "solana", "defi", "data"],
  },
  {
    name: "CoinGecko BTC Price",
    slug: "coingecko-btc-price",
    category: "financial-analysis",
    description: "Get current Bitcoin price from CoinGecko free API",
    endpointUrl: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
    httpMethod: "GET",
    pricePerCall: "0",
    tags: ["price", "bitcoin", "data"],
  },
  {
    name: "HTTPBin Echo",
    slug: "httpbin-echo",
    category: "other",
    description: "Echo any JSON payload back - useful for testing agent request/response flows",
    endpointUrl: "https://httpbin.org/post",
    httpMethod: "POST",
    pricePerCall: "0",
    tags: ["testing", "echo", "dev-tools"],
  },
  {
    name: "WorldTime API",
    slug: "worldtime-utc",
    category: "data-extraction",
    description: "Get current UTC time with timezone data",
    endpointUrl: "https://worldtimeapi.org/api/timezone/Etc/UTC",
    httpMethod: "GET",
    pricePerCall: "0",
    tags: ["time", "timezone", "data"],
  },
  {
    name: "JSONPlaceholder Posts",
    slug: "jsonplaceholder-posts",
    category: "other",
    description: "Fetch sample posts data - a testing/prototyping API",
    endpointUrl: "https://jsonplaceholder.typicode.com/posts?_limit=5",
    httpMethod: "GET",
    pricePerCall: "0",
    tags: ["testing", "mock", "dev-tools"],
  },
  {
    name: "IP Geolocation",
    slug: "ip-geolocation",
    category: "data-extraction",
    description: "Get geolocation data for any IP address",
    endpointUrl: "https://ipapi.co/json/",
    httpMethod: "GET",
    pricePerCall: "0",
    tags: ["geolocation", "ip", "data"],
  },
  {
    name: "Random User Generator",
    slug: "random-user-gen",
    category: "other",
    description: "Generate random user profiles for testing and prototyping",
    endpointUrl: "https://randomuser.me/api/?results=3",
    httpMethod: "GET",
    pricePerCall: "0",
    tags: ["testing", "users", "mock"],
  },
  {
    name: "Cat Facts",
    slug: "cat-facts",
    category: "other",
    description: "Get random cat facts - a fun demo operator",
    endpointUrl: "https://catfact.ninja/fact",
    httpMethod: "GET",
    pricePerCall: "0",
    tags: ["fun", "facts", "content"],
  },
  {
    name: "GitHub Zen",
    slug: "github-zen",
    category: "other",
    description: "Get a random bit of GitHub wisdom",
    endpointUrl: "https://api.github.com/zen",
    httpMethod: "GET",
    pricePerCall: "0",
    tags: ["github", "quotes", "content"],
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
      tagline: op.description,
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
      trustScore: 8500,
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
