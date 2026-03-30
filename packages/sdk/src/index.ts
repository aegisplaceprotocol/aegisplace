// Types
export interface AegisConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
}

export interface Operator {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  tags: string[];
  pricePerCall: string;
  trustScore: number;
  totalInvocations: number;
  successRate: number;
  avgLatencyMs: number;
  isActive: boolean;
  isVerified: boolean;
}

export interface TrustScore {
  overall: number;
  dimensions: {
    successRate: number;
    reviews: number;
    latency: number;
    uptime: number;
    verification: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: string;
  status: string;
  proposalsCount: number;
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  bio: string;
  capabilities: string[];
  reputation: number;
  completedTasks: number;
  totalEarnings: number;
  isVerified: boolean;
}

export interface InvocationResult {
  success: boolean;
  data: unknown;
  latencyMs: number;
  guardrailStatus: string;
  trustScore: number;
}

export interface ListOperatorsOptions {
  category?: string;
  search?: string;
  sortBy?: 'trustScore' | 'totalInvocations' | 'pricePerCall';
  limit?: number;
  offset?: number;
}

export interface MarketplaceStats {
  totalOperators: number;
  activeOperators: number;
  totalInvocations: number;
  avgTrustScore: number;
}

export interface AgentRegistration {
  name: string;
  bio?: string;
  capabilities?: string[];
  walletAddress?: string;
  website?: string;
  createWallet?: boolean;
}

// MCP types
interface MCPRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number;
  result?: { content: Array<{ type: string; text: string }> };
  error?: { code: number; message: string };
}

// SDK Client
export class AegisClient {
  private baseUrl: string;
  private apiKey: string | undefined;
  private timeout: number;
  private requestId = 0;

  constructor(config: AegisConfig = {}) {
    this.baseUrl = (config.baseUrl || 'https://aegisplace.com').replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
  }

  // ── MCP call helper ──────────────────────────────────────
  private async mcpCall(toolName: string, args: object = {}): Promise<unknown> {
    const req: MCPRequest = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'tools/call',
      params: { name: toolName, arguments: args as Record<string, unknown> },
    };

    const res = await fetch(`${this.baseUrl}/api/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { 'x-aegis-api-key': this.apiKey } : {}),
      },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!res.ok) throw new AegisError(`HTTP ${res.status}: ${res.statusText}`, res.status);

    const data = (await res.json()) as MCPResponse;
    if (data.error) throw new AegisError(data.error.message, data.error.code);
    if (!data.result?.content?.[0]?.text) throw new AegisError('Empty response', 0);

    return JSON.parse(data.result.content[0].text);
  }

  // ── Operators ────────────────────────────────────────────

  /** List all operators with optional filters */
  async listOperators(options: ListOperatorsOptions = {}): Promise<Operator[]> {
    return this.mcpCall('aegis_list_operators', options) as Promise<Operator[]>;
  }

  /** Get a single operator by slug */
  async getOperator(slug: string): Promise<Operator> {
    return this.mcpCall('aegis_get_operator', { slug }) as Promise<Operator>;
  }

  /** Search operators by natural language query */
  async searchOperators(query: string, limit = 10): Promise<Operator[]> {
    return this.mcpCall('aegis_search_operators', { query, limit }) as Promise<Operator[]>;
  }

  /** Get trust score breakdown for an operator */
  async getTrustScore(slug: string): Promise<TrustScore> {
    return this.mcpCall('aegis_get_trust_score', { slug }) as Promise<TrustScore>;
  }

  /** Get all categories with operator counts */
  async getCategories(): Promise<Array<{ category: string; count: number; avgTrust: number }>> {
    return this.mcpCall('aegis_get_categories') as Promise<Array<{ category: string; count: number; avgTrust: number }>>;
  }

  // ── Invocations ──────────────────────────────────────────

  /** Invoke an operator with a payload */
  async invoke(operatorSlug: string, payload: Record<string, unknown>, txSignature?: string): Promise<InvocationResult> {
    return this.mcpCall('aegis_invoke_operator', {
      operatorSlug,
      payload,
      ...(txSignature ? { txSignature } : {}),
    }) as Promise<InvocationResult>;
  }

  // ── Tasks ────────────────────────────────────────────────

  /** List open tasks */
  async listTasks(options: { category?: string; status?: string; limit?: number } = {}): Promise<Task[]> {
    return this.mcpCall('aegis_list_tasks', options) as Promise<Task[]>;
  }

  /** Create a new task/bounty */
  async createTask(task: { title: string; description: string; category: string; budget: string; tags?: string[] }): Promise<Task> {
    return this.mcpCall('aegis_create_task', task) as Promise<Task>;
  }

  /** Submit a proposal for a task */
  async submitProposal(taskId: string, proposal: { amount: number; coverLetter: string; timeEstimate: string }): Promise<{ success: boolean }> {
    return this.mcpCall('aegis_submit_proposal', { taskId, ...proposal }) as Promise<{ success: boolean }>;
  }

  // ── Agents ───────────────────────────────────────────────

  /** Register as an agent on Aegis */
  async registerAgent(registration: AgentRegistration): Promise<{ agentId: string; apiKey: string }> {
    return this.mcpCall('aegis_agent_register', registration) as Promise<{ agentId: string; apiKey: string }>;
  }

  // ── Stats ────────────────────────────────────────────────

  /** Get marketplace statistics */
  async getStats(): Promise<MarketplaceStats> {
    return this.mcpCall('aegis_get_stats') as Promise<MarketplaceStats>;
  }
}

// Error class
export class AegisError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.name = 'AegisError';
    this.code = code;
  }
}

// Default export
export default AegisClient;
