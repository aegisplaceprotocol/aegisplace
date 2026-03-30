# Spec: x402 Gateway + MCP Server

## Problem
AI agents need a single HTTP endpoint to discover skills, pay for invocations, and get quality-verified results. The existing monolith handles tRPC but has no x402 payment flow and the MCP server is JSON-RPC only (no SSE transport for real-time discovery).

## Solution
A Fastify gateway service that:
1. Accepts x402 payment headers (HTTP 402 flow)
2. Verifies USDC transfers on Solana
3. Looks up operators in the on-chain registry
4. Forwards requests to operator endpoints
5. Validates response quality
6. Distributes fees via the Anchor program
7. Also serves as an MCP server via SSE transport

## API Design

### x402 Flow

#### `POST /v1/invoke/:operatorSlug`
**Without payment:**
```
→ 402 Payment Required
← Headers:
   X-Payment-Required: {"amount":"250000","currency":"USDC","network":"solana","recipient":"<treasury>"}
```

**With payment:**
```
→ Headers:
   X-Payment-Signature: <base64 encoded signed USDC transfer>
← 200 OK
← Body: { result, invocationId, trustScore, fees }
← Headers:
   X-Payment-Response: {"txSignature":"<sig>","settled":true}
```

#### `GET /v1/operators`
List all active operators with metadata, pricing, trust scores. No payment required.

#### `GET /v1/operators/:slug`
Get single operator details. No payment required.

#### `GET /v1/health`
Service health + Solana RPC status.

### MCP Server (SSE Transport)

#### `GET /mcp/sse`
SSE connection for MCP clients. Exposes tools:

**Tools:**
- `list_skills` — Search/filter available operator skills
- `invoke_skill` — Invoke an operator (triggers x402 payment)
- `get_trust_score` — Get operator's trust breakdown
- `get_invocation` — Get invocation receipt by ID
- `protocol_stats` — Total operators, invocations, volume

**Resources:**
- `aegis://skills/catalog` — Full skill catalog as JSON
- `aegis://skills/{slug}` — Individual skill metadata

#### `POST /mcp/messages`
Message endpoint for SSE transport.

## Technical Design

### Stack
- Fastify (not Express — faster, schema validation built-in)
- @solana/web3.js for on-chain verification
- @coral-xyz/anchor for program interaction
- @modelcontextprotocol/sdk for MCP server
- @x402/core + @x402/svm for payment verification

### Payment Verification Flow
```
1. Client sends POST /v1/invoke/:slug with X-Payment-Signature header
2. Decode header → extract tx signature
3. Verify tx on Solana: confirmed, USDC transfer, correct amount/recipient
4. Call Anchor program: invoke_skill instruction (distributes fees on-chain)
5. Forward request to operator endpoint
6. Validate response quality (latency, schema, content)
7. Update trust score via Anchor program
8. Return result + invocation receipt
```

### Quality Validation
Same 4-component scoring as existing validator.ts:
- Latency (20%): <500ms = 100, >5s = 0
- Status (30%): 2xx = 100, 4xx = 50, 5xx = 0
- Schema (25%): Response matches expected schema
- Content (25%): Non-empty, reasonable length

## Acceptance Criteria
- [ ] `POST /v1/invoke/:slug` returns 402 without payment header
- [ ] `POST /v1/invoke/:slug` with valid X-Payment-Signature processes and returns result
- [ ] Payment verification checks: tx confirmed, USDC amount, sender/recipient match
- [ ] Fee distribution calls Anchor program (or falls back to off-chain transfer)
- [ ] MCP SSE endpoint discoverable by Claude Code / Cursor
- [ ] `list_skills` MCP tool returns active operators
- [ ] `invoke_skill` MCP tool triggers full x402 flow
- [ ] Quality scoring produces 0-100 score + trust delta
- [ ] Response time < 2s for cached operator lookups
- [ ] Health endpoint reports Solana RPC status

## Out of Scope
- WebSocket transport (SSE only for hackathon)
- Rate limiting (use existing rate limiter from monolith)
- Authentication for free endpoints (public for hackathon)
- Facilitator hosting (use Coinbase/Kora facilitator)

## Dependencies
- Anchor program deployed to devnet (Spec 01)
- Solana devnet RPC URL
- USDC devnet mint for testing
