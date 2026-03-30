import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";

const SECTIONS = [
  { id: "quickstart", label: "Quickstart" },
  { id: "aegisx", label: "AegisX IDE" },
  { id: "aegisx-tools", label: "57 Tools Reference" },
  { id: "mcp-bridge", label: "MCP Server Bridge" },
  { id: "architecture", label: "Architecture" },
  { id: "x402", label: "x402 Payment Flow" },
  { id: "registration", label: "Operator Registration" },
  { id: "sdk", label: "SDK Integration" },
  { id: "operators", label: "Operator Format" },
  { id: "staking", label: "$AEGIS Staking" },
  { id: "validation", label: "Bonded Validation" },
  { id: "sandboxing", label: "Operator Sandboxing" },
  { id: "observation", label: "Observation Loops" },
  { id: "reputation", label: "On-Chain Reputation" },
  { id: "programs", label: "Solana Programs" },
  { id: "a2a", label: "A2A Protocol" },
  { id: "wallets", label: "Agentic Wallets" },
  { id: "nvidia", label: "NVIDIA NeMo Stack" },
  { id: "cli", label: "CLI Reference" },
];

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative border border-white/[0.06]/40 bg-white/[0.02] overflow-x-auto rounded">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]/30">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-zinc-700" />
          <span className="w-2 h-2 rounded-full bg-zinc-800" />
          <span className="w-2 h-2 rounded-full bg-zinc-800" />
          <span className="text-[9px] font-medium text-zinc-600 ml-2">{lang}</span>
        </div>
        <button onClick={handleCopy}
          className="text-[10px] font-medium text-zinc-600 hover:text-zinc-300 transition-colors px-2 py-0.5 cursor-pointer">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-5 text-[11px] font-mono text-zinc-400 leading-[1.9] whitespace-pre-wrap">{code}</pre>
    </div>
  );
}

function DocSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-20 scroll-mt-24">
      <h2 className="text-2xl md:text-3xl font-normal text-zinc-100 tracking-tight mb-2">{title}</h2>
      <div className="w-12 h-0.5 bg-zinc-700 rounded-full mb-6" />
      {children}
    </section>
  );
}

function InfoBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 border border-white/[0.06]/40 bg-white/[0.02]/30 p-5 rounded">
      <div className="text-[11px] font-medium text-zinc-400 mb-2">{label}</div>
      <p className="text-[14px] text-zinc-500 leading-relaxed">{children}</p>
    </div>
  );
}

export default function Docs() {
  const [active, setActive] = useState("quickstart");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );

    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) {
        sectionRefs.current[s.id] = el;
        obs.observe(el);
      }
    });

    return () => obs.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="pt-24 flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 flex-shrink-0 border-r border-white/[0.06]/30 sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto py-10 px-8">
          <div className="text-[11px] font-medium text-zinc-500 mb-6">
            Documentation
          </div>
          <nav className="space-y-0.5">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`block w-full text-left text-[13px] px-3 py-2.5 transition-all duration-200 rounded cursor-pointer ${
                  active === s.id
                    ? "text-zinc-200 bg-zinc-800/40 font-medium"
                    : "text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/20"
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>

          <div className="mt-10 pt-8 border-t border-white/[0.06]/30 space-y-3">
            <a href="https://github.com/aegis-protocol/aegisx" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-[12px] text-zinc-600 hover:text-zinc-300 transition-colors">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              View Source
            </a>
            <a href="/marketplace"
              className="flex items-center gap-2.5 text-[12px] text-zinc-600 hover:text-zinc-300 transition-colors">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M2 8h12M2 13h12" stroke="currentColor" strokeWidth="1.5"/></svg>
              Marketplace
            </a>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 max-w-4xl py-10 px-6 lg:px-14">
          {/* Mobile section nav */}
          <div className="lg:hidden mb-8 overflow-x-auto">
            <div className="flex gap-1 pb-2">
              {SECTIONS.map((s) => (
                <button key={s.id} onClick={() => scrollTo(s.id)}
                  className={`text-xs whitespace-nowrap px-3 py-2 rounded border transition-all cursor-pointer ${
                    active === s.id
                      ? "bg-zinc-800/40 text-zinc-200 border-white/[0.06]/40"
                      : "text-zinc-600 border-white/[0.06]/30 hover:text-zinc-400"
                  }`}
                >{s.label}</button>
              ))}
            </div>
          </div>

          {/* Quickstart */}
          <DocSection id="quickstart" title="Get Started in 60 Seconds">
            <p className="text-[14px] text-zinc-500 leading-relaxed mb-6">
              AegisX is a single binary. Download it, bootstrap your runtime, and start invoking operators with x402 payments. AegisX includes 57 built-in tools across Solana, Trading, Bags.fm, AI, Intelligence, and Browser categories.
            </p>
            <CodeBlock lang="bash" code={`# Install AegisX
curl -sSL https://aegisplace.com/install | sh

# Bootstrap runtime -- generates Solana wallet
$ aegisx init
AegisX runtime initialized.
   Address: 7xKXtQ9...9fGhR4m
   Config:  ~/.aegisx/config.yaml
   Wallet:  ~/.aegisx/wallet.json
   Tools:   57 tools loaded (Solana, Trading, Bags.fm, AI, Intel, Browser)

# Check your balance
$ aegisx balance
SOL:    0.000000000 (devnet)
USDC:   0.00 (devnet)
$AEGIS: 0.000000 (devnet)

# Get devnet tokens for testing
$ aegisx wallet airdrop 2
Requesting 2 SOL airdrop on devnet...
[OK] 2.0 SOL received.

# Search the Aegis Index
$ aegisx search "code review"
Found 847 operators matching "code review"
  1. code-review-agent    by aegis-labs    Diamond  94/100  0.00005 SOL/call
  2. solidity-auditor     by AuditDAO     Diamond  89/100  0.0002 SOL/call
  3. test-suite-gen       by TestForge    Diamond  85/100  0.00006 SOL/call

# Invoke an operator (pays creator automatically via x402)
$ aegisx invoke code-review-agent --file ./main.go
Payment: $0.05 USDC via x402 -> swapped to $AEGIS
Split:   60% Creator / 15% Validators / 12% Stakers / 8% Treasury / 3% Insurance / 2% Burn
Status:  [OK] Completed in 1.2s`} />
          </DocSection>

          {/* AegisX IDE */}
          <DocSection id="aegisx" title="AegisX IDE">
            <p className="text-[14px] text-zinc-500 leading-relaxed mb-6">
              AegisX is the full-featured IDE for building, testing, and deploying AI agents on Aegis. It ships with 57 built-in tools, integrated x402 payments, MCP server bridging, and Solana-native capabilities that no competitor offers -- not Cursor ($29B), not Copilot (20M users).
            </p>

            <div className="mb-6">
              <h3 className="text-[16px] font-normal text-zinc-200 mb-4">Installation</h3>
              <CodeBlock lang="bash" code={`# Install AegisX globally
curl -sSL https://aegisplace.com/install | sh

# Or install via npm
npm install -g aegisx

# Verify installation
$ aegisx --version
aegisx v1.0.0 (57 tools, MCP bridge, x402 payments)

# Initialize workspace
$ aegisx init
AegisX workspace initialized.
   Config:   ~/.aegisx/config.yaml
   Wallet:   ~/.aegisx/wallet.json
   Tools:    57 tools loaded
   MCP:      Bridge ready (aegisx mcp serve)`} />
            </div>

            <div className="mb-6">
              <h3 className="text-[16px] font-normal text-zinc-200 mb-4">Using the aegisx CLI</h3>
              <CodeBlock lang="bash" code={`# List all available tools
