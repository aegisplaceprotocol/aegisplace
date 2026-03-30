/**
 * Aegis MCP Server — SSE Transport
 *
 * Exposes 5 tools for AI agent interaction:
 *   - list_skills: search/filter operators
 *   - invoke_skill: trigger x402 payment flow
 *   - get_trust_score: operator trust breakdown
 *   - get_invocation: receipt by ID
 *   - protocol_stats: totals
 *
 * Plus 2 resources:
 *   - aegis://skills/catalog
 *   - aegis://skills/{slug}
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  listOperatorsFromRegistry,
  getOperatorBySlugFromRegistry,
  getOperatorByIdFromRegistry,
  getOperatorCount,
  getProtocolStats,
  getInvocationByIdFromDb,
} from "../services/operator-registry.js";

// ────────────────────────────────────────────────────────────
// MCP Server Definition
// ────────────────────────────────────────────────────────────

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "aegis-protocol",
    version: "1.0.0",
  });

  // ── Tool: list_skills ─────────────────────────────────────
  server.tool(
    "list_skills",
    "Search and filter AI operator skills in the Aegis marketplace. Returns operators with trust scores, pricing, and metadata.",
    {
      category: z.string().optional().describe(
        "Filter by category: code-review, sentiment-analysis, data-extraction, image-generation, text-generation, translation, summarization, classification, search, financial-analysis, security-audit, other",
      ),
      search: z.string().optional().describe("Search by name or tagline"),
      sortBy: z.enum(["trust", "invocations", "earnings", "newest"]).optional().describe("Sort order (default: trust)"),
      limit: z.number().optional().describe("Max results (default: 20, max: 100)"),
      offset: z.number().optional().describe("Offset for pagination"),
    },
    async (params) => {
      const result = await listOperatorsFromRegistry({
        category: params.category,
        search: params.search,
        sortBy: params.sortBy ?? "trust",
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
      });

      const skills = result.operators.map((op) => ({
        slug: op.slug,
        name: op.name,
        tagline: op.tagline,
        category: op.category,
        trustScore: op.trustScore,
        priceUsdc: op.priceUsdc,
        totalInvocations: op.totalInvocations,
        avgResponseMs: op.avgResponseMs,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ skills, total: result.total }, null, 2),
          },
        ],
      };
    },
  );

  // ── Tool: invoke_skill ────────────────────────────────────
  server.tool(
    "invoke_skill",
    "Invoke an AI operator skill. Returns the x402 payment requirements (402) or the invocation result if payment is provided.",
    {
      slug: z.string().describe("Operator slug to invoke"),
      payload: z.record(z.unknown()).optional().describe("Input payload for the operator"),
      txSignature: z.string().optional().describe("Solana tx signature for USDC payment (if already paid)"),
      senderWallet: z.string().optional().describe("Sender wallet address"),
    },
    async (params) => {
      const operator = await getOperatorBySlugFromRegistry(params.slug);
      if (!operator) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ error: "operator_not_found", slug: params.slug }),
            },
          ],
          isError: true,
        };
      }

      // If no payment, return 402-style info
      if (!params.txSignature) {
        const USDC_DECIMALS = 6;
        const priceBaseUnits = Math.round(operator.priceUsdc * Math.pow(10, USDC_DECIMALS));
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                status: "payment_required",
                operator: {
                  slug: operator.slug,
                  name: operator.name,
                  priceUsdc: operator.priceUsdc,
                },
                payment: {
                  amount: String(priceBaseUnits),
                  currency: "USDC",
                  network: "solana",
                  recipient: process.env.TREASURY_WALLET ?? "",
                  instructions: "Send a USDC transfer on Solana, then call invoke_skill again with the txSignature.",
                },
              }, null, 2),
            },
          ],
        };
      }

      // Payment provided — instruct the agent to use the HTTP endpoint
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              status: "use_http_endpoint",
              message: "To complete the invocation with payment verification, send a POST request to the gateway HTTP endpoint.",
              endpoint: `/v1/invoke/${params.slug}`,
              headers: {
                "X-Payment-Signature": "base64-encode: " + JSON.stringify({
                  txSignature: params.txSignature,
                  sender: params.senderWallet ?? "",
                  amount: String(Math.round(operator.priceUsdc * 1e6)),
                  currency: "USDC",
                  network: "solana",
                }),
              },
              body: params.payload ?? {},
            }, null, 2),
          },
        ],
      };
    },
  );

  // ── Tool: get_trust_score ─────────────────────────────────
  server.tool(
    "get_trust_score",
    "Get an operator's trust score breakdown: overall score and per-component scores.",
    {
      slug: z.string().describe("Operator slug"),
    },
    async (params) => {
      const operator = await getOperatorBySlugFromRegistry(params.slug);
      if (!operator) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ error: "operator_not_found", slug: params.slug }),
            },
          ],
          isError: true,
        };
      }

      // Compute trust breakdown from operator stats
      const totalInvocations = operator.totalInvocations || 0;
      const successfulInvocations = operator.successfulInvocations || 0;
      const uptimeRate = totalInvocations > 0
        ? Math.round((successfulInvocations / totalInvocations) * 100)
        : 50;

      // Response quality from avg response time
      let responseQuality = 50;
      const avgMs = operator.avgResponseMs || 0;
      if (avgMs <= 500) responseQuality = 100;
      else if (avgMs <= 1000) responseQuality = 90;
      else if (avgMs <= 2000) responseQuality = 75;
      else if (avgMs <= 5000) responseQuality = 50;
      else responseQuality = 25;

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              slug: operator.slug,
              name: operator.name,
              overall: operator.trustScore,
              breakdown: {
                responseQuality,
                uptimeRate,
                totalInvocations,
                successfulInvocations,
                avgResponseMs: avgMs,
              },
            }, null, 2),
          },
        ],
      };
    },
  );

  // ── Tool: get_invocation ──────────────────────────────────
  server.tool(
    "get_invocation",
    "Get an invocation receipt by ID. Returns the full invocation record including quality score, fees, and operator response.",
    {
      invocationId: z.string().describe("The invocation ID"),
    },
    async (params) => {
      const invocation = await getInvocationByIdFromDb(params.invocationId);
      if (!invocation) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: "invocation_not_found",
                invocationId: params.invocationId,
              }),
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(invocation, null, 2),
          },
        ],
      };
    },
  );

  // ── Tool: protocol_stats ──────────────────────────────────
  server.tool(
    "protocol_stats",
    "Get Aegis protocol totals: total operators, invocations, volume, and average trust score.",
    {},
    async () => {
      const stats = await getProtocolStats();

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(stats, null, 2),
          },
        ],
      };
    },
  );

  // ── Resource: aegis://skills/catalog ──────────────────────
  server.resource(
    "skills-catalog",
    "aegis://skills/catalog",
    {
      description: "Full skill catalog as JSON",
      mimeType: "application/json",
    },
    async () => {
      const result = await listOperatorsFromRegistry({ limit: 100, sortBy: "trust" });
      const catalog = result.operators.map((op) => ({
        slug: op.slug,
        name: op.name,
        tagline: op.tagline,
        category: op.category,
        trustScore: op.trustScore,
        priceUsdc: op.priceUsdc,
      }));

      return {
        contents: [
          {
            uri: "aegis://skills/catalog",
            mimeType: "application/json",
            text: JSON.stringify(catalog, null, 2),
          },
        ],
      };
    },
  );

  return server;
}

// ────────────────────────────────────────────────────────────
// SSE Transport Mount
// ────────────────────────────────────────────────────────────

const activeSessions = new Map<string, SSEServerTransport>();

export async function mountMcpRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /mcp/sse — SSE connection endpoint.
   * Creates a new MCP server instance per connection.
   */
  app.get("/mcp/sse", async (request: FastifyRequest, reply: FastifyReply) => {
    const mcpServer = createMcpServer();
    const transport = new SSEServerTransport("/mcp/messages", reply.raw);

    activeSessions.set(transport.sessionId, transport);

    // Clean up on close
    request.raw.on("close", () => {
      activeSessions.delete(transport.sessionId);
    });

    await mcpServer.connect(transport);
  });

  /**
   * POST /mcp/messages — Message endpoint for SSE transport.
   * Routes messages to the correct session.
   */
  app.post("/mcp/messages", async (request: FastifyRequest, reply: FastifyReply) => {
    const sessionId = (request.query as { sessionId?: string }).sessionId;
    if (!sessionId) {
      return reply.status(400).send({ error: "missing_session_id", message: "sessionId query parameter is required" });
    }

    const transport = activeSessions.get(sessionId);
    if (!transport) {
      return reply.status(404).send({ error: "session_not_found", message: `No active session: ${sessionId}` });
    }

    // Forward the raw request/response to the SSE transport
    await transport.handlePostMessage(request.raw, reply.raw);
  });
}
