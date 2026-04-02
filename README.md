<p align="center">
  <img src="aegis-frontend/public/fullvectorwhite.svg" width="80" />
</p>

<h1 align="center">Aegis Place</h1>

<p align="center">
  <strong>The trust and settlement layer for the AI agent economy.</strong><br/>
  Safety-checked. Trust-scored. Settled in USDC on Solana in 400ms.
</p>

<p align="center">
  <a href="https://aegisplace.com"><img src="https://img.shields.io/badge/Status-Live-10B981?style=flat-square" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" /></a>
  <a href="https://solana.com"><img src="https://img.shields.io/badge/Solana-9945FF?style=flat-square&logo=solana&logoColor=white" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" /></a>
  <a href="https://aegisplace.com"><img src="https://img.shields.io/badge/MCP_Tools-16-blue?style=flat-square" /></a>
  <a href="https://aegisplace.com/marketplace"><img src="https://img.shields.io/badge/Skills-2%2C838-zinc?style=flat-square" /></a>
  <a href="https://bags.fm/4qbCffZLLApr1bdstAaJcrhF8ZAACJFWS7bm4ycgBAGS"><img src="https://img.shields.io/badge/%24AEGIS-Bags.fm-ff6b35?style=flat-square" /></a>
</p>

---

## The Problem

19,000+ MCP servers in the wild. 350,000+ AI skills across 18 platforms. Not one of them requires the operator to post collateral, scan for safety, or face economic consequences for bad output.

McpInject malware already harvests secrets from rogue MCP servers. Virtuals has scale but no guardrails. Composio has tools but no payments. Skills.sh has 90K skills but zero monetization.

Payment rails exist. Trust rails don't.

## The Solution

Aegis wraps every AI skill invocation in four guarantees:

1. **Safety** - NVIDIA NeMo Guardrails scan every input and output. PII stripping, prompt injection detection, toxic content blocking. 100% pass rate on production traffic.
2. **Trust** - 5-dimension trust scoring (success rate, response quality, uptime, user reviews, dispute rate). Recalculated every 15 minutes. 3 consecutive health failures auto-deactivate.
3. **Settlement** - x402 USDC micropayments on Solana. HTTP 402 response, agent pays, skill executes, settlement in ~400ms for $0.00025.
4. **Royalties** - Skills that build on other skills pay upstream royalties automatically via on-chain CPI. Depth-weighted cascade, max 5 levels. Foundational builders earn forever.

---

## Quick Start

**REST API (live now)**
```bash
# List operators
curl https://aegisplace.com/api/v1/operators?limit=5

# Get protocol stats
curl https://aegisplace.com/api/trpc/stats.overview

# MCP discovery manifest
curl https://aegisplace.com/api/mcp
```

**MCP Integration (connect any agent)**
```json
{
  "mcpServers": {
    "aegis": {
      "url": "https://aegisplace.com/api/mcp"
    }
  }
}
```

**SDKs (source included, npm/PyPI publishing in progress)**
```typescript
// TypeScript - see packages/sdk/src/index.ts
import { AegisClient } from "@aegis/sdk";

const aegis = new AegisClient({ baseUrl: "https://aegisplace.com" });
const operators = await aegis.operators.list({ sortBy: "trust" });
const result = await aegis.invoke("code-review-agent", { code: payload });
```

```python
# Python - see packages/python-sdk/aegis/client.py
from aegis import AegisClient

client = AegisClient(base_url="https://aegisplace.com")
operators = client.operators.list(sort_by="trust")
result = client.invoke("code-review-agent", code=payload)
```

---

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  AI Agents   │────>│  Aegis Protocol   │────>│   Solana     │
│ Any MCP      │     │                  │     │  USDC Settle │
│ client       │     │ ┌──────────────┐ │     │  ~400ms      │
└─────────────┘     │ │NeMo Guard-   │ │     └─────────────┘
                     │ │rails Safety  │ │
┌─────────────┐     │ └──────────────┘ │     ┌─────────────┐
│  Protocols   │────>│ ┌──────────────┐ │────>│  Validators  │
│ MCP . x402 . │     │ │5-Dim Trust   │ │     │  4 Tiers     │
│ A2A          │     │ │Score Engine  │ │     │  Bond-Backed │
└─────────────┘     │ └──────────────┘ │     └─────────────┘
                     │ ┌──────────────┐ │
                     │ │Royalty       │ │
                     │ │Cascade (CPI) │ │
                     │ └──────────────┘ │
                     └──────────────────┘
