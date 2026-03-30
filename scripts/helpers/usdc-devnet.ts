/**
 * Helper to create a fake USDC mint on devnet for testing.
 *
 * Creates a standard SPL token with 6 decimals (matching real USDC),
 * mints test tokens to all provided keypairs, and saves the mint address.
 *
 * Usage: import { getOrCreateDevnetUsdc } from "./helpers/usdc-devnet.ts";
 */
import {
  Connection,
  Keypair,
  PublicKey,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, "../.env.devnet");
const KEYS_DIR = path.resolve(__dirname, "../.keys");

// ANSI colors
const GREEN = "\x1b[32m";
const DIM = "\x1b[2m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

const USDC_DECIMALS = 6;
const MINT_AMOUNT = 10_000_000 * 10 ** USDC_DECIMALS; // 10M test USDC per keypair

/**
 * Reads the devnet USDC mint address from the .env.devnet file, if it exists.
 */
function readSavedMint(): PublicKey | null {
  if (!fs.existsSync(ENV_PATH)) return null;
  const content = fs.readFileSync(ENV_PATH, "utf-8");
  const match = content.match(/^USDC_DEVNET_MINT=(.+)$/m);
  if (match && match[1]) {
    try {
      return new PublicKey(match[1].trim());
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Appends or updates a key=value pair in the .env.devnet file.
 */
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

/**
 * Loads the USDC mint authority keypair from .keys/ or generates a new one.
 */
function loadMintAuthority(): Keypair {
  const filePath = path.join(KEYS_DIR, "usdc-mint-authority.json");
  if (fs.existsSync(filePath)) {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return Keypair.fromSecretKey(Uint8Array.from(raw));
  }
  const kp = Keypair.generate();
  fs.mkdirSync(KEYS_DIR, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(Array.from(kp.secretKey)));
  return kp;
}

export interface UsdcDevnetResult {
  mint: PublicKey;
  tokenAccounts: Map<string, PublicKey>;
}

/**
 * Gets or creates a fake USDC mint on devnet.
 * Mints test tokens to all provided wallets.
 *
 * @param connection  Solana devnet connection
 * @param payer       Keypair that pays for transactions (must have SOL)
 * @param wallets     Map of name -> Keypair to fund with test USDC
 */
export async function getOrCreateDevnetUsdc(
  connection: Connection,
  payer: Keypair,
  wallets: Map<string, Keypair>,
): Promise<UsdcDevnetResult> {
  const mintAuthority = loadMintAuthority();
  const tokenAccounts = new Map<string, PublicKey>();

  // Check if mint already exists
  const savedMint = readSavedMint();
  let mint: PublicKey;

  if (savedMint) {
    // Verify the mint still exists on-chain
    const info = await connection.getAccountInfo(savedMint);
    if (info) {
      console.log(`${DIM}  Using existing devnet USDC mint: ${savedMint.toBase58()}${RESET}`);
      mint = savedMint;
    } else {
      console.log(`${YELLOW}  Saved mint not found on-chain, creating new one...${RESET}`);
      mint = await createNewMint(connection, payer, mintAuthority);
    }
  } else {
    mint = await createNewMint(connection, payer, mintAuthority);
  }

  // Create token accounts and mint test USDC to each wallet
  for (const [name, wallet] of wallets) {
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      wallet.publicKey,
    );
    tokenAccounts.set(name, ata.address);

    // Mint test USDC if balance is low
    const balance = Number(ata.amount);
    if (balance < MINT_AMOUNT / 2) {
      await mintTo(
        connection,
        payer,
        mint,
        ata.address,
        mintAuthority,
        BigInt(MINT_AMOUNT),
      );
      console.log(`${GREEN}  Minted 10M test USDC to ${name}: ${ata.address.toBase58()}${RESET}`);
    } else {
      console.log(`${DIM}  ${name} already has USDC: ${ata.address.toBase58()}${RESET}`);
    }
  }

  return { mint, tokenAccounts };
}

async function createNewMint(
  connection: Connection,
  payer: Keypair,
  mintAuthority: Keypair,
): Promise<PublicKey> {
  // Ensure mint authority has SOL for the transaction
  const balance = await connection.getBalance(mintAuthority.publicKey);
  if (balance < 10_000_000) {
    // Airdrop if needed — mint authority needs some SOL to sign
    // But payer covers rent, so this is optional
  }

  const mint = await createMint(
    connection,
    payer,
    mintAuthority.publicKey, // mint authority
    mintAuthority.publicKey, // freeze authority
    USDC_DECIMALS,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID,
  );

  saveToEnv("USDC_DEVNET_MINT", mint.toBase58());
  console.log(`${GREEN}  Created devnet USDC mint: ${mint.toBase58()}${RESET}`);
  return mint;
}
