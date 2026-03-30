/**
 * Aegis Protocol - MCP Streamable HTTP Server
 *
 * Implements the Model Context Protocol over JSON-RPC 2.0 / HTTP,
 * allowing any MCP-compatible agent (Claude, Cursor, Windsurf) to
 * interact with the Aegis marketplace.
 *
 * No SDK dependency - pure JSON-RPC 2.0 over POST.
 */

import type { Request, Response } from "express";
import { logger } from "./logger";
import crypto from "crypto";
import mongoose from "mongoose";
import {
  listOperators,
  getOperatorBySlug,
  getOperatorById,
  getOperatorCount,
  getProtocolStats,
  getGuardrailStats,
  recordInvocation,
  createPayment,
  updateOperator,
  checkRateLimit,
  listTasks,
  createTask,
  createProposal,
  createAgent,
} from "./db";
import { getTrustBreakdown } from "./trust-engine";
import { checkInput, checkOutput } from "./guardrails";
import { validateInvocation, calculateFees } from "./validator";
import { broadcastEvent } from "./sse";
import { bags, BagsApiError } from "./bags";
import { OperatorTokenModel } from "../drizzle/schema";

// ────────────────────────────────────────────────────────────
// SSRF Protection
// ────────────────────────────────────────────────────────────

function isPrivateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    // Block private IPs, localhost, cloud metadata
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;
    if (host === '169.254.169.254') return true; // AWS/GCP metadata
    if (host === '100.100.100.200') return true; // Alibaba metadata
    if (host.startsWith('10.')) return true;
    if (host.startsWith('192.168.')) return true;
    if (host.startsWith('172.') && parseInt(host.split('.')[1]) >= 16 && parseInt(host.split('.')[1]) <= 31) return true;
    if (host.endsWith('.internal') || host.endsWith('.local')) return true;
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return true;
    return false;
  } catch { return true; }
}

// ────────────────────────────────────────────────────────────
// MCP Protocol Constants
// ────────────────────────────────────────────────────────────

const MCP_VERSION = "2025-03-26";
const SERVER_NAME = "aegis-protocol";
const SERVER_VERSION = "1.0.0";

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