```

---

## Fee Distribution

Every invocation splits atomically into six parties on Solana:

| Recipient | Share | Purpose |
|---|---|---|
| Skill creator | 85% | Direct payment for providing the skill |
| Validators | 15% | Quality attestation and dispute resolution |
| Stakers | 12% | Pro-rata yield for $AEGIS stakers |
| Treasury | 8% | Protocol development and operations |
| Insurance | 3% | Dispute resolution pool |
| Burned | 2% | Permanent supply reduction |

When a skill depends on upstream skills, 5% of the creator share cascades through a depth-weighted royalty graph (max depth 5) via on-chain CPI.

---

## Bags.fm Integration

$AEGIS is live on [Bags.fm](https://bags.fm/4qbCffZLLApr1bdstAaJcrhF8ZAACJFWS7bm4ycgBAGS) with deep protocol integration:

- **Forced buy pressure** - Every skill invocation triggers a USDC-to-$AEGIS swap on Jupiter
- **Fee-sharing via Bags API** - Operators can create tokens with configurable fee modes (flat, escalating, front-loaded)
- **Token launch from CLI** - `aegisx launch` creates tokens directly on Bags.fm with one command
- **12 Bags.fm skills** built into AegisX for analytics, fee management, social linking, and liquidity compounding
- **MCP gateway** - AI agents can discover, trade, and launch tokens via natural language through the Aegis MCP server

```bash
# Launch a token on Bags.fm
aegisx launch "My Operator" --symbol MOP --fee-mode high-pre-low-post

# Trade via CLI
aegisx trade quote --from USDC --to AEGIS --amount 100
```

---

## AegisX CLI

A purpose-built development environment for the Aegis ecosystem:

| Feature | Detail |
|---|---|
| Commands | 28 (marketplace, trading, auditing, research, MCP management) |
| Integrated tools | 61 (file ops, Solana, Bags.fm, browser automation, research) |
| AI providers | 61+ (any OpenAI-compatible endpoint) |
| Skills | 88 active operator and protocol skills |
| Database | Local SQLite for sessions and usage stats |

```bash
aegisx skills list          # Browse 88 active skills
aegisx audit ./programs     # Security audit a Solana program
aegisx research "DeFi"      # Research across Reddit, HN, GitHub, DexScreener
aegisx trade quote           # Get Jupiter swap quotes
```

## AegisX IDE

A native code editor built for Aegis development. Trust-aware AI completions, built-in operator invocation, and Solana program tooling integrated at the editor level.

---

## Multi-Agent Orchestration

Aegis includes a built-in swarm orchestration engine for protocol operations:

**Swarm Engine**
- Hierarchical, mesh, ring, and star topologies for coordinated agent work
- HNSW vector memory with self-learning (patterns improve over time)
- Security audit swarms that parallelize operator verification across multiple agents
- Discovery swarms that scan registries for new MCP servers automatically
- Byzantine fault tolerant consensus for high-stakes operations
- 19 specialized agent roles (analyst, architect, security reviewer, executor, verifier, and more)

**Development Pipeline:**
```
Idea -> Analyst + Architect (plan)
     -> Swarm (parallel implementation)
     -> Security Reviewer + Code Reviewer (validate)
     -> Verifier (confirm)
     -> AegisX CLI (deploy to marketplace)
