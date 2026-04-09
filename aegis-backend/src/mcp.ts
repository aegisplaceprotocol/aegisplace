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
import mongoose from "mongoose";
import {
  listOperators,
  getOperatorBySlug,
  getOperatorById,
  getProtocolStats,
  getGuardrailStats,
  checkRateLimit,
  OperatorModel,
} from "./db";
import { getTrustBreakdown } from "./trust-engine";
import { executeInvocation, InvocationError } from "./invoke-engine";
import {
  getSolanaNetworkId,
} from "./solana";
import { ENV } from "./_core/env";
import { buildCheckoutUrl, buildOperatorPaymentContext } from "./payment-plan";

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

// ────────────────────────────────────────────────────────────
// Tool Definitions
// ────────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "aegis_list_operators",
    description:
      "Browse operators in the Aegis marketplace. Use this when you want a ranked list of skills before choosing one. Optional arguments let you filter by category, search by text, sort by trust or activity, and paginate with limit and offset.",
    inputSchema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          description:
            "Optional category filter. Pass one of: code-review, sentiment-analysis, data-extraction, image-generation, text-generation, translation, summarization, classification, search, financial-analysis, security-audit, or other.",
        },
        search: {
          type: "string",
          description: "Optional free-text search over operator name, tagline, and marketplace text. Example: 'solana auditor' or 'code review'.",
        },
        sortBy: {
          type: "string",
          enum: ["trust", "invocations", "earnings", "newest"],
          description: "Optional sort field. Use trust for best-ranked skills, invocations for most-used, earnings for top revenue generators, or newest for recently added operators. Default is trust.",
        },
        limit: {
          type: "number",
          description: "Optional page size. Default is 20 and maximum is 100.",
        },
        offset: {
          type: "number",
          description: "Optional pagination offset. Use 0 for the first page, then increase by limit for later pages.",
        },
      },
    },
  },
  {
    name: "aegis_get_operator",
    description:
      "Get full public details for one operator. Use this after discovery when you already know the slug and want pricing, health, invocation counts, and whether the operator has a private SKILL.md payload.",
    inputSchema: {
      type: "object" as const,
      properties: {
        slug: {
          type: "string",
          description: "Required operator slug. This is the marketplace identifier, for example 'dobertest2' or 'solana-code-auditor'.",
        },
      },
      required: ["slug"],
    },
  },
  {
    name: "aegis_invoke_operator",
    description:
      "Invoke one operator and unlock its private SKILL.md payload. Use this only after you have selected an operator. For paid operators, do not send funds to a wallet address. Pay through the Aegis on-chain program, then retry with x-payment-proof and x-payer-wallet.",
    inputSchema: {
      type: "object" as const,
      properties: {
        operatorId: {
          type: "string",
          description: "Required operator ID, not slug. Get this from aegis_get_operator or aegis_list_operators first.",
        },
        payload: {
          type: "object",
          description: "Optional structured input payload for the invocation. Use an object such as { task: 'review this code' } if the skill expects inputs.",
        },
        "x-payer-wallet": {
          type: "string",
          description: "Optional Solana wallet address of the payer. Required in practice when submitting a payment transaction signature for a paid operator.",
        },
        "x-payment-proof": {
          type: "string",
          description: "Confirmed Solana transaction signature for the Aegis invoke_skill payment transaction. Required when the operator price is greater than zero.",
        },
        callerWallet: {
          type: "string",
          description: "Deprecated alias for x-payer-wallet.",
        },
        txSignature: {
          type: "string",
          description: "Deprecated alias for x-payment-proof.",
        },
      },
      required: ["operatorId"],
    },
  },
  {
    name: "aegis_get_trust_score",
    description:
      "Get the trust breakdown for one operator. Use this to evaluate whether a skill is reliable before invoking it. Returns the weighted component scores plus the overall trust score.",
    inputSchema: {
      type: "object" as const,
      properties: {
        operatorId: {
          type: "string",
          description: "Required operator ID. Fetch it from aegis_get_operator or aegis_list_operators first.",
        },
      },
      required: ["operatorId"],
    },
  },
  {
    name: "aegis_search_operators",
    description:
      "Search operators by free text when you do not know the exact slug. This is the fastest tool for finding candidates by name or short description.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Required search text. Example: 'sentiment analysis', 'code review', or 'solana security'.",
        },
        limit: {
          type: "number",
          description: "Optional maximum number of matches to return. Default is 10.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "aegis_get_categories",
    description:
      "List all active marketplace categories and the number of operators in each one. Use this to discover what kinds of skills are available before filtering.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
];

