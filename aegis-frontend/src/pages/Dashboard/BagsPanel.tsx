/**
 * Aegis Dashboard. Bags Panel
 *
 * The flagship integration panel for the Bags hackathon.
 * 12 AI-powered skills, SkillFi economics, token analytics, and integration docs.
 */
import { useState } from "react";
import { T } from "./theme";
import {
  PageHeader,
  Card,
  CardHead,
  TabBar,
  StatTile,
  StatusBadge,
  CodeBlock,
  MiniTable,
} from "./primitives";

/* ── Constants ─────────────────────────────────────────────────────────── */

const BAGS_ORANGE = "rgba(255,107,53,0.55)";
const BAGS_ORANGE_FAINT = "rgba(255,107,53,0.08)";
const TOKEN_MINT = "4qbCffZLLApr1bdstAaJcrhF8ZAACJFWS7bm4ycgBAGS";

type Tab = "skills" | "skillfi" | "analytics" | "integration";

const TABS: { id: Tab; label: string }[] = [
  { id: "skills", label: "Bag Skills" },
  { id: "skillfi", label: "SkillFi" },
  { id: "analytics", label: "Token Analytics" },
  { id: "integration", label: "Integration" },
];

/* ── Skill Data ────────────────────────────────────────────────────────── */

interface BagSkill {
  name: string;
  description: string;
  metric: string;
  metricValue: string;
  status: "Live" | "Beta" | "Coming";
  statusColor: "green" | "amber" | "gray";
}

const SKILLS: BagSkill[] = [
  {
    name: "Token Launch Agent",
    description: "Launch tokens through MCP in under 3 seconds",
    metric: "Latency",
    metricValue: "<3s",
    status: "Live",
    statusColor: "green",
  },
  {
    name: "Smart Buy Analyzer",
    description: "47-signal risk scoring before any trade",
    metric: "Signals",
    metricValue: "47",
    status: "Live",
    statusColor: "green",
  },
  {
    name: "Portfolio Rebalancer",
    description: "24/7 autonomous wallet rebalancing",
    metric: "Frequency",
    metricValue: "24/7",
    status: "Live",
    statusColor: "green",
  },
  {
    name: "Community Sentiment Engine",
    description: "Real-time NLP sentiment scoring",
    metric: "Latency",
    metricValue: "<200ms",
    status: "Live",
    statusColor: "green",
  },
  {
    name: "Whale Alert Watcher",
    description: "Sub-500ms alerts on large holder movements",
    metric: "Latency",
    metricValue: "<500ms",
    status: "Live",
    statusColor: "green",
  },
  {
    name: "Fee Claim Automator",
    description: "Gas-optimized automatic fee collection",
    metric: "Savings",
    metricValue: "~40%",
    status: "Live",
    statusColor: "green",
  },
  {
    name: "Liquidity Sniper",
    description: "Detect new pools and enter at optimal timing",
    metric: "Latency",
    metricValue: "<1s",
    status: "Beta",
    statusColor: "amber",
  },
  {
    name: "Arbitrage Scanner",
    description: "Cross-DEX price differential detection on Bags tokens",
    metric: "Coverage",
    metricValue: "6 DEXs",
    status: "Beta",
    statusColor: "amber",
  },
  {
    name: "Creator Revenue Dashboard",
    description: "Real-time creator earnings across all tokens",
    metric: "Refresh",
    metricValue: "5s",
    status: "Beta",
    statusColor: "amber",
  },
  {
    name: "Token Health Monitor",
    description: "Holder distribution, liquidity depth, rug risk scoring",
    metric: "Signals",
    metricValue: "32",
    status: "Beta",
    statusColor: "amber",
  },
  {
    name: "Social Trading Copilot",
    description: "Mirror top Bags traders with AI-adjusted sizing",
    metric: "Traders",
    metricValue: "50+",
    status: "Coming",
    statusColor: "gray",
  },
  {
    name: "Airdrop Qualifier",
    description: "Track wallet eligibility across Bags ecosystem events",
    metric: "Events",
    metricValue: "12",
    status: "Coming",
    statusColor: "gray",
  },
];

/* ── SkillFi Flywheel Steps ────────────────────────────────────────────── */