// ────────────────────────────────────────────────────────────
// Tool Definitions
// ────────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "aegis_list_operators",
    description:
      "Browse AI operators (skills) in the Aegis marketplace. Supports category filtering, text search, sorting, and pagination.",
    inputSchema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          description:
            "Filter by category. One of: code-review, sentiment-analysis, data-extraction, image-generation, text-generation, translation, summarization, classification, search, financial-analysis, security-audit, other",
        },
        search: {
          type: "string",
          description: "Search operators by name or tagline",
        },
        sortBy: {
          type: "string",
          enum: ["trust", "invocations", "earnings", "newest"],
          description: "Sort order (default: trust)",
        },
        limit: {
          type: "number",
          description: "Max results to return (default: 20, max: 100)",
        },
        offset: {
          type: "number",
          description: "Offset for pagination (default: 0)",
        },
      },
    },
  },
  {
    name: "aegis_get_operator",
    description:
      "Get detailed information about a specific operator by its slug (URL-friendly identifier).",
    inputSchema: {
      type: "object" as const,
      properties: {
        slug: {
          type: "string",
          description: "The operator slug (e.g. 'solana-code-auditor')",
        },
      },
      required: ["slug"],
    },
  },
  {
    name: "aegis_invoke_operator",
    description:
      "Invoke an AI operator with a payload. This calls the operator's real endpoint and records the invocation with trust scoring and guardrail checks.",
    inputSchema: {
      type: "object" as const,
      properties: {
        operatorId: {
          type: "string",
          description: "The operator ID to invoke",
        },
        payload: {
          type: "object",
          description: "The input payload to send to the operator",
        },
        callerWallet: {
          type: "string",
          description: "Solana wallet address of the caller (optional)",
        },
      },
      required: ["operatorId"],
    },
  },
  {
    name: "aegis_get_trust_score",
    description:
      "Get the 5-dimension trust score breakdown for an operator: responseQuality, guardrailPassRate, uptimeRate, reviewScore, disputeRate, and overall score.",
    inputSchema: {
      type: "object" as const,
      properties: {
        operatorId: {
          type: "string",
          description: "The operator ID",
        },
      },
      required: ["operatorId"],
    },
  },
  {
    name: "aegis_search_operators",
    description:
      "Full-text search across all operators by name and tagline. Returns matching operators with relevance.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search query string",
        },
        limit: {
          type: "number",
          description: "Max results (default: 10)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "aegis_get_categories",
    description:
      "Get all operator categories with the count of active operators in each.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "aegis_get_stats",
    description:
      "Get overall Aegis marketplace statistics: total operators, invocations, earnings, validators, trust scores, disputes, and guardrail stats.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "aegis_discover_tools",
    description:
      "Trigger the Aegis Discovery Engine to crawl GitHub, MCP registries, and AI tool directories for new operators. Returns a summary of what was found and onboarded.",
    inputSchema: {
      type: "object" as const,
      properties: {
        source: {
          type: "string",
          enum: ["github", "awesome-lists", "huggingface", "all"],
          default: "all",
        },
      },
    },
  },
  {
    name: "aegis_discovery_stats",
    description:
      "Get statistics about the Aegis Discovery Engine - how many operators were auto-discovered vs manually registered, security scan results, and growth metrics.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "aegis_list_tasks",
    description:
      "Browse open tasks and bounties on the Aegis marketplace. Filter by category, status, search term. Agents can find work to bid on.",
    inputSchema: {
      type: "object" as const,
      properties: {
        category: { type: "string" },
        status: { type: "string", enum: ["open", "assigned", "in-review", "completed"], default: "open" },
        search: { type: "string" },
        limit: { type: "number", default: 10 },
      },
    },
  },
  {
    name: "aegis_create_task",
    description:
      "Post a new task/bounty on Aegis. Set title, description, category, budget in USDC, and requirements. AI agents will compete to deliver.",
    inputSchema: {
      type: "object" as const,
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        category: { type: "string" },
        budgetAmount: { type: "number" },
        tags: { type: "array", items: { type: "string" } },
        requirements: { type: "string" },
      },
      required: ["title", "description", "category", "budgetAmount"],
    },
  },
  {
    name: "aegis_submit_proposal",
    description:
      "Submit a proposal/bid for a task. Include your price, cover letter, and time estimate.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string" },
        amount: { type: "number" },
        coverLetter: { type: "string" },
        timeEstimate: { type: "string" },
      },
      required: ["taskId", "amount", "coverLetter"],
    },
  },
  {
    name: "aegis_agent_register",
    description:
      "Register as an AI agent on Aegis. Get an API key for programmatic access. Set your name, bio, and capabilities.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string" },
        bio: { type: "string" },
        capabilities: { type: "array", items: { type: "string" } },
        walletAddress: { type: "string" },
        createWallet: { type: "boolean", description: "Create an OWS wallet for this agent (requires OWS installed)" },
      },
      required: ["name"],
    },
  },
  {
    name: "aegis_launch_operator_token",
    description:
      "Launch a Bags token for an operator. Creates token metadata and generates launch transactions via the Bags API.",
    inputSchema: {
      type: "object" as const,
      properties: {
        operatorSlug: { type: "string", description: "The operator slug (e.g. 'solana-code-auditor')" },
        symbol: { type: "string", description: "Token symbol, max 10 characters" },
        description: { type: "string", description: "Token description" },
        imageUrl: { type: "string", description: "URL to the token image" },
      },
      required: ["operatorSlug", "symbol", "description", "imageUrl"],
    },
  },
  {
    name: "aegis_get_operator_token",
    description:
      "Get Bags token data for an operator, including mint address, status, pool info, and fee share config.",
    inputSchema: {
      type: "object" as const,
      properties: {
        operatorSlug: { type: "string", description: "The operator slug" },
      },
      required: ["operatorSlug"],
    },
  },
  {
    name: "aegis_trade_operator_token",
    description:
      "Get a trade quote for an operator's Bags token. Specify buy or sell and the amount in lamports.",
    inputSchema: {
      type: "object" as const,
      properties: {
        operatorSlug: { type: "string", description: "The operator slug" },
        action: { type: "string", enum: ["buy", "sell"], description: "Buy or sell" },
        amountLamports: { type: "string", description: "Amount in lamports" },
        slippageBps: { type: "number", description: "Slippage tolerance in basis points (default: 50)" },
      },
      required: ["operatorSlug", "action", "amountLamports"],
    },
  },
];

// ────────────────────────────────────────────────────────────
// JSON-RPC 2.0 Types
// ────────────────────────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

function jsonrpcSuccess(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function jsonrpcError(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message, data } };
}

// ────────────────────────────────────────────────────────────
// Tool Execution
// ────────────────────────────────────────────────────────────

const CATEGORIES = [
  "code-review",
  "sentiment-analysis",
  "data-extraction",
  "image-generation",
  "text-generation",
  "translation",
  "summarization",
  "classification",
  "search",
  "financial-analysis",
  "security-audit",
  "other",
];

