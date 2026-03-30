/**
 * Open Wallet Standard (OWS) integration for Aegis Protocol.
 * OWS provides encrypted local wallets with isolated signing for AI agents.
 * Keys never touch the agent, LLM, or Aegis - signing happens in OWS's mlocked memory.
 */

import { execFile as execFileCb } from "child_process";
import { promisify } from "util";
import { logger } from "./logger";

const execFileAsync = promisify(execFileCb);

/** Sanitize a name to only allow alphanumeric, hyphens, and underscores */
function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "");
}

/** Check if OWS CLI is installed on this machine */
export async function isOwsInstalled(): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync("ows", ["--version"], { timeout: 5000 });
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

/** Create an OWS wallet for an agent */
export async function createOwsWallet(name: string): Promise<{
  name: string;
  solanaAddress: string | null;
  evmAddress: string | null;
} | null> {
  try {
    const safeName = sanitizeName(name);
    const { stdout } = await execFileAsync("ows", ["wallet", "create", "--name", safeName, "--json"], { timeout: 15000 });
    const data = JSON.parse(stdout);
    return {
      name,
      solanaAddress: data.accounts?.["solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"] || data.accounts?.solana || null,
      evmAddress: data.accounts?.["eip155:1"] || data.accounts?.evm || null,
    };
  } catch (err: any) {
    logger.warn({ err, wallet: name }, "Failed to create OWS wallet");
    return null;
  }
}

/** Get wallet info */
export async function getOwsWallet(name: string): Promise<{
  name: string;
  solanaAddress: string | null;
} | null> {
  try {
    const safeName = sanitizeName(name);
    const { stdout } = await execFileAsync("ows", ["wallet", "show", safeName, "--json"], { timeout: 5000 });
    const data = JSON.parse(stdout);
    return {
      name,
      solanaAddress: data.accounts?.["solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"] || data.accounts?.solana || null,
    };
  } catch {
    return null;
  }
}