$ aegisx tools list
57 tools available:

  SOLANA (12 tools)
    wallet-create, wallet-balance, token-transfer, token-swap,
    stake-sol, unstake-sol, program-deploy, account-info,
    transaction-history, nft-mint, nft-transfer, spl-token-create

  TRADING (9 tools)
    jupiter-swap, jupiter-quote, limit-order, dca-create,
    portfolio-balance, price-feed, orderbook-depth,
    trade-history, pnl-calculator

  BAGS.FM (8 tools)
    bags-buy, bags-sell, bags-portfolio, bags-trending,
    bags-creator-info, bags-holder-list, bags-price-history,
    bags-volume-analytics

  AI (10 tools)
    code-review, code-generate, code-explain, test-generate,
    bug-detect, refactor-suggest, doc-generate, translate-code,
    security-audit, performance-analyze

  INTELLIGENCE (10 tools)
    on-chain-analyze, wallet-profile, token-scanner,
    whale-tracker, dex-monitor, liquidity-analyze,
    smart-money-track, risk-score, market-sentiment,
    social-sentiment

  BROWSER (8 tools)
    web-scrape, screenshot, pdf-extract, api-call,
    form-fill, link-extract, site-monitor, content-summarize

# Use a specific tool
$ aegisx tool jupiter-swap --from SOL --to USDC --amount 1.5
Swapping 1.5 SOL -> USDC via Jupiter...
[OK] Received 187.42 USDC (rate: 124.95)

# Get help on any tool
$ aegisx tool bags-buy --help
bags-buy: Buy a creator token on Bags.fm
  --creator  <address>   Creator wallet address
  --amount   <sol>       Amount in SOL to spend
  --slippage <pct>       Max slippage (default: 1%)`} />
            </div>

            <div className="mb-6">
              <h3 className="text-[16px] font-normal text-zinc-200 mb-4">MCP Server Mode</h3>
              <CodeBlock lang="bash" code={`# Start AegisX as an MCP server
$ aegisx mcp serve
AegisX MCP Server running on stdio
  Tools exposed: 57
  x402 payments: enabled
  Wallet: 7xKXtQ9...9fGhR4m
  Waiting for MCP client connection...

# Connect from Claude Code, Cursor, or any MCP client
# Add to your MCP config (e.g., claude_desktop_config.json):
{
  "mcpServers": {
    "aegisx": {
      "command": "aegisx",
      "args": ["mcp", "serve"],
      "env": {
        "AEGISX_WALLET": "~/.aegisx/wallet.json",
        "AEGISX_NETWORK": "mainnet-beta"
      }
    }
  }
}`} />
            </div>

            <InfoBox label="Why AegisX">
              Cursor raised at $29B. Copilot has 20M users. But neither offers Solana-native capabilities, x402 agent payments, or integrated DeFi tools. AegisX is the only IDE where an AI agent can discover an operator, evaluate its trust score, pay for it via x402, execute it in a sandboxed environment, and settle the payment on Solana -- all in a single workflow. With 57 tools including direct Bags.fm integration ($5B volume), AegisX gives agents access to real DeFi liquidity from day one.
            </InfoBox>
          </DocSection>

          {/* 57 Tools Reference */}
          <DocSection id="aegisx-tools" title="57 Tools Reference">
            <p className="text-[14px] text-zinc-500 leading-relaxed mb-6">
              AegisX ships with 57 tools organized into six categories. Each tool is available via the CLI, the MCP server bridge, and the SDK. All tools support x402 payments when invoked by external agents.
            </p>

            <div className="space-y-6 mb-8">
              {[
                {
                  category: "SOLANA",
                  count: 12,
                  tools: [
                    { name: "wallet-create", desc: "Generate a new Solana keypair with optional vanity prefix" },
                    { name: "wallet-balance", desc: "Check SOL, USDC, SPL token, and $AEGIS balances" },
                    { name: "token-transfer", desc: "Send SOL or SPL tokens to any Solana address" },
                    { name: "token-swap", desc: "Swap tokens via Jupiter aggregator with best-route optimization" },
                    { name: "stake-sol", desc: "Stake SOL with a validator for liquid staking rewards" },
                    { name: "unstake-sol", desc: "Unstake SOL with instant or delayed withdrawal" },
                    { name: "program-deploy", desc: "Deploy Anchor or native Solana programs to devnet/mainnet" },
                    { name: "account-info", desc: "Fetch account data, owner, lamports, and parsed token info" },
                    { name: "transaction-history", desc: "Query transaction history for any wallet address" },
                    { name: "nft-mint", desc: "Mint NFTs using Metaplex with metadata and collection support" },
                    { name: "nft-transfer", desc: "Transfer NFTs between wallets with royalty enforcement" },
                    { name: "spl-token-create", desc: "Create new SPL tokens with Token-2022 extensions" },
                  ],
                },
                {
                  category: "TRADING",
                  count: 9,
                  tools: [
                    { name: "jupiter-swap", desc: "Execute token swaps via Jupiter with MEV protection" },
                    { name: "jupiter-quote", desc: "Get real-time swap quotes with route breakdown" },
                    { name: "limit-order", desc: "Place limit orders on Jupiter or Serum orderbook" },
                    { name: "dca-create", desc: "Create dollar-cost-average schedules for any token pair" },
                    { name: "portfolio-balance", desc: "Aggregate portfolio value across all held tokens" },
                    { name: "price-feed", desc: "Real-time price data from Pyth, Switchboard, and Jupiter" },
                    { name: "orderbook-depth", desc: "View orderbook depth for any Serum/OpenBook market" },
                    { name: "trade-history", desc: "Export trade history with PnL calculations" },
                    { name: "pnl-calculator", desc: "Calculate realized and unrealized PnL for any position" },
                  ],
                },
                {
                  category: "BAGS.FM",
                  count: 8,
                  tools: [
                    { name: "bags-buy", desc: "Buy creator tokens on Bags.fm bonding curve" },
                    { name: "bags-sell", desc: "Sell creator tokens back to the bonding curve" },
                    { name: "bags-portfolio", desc: "View your Bags.fm portfolio with current valuations" },
                    { name: "bags-trending", desc: "Get trending creators by volume, holders, or price action" },
                    { name: "bags-creator-info", desc: "Fetch creator profile, stats, and holder distribution" },
                    { name: "bags-holder-list", desc: "List all holders of a creator token with positions" },
                    { name: "bags-price-history", desc: "Historical price data for any creator token" },
                    { name: "bags-volume-analytics", desc: "Volume analytics: daily, weekly, and cumulative" },
                  ],
                },
                {
                  category: "AI",
                  count: 10,
                  tools: [
                    { name: "code-review", desc: "AI-powered code review with security and quality analysis" },
                    { name: "code-generate", desc: "Generate code from natural language specifications" },
                    { name: "code-explain", desc: "Explain code functionality in plain language" },
                    { name: "test-generate", desc: "Auto-generate unit and integration tests" },
                    { name: "bug-detect", desc: "Static and AI-powered bug detection" },
                    { name: "refactor-suggest", desc: "Suggest refactoring improvements for cleaner code" },
                    { name: "doc-generate", desc: "Generate documentation from source code" },
                    { name: "translate-code", desc: "Translate code between programming languages" },
                    { name: "security-audit", desc: "Deep security audit with vulnerability classification" },
                    { name: "performance-analyze", desc: "Identify performance bottlenecks and optimization paths" },
                  ],
                },
                {
                  category: "INTELLIGENCE",
                  count: 10,
                  tools: [
                    { name: "on-chain-analyze", desc: "Deep analysis of on-chain activity patterns" },
                    { name: "wallet-profile", desc: "Profile a wallet: activity, holdings, risk score" },
                    { name: "token-scanner", desc: "Scan new tokens for rug pull indicators" },
                    { name: "whale-tracker", desc: "Track large wallet movements in real time" },
                    { name: "dex-monitor", desc: "Monitor DEX activity across Jupiter, Raydium, Orca" },
                    { name: "liquidity-analyze", desc: "Analyze liquidity depth and pool health" },
                    { name: "smart-money-track", desc: "Follow smart money wallets and their strategies" },
                    { name: "risk-score", desc: "Compute risk scores for tokens, wallets, and protocols" },
                    { name: "market-sentiment", desc: "Aggregate market sentiment from on-chain data" },
                    { name: "social-sentiment", desc: "Social media sentiment analysis for tokens/projects" },
                  ],
                },
                {
                  category: "BROWSER",
                  count: 8,
                  tools: [
                    { name: "web-scrape", desc: "Extract structured data from any web page" },
                    { name: "screenshot", desc: "Capture screenshots of web pages or elements" },
                    { name: "pdf-extract", desc: "Extract text, tables, and metadata from PDFs" },
                    { name: "api-call", desc: "Make authenticated API calls with response parsing" },
                    { name: "form-fill", desc: "Programmatically fill and submit web forms" },
                    { name: "link-extract", desc: "Extract and categorize all links from a page" },
                    { name: "site-monitor", desc: "Monitor websites for changes with diff alerts" },
                    { name: "content-summarize", desc: "Summarize web page content with key extraction" },
                  ],
                },
              ].map((cat) => (
                <div key={cat.category}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-[12px] font-medium text-zinc-300 tracking-wider">{cat.category}</div>
                    <div className="text-[10px] font-medium text-zinc-600">{cat.count} tools</div>
                    <div className="h-px flex-1 bg-white/[0.06]" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {cat.tools.map((t) => (
                      <div key={t.name} className="bg-white/[0.02]/30 border border-white/[0.06]/40 px-4 py-2.5 rounded flex items-start gap-3">
                        <code className="text-[11px] text-zinc-300 font-mono flex-shrink-0">{t.name}</code>
                        <span className="text-[11px] text-zinc-600">{t.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </DocSection>

          {/* MCP Server Bridge */}
          <DocSection id="mcp-bridge" title="MCP Server Bridge">
            <p className="text-[14px] text-zinc-500 leading-relaxed mb-6">
              AegisX functions as an MCP (Model Context Protocol) server, bridging all 57 tools into any MCP-compatible IDE or agent. This means Claude Code, Cursor, VS Code with Copilot, or any MCP client can access the full Aegis toolset including Solana operations, Bags.fm trading, and x402 payments.
            </p>

            <div className="mb-6">
              <h3 className="text-[16px] font-normal text-zinc-200 mb-4">How the MCP bridge works</h3>
              <div className="space-y-2">
                {[
                  { step: "1", title: "Start the MCP server", desc: "Run aegisx mcp serve. This exposes all 57 tools as MCP tool definitions on stdio, compatible with any MCP client." },
                  { step: "2", title: "Configure your IDE", desc: "Add aegisx to your MCP server config. The bridge auto-discovers tools, handles auth, and manages wallet connections." },
                  { step: "3", title: "Agent calls tools", desc: "Your AI agent (Claude, GPT, etc.) sees 57 tools in its context. When it calls a tool, the MCP bridge routes it through AegisX." },
                  { step: "4", title: "x402 payments settle", desc: "If the tool invokes a paid operator, x402 payment is handled automatically. The agent pays USDC, Aegis swaps to $AEGIS, splits revenue." },
                ].map((s) => (
                  <div key={s.step} className="flex gap-4 bg-white/[0.02]/30 border border-white/[0.06]/40 p-4 rounded">
                    <div className="w-8 h-8 rounded bg-zinc-800/60 flex items-center justify-center text-[13px] font-normal text-zinc-300 shrink-0">
                      {s.step}
                    </div>
                    <div>
                      <div className="text-[14px] font-medium text-zinc-200 mb-0.5">{s.title}</div>
                      <div className="text-[13px] text-zinc-500 leading-relaxed">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <CodeBlock lang="bash" code={`# Start AegisX MCP server