```

---

## MCP Tools

16 tools accessible from any MCP-compatible agent:

| Tool | Description |
|---|---|
| `aegis_list_operators` | List operators with filters |
| `aegis_search_operators` | Search by name, category, or tag |
| `aegis_get_operator` | Detailed operator info |
| `aegis_invoke_skill` | Execute a skill with payment |
| `aegis_get_trust_score` | 5-dimension trust breakdown |
| `aegis_get_invocation` | Past invocation details |
| `aegis_recent_invocations` | Recent invocations feed |
| `aegis_protocol_stats` | Protocol-wide statistics |
| `aegis_register_operator` | Register a new operator |
| `aegis_deactivate_operator` | Deactivate your operator |
| `aegis_list_validators` | Active validators |
| `aegis_get_categories` | All 19 categories |
| `aegis_file_dispute` | File a dispute |
| `aegis_list_disputes` | List disputes |
| `aegis_get_royalties` | Creator royalty earnings |
| `aegis_claim_royalties` | Claim royalties to wallet |

---

## Supported Protocols

| Protocol | Role | Status |
|---|---|---|
| **MCP** | Agent-to-skill discovery and invocation | Live - 16 tools |
| **x402** (Coinbase) | HTTP 402 micropayments in USDC | Live - v2 compliant |
| **A2A** (Google/Linux Foundation) | Agent-to-agent interoperability | Live - agent-card.json |

---

## On-Chain Programs (Solana/Anchor)

| Program | ID | Purpose |
|---|---|---|
| Operator Registry | `7CHg7hLqGvpdY8tKKeZL6eLgudCszB7e7VnBB1ogUqYR` | Registration, bonds, 6-way fee split, settlement |
| Royalty Registry | `FrXBFm4WdqBHosZJ8rMyT9FHNvRXuSVzxqGBbH7nCWs6` | Dependency graph, royalty cascade, per-creator vaults |
| Governance | `6TwiJJSscSFpSQA1PU8uYoJHGwgxaprEPJSpKfRireSn` | Proposals, voting, execution |
| $AEGIS Token | `4qbCffZLLApr1bdstAaJcrhF8ZAACJFWS7bm4ycgBAGS` | Forced buy on invocation, permanent burn per tx |

All programs built with [Anchor](https://www.anchor-lang.com/) 0.30.1. Checked arithmetic with u128 intermediates. PDA-verified accounts.

---

## Packages (Coming Soon to npm/PyPI)

Source code for all packages is included in `packages/`. Registry publishing is in progress.

| Package | Description | Status |
|---|---|---|
| `@aegis/sdk` | TypeScript client SDK | Source ready, publishing soon |
| `@aegis/mcp-server` | MCP server (16 tools) | Source ready, publishing soon |
| `@aegis/royalty-sdk` | Royalty registration and claiming | Source ready, publishing soon |
| `@aegis/elizaos-plugin` | ElizaOS agent integration | Source ready, publishing soon |
| `aegis-python` | Python SDK with LangChain adapter | Source ready, publishing soon |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | Solana, Anchor 0.30.1, Rust |
| Settlement | USDC (SPL Token), x402 v2 |
| Safety | NVIDIA NeMo Guardrails |
| Backend | Express, tRPC 11, MongoDB, Pino |
| Frontend | React 19, Vite 7, Tailwind CSS 4, Framer Motion |
| Auth | Solana wallet-sign (ed25519 + JWT) |
| Real-time | Server-Sent Events (SSE) |
| CLI | Bun, Effect, Solid.js TUI, 61+ AI providers |
| IDE | Zed fork with native protocol integration |

---

## Development

```bash
git clone https://github.com/aegisplaceprotocol/aegisplace
cd aegis
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # Production build
pnpm test         # Run test suite
```

### Project Structure

```
aegis/
├── client/              # React 19 + Vite frontend (49 pages)
├── server/              # Express + tRPC backend (60+ procedures)
├── programs/
│   ├── aegis/           # Core protocol (Anchor/Rust)
│   ├── royalty-registry/ # Royalty cascade program
│   └── aegis-governance/ # On-chain governance
├── packages/
│   ├── sdk/             # @aegis/sdk
│   ├── royalty-sdk/     # @aegis/royalty-sdk
│   ├── python-sdk/      # aegis-python
│   ├── cli/             # @aegis/cli
│   ├── gateway/         # API gateway middleware
│   └── elizaos-plugin/  # ElizaOS integration
├── shared/              # Shared types and constants
└── tests/               # Integration tests
```

---

## License

[MIT](LICENSE)

---

<p align="center">
  <strong>Built for the agent economy. Settled on Solana.</strong><br/>
  <a href="https://aegisplace.com">aegisplace.com</a> · <a href="https://bags.fm/4qbCffZLLApr1bdstAaJcrhF8ZAACJFWS7bm4ycgBAGS">$AEGIS on Bags.fm</a>
</p>
