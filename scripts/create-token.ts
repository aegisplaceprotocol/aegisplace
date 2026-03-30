/**
 * create-token.ts — Creates the $AEGIS Token-2022 mint on Solana devnet.
 *
 * Features:
 *   - Token-2022 program with Transfer Fee extension
 *   - 50 basis points (0.5%) transfer fee, max fee 1B tokens (smallest units)
 *   - 9 decimals
 *   - Mints 1,000,000,000 (1B) initial supply to admin
 *   - Saves mint address to scripts/.env.devnet
 *
 * Run: npx tsx scripts/create-token.ts
 */
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
  getMintLen,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  createMintToInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadKeypairs, explorerUrl } from "./helpers/keypairs.ts";

// ── ANSI Colors ──────────────────────────────────────────────────────────────
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

// ── Constants ────────────────────────────────────────────────────────────────
const DECIMALS = 9;
const TRANSFER_FEE_BPS = 50; // 0.5%
const MAX_FEE = BigInt(1_000_000_000); // 1B in smallest units
const INITIAL_SUPPLY = BigInt(1_000_000_000) * BigInt(10 ** DECIMALS); // 1B tokens

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, ".env.devnet");

// ── Helpers ──────────────────────────────────────────────────────────────────

function saveToEnv(key: string, value: string): void {
  let content = "";
  if (fs.existsSync(ENV_PATH)) {
    content = fs.readFileSync(ENV_PATH, "utf-8");
  }
  const regex = new RegExp(`^${key}=.*$`, "m");
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content += `${content.endsWith("\n") || content === "" ? "" : "\n"}${key}=${value}\n`;
  }
  fs.writeFileSync(ENV_PATH, content);
}

function readFromEnv(key: string): string | null {
  if (!fs.existsSync(ENV_PATH)) return null;
  const content = fs.readFileSync(ENV_PATH, "utf-8");
  const match = content.match(new RegExp(`^${key}=(.+)$`, "m"));
  return match ? match[1].trim() : null;
}