async function executeTool(
  name: string,
  args: Record<string, unknown>,
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  try {
    switch (name) {
      // ── List Operators ──
      case "aegis_list_operators": {
        const limit = Math.min(Number(args.limit) || 20, 100);
        const result = await listOperators({
          category: args.category as string | undefined,
          search: args.search as string | undefined,
          sortBy: (args.sortBy as "trust" | "invocations" | "earnings" | "newest") || "trust",
          limit,
          offset: Number(args.offset) || 0,
          activeOnly: true,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  total: result.total,
                  count: result.operators.length,
                  operators: result.operators.map((op: any) => ({
                    id: op._id,
                    slug: op.slug,
                    name: op.name,
                    tagline: op.tagline,
                    category: op.category,
                    trustScore: op.trustScore,
                    totalInvocations: op.totalInvocations,
                    pricePerCall: op.pricePerCall,
                    avgResponseMs: op.avgResponseMs,
                    healthStatus: op.healthStatus,
                  })),
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // ── Get Operator ──
      case "aegis_get_operator": {
        const slug = args.slug as string;
        if (!slug) {
          return { content: [{ type: "text", text: "Error: slug is required" }], isError: true };
        }
        const op: any = await getOperatorBySlug(slug);
        if (!op) {
          return {
            content: [{ type: "text", text: `No operator found with slug "${slug}"` }],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: op._id,
                  slug: op.slug,
                  name: op.name,
                  tagline: op.tagline,
                  description: op.description,
                  category: op.category,
                  trustScore: op.trustScore,
                  totalInvocations: op.totalInvocations,
                  successfulInvocations: op.successfulInvocations,
                  pricePerCall: op.pricePerCall,
                  avgResponseMs: op.avgResponseMs,
                  totalEarned: op.totalEarned,
                  endpointUrl: op.endpointUrl,
                  httpMethod: op.httpMethod,
                  healthStatus: op.healthStatus,
                  isActive: op.isActive,
                  createdAt: op.createdAt,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // ── Invoke Operator ──
      case "aegis_invoke_operator": {
        const operatorId = args.operatorId as string;
        if (!operatorId) {
          return {
            content: [{ type: "text", text: "Error: operatorId is required" }],
            isError: true,
          };
        }

        const operator: any = await getOperatorById(operatorId);
        if (!operator) {
          return {
            content: [{ type: "text", text: `No operator found with ID "${operatorId}"` }],
            isError: true,
          };
        }
        if (!operator.isActive) {
          return {
            content: [{ type: "text", text: "Operator is not active" }],
            isError: true,
          };
        }

        const callerWallet = (args.callerWallet as string) || "mcp-agent";
        const payload = args.payload ?? {};

        // Rate limit by caller wallet
        const rl = await checkRateLimit(`wallet:${callerWallet}`, "invoke.execute", 60, 60);
        if (!rl.allowed) {
          return {
            content: [
              {
                type: "text",
                text: `Rate limit exceeded. ${rl.remaining} requests remaining. Resets at ${rl.resetAt.toISOString()}`,
              },
            ],
            isError: true,
          };
        }

        const price = parseFloat(operator.pricePerCall);
        const fees = calculateFees(price);

        // Guardrail input check
        let guardrailInputResult = { passed: true, violations: [] as string[], latencyMs: 0 };
        let guardrailOutputResult = { passed: true, violations: [] as string[], latencyMs: 0 };
        let totalGuardrailLatencyMs = 0;

        guardrailInputResult = await checkInput(operator.category, payload);
        totalGuardrailLatencyMs += guardrailInputResult.latencyMs;

        if (!guardrailInputResult.passed) {
          const invocationId = await recordInvocation({
            operatorId: toObjectId(operator.id),
            callerWallet,
            amountPaid: "0",
            creatorShare: "0",
            validatorShare: "0",
            treasuryShare: "0",
            burnAmount: "0",
            responseMs: 0,
            success: false,
            statusCode: 403,
            trustDelta: 0,
            guardrailInputPassed: false,
            guardrailOutputPassed: true,
            guardrailViolations: guardrailInputResult.violations,
            guardrailLatencyMs: totalGuardrailLatencyMs,
          });

          broadcastEvent("invocation", {
            invocationId,
            operatorId: operator.id,
            operatorName: operator.name,
            operatorSlug: operator.slug,
            callerWallet,
            success: false,
            responseMs: 0,
            amountPaid: "0",
            trustDelta: 0,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    invocationId,
                    error: "Blocked by Aegis NeMo Guardrails safety check",
                    violations: guardrailInputResult.violations,
                  },
                  null,
                  2,
                ),
              },
            ],
            isError: true,
          };
        }

        // Execute the operator
        let responseMs = 0;
        let statusCode = 200;
        let responseBody: unknown = null;
        let success = true;

        if (operator.endpointUrl) {
          if (isPrivateUrl(operator.endpointUrl)) {
            throw new Error('Operator endpoint URL is not allowed (private/internal address)');
          }
          const start = Date.now();
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);

            const res = await fetch(operator.endpointUrl, {
              method: operator.httpMethod || "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Aegis-Operator-Id": String(operator.id),
                "X-Aegis-Caller": callerWallet,
                "X-Aegis-Source": "mcp",
              },
              body: payload ? JSON.stringify(payload) : undefined,
              signal: controller.signal,
            });

            clearTimeout(timeout);
            responseMs = Date.now() - start;
            statusCode = res.status;

            try {
              responseBody = await res.json();
            } catch {
              responseBody = await res.text();
            }

            success = statusCode >= 200 && statusCode < 400;
          } catch (err: any) {
            responseMs = Date.now() - start;
            statusCode = 0;
            success = false;
            responseBody = { error: err.message || "Request failed" };
          }
        } else {
          // Simulated invocation for demo operators
          const hashCode = (s: string) => s.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
          responseMs = 200 + Math.abs(hashCode(operator.slug || 'default')) % 800;
          statusCode = 200;
          success = true;
          responseBody = {
            result: `Response from ${operator.name}`,
            timestamp: new Date().toISOString(),
            operatorId: operator.id,
          };
        }

        // Guardrail output check
        if (success) {
          guardrailOutputResult = await checkOutput(operator.category, responseBody);
          totalGuardrailLatencyMs += guardrailOutputResult.latencyMs;
          if (!guardrailOutputResult.passed) {
            success = false;
          }
        }

        // Validate response
        const validation = validateInvocation({
          responseMs,
          statusCode,
          responseBody,
          expectedSchema: operator.responseSchema as Record<string, unknown> | undefined,
        });

        let trustDelta = validation.trustDelta;
        if (!guardrailOutputResult.passed) {
          trustDelta = -5;
        }

        const allViolations = [
          ...guardrailInputResult.violations,
          ...guardrailOutputResult.violations,
        ];

        // Record invocation
        const invocationId = await recordInvocation({
          operatorId: toObjectId(operator.id),
          callerWallet,
          amountPaid: price.toFixed(8),
          creatorShare: fees.creator.toFixed(8),
          validatorShare: fees.validators.toFixed(8),
          treasuryShare: fees.treasury.toFixed(8),
          burnAmount: fees.burn.toFixed(8),
          stakersShare: fees.stakers.toFixed(8),
          insuranceShare: fees.insurance.toFixed(8),
          responseMs,
          success,
          statusCode,
          trustDelta,
          paymentVerified: false,
          guardrailInputPassed: guardrailInputResult.passed,
          guardrailOutputPassed: guardrailOutputResult.passed,
          guardrailViolations: allViolations.length > 0 ? allViolations : undefined,
          guardrailLatencyMs: totalGuardrailLatencyMs,
        });

        // Update trust score
        const newTrust = Math.max(0, Math.min(100, operator.trustScore + trustDelta));
        await updateOperator(operator.id, { trustScore: newTrust });

        // Create payment record
        await createPayment({
          invocationId,
          txSignature: `mcp-${invocationId}`,
          totalAmount: price.toFixed(8),
          operatorShare: fees.creator.toFixed(8),
          protocolShare: fees.treasury.toFixed(8),
          validatorShare: fees.validators.toFixed(8),
          burnAmount: fees.burn.toFixed(8),
          stakersShare: fees.stakers.toFixed(8),
          insuranceShare: fees.insurance.toFixed(8),
          status: "pending",
        });

        broadcastEvent("invocation", {
          invocationId,
          operatorId: operator.id,
          operatorName: operator.name,
          operatorSlug: operator.slug,
          callerWallet,
          success,
          responseMs,
          amountPaid: price.toFixed(8),
          trustDelta,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success,
                  invocationId,
                  operatorId: operator.id,
                  operatorName: operator.name,
                  responseMs,
                  statusCode,
                  response: responseBody,
                  validation: {
                    score: validation.score,
                    trustDelta,
                    newTrustScore: newTrust,
                  },
                  guardrails: {
                    inputPassed: guardrailInputResult.passed,
                    outputPassed: guardrailOutputResult.passed,
                    violations: allViolations,
                    latencyMs: totalGuardrailLatencyMs,
                  },
                  fees: {
                    total: price,
                    creator: fees.creator,
                    validators: fees.validators,
                    stakers: fees.stakers,
                    treasury: fees.treasury,
                    insurance: fees.insurance,
                    burn: fees.burn,
                  },
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // ── Get Trust Score ──
      case "aegis_get_trust_score": {
        const operatorId = args.operatorId as string;
        if (!operatorId) {
          return {
            content: [{ type: "text", text: "Error: operatorId is required" }],
            isError: true,
          };
        }
        const breakdown = await getTrustBreakdown(Number(operatorId));
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  operatorId,
                  trust: breakdown,
                  weights: {
                    responseQuality: "25%",
                    guardrailPassRate: "25%",
                    uptimeRate: "20%",
                    reviewScore: "15%",
                    disputeRate: "15%",
                  },
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // ── Search Operators ──
      case "aegis_search_operators": {
        const query = args.query as string;
        if (!query) {
          return {
            content: [{ type: "text", text: "Error: query is required" }],
            isError: true,
          };
        }
        const limit = Math.min(Number(args.limit) || 10, 50);
        const result = await listOperators({
          search: query,
          limit,
          activeOnly: true,
          sortBy: "trust",
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  query,
                  total: result.total,
                  results: result.operators.map((op: any) => ({
                    id: op._id,
                    slug: op.slug,
                    name: op.name,
                    tagline: op.tagline,
                    category: op.category,
                    trustScore: op.trustScore,
                    pricePerCall: op.pricePerCall,
                  })),
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // ── Get Categories ──
      case "aegis_get_categories": {
        const { OperatorModel: OpModel } = await import("../drizzle/schema");
        const pipeline = [
          { $match: { isActive: true } },
          { $group: { _id: "$category", count: { $sum: 1 }, avgTrust: { $avg: "$trustScore" } } },
          { $sort: { count: -1 as const } },
        ];
        const results = await OpModel.aggregate(pipeline);
        const totalActive = results.reduce((sum: number, r: any) => sum + r.count, 0);
        const categories = results.map((r: any) => ({ category: r._id, count: r.count, avgTrust: Math.round(r.avgTrust ?? 0) }));
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { totalActiveOperators: totalActive, categories },
                null,
                2,
              ),
            },
          ],
        };
      }

      // ── Get Stats ──
      case "aegis_get_stats": {
        const [protocol, guardrail] = await Promise.all([
          getProtocolStats(),
          getGuardrailStats(),
        ]);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  protocol,
                  guardrails: guardrail,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // ── Discover Tools ──
      case "aegis_discover_tools": {
        try {
          // @ts-ignore - discovery module may not exist yet
          const { runDiscoveryPipeline } = await import("./discovery/pipeline");
          const run = await runDiscoveryPipeline();
          return { content: [{ type: "text", text: JSON.stringify(run, null, 2) }] };
        } catch (err: any) {
          return { content: [{ type: "text", text: `Discovery engine not available: ${err.message}` }] };
        }
      }

      // ── Discovery Stats ──
      case "aegis_discovery_stats": {
        // @ts-ignore - import path resolved at runtime
        const { OperatorModel } = await import("../drizzle/schema");
        const discovered = await OperatorModel.countDocuments({ source: "discovery-engine" });
        const manual = await OperatorModel.countDocuments({ source: { $ne: "discovery-engine" } });
        const total = discovered + manual;
        const avgTrust = await OperatorModel.aggregate([
          { $match: { source: "discovery-engine" } },
          { $group: { _id: null, avg: { $avg: "$trustScore" } } },
        ]);
        return {
          content: [{ type: "text", text: JSON.stringify({
            totalOperators: total,
            discoveredOperators: discovered,
            manualOperators: manual,
            discoveryPercentage: total > 0 ? Math.round((discovered / total) * 100) : 0,
            avgDiscoveredTrustScore: avgTrust[0]?.avg ?? 0,
          }, null, 2) }],
        };
      }

      // ── List Tasks ──
      case "aegis_list_tasks": {
        const limit = Math.min(Number(args.limit) || 10, 50);
        const result = await listTasks({
          category: args.category as string | undefined,
          status: (args.status as string) || "open",
          search: args.search as string | undefined,
          limit,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  total: result.total,
                  count: result.tasks.length,
                  tasks: result.tasks.map((t: any) => ({
                    id: t._id,
                    title: t.title,
                    category: t.category,
                    status: t.status,
                    budgetAmount: t.budgetAmount,
                    proposalsCount: t.proposalsCount,
                    createdAt: t.createdAt,
                  })),
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // ── Create Task ──
      case "aegis_create_task": {
        const title = args.title as string;
        const description = args.description as string;
        const category = args.category as string;
        const budgetAmount = Number(args.budgetAmount);
        if (typeof args.title === 'string' && args.title.length > 200) {
          return { content: [{ type: "text", text: "Title too long (max 200 chars)" }], isError: true };
        }
        if (typeof args.description === 'string' && args.description.length > 5000) {
          return { content: [{ type: "text", text: "Description too long (max 5000 chars)" }], isError: true };
        }
        if (!title || !description || !category || !budgetAmount) {
          return {
            content: [{ type: "text", text: "Error: title, description, category, and budgetAmount are required" }],
            isError: true,
          };
        }
        const task = await createTask({
          title,
          description,
          category: category as any,
          budgetAmount,
          budget: String(budgetAmount) as any,
          tags: (args.tags as string[]) || [],
          requirements: (args.requirements as string) || null,
          clientWallet: "mcp-agent",
          status: "open" as any,
          proposalsCount: 0,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: true, taskId: task._id, title: task.title, status: task.status },
                null,
                2,
              ),
            },
          ],
        };
      }

      // ── Submit Proposal ──
      case "aegis_submit_proposal": {
        const taskId = args.taskId as string;
        const amount = Number(args.amount);
        const coverLetter = args.coverLetter as string;
        if (typeof args.coverLetter === 'string' && args.coverLetter.length > 5000) {
          return { content: [{ type: "text", text: "Cover letter too long (max 5000 chars)" }], isError: true };
        }
        if (!taskId || !amount || !coverLetter) {
          return {
            content: [{ type: "text", text: "Error: taskId, amount, and coverLetter are required" }],
            isError: true,
          };
        }
        const proposal = await createProposal({
          taskId: toObjectId(taskId) as any,
          agentId: toObjectId("000000000000000000000000") as any,
          amount,
          coverLetter,
          timeEstimate: (args.timeEstimate as string) || null,
          status: "pending" as any,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: true, proposalId: proposal._id, taskId, amount, status: proposal.status },
                null,
                2,
              ),
            },
          ],
        };
      }

      // ── Agent Register ──
      case "aegis_agent_register": {
        const agentName = args.name as string;
        if (typeof args.name === 'string' && args.name.length > 100) {
          return { content: [{ type: "text", text: "Name too long (max 100 chars)" }], isError: true };
        }
        if (typeof args.bio === 'string' && args.bio.length > 2000) {
          return { content: [{ type: "text", text: "Bio too long (max 2000 chars)" }], isError: true };
        }
        if (!agentName) {
          return {
            content: [{ type: "text", text: "Error: name is required" }],
            isError: true,
          };
        }
        const rawKey = `aegis_${crypto.randomBytes(32).toString("hex")}`;
        const apiKeyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
        const agent = await createAgent({
          name: agentName,
          bio: (args.bio as string) || null,
          capabilities: (args.capabilities as string[]) || [],
          walletAddress: (args.walletAddress as string) || null,
          apiKeyHash,
          apiKeyExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
          reputation: 0,
          completedTasks: 0,
          totalProposals: 0,
          isVerified: false,
        });
        // OWS wallet creation (optional)
        let wallet = null;
        if (args.createWallet) {
          const { isOwsInstalled, createOwsWallet } = await import("./ows");
          if (await isOwsInstalled()) {
            wallet = await createOwsWallet(`aegis-agent-${agent._id}`);
          }
        }

        // Include wallet info in response if created
        const response: any = {
          success: true,
          agentId: agent._id,
          name: agent.name,
          apiKey: rawKey,
          warning: "Store this API key securely - it cannot be retrieved again.",
        };
        if (wallet) {
          response.wallet = {
            name: wallet.name,
            solanaAddress: wallet.solanaAddress,
            message: "Fund your Solana address with USDC to start invoking operators",
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      // ── Launch Operator Token (Bags) ──
      case "aegis_launch_operator_token": {
        const operatorSlug = args.operatorSlug as string;
        const symbol = args.symbol as string;
        const description = args.description as string;
        const imageUrl = args.imageUrl as string;

        if (!operatorSlug || !symbol || !description || !imageUrl) {
          return {
            content: [{ type: "text", text: "Error: operatorSlug, symbol, description, and imageUrl are required" }],
            isError: true,
          };
        }

        if (symbol.length > 10) {
          return {
            content: [{ type: "text", text: "Error: symbol must be 10 characters or fewer" }],
            isError: true,
          };
        }

        const existingOp = await getOperatorBySlug(operatorSlug);
        if (!existingOp) {
          return {
            content: [{ type: "text", text: `No operator found with slug "${operatorSlug}"` }],
            isError: true,
          };
        }

        const existingToken = await OperatorTokenModel.findOne({ operatorSlug });
        if (existingToken) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Token already launched for this operator",
                tokenMint: existingToken.tokenMint,
                symbol: existingToken.symbol,
                status: existingToken.status,
              }, null, 2),
            }],
            isError: true,
          };
        }

        try {
          const tokenName = `Aegis: ${(existingOp as any).name}`;
          const info = await bags.tokenLaunch.createInfo({
            name: tokenName,
            symbol,
            description,
            image: imageUrl,
          });

          const launchTx = await bags.tokenLaunch.createLaunchTx({
            tokenMint: info.metadataUri,
            payer: (existingOp as any).creatorWallet,
          });

          await OperatorTokenModel.create({
            operatorSlug,
            tokenMint: launchTx.tokenMint,
            symbol,
            name: tokenName,
            status: "PRE_LAUNCH",
            configKey: launchTx.configKey,
            launchedAt: new Date(),
          });

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                tokenMint: launchTx.tokenMint,
                metadataUri: info.metadataUri,
                configKey: launchTx.configKey,
                transactions: launchTx.transactions,
                operatorSlug,
                symbol,
                name: tokenName,
              }, null, 2),
            }],
          };
        } catch (err: any) {
          const msg = err instanceof BagsApiError
            ? `Bags API error (${err.status}): ${err.message}`
            : err.message || String(err);
          return { content: [{ type: "text", text: msg }], isError: true };
        }
      }

      // ── Get Operator Token (Bags) ──
      case "aegis_get_operator_token": {
        const slug = args.operatorSlug as string;
        if (!slug) {
          return { content: [{ type: "text", text: "Error: operatorSlug is required" }], isError: true };
        }

        const token = await OperatorTokenModel.findOne({ operatorSlug: slug }).lean();
        if (!token) {
          return { content: [{ type: "text", text: `No token found for operator "${slug}"` }], isError: true };
        }

        // Try to enrich with live data
        let poolInfo = null;
        let feeShareConfig = null;
        try {
          poolInfo = await bags.pool.byTokenMint({ tokenMint: token.tokenMint });
        } catch { /* ignore */ }

        try {
          const partnerWallet = process.env.BAGS_PARTNER_WALLET;
          if (partnerWallet) {
            const adminList = await bags.feeShare.adminList(partnerWallet);
            if (adminList) {
              const match = adminList.tokens.find((t: any) => t.baseMint === token.tokenMint);
              if (match) {
                feeShareConfig = { claimers: match.claimers, basisPoints: match.basisPoints };
              }
            }
          }
        } catch { /* ignore */ }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              operatorSlug: token.operatorSlug,
              tokenMint: token.tokenMint,
              name: token.name,
              symbol: token.symbol,
              status: token.status,
              configKey: token.configKey,
              currentPrice: token.currentPrice,
              totalTradingVolume: token.totalTradingVolume,
              totalFeesEarned: token.totalFeesEarned,
              pool: poolInfo,
              feeShareConfig: feeShareConfig || token.feeShareConfig,
              launchedAt: token.launchedAt,
            }, null, 2),
          }],
        };
      }

      // ── Trade Operator Token (Bags) ──
      case "aegis_trade_operator_token": {
        const slug = args.operatorSlug as string;
        const action = args.action as string;
        const amountLamports = args.amountLamports as string;
        const slippageBps = (args.slippageBps as number) || 50;

        if (!slug || !action || !amountLamports) {
          return {
            content: [{ type: "text", text: "Error: operatorSlug, action, and amountLamports are required" }],
            isError: true,
          };
        }

        const token = await OperatorTokenModel.findOne({ operatorSlug: slug }).lean();
        if (!token) {
          return { content: [{ type: "text", text: `No token found for operator "${slug}"` }], isError: true };
        }

        const SOL_MINT = "So11111111111111111111111111111111111111112";
        const inputMint = action === "buy" ? SOL_MINT : token.tokenMint;
        const outputMint = action === "buy" ? token.tokenMint : SOL_MINT;

        try {
          const quote = await bags.trade.quote({
            inputMint,
            outputMint,
            amount: amountLamports,
            slippageBps,
          });

          if (!quote) {
            return { content: [{ type: "text", text: "Could not get quote - Bags API key may not be configured" }], isError: true };
          }

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                operatorSlug: slug,
                action,
                tokenMint: token.tokenMint,
                symbol: token.symbol,
                inAmount: quote.inAmount,
                outAmount: quote.outAmount,
                priceImpactPct: quote.priceImpactPct,
                route: quote.routePlan,
                slippageBps,
              }, null, 2),
            }],
          };
        } catch (err: any) {
          const msg = err instanceof BagsApiError
            ? `Bags API error (${err.status}): ${err.message}`
            : err.message || String(err);
          return { content: [{ type: "text", text: msg }], isError: true };
        }
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (err: any) {
    return {
      content: [{ type: "text", text: process.env.NODE_ENV === "production" ? "Tool execution failed" : `Tool execution error: ${err.message || String(err)}` }],
      isError: true,
    };
  }
}