const RESOURCE_TEMPLATES = [
  {
    uriTemplate: "aegis://operators/{slug}/metadata",
    name: "operator-metadata",
    description: "Public metadata for a marketplace operator, including pricing, tags, and on-chain pointers.",
    mimeType: "application/json",
  },
  {
    uriTemplate: "aegis://operators/{slug}/trust",
    name: "operator-trust",
    description: "Trust breakdown for a marketplace operator.",
    mimeType: "application/json",
  },
];

const PROMPTS = [
  {
    name: "marketplace_explore",
    description: "Generate a guided workflow for discovering the best Aegis operators for a task.",
    arguments: [
      {
        name: "goal",
        description: "What the agent is trying to accomplish.",
        required: true,
      },
      {
        name: "constraints",
        description: "Optional cost, latency, category, or trust constraints.",
        required: false,
      },
    ],
  },
  {
    name: "operator_unlock",
    description: "Generate a workflow for evaluating and unlocking one operator's private SKILL.md content.",
    arguments: [
      {
        name: "slug",
        description: "The operator slug to inspect and unlock.",
        required: true,
      },
      {
        name: "wallet",
        description: "Optional caller wallet to use for paid invocation flows.",
        required: false,
      },
    ],
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

function serializeOperatorSummary(op: any) {
  return {
    id: op._id,
    slug: op.slug,
    name: op.name,
    tagline: op.tagline,
    description: op.description,
    category: op.category,
    trustScore: op.trustScore,
    totalInvocations: op.totalInvocations,
    successfulInvocations: op.successfulInvocations,
    totalEarned: op.totalEarned,
    pricePerCall: op.pricePerCall,
    avgResponseMs: op.avgResponseMs,
    hasPrivateSkill: typeof op.skill === "string" && op.skill.trim().length > 0,
    healthStatus: op.healthStatus,
    tags: op.tags || [],
    docsUrl: op.docsUrl || null,
    githubUrl: op.githubUrl || null,
    metadataUri: op.onChainMetadataUri || null,
    creatorWallet: op.creatorWallet || null,
    createdAt: op.createdAt,
    updatedAt: op.updatedAt,
  };
}

async function buildMcpPaymentRequiredResponse(operator: any, callerWallet: string) {
  const operatorId = String(operator.id);
  const checkoutUrl = buildCheckoutUrl({ mode: "mcp", operatorId });
  const { amount, amountAtomic, assetMint, hasAegisSettlement } = await buildOperatorPaymentContext({
    operator,
    callerWallet: callerWallet && callerWallet !== "mcp-agent" ? callerWallet : undefined,
  });

  return {
    error: "Payment Required",
    code: 402,
    message: hasAegisSettlement
      ? `This skill requires payment of ${amount.toFixed(6)} USDC to invoke.`
      : "This skill requires payment, but the operator is missing on-chain settlement metadata required for MCP payment instructions.",
    x402Version: 2,
    operatorId,
    operatorSlug: operator.slug,
    operatorName: operator.name,
    payment: {
      amount: amount.toFixed(6),
      amountAtomic,
      currency: "USDC",
      chain: "solana",
      network: getSolanaNetworkId(),
      asset: assetMint,
      recipient: operator.onChainProgramId || null,
      checkoutUrl,
      settlement: {
        method: "aegis_program",
        programId: operator.onChainProgramId || null,
        configPda: operator.onChainConfigPda || null,
        operatorPda: operator.onChainOperatorPda || null,
        operatorId: operator.onChainOperatorId ?? null,
        creatorWallet: operator.creatorWallet || null,
      },
    },
    instructions: hasAegisSettlement
      ? {
          step1: "Open payment.checkoutUrl and sign and send the payment.",
          step2: "Get the updated MCP command from checkout and call aegis_invoke_operator again.",
          step3: "Use that MCP command to get the result.",
        }
      : {
          step1: "Register this operator on-chain with Aegis settlement metadata before using paid MCP invocation.",
        },
  };
}

async function listMcpResources() {
  const topOperators = await listOperators({
    sortBy: "trust",
    limit: 20,
    offset: 0,
    activeOnly: true,
  });

  return [
    {
      uri: "aegis://marketplace/operators",
      name: "marketplace-operators",
      description: "Searchable operator listing. Supports query params: limit, offset, search, category, sortBy.",
      mimeType: "application/json",
    },
    {
      uri: "aegis://marketplace/categories",
      name: "marketplace-categories",
      description: "Marketplace operator counts grouped by category.",
      mimeType: "application/json",
    },
    {
      uri: "aegis://marketplace/stats",
      name: "marketplace-stats",
      description: "Aegis marketplace and guardrail summary statistics.",
      mimeType: "application/json",
    },
    ...topOperators.operators.flatMap((op: any) => ([
      {
        uri: `aegis://operators/${op.slug}/metadata`,
        name: `${op.slug}-metadata`,
        description: `Public metadata for ${op.name}`,
        mimeType: "application/json",
      },
      {
        uri: `aegis://operators/${op.slug}/trust`,
        name: `${op.slug}-trust`,
        description: `Trust score breakdown for ${op.name}`,
        mimeType: "application/json",
      },
    ])),
  ];
}

async function readMcpResource(uri: string) {
  const parsed = new URL(uri);
  if (parsed.protocol !== "aegis:") {
    throw new Error(`Unsupported resource URI: ${uri}`);
  }

  if (parsed.hostname === "marketplace") {
    if (parsed.pathname === "/stats") {
      const [protocol, guardrails] = await Promise.all([getProtocolStats(), getGuardrailStats()]);
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify({ protocol, guardrails }, null, 2),
          },
        ],
      };
    }

    if (parsed.pathname === "/categories") {
      const result = await OperatorModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$category", count: { $sum: 1 }, avgTrust: { $avg: "$trustScore" } } },
        { $sort: { count: -1 } },
      ]);
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify({
              categories: result.map((row: any) => ({
                category: row._id || "other",
                count: row.count,
                avgTrust: Math.round(row.avgTrust ?? 0),
              })),
            }, null, 2),
          },
        ],
      };
    }

    if (parsed.pathname === "/operators") {
      const limit = Math.min(Number(parsed.searchParams.get("limit")) || 20, 100);
      const offset = Math.max(Number(parsed.searchParams.get("offset")) || 0, 0);
      const sortBy = (parsed.searchParams.get("sortBy") as "trust" | "invocations" | "earnings" | "newest" | null) || "trust";
      const search = parsed.searchParams.get("search") || undefined;
      const category = parsed.searchParams.get("category") || undefined;
      const result = await listOperators({
        limit,
        offset,
        sortBy,
        search,
        category,
        activeOnly: true,
      });
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify({
              total: result.total,
              count: result.operators.length,
              operators: result.operators.map(serializeOperatorSummary),
            }, null, 2),
          },
        ],
      };
    }
  }

  if (parsed.hostname === "operators") {
    const [, slug, leaf] = parsed.pathname.split("/");
    if (!slug || !leaf) {
      throw new Error(`Invalid operator resource URI: ${uri}`);
    }

    const operator: any = await getOperatorBySlug(slug);
    if (!operator) {
      throw new Error(`Operator not found for slug: ${slug}`);
    }

    if (leaf === "metadata") {
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(serializeOperatorSummary(operator), null, 2),
          },
        ],
      };
    }

    if (leaf === "trust") {
      const operatorId = operator.id ?? operator._id;
      const trust = await getTrustBreakdown(operatorId as any);
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify({
              operatorId,
              slug: operator.slug,
              name: operator.name,
              trust,
            }, null, 2),
          },
        ],
      };
    }
  }

  throw new Error(`Unknown resource URI: ${uri}`);
}

