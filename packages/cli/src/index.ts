#!/usr/bin/env node

/**
 * @aegis/cli - Aegis Protocol Command Line Interface
 *
 * Usage:
 *   aegis operators list --limit 10 --sort trust
 *   aegis operators get <slug>
 *   aegis invoke <slug> --payload '{"text":"hello"}'
 *   aegis trust <slug>
 *   aegis stats
 *   aegis royalties <wallet>
 *   aegis search <query>
 *   aegis health
 *   aegis a2a discover
 */

import { Command } from "commander";
import chalk from "chalk";

const DEFAULT_URL = process.env.AEGIS_API_URL || "https://mcp.aegisplace.com";
const API_KEY = process.env.AEGIS_API_KEY;

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;
  const url = `${DEFAULT_URL}${path}`;
  const res = await fetch(url, { ...headers, ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

function formatNum(n: number | string): string {
  return Number(n).toLocaleString();
}

function truncAddr(addr: string): string {
  if (!addr || addr.length < 12) return addr || "-";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

const program = new Command();

program
  .name("aegis")
  .description("Aegis Protocol CLI - invoke AI skills on Solana")
  .version("1.0.0");

// ── operators ──

const operators = program.command("operators").description("Manage operators");

operators
  .command("list")
  .description("List operators")
  .option("-l, --limit <n>", "Limit results", "20")
  .option("-s, --sort <field>", "Sort by: trust, invocations, earnings, newest", "trust")
  .option("-c, --category <cat>", "Filter by category")
  .option("-q, --search <query>", "Search term")
  .action(async (opts) => {
    try {
      const params = new URLSearchParams({ limit: opts.limit, sortBy: opts.sort });
      if (opts.category) params.set("category", opts.category);
      if (opts.search) params.set("q", opts.search);
      const data = await apiFetch(`/api/v1/operators?${params}`);
      const ops = data.operators || data;

      console.log(chalk.bold(`\n  Operators (${data.total || ops.length} total)\n`));
      console.log(chalk.dim("  #   Name                          Category        Trust   Invocations    Price"));
      console.log(chalk.dim("  " + "─".repeat(85)));

      ops.forEach((op: any, i: number) => {
        const earned = op.totalEarned?.$numberDecimal ? parseFloat(op.totalEarned.$numberDecimal) : op.totalEarned || 0;
        const trust = op.trustScore || 0;
        const trustColor = trust >= 90 ? chalk.green : trust >= 70 ? chalk.yellow : chalk.red;
        console.log(
          `  ${chalk.dim(String(i + 1).padStart(2))}  ${chalk.white(op.name?.padEnd(30) || "-")} ${chalk.cyan((op.category || "-").padEnd(15))} ${trustColor(String(trust).padStart(3))}   ${chalk.white(formatNum(op.totalInvocations || 0).padStart(14))}  $${op.pricePerCall || "0.01"}`
        );
      });
      console.log();
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

operators
  .command("get <slug>")
  .description("Get operator details")
  .action(async (slug) => {
    try {
      const op = await apiFetch(`/api/v1/operators/${slug}`);
      console.log(chalk.bold(`\n  ${op.name}\n`));
      console.log(`  ${chalk.dim("Slug:")}        ${op.slug}`);
      console.log(`  ${chalk.dim("Category:")}    ${op.category}`);
      console.log(`  ${chalk.dim("Trust:")}       ${op.trustScore}/100`);
      console.log(`  ${chalk.dim("Invocations:")} ${formatNum(op.totalInvocations)}`);
      console.log(`  ${chalk.dim("Price:")}       $${op.pricePerCall}/call`);
      console.log(`  ${chalk.dim("Creator:")}     ${truncAddr(op.creatorWallet)}`);
      console.log(`  ${chalk.dim("Status:")}      ${op.isActive ? chalk.green("Active") : chalk.red("Inactive")} ${op.isVerified ? chalk.cyan("✓ Verified") : ""}`);
      if (op.tagline) console.log(`  ${chalk.dim("Tagline:")}     ${op.tagline}`);
      if (op.description) console.log(`  ${chalk.dim("About:")}       ${op.description.slice(0, 120)}...`);
      console.log();
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// ── invoke ──

program
  .command("invoke <slug>")
  .description("Invoke a skill operator")
  .option("-p, --payload <json>", "JSON payload", "{}")
  .option("-w, --wallet <addr>", "Caller wallet address")
  .action(async (slug, opts) => {
    try {
      let payload: any = {};
      try { payload = JSON.parse(opts.payload); } catch { /* ignore */ }

      console.log(chalk.dim(`\n  Invoking ${slug}...`));
      const result = await apiFetch(`/api/v1/operators/${slug}/invoke`, {
        method: "POST",
        body: JSON.stringify({ payload, callerWallet: opts.wallet }),
      });

      console.log(chalk.green(`\n  ✓ Success`) + chalk.dim(` (${result.execution?.responseMs || result.responseMs || "?"}ms)\n`));
      if (result.result) {
        console.log(chalk.dim("  Response:"));
        console.log(`  ${JSON.stringify(result.result, null, 2).split("\n").join("\n  ")}`);
      }
      if (result.payment || result.fees) {
        const fees = result.payment || result.fees;
        console.log(chalk.dim("\n  Fees:"));
        console.log(`  Total: $${fees.total || fees.totalAmount || "?"} USDC`);
      }
      console.log();
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// ── trust ──

program
  .command("trust <slug>")
  .description("Get trust score breakdown for an operator")
  .action(async (slug) => {
    try {
      const data = await apiFetch(`/api/v1/operators/${slug}/trust`);
      console.log(chalk.bold(`\n  Trust Report: ${slug}\n`));

      const bar = (score: number) => {
        const filled = Math.round(score / 5);
        const empty = 20 - filled;
        const color = score >= 90 ? chalk.green : score >= 70 ? chalk.yellow : chalk.red;
        return color("█".repeat(filled)) + chalk.dim("░".repeat(empty));
      };

      console.log(`  Overall              ${bar(data.overall)} ${data.overall}/100`);
      console.log(`  Exec Reliability     ${bar(data.executionReliability)} ${data.executionReliability}/100`);
      console.log(`  Response Quality     ${bar(data.responseQuality)} ${data.responseQuality}/100`);
      console.log(`  Schema Compliance    ${bar(data.schemaCompliance)} ${data.schemaCompliance}/100`);
      console.log(`  Validator Consensus  ${bar(data.validatorConsensus)} ${data.validatorConsensus}/100`);
      console.log(`  Historical Perf      ${bar(data.historicalPerformance)} ${data.historicalPerformance}/100`);
      console.log();
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// ── stats ──

program
  .command("stats")
  .description("Get protocol-wide statistics")
  .action(async () => {
    try {
      const data = await apiFetch("/api/v1/stats");
      console.log(chalk.bold("\n  Aegis Protocol Stats\n"));
      console.log(`  ${chalk.dim("Operators:")}    ${chalk.white(formatNum(data.operators))}`);
      console.log(`  ${chalk.dim("Invocations:")} ${chalk.white(formatNum(data.invocations))}`);
      console.log(`  ${chalk.dim("Revenue:")}      ${chalk.green("$" + formatNum(data.revenue) + " USDC")}`);
      console.log(`  ${chalk.dim("Avg Trust:")}    ${chalk.cyan(data.avgTrustScore + "/100")}`);
      console.log(`  ${chalk.dim("Chain:")}        Solana`);
      console.log(`  ${chalk.dim("Settlement:")}   ~400ms`);
      console.log(`  ${chalk.dim("Guardrails:")}   NVIDIA NeMo`);
      console.log();
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// ── search ──

program
  .command("search <query>")
  .description("Search for operators")
  .option("-l, --limit <n>", "Limit results", "10")
  .action(async (query, opts) => {
    try {
      const data = await apiFetch(`/api/v1/operators?q=${encodeURIComponent(query)}&limit=${opts.limit}`);
      const ops = data.operators || data;
      console.log(chalk.bold(`\n  Results for "${query}" (${data.total || ops.length} found)\n`));
      ops.forEach((op: any, i: number) => {
        console.log(`  ${chalk.dim(String(i + 1) + ".")} ${chalk.white(op.name)} ${chalk.dim("-")} ${chalk.cyan(op.category)} ${chalk.dim("-")} Trust: ${op.trustScore}`);
      });
      if (!ops.length) console.log(chalk.dim("  No operators found."));
      console.log();
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// ── royalties ──

program
  .command("royalties <wallet>")
  .description("Get royalty earnings for a wallet")
  .action(async (wallet) => {
    try {
      const data = await apiFetch(`/api/royalties/earnings/${wallet}`);
      console.log(chalk.bold("\n  Royalty Earnings\n"));
      console.log(`  ${chalk.dim("Wallet:")}     ${truncAddr(wallet)}`);
      console.log(`  ${chalk.dim("Unclaimed:")}  ${chalk.green("$" + (data.unclaimed || "0") + " USDC")}`);
      console.log(`  ${chalk.dim("Total:")}      $${data.totalEarned || "0"} USDC`);
      console.log(`  ${chalk.dim("Claimed:")}    $${data.totalClaimed || "0"} USDC`);
      console.log();
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// ── health ──

program
  .command("health")
  .description("Check protocol health")
  .action(async () => {
    try {
      const data = await apiFetch("/api/health");
      console.log(chalk.bold("\n  Protocol Health\n"));
      console.log(`  ${chalk.dim("Status:")}     ${data.status === "ok" ? chalk.green("● HEALTHY") : chalk.red("● UNHEALTHY")}`);
      console.log(`  ${chalk.dim("Uptime:")}     ${Math.round(data.uptime)}s`);
      console.log(`  ${chalk.dim("Operators:")}  ${formatNum(data.operators)}`);
      console.log(`  ${chalk.dim("Version:")}    ${data.version}`);
      console.log();
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// ── a2a ──

const a2a = program.command("a2a").description("A2A protocol commands");

a2a
  .command("discover")
  .description("Discover agent capabilities via A2A")
  .action(async () => {
    try {
      const data = await apiFetch("/api/a2a", {
        method: "POST",
        body: JSON.stringify({ jsonrpc: "2.0", method: "agent/discover", id: 1 }),
      });
      console.log(chalk.bold("\n  A2A Agent Discovery\n"));
      console.log(JSON.stringify(data.result || data, null, 2).split("\n").map((l: string) => "  " + l).join("\n"));
      console.log();
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program.parse();
