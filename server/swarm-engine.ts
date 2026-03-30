/**
 * Swarm Engine - Ruflo swarm orchestration coordination layer for Aegis Protocol
 *
 * Provides typed interfaces and factory functions for spawning and managing
 * agent swarms. This module acts as the coordination layer and can connect
 * to a ruflo runtime when available, but functions standalone otherwise.
 */

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export type SwarmTopology = "star" | "mesh" | "ring" | "hierarchical";
export type SwarmStrategy = "parallel" | "sequential" | "consensus" | "competitive";
export type SwarmStatus = "idle" | "running" | "completed" | "failed" | "cancelled";
export type SwarmKind = "audit" | "discovery" | "review";

export interface SwarmConfig {
  topology: SwarmTopology;
  maxAgents: number;
  strategy: SwarmStrategy;
  timeoutMs?: number;
}

export interface SwarmAgent {
  id: string;
  role: string;
  status: SwarmStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  result: unknown;
}

export interface Swarm {
  id: string;
  kind: SwarmKind;
  config: SwarmConfig;
  status: SwarmStatus;
  agents: SwarmAgent[];
  createdAt: Date;
  updatedAt: Date;
  meta: Record<string, unknown>;
}

export interface SwarmEngineStats {
  available: boolean;
  rufloConnected: boolean;
  totalSwarms: number;
  activeSwarms: number;
  swarms: Array<{
    id: string;
    kind: SwarmKind;
    status: SwarmStatus;
    agentCount: number;
    createdAt: Date;
  }>;
}

// ────────────────────────────────────────────────────────────
// Internal state
// ────────────────────────────────────────────────────────────

const swarmRegistry = new Map<string, Swarm>();

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createAgent(role: string): SwarmAgent {
  return {
    id: generateId("agent"),
    role,
    status: "idle",
    startedAt: null,
    completedAt: null,
    result: null,
  };
}

function registerSwarm(swarm: Swarm): Swarm {
  swarmRegistry.set(swarm.id, swarm);
  return swarm;
}

// ────────────────────────────────────────────────────────────
// Ruflo runtime bridge (no-op when runtime is absent)
// ────────────────────────────────────────────────────────────

function isRufloAvailable(): boolean {
  try {
    // Attempt to resolve the ruflo runtime package if installed
    require.resolve("ruflo");
    return true;
  } catch {
    return false;
  }
}

// ────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────

/**
 * Spawns a security audit swarm for operator verification.
 * Agents inspect endpoint behavior, schema compliance, and trust signals.
 */
export function createAuditSwarm(operatorIds: string[], config?: Partial<SwarmConfig>): Swarm {
  const resolved: SwarmConfig = {
    topology: config?.topology ?? "star",
    maxAgents: config?.maxAgents ?? 4,
    strategy: config?.strategy ?? "consensus",
    timeoutMs: config?.timeoutMs ?? 30000,
  };

  const agents: SwarmAgent[] = [
    createAgent("endpoint-inspector"),
    createAgent("schema-validator"),
    createAgent("trust-auditor"),
    createAgent("guardrail-tester"),
  ].slice(0, resolved.maxAgents);

  const swarm: Swarm = {
    id: generateId("audit"),
    kind: "audit",
    config: resolved,
    status: "idle",
    agents,
    createdAt: new Date(),
    updatedAt: new Date(),
    meta: { operatorIds, rufloConnected: isRufloAvailable() },
  };

  return registerSwarm(swarm);
}

/**
 * Spawns a discovery swarm to find and index new MCP servers.
 * Agents crawl known registries, validate capabilities, and score trustworthiness.
 */
export function createDiscoverySwarm(seedUrls: string[], config?: Partial<SwarmConfig>): Swarm {
  const resolved: SwarmConfig = {
    topology: config?.topology ?? "mesh",
    maxAgents: config?.maxAgents ?? 6,
    strategy: config?.strategy ?? "parallel",
    timeoutMs: config?.timeoutMs ?? 60000,
  };

  const agents: SwarmAgent[] = [
    createAgent("registry-crawler"),
    createAgent("capability-prober"),
    createAgent("trust-scorer"),
    createAgent("dedup-filter"),
    createAgent("metadata-extractor"),
    createAgent("health-pinger"),
  ].slice(0, resolved.maxAgents);

  const swarm: Swarm = {
    id: generateId("discovery"),
    kind: "discovery",
    config: resolved,
    status: "idle",
    agents,
    createdAt: new Date(),
    updatedAt: new Date(),
    meta: { seedUrls, rufloConnected: isRufloAvailable() },
  };

  return registerSwarm(swarm);
}

/**
 * Spawns a code review swarm for operator endpoint analysis.
 * Agents review API contracts, security posture, and integration quality.
 */
export function createReviewSwarm(endpointUrls: string[], config?: Partial<SwarmConfig>): Swarm {
  const resolved: SwarmConfig = {
    topology: config?.topology ?? "hierarchical",
    maxAgents: config?.maxAgents ?? 3,
    strategy: config?.strategy ?? "sequential",
    timeoutMs: config?.timeoutMs ?? 45000,
  };

  const agents: SwarmAgent[] = [
    createAgent("api-contract-reviewer"),
    createAgent("security-analyzer"),
    createAgent("integration-tester"),
  ].slice(0, resolved.maxAgents);

  const swarm: Swarm = {
    id: generateId("review"),
    kind: "review",
    config: resolved,
    status: "idle",
    agents,
    createdAt: new Date(),
    updatedAt: new Date(),
    meta: { endpointUrls, rufloConnected: isRufloAvailable() },
  };

  return registerSwarm(swarm);
}

/**
 * Returns current state of all registered swarms and engine availability.
 */
export function getSwarmStatus(): SwarmEngineStats {
  const all = Array.from(swarmRegistry.values());
  const active = all.filter(s => s.status === "running");

  return {
    available: true,
    rufloConnected: isRufloAvailable(),
    totalSwarms: all.length,
    activeSwarms: active.length,
    swarms: all.map(s => ({
      id: s.id,
      kind: s.kind,
      status: s.status,
      agentCount: s.agents.length,
      createdAt: s.createdAt,
    })),
  };
}
