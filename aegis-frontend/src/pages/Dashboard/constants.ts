/**
 * Aegis Dashboard - Shared Constants
 *
 * Demo data, fee splits, and helper functions used across panels.
 */
import { T } from "./theme";

/* ── Types ─────────────────────────────────────────────────────────────── */

export interface LiveTx {
  id: number;
  operator: string;
  caller: string;
  amount: string;
  status: "completed" | "pending" | "failed";
  latency: string;
  time: string;
}

export interface DemoOperator {
  name: string;
  category: string;
  successRate: number;
  earned: number;
  invocations: number;
  successHistory: number[];
}

export interface ApiOperator {
  id: number;
  name: string;
  slug: string;
  category: string;
  pricePerCall: string;
  trustScore: number;
  totalInvocations: number;
  successRate: string;
}

/* ── Constants ─────────────────────────────────────────────────────────── */

export const FEE_SPLIT = [
  { label: "Creator", pct: 85 },
  { label: "Validators", pct: 15 },
  { label: "Stakers", pct: 12 },
  { label: "Treasury", pct: 8 },
  { label: "Insurance", pct: 3 },
  { label: "Burned", pct: 2 },
];

export interface NetworkHealthItem {
  label: string;
  value: number | string;
  unit: string;
  bar?: number;
}

export function computeNetworkHealth(stats: Record<string, unknown> | undefined): NetworkHealthItem[] {
  const invocations = (stats?.totalInvocations as number) ?? 0;
  const healthyOps = ((stats?.health as Record<string, number>)?.healthy) ?? 0;
  const realOps = (stats?.realOperators as number) ?? 1;
  const guardrails = stats?.guardrails as Record<string, unknown> | undefined;
  const guardrailPass = guardrails?.passRate != null ? parseFloat(String(guardrails.passRate)) : null;
  const blocked = (guardrails?.blocked as number) ?? 0;

  return [
    { label: "Invocation Success", value: invocations > 0 ? parseFloat((((invocations - blocked) / invocations) * 100).toFixed(1)) : "--", unit: invocations > 0 ? "%" : "" },
    { label: "Avg Response", value: "--", unit: "ms", bar: 0 },
    { label: "Operator Uptime", value: realOps > 0 ? parseFloat(((healthyOps / realOps) * 100).toFixed(1)) : "--", unit: realOps > 0 ? "%" : "" },
    { label: "Guardrail Pass", value: guardrailPass != null ? guardrailPass : "--", unit: guardrailPass != null ? "%" : "" },
    { label: "Settlement Rate", value: 99.9, unit: "%" },
  ];
}

export const DEMO_SPARKLINE = [
  8, 9, 10, 9, 11, 12, 11, 13, 14, 13, 15, 16, 15, 17, 18, 17, 19, 20, 19, 21,
  22, 21, 23, 24, 23, 25, 26, 25, 27, 28, 29, 30, 29, 31, 32, 33, 34, 35, 34, 36,
];

export const DEMO_REVENUE = [
  620, 680, 710, 650, 740, 790, 770, 830, 880, 850,
  920, 960, 940, 1010, 1050, 1020, 1090, 1140, 1110, 1180,
  1230, 1200, 1280, 1320, 1290, 1370, 1410, 1380, 1460, 1500,
  1520, 1580, 1550, 1640, 1690, 1660, 1730, 1780, 1810, 1870,
  1920, 1890, 1960, 2020, 1990, 2070, 2130, 2100, 2180, 2240,
  2270, 2340, 2310, 2400, 2460, 2430, 2520, 2580, 2550, 2640,
  2700, 2730, 2810, 2780, 2870, 2940, 2910, 3000, 3060, 3100,
  3180, 3250, 3220, 3310, 3380, 3420, 3500, 3570, 3540, 3630,
  3700, 3750, 3830, 3810, 3900, 3970, 4020, 4100, 4080, 4170,
];

export const DEMO_OPS: DemoOperator[] = [
  { name: "Jupiter Swap",       category: "DeFi",           successRate: 99.1, earned: 24120, invocations: 18420, successHistory: [95, 96, 97, 96, 98, 99, 99, 98, 99, 99] },
  { name: "Helius RPC",         category: "Infrastructure", successRate: 97.8, earned: 21340, invocations: 15890, successHistory: [94, 95, 96, 97, 96, 97, 98, 97, 98, 98] },
  { name: "Claude Analyst",     category: "AI / ML",        successRate: 98.4, earned: 18760, invocations: 14230, successHistory: [93, 94, 95, 96, 97, 98, 97, 98, 98, 98] },
  { name: "Mistral Large",      category: "AI / ML",        successRate: 96.2, earned: 15890, invocations: 12100, successHistory: [91, 92, 93, 94, 95, 95, 96, 96, 96, 96] },
  { name: "DeepSeek V3",        category: "AI / ML",        successRate: 99.5, earned: 14230, invocations: 10890, successHistory: [97, 98, 98, 99, 99, 99, 99, 100, 99, 100] },
  { name: "Pyth Oracle",        category: "Data",           successRate: 95.8, earned: 12100, invocations: 9870,  successHistory: [90, 91, 92, 93, 94, 95, 95, 96, 96, 96] },
  { name: "NVIDIA NeMo Guard",  category: "Security",       successRate: 94.3, earned: 10890, invocations: 8450,  successHistory: [88, 89, 90, 91, 92, 93, 94, 94, 94, 94] },
  { name: "Solana Parser",      category: "Infrastructure", successRate: 98.9, earned: 9870,  invocations: 7620,  successHistory: [96, 97, 97, 98, 98, 99, 99, 99, 99, 99] },
];

export const OPERATORS_FOR_FEED = [
  "Jupiter Swap", "Helius RPC", "Claude Analyst", "OpenAI GPT-4o",
  "Mistral Large", "DeepSeek V3", "Jito MEV", "Raydium Pool",
  "Pyth Oracle", "Perplexity Search", "Cursor Agent", "Gemini Flash",
  "Solana Parser", "NVIDIA NeMo", "Orca Whirlpool", "Coinbase x402",
];

/* ── Helpers ──────────────────────────────────────────────────────────── */

/**
 * Format a real invocation record (from trpc.invoke.recent) into a LiveTx.
 * The API returns { invocation, operatorName, operatorSlug }[].
 */
export function formatInvocationAsTx(row: {
  invocation: {
    id?: number | string;
    callerWallet?: string | null;
    amountPaid?: string | null;
    success?: boolean;
    responseMs?: number | null;
    createdAt?: string | Date | null;
  };
  operatorName?: string | null;
  operatorSlug?: string | null;
}, index: number): LiveTx {
  const inv = row.invocation;
  const wallet = inv.callerWallet ?? null;
  const shortCaller = wallet
    ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}`
    : "anon";
  const amount = inv.amountPaid ? `$${parseFloat(inv.amountPaid).toFixed(2)}` : "$0.00";
  const status: LiveTx["status"] = inv.success ? "completed" : inv.responseMs === 0 ? "pending" : "failed";
  const latency = inv.responseMs != null ? `${inv.responseMs}ms` : "--";
  const time = inv.createdAt
    ? new Date(inv.createdAt).toLocaleTimeString()
    : "just now";

  return {
    id: typeof inv.id === "number" ? inv.id : index,
    operator: row.operatorName ?? row.operatorSlug ?? "unknown",
    caller: shortCaller,
    amount,
    status,
    latency,
    time,
  };
}

export function statusDot(s: string) {
  if (s === "completed") return "rgba(52,211,153,0.55)";
  if (s === "pending") return "rgba(234,179,68,0.40)";
  return "rgba(220,80,60,0.45)";
}
