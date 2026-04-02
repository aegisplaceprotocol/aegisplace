# Aegis Protocol - Technical Architecture

---

## System Overview

Aegis Protocol is the trust and settlement infrastructure for the AI agent economy. It wraps every AI skill invocation in economic guarantees: safety scanning, trust scoring, USDC micropayments, and on-chain settlement with atomic fee distribution.

```
AI Agents (Claude, GPT, ElizaOS, custom)
        |
        v
  Aegis Protocol Layer
  +-----------------------------------------+
  |  MCP Server (16 tools)                  |
  |  REST API  (/api/v1/operators, etc.)    |
  |  x402 Payment Middleware                |
  |  NeMo Guardrails (input + output scan)  |
  |  Trust Scoring Engine (5 dimensions)    |
  |  Health Monitor (5-min loop)            |
  +-----------------------------------------+
        |
        v
  Solana (USDC settlement, ~400ms, $0.00025/tx)
```

---

## Frontend

| Component | Technology |
|-----------|------------|
| Framework | React 19 with TypeScript 5.9 |
| Build tool | Vite 7 |
| Styling | Tailwind CSS 4, shadcn/ui components |
| Routing | Wouter (lightweight client-side router) |
| Animation | Framer Motion |
| Charts | Recharts |
| Wallet | @solana/wallet-adapter-react (Phantom, Solflare, Ledger) |
| Font | Aeonik, monochrome zinc palette with emerald accent |
| Bundle size | 560KB main + 4 vendor chunks (optimized from 1.1MB) |
| Pages | 30 routes, 29 lazy-loaded with React Suspense |
| Video | Remotion pipeline (11 scenes, MP4 export) |

---

## Backend

| Component | Technology |
|-----------|------------|
| Runtime | Node.js with Express 4 |
| API layer | tRPC 11 (type-safe RPC) |
| Database | MongoDB (2,838 operators indexed) |
| ORM / ODM | Mongoose |
| Auth | Solana wallet-sign (ed25519 nonce, signature, JWT session cookie) |
| Real-time | SSE live feed at `/api/feed` |
| Discovery | A2A endpoint at `/.well-known/agent-card.json` |
| Machine-readable | `/llms.txt` |
| Rate limiting | 3 tiers (global, authenticated, MCP) |
| Security | OWASP audited, SSRF protection, CSP, CORS, 6 security headers |
| Process manager | PM2 via ecosystem.config.cjs |
| Container | Docker + docker-compose |

---

## MCP Server (Model Context Protocol)

16 tools accessible from any MCP-compatible agent (Claude Code, Cursor, Windsurf):

| Tool | Purpose |
|------|---------|
| `aegis_list_operators` | List operators with filters |
| `aegis_search_operators` | Search by name, category, or tag |
| `aegis_get_operator` | Get detailed operator info |
| `aegis_invoke_skill` | Execute a skill and return results |
| `aegis_get_trust_score` | Trust score breakdown for an operator |
| `aegis_get_invocation` | Details of a past invocation |
| `aegis_recent_invocations` | Recent invocations across the protocol |
| `aegis_protocol_stats` | Protocol-wide statistics |
| `aegis_register_operator` | Register a new skill operator |
| `aegis_deactivate_operator` | Deactivate an operator you own |
| `aegis_list_validators` | List active validators |
| `aegis_get_categories` | Get all operator categories |
| `aegis_file_dispute` | File a dispute against an invocation |
| `aegis_list_disputes` | List disputes with filters |
| `aegis_get_royalties` | Get royalty earnings for a creator |
| `aegis_claim_royalties` | Claim pending royalty payouts |

One-line configuration:

```json
{
  "mcpServers": {
    "aegis": {
      "command": "npx",
      "args": ["-y", "@aegis/mcp-server"],
      "env": { "AEGIS_API_URL": "https://mcp.aegisplace.com" }
    }
  }
}
```

---

## x402 Payment Layer

| Property | Detail |
|----------|--------|
| Spec compliance | x402 v2 fully compliant |
| Currency | USDC on Solana |
| Flow | HTTP 402 response with PAYMENT-REQUIRED header, agent pays, skill executes |
| Settlement time | ~400ms |
| Cost per transaction | $0.00025 |
| Fee split (on-chain) | 60% creator, 15% validators, 12% stakers, 8% treasury, 3% insurance, 2% burned |

---

## NeMo Guardrails (Safety Layer)