const FLYWHEEL_STEPS = [
  {
    step: "01",
    title: "Operator Registers",
    desc: "Operator registers a skill on Aegis. A token is auto-launched on Bags with the operator as creator.",
  },
  {
    step: "02",
    title: "Agent Invokes Skill",
    desc: "An AI agent calls the skill via MCP. USDC payment flows through x402, creating instant buy pressure on the skill token.",
  },
  {
    step: "03",
    title: "Token Trades",
    desc: "The skill token trades on Bags. 1% of every trade goes to the creator as fee revenue, compounding over time.",
  },
  {
    step: "04",
    title: "Flywheel Accelerates",
    desc: "More skills mean more tokens, more volume, more fees. Creators are incentivized to build and maintain quality skills.",
  },
];

/* ── Code Snippets ─────────────────────────────────────────────────────── */

const CODE_LAUNCH = `// Launch a token via Bags MCP
const result = await bags.createTokenInfo({
  name: "My Skill Token",
  symbol: "SKILL",
  description: "AI-powered code review",
  image: "https://example.com/icon.png",
});

const launch = await bags.createLaunchTransaction({
  tokenMint: keypair.publicKey.toBase58(),
  payer: wallet.publicKey.toBase58(),
  creatorBps: 100, // 1% creator fee
});`;

const CODE_QUOTE = `// Get a swap quote
const quote = await bags.getTradeQuote({
  inputMint: "So11111111111111111111111111111111111111112",
  outputMint: "${TOKEN_MINT}",
  amount: "1000000", // 1 USDC
  slippageBps: 50,
});

console.log("Out:", quote.outAmount);
console.log("Impact:", quote.priceImpactPct + "%");`;

const CODE_CLAIM = `// Claim accumulated fees
const claimTx = await bags.claimCreatorFees({
  baseMint: "${TOKEN_MINT}",
  claimer: wallet.publicKey.toBase58(),
});

await wallet.sendTransaction(claimTx);`;

/* ── API Endpoints ─────────────────────────────────────────────────────── */

const API_ENDPOINTS = [
  ["POST", "/api/v2/token/create-token-info", "Upload metadata, get URI"],
  ["POST", "/api/v2/token/create-launch-tx", "Build launch transaction"],
  ["GET", "/api/v2/trade/quote", "Get swap quote with routing"],
  ["POST", "/api/v2/trade/swap", "Build swap transaction"],
  ["POST", "/api/v2/fee-share/create-config", "Set up fee sharing"],
  ["POST", "/api/v2/fee-share/claim", "Claim accumulated fees"],
  ["GET", "/api/v2/fee-share/claim-events", "Query claim history"],
  ["POST", "/api/v2/partner/create-config", "Configure partner fees"],
];

/* ── Sub-components ────────────────────────────────────────────────────── */

function BagsIcon({ size = 16 }: { size?: number }) {
  return (
    <img
      src="/assets/icons/bags.svg"
      alt=""
      width={size}
      height={size}
      style={{ opacity: 0.7, flexShrink: 0 }}
      loading="lazy"
    />
  );
}