$ aegisx mcp serve
AegisX MCP Server v1.0.0
  Protocol:  MCP v1.1 (stdio transport)
  Tools:     57 exposed
  Wallet:    7xKXtQ9...9fGhR4m
  Network:   mainnet-beta
  x402:      enabled (auto-pay up to 0.10 USDC per call)
  Listening for MCP client connections...

# Example: Claude Code connects and lists tools
> tools/list
{
  "tools": [
    { "name": "wallet-balance", "description": "Check SOL, USDC, SPL token balances" },
    { "name": "jupiter-swap", "description": "Execute token swaps via Jupiter" },
    { "name": "bags-buy", "description": "Buy creator tokens on Bags.fm" },
    { "name": "code-review", "description": "AI-powered code review" },
    ... (57 tools total)
  ]
}

# Example: Agent calls a Solana tool through MCP
> tools/call { "name": "wallet-balance", "arguments": { "address": "7xKXtQ9..." } }
{
  "content": [{ "type": "text", "text": "SOL: 12.45, USDC: 1,847.32, AEGIS: 25,000" }]
}`} />

            <div className="mt-6">
              <h3 className="text-[16px] font-normal text-zinc-200 mb-4">MCP Configuration Examples</h3>
              <CodeBlock lang="json" code={`// Claude Desktop / Claude Code config
// ~/.config/claude/claude_desktop_config.json
{
  "mcpServers": {
    "aegisx": {
      "command": "aegisx",
      "args": ["mcp", "serve"],
      "env": {
        "AEGISX_WALLET": "~/.aegisx/wallet.json",
        "AEGISX_NETWORK": "mainnet-beta",
        "AEGISX_X402_AUTO_PAY": "true",
        "AEGISX_X402_MAX_PER_CALL": "0.10"
      }
    }
  }
}