function getPrompt(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "marketplace_explore": {
      const goal = (args.goal as string) || "Find the best Aegis operators for the current task.";
      const constraints = (args.constraints as string) || "No additional constraints provided.";
      return {
        description: "Guided marketplace discovery workflow",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: [
                `Goal: ${goal}`,
                `Constraints: ${constraints}`,
                "Use aegis_list_operators or the aegis://marketplace/operators resource to gather candidates.",
                "For the strongest candidates, inspect aegis_get_operator and aegis_get_trust_score or read aegis://operators/{slug}/metadata and aegis://operators/{slug}/trust.",
                "Recommend the best operator choices with a tradeoff table covering trust, price, latency, and category fit.",
              ].join("\n"),
            },
          },
        ],
      };
    }

    case "operator_unlock": {
      const slug = args.slug as string;
      if (!slug) {
        throw new Error("slug is required for operator_unlock");
      }
      const wallet = args.wallet as string | undefined;
      return {
        description: "Guided operator evaluation and unlock workflow",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: [
                `Inspect operator slug: ${slug}`,
                "First review public metadata and trust before invoking.",
                `Read aegis://operators/${slug}/metadata and aegis://operators/${slug}/trust, or call aegis_get_operator for the same operator.`,
                wallet
                  ? `If the operator is paid, use x-payer-wallet ${wallet} and provide x-payment-proof when calling aegis_invoke_operator.`
                  : "If the operator is paid, obtain confirmed payment proof before calling aegis_invoke_operator.",
                "After unlock, summarize the private SKILL.md content as executable instructions for the calling agent.",
              ].join("\n"),
            },
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
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
                  hasPrivateSkill: typeof op.skill === "string" && op.skill.trim().length > 0,
                  skillFormat: "markdown",
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

        const callerWallet = (args["x-payer-wallet"] as string) || (args.callerWallet as string) || "mcp-agent";
        const payload = args.payload ?? {};
        const txSignature = (args["x-payment-proof"] as string) || (args.txSignature as string | undefined);

        const listedPrice = parseFloat(operator.pricePerCall || "0");
        if (listedPrice > 0 && !txSignature) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  await buildMcpPaymentRequiredResponse(operator, callerWallet),
                  null,
                  2,
                ),
              },
            ],
            isError: true,
          };
        }

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

        try {
          const result = await executeInvocation({
            operatorId,
            callerWallet,
            payload,
            txSignature,
            source: "mcp",
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: result.success,
                    invocationId: result.invocationId,
                    operatorId: operator.id,
                    operatorSlug: operator.slug,
                    operatorName: result.operatorName,
                    responseMs: result.responseMs,
                    statusCode: result.statusCode,
                    response: result.response,
                    fees: result.fees,
                    guardrails: result.guardrails,
                    trustDelta: result.trustDelta,
                    newTrustScore: result.newTrustScore,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        } catch (err: any) {
          if (err instanceof InvocationError && err.statusCode === 402) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: false,
                      error: "PAYMENT_REQUIRED",
                      message: err.message,
                      operatorId: operator.id,
                      operatorSlug: operator.slug,
                      pricePerCall: operator.pricePerCall,
                      payment: await buildMcpPaymentRequiredResponse(operator, callerWallet),
                    },
                    null,
                    2,
                  ),
                },
              ],
              isError: true,
            };
          }

          throw err;
        }
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
        const { OperatorModel: OpModel } = await import("./db");
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
              resources: { subscribe: false, listChanged: false },
              prompts: { listChanged: false },
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

      // ── List Resources ──
      case "resources/list": {
        const resources = await listMcpResources();
        res.json(
          jsonrpcSuccess(id ?? null, {
            resources,
          }),
        );
        return;
      }

      // ── List Resource Templates ──
      case "resources/templates/list": {
        res.json(
          jsonrpcSuccess(id ?? null, {
            resourceTemplates: RESOURCE_TEMPLATES,
          }),
        );
        return;
      }

      // ── Read Resource ──
      case "resources/read": {
        const uri = (params as any)?.uri as string;
        if (!uri) {
          res.json(jsonrpcError(id ?? null, -32602, "Missing resource URI in params.uri"));
          return;
        }

        try {
          const result = await readMcpResource(uri);
          res.json(jsonrpcSuccess(id ?? null, result));
        } catch (err: any) {
          res.json(jsonrpcError(id ?? null, -32002, err.message || "Failed to read resource"));
        }
        return;
      }

      // ── List Prompts ──
      case "prompts/list": {
        res.json(
          jsonrpcSuccess(id ?? null, {
            prompts: PROMPTS,
          }),
        );
        return;
      }

      // ── Get Prompt ──
      case "prompts/get": {
        const promptName = (params as any)?.name as string;
        const promptArgs = ((params as any)?.arguments ?? {}) as Record<string, unknown>;

        if (!promptName) {
          res.json(jsonrpcError(id ?? null, -32602, "Missing prompt name in params.name"));
          return;
        }

        try {
          const prompt = getPrompt(promptName, promptArgs);
          res.json(jsonrpcSuccess(id ?? null, prompt));
        } catch (err: any) {
          res.json(jsonrpcError(id ?? null, -32602, err.message || "Failed to load prompt"));
        }
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
      "AI Agent Skills Marketplace on Solana - operator discovery, paid skill unlocks, trust scoring, NeMo guardrails, and USDC payments",
    protocolVersion: MCP_VERSION,
    capabilities: {
      tools: true,
      resources: true,
      prompts: true,
    },
    tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
    resources: [
      "aegis://marketplace/operators",
      "aegis://marketplace/categories",
      "aegis://marketplace/stats",
    ],
    resourceTemplates: RESOURCE_TEMPLATES,
    prompts: PROMPTS.map((prompt) => ({ name: prompt.name, description: prompt.description })),
    endpoint: "/api/mcp",
  });
}
