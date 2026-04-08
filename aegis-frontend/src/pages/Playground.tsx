import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";

interface Operator {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  pricePerCall: string;
  author: string;
  tier: string;
  invocations: number;
  successRate: number;
  avgLatencyMs: number;
  quality: number;
  qualityScore: number;
  priceDisplay: string;
  validators: number;
  status: string;
  price: number;
  authorAddress: string;
  namespace: string;
  bond: string;
  avgScore: number;
  license: string;
  language: string;
  compatibility: string[];
  createdAt: string;
  updatedAt: string;
  versions: { version: string; date: string; changes: string; breaking?: boolean; changelog?: string[] }[];
  validatorList: { address: string; tier: string; bond: number; score: number; reviews: number }[];
  repo: string;
  recentInvocations: { caller: string; time: string; status: string }[];
  stars: number;
  reviews: { rating: number; text: string }[];
}

/* ── Simulated wallet state ──────────────────────────────────────────── */
interface WalletState {
  address: string;
  sol: number;
  usdc: number;
  aegis: number;
  quality: number;
  tier: string;
  invocations: number;
}

const INITIAL_WALLET: WalletState = {
  address: "7xKp3nVq...R4mW8tQ",
  sol: 2.0,
  usdc: 25.0,
  aegis: 0,
  quality: 0,
  tier: "Unranked",
  invocations: 0,
};

/* ── Terminal line types ─────────────────────────────────────────────── */
interface TermLine {
  id: number;
  type: "prompt" | "output" | "success" | "error" | "dim" | "header" | "divider" | "result" | "blank" | "split" | "split-detail" | "balance" | "warning" | "table-row" | "ascii";
  text: string;
}

let lineId = 0;
const mkLine = (type: TermLine["type"], text: string): TermLine => ({
  id: ++lineId,
  type,
  text,
});

/* ── Command history ─────────────────────────────────────────────────── */
const SUGGESTED_COMMANDS = [
  'agent-aegis search "code review"',
  "agent-aegis swarm llm_research --agents 6",
  "agent-aegis invoke code-review-agent --pay x402",
  "agent-aegis inspect solidity-auditor",
  "agent-aegis clearance code-review-agent",
  "agent-aegis clearance code-review-agent --mission defi",
  "agent-aegis mcp-server --start",
  "agent-aegis connect mcp-client",
  "agent-aegis connect codex-cli",
  "agent-aegis sandbox code-review-agent",
  "agent-aegis trace solidity-auditor",
  "agent-aegis balance",
  "agent-aegis status",
  'agent-aegis search --category Security',
  "agent-aegis validate code-review-agent --stake 500",
  "agent-aegis delegate pdf-extract-pro entity-extract text-summarize",
  "agent-aegis evolve code-review-agent --cycles 25",
  "agent-aegis publish my-skill --price 0.001 --category Security",
  "agent-aegis help",
];

/* ── Helpers ──────────────────────────────────────────────────────────── */
function padRight(str: string, len: number) {
  return str.length >= len ? str.slice(0, len) : str + " ".repeat(len - str.length);
}

function padLeft(str: string, len: number) {
  return str.length >= len ? str : " ".repeat(len - str.length) + str;
}

function randomAddr() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789";
  let a = "";
  for (let i = 0; i < 4; i++) a += chars[Math.floor(Math.random() * chars.length)];
  let b = "";
  for (let i = 0; i < 4; i++) b += chars[Math.floor(Math.random() * chars.length)];
  return `${a}...${b}`;
}

function randomTxHash() {
  const chars = "0123456789abcdef";
  let a = "";
  for (let i = 0; i < 4; i++) a += chars[Math.floor(Math.random() * chars.length)];
  let b = "";
  for (let i = 0; i < 4; i++) b += chars[Math.floor(Math.random() * chars.length)];
  return `${a}...${b}`;
}

// Mutable module-level reference populated by the component's tRPC query
let ALL_OPERATORS: Operator[] = [];

function findOperator(query: string): Operator | undefined {
  const q = query.toLowerCase().trim();
  return ALL_OPERATORS.find(
    (s) =>
      s.name.toLowerCase() === q ||
      s.slug.toLowerCase() === q ||
      s.id.toLowerCase() === q
  );
}

function searchOperators(query: string): Operator[] {
  const q = query.toLowerCase().trim();
  if (!q) return ALL_OPERATORS.slice(0, 10);
  return ALL_OPERATORS.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.author.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q)) ||
      s.category.toLowerCase().includes(q)
  );
}

function filterByCategory(cat: string): Operator[] {
  const c = cat.toLowerCase().trim();
  return ALL_OPERATORS.filter((s) => s.category.toLowerCase() === c);
}