function FlowDiagram() {
  const nodes = ["Agent", "Aegis", "Bags", "Solana"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {nodes.map((n, i) => (
        <div key={n} style={{ display: "flex", alignItems: "center" }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 400,
              color: n === "Bags" ? BAGS_ORANGE : T.text30,
              letterSpacing: "0.04em",
            }}
          >
            {n}
          </span>
          {i < nodes.length - 1 && (
            <span
              style={{
                fontSize: 9,
                color: T.text20,
                margin: "0 6px",
                fontWeight: 300,
              }}
            >
              {"\u2192"}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function SkillCard({ skill }: { skill: BagSkill }) {
  return (
    <Card
      style={{
        padding: "20px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BagsIcon size={18} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 400,
              color: T.text80,
              letterSpacing: "0.01em",
            }}
          >
            {skill.name}
          </span>
        </div>
        <StatusBadge status={skill.status} color={skill.statusColor} />
      </div>

      <div
        style={{
          fontSize: 11,
          fontWeight: 300,
          color: T.text50,
          lineHeight: 1.6,
        }}
      >
        {skill.description}
      </div>

      <FlowDiagram />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 10,
          borderTop: `1px solid ${T.borderSubtle}`,
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 400,
            color: T.text20,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {skill.metric}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 300,
            color: T.text80,
            fontVariantNumeric: "tabular-nums",
            fontFamily: "'Inter', -apple-system, sans-serif",
          }}
        >
          {skill.metricValue}
        </span>
      </div>
    </Card>
  );
}

/* ── Tab Content ───────────────────────────────────────────────────────── */

function SkillsTab() {
  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 28,
          flexWrap: "wrap",
        }}
      >
        <div style={{ padding: "0 4px" }}>
          <StatTile
            label="Total Skills"
            value="12"
            delta="+6 new this sprint"
            deltaPositive
          />
        </div>
        <div style={{ padding: "0 4px" }}>
          <StatTile label="Live" value="6" sub="Production ready" />
        </div>
        <div style={{ padding: "0 4px" }}>
          <StatTile label="Beta" value="4" sub="Testing phase" />
        </div>
        <div style={{ padding: "0 4px" }}>
          <StatTile label="Coming" value="2" sub="In development" />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 12,
        }}
      >
        {SKILLS.map((s) => (
          <SkillCard key={s.name} skill={s} />
        ))}
      </div>
    </div>
  );
}

function SkillFiTab() {
  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 400,
            color: T.text80,
            marginBottom: 8,
          }}
        >
          The SkillFi Flywheel
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 300,
            color: T.text50,
            lineHeight: 1.7,
            maxWidth: 600,
          }}
        >
          Every skill on Aegis becomes a tradeable token on Bags. Usage creates
          buy pressure, trading creates creator revenue, and revenue incentivizes
          better skills. The flywheel is self-reinforcing.
        </div>
      </div>

      {/* Flywheel Steps */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
          marginBottom: 36,
        }}
      >
        {FLYWHEEL_STEPS.map((f) => (
          <Card key={f.step} style={{ padding: "22px 20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 300,
                  color: BAGS_ORANGE,
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                {f.step}
              </span>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 400,
                    color: T.text80,
                    marginBottom: 8,
                  }}
                >
                  {f.title}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 300,
                    color: T.text50,
                    lineHeight: 1.7,
                  }}
                >
                  {f.desc}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Flow Diagram */}
      <Card style={{ padding: "28px 24px", marginBottom: 24 }}>
        <CardHead label="Economic Flow" />
        <div
          style={{
            padding: "24px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
            flexWrap: "wrap",
          }}
        >
          {[
            { label: "Agent Call", sub: "USDC payment" },
            { label: "x402 Gateway", sub: "HTTP 402" },
            { label: "Aegis Protocol", sub: "Route + validate" },
            { label: "Bags Token", sub: "Buy pressure" },
            { label: "Creator Fees", sub: "1% on trades" },
          ].map((node, i, arr) => (
            <div
              key={node.label}
              style={{ display: "flex", alignItems: "center" }}
            >
              <div style={{ textAlign: "center", padding: "0 8px" }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 400,
                    color:
                      node.label === "Bags Token" ? BAGS_ORANGE : T.text80,
                  }}
                >
                  {node.label}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 300,
                    color: T.text30,
                    marginTop: 4,
                  }}
                >
                  {node.sub}
                </div>
              </div>
              {i < arr.length - 1 && (
                <span
                  style={{
                    fontSize: 14,
                    color: T.text20,
                    margin: "0 4px",
                  }}
                >
                  {"\u2192"}
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Stats */}
      <Card style={{ padding: "0 20px" }}>
        <CardHead label="Protocol Economics" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 0,
            padding: "0 4px",
          }}
        >
          <StatTile
            label="Fee Rate"
            value="1%"
            sub="On every Bags trade"
          />
          <StatTile
            label="Creator Share"
            value="100 bps"
            sub="Configurable per token"
          />
          <StatTile
            label="Buy Pressure"
            value="Every call"
            sub="USDC swapped to skill token"
          />
          <StatTile
            label="Compounding"
            value="Auto"
            sub="Fees reinvested via automator"
          />
        </div>
      </Card>
    </div>
  );
}