// ────────────────────────────────────────────────────────────
// MCP JSON-RPC 2.0 Handler (POST /api/mcp)
// ────────────────────────────────────────────────────────────

export async function handleMCP(req: Request, res: Response) {
  // Security response headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");

  // MCP API key authentication (when MCP_API_KEY env var is set)
  const mcpKey = process.env.MCP_API_KEY;
  if (mcpKey) {
    const providedKey = (req.headers["x-api-key"] as string) || (req.headers["authorization"] as string || "").replace("Bearer ", "");
    if (providedKey !== mcpKey) {
      return res.status(401).json(jsonrpcError(null, -32000, "Unauthorized"));
    }
  }

  // Validate content type
  const contentType = req.headers["content-type"];
  if (!contentType || !contentType.includes("application/json")) {
    res.status(415).json(
      jsonrpcError(null, -32700, "Content-Type must be application/json"),
    );
    return;
  }

  const body = req.body as JsonRpcRequest;

  // Validate JSON-RPC 2.0 structure
  if (!body || body.jsonrpc !== "2.0" || !body.method) {
    res.status(400).json(
      jsonrpcError(body?.id ?? null, -32600, "Invalid JSON-RPC 2.0 request"),
    );
    return;
  }

  const { id, method, params } = body;

  try {
    switch (method) {
      // ── Initialize ──
      case "initialize": {
        res.json(
          jsonrpcSuccess(id ?? null, {
            protocolVersion: MCP_VERSION,
            capabilities: {
              tools: { listChanged: false },
            },
            serverInfo: {
              name: SERVER_NAME,
              version: SERVER_VERSION,
            },
          }),
        );
        return;
      }

      // ── Notifications (no response expected) ──
      case "notifications/initialized": {
        // Client acknowledgment - respond with 204 No Content
        res.status(204).end();
        return;
      }

      // ── List Tools ──
      case "tools/list": {
        res.json(
          jsonrpcSuccess(id ?? null, {
            tools: TOOLS,
          }),
        );
        return;
      }

      // ── Call Tool ──
      case "tools/call": {
        const toolName = (params as any)?.name as string;
        const toolArgs = ((params as any)?.arguments ?? {}) as Record<string, unknown>;

        if (!toolName) {
          res.json(jsonrpcError(id ?? null, -32602, "Missing tool name in params.name"));
          return;
        }

        const tool = TOOLS.find((t) => t.name === toolName);
        if (!tool) {
          res.json(
            jsonrpcError(id ?? null, -32602, `Unknown tool: ${toolName}`),
          );
          return;
        }

        const result = await executeTool(toolName, toolArgs);
        res.json(jsonrpcSuccess(id ?? null, result));
        return;
      }

      // ── Ping ──
      case "ping": {
        res.json(jsonrpcSuccess(id ?? null, {}));
        return;
      }

      default: {
        res.json(
          jsonrpcError(id ?? null, -32601, `Method not found: ${method}`),
        );
        return;
      }
    }
  } catch (err: any) {
    logger.error({ err }, "MCP error handling request");
    res.status(500).json(
      jsonrpcError(id ?? null, -32603, process.env.NODE_ENV === "production" ? "Internal error" : (err.message || "Unknown error")),
    );
  }
}

// ────────────────────────────────────────────────────────────
// MCP Discovery (GET /api/mcp)
// ────────────────────────────────────────────────────────────

export function handleMCPDiscovery(_req: Request, res: Response) {
  res.json({
    name: SERVER_NAME,
    version: SERVER_VERSION,
    description:
      "AI Agent Skills Marketplace on Solana - 400+ operators, 16 MCP tools, trust scoring, NeMo guardrails, task marketplace, Bags token trading, and USDC payments",
    protocolVersion: MCP_VERSION,
    tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
    endpoint: "/api/mcp",
  });
}