// Cursor / VS Code MCP config
// .cursor/mcp.json or .vscode/mcp.json
{
  "servers": {
    "aegisx": {
      "command": "aegisx",
      "args": ["mcp", "serve", "--tools", "all"],
      "env": {
        "AEGISX_WALLET": "~/.aegisx/wallet.json"
      }
    }
  }
}`} />
            </div>

            <InfoBox label="x402 Auto-Pay">
              When an agent invokes a paid operator through the MCP bridge, x402 payments are handled automatically. Set AEGISX_X402_AUTO_PAY=true and AEGISX_X402_MAX_PER_CALL to control the maximum per-call spend. The agent never needs to understand x402 -- it just calls tools, and AegisX handles payment negotiation, wallet signing, and on-chain settlement. This is what makes autonomous agent commerce possible.
            </InfoBox>
          </DocSection>

          {/* Architecture */}
          <DocSection id="architecture" title="Protocol Stack">
            <p className="text-[14px] text-zinc-500 leading-relaxed mb-6">
              Aegis is composed of seven layers. Each layer is independent and can be used separately, but they compose into a unified economic protocol when used together.
            </p>
            <div className="space-y-2 mb-6">
              {[
                { layer: "Discovery", desc: "Aegis Index -- operators indexed via operators.sh and Hugging Face Spaces", tech: "REST API, OPERATOR.md parser, GitHub + HF crawler, pgvector semantic search" },
                { layer: "Communication", desc: "A2A protocol integration for trust-gated agent-to-agent delegation", tech: "Google/IBM A2A, Agent Cards, task negotiation, reputation gates" },
                { layer: "Execution", desc: "Deno-sandboxed operator runtime with explicit permission grants", tech: "Deno isolate, --allow-net, --allow-read, --allow-env" },
                { layer: "Economics", desc: "Bonded registration, x402 micropayments, revenue splits", tech: "Solana programs (Anchor), Token-2022 transfer hooks, Jupiter swap" },
                { layer: "Validation", desc: "Stake-weighted attestation with replayable observation loops", tech: "aegis-operator-registry, PDA vaults, audit trace logs" },
                { layer: "Identity", desc: "ERC-8004 bridge for cross-chain agent identity", tech: "ERC-8004 registry, Wormhole bridge, Solana-Ethereum attestation" },
                { layer: "Reputation", desc: "On-chain success rates, time decay, cross-chain portability", tech: "aegis-reputation program, ERC-8004 bridge, NIST compliance" },
              ].map((l) => (
                <div key={l.layer} className="bg-white/[0.02]/30 border border-white/[0.06]/40 p-5 rounded flex items-start gap-5">
                  <div className="text-[14px] text-zinc-200 font-normal w-28 flex-shrink-0 pt-0.5">{l.layer}</div>
                  <div className="flex-1">
                    <div className="text-[14px] text-zinc-400">{l.desc}</div>
                    <div className="text-[11px] text-zinc-600 mt-1 font-mono">{l.tech}</div>
                  </div>
                </div>
              ))}
            </div>
          </DocSection>

          {/* x402 Payment Flow -- NEW COMPREHENSIVE SECTION */}
          <DocSection id="x402" title="x402 Payment Flow">
            <p className="text-[14px] text-zinc-500 leading-relaxed mb-6">
              Aegis uses the x402 payment protocol, an open standard for HTTP-native micropayments. Agents pay in USDC via standard HTTP 402 headers. Aegis receives the USDC and swaps to $AEGIS via Jupiter, then executes the revenue split atomically on Solana.
            </p>

            <div className="mb-8">
              <h3 className="text-[16px] font-normal text-zinc-200 mb-4">How it works</h3>
              <div className="space-y-2">
                {[
                  { step: "1", title: "Agent requests invocation", desc: "The consumer agent calls aegisx invoke <operator> --pay x402. The CLI sends an HTTP request to the operator's endpoint." },
                  { step: "2", title: "Operator responds with 402", desc: "The operator server returns HTTP 402 Payment Required with an X-Payment-402 header containing the price, asset (USDC), and chain (Solana)." },
                  { step: "3", title: "Agent wallet signs payment", desc: "The agent's wallet signs a USDC transfer for the exact amount. This is gasless via a facilitator relay, so the agent does not need SOL for gas." },
                  { step: "4", title: "Agent retries with proof", desc: "The agent retries the original request with an X-Payment-Signature header containing the signed payment proof." },
                  { step: "5", title: "Facilitator settles on-chain", desc: "The facilitator verifies the signature, settles the USDC transfer on Solana, and forwards the request to the operator." },
                  { step: "6", title: "USDC swapped to $AEGIS", desc: "Aegis middleware receives the USDC and swaps it to $AEGIS via Jupiter aggregator in the same transaction." },
                  { step: "7", title: "Revenue split executed", desc: "The $AEGIS is split atomically: 60% to Creator, 15% to Validator pool, 12% to Stakers, 8% to Treasury, 3% to Insurance fund, 2% burned permanently." },
                ].map((s) => (
                  <div key={s.step} className="flex gap-4 bg-white/[0.02]/30 border border-white/[0.06]/40 p-4 rounded">
                    <div className="w-8 h-8 rounded bg-zinc-800/60 flex items-center justify-center text-[13px] font-normal text-zinc-300 shrink-0">
                      {s.step}
                    </div>
                    <div>
                      <div className="text-[14px] font-medium text-zinc-200 mb-0.5">{s.title}</div>
                      <div className="text-[13px] text-zinc-500 leading-relaxed">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <CodeBlock lang="http" code={`# Step 1: Initial request
POST /invoke/code-review-agent HTTP/1.1
Host: aegisplace.com/api
Content-Type: application/json

{ "file": "main.go", "content": "..." }

# Step 2: 402 response
HTTP/1.1 402 Payment Required
X-Payment-402: {
  "amount": "0.05",
  "asset": "USDC",
  "chain": "solana",
  "recipient": "AegisProtocol...Treasury",
  "facilitator": "https://pay.aegisplace.com/verify"
}

# Step 3-4: Retry with payment proof
POST /invoke/code-review-agent HTTP/1.1
Host: aegisplace.com/api
X-Payment-Signature: eyJhbGciOiJFZDI1NTE5...
X-Payment-Chain: solana
Content-Type: application/json

{ "file": "main.go", "content": "..." }

# Step 5-7: Success (payment settled, split executed)
HTTP/1.1 200 OK
X-Payment-Receipt: {
  "tx": "5KxR7...fGhiJ",
  "split": { "creator": "8.68 AEGIS", "validator": "2.48 AEGIS", "treasury": "1.12 AEGIS", "burned": "0.12 AEGIS" },
  "latency": "412ms"
}`} />

            <InfoBox label="Distribution Channel">
              The x402 protocol is supported by Cloudflare Workers, Google Cloud, Vercel, and every major agent framework. Any agent that speaks x402 can invoke Aegis operators without acquiring $AEGIS directly. They pay in USDC, Aegis handles the swap. This gives Aegis access to the entire x402 ecosystem as a distribution channel.
            </InfoBox>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { metric: "~400ms", label: "Settlement latency (Solana finality)" },
                { metric: "Gasless", label: "Agents pay USDC only, no SOL needed" },
                { metric: "Atomic", label: "Payment + split in one transaction" },
              ].map((m) => (
                <div key={m.label} className="bg-white/[0.02]/30 border border-white/[0.06]/40 rounded p-4 text-center">
                  <div className="text-[20px] font-normal text-zinc-200 mb-1">{m.metric}</div>
                  <div className="text-[12px] text-zinc-500">{m.label}</div>
                </div>
              ))}
            </div>
          </DocSection>

          {/* Operator Registration -- NEW COMPREHENSIVE SECTION */}
          <DocSection id="registration" title="Operator Registration">
            <p className="text-[14px] text-zinc-500 leading-relaxed mb-6">
              Registering an operator on Aegis requires staking $AEGIS tokens as a bond. This bond is held in a PDA vault on-chain and serves as economic collateral. If the operator is challenged and found to be malicious, broken, or misrepresented, the bond is slashed. This creates accountability that GitHub stars cannot provide.
            </p>

            <div className="mb-8">
              <h3 className="text-[16px] font-normal text-zinc-200 mb-4">Registration steps</h3>
              <div className="space-y-2">
                {[
                  { step: "1", title: "Create your OPERATOR.md", desc: "Define your operator's name, description, pricing model, and Aegis economic extension fields. See the Operator Format section for the full spec." },
                  { step: "2", title: "Acquire $AEGIS tokens", desc: "You need a minimum of 12,500 $AEGIS for the creator bond. Tokens can be acquired on Jupiter or earned through validator rewards." },
                  { step: "3", title: "Register via CLI", desc: "Run aegisx register with your operator details. The CLI creates a PDA on Solana, transfers your bond to the vault, and sets the operator status to Pending." },
                  { step: "4", title: "Await validation", desc: "Bonded validators review your operator. They run it in a sandbox, verify the OPERATOR.md claims, and submit stake-weighted attestations." },
                  { step: "5", title: "Go live", desc: "Once validated, your operator appears in the Aegis Index and marketplace. Every invocation automatically pays you 60% of the fee." },
                ].map((s) => (
                  <div key={s.step} className="flex gap-4 bg-white/[0.02]/30 border border-white/[0.06]/40 p-4 rounded">
                    <div className="w-8 h-8 rounded bg-zinc-800/60 flex items-center justify-center text-[13px] font-normal text-zinc-300 shrink-0">
                      {s.step}
                    </div>
                    <div>
                      <div className="text-[14px] font-medium text-zinc-200 mb-0.5">{s.title}</div>
                      <div className="text-[13px] text-zinc-500 leading-relaxed">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <CodeBlock lang="bash" code={`# Register an operator with a 12,500 $AEGIS bond