| Property | Detail |
|----------|--------|
| Engine | NVIDIA NeMo Guardrails sidecar (Python) |
| Model | nvidia/llama-3.1-nemoguard-8b-content-safety |
| Input scanning | PII stripping, prompt injection detection, jailbreak blocking |
| Output scanning | Hallucination detection, toxic content filtering |
| Pass rate | 100% on production traffic |
| Deployment | Dockerfile.guardrails, runs as a sidecar service |

---

## Trust Scoring Engine

Five-dimension scoring model, recalculated every 15 minutes:

1. **Success rate** - Percentage of invocations that return valid results
2. **Response quality** - Validator-attested output quality grades
3. **Uptime** - Health check pass rate over rolling window
4. **User reviews** - Weighted review scores from callers
5. **Dispute rate** - Inverse of disputes filed per invocation

Operators that fail 3 consecutive health checks are auto-deactivated. 9 real operators run with live health monitoring on a 5-minute loop.

---

## Solana Programs

| Property | Detail |
|----------|--------|
| Framework | Anchor 0.30.1 (Rust) |
| Network | Devnet (mainnet audit pending) |
| Program ID | `7CHg7hLqGvpdY8tKKeZL6eLgudCszB7e7VnBB1ogUqYR` |
| Instructions | 8: initialize, register_operator, invoke_skill, update_trust, deactivate_operator, rotate_admin, update_config, claim_royalties |
| Fee split | `[6000, 1500, 1200, 800, 300, 200]` bps, validated at init, enforced atomically |
| Arithmetic | checked_add / checked_mul / checked_sub with u128 intermediates |
| Accounts | PDA-verified with seeds + bump constraints |
| Safety | overflow-checks = true in release profile |

Additional programs:

- `programs/aegis` - Core protocol (registration, invocation, settlement)
- `programs/royalty-registry` - Upstream royalty cascade (depth-weighted, max depth 5) via CPI
- `programs/aegis-governance` - Governance and staking

---

## AegisX CLI

| Property | Detail |
|----------|--------|
| Based on | OpenCode (terminal-native AI coding assistant) |
| Commands | 28 |
| Integrated tools | 61 (21 custom Aegis tools + 40 MCP ecosystem tools) |
| All tools wrapped | Every external tool passes through Aegis trust and payment layer |

---

## AegisX IDE

| Property | Detail |
|----------|--------|
| Based on | Zed (Rust-based high-performance editor) |
| Integration | Native Aegis trust and payment layer on every AI interaction |
| Workflow | Operator discovery, trust scoring, guardrail scanning, invocation, settlement - all without leaving the editor |

---

## SDK

| Property | Detail |
|----------|--------|
| Package | @aegisprotocol/sdk |
| Size | 12.6KB, zero dependencies |
| Language | TypeScript-first |
| Setup | 5 lines |

```typescript
import { AegisClient } from "@aegis/sdk";

const aegis = new AegisClient({ baseUrl: "https://mcp.aegisplace.com" });
const operators = await aegis.operators.list({ sortBy: "trust" });
const result = await aegis.invoke("code-review-agent", { code: payload });
```

---

## Development Tooling

| Tool | Detail |
|------|--------|
| Testing | Vitest (46/46 tests passing) |
| Linting | TypeScript strict mode |
| Security scanning | 14 vulnerabilities found and fixed, 0 remaining |
| Python SDK | packages/python-sdk (pyproject.toml) |

---

## Infrastructure

| Component | Detail |
|-----------|--------|
| Hosting | Cloud VPS |
| Dashboard | https://aegisplace.com |
| Production | https://aegisplace.com |
| Containerization | Docker + docker-compose.yml |
| Process management | PM2 (ecosystem.config.cjs) |
| CI/CD | GitHub Actions |

---

## Operator Discovery Pipeline

The system auto-harvests operators from 15+ sources:

- GitHub (public repositories with MCP server manifests)
- HuggingFace (model cards and inference endpoints)
- npm (packages tagged with MCP or agent-tool keywords)
- PyPI (Python packages in the agent tooling ecosystem)
- Manual submissions via the REST API and MCP tools

All harvested operators are indexed, health-checked, trust-scored, and made available through the marketplace, REST API, and MCP tools.

---

## Token: $AEGIS

| Property | Detail |
|----------|--------|
| Mint address | `4qbCffZLLApr1bdstAaJcrhF8ZAACJFWS7bm4ycgBAGS` |
| Chain | Solana |
| Listed on | Bags.fm |
| Buy pressure | Every invocation triggers USDC-to-$AEGIS swap on Jupiter |
| Burn | 2% of every fee burned permanently (deflationary) |
| Staker yield | 12% of protocol revenue flows to stakers |
| Registration | Creators need $AEGIS to register operators |
| Validator bonding | Validators need $AEGIS to bond (tiered: $50 to $10K) |