async function ensureSol(connection: Connection, keypair: Keypair, minSol: number): Promise<void> {
  const balance = await connection.getBalance(keypair.publicKey);
  if (balance < minSol * LAMPORTS_PER_SOL) {
    console.log(`${YELLOW}  Requesting airdrop for ${keypair.publicKey.toBase58().slice(0, 8)}...${RESET}`);
    const sig = await connection.requestAirdrop(keypair.publicKey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig, "confirmed");
    console.log(`${GREEN}  Airdrop confirmed${RESET}`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n${BOLD}${CYAN}=== $AEGIS Token Creation (Token-2022 + Transfer Fee) ===${RESET}\n`);

  // Step 1: Connect to devnet
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  console.log(`${GREEN}[1/6]${RESET} Connected to Solana devnet`);

  // Step 2: Load keypairs
  const { admin } = loadKeypairs();
  console.log(`${GREEN}[2/6]${RESET} Admin loaded: ${admin.publicKey.toBase58()}`);

  // Step 3: Ensure SOL balance
  await ensureSol(connection, admin, 1);
  console.log(`${GREEN}[3/6]${RESET} SOL balance confirmed`);

  // Check if mint already exists
  const existingMint = readFromEnv("AEGIS_MINT");
  if (existingMint) {
    const info = await connection.getAccountInfo(new PublicKey(existingMint));
    if (info) {
      console.log(`\n${YELLOW}$AEGIS mint already exists: ${existingMint}${RESET}`);
      console.log(`${DIM}  ${explorerUrl(existingMint)}${RESET}`);
      console.log(`${DIM}  Delete .env.devnet to recreate.${RESET}\n`);
      return;
    }
  }

  // Step 4: Create the Token-2022 mint with Transfer Fee extension
  console.log(`${GREEN}[4/6]${RESET} Creating Token-2022 mint with transfer fee extension...`);

  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;

  // Calculate account size with TransferFeeConfig extension
  const extensions = [ExtensionType.TransferFeeConfig];
  const mintLen = getMintLen(extensions);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

  const createAccountIx = SystemProgram.createAccount({
    fromPubkey: admin.publicKey,
    newAccountPubkey: mint,
    space: mintLen,
    lamports,
    programId: TOKEN_2022_PROGRAM_ID,
  });

  // Initialize the transfer fee config BEFORE initializing the mint
  const initTransferFeeIx = createInitializeTransferFeeConfigInstruction(
    mint,
    admin.publicKey,   // transfer fee config authority
    admin.publicKey,   // withdraw withheld authority
    TRANSFER_FEE_BPS,  // fee in basis points
    MAX_FEE,           // max fee per transfer
    TOKEN_2022_PROGRAM_ID,
  );

  const initMintIx = createInitializeMintInstruction(
    mint,
    DECIMALS,
    admin.publicKey,  // mint authority
    admin.publicKey,  // freeze authority
    TOKEN_2022_PROGRAM_ID,
  );

  const tx1 = new Transaction().add(createAccountIx, initTransferFeeIx, initMintIx);

  const sig1 = await sendAndConfirmTransaction(connection, tx1, [admin, mintKeypair], {
    commitment: "confirmed",
  });

  console.log(`${GREEN}  Mint created: ${mint.toBase58()}${RESET}`);
  console.log(`${DIM}  Tx: ${explorerUrl(sig1, "tx")}${RESET}`);

  // Save mint address
  saveToEnv("AEGIS_MINT", mint.toBase58());

  // Also save the mint keypair for future reference
  const mintKeyPath = path.resolve(__dirname, ".keys/aegis-mint.json");
  fs.mkdirSync(path.dirname(mintKeyPath), { recursive: true });
  fs.writeFileSync(mintKeyPath, JSON.stringify(Array.from(mintKeypair.secretKey)));

  // Step 5: Create admin's token account (Token-2022 ATA)
  console.log(`${GREEN}[5/6]${RESET} Creating admin token account...`);

  const adminAta = getAssociatedTokenAddressSync(
    mint,
    admin.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const createAtaIx = createAssociatedTokenAccountInstruction(
    admin.publicKey,   // payer
    adminAta,          // ATA address
    admin.publicKey,   // owner
    mint,              // mint
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const tx2 = new Transaction().add(createAtaIx);
  const sig2 = await sendAndConfirmTransaction(connection, tx2, [admin], {
    commitment: "confirmed",
  });

  console.log(`${GREEN}  Admin ATA: ${adminAta.toBase58()}${RESET}`);
  console.log(`${DIM}  Tx: ${explorerUrl(sig2, "tx")}${RESET}`);

  // Step 6: Mint initial supply to admin
  console.log(`${GREEN}[6/6]${RESET} Minting 1,000,000,000 $AEGIS to admin...`);

  const mintToIx = createMintToInstruction(
    mint,
    adminAta,
    admin.publicKey,
    INITIAL_SUPPLY,
    [],
    TOKEN_2022_PROGRAM_ID,
  );

  const tx3 = new Transaction().add(mintToIx);
  const sig3 = await sendAndConfirmTransaction(connection, tx3, [admin], {
    commitment: "confirmed",
  });

  console.log(`${GREEN}  Minted ${(Number(INITIAL_SUPPLY) / 10 ** DECIMALS).toLocaleString()} $AEGIS${RESET}`);
  console.log(`${DIM}  Tx: ${explorerUrl(sig3, "tx")}${RESET}`);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n${BOLD}${CYAN}=== $AEGIS Token Summary ===${RESET}\n`);
  console.log(`  Mint:             ${BOLD}${mint.toBase58()}${RESET}`);
  console.log(`  Program:          Token-2022 (${TOKEN_2022_PROGRAM_ID.toBase58()})`);
  console.log(`  Decimals:         ${DECIMALS}`);
  console.log(`  Transfer Fee:     ${TRANSFER_FEE_BPS} bps (0.5%)`);
  console.log(`  Max Fee:          ${MAX_FEE.toLocaleString()} (smallest units)`);
  console.log(`  Initial Supply:   1,000,000,000 $AEGIS`);
  console.log(`  Mint Authority:   ${admin.publicKey.toBase58()}`);
  console.log(`  Fee Authority:    ${admin.publicKey.toBase58()}`);
  console.log(`  Admin ATA:        ${adminAta.toBase58()}`);
  console.log(`\n  ${DIM}Explorer: ${explorerUrl(mint.toBase58())}${RESET}`);
  console.log(`  ${DIM}Saved to: ${ENV_PATH}${RESET}\n`);
}

main().catch((err) => {
  console.error(`\n${RED}Error: ${err instanceof Error ? err.message : String(err)}${RESET}`);
  if (err instanceof Error && err.stack) {
    console.error(`${DIM}${err.stack}${RESET}`);
  }
  process.exit(1);
});