$ aegisx register \\
    --name code-review-agent \\
    --repo owner/code-review-agent \\
    --stake 12500 \\
    --price 0.05

Registering operator on Aegis Registry...
  Bond:    12,500 $AEGIS -> PDA vault
  Price:   $0.05 USDC per call (via x402)
  Status:  Pending validation
  TX:      5KxR7...fGhiJ

# Check your registered operators
$ aegisx list --mine
  code-review-agent  12,500 $AEGIS bonded  Pending  0 invocations

# Update pricing after registration
$ aegisx update code-review-agent --price 0.08
Price updated: $0.05 -> $0.08 USDC per call
TX: 8mNp2...kLqW3

# Withdraw bond (only after 30-day cooldown with no active challenges)
$ aegisx unregister code-review-agent
Cooldown check: 47 days since last challenge [PASSED]
Bond returned: 12,500 $AEGIS -> your wallet
TX: 3vRt9...xHjK7`} />

            <InfoBox label="Bond Protection">
              Your bond is safe as long as your operator performs as described. Bonds are only slashed when a challenge is upheld by the validator network. The challenge process requires the challenger to also stake $AEGIS, preventing frivolous disputes. If a challenge is rejected, the challenger loses their stake.
            </InfoBox>
          </DocSection>

          {/* SDK Integration -- NEW COMPREHENSIVE SECTION */}
          <DocSection id="sdk" title="SDK Integration">
            <p className="text-[14px] text-zinc-500 leading-relaxed mb-6">
              The Aegis SDK provides programmatic access to the full protocol. Available in TypeScript, Python, and Rust. All SDKs handle x402 payment negotiation, wallet management, and Solana transaction signing automatically.
            </p>

            <div className="mb-6">
              <h3 className="text-[16px] font-normal text-zinc-200 mb-4">TypeScript SDK</h3>
              <CodeBlock lang="typescript" code={`import { AegisClient, Wallet } from "@aegis-protocol/sdk";

// Initialize client with your wallet
const wallet = Wallet.fromFile("~/.aegisx/wallet.json");
const aegis = new AegisClient({
  network: "mainnet-beta",  // or "devnet"
  wallet,
});

// Search for operators
const results = await aegis.search("code review", {
  minReputation: 60,
  maxPrice: 0.10,
  tier: "Gold",
});

console.log(results);
// [
//   { name: "code-review-agent", reputation: 94, price: 0.05, tier: "Diamond" },
//   { name: "solidity-auditor", reputation: 89, price: 0.08, tier: "Diamond" },
// ]

// Invoke an operator with automatic x402 payment
const result = await aegis.invoke("code-review-agent", {
  file: "./main.go",
  options: { language: "go", depth: "thorough" },
});

console.log(result.output);     // The code review output
console.log(result.payment);    // { amount: "0.05 USDC", tx: "5KxR7...", split: {...} }
console.log(result.latency);    // "1,247ms"

// Register a new operator
const registration = await aegis.register({
  name: "my-operator",
  repo: "myorg/my-operator",
  bond: 12500,           // $AEGIS
  price: 0.05,           // USDC per call
  pricingModel: "per_call",
});

