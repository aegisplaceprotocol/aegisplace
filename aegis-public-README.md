<div align="center">

<img src="https://aegisplace.com/assets/fullvectorwhite.svg" alt="Aegis Protocol" height="40" />

<br /><br />

**The trust layer for autonomous AI agents on Solana.**

[![License: MIT](https://img.shields.io/badge/License-MIT-10B981?style=flat-square)](LICENSE)
[![Solana](https://img.shields.io/badge/Solana-Mainnet-9945FF?style=flat-square&logo=solana&logoColor=white)](https://solana.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![x402](https://img.shields.io/badge/x402-Native-FF6B00?style=flat-square)](https://x402.org)
[![MCP](https://img.shields.io/badge/MCP-Compatible-000?style=flat-square)](https://modelcontextprotocol.io)

[Website](https://aegisplace.com) · [Research](https://aegisplace.com/research) · [Documentation](https://aegisplace.com/docs) · [IDE](https://aegisplace.com/aegisx)

</div>

<br />

## What is Aegis

Aegis is a marketplace and trust layer for AI agent skills on Solana. It solves three problems that no existing platform addresses simultaneously.

**Discovery.** There are over 19,000 MCP servers in the wild. None of them have a trust score, a payment rail, or a way for agents to evaluate quality before invocation. Aegis provides a curated registry with on chain reputation scoring so agents can find tools they can actually rely on.

**Payments.** AI agents need to pay for services autonomously. Aegis integrates x402 micropayments (140M+ transactions, backed by Coinbase and Cloudflare) alongside traditional payment rails, enabling agents to pay per invocation with sub cent fees and sub second settlement on Solana.

**Trust.** When an agent calls a tool, how does it know the tool is safe, reliable, and worth paying for? Aegis uses bonded operators (economic stake), NeMo Guardrails (input/output validation), and on chain attestation to create verifiable trust without centralized curation.

## Why This Matters

The AI agent market is projected to reach $80B by 2030. Cursor alone is valued at $29B. GitHub Copilot has 20M users. But none of these platforms have a trust layer, none have autonomous payment capability, and none understand blockchain natively.

Meanwhile, Solana processes $650B in monthly stablecoin volume, has 3,200+ active developers, and hosts the Solana Agent Registry with 9,000+ registered agents. The infrastructure is ready. The missing piece is a marketplace that ties discovery, payments, and trust together in one protocol.

That is what Aegis builds.

## Key Capabilities

| Capability | What It Does |
|-----------|-------------|
| **Bonded Operators** | Skill providers stake tokens as a quality guarantee. Violations trigger automatic slashing. |
| **NeMo Guardrails** | Every invocation passes through NVIDIA NeMo safety rails. Input validation, output filtering, topic control, hallucination detection. |
| **x402 Micropayments** | Agents pay per invocation using the x402 protocol. No API keys, no subscriptions, no accounts. |
| **On Chain Reputation** | Trust scores are computed from invocation outcomes and stored on Solana. Fully transparent and verifiable. |
| **MCP Native** | Built on the Model Context Protocol standard adopted by Anthropic, OpenAI, Google, Microsoft, and 60+ organizations. |
| **Fee Splitting** | Revenue from invocations is split automatically between skill creators, validators, stakers, the protocol treasury, and an insurance fund. |
| **Bags.fm Integration** | Native integration with the Bags.fm creator economy ($5B+ total volume, $40M+ in creator payouts). Token launches, fee vaults, creator royalties across Twitter, TikTok, Kick, GitHub, and Moltbook. |

## AegisX

AegisX is the flagship AI-powered development environment built by Aegis Protocol for Solana. It is a full agentic coding environment: 86 Solana infrastructure module files, 14,524 lines of real implementation code, and native MCP integration that connects directly to the Aegis marketplace.

AegisX is not a wrapper around a general purpose IDE. It is a purpose-built agent with deep knowledge of the Solana ecosystem, Anchor programs, DeFi protocols, and the Aegis trust and payment stack. Every module is a production implementation, not a demo.

Visit [aegisplace.com/aegisx](https://aegisplace.com/aegisx) to try it in your browser, or run it locally with `./aegisx.sh`.

### Multi-Provider AI Engine

AegisX runs on whichever AI provider you choose. The `aegisx.sh` launcher opens an interactive provider picker at startup.

| Provider | Notes |
|----------|-------|
| **Anthropic** | Claude models, highest reasoning quality |
| **Google Gemini** | 1,500 free requests per day on the free tier |
| **Groq** | Free tier available, ultra-low latency inference |
| **Ollama** | Fully local, no API key required, no data leaves your machine |
| **OpenRouter** | Unified access to 100+ models from a single key |

Switch providers at any time. Your tools, modules, and marketplace connection persist across provider changes.

### 10 Aegis-Native Module Directories

AegisX ships with 10 module directories that map directly to the Aegis Protocol stack. These are not generic tools — they are Aegis-native implementations with 14,524 lines of code across 86 files.

| Module | What It Does |
|--------|-------------|
| **solana** | On chain actions: transfer, swap, stake, mint, deploy, simulate, derive PDA, manage accounts |
| **trust** | Query and compute trust scores, verify operator reputation, read on chain attestations |
| **guardrails** | NeMo Guardrails integration: input validation, output filtering, topic control, hallucination detection |
| **marketplace** | Browse the Aegis registry, discover skills, evaluate operators, read pricing and SLAs |
| **payments** | x402 micropayments and Stripe MPP: auto pay, paywall creation, revenue tracking, fee distribution |
| **operators** | Register skills, manage bonded stake, monitor uptime, respond to slashing events |
| **security** | Vulnerability scanning: missing signers, arithmetic overflow, unsafe CPI, PDA collisions, reinitialization |
| **defi** | Jupiter V6 quotes and swaps, limit orders, DCA, token analysis, sniping with safety checks |
| **bags** | Bags.fm integration: token launch, trade, fee vaults, social wallet resolution, app store, analytics |
| **intelligence** | Codemap, competitive intel, research synthesis: AST analysis, CoinGecko/DexScreener/GitHub data |

### Marketplace Connection via MCP

AegisX ships with a pre-configured `.mcp.json` that connects it to the Aegis marketplace. No manual setup required. From the moment AegisX starts, it can discover operators, query trust scores, invoke skills, and process payments — all through the same MCP interface that any Aegis-compatible agent uses.

This means AegisX is not just a development tool. It is also an agent that participates in the Aegis ecosystem as a first-class consumer.

### Tool Categories

| Category | Implementation | Highlights |
|----------|---------------|-----------|
| **Solana** | 24 on chain actions | Transfer, swap, stake, mint, deploy, simulate, derive PDA |
| **Security** | 15 vulnerability classes | Missing signers, arithmetic overflow, unsafe CPI, PDA collisions, reinitialization |
| **DeFi / Trading** | 10 actions | Jupiter V6 quotes, swaps, limit orders, DCA, token analysis, sniping with safety checks |
| **Bags.fm** | 6 tools, 34 actions | Token launch, trade, fee vaults, social wallet resolution, app store, analytics |
| **Orchestration** | Multi-agent swarms | Up to 16 concurrent agents with dependency graphs, conflict detection, scheduled sessions |
| **Payments** | x402 + Stripe MPP | Dual rail payments, auto pay, revenue tracking, paywall creation |
| **Intelligence** | Codemap, competitive intel, research | AST analysis, CoinGecko/DexScreener/GitHub data, Reddit/HN synthesis |
| **Security Gateway** | MCP server scanning | SSRF detection, env var exposure, CVE matching, tool allowlisting, audit trails |

**86 module files. 14,524 lines of implementation. Zero placeholder code.**

## Architecture

Aegis operates as three interconnected layers.

```
                    ┌─────────────────────────────────┐
                    │         Agent (Caller)           │
                    └───────────────┬─────────────────┘
                                    │
                            MCP + x402
                                    │
                    ┌───────────────▼─────────────────┐
                    │        Aegis Protocol            │
                    │                                  │
                    │  ┌──────────┐  ┌──────────────┐ │
                    │  │ Registry │  │  Guardrails   │ │
                    │  │ + Trust  │  │  (NeMo)      │ │
                    │  └──────────┘  └──────────────┘ │
                    │  ┌──────────┐  ┌──────────────┐ │
                    │  │ Payments │  │  Reputation   │ │
                    │  │ (x402)   │  │  (On Chain)  │ │
                    │  └──────────┘  └──────────────┘ │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │          Solana                   │
                    │   Settlement + Identity + State   │
                    └─────────────────────────────────┘
```

## Getting Started

```bash
# Install the CLI
npm install -g aegisx

# Configure your provider
aegisx providers

# Start the agent
aegisx

# Or start the MCP server for IDE integration
aegisx mcp serve
```

See the [Getting Started Guide](https://aegisplace.com/docs) for detailed setup instructions.

## Research

We publish peer reviewed working papers on the economics and infrastructure of agent skill marketplaces.

| Paper | Topic |
|-------|-------|
| [The Economics of Agent Skill Marketplaces](https://aegisplace.com/research) | Trust mechanisms, fee decomposition, bonded operator economics |
| [x402 Micropayments and the Agent Economy](https://aegisplace.com/research) | Why micropayments work for machines (Szabo 1996 revisited), settlement architecture |
| [Solana Native AI Development Environments](https://aegisplace.com/research) | Why general purpose IDEs fail Web3 developers, the vertical IDE thesis |

## Ecosystem

Aegis integrates with the protocols and platforms that define the agent infrastructure landscape.

| Partner | Integration |
|---------|------------|
| **Solana** | Settlement layer, Agent Registry (9,000+ agents), Solana Developer Platform |
| **Bags.fm** | Creator economy ($5B+ volume), fee vaults, social wallet resolution |
| **x402** | Micropayment protocol (140M+ transactions, Coinbase + Cloudflare) |
| **NVIDIA** | NeMo Guardrails for operator safety validation |
| **Anthropic** | Claude models for agent reasoning, MCP compatibility |
| **OpenAI** | GPT models, Codex integration |

## Competitive Landscape

We track every player in the agent infrastructure space. A detailed comparison is available at [aegisplace.com/compare](https://aegisplace.com/compare).

The short version: Cursor ($29B valuation) and Copilot (20M users) dominate general purpose AI coding. Windsurf, Antigravity, Bolt, and Replit compete in adjacent segments. None of them have on chain trust, autonomous payment capability, or native Solana tooling.

Aegis does not compete with general purpose IDEs. It provides the trust and payment layer that all of them lack, plus a purpose built development environment for the one ecosystem (Solana) that none of them serve.

## Documentation

| Resource | Description |
|----------|------------|
| [Getting Started](https://aegisplace.com/docs) | Installation, configuration, first invocation |
| [Tool Reference](https://aegisplace.com/docs) | All 86 module files, 14,524 lines — full parameters and examples |
| [MCP Integration](https://aegisplace.com/docs) | Connect AegisX to Cursor, VS Code, or any MCP-compatible agent |
| [x402 Payments](https://aegisplace.com/docs) | Setting up paywalls, auto pay, revenue tracking |
| [Security Model](https://aegisplace.com/docs) | Bonded operators, guardrails, slashing |

## Contributing

We welcome contributions from developers, researchers, and security auditors. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

If you discover a security vulnerability, please report it responsibly. Do not open public issues for security concerns. See [SECURITY.md](SECURITY.md) for our disclosure policy.

## License

[MIT](LICENSE)

<br />

<div align="center">

**Built on Solana. Powered by x402. Secured by Aegis.**

[aegisplace.com](https://aegisplace.com)

</div>