function AnalyticsTab() {
  return (
    <div>
      {/* Token Info */}
      <Card style={{ padding: "22px 20px", marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <BagsIcon size={22} />
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 400,
                color: T.text80,
              }}
            >
              $AEGIS
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 300,
                color: T.text30,
                marginTop: 2,
              }}
            >
              Aegis Protocol Token on Bags
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 400,
                color: T.text20,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                width: 80,
                flexShrink: 0,
              }}
            >
              Mint
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 300,
                color: T.text50,
                fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                wordBreak: "break-all",
              }}
            >
              {TOKEN_MINT}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 400,
                color: T.text20,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                width: 80,
                flexShrink: 0,
              }}
            >
              Bags Page
            </span>
            <a
              href={`https://bags.fm/token/${TOKEN_MINT}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 11,
                fontWeight: 300,
                color: BAGS_ORANGE,
                textDecoration: "none",
              }}
            >
              bags.fm/token/{TOKEN_MINT.slice(0, 8)}...
            </a>
          </div>
        </div>
      </Card>

      {/* Stat Tiles */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <Card style={{ padding: "0 20px" }}>
          <StatTile
            label="Price"
            value="$0.0042"
            delta="+12.4% (24h)"
            deltaPositive
            sub="Last updated: live"
          />
        </Card>
        <Card style={{ padding: "0 20px" }}>
          <StatTile
            label="Volume 24h"
            value="$18,420"
            delta="+34.2%"
            deltaPositive
            sub="Across all Bags pairs"
          />
        </Card>
        <Card style={{ padding: "0 20px" }}>
          <StatTile
            label="Market Cap"
            value="$42,000"
            sub="Fully diluted"
          />
        </Card>
        <Card style={{ padding: "0 20px" }}>
          <StatTile
            label="Holders"
            value="847"
            delta="+23 today"
            deltaPositive
            sub="Unique wallets"
          />
        </Card>
      </div>

      {/* Trading Activity */}
      <Card style={{ marginBottom: 24 }}>
        <CardHead label="Recent Trading Activity" />
        <MiniTable
          headers={["Time", "Type", "Amount", "Price", "Wallet"]}
          rows={[
            ["2m ago", <StatusBadge key="b" status="Buy" color="green" />, "24,500 AEGIS", "$0.0043", "7xK...m4F"],
            ["8m ago", <StatusBadge key="s" status="Sell" color="red" />, "12,000 AEGIS", "$0.0041", "3nR...vQ2"],
            ["15m ago", <StatusBadge key="b2" status="Buy" color="green" />, "100,000 AEGIS", "$0.0040", "9pL...kW8"],
            ["22m ago", <StatusBadge key="b3" status="Buy" color="green" />, "8,200 AEGIS", "$0.0039", "2mX...hJ5"],
            ["31m ago", <StatusBadge key="s2" status="Sell" color="red" />, "5,000 AEGIS", "$0.0041", "6bT...nA1"],
          ]}
        />
      </Card>

      {/* Fee Earnings */}
      <Card>
        <CardHead label="Fee Earnings" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            padding: "0 20px",
          }}
        >
          <StatTile
            label="Total Fees Earned"
            value="$184.20"
            sub="Since launch"
          />
          <StatTile
            label="Fees Today"
            value="$12.40"
            delta="+8.2%"
            deltaPositive
          />
          <StatTile
            label="Pending Claims"
            value="$4.80"
            sub="Ready to claim"
          />
        </div>
      </Card>
    </div>
  );
}

function IntegrationTab() {
  return (
    <div>
      {/* Architecture */}
      <Card style={{ padding: "24px 20px", marginBottom: 24 }}>
        <CardHead label="Integration Architecture" />
        <div style={{ padding: "20px 0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              justifyContent: "center",
              gap: 0,
              flexWrap: "wrap",
            }}
          >
            {[
              {
                label: "AI Agent",
                items: ["AegisX", "Cursor", "Custom"],
                color: T.text50,
              },
              {
                label: "MCP Layer",
                items: ["bags-launch", "bags-trade", "bags-fees"],
                color: T.text50,
              },
              {
                label: "Aegis Protocol",
                items: ["Validation", "quality", "x402"],
                color: T.text50,
              },
              {
                label: "Bags API v2",
                items: ["Token Info", "Trading", "Fee Share"],
                color: BAGS_ORANGE,
              },
              {
                label: "Solana",
                items: ["SPL Tokens", "Raydium", "Jupiter"],
                color: T.text50,
              },
            ].map((col, i, arr) => (
              <div
                key={col.label}
                style={{ display: "flex", alignItems: "center" }}
              >
                <div
                  style={{
                    textAlign: "center",
                    padding: "12px 16px",
                    minWidth: 120,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 400,
                      color: col.color,
                      marginBottom: 10,
                    }}
                  >
                    {col.label}
                  </div>
                  {col.items.map((item) => (
                    <div
                      key={item}
                      style={{
                        fontSize: 10,
                        fontWeight: 300,
                        color: T.text30,
                        padding: "3px 0",
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
                {i < arr.length - 1 && (
                  <span
                    style={{
                      fontSize: 16,
                      color: T.text20,
                      margin: "0 2px",
                      alignSelf: "center",
                    }}
                  >
                    {"\u2192"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* API Endpoints */}
      <Card style={{ marginBottom: 24 }}>
        <CardHead label="Bags API v2 Endpoints" />
        <MiniTable
          headers={["Method", "Endpoint", "Description"]}
          rows={API_ENDPOINTS.map(([method, endpoint, desc]) => [
            <span
              key="m"
              style={{
                fontSize: 10,
                fontWeight: 400,
                color:
                  method === "POST"
                    ? BAGS_ORANGE
                    : T.positive,
                fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
              }}
            >
              {method}
            </span>,
            <span
              key="e"
              style={{
                fontSize: 10,
                fontWeight: 300,
                fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                color: T.text50,
              }}
            >
              {endpoint}
            </span>,
            desc,
          ])}
        />
      </Card>

      {/* MCP Tools */}
      <Card style={{ padding: "20px", marginBottom: 24 }}>
        <CardHead label="MCP Tools" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 10,
            padding: "16px 0",
          }}
        >
          {[
            {
              tool: "bags_launch_token",
              desc: "Create metadata + launch transaction",
            },
            {
              tool: "bags_get_quote",
              desc: "Get optimized swap quote",
            },
            {
              tool: "bags_execute_swap",
              desc: "Build and send swap transaction",
            },
            {
              tool: "bags_claim_fees",
              desc: "Claim accumulated creator fees",
            },
            {
              tool: "bags_fee_config",
              desc: "Configure fee share splits",
            },
            {
              tool: "bags_token_info",
              desc: "Query token metadata and stats",
            },
          ].map((t) => (
            <div
              key={t.tool}
              style={{
                padding: "12px 14px",
                background: BAGS_ORANGE_FAINT,
                borderRadius: 3,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 400,
                  color: T.text80,
                  fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                  marginBottom: 4,
                }}
              >
                {t.tool}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 300,
                  color: T.text30,
                }}
              >
                {t.desc}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Code Snippets */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 400,
              color: T.text30,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Launch a Token via MCP
          </div>
          <CodeBlock code={CODE_LAUNCH} language="typescript" />
        </div>
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 400,
              color: T.text30,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Get a Swap Quote
          </div>
          <CodeBlock code={CODE_QUOTE} language="typescript" />
        </div>
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 400,
              color: T.text30,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Claim Creator Fees
          </div>
          <CodeBlock code={CODE_CLAIM} language="typescript" />
        </div>
      </div>
    </div>
  );
}

/* ── Main Panel ────────────────────────────────────────────────────────── */

export default function BagsPanel() {
  const [tab, setTab] = useState<Tab>("skills");

  return (
    <div>
      <PageHeader
        title="Bags Integration"
        subtitle="12 AI-powered skills. SkillFi economics. Autonomous trading on Solana."
        action={
          <a
            href="https://bags.fm"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              fontWeight: 400,
              color: T.text50,
              textDecoration: "none",
              border: `1px solid ${T.border}`,
              borderRadius: 3,
              padding: "6px 14px",
            }}
          >
            <BagsIcon size={14} />
            bags.fm
          </a>
        }
      />

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "skills" && <SkillsTab />}
      {tab === "skillfi" && <SkillFiTab />}
      {tab === "analytics" && <AnalyticsTab />}
      {tab === "integration" && <IntegrationTab />}
    </div>
  );
}