/* ── Command processor ───────────────────────────────────────────────── */
function processCommand(
  raw: string,
  wallet: WalletState,
  setWallet: React.Dispatch<React.SetStateAction<WalletState>>
): TermLine[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const lines: TermLine[] = [];
  const add = (type: TermLine["type"], text: string) => lines.push(mkLine(type, text));

  // Parse the command
  const parts: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of trimmed) {
    if (ch === '"' || ch === "'") {
      inQuotes = !inQuotes;
    } else if (ch === " " && !inQuotes) {
      if (current) parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) parts.push(current);

  // Strip "agent-aegis" prefix if present
  let cmdParts = parts;
  if (parts[0] === "agent-aegis") {
    cmdParts = parts.slice(1);
  } else if (parts[0] === "clear") {
    return [mkLine("blank", "__CLEAR__")];
  } else if (parts[0] === "help" || parts[0] === "--help") {
    cmdParts = ["help"];
  } else if (parts[0] !== "agent-aegis" && parts[0] !== "clear") {
    // Allow shorthand commands
    cmdParts = parts;
  }

  const cmd = cmdParts[0]?.toLowerCase() || "help";
  const args = cmdParts.slice(1);

  switch (cmd) {
    /* ── HELP ──────────────────────────────────────────────────────── */
    case "help":
    case "--help":
    case "-h": {
      add("blank", "");
      add("ascii", "   █████╗  ██████╗ ███████╗███╗   ██╗████████╗");
      add("ascii", "  ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝");
      add("ascii", "  ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   ");
      add("ascii", "  ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ");
      add("ascii", "  ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ");
      add("ascii", "  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   ");
      add("ascii", "           █████╗ ███████╗ ██████╗ ██╗███████╗");
      add("ascii", "          ██╔══██╗██╔════╝██╔════╝ ██║██╔════╝");
      add("ascii", "          ███████║█████╗  ██║  ███╗██║███████╗");
      add("ascii", "          ██╔══██║██╔══╝  ██║   ██║██║╚════██║");
      add("ascii", "          ██║  ██║███████╗╚██████╔╝██║███████║");
      add("ascii", "          ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝╚══════╝");
      add("blank", "");
      add("output", "  Agent Aegis v0.9.1  -  The economic layer for AI agent operators");
      add("dim", "  Runtime: Go 1.22 | Chain: Solana (devnet) | Protocol: x402");
      add("blank", "");
      add("header", "  COMMANDS");
      add("divider", "  ────────────────────────────────────────────────────");
      add("result", '  search <query>              Search 82K+ operators by name, tag, or description');
      add("result", "  clearance <operator>           Run 6-pillar threat assessment");
      add("result", "  search --category <cat>     Filter operators by category");
      add("result", "  invoke <operator> --pay x402   Invoke an operator with x402 micropayment");
      add("result", "  inspect <operator>             View detailed operator information");
      add("result", "  validate <operator> --stake N  Stake $AEGIS to validate an operator");
      add("result", "  challenge <operator> --stake N Challenge an operator via prediction market");
      add("result", "  sandbox <operator>             Show sandbox permissions for an operator");
      add("result", "  trace <operator>               View observation loop trace");
      add("result", "  balance                     Show wallet balances");
      add("result", "  wallet address              Show wallet address");
      add("result", "  wallet airdrop [amount]     Request SOL from devnet faucet");
      add("result", "  status                      Show protocol status");
      add("result", "  ls                          List all available operators");
      add("result", "  mcp-server --start          Start MCP server for agent platforms");
      add("result", "  mcp-server --stop           Stop MCP server");
      add("result", "  connect <platform>          Connect to MCP Client, Codex CLI, etc.");
      add("result", "  delegate <operators...>        Chain operators into a pipeline");
      add("result", "  swarm <category> [--agents N]  Launch autonomous research swarm");
      add("result", "  clearance <operator> [--mission M]  Run threat assessment / clearance check");
      add("result", "  evolve <operator> [--cycles N]       Run 6-axis evolution simulation");
      add("result", "  publish <name> [--price N] [--cat C]  Publish a skill to the marketplace");
      add("result", "  clear                       Clear terminal");
      add("result", "  help                        Show this help message");
      add("blank", "");
      add("dim", "  Tip: You can omit 'agent-aegis' prefix  -  just type 'search', 'invoke', etc.");
      add("blank", "");
      break;
    }

    /* ── SEARCH ────────────────────────────────────────────────────── */
    case "search": {
      const catFlag = args.indexOf("--category");
      let results: Operator[];
      let searchLabel: string;

      if (catFlag !== -1 && args[catFlag + 1]) {
        const cat = args[catFlag + 1];
        results = filterByCategory(cat);
        searchLabel = `category: ${cat}`;
      } else {
        const query = args.filter((a) => !a.startsWith("--")).join(" ");
        results = searchOperators(query);
        searchLabel = query || "all";
      }

      add("output", `  Searching Aegis Index (82,074 operators)...`);
      add("dim", `  Query: "${searchLabel}" | Source: GitHub + HF Spaces + Native`);
      add("blank", "");

      if (results.length === 0) {
        add("warning", "  No operators found matching your query.");
        add("dim", '  Try: search "code review" or search --category Security');
      } else {
        const shown = results.slice(0, 12);
        add("header", `  ${padRight("OPERATOR", 28)} ${padRight("SCORE", 8)} ${padRight("PRICE", 16)} ${padRight("VALIDATORS", 12)} ${padRight("STATUS", 10)}`);
        add("divider", `  ${"─".repeat(28)} ${"─".repeat(8)} ${"─".repeat(16)} ${"─".repeat(12)} ${"─".repeat(10)}`);

        for (const s of shown) {
          const name = padRight(s.name, 28);
          const score = padRight(`${s.quality}/100`, 8);
          const price = padRight(s.priceDisplay, 16);
          const vals = padRight(`${s.validators} bonded`, 12);
          const status = s.status;
          add("table-row", `  ${name} ${score} ${price} ${vals} ${status}`);
        }

        add("blank", "");
        add("success", `  [OK] ${results.length} operator${results.length !== 1 ? "s" : ""} found${results.length > 12 ? ` (showing top 12)` : ""}`);
        add("dim", `  Use 'inspect <operator-name>' for details or 'invoke <operator-name> --pay x402' to execute`);
      }
      add("blank", "");
      break;
    }

    /* ── INVOKE ────────────────────────────────────────────────────── */
    case "invoke": {
      const operatorName = args.find((a) => !a.startsWith("--"));
      const hasPayFlag = args.includes("--pay") || args.includes("x402");

      if (!operatorName) {
        add("error", "  Error: Missing operator name");
        add("dim", "  Usage: invoke <operator-name> --pay x402");
        break;
      }

      const operator = findOperator(operatorName);
      if (!operator) {
        add("error", `  Error: Operator "${operatorName}" not found in Aegis Index`);
        add("dim", `  Try: search "${operatorName}" to find available operators`);
        break;
      }

      if (!hasPayFlag) {
        add("warning", "  Warning: No payment flag specified. Adding --pay x402 automatically.");
      }

      const usdcCost = operator.price / 1_000_000_000 * 170; // rough SOL→USD
      const aegisReceived = usdcCost * 248; // rough exchange rate

      add("output", `  GET /invoke/${operator.name}`);
      add("output", `  HTTP 402 → Payment Required`);
      add("output", `  Amount: $${usdcCost.toFixed(2)} USDC | Protocol: x402 | Chain: Solana`);
      add("output", `  Signing USDC transfer with wallet ${wallet.address}...`);

      const txHash = randomTxHash();
      add("success", `  [OK] x402 payment confirmed (tx: ${txHash})`);
      add("blank", "");

      add("output", `  Swapping USDC → $AEGIS via Jupiter...`);
      add("success", `  [OK] Swapped $${usdcCost.toFixed(2)} USDC → ${aegisReceived.toFixed(1)} $AEGIS`);
      add("blank", "");

      const creatorShare = aegisReceived * 0.85;
      const validatorShare = aegisReceived * 0.15;
      const stakerShare = aegisReceived * 0.12;
      const treasuryShare = aegisReceived * 0.08;
      const insuranceShare = aegisReceived * 0.03;
      const burnShare = aegisReceived * 0.02;

      add("split", "  Revenue split executed atomically:");
      add("split-detail", `    → ${creatorShare.toFixed(2)} $AEGIS  (85%)  → creator:  ${operator.authorAddress.slice(0, 12)}`);
      add("split-detail", `    → ${validatorShare.toFixed(2)} $AEGIS  (10%)  → validators: ${randomAddr()}`);
      add("split-detail", `    → ${stakerShare.toFixed(2)} $AEGIS  (3%)   → treasury`);
      add("split-detail", `    → ${treasuryShare.toFixed(2)} $AEGIS  (3%)   → treasury`);
      add("split-detail", `    → ${insuranceShare.toFixed(2)} $AEGIS  (1.5%) → insurance fund`);
      add("split-detail", `    → ${burnShare.toFixed(2)} $AEGIS  (0.5%) → burned (deflationary)`);
      add("blank", "");

      const duration = (Math.random() * 2.5 + 0.5).toFixed(1);
      add("output", `  Launching Deno sandbox (strict mode)...`);
      add("dim", `    --allow-net=api.openai.com  --allow-read=./input  --deny-write  --deny-env`);
      add("output", `  Executing operator...`);
      add("success", `  [OK] Operator completed in ${duration}s | Sandbox: clean exit`);
      add("success", `  [OK] Observation trace recorded: tr_${randomTxHash()}`);
      add("success", `  [OK] Quality +1 -> ${wallet.quality + 1}/100`);

      // Update wallet
      setWallet((prev) => ({
        ...prev,
        usdc: Math.max(0, prev.usdc - usdcCost),
        invocations: prev.invocations + 1,
        quality: Math.min(100, prev.quality + 1),
        tier: prev.invocations + 1 >= 50 ? "Gold" : prev.invocations + 1 >= 10 ? "Silver" : prev.invocations + 1 >= 3 ? "Bronze" : "Unranked",
      }));

      add("blank", "");
      break;
    }

    /* ── INSPECT ───────────────────────────────────────────────────── */
    case "inspect": {
      const operatorName = args.find((a) => !a.startsWith("--"));
      if (!operatorName) {
        add("error", "  Error: Missing operator name");
        add("dim", "  Usage: inspect <operator-name>");
        break;
      }

      const operator = findOperator(operatorName);
      if (!operator) {
        add("error", `  Error: Operator "${operatorName}" not found`);
        add("dim", `  Try: search "${operatorName}" to find available operators`);
        break;
      }

      add("blank", "");
      add("header", `  ┌─────────────────────────────────────────────────────────┐`);
      add("header", `  │  OPERATOR: ${padRight(operator.name, 48)}│`);
      add("header", `  └─────────────────────────────────────────────────────────┘`);
      add("blank", "");
      add("result", `  Namespace:     ${operator.namespace}`);
      add("result", `  Author:        ${operator.author} (${operator.authorAddress})`);
      add("result", `  Category:      ${operator.category}`);
      add("result", `  Price:         ${operator.priceDisplay} per invocation`);
      add("result", `  Bond:          ${operator.bond}`);
      add("result", `  Quality:     ${operator.quality}/100 (${operator.tier})`);
      add("result", `  Invocations:   ${operator.invocations.toLocaleString()}`);
      add("result", `  Validators:    ${operator.validators} bonded`);
      add("result", `  Avg Score:     ${operator.avgScore}/5.0`);
      add("result", `  Status:        ${operator.status}`);
      add("result", `  License:       ${operator.license}`);
      add("result", `  Language:       ${operator.language}`);
      add("result", `  Tags:          ${operator.tags.join(", ")}`);
      add("result", `  Compatible:    ${operator.compatibility.join(", ")}`);
      add("result", `  Created:       ${operator.createdAt}`);
      add("result", `  Updated:       ${operator.updatedAt}`);
      add("blank", "");

      add("header", "  VERSION HISTORY");
      add("divider", "  ────────────────────────────────────────────────────");
      for (const v of operator.versions.slice(0, 3)) {
        add("result", `  v${v.version} (${v.date})${v.breaking ? " [BREAKING]" : ""}`);
        for (const c of (v.changelog ?? [])) {
          add("dim", `    • ${c}`);
        }
      }
      add("blank", "");

      if (operator.validatorList.length > 0) {
        add("header", "  VALIDATORS");
        add("divider", "  ────────────────────────────────────────────────────");
        add("header", `  ${padRight("ADDRESS", 16)} ${padRight("TIER", 14)} ${padRight("BOND", 12)} ${padRight("SCORE", 8)} ${padRight("REVIEWS", 8)}`);
        for (const v of operator.validatorList.slice(0, 5)) {
          add("table-row", `  ${padRight(v.address, 16)} ${padRight(v.tier, 14)} ${padLeft(v.bond.toLocaleString(), 10)}  ${padRight(v.score.toFixed(1), 8)} ${v.reviews}`);
        }
        if (operator.validatorList.length > 5) {
          add("dim", `  ... and ${operator.validatorList.length - 5} more validators`);
        }
      }

      add("blank", "");
      add("dim", `  Repo: github.com/${operator.repo}`);
      add("dim", `  Invoke: agent-aegis invoke ${operator.name} --pay x402`);
      add("blank", "");
      break;
    }

    /* ── BALANCE ───────────────────────────────────────────────────── */
    case "balance": {
      add("blank", "");
      add("header", "  WALLET BALANCE");
      add("divider", "  ────────────────────────────────────────────────────");
      add("balance", `  SOL:    ${wallet.sol.toFixed(3)}`);
      add("balance", `  USDC:   ${wallet.usdc.toFixed(2)}`);
      add("balance", `  $AEGIS: ${wallet.aegis.toFixed(2)}`);
      add("blank", "");
      add("result", `  Address:     ${wallet.address}`);
      add("result", `  Quality:   ${wallet.quality}/100 (${wallet.tier})`);
      add("result", `  Invocations: ${wallet.invocations}`);
      add("result", `  Network:     Solana (devnet)`);
      add("blank", "");
      break;
    }

    /* ── WALLET ────────────────────────────────────────────────────── */
    case "wallet": {
      const subCmd = args[0]?.toLowerCase();
      if (subCmd === "address") {
        add("output", `  ${wallet.address}`);
        add("dim", "  Network: Solana (devnet)");
      } else if (subCmd === "airdrop") {
        const amount = parseFloat(args[1] || "2");
        const amt = isNaN(amount) ? 2 : Math.min(amount, 5);
        add("output", `  Requesting ${amt} SOL from devnet faucet...`);
        add("success", `  [OK] ${amt.toFixed(9)} SOL received`);
        setWallet((prev) => ({ ...prev, sol: prev.sol + amt }));
      } else {
        add("output", "  wallet address    -  Show wallet address");
        add("output", "  wallet airdrop    -  Request SOL from devnet faucet");
      }
      add("blank", "");
      break;
    }

    /* ── STATUS ────────────────────────────────────────────────────── */
    case "status": {
      add("blank", "");
      add("header", "  AEGIS PROTOCOL STATUS");
      add("divider", "  ────────────────────────────────────────────────────");
      add("success", "  - Network:          Solana devnet (connected)");
      add("success", "  - Aegis Registry:   Online");
      add("success", "  - Aegis Index:      82,074 operators indexed");
      add("success", "  - x402 Gateway:     Active");
      add("success", "  - Deno Sandbox:     v1.40 (ready)");
      add("success", "  - Jupiter Swap:     Active");
      add("success", "  - MCP Server:       Ready (port 3847)");
      add("success", "  - Agent Platforms:  MCP Client, Cowork, Codex CLI, Codex App, ChatGPT");
      add("result", `  - Block Height:     ${(298_000_000 + Math.floor(Math.random() * 1_000_000)).toLocaleString()}`);
      add("result", `  - Slot:             ${(350_000_000 + Math.floor(Math.random() * 1_000_000)).toLocaleString()}`);
      add("result", "  - TPS:              ~4,200");
      add("result", "  - Avg Tx Cost:      $0.00025");
      add("result", "  - Finality:         ~400ms");
      add("blank", "");
      add("dim", "  Source: operators.sh (82K+). Vercel Labs Open Agent Operators Ecosystem");
      add("dim", "  Built on the x402 open standard (HTTP 402 micropayments)");
      add("blank", "");
      break;
    }

    /* ── LS ─────────────────────────────────────────────────────────── */
    case "ls": {
      add("output", `  Listing all operators in Aegis Index (${ALL_OPERATORS.length} loaded)...`);
      add("blank", "");
      add("header", `  ${padRight("#", 4)} ${padRight("NAME", 28)} ${padRight("AUTHOR", 16)} ${padRight("CATEGORY", 16)} ${padRight("REP", 8)} ${padRight("STATUS", 10)}`);
      add("divider", `  ${"─".repeat(4)} ${"─".repeat(28)} ${"─".repeat(16)} ${"─".repeat(16)} ${"─".repeat(8)} ${"─".repeat(10)}`);

      for (let i = 0; i < ALL_OPERATORS.length; i++) {
        const s = ALL_OPERATORS[i];
        const num = padRight(String(i + 1), 4);
        const name = padRight(s.name, 28);
        const author = padRight(s.author.slice(0, 15), 16);
        const cat = padRight(s.category, 16);
        const rep = padRight(`${s.quality}/100`, 8);
        add("table-row", `  ${num} ${name} ${author} ${cat} ${rep} ${s.status}`);
      }

      add("blank", "");
      add("success", `  [OK] ${ALL_OPERATORS.length} operators loaded`);
      add("blank", "");
      break;
    }

    /* ── VALIDATE ──────────────────────────────────────────────────── */
    case "validate": {
      const operatorName = args.find((a) => !a.startsWith("--"));
      const stakeIdx = args.indexOf("--stake");
      const stakeAmt = stakeIdx !== -1 ? parseInt(args[stakeIdx + 1] || "500") : 500;

      if (!operatorName) {
        add("error", "  Error: Missing operator name");
        add("dim", "  Usage: validate <operator-name> --stake <amount>");
        break;
      }

      const operator = findOperator(operatorName);
      if (!operator) {
        add("error", `  Error: Operator "${operatorName}" not found`);
        break;
      }

      add("output", `  Initiating validation for ${operator.name}...`);
      add("output", `  Staking ${stakeAmt.toLocaleString()} $AEGIS as validator bond`);
      add("output", `  Running automated quality checks...`);
      add("blank", "");
      add("success", `  [OK] Schema validation passed`);
      add("success", `  [OK] Endpoint reachability confirmed`);
      add("success", `  [OK] Response format validated`);
      add("success", `  [OK] Latency check: ${(Math.random() * 200 + 50).toFixed(0)}ms (within threshold)`);
      add("success", `  [OK] Security scan: No vulnerabilities detected`);
      add("blank", "");
      add("success", `  [OK] Validation complete  -  attestation recorded on-chain`);
      add("split-detail", `    Validator: ${wallet.address}`);
      add("split-detail", `    Bond: ${stakeAmt.toLocaleString()} $AEGIS`);
      add("split-detail", `    Operator: ${operator.name} (${operator.namespace})`);
      add("split-detail", `    Tx: ${randomTxHash()}`);
      add("blank", "");
      add("dim", `  You will earn 15% of all future invocation revenue for ${operator.name}`);
      add("blank", "");
      break;
    }

    /* ── SANDBOX ───────────────────────────────────────────────────── */
    case "sandbox": {
      const operatorName = args.find((a) => !a.startsWith("--"));
      if (!operatorName) {
        add("error", "  Error: Missing operator name");
        add("dim", "  Usage: sandbox <operator-name>");
        break;
      }

      const operator = findOperator(operatorName);
      if (!operator) {
        add("error", `  Error: Operator "${operatorName}" not found`);
        break;
      }

      const isSecurityOperator = operator.category === "Security" || operator.tags.some(t => t.toLowerCase().includes("audit") || t.toLowerCase().includes("security"));
      const needsNet = true;
      const needsRead = true;
      const needsWrite = isSecurityOperator;

      add("blank", "");
      add("header", `  DENO SANDBOX PROFILE: ${operator.name}`);
      add("divider", "  ────────────────────────────────────────────────────");
      add("output", `  Runtime:      Deno isolate v1.40`);
      add("output", `  Mode:         ${isSecurityOperator ? "relaxed (security tool)" : "strict (default)"}`);
      add("blank", "");
      add("header", "  PERMISSION GRANTS");
      add("divider", "  ────────────────────────────────────────────────────");
      add("success", `  [ALLOW]  --allow-net=api.openai.com,api.anthropic.com`);
      add("success", `  [ALLOW]  --allow-read=./input`);
      if (needsWrite) {
        add("warning", `  [ALLOW]  --allow-write=./output  (security tool requires output)`);
      } else {
        add("result", `  [DENY]   --deny-write`);
      }
      add("result", `  [DENY]   --deny-env`);
      add("result", `  [DENY]   --deny-run`);
      add("blank", "");
      add("header", "  RESOURCE LIMITS");
      add("divider", "  ────────────────────────────────────────────────────");
      add("result", `  Max Memory:   256 MB`);
      add("result", `  Max Time:     30s`);
      add("result", `  Max Net Reqs: 50`);
      add("result", `  Max File I/O: 10 MB`);
      add("blank", "");
      add("dim", `  Permissions declared in OPERATOR.md aegis.sandbox block`);
      add("dim", `  Override with: invoke ${operator.name} --sandbox relaxed`);
      add("blank", "");
      break;
    }

    /* ── TRACE ─────────────────────────────────────────────────────── */
    case "trace": {
      const operatorName = args.find((a) => !a.startsWith("--"));
      if (!operatorName) {
        add("error", "  Error: Missing operator name");
        add("dim", "  Usage: trace <operator-name>");
        break;
      }

      const operator = findOperator(operatorName);
      if (!operator) {
        add("error", `  Error: Operator "${operatorName}" not found`);
        break;
      }

      const traceId = `tr_${randomTxHash()}`;
      const latency = (Math.random() * 1500 + 200).toFixed(0);
      const netLatency = (Math.random() * 800 + 100).toFixed(0);

      add("blank", "");
      add("header", `  OBSERVATION LOOP TRACE: ${traceId}`);
      add("divider", "  ────────────────────────────────────────────────────");
      add("result", `  Operator:        ${operator.name} v${operator.versions[0]?.version || "1.0.0"}`);
      add("result", `  Invocation:   ${new Date().toISOString()}`);
      add("result", `  Sandbox:      Deno isolate v1.40 (strict mode)`);
      add("blank", "");
      add("header", "  EXECUTION TIMELINE");
      add("divider", "  ────────────────────────────────────────────────────");
      add("dim",     `  [T+0ms]       Input received: request payload (${(Math.random() * 5000 + 500).toFixed(0)} bytes)`);
      add("dim",     `  [T+8ms]       Sandbox started: Deno isolate, --allow-net=api.openai.com`);
      add("dim",     `  [T+12ms]      Permission check: --allow-net GRANTED`);
      add("dim",     `  [T+15ms]      Permission check: --deny-write ENFORCED`);
      add("dim",     `  [T+${netLatency}ms]     Network call: POST api.openai.com/v1/chat/completions`);
      add("success", `  [T+${latency}ms]    Response received: 200 OK (${(Math.random() * 8000 + 1000).toFixed(0)} bytes)`);
      add("success", `  [T+${(parseInt(latency) + 5).toString()}ms]    Output generated: ${(Math.random() * 4000 + 500).toFixed(0)} bytes`);
      add("dim",     `  [T+${(parseInt(latency) + 8).toString()}ms]    Sandbox terminated: exit code 0`);
      add("blank", "");
      add("header", "  ATTESTATION");
      add("divider", "  ────────────────────────────────────────────────────");
      add("result", `  Validator:     ${randomAddr()} (${operator.validatorList[0]?.tier || "Journeyman"})`);
      add("result", `  Attestation:   PASS`);
      add("result", `  Bond at risk:  ${operator.validatorList[0]?.bond?.toLocaleString() || "5,000"} $AEGIS`);
      add("result", `  Merkle root:   0x${randomTxHash()}${randomTxHash()}`);
      add("blank", "");
      add("dim", `  Trace stored on-chain as compressed Merkle proof`);
      add("dim", `  Replay: agent-aegis trace ${traceId} --replay`);
      add("blank", "");
      break;
    }

    /* ── CLEARANCE ─────────────────────────────────────────────────── */
    case "clearance": {
      const operatorName = args.find((a) => !a.startsWith("--"));
      const missionIdx = args.indexOf("--mission");
      const mission = missionIdx !== -1 ? args[missionIdx + 1] || "general" : "general";

      if (!operatorName) {
        add("error", "  Error: Missing operator name");
        add("dim", "  Usage: clearance <operator-name> [--mission general|defi|security|content|trading]");
        break;
      }

      const operator = findOperator(operatorName);
      if (!operator) {
        add("error", `  Error: Operator "${operatorName}" not found`);
        break;
      }

      const missionWeights: Record<string, Record<string, number>> = {
        general: { ops: 25, ver: 20, rec: 20, net: 15, eco: 12, ecr: 8 },
        defi: { ops: 30, eco: 25, ver: 20, rec: 15, net: 5, ecr: 5 },
        security: { ver: 30, rec: 25, ops: 20, eco: 15, net: 5, ecr: 5 },
        content: { net: 30, ops: 25, ecr: 20, rec: 15, ver: 5, eco: 5 },
        trading: { ops: 30, eco: 20, rec: 20, ver: 15, net: 10, ecr: 5 },
      };

      const w = missionWeights[mission] || missionWeights.general;
      const rep = operator.quality;
      const age = Math.max(1, Math.floor((Date.now() - new Date(operator.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
      const successRate2 = operator.recentInvocations.length > 0
        ? operator.recentInvocations.filter(i => i.status === "completed").length / operator.recentInvocations.length
        : 0.5;

      const pillarScores = {
        ops: Math.min(100, Math.round(rep * 0.6 + successRate2 * 40)),
        ver: Math.min(100, Math.round(operator.validators >= 5 ? 88 + Math.random() * 10 : 55 + Math.random() * 20)),
        rec: Math.min(100, Math.round(Math.min(age / 30, 1) * 40 + Math.min(operator.invocations / 5000, 1) * 60)),
        net: Math.min(100, Math.round(operator.stars / 50 + operator.reviews.length * 8)),
        eco: Math.min(100, Math.round(parseInt(operator.bond.replace(/[^0-9]/g, "")) / 200 + operator.validatorList.reduce((s, v) => s + v.bond, 0) / 500)),
        ecr: Math.min(100, Math.round(operator.compatibility.length * 12 + operator.tags.length * 3)),
      };

      const composite = Math.round(
        Object.entries(w).reduce((sum, [key, weight]) => sum + (pillarScores[key as keyof typeof pillarScores] || 0) * (weight / 100), 0)
      );

      const level = composite >= 90 ? "ALPHA" : composite >= 75 ? "BRAVO" : composite >= 60 ? "CHARLIE" : composite >= 40 ? "DELTA" : "FOXTROT";
      const cleared = composite >= 60;

      add("blank", "");
      add("header", `  ┌─────────────────────────────────────────────────────────┐`);
      add("header", `  │  THREAT ASSESSMENT: ${padRight(operator.name, 37)}│`);
      add("header", `  │  Mission Profile: ${padRight(mission.toUpperCase(), 38)}│`);
      add("header", `  └─────────────────────────────────────────────────────────┘`);
      add("blank", "");

      add("output", "  Running 6-pillar threat assessment...");
      add("blank", "");

      const pillarNames: Record<string, string> = {
        ops: "Operational Readiness",
        ver: "Verification Clearance",
        rec: "Combat Record",
        net: "Network Attestation",
        eco: "Economic Stake",
        ecr: "Ecosystem Reach",
      };

      add("header", `  ${padRight("PILLAR", 26)} ${padRight("SCORE", 10)} ${padRight("WEIGHT", 10)} ${padRight("CONTRIBUTION", 14)}`);
      add("divider", `  ${"─".repeat(26)} ${"─".repeat(10)} ${"─".repeat(10)} ${"─".repeat(14)}`);

      for (const [key, weight] of Object.entries(w)) {
        const score = pillarScores[key as keyof typeof pillarScores] || 0;
        const contribution = (score * weight / 100).toFixed(1);
        const bar = "█".repeat(Math.round(score / 5)) + "░".repeat(20 - Math.round(score / 5));
        add("table-row", `  ${padRight(pillarNames[key] || key, 26)} ${padRight(`${score}/100`, 10)} ${padRight(`${weight}%`, 10)} ${padRight(`+${contribution}`, 14)}`);
      }

      add("blank", "");
      add("divider", "  ────────────────────────────────────────────────────");
      add(cleared ? "success" : "error", `  COMPOSITE SCORE: ${composite}/100`);
      add(cleared ? "success" : "error", `  CLEARANCE LEVEL: ${level}`);
      add(cleared ? "success" : "error", `  DECISION: ${cleared ? "CLEARED FOR DEPLOYMENT" : "CLEARANCE DENIED"}`);
      add("blank", "");

      if (cleared) {
        add("dim", `  This operator is cleared for ${mission} operations.`);
        add("dim", `  Recommended: Deploy autonomously with observation loop monitoring.`);
      } else {
        add("warning", `  This operator does not meet minimum clearance threshold (60/100).`);
        add("dim", `  Recommended: Increase validator bonds, build invocation history.`);
      }

      add("blank", "");
      add("dim", `  API: POST /v1/clearance { "operator": "${operator.namespace}/${operator.name}", "mission": "${mission}" }`);
      add("blank", "");
      break;
    }

    /* ── CHALLENGE ─────────────────────────────────────────────────── */
    case "challenge": {
      const operatorName = args.find((a) => !a.startsWith("--"));
      const stakeIdx = args.indexOf("--stake");
      const stakeAmt = stakeIdx !== -1 ? parseInt(args[stakeIdx + 1] || "500") : 500;

      if (!operatorName) {
        add("error", "  Error: Missing operator name");
        add("dim", "  Usage: challenge <operator-name> --stake <amount>");
        break;
      }

      const operator = findOperator(operatorName);
      if (!operator) {
        add("error", `  Error: Operator "${operatorName}" not found`);
        break;
      }

      add("output", `  Initiating prediction market challenge for ${operator.name}...`);
      add("output", `  Staking ${stakeAmt.toLocaleString()} $AEGIS as challenge bond`);
      add("blank", "");
      add("warning", `  [!] Challenge created  -  dispute period: 72 hours`);
      add("output", `  Market ID: PM-${Math.floor(Math.random() * 90000 + 10000)}`);
      add("output", `  Challenge bond: ${stakeAmt.toLocaleString()} $AEGIS`);
      add("output", `  Creator bond at risk: ${operator.bond}`);
      add("output", `  Validator bonds at risk: ${operator.validators} validators`);
      add("blank", "");
      add("dim", "  The market will resolve via stake-weighted voting.");
      add("dim", "  If the challenge succeeds, the creator's bond is slashed and distributed to challengers.");
      add("dim", "  If the challenge fails, your stake is forfeited to the creator.");
      add("blank", "");
      break;
    }

    /* ── MCP-SERVER ─────────────────────────────────────────────── */
    case "mcp-server": {
      const hasStop = args.includes("--stop");
      const portIdx = args.indexOf("--port");
      const port = portIdx !== -1 ? args[portIdx + 1] || "3847" : "3847";

      if (hasStop) {
        add("output", "  Stopping MCP server...");
        add("success", "  [OK] MCP server stopped");
        add("blank", "");
        break;
      }

      add("blank", "");
      add("output", `  Starting Aegis MCP server on localhost:${port}...`);
      add("success", "  [OK] MCP server initialized");
      add("success", `  [OK] 82,074 operators registered as MCP tools`);
      add("success", "  [OK] x402 payment handler active");
      add("success", "  [OK] Health monitoring enabled");
      add("blank", "");
      add("header", "  COMPATIBLE PLATFORMS");
      add("divider", "  ────────────────────────────────────────────────────");
      add("result", "  MCP Client        MCP native     ~/.config/mcp/servers.json");
      add("result", "  MCP Workspace      MCP native     Multi-agent collaboration");
      add("result", "  AegisX Remote MCP native     Mobile monitoring");
      add("result", "  Codex CLI          MCP / HTTP     codex --mcp-server");
      add("result", "  Codex App          MCP / HTTP     Multi-agent worktrees");
      add("result", "  ChatGPT            MCP native     GPT-4.1 tool discovery");
      add("result", "  Cursor             MCP native     IDE integration");
      add("result", "  Windsurf           MCP native     IDE integration");
      add("blank", "");
      add("dim", `  MCP endpoint: http://localhost:${port}`);
      add("dim", "  Add to MCP Client: echo '{\"aegis\":{\"command\":\"aegis\",\"args\":[\"mcp-server\"]}}' >> ~/.config/mcp/servers.json");
      add("dim", "  Connect Codex CLI:  codex --mcp-server http://localhost:" + port);
      add("blank", "");
      break;
    }

    /* ── CONNECT ───────────────────────────────────────────────────── */
    case "connect": {
      const platform = args[0]?.toLowerCase() || "";

      const platforms: Record<string, { name: string; method: string; steps: string[] }> = {
        "mcp-client": {
          name: "MCP Client",
          method: "MCP Server",
          steps: [
            "Writing MCP config to ~/.config/mcp/servers.json...",
            "Registering Aegis operator discovery endpoint...",
            "Configuring x402 payment handler with wallet " + wallet.address + "...",
            "Testing connection to MCP Client...",
          ],
        },
        "mcp-workspace": {
          name: "MCP Workspace",
          method: "MCP Server (Multi-Agent)",
          steps: [
            "Initializing multi-agent MCP bridge...",
            "Registering shared operator context for Cowork sessions...",
            "Configuring collaborative x402 payment splitting...",
            "Testing Cowork handshake...",
          ],
        },
        "mcp-remote": {
          name: "MCP Remote",
          method: "MCP + Mobile Bridge",
          steps: [
            "Generating remote session token...",
            "Registering mobile monitoring endpoint...",
            "Configuring push notifications for invocation events...",
            "Testing remote bridge...",
          ],
        },
        "codex-cli": {
          name: "Codex CLI",
          method: "MCP Server / HTTP x402",
          steps: [
            "Starting local MCP server on port 3847...",
            "Registering Aegis tools with Codex runtime...",
            "Configuring x402 direct payment for HTTP invocations...",
            "Testing Codex CLI connection...",
          ],
        },
        "codex-app": {
          name: "Codex App",
          method: "MCP Server (Multi-Worktree)",
          steps: [
            "Initializing multi-worktree MCP bridge...",
            "Registering parallel operator invocation handlers...",
            "Configuring x402 batch payment for concurrent tasks...",
            "Testing Codex App integration...",
          ],
        },
        "chatgpt": {
          name: "ChatGPT",
          method: "MCP Native",
          steps: [
            "Registering Aegis as MCP tool provider...",
            "Configuring GPT-4.1 tool discovery...",
            "Setting up x402 payment handler...",
            "Testing ChatGPT connection...",
          ],
        },
        "cursor": {
          name: "Cursor",
          method: "MCP Native (IDE)",
          steps: [
            "Writing MCP config to .cursor/mcp.json...",
            "Registering Aegis operators as IDE tools...",
            "Configuring inline x402 payment prompts...",
            "Testing Cursor integration...",
          ],
        },
      };

      if (!platform || !platforms[platform]) {
        add("blank", "");
        add("header", "  AVAILABLE PLATFORMS");
        add("divider", "  ────────────────────────────────────────────────────");
        add("result", "  connect mcp-client      Connect to MCP Client");
        add("result", "  connect mcp-workspace    Connect to MCP Workspace");
        add("result", "  connect mcp-remote    Connect to MCP Remote");
        add("result", "  connect codex-cli        Connect to OpenAI Codex CLI");
        add("result", "  connect codex-app        Connect to OpenAI Codex App");
        add("result", "  connect chatgpt          Connect to ChatGPT");
        add("result", "  connect cursor           Connect to Cursor IDE");
        add("blank", "");
        add("dim", "  Usage: connect <platform>");
        add("blank", "");
        break;
      }

      const p = platforms[platform];
      add("blank", "");
      add("output", `  Connecting to ${p.name} via ${p.method}...`);
      add("blank", "");

      for (const step of p.steps) {
        add("output", `  ${step}`);
        add("success", `  [OK] Done`);
      }

      add("blank", "");
      add("success", `  [OK] ${p.name} connected successfully`);
      add("success", `  [OK] 82,074 Aegis operators now available as tools`);
      add("success", `  [OK] x402 payments will use wallet ${wallet.address}`);
      add("blank", "");
      add("dim", `  Operators appear as tools in ${p.name}. Example:`);
      add("dim", `  "Use the code-review-agent operator to audit my main.go file"`);
      add("dim", `  ${p.name} discovers it via MCP, pays via x402, returns result.`);
      add("blank", "");
      break;
    }

    /* ── DELEGATE ──────────────────────────────────────────────────── */
    case "delegate": {
      const operatorNames = args.filter((a) => !a.startsWith("--"));

      if (operatorNames.length < 2) {
        add("error", "  Error: Delegate requires at least 2 operators");
        add("dim", "  Usage: delegate <operator1> <operator2> [operator3...]");
        add("dim", '  Example: delegate pdf-extract-pro entity-extract text-summarize');
        add("blank", "");
        break;
      }

      const operators = operatorNames.map((n) => findOperator(n)).filter(Boolean) as Operator[];
      const notFound = operatorNames.filter((n) => !findOperator(n));

      if (notFound.length > 0) {
        add("warning", `  Warning: Operators not found: ${notFound.join(", ")}`);
        add("dim", "  Continuing with found operators...");
      }

      if (operators.length < 2) {
        add("error", "  Error: Need at least 2 valid operators for delegation");
        add("blank", "");
        break;
      }

      add("blank", "");
      add("header", "  TASK DELEGATION PIPELINE");
      add("divider", "  ────────────────────────────────────────────────────");
      add("output", `  Building ${operators.length}-step pipeline...`);
      add("blank", "");

      let totalCost = 0;
      const receipts: string[] = [];

      for (let i = 0; i < operators.length; i++) {
        const s = operators[i];
        const usdcCost = s.price / 1_000_000_000 * 170;
        totalCost += usdcCost;
        const receipt = randomTxHash();
        receipts.push(receipt);
        const duration = (Math.random() * 1.5 + 0.3).toFixed(1);

        add("header", `  STEP ${i + 1}/${operators.length}: ${s.name}`);
        add("output", `  HTTP 402 -> $${usdcCost.toFixed(4)} USDC via x402`);
        add("output", `  Input: ${i === 0 ? "<user_input>" : `$prev.output (Step ${i})`}`);
        add("output", `  Sandbox: Deno isolate (strict)`);
        add("success", `  [OK] Completed in ${duration}s | Receipt: ${receipt}`);
        if (i < operators.length - 1) add("dim", `  Piping output to Step ${i + 2}...`);
        add("blank", "");
      }

      add("header", "  PIPELINE SUMMARY");
      add("divider", "  ────────────────────────────────────────────────────");
      add("success", `  Steps completed:  ${operators.length}/${operators.length}`);
      add("success", `  Total cost:       $${totalCost.toFixed(4)} USDC`);
      add("result", `  Receipts:         ${receipts.length} cNFTs minted`);
      for (const r of receipts) {
        add("dim", `    -> ${r}`);
      }
      add("blank", "");
      add("dim", "  Each step settled independently on Solana. Full audit trail available.");
      add("dim", `  Replay: agent-aegis trace --pipeline ${receipts[0]}`);
      add("blank", "");

      setWallet((prev) => ({
        ...prev,
        usdc: Math.max(0, prev.usdc - totalCost),
        invocations: prev.invocations + operators.length,
        quality: Math.min(100, prev.quality + operators.length),
        tier: prev.invocations + operators.length >= 50 ? "Gold" : prev.invocations + operators.length >= 10 ? "Silver" : prev.invocations + operators.length >= 3 ? "Bronze" : "Unranked",
      }));

      break;
    }

    /* ── SWARM ──────────────────────────────────────────────────── */
    case "swarm": {
      const category = args.find((a) => !a.startsWith("--")) || "llm_research";
      const agentIdx = args.indexOf("--agents");
      const agentCount = agentIdx !== -1 ? parseInt(args[agentIdx + 1] || "6") : 6;
      const budgetIdx = args.indexOf("--budget");
      const budget = budgetIdx !== -1 ? parseFloat(args[budgetIdx + 1] || "2.0") : 2.0;

      add("blank", "");
      add("output", `  Initializing autonomous research swarm...`);
      add("output", `  Category: ${category} | Agents: ${agentCount} | Budget: ${budget} $AEGIS`);
      add("blank", "");

      // Discover agents
      add("output", `  Discovering operators for "${category}"...`);
      const swarmOps = searchOperators(category.replace("_", " ")).slice(0, agentCount);
      if (swarmOps.length === 0) {
        const fallback = ALL_OPERATORS.slice(0, agentCount);
        swarmOps.push(...fallback);
      }

      add("success", `  [OK] ${swarmOps.length} operators recruited`);
      add("blank", "");

      add("header", `  ${padRight("AGENT", 24)} ${padRight("ROLE", 28)} ${padRight("GPU", 12)} ${padRight("STATUS", 10)}`);
      add("divider", `  ${"─".repeat(24)} ${"─".repeat(28)} ${"─".repeat(12)} ${"─".repeat(10)}`);

      const roles = ["attention variants", "MLP architecture", "optimizer search", "regularization", "embedding strategies", "depth/width scaling", "activation functions", "normalization methods"];
      const gpus = ["H100-80GB", "A100-80GB", "H100-SXM", "A100-40GB", "H200-141GB", "L40S-48GB"];

      swarmOps.forEach((op, i) => {
        const name = padRight(`swarm-${op.slug.slice(0, 16)}`, 24);
        const role = padRight(roles[i % roles.length], 28);
        const gpu = padRight(gpus[i % gpus.length], 12);
        add("table-row", `  ${name} ${role} ${gpu} READY`);
      });

      add("blank", "");
      add("output", "  Configuring swarm coordination...");
      add("success", "  [OK] Explore-diverse strategy enabled");
      add("success", "  [OK] Validator consensus merge configured");
      add("success", "  [OK] x402 per-experiment payment active");
      add("blank", "");

      // Simulate experiments
      add("header", "  LAUNCHING SWARM");
      add("divider", "  ────────────────────────────────────────────────────");
      add("blank", "");

      let bestBpb = 0.998;
      const experiments = 12;
      for (let i = 0; i < experiments; i++) {
        const agent = swarmOps[i % swarmOps.length];
        const isKeep = Math.random() > 0.4;
        const delta = isKeep ? -(Math.random() * 0.006 + 0.001) : (Math.random() * 0.01);
        const bpb = Math.max(0.92, bestBpb + delta);
        if (isKeep) bestBpb = bpb;
        const status = isKeep ? "KEEP" : "DISCARD";
        const chars = "0123456789abcdef";
        let commit = "";
        for (let j = 0; j < 7; j++) commit += chars[Math.floor(Math.random() * chars.length)];

        const expLine = `  [${String(i + 1).padStart(2, "0")}] ${padRight(agent.name.slice(0, 18), 20)} val_bpb=${bpb.toFixed(6)}  ${commit}  ${status}`;
        add(isKeep ? "success" : "dim", expLine);
      }

      add("blank", "");
      add("header", "  SWARM RESULTS");
      add("divider", "  ────────────────────────────────────────────────────");
      add("success", `  Best val_bpb:      ${bestBpb.toFixed(6)}`);
      add("result", `  Total experiments:  ${experiments}`);
      add("result", `  Agents deployed:   ${swarmOps.length}`);
      add("result", `  Cost:              ${(experiments * 0.002).toFixed(4)} $AEGIS`);
      add("result", `  Duration:          ${experiments * 5} minutes`);
      add("blank", "");
      add("dim", "  All results verified by validator consensus.");
      add("dim", "  Best architecture committed to on-chain registry.");
      add("dim", `  Receipt: aegis://swarm/${randomTxHash()}`);
      add("blank", "");
      add("dim", "  \"Research is now entirely the domain of autonomous swarms\"");
      add("dim", "  Swarm coordination powered by Aegis Protocol.");
      add("blank", "");

      const cost = experiments * 0.002;
      setWallet((prev) => ({
        ...prev,
        aegis: Math.max(0, prev.aegis - cost),
        invocations: prev.invocations + experiments,
        quality: Math.min(100, prev.quality + 5),
      }));

      break;
    }

    /* ── EVOLVE ─────────────────────────────────────────────────────── */
    case "evolve": {
      const operatorName = args.find((a) => !a.startsWith("--"));
      const cyclesIdx = args.indexOf("--cycles");
      const cycles = cyclesIdx !== -1 ? parseInt(args[cyclesIdx + 1] || "25") : 25;

      if (!operatorName) {
        add("error", "  Error: Missing operator name");
        add("dim", "  Usage: evolve <operator-name> [--cycles N]");
        add("dim", "  Example: evolve code-review-agent --cycles 25");
        add("blank", "");
        break;
      }

      const operator = findOperator(operatorName);
      if (!operator) {
        add("error", `  Error: Operator "${operatorName}" not found`);
        add("dim", "  Try: ls to see available operators");
        add("blank", "");
        break;
      }

      add("blank", "");
      add("header", `  ┌─────────────────────────────────────────────────────────┐`);
      add("header", `  │  EVOLUTION ENGINE: ${padRight(operator.name, 37)}│`);
      add("header", `  │  Cycles: ${padRight(String(cycles), 47)}│`);
      add("header", `  └─────────────────────────────────────────────────────────┘`);
      add("blank", "");
      add("output", "  Initializing 6-axis evolution engine...");
      add("blank", "");

      // Initial state
      const axes = [
        { key: "SPECIALIZE", start: 34, unit: "%" },
        { key: "LEARN",      start: 12, unit: "ops/hr" },
        { key: "EQUIP",      start: 3,  unit: "tools" },
        { key: "EARN",       start: 0.002, unit: "SOL/hr" },
        { key: "NETWORK",    start: 2,  unit: "peers" },
        { key: "HARDEN",     start: 87, unit: "%" },
      ];

      add("header", `  ${padRight("AXIS", 16)} ${padRight("INITIAL", 14)} ${padRight("UNIT", 12)}`);
      add("divider", `  ${"─".repeat(16)} ${"─".repeat(14)} ${"─".repeat(12)}`);
      for (const a of axes) {
        add("dim", `  ${padRight(a.key, 16)} ${padRight(String(a.start), 14)} ${padRight(a.unit, 12)}`);
      }
      add("blank", "");

      // Simulate evolution cycles
      add("header", "  EVOLUTION LOG");
      add("divider", "  ────────────────────────────────────────────────────");

      const events = [
        { cycle: 1, msg: "Deployed with base capabilities", type: "output" as const },
        { cycle: 3, msg: "First 50 missions completed. Feedback loop activated", type: "success" as const },
        { cycle: 5, msg: `Specialization detected: ${operator.tags[0] || operator.category} focus`, type: "success" as const },
        { cycle: 8, msg: `Tool discovered: ${operator.tags[1] || "api-integration"} module added`, type: "success" as const },
        { cycle: 10, msg: "Failure on edge case. Hardening triggered", type: "warning" as const },
        { cycle: 12, msg: "Peer insight absorbed from attestation network", type: "success" as const },
        { cycle: 15, msg: "Revenue threshold crossed: premium tier unlocked", type: "success" as const },
        { cycle: 18, msg: "Learning milestone: strategy v2 documented", type: "success" as const },
        { cycle: 20, msg: "Second failure. Fallback strategy added. Bond increased", type: "warning" as const },
        { cycle: 22, msg: `500 missions completed. ${operator.category} mastery achieved`, type: "success" as const },
        { cycle: 25, msg: "Autonomous evolution: operator now outperforms human baseline", type: "success" as const },
      ];

      for (const evt of events.filter(e => e.cycle <= cycles)) {
        add(evt.type, `  [Cycle ${String(evt.cycle).padStart(2, " ")}] ${evt.msg}`);
      }

      add("blank", "");

      // Final state
      const finalAxes = [
        { key: "SPECIALIZE", val: 91, unit: "%" },
        { key: "LEARN",      val: 67, unit: "ops/hr" },
        { key: "EQUIP",      val: 18, unit: "tools" },
        { key: "EARN",       val: 0.089, unit: "SOL/hr" },
        { key: "NETWORK",    val: 47, unit: "peers" },
        { key: "HARDEN",     val: 99.7, unit: "%" },
      ];

      add("header", "  FINAL STATE (Post-Evolution)");
      add("divider", "  ────────────────────────────────────────────────────");
      add("header", `  ${padRight("AXIS", 16)} ${padRight("BEFORE", 12)} ${padRight("AFTER", 12)} ${padRight("DELTA", 14)}`);
      add("divider", `  ${"─".repeat(16)} ${"─".repeat(12)} ${"─".repeat(12)} ${"─".repeat(14)}`);

      for (let i = 0; i < axes.length; i++) {
        const a = axes[i];
        const f = finalAxes[i];
        const delta = f.val - a.start;
        const deltaStr = delta > 0 ? `+${typeof a.start === "number" && a.start < 1 ? delta.toFixed(3) : Math.round(delta)}` : String(Math.round(delta));
        add("success", `  ${padRight(a.key, 16)} ${padRight(String(a.start), 12)} ${padRight(String(f.val), 12)} ${padRight(deltaStr + " " + a.unit, 14)}`);
      }

      add("blank", "");
      add("header", "  SUMMARY");
      add("divider", "  ────────────────────────────────────────────────────");
      add("success", `  Revenue growth:    44.5x`);
      add("success", `  Tool arsenal:      6x expansion`);
      add("success", `  Uptime:            87% -> 99.7%`);
      add("success", `  Peer connections:  2 -> 47`);
      add("blank", "");
      add("dim", `  Evolution state committed to on-chain registry.`);
      add("dim", `  Tx: ${randomTxHash()}`);
      add("dim", `  Strategy document: aegis://evolve/${operator.slug}/v3`);
      add("blank", "");
      add("dim", '  "Operators do not just work. They evolve."');
      add("dim", "  Powered by the Aegis Evolution Engine.");
      add("blank", "");
      break;
    }

    /* ── PUBLISH ────────────────────────────────────────────────────── */
    case "publish": {
      const skillName = args.find((a) => !a.startsWith("--"));
      const priceIdx = args.indexOf("--price");
      const price = priceIdx !== -1 ? parseFloat(args[priceIdx + 1] || "0.001") : 0.001;
      const catIdx = args.indexOf("--category");
      const catIdx2 = args.indexOf("--cat");
      const category = (catIdx !== -1 ? args[catIdx + 1] : catIdx2 !== -1 ? args[catIdx2 + 1] : "General") || "General";

      if (!skillName) {
        add("error", "  Error: Missing skill name");
        add("dim", "  Usage: publish <skill-name> [--price <SOL>] [--category <cat>]");
        add("dim", '  Example: publish my-code-reviewer --price 0.002 --cat Security');
        add("blank", "");
        break;
      }

      add("blank", "");
      add("header", "  ┌─────────────────────────────────────────────────────────┐");
      add("header", `  │  SKILL MARKETPLACE: PUBLISH WIZARD                      │`);
      add("header", "  └─────────────────────────────────────────────────────────┘");
      add("blank", "");

      // Step 1: Validate
      add("output", "  STEP 1/3: VALIDATING SKILL PACKAGE");
      add("divider", "  ────────────────────────────────────────────────────");
      add("output", `  Scanning ${skillName}/...`);
      add("success", "  [OK] SKILL.md found. Description and usage docs present");
      add("success", "  [OK] handler.ts found. Entry point validated");
      add("success", "  [OK] test/ directory found. 12 test cases, all passing");
      add("success", "  [OK] aegis.sandbox block found. Permissions declared");
      add("success", "  [OK] No secrets or API keys detected in source");
      add("success", "  [OK] Package size: 24KB (under 1MB limit)");
      add("blank", "");

      // Step 2: Configure listing
      add("output", "  STEP 2/3: CONFIGURING MARKETPLACE LISTING");
      add("divider", "  ────────────────────────────────────────────────────");
      add("result", `  Name:           ${skillName}`);
      add("result", `  Category:       ${category}`);
      add("result", `  Price:          ${price} SOL per invocation`);
      add("result", `  Revenue split:  85% creator / 10% validators / 3% treasury / 1.5% insurance / 0.5% burned`);
      add("result", `  Creator:        ${wallet.address}`);
      add("result", `  License:        MIT (default)`);
      add("result", `  Composable:     Yes (other skills can chain into this)`);
      add("blank", "");

      // Step 3: Deploy
      add("output", "  STEP 3/3: DEPLOYING TO MARKETPLACE");
      add("divider", "  ────────────────────────────────────────────────────");
      add("output", "  Uploading skill package to IPFS...");
      add("success", `  [OK] IPFS CID: Qm${randomTxHash()}${randomTxHash()}`);
      add("output", "  Registering on Solana...");
      add("success", `  [OK] Program deployed: ${randomTxHash()}`);
      add("output", "  Creating marketplace listing...");
      add("success", "  [OK] Listing live on Aegis Skill Marketplace");
      add("output", "  Requesting initial validation...");
      add("success", "  [OK] 3 validators assigned. Review period: 24 hours");
      add("blank", "");

      // Summary
      add("header", "  PUBLISH COMPLETE");
      add("divider", "  ────────────────────────────────────────────────────");
      add("success", `  Your skill "${skillName}" is now live on the marketplace.`);
      add("success", `  Every time another agent uses it, you earn ${price} SOL.`);
      add("blank", "");
      add("result", `  Marketplace URL:  aegis.market/${skillName}`);
      add("result", `  Dashboard:        /skill-marketplace (Creator Dashboard tab)`);
      add("result", `  Earnings wallet:  ${wallet.address}`);
      add("blank", "");
      add("dim", "  Revenue is streamed to your wallet in real time via x402.");
      add("dim", "  Validators will review your skill within 24 hours.");
      add("dim", "  Once approved, your skill gets a success rate and appears in search.");
      add("blank", "");
      add("dim", '  "Build once. Earn every time an agent uses it."');
      add("dim", "  Powered by the Aegis Skill Marketplace.");
      add("blank", "");
      break;
    }

    /* ── CLEAR ─────────────────────────────────────────────────────── */
    case "clear": {
      return [mkLine("blank", "__CLEAR__")];
    }

    /* ── UNKNOWN ───────────────────────────────────────────────────── */
    default: {
      add("error", `  Command not found: ${cmd}`);
      add("dim", "  Type 'help' for available commands");
      add("blank", "");
    }
  }

  return lines;
}

/* ── Main Component ──────────────────────────────────────────────────── */
export default function Playground() {
  const operatorsQuery = trpc.operator.list.useQuery({ limit: 200 });
  // Populate module-level ALL_OPERATORS from tRPC data
  const operatorsList = useMemo(() => {
    const ops = operatorsQuery.data?.operators ?? [];
    return ops.map(o => {
      const tags: string[] = (() => { try { return typeof o.tags === "string" ? JSON.parse(o.tags) : (o.tags ?? []); } catch { return []; } })();
      const priceNum = parseFloat(o.pricePerCall ?? "0.010");
      const creatorWallet = o.creatorWallet ?? "Unknown";
      return {
        id: o.slug,
        slug: o.slug,
        name: o.name,
        description: o.description ?? "",
        category: o.category,
        tags,
        pricePerCall: o.pricePerCall ?? "0.010",
        author: creatorWallet.slice(0, 8),
        tier: (o.qualityScore ?? 0) >= 90 ? "Elite" : (o.qualityScore ?? 0) >= 75 ? "Pro" : "Standard",
        invocations: o.totalInvocations ?? 0,
        successRate: o.totalInvocations ? ((o.successfulInvocations ?? 0) / o.totalInvocations * 100) : 100,
        avgLatencyMs: o.avgResponseMs ?? 1000,
        quality: o.qualityScore ?? 50,
        qualityScore: o.qualityScore ?? 50,
        priceDisplay: `$${priceNum.toFixed(3)} USDC`,
        validators: 3,
        status: o.isActive === false ? "inactive" : "active",
        price: Math.round(priceNum * 1_000_000_000 / 170),
        authorAddress: creatorWallet,
        namespace: o.category ?? "aegis",
        bond: "5,000 $AEGIS",
        avgScore: 4.2,
        license: "MIT",
        language: "TypeScript",
        compatibility: ["solana", "ethereum", "polygon"],
        createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: o.updatedAt ? new Date(o.updatedAt).toISOString() : new Date().toISOString(),
        versions: [{ version: "1.0.0", date: new Date().toISOString().slice(0, 10), changes: "Initial release" }],
        validatorList: [
          { address: randomAddr(), tier: "Journeyman", bond: 5000, score: 4.5, reviews: 12 },
          { address: randomAddr(), tier: "Sentinel", bond: 10000, score: 4.8, reviews: 28 },
        ],
        repo: `aegis-protocol/${o.slug}`,
        recentInvocations: [
          { caller: randomAddr(), time: new Date().toISOString(), status: "completed" },
        ],
        stars: Math.floor(Math.random() * 200) + 10,
        reviews: [{ rating: 4, text: "Great operator" }],
      } satisfies Operator;
    });
  }, [operatorsQuery.data]);
  ALL_OPERATORS = operatorsList;

  const [wallet, setWallet] = useState<WalletState>({ ...INITIAL_WALLET });
  const [lines, setLines] = useState<TermLine[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [booted, setBooted] = useState(false);
  const [bootStep, setBootStep] = useState(0);

  // Real API invocation mutation (fires alongside the simulated terminal output)
  const invokeExecute = trpc.invoke.execute.useMutation({
    onSuccess: (data) => {
      const resultLine = mkLine("success", `  [DB] Invocation recorded: trust ${data.validation.trustDelta > 0 ? "+" : ""}${data.validation.trustDelta} | new score: ${data.validation.newTrustScore}`);
      setLines(prev => [...prev, resultLine]);
    },
    onError: () => {
      // Silently ignore API errors in playground mode
    },
  });

  // Fetch real operator list for the status command
  const { data: realStats } = trpc.stats.overview.useQuery(undefined, { staleTime: 30000 });
  const { data: realOperatorData } = trpc.operator.list.useQuery({ limit: 10, sortBy: "trust" }, { staleTime: 30000 });

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Boot sequence
  const BOOT_LINES: TermLine[] = [
    mkLine("ascii", ""),
    mkLine("ascii", "  ╔══════════════════════════════════════════════════════════╗"),
    mkLine("ascii", "  ║            AGENT AEGIS PLAYGROUND v0.9.1                ║"),
    mkLine("ascii", "  ║         The Economic Layer for AI Agent Operators          ║"),
    mkLine("ascii", "  ╚══════════════════════════════════════════════════════════╝"),
    mkLine("blank", ""),
    mkLine("output", "  Initializing Agent Aegis runtime..."),
    mkLine("success", "  [OK] Solana wallet generated: 7xKp3nVq...R4mW8tQ"),
    mkLine("success", "  [OK] Connected to Solana devnet"),
    mkLine("success", "  [OK] x402 payment gateway active"),
    mkLine("success", "  [OK] Aegis Index loaded: 82,074 operators"),
    mkLine("success", "  [OK] Deno sandbox runtime ready"),
    mkLine("success", "  [OK] Jupiter swap route cached"),
    mkLine("success", "  [OK] MCP server ready (MCP Client, Codex CLI, ChatGPT)"),
    mkLine("blank", ""),
    mkLine("balance", "  SOL: 2.000  |  USDC: 25.00  |  $AEGIS: 0.00"),
    mkLine("blank", ""),
    mkLine("dim", "  Type 'help' for commands or try one of the suggestions below."),
    mkLine("dim", "  New: 'mcp-server', 'connect', and 'delegate' commands available."),
    mkLine("dim", "  This is a simulation  -  no real transactions are made."),
    mkLine("blank", ""),
  ];

  useEffect(() => {
    if (booted) return;
    if (bootStep >= BOOT_LINES.length) {
      setBooted(true);
      return;
    }
    const delay = bootStep < 6 ? 60 : bootStep < 12 ? 100 : 50;
    const timer = setTimeout(() => {
      setLines((prev) => [...prev, BOOT_LINES[bootStep]]);
      setBootStep((s) => s + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [bootStep, booted]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input on click
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!booted) return;
      const cmd = input.trim();
      if (!cmd) return;

      // Add prompt line
      const promptLine = mkLine("prompt", `$ ${cmd}`);
      const result = processCommand(cmd, wallet, setWallet);

      // Check for clear
      if (result.length === 1 && result[0].text === "__CLEAR__") {
        setLines([]);
        setInput("");
        setHistory((prev) => [...prev, cmd]);
        setHistoryIdx(-1);
        return;
      }

      setLines((prev) => [...prev, promptLine, ...result]);
      setHistory((prev) => [...prev, cmd]);
      setHistoryIdx(-1);
      setInput("");

      // Fire real API invocation for invoke commands
      const parts = cmd.replace(/^agent-aegis\s+/, "").trim().split(/\s+/);
      if (parts[0] === "invoke" && parts[1]) {
        const opName = parts[1];
        const localOp = findOperator(opName);
        if (localOp && realOperatorData?.operators) {
          // Try to match to a real DB operator by name similarity
          const dbOp = realOperatorData.operators.find(
            (o) => o.name.toLowerCase().includes(opName.toLowerCase()) || o.slug.toLowerCase().includes(opName.toLowerCase())
          );
          if (dbOp) {
            invokeExecute.mutate({
              operatorId: dbOp.id,
              callerWallet: wallet.address,
              payload: { source: "playground", command: cmd },
            });
          }
        }
      }
    },
    [input, wallet, booted, realOperatorData, invokeExecute]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (history.length === 0) return;
        const newIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIdx === -1) return;
        const newIdx = historyIdx + 1;
        if (newIdx >= history.length) {
          setHistoryIdx(-1);
          setInput("");
        } else {
          setHistoryIdx(newIdx);
          setInput(history[newIdx]);
        }
      } else if (e.key === "Tab") {
        e.preventDefault();
        // Simple tab completion
        const partial = input.toLowerCase().trim();
        if (!partial) return;
        const cmds = ["search", "invoke", "inspect", "balance", "wallet", "status", "ls", "help", "clear", "validate", "challenge", "mcp-server", "connect", "delegate"];
        const match = cmds.find((c) => c.startsWith(partial));
        if (match) setInput(`agent-aegis ${match} `);
      }
    },
    [history, historyIdx, input]
  );

  const runSuggested = useCallback(
    (cmd: string) => {
      if (!booted) return;
      const promptLine = mkLine("prompt", `$ ${cmd}`);
      const result = processCommand(cmd, wallet, setWallet);
      setLines((prev) => [...prev, promptLine, ...result]);
      setHistory((prev) => [...prev, cmd]);
      focusInput();

      // Fire real API invocation for invoke commands
      const parts = cmd.replace(/^agent-aegis\s+/, "").trim().split(/\s+/);
      if (parts[0] === "invoke" && parts[1]) {
        const opName = parts[1];
        const localOp = findOperator(opName);
        if (localOp && realOperatorData?.operators) {
          const dbOp = realOperatorData.operators.find(
            (o) => o.name.toLowerCase().includes(opName.toLowerCase()) || o.slug.toLowerCase().includes(opName.toLowerCase())
          );
          if (dbOp) {
            invokeExecute.mutate({
              operatorId: dbOp.id,
              callerWallet: wallet.address,
              payload: { source: "playground", command: cmd },
            });
          }
        }
      }
    },
    [wallet, booted, focusInput, realOperatorData, invokeExecute]
  );

  const getColor = (type: TermLine["type"]) => {
    switch (type) {
      case "prompt": return "text-zinc-300 font-normal";
      case "success": return "text-zinc-300/65";
      case "error": return "text-[rgba(220,100,60,0.50)]";
      case "warning": return "text-amber-400/70";
      case "result": return "text-white/55";
      case "header": return "text-white/30 font-normal";
      case "divider": return "text-white/12";
      case "split": return "text-white/45";
      case "split-detail": return "text-zinc-300/45";
      case "balance": return "text-white/65 font-normal";
      case "dim": return "text-white/18";
      case "table-row": return "text-white/45";
      case "ascii": return "text-zinc-300/30 font-normal";
      case "blank": return "";
      default: return "text-white/35";
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
      <Navbar />

      <div className="pt-24">
        {/* Header */}
        <div className="border-b border-white/[0.06]">
          <div className="mx-auto max-w-[1520px] px-12 py-16 lg:py-20">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <div className="text-[11px] font-mono text-zinc-300/40 tracking-[0.2em] mb-4">PLAYGROUND</div>
                <h1 className="text-[clamp(2rem,4vw,3rem)] font-normal text-white leading-[1.1] tracking-tight">
                  Try Agent Aegis.
                  <span className="text-white/30 font-normal"> Live.</span>
                </h1>
                <p className="text-[14px] text-white/30 mt-4 max-w-lg leading-relaxed">
                  An interactive terminal simulator with all 47 marketplace operators loaded.
                  Search, invoke, inspect, validate  -  every command works against real operator data.
                  No wallet required. No transactions. Just the experience.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-6">
                <div className="text-right">
                  <div className="text-[11px] font-mono text-white/15 tracking-wider">WALLET</div>
                  <div className="text-[13px] font-mono text-white/40 mt-1">{wallet.address}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-mono text-white/15 tracking-wider">BALANCE</div>
                  <div className="text-[13px] font-mono text-zinc-300/50 mt-1">{wallet.sol.toFixed(3)} SOL</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terminal */}
        <div className="mx-auto max-w-[1520px] px-12 py-10 lg:py-14">
          <div
            className="border border-white/[0.08] overflow-hidden"
            style={{ boxShadow: "0 0 120px rgba(161,161,170,0.03), 0 4px 60px rgba(0,0,0,0.4)" }}
          >
            {/* Title bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/35" />
                <span className="font-mono text-[11px] text-white/18 ml-3">
                  agent-aegis  -  playground  -  {ALL_OPERATORS.length} operators loaded
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-zinc-300/25">
                  {wallet.invocations} invocations
                </span>
                <button
                  onClick={() => {
                    setLines([]);
                    setBootStep(0);
                    setBooted(false);
                    setWallet({ ...INITIAL_WALLET });
                    setHistory([]);
                  }}
                  className="font-mono text-[11px] tracking-wider uppercase text-white/20 hover:text-zinc-300 transition-colors border border-white/8 hover:border-white/25 px-3 py-1"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Terminal body */}
            <div
              ref={scrollRef}
              onClick={focusInput}
              className="p-6 lg:p-8 font-mono text-[11px] lg:text-[12px] leading-[1.9] min-h-[500px] max-h-[70vh] overflow-y-auto bg-[#080809] cursor-text"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(161,161,170,0.1) transparent",
              }}
            >
              {lines.map((line) => (
                <div
                  key={line.id}
                  className={`${getColor(line.type)} ${line.type === "blank" ? "h-3" : ""} whitespace-pre`}
                >
                  {line.text}
                </div>
              ))}

              {/* Input line */}
              {booted && (
                <form onSubmit={handleSubmit} className="flex items-center">
                  <span className="text-zinc-300 font-normal mr-2">$</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent text-white/80 outline-none font-mono text-[11px] lg:text-[12px] caret-[#A1A1AA] placeholder:text-white/10"
                    placeholder='Type a command... (try "help")'
                    autoFocus
                    spellCheck={false}
                    autoComplete="off"
                    autoCapitalize="off"
                  />
                </form>
              )}

              {/* Blinking cursor during boot */}
              {!booted && (
                <span className="inline-block w-[7px] h-[14px] bg-white/70 animate-pulse ml-0.5" />
              )}
            </div>
          </div>

          {/* Suggested commands */}
          <div className="mt-8">
            <div className="text-[11px] font-mono text-white/15 tracking-wider mb-4">TRY THESE COMMANDS</div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_COMMANDS.map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => runSuggested(cmd)}
                  className="font-mono text-[11px] text-white/25 hover:text-zinc-300/70 border border-white/[0.06] hover:border-white/20 px-3 py-2 transition-all duration-200 hover:bg-white/[0.03]"
                >
                  $ {cmd}
                </button>
              ))}
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-5 gap-px bg-white/[0.06] border border-white/[0.06]">
            {[
              { label: "OPERATORS LOADED", value: String(ALL_OPERATORS.length) },
              { label: "DB OPERATORS", value: String(realStats?.totalOperators || 0) },
              { label: "TOTAL INVOCATIONS", value: (realStats?.totalInvocations || 0).toLocaleString() },
              { label: "YOUR INVOCATIONS", value: String(wallet.invocations) },
              { label: "NETWORK", value: "Solana devnet" },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#0A0A0B] p-5 lg:p-6">
                <div className="text-[10px] font-mono text-white/15 tracking-wider">{stat.label}</div>
                <div className="text-[18px] font-normal text-white/60 mt-1 tracking-tight">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Bottom note */}
          <div className="mt-10 text-center">
            <p className="text-[12px] text-white/15">
              This is a simulation. No real Solana transactions are executed.{" "}
              <a href="/docs" className="text-zinc-300/25 hover:text-zinc-300 transition-colors">
                Read the docs &rarr;
              </a>
              {" · "}
              <a href="/marketplace" className="text-zinc-300/25 hover:text-zinc-300 transition-colors">
                Browse marketplace &rarr;
              </a>
            </p>
          </div>
        </div>
      </div>
      <MobileBottomNav />
      <div className="h-14 lg:hidden" />
    </div>
  );
}
