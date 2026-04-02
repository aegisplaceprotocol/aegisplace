/**
 * Shared keypair helper for Aegis devnet scripts.
 *
 * Loads or generates keypairs for admin, creator, and caller roles.
 * Keypairs are saved to scripts/.keys/ so they persist across runs.
 *
 * Usage: import { loadKeypairs } from "./helpers/keypairs.ts";
 */
import { Keypair } from "@solana/web3.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEYS_DIR = path.resolve(__dirname, "../.keys");

// ANSI color helpers
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

/**
 * Loads a keypair from disk, or generates and saves a new one.
 */
function loadOrGenerate(name: string): Keypair {
  const filePath = path.join(KEYS_DIR, `${name}.json`);

  if (fs.existsSync(filePath)) {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const kp = Keypair.fromSecretKey(Uint8Array.from(raw));
    console.log(`${DIM}  Loaded ${name}: ${kp.publicKey.toBase58()}${RESET}`);
    return kp;
  }

  // Generate new keypair
  const kp = Keypair.generate();
  fs.mkdirSync(KEYS_DIR, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(Array.from(kp.secretKey)));
  console.log(`${GREEN}  Generated ${name}: ${kp.publicKey.toBase58()}${RESET}`);
  return kp;
}

export interface AegisKeypairs {
  admin: Keypair;
  creator: Keypair;
  caller: Keypair;
}

/**
 * Loads or generates all three keypairs used in Aegis demo scripts.
 */
export function loadKeypairs(): AegisKeypairs {
  console.log(`\n${DIM}Loading keypairs from ${KEYS_DIR}${RESET}`);
  return {
    admin: loadOrGenerate("admin"),
    creator: loadOrGenerate("creator"),
    caller: loadOrGenerate("caller"),
  };
}

/**
 * Returns the Solana Explorer URL for a given address or transaction.
 */
export function explorerUrl(addressOrTx: string, type: "address" | "tx" = "address"): string {
  return `https://explorer.solana.com/${type}/${addressOrTx}?cluster=devnet`;
}