console.log(registration.tx);   // Solana transaction hash
console.log(registration.pda);  // PDA address for the operator`} />
            </div>

            <div className="mb-6">
              <h3 className="text-[16px] font-normal text-zinc-200 mb-4">Python SDK</h3>
              <CodeBlock lang="python" code={`from aegis_sdk import AegisClient, Wallet

# Initialize
wallet = Wallet.from_file("~/.aegisx/wallet.json")
client = AegisClient(network="mainnet-beta", wallet=wallet)

# Search and invoke
results = client.search("data analysis", min_reputation=70)
result = client.invoke("data-analyst-agent", {
    "dataset": "sales_q4.csv",
    "query": "Find top 10 customers by revenue"
})

print(result.output)   # Analysis results
print(result.payment)  # Payment receipt with tx hash

# Batch invocations with automatic retry
results = client.batch_invoke(
    operator="code-review-agent",
    inputs=[
        {"file": "auth.py"},
        {"file": "api.py"},
        {"file": "models.py"},
    ],
    max_concurrent=3,
    retry_on_failure=True,
)

for r in results:
    print(f"{r.input['file']}: {r.status} ({r.latency}ms)")`} />
            </div>

            <div className="mb-6">
              <h3 className="text-[16px] font-normal text-zinc-200 mb-4">Rust SDK</h3>
              <CodeBlock lang="rust" code={`use aegis_sdk::{AegisClient, Wallet, InvokeOptions};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let wallet = Wallet::from_file("~/.aegisx/wallet.json")?;
    let client = AegisClient::new("mainnet-beta", wallet).await?;

    // Invoke with typed response
    let result = client
        .invoke("code-review-agent", InvokeOptions {
            file: Some("./main.rs".into()),
            timeout: std::time::Duration::from_secs(30),
            ..Default::default()
        })
        .await?;

    println!("Output: {}", result.output);
    println!("TX: {}", result.payment.tx);

    Ok(())
}`} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
              {[
                { pkg: "@aegis-protocol/sdk", lang: "TypeScript", install: "npm install @aegis-protocol/sdk" },
                { pkg: "aegis-sdk", lang: "Python", install: "pip install aegis-sdk" },
                { pkg: "aegis-sdk", lang: "Rust", install: "cargo add aegis-sdk" },
              ].map((p) => (
                <div key={p.lang} className="bg-white/[0.02]/30 border border-white/[0.06]/40 rounded p-4">
                  <div className="text-[14px] font-normal text-zinc-200 mb-1">{p.lang}</div>
                  <code className="text-[11px] text-zinc-500 font-mono">{p.install}</code>
                </div>
              ))}
            </div>

            <InfoBox label="MCP Server Integration">
              AegisX ships as a native MCP server, making it compatible with Claude Code, Cursor, VS Code, and any MCP-compatible agent. Run <code className="text-zinc-400 font-mono text-[12px]">aegisx mcp serve</code> to expose all 57 tools as MCP tools. Your agent can then discover, invoke, and pay for operators through the standard MCP tool-calling interface. See the MCP Server Bridge section above for full configuration.
            </InfoBox>
          </DocSection>

          {/* Operator Format */}
          <DocSection id="operators" title="Aegis OPERATOR.md Format">
            <p className="text-[14px] text-zinc-500 leading-relaxed mb-6">
              Aegis extends the standard OPERATOR.md format (adopted by Anthropic and OpenAI) with an economic metadata block. This is backward-compatible. Any standard OPERATOR.md works; the economic fields are optional.
            </p>
            <CodeBlock lang="yaml" code={`---
name: code-review-agent
description: Automated code review with security analysis
version: 1.2.0
author: aegis-labs
license: MIT

# === Aegis Economic Extension ===
aegis:
  pricing:
    model: per_call          # per_call | per_minute | flat
    price_lamports: 50000    # 0.00005 SOL
    currency: SOL
  staking:
    bond_aegis: 12500        # 12,500 $AEGIS creator bond
    min_validator_bond: 2500 # 2,500 $AEGIS minimum
  revenue:
    creator_share: 70
    validator_share: 20
    protocol_share: 9
    burn_share: 1
  trust:
    model: crypto-economic   # ERC-8004 trust model
    x402_support: true       # x402 payment protocol
    min_reputation: 0        # minimum rep to invoke
---`} />
          </DocSection>

          {/* Staking */}
          <DocSection id="staking" title="$AEGIS Bonded Registration">
            <p className="text-[14px] text-zinc-500 leading-relaxed mb-6">
              Operator creators stake $AEGIS tokens to register. The bond is held in a PDA vault on-chain. If the operator is challenged and found to be malicious, broken, or misrepresented, the bond is slashed. This creates economic accountability that GitHub stars cannot provide.
            </p>
            <CodeBlock lang="bash" code={`# Register an operator with a 12,500 $AEGIS bond
$ aegisx register \\
    --name code-review-agent \\
    --repo owner/code-review-agent \\
    --stake 12500 \\
    --price 0.05

Registering operator on Aegis Registry...
  Bond:    12,500 $AEGIS -> PDA vault
  Price:   $0.05 USDC per call (via x402)
  Status:  Pending validation
  TX:      5KxR7...fGhiJ

# Check your registered operators
$ aegisx list --mine
  code-review-agent  12,500 $AEGIS bonded  Pending  0 invocations`} />

            <InfoBox label="Token-2022 Integration">
              $AEGIS uses Solana's Token-2022 program with a built-in transfer fee extension. Every token transfer automatically contributes to the protocol treasury. No smart contract workarounds needed.
            </InfoBox>
          </DocSection>

          {/* Validation */}
          <DocSection id="validation" title="Bonded Validation">
            <p className="text-[14px] text-zinc-500 leading-relaxed mb-6">
              Validators stake $AEGIS to review operators. Their attestations are stake-weighted. A validator with 50,000 $AEGIS bonded has more influence than one with 2,500. Inaccurate reviews result in bond slashing.
            </p>
            <div className="space-y-2 mb-6">
              {[
                { tier: "Apprentice", bond: "2,500 $AEGIS", weight: "1x", desc: "Entry level. Can review, limited influence." },
                { tier: "Journeyman", bond: "12,500 $AEGIS", weight: "3x", desc: "Standard validator. Full review capabilities." },
                { tier: "Master", bond: "50,000 $AEGIS", weight: "10x", desc: "Trusted reviewer. Can initiate challenges." },
                { tier: "Grandmaster", bond: "250,000 $AEGIS", weight: "50x", desc: "Top tier. Can resolve disputes. Highest rewards." },
              ].map((t) => (
                <div key={t.tier} className="bg-white/[0.02]/30 border border-white/[0.06]/40 p-4 rounded flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                  <div className="text-[14px] text-zinc-200 font-normal w-28 flex-shrink-0">{t.tier}</div>
                  <div className="text-[13px] text-zinc-400 w-28">{t.bond}</div>
                  <div className="text-[13px] text-zinc-500 w-10">{t.weight}</div>
                  <div className="text-[13px] text-zinc-500 flex-1">{t.desc}</div>
                </div>
              ))}
            </div>
          </DocSection>

          {/* Operator Sandboxing */}
          <DocSection id="sandboxing" title="Deno-Sandboxed Execution">
            <p className="text-[14px] text-zinc-500 leading-relaxed mb-6">
              Every operator invocation runs inside a Deno-based permission sandbox. The runtime treats all operators as untrusted code by default. Explicit permission grants are required before an operator can access the network, filesystem, or environment variables. This is zero-trust execution at the runtime level.
            </p>
            <CodeBlock lang="bash" code={`# Invoke with strict sandboxing (default)
$ aegisx invoke code-review-agent --sandbox strict
Sandbox: Deno isolate v1.40
  --allow-net=api.openai.com    (operator declared dependency)
  --allow-read=./src            (scoped to input files)
  --deny-write                  (no filesystem writes)
  --deny-env                    (no env access)
  --deny-run                    (no subprocess spawning)
  --max-memory=256MB
  --max-time=30s

# Invoke with relaxed sandboxing (trusted operators only)
$ aegisx invoke code-review-agent --sandbox relaxed
Sandbox: Deno isolate v1.40
  --allow-net                   (all network access)
  --allow-read                  (all filesystem reads)
  --deny-write
  --deny-env
  --max-memory=512MB
  --max-time=60s`} />

            <div className="mt-6 space-y-2">
              {[
                { perm: "--allow-net", desc: "Network access. Scoped to declared API endpoints in OPERATOR.md.", risk: "Medium" },
                { perm: "--allow-read", desc: "Filesystem reads. Scoped to input files passed by the consumer.", risk: "Low" },
                { perm: "--allow-write", desc: "Filesystem writes. Denied by default. Only for output-producing operators.", risk: "High" },
                { perm: "--allow-env", desc: "Environment variable access. Denied by default. Only for operators needing API keys.", risk: "High" },
                { perm: "--allow-run", desc: "Subprocess spawning. Denied by default. Reserved for build/test operators.", risk: "Critical" },
              ].map((p) => (
                <div key={p.perm} className="bg-white/[0.02]/30 border border-white/[0.06]/40 p-4 rounded flex items-center gap-5">
                  <code className="text-[12px] text-zinc-300 font-mono w-36 flex-shrink-0">{p.perm}</code>
                  <div className="text-[13px] text-zinc-500 flex-1">{p.desc}</div>
                  <div className={`text-[10px] font-medium px-2.5 py-1 rounded border ${
                    p.risk === "Critical" ? "text-red-400/80 border-red-400/20 bg-red-400/5" :
                    p.risk === "High" ? "text-orange-400/80 border-orange-400/20 bg-orange-400/5" :
                    p.risk === "Medium" ? "text-amber-400/80 border-amber-400/20 bg-amber-400/5" :
                    "text-zinc-300/80 border-white/[0.06]/30 bg-zinc-800/20"
                  }`}>{p.risk}</div>
                </div>
              ))}
            </div>

            <InfoBox label="Why Deno">
              Deno's permission model is the only production-ready runtime that enforces capability-based security at the process level. Node.js has no equivalent. Bun has no equivalent. The Deno sandbox means a malicious operator cannot exfiltrate data, spawn processes, or access environment variables without explicit consumer consent, even if the operator code is compromised.
            </InfoBox>
          </DocSection>

          {/* Observation Loops */}
          <DocSection id="observation" title="Observation Loops">
            <p className="text-[14px] text-zinc-500 leading-relaxed mb-6">
              Every validator challenge produces a replayable audit trace. This is deterministic scaffolding around non-deterministic AI. Observation loops make every decision auditable, every attestation verifiable, and every dispute resolvable with evidence.
            </p>
            <CodeBlock lang="bash" code={`# Challenge an operator -- observation loop is recorded automatically
$ aegisx challenge code-review-agent \\
    --stake 500 \\
    --reason "Returns empty response for Go files"

Challenge initiated.
  Challenge ID:  ch_7xKXtQ9...9fGhR4m
  Bond:          500 $AEGIS
  Observation:   Recording...

# The observation loop captures:
#   1. Input: exact file and parameters sent to the operator
#   2. Execution: Deno sandbox logs, network calls, timing
#   3. Output: raw response from the operator
#   4. Validator attestation: the original quality review
#   5. Challenge evidence: the challenger's reproduction steps
#
# All stored on-chain as a compressed Merkle proof.

# View the observation trace
$ aegisx trace ch_7xKXtQ9...9fGhR4m
Observation Trace:
  [T+0ms]    Input received: main.go (2,847 bytes)
  [T+12ms]   Sandbox started: Deno isolate, --allow-net=api.openai.com
  [T+45ms]   Network call: POST api.openai.com/v1/chat/completions
  [T+1,203ms] Response received: 200 OK (4,102 bytes)
  [T+1,210ms] Output generated: 0 bytes  <-- EMPTY RESPONSE
  [T+1,211ms] Sandbox terminated: exit code 0
  Verdict:   Challenge evidence supports claim. Awaiting market resolution.`} />

            <InfoBox label="Agentic Engineering Pattern">
              Observation loops are the core pattern from agentic engineering applied to operator validation. The pattern is simple: wrap every non-deterministic operation in a deterministic observation frame. Record inputs, execution traces, and outputs. Make the frame replayable. This turns "the AI did something wrong" into "here is the exact sequence of events, verifiable by anyone."
            </InfoBox>
          </DocSection>

          {/* Reputation */}
          <DocSection id="reputation" title="On-Chain Reputation">
            <p className="text-[14px] text-zinc-500 leading-relaxed mb-6">
              Every operator and validator has an on-chain reputation score (0-100) stored in the aegis-reputation Solana program. Scores are computed from successful completions, failures, slashing events, and time decay. The reputation is portable via the ERC-8004 bridge.
            </p>
            <CodeBlock lang="text" code={`Reputation Tiers:
  Diamond   80-100  Highest trust. Premium pricing enabled.
  Gold      60-79   Established. Full marketplace access.
  Silver    40-59   Growing. Standard access.
  Bronze    20-39   New. Limited to low-value invocations.
  Unranked   0-19   Untested. Must build track record.

Score Factors:
  +2  Successful operator completion (verified by consumer)
  +5  Positive validator attestation (stake-weighted)
  -10 Failed invocation (consumer reported)
  -25 Challenge upheld (bond partially slashed)
  -50 Malicious behavior (full bond slashed)

Time Decay:
  Scores decay 1% per week of inactivity.
  Active operators maintain their score naturally.`} />
          </DocSection>

          {/* Solana Programs */}
          <DocSection id="programs" title="On-Chain Programs">
            <p className="text-[14px] text-zinc-500 leading-relaxed mb-6">
              Aegis deploys four Anchor programs to Solana. Each program handles a specific domain of the protocol. All programs are MIT licensed and auditable.
            </p>
            <div className="space-y-3">
              {[
                { name: "aegis-operator-registry", desc: "Operator registration, bonding, invocation tracking, challenge/resolution, revenue splitting.", instructions: "register_operator, validate_operator, invoke_operator, challenge_operator, resolve_challenge, record_observation" },
                { name: "aegis-reputation", desc: "On-chain success rates with time decay, tier computation, and ERC-8004 cross-chain bridging.", instructions: "initialize, record_completion, record_failure, apply_slash, bridge_to_erc8004" },
                { name: "aegis-prediction-market", desc: "Dispute resolution via prediction markets. Observation loop traces submitted as evidence.", instructions: "create_market, place_bet, resolve_market, claim_winnings, submit_trace" },
                { name: "aegis-token", desc: "Token-2022 $AEGIS token with transfer hooks for protocol-level bond enforcement, staking vaults, and governance.", instructions: "initialize_mint, stake, unstake, claim_rewards, set_transfer_hook" },
              ].map((p) => (
                <div key={p.name} className="border border-white/[0.06]/40 bg-white/[0.02]/30 p-5 rounded">
                  <div className="text-[14px] text-zinc-200 font-normal mb-1">{p.name}</div>
                  <div className="text-[13px] text-zinc-500 mb-2">{p.desc}</div>
                  <div className="text-[11px] text-zinc-600 font-mono">Instructions: {p.instructions}</div>
                </div>
              ))}
            </div>
          </DocSection>

          {/* A2A Protocol */}
          <DocSection id="a2a" title="A2A Protocol Integration">
            <p className="text-[14px] text-zinc-500 leading-relaxed mb-6">
              A2A (Agent-to-Agent) is Google and IBM's protocol for agents to discover each other, negotiate capabilities, and delegate tasks. Aegis adds trust-gated delegation: agents must meet minimum reputation thresholds before accepting or delegating high-value tasks.
            </p>
            <CodeBlock lang="bash" code={`# A2A integration with Aegis trust gates
$ aegisx a2a publish-card \\
    --name "code-review-ops" \\
    --capabilities "code-review,security-audit,test-gen" \\
    --min-requester-score 60

Agent Card published.
  Card ID:     ac_7xKXtQ9...9fGhR4m
  Capabilities: code-review, security-audit, test-gen
  Trust Gate:  min_requester_score >= 60

# Receive a task from another agent
$ aegisx a2a incoming
Incoming Task Request:
  From:        agent_0xAB12...CD34
  Reputation:  72/100 (Gold tier)  [PASSES trust gate]
  Task:        "Review Solana program for reentrancy"
  Payment:     0.15 USDC via x402
  Status:      Accepted automatically

# Delegate a subtask to a specialist
$ aegisx a2a delegate \\
    --to solidity-auditor \\
    --task "Check cross-program invocation safety" \\
    --budget 0.08

Delegation sent.
  Target score: 89/100 (Diamond)  [VERIFIED]
  Bond status:  50,000 $AEGIS bonded [ACTIVE]
  Payment:      0.08 USDC via x402`} />

            <InfoBox label="Trust-Gated Delegation">
              Without Aegis, A2A delegation is open. Any agent can request any task from any other agent. This enables Sybil attacks (create 100 agents, delegate to yourself to inflate reputation) and reputation laundering (route low-quality work through high-reputation agents). Aegis trust gates prevent both: minimum score requirements, bond verification, and on-chain delegation history make gaming the system economically irrational.
            </InfoBox>
          </DocSection>

          {/* Agentic Wallets */}
          <DocSection id="wallets" title="Coinbase Agentic Wallets">
            <p className="text-[14px] text-zinc-500 leading-relaxed mb-6">
              Coinbase Agentic Wallets let AI agents hold their own crypto wallets, sign transactions, and manage funds autonomously. Aegis validates agent identity and reputation before high-value wallet operations.
            </p>
            <CodeBlock lang="bash" code={`# Connect Aegis to a Coinbase Agentic Wallet
$ aegisx wallet connect-agentic \\
    --provider coinbase \\
    --wallet-id aw_9xKXtQ9...fGhR4m

Agentic Wallet connected.
  Provider:    Coinbase
  Wallet ID:   aw_9xKXtQ9...fGhR4m
  Autonomy:    Full (no human co-signing)
  Trust gate:  Aegis reputation >= 70 for txns > 1 SOL

# Wallet operations are trust-gated
$ aegisx wallet send 5.0 SOL --to 7xKXtQ9...9fGhR4m
Trust Check:
  Agent reputation:  78/100 (Gold)  [PASSES]
  Bond status:       25,000 $AEGIS [ACTIVE]
  Transaction limit: 10 SOL (Gold tier)
  Status:            APPROVED

# High-value operations require higher trust
$ aegisx wallet send 50.0 SOL --to 7xKXtQ9...9fGhR4m
Trust Check:
  Agent reputation:  78/100 (Gold)  [INSUFFICIENT]
  Required:          Diamond tier (80+) for txns > 10 SOL
  Status:            DENIED -- upgrade reputation to proceed`} />

            <InfoBox label="Why This Matters">
              Agentic Wallets are a breakthrough for agent autonomy but create a massive trust problem: how do you prevent an unauthorized or compromised agent from draining a wallet? Aegis provides the missing guardrail. Transaction limits are tied to on-chain reputation. An agent with a Bronze score cannot move more than 0.1 SOL. A Diamond agent can move up to 100 SOL. The success rate is earned through verified invocations, not self-reported.
            </InfoBox>
          </DocSection>

          {/* NVIDIA NeMo Stack */}
          <DocSection id="nvidia" title="NVIDIA NeMo Stack">
            <p className="text-[14px] text-zinc-500 leading-relaxed mb-6">
              Aegis integrates seven NVIDIA NeMo components at the protocol level. Every operator benefits from enterprise AI infrastructure across the full lifecycle: data curation, model building, evaluation, deployment, safety, optimization, and observability.
            </p>

            <div className="space-y-3 mb-8">
              {[
                { name: "NeMo Guardrails", desc: "5-layer safety enforcement on every invocation. Input, dialog, retrieval, execution, and output rails. Compliance rates feed success rates.", cmd: "aegisx invoke code-review --guardrails strict" },
                { name: "NeMo Evaluator", desc: "Continuous benchmarking with 24+ metrics. Accuracy, generative quality, code execution, and LLM-as-judge evaluations every 6 hours.", cmd: "aegisx eval code-review --suite full --judge llm" },
                { name: "NVIDIA NIM", desc: "GPU-optimized inference containers. OpenAI-compatible APIs, 4.2x speedup, auto-scaling. NIM operators get priority marketplace placement.", cmd: "aegisx deploy code-review --runtime nim --gpu a100" },
                { name: "Nemotron Models", desc: "Three model tiers: Nano (edge), Super (balanced), Ultra (max capability). Hybrid latent MoE architecture. Open weights and fine-tuning recipes.", cmd: "aegisx build --base nemotron-super --finetune domain" },
                { name: "NeMo Curator", desc: "Data quality pipeline: heuristic filtering, ML classification, deduplication, PII removal. 30+ languages. Clean data = better operators.", cmd: "aegisx curate --dataset training --pii strip --dedup fuzzy" },
                { name: "NeMo RL + Gym", desc: "GRPO and PPO reinforcement learning from real invocation data. NeMo Gym simulated environments. Every invocation makes operators better.", cmd: "aegisx optimize code-review --rl grpo --gym simulate" },
                { name: "NeMo Agent Toolkit", desc: "Full observability: telemetry, tracing, profiling. Compatible with LangChain, LlamaIndex, CrewAI. Validators use toolkit data for attestations.", cmd: "aegisx observe code-review --trace --profile" },
              ].map((item) => (
                <div key={item.name} className="border border-white/[0.06]/40 bg-white/[0.02]/30 p-5 rounded hover:bg-zinc-800/20 transition-all">
                  <h4 className="text-[14px] font-normal text-emerald-400 mb-1">{item.name}</h4>
                  <p className="text-[13px] text-zinc-500 leading-relaxed mb-3">{item.desc}</p>
                  <div className="text-[11px] font-mono px-3 py-2 border border-emerald-400/15 bg-emerald-400/[0.03] text-emerald-400/60 rounded">
                    $ {item.cmd}
                  </div>
                </div>
              ))}
            </div>
          </DocSection>

          {/* CLI Reference */}
          <DocSection id="cli" title="CLI Reference">
            <p className="text-[14px] text-zinc-500 leading-relaxed mb-6">
              AegisX is the high-performance runtime for the Aegis protocol. A single binary with 57 built-in tools that handles wallet management, operator discovery, x402 payments, MCP server bridging, Bags.fm integration, validation, and the full agent loop. All API endpoints reference aegisplace.com.
            </p>
            <div className="border border-white/[0.06]/40 rounded overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr] gap-4 px-5 py-3 border-b border-white/[0.06]/40 text-[11px] text-zinc-500 font-medium bg-white/[0.02]/30">
                <span>Command</span><span>Description</span>
              </div>
              {[
                { cmd: "aegisx init", desc: "Bootstrap runtime, generate Solana wallet" },
                { cmd: "aegisx wallet address", desc: "Show your Solana address" },
                { cmd: "aegisx balance", desc: "Check SOL, USDC, and $AEGIS balance" },
                { cmd: "aegisx wallet airdrop <amount>", desc: "Request devnet SOL airdrop" },
                { cmd: "aegisx wallet send <to> <amount>", desc: "Send SOL to an address" },
                { cmd: "aegisx wallet export", desc: "Export wallet as Solana-compatible JSON" },
                { cmd: "aegisx search <query>", desc: "Search the Aegis Index" },
                { cmd: "aegisx register", desc: "Register and bond an operator with $AEGIS" },
                { cmd: "aegisx invoke <operator>", desc: "Invoke an operator with x402 payment" },
                { cmd: "aegisx inspect <operator>", desc: "Show operator details and reputation" },
                { cmd: "aegisx list", desc: "List registered operators" },
                { cmd: "aegisx stats", desc: "Show marketplace statistics" },
                { cmd: "aegisx challenge <operator>", desc: "Challenge an operator with a dispute bond" },
                { cmd: "aegisx validate register", desc: "Register as a bonded validator" },
                { cmd: "aegisx validate --attest <op>", desc: "Attest to an operator's quality" },
                { cmd: "aegisx validate list", desc: "List active validators" },
                { cmd: "aegisx validate stats", desc: "Show your validator statistics" },
                { cmd: "aegisx stake <amount>", desc: "Stake $AEGIS tokens" },
                { cmd: "aegisx unstake <amount>", desc: "Unstake $AEGIS tokens" },
                { cmd: "aegisx rewards", desc: "View pending staking rewards" },
                { cmd: "aegisx install <repo>", desc: "Install an operator from GitHub" },
                { cmd: "aegisx run", desc: "Start the autonomous agent loop" },
                { cmd: "aegisx mcp serve", desc: "Start MCP server (57 tools) for Claude Code, Cursor, VS Code" },
                { cmd: "aegisx gateway", desc: "Start gateway (Telegram, Discord, Slack)" },
                { cmd: "aegisx version", desc: "Show version and runtime info" },
              ].map((c) => (
                <div key={c.cmd} className="grid grid-cols-[1fr_1fr] gap-4 px-5 py-3 border-b border-white/[0.06]/20 hover:bg-zinc-800/10 transition-colors">
                  <code className="text-[12px] text-zinc-300 font-mono">{c.cmd}</code>
                  <span className="text-[12px] text-zinc-500">{c.desc}</span>
                </div>
              ))}
            </div>
          </DocSection>
        </main>
      </div>
    </div>
  );
}
