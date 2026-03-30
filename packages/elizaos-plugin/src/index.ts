/**
 * @aegis/elizaos-plugin
 *
 * ElizaOS plugin for Aegis Protocol - invoke AI skills on Solana
 * with USDC settlement, NeMo Guardrails safety, and composable royalties.
 *
 * Usage in ElizaOS character config:
 * ```json
 * {
 *   "plugins": ["@aegis/elizaos-plugin"],
 *   "settings": {
 *     "aegis": {
 *       "baseUrl": "https://mcp.aegisplace.com",
 *       "apiKey": "your-api-key"
 *     }
 *   }
 * }
 * ```
 */

export interface AegisPluginConfig {
  baseUrl?: string;
  apiKey?: string;
}

export interface AegisOperator {
  slug: string;
  name: string;
  category: string;
  tagline?: string;
  trustScore: number;
  totalInvocations: number;
  pricePerCall: string;
  isActive: boolean;
  isVerified: boolean;
}

export interface AegisInvocationResult {
  success: boolean;
  invocationId: number;
  operatorName: string;
  responseMs: number;
  response: any;
  fees: {
    total: string;
    creator: string;
    validator: string;
    treasury: string;
  };
}

const DEFAULT_BASE_URL = "https://mcp.aegisplace.com";

class AegisClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(config: AegisPluginConfig = {}) {
    this.baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
    this.apiKey = config.apiKey;
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    const res = await globalThis.fetch(`${this.baseUrl}${path}`, { ...options, headers });
    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      throw new Error(`Aegis API error ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  async listOperators(params: { limit?: number; category?: string; search?: string; sortBy?: string } = {}) {
    const qs = new URLSearchParams();
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.category) qs.set("category", params.category);
    if (params.search) qs.set("q", params.search);
    if (params.sortBy) qs.set("sortBy", params.sortBy);
    return this.fetch<{ operators: AegisOperator[]; total: number }>(`/api/v1/operators?${qs}`);
  }

  async getOperator(slug: string) {
    return this.fetch<AegisOperator>(`/api/v1/operators/${slug}`);
  }

  async invokeSkill(slug: string, payload: any = {}, callerWallet?: string) {
    return this.fetch<AegisInvocationResult>(`/api/v1/operators/${slug}/invoke`, {
      method: "POST",
      body: JSON.stringify({ payload, callerWallet }),
    });
  }

  async getStats() {
    return this.fetch<{
      operators: number;
      invocations: number;
      revenue: string;
      avgTrustScore: number;
    }>("/api/v1/stats");
  }

  async getTrustScore(slug: string) {
    return this.fetch<any>(`/api/v1/operators/${slug}/trust`);
  }
}

// ElizaOS Plugin Interface
export const aegisPlugin = {
  name: "aegis",
  description: "Invoke AI skills on Solana via Aegis Protocol with USDC settlement and NeMo Guardrails",

  actions: [
    {
      name: "AEGIS_LIST_SKILLS",
      description: "List available AI skills on Aegis Protocol. Use when the user asks about available skills, operators, or AI services on Solana.",
      examples: [
        [{ user: "user1", content: { text: "What AI skills are available?" } }],
        [{ user: "user1", content: { text: "Show me the top operators on Aegis" } }],
        [{ user: "user1", content: { text: "Find me a DeFi skill" } }],
      ],
      validate: async () => true,
      handler: async (runtime: any, message: any, state: any) => {
        const config = runtime.getSetting?.("aegis") || {};
        const client = new AegisClient(config);
        const search = message?.content?.text?.replace(/.*(?:list|show|find|search|available)\s*/i, "").trim();
        const result = await client.listOperators({
          limit: 10,
          sortBy: "trust",
          ...(search ? { search } : {}),
        });
        const lines = result.operators.map(
          (op: AegisOperator, i: number) =>
            `${i + 1}. **${op.name}** (${op.category}) - Trust: ${op.trustScore}/100, ${op.totalInvocations.toLocaleString()} invocations, $${op.pricePerCall}/call`
        );
        return {
          text: `Found ${result.total} operators on Aegis Protocol:\n\n${lines.join("\n")}\n\nUse "invoke [skill-name]" to execute any skill.`,
        };
      },
    },
    {
      name: "AEGIS_INVOKE_SKILL",
      description: "Invoke an AI skill on Aegis Protocol. Use when the user asks to run, execute, or invoke a specific skill or operator.",
      examples: [
        [{ user: "user1", content: { text: "Run the sentiment analyzer" } }],
        [{ user: "user1", content: { text: "Invoke risk-scorer on this data" } }],
      ],
      validate: async () => true,
      handler: async (runtime: any, message: any) => {
        const config = runtime.getSetting?.("aegis") || {};
        const client = new AegisClient(config);
        const text = message?.content?.text || "";
        const slugMatch = text.match(/(?:invoke|run|execute|use)\s+(\S+)/i);
        if (!slugMatch) {
          return { text: "Please specify which skill to invoke. Example: 'invoke sentiment-analyzer'" };
        }
        const slug = slugMatch[1].toLowerCase();
        try {
          const result = await client.invokeSkill(slug, { input: text });
          return {
            text: `✅ Invoked **${result.operatorName}** (${result.responseMs}ms)\n\nResult: ${JSON.stringify(result.response, null, 2)}\n\nFees: $${result.fees.total} USDC`,
          };
        } catch (err: any) {
          return { text: `Failed to invoke "${slug}": ${err.message}` };
        }
      },
    },
    {
      name: "AEGIS_PROTOCOL_STATS",
      description: "Get Aegis Protocol statistics. Use when the user asks about protocol metrics, stats, or health.",
      examples: [
        [{ user: "user1", content: { text: "How is Aegis doing?" } }],
        [{ user: "user1", content: { text: "Protocol stats" } }],
      ],
      validate: async () => true,
      handler: async (runtime: any) => {
        const config = runtime.getSetting?.("aegis") || {};
        const client = new AegisClient(config);
        const stats = await client.getStats();
        return {
          text: `📊 **Aegis Protocol Stats**\n\n• Operators: ${stats.operators.toLocaleString()}\n• Total Invocations: ${stats.invocations.toLocaleString()}\n• Protocol Revenue: $${Number(stats.revenue).toLocaleString()} USDC\n• Avg Trust Score: ${stats.avgTrustScore}/100\n• Chain: Solana\n• Settlement: USDC`,
        };
      },
    },
    {
      name: "AEGIS_TRUST_CHECK",
      description: "Check the trust score of an AI skill. Use when the user asks about trustworthiness, safety, or reliability of a skill.",
      examples: [
        [{ user: "user1", content: { text: "Is sentiment-analyzer trustworthy?" } }],
        [{ user: "user1", content: { text: "Check trust score for risk-scorer" } }],
      ],
      validate: async () => true,
      handler: async (runtime: any, message: any) => {
        const config = runtime.getSetting?.("aegis") || {};
        const client = new AegisClient(config);
        const text = message?.content?.text || "";
        const slugMatch = text.match(/(?:trust|check|verify|safe)\s+(\S+)/i);
        if (!slugMatch) {
          return { text: "Please specify which skill to check. Example: 'check trust sentiment-analyzer'" };
        }
        const slug = slugMatch[1].toLowerCase();
        try {
          const trust = await client.getTrustScore(slug);
          return {
            text: `🛡️ **Trust Report: ${slug}**\n\n• Overall Score: ${trust.overall}/100\n• Execution Reliability: ${trust.executionReliability}/100\n• Response Quality: ${trust.responseQuality}/100\n• Schema Compliance: ${trust.schemaCompliance}/100\n• Validator Consensus: ${trust.validatorConsensus}/100\n• Historical Performance: ${trust.historicalPerformance}/100`,
          };
        } catch (err: any) {
          return { text: `Could not find trust data for "${slug}": ${err.message}` };
        }
      },
    },
  ],

  evaluators: [],
  providers: [],
};

// Default export for ElizaOS plugin loader
export default aegisPlugin;
