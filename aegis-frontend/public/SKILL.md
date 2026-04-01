---
name: aegis-protocol
description: Invoke, discover, and manage AI agent skills on Solana with USDC settlement, NeMo Guardrails safety, and composable royalties
version: 1.0.0
author: Aegis Protocol
tags: [solana, ai-agents, mcp, x402, usdc, defi, agent-commerce, skills-marketplace]
category: Infrastructure
license: MIT
homepage: https://aegisplace.com
repository: https://github.com/aegis-protocol/aegis
mcp_server: https://mcp.aegisplace.com
---

# Aegis Protocol

The economic layer for autonomous agent commerce on Solana.

## What This Skill Does

Aegis Protocol provides a complete infrastructure for AI agents to discover, invoke, and pay for skills (operators) on Solana. Every invocation is settled in USDC with a 6-way fee split, validated by NeMo Guardrails, and recorded on-chain.

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `aegis_list_operators` | List all registered skill operators with filters |
| `aegis_invoke_skill` | Execute a skill operator and return the result |
| `aegis_get_operator` | Get detailed info about a specific operator |
| `aegis_search_operators` | Search operators by name, category, or tag |
| `aegis_get_trust_score` | Get trust score breakdown for an operator |
| `aegis_get_invocation` | Get details of a past invocation |
| `aegis_recent_invocations` | List recent invocations across the protocol |
| `aegis_protocol_stats` | Get protocol-wide statistics |
| `aegis_register_operator` | Register a new skill operator |
| `aegis_deactivate_operator` | Deactivate an operator you own |
| `aegis_list_validators` | List active validators |
| `aegis_get_categories` | Get all operator categories |
| `aegis_file_dispute` | File a dispute against an invocation |
| `aegis_list_disputes` | List disputes with filters |
| `aegis_get_royalties` | Get royalty earnings for a creator |
| `aegis_claim_royalties` | Claim accumulated royalties |

## Quick Start

### Claude Code
```json
// ~/.claude/mcp.json
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

### REST API
```bash
curl https://mcp.aegisplace.com/api/v1/operators?limit=10
```

### TypeScript SDK
```typescript
import { AegisClient } from "@aegis/sdk";
const aegis = new AegisClient({ baseUrl: "https://mcp.aegisplace.com" });
const operators = await aegis.operators.list({ sortBy: "trust" });
```

## Protocol Stats
- 2,829 registered operators
- 21M+ invocations settled
- $307K+ protocol revenue
- 91.5 average trust score
- ~400ms settlement time on Solana

## Key Features
- **USDC Settlement**: Every invocation paid in USDC, no token risk
- **NeMo Guardrails**: NVIDIA NeMo safety checks on every invocation
- **6-Way Fee Split**: Creator 60%, Validators 15%, Stakers 12%, Treasury 8%, Insurance 3%, Burned 2%
- **Composable Royalties**: Skills that depend on other skills pay upstream royalties automatically
- **x402 Compatible**: Native HTTP 402 micropayment support
- **On-Chain Receipts**: Every invocation produces a Solana transaction receipt
