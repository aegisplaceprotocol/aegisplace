/**
 * seed-operators.ts - Registers 5 demo operators into the on-chain Aegis registry.
 *
 * Operators:
 *   1. code-review-v3    (Development, $0.02/call)
 *   2. security-audit     (Security, $0.05/call)
 *   3. data-extract-pro   (Data, $0.01/call)
 *   4. sentiment-v4       (AI/ML, $0.008/call)
 *   5. defi-monitor       (DeFi, $0.03/call)
 *
 * Each calls the Anchor program's register_operator instruction.
 * Uses @coral-xyz/anchor to interact with the deployed program.
 *
 * Run: npx tsx scripts/seed-operators.ts
 */
import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { AnchorProvider, Program, Wallet, BN, web3 } from "@coral-xyz/anchor";
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

const CHECK = `${GREEN}[OK]${RESET}`;
const CROSS = `${RED}[FAIL]${RESET}`;

// ── Constants ────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, ".env.devnet");

// Category enum mapping (matching on-chain u8)
const CATEGORIES = {
  Development: 0,
  Security: 1,
  Data: 2,
  "AI/ML": 3,
  DeFi: 4,
} as const;

// USDC has 6 decimals - prices in base units
function usdToLamports(usd: number): number {
  return Math.round(usd * 1_000_000);
}

// Demo operators to register
const DEMO_OPERATORS = [
  {
    name: "code-review-v3",
    endpoint: "https://aegisplace.com/api/operators/code-review-v3",
    priceUsd: 0.02,
    category: CATEGORIES.Development,
  },
  {
    name: "security-audit",
    endpoint: "https://aegisplace.com/api/operators/security-audit",
    priceUsd: 0.05,
    category: CATEGORIES.Security,
  },
  {
    name: "data-extract-pro",
    endpoint: "https://aegisplace.com/api/operators/data-extract-pro",
    priceUsd: 0.01,
    category: CATEGORIES.Data,
  },
  {
    name: "sentiment-v4",
    endpoint: "https://aegisplace.com/api/operators/sentiment-v4",
    priceUsd: 0.008,
    category: CATEGORIES["AI/ML"],
  },
  {
    name: "defi-monitor",
    endpoint: "https://aegisplace.com/api/operators/defi-monitor",
    priceUsd: 0.03,
    category: CATEGORIES.DeFi,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function readFromEnv(key: string): string | null {
  if (!fs.existsSync(ENV_PATH)) return null;
  const content = fs.readFileSync(ENV_PATH, "utf-8");
  const match = content.match(new RegExp(`^${key}=(.+)$`, "m"));
  return match ? match[1].trim() : null;
}

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

async function ensureSol(connection: Connection, keypair: Keypair, minSol: number): Promise<void> {
  const balance = await connection.getBalance(keypair.publicKey);
  if (balance < minSol * LAMPORTS_PER_SOL) {
    console.log(`${YELLOW}  Requesting airdrop for ${keypair.publicKey.toBase58().slice(0, 8)}...${RESET}`);
    const sig = await connection.requestAirdrop(keypair.publicKey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig, "confirmed");
  }
}

/**
 * Loads the Anchor IDL from the target directory.
 * Falls back to a generated IDL if the file doesn't exist.
 */
function loadIdl(): Record<string, unknown> {
  const idlPath = path.resolve(__dirname, "../target/idl/aegis.json");
  if (fs.existsSync(idlPath)) {
    return JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  }

  // Fallback: construct a minimal IDL matching the on-chain program.
  // This allows the script to work before `anchor build` is run.
  console.log(`${YELLOW}  IDL not found at ${idlPath}, using inline IDL${RESET}`);
  return INLINE_IDL;
}

// Minimal inline IDL matching the Anchor program for register_operator
const INLINE_IDL: Record<string, unknown> = {
  version: "0.1.0",
  name: "aegis",
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "admin", isMut: true, isSigner: true },
        { name: "config", isMut: true, isSigner: false },
        { name: "treasury", isMut: false, isSigner: false },
        { name: "stakerPool", isMut: false, isSigner: false },
        { name: "aegisMint", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "feeBps", type: { array: ["u16", 4] } }],
    },
    {
      name: "registerOperator",
      accounts: [
        { name: "creator", isMut: true, isSigner: true },
        { name: "config", isMut: true, isSigner: false },
        { name: "operator", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "name", type: "string" },
        { name: "endpointUrl", type: "string" },
        { name: "priceLamports", type: "u64" },
        { name: "category", type: "u8" },
      ],
    },
    {
      name: "invokeSkill",
      accounts: [
        { name: "caller", isMut: true, isSigner: true },
        { name: "config", isMut: true, isSigner: false },
        { name: "operator", isMut: true, isSigner: false },
        { name: "receipt", isMut: true, isSigner: false },
        { name: "usdcMint", isMut: false, isSigner: false },
        { name: "callerTokenAccount", isMut: true, isSigner: false },
        { name: "creatorTokenAccount", isMut: true, isSigner: false },
        { name: "stakerPoolTokenAccount", isMut: true, isSigner: false },
        { name: "treasuryTokenAccount", isMut: true, isSigner: false },
        { name: "referrerTokenAccount", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "updateTrust",
      accounts: [
        { name: "admin", isMut: true, isSigner: true },
        { name: "config", isMut: false, isSigner: false },
        { name: "operator", isMut: true, isSigner: false },
      ],
      args: [{ name: "delta", type: "i16" }],
    },
    {
      name: "deactivateOperator",
      accounts: [
        { name: "creator", isMut: false, isSigner: true },
        { name: "operator", isMut: true, isSigner: false },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "ProtocolConfig",
      type: {
        kind: "struct",
        fields: [
          { name: "admin", type: "publicKey" },
          { name: "treasury", type: "publicKey" },
          { name: "stakerPool", type: "publicKey" },
          { name: "aegisMint", type: "publicKey" },
          { name: "totalOperators", type: "u64" },
          { name: "totalInvocations", type: "u64" },
          { name: "totalVolumeLamports", type: "u64" },
          { name: "feeBps", type: { array: ["u16", 4] } },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "Operator",
      type: {
        kind: "struct",
        fields: [
          { name: "creator", type: "publicKey" },
          { name: "operatorId", type: "u64" },
          { name: "name", type: "string" },
          { name: "endpointUrl", type: "string" },
          { name: "priceLamports", type: "u64" },
          { name: "category", type: "u8" },
          { name: "trustScore", type: "u16" },
          { name: "totalInvocations", type: "u64" },
          { name: "successfulInvocations", type: "u64" },
          { name: "totalEarnedLamports", type: "u64" },
          { name: "isActive", type: "bool" },
          { name: "createdAt", type: "i64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "InvocationReceipt",
      type: {
        kind: "struct",
        fields: [
          { name: "operator", type: "publicKey" },
          { name: "caller", type: "publicKey" },
          { name: "amountPaid", type: "u64" },
          { name: "responseMs", type: "u32" },
          { name: "success", type: "bool" },
          { name: "trustDelta", type: "i16" },
          { name: "timestamp", type: "i64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: "InvalidFeeBpsSum", msg: "Fee basis points must sum to exactly 10000" },
    { code: 6001, name: "NameTooLong", msg: "Operator name exceeds 64 bytes" },
    { code: 6002, name: "EndpointUrlTooLong", msg: "Endpoint URL exceeds 256 bytes" },
    { code: 6003, name: "OperatorNotActive", msg: "Operator is not active" },
    { code: 6004, name: "OperatorAlreadyDeactivated", msg: "Operator is already deactivated" },
    { code: 6005, name: "TrustScoreOutOfRange", msg: "Trust score out of range (0-10000)" },
    { code: 6006, name: "Unauthorized", msg: "Unauthorized: signer is not the admin" },
    { code: 6007, name: "ArithmeticOverflow", msg: "Arithmetic overflow in fee calculation" },
    { code: 6008, name: "InvalidFeeBpsValue", msg: "Individual fee bps exceeds 10000" },
    { code: 6009, name: "ZeroPrice", msg: "Operator price must be greater than zero" },
    { code: 6010, name: "InvalidCategory", msg: "Invalid category value" },
  ],
};

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n${BOLD}${CYAN}=== Aegis Operator Seeding (On-Chain Registry) ===${RESET}\n`);

  // Step 1: Connect to devnet
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  console.log(`${GREEN}[1/4]${RESET} Connected to Solana devnet`);

  // Step 2: Load keypairs
  const { admin, creator } = loadKeypairs();

  // Step 3: Ensure SOL balances
  await ensureSol(connection, admin, 1);
  await ensureSol(connection, creator, 2);
  console.log(`${GREEN}[2/4]${RESET} SOL balances confirmed`);

  // Step 4: Load program
  const programIdStr = readFromEnv("AEGIS_PROGRAM_ID");
  if (!programIdStr) {
    console.log(`${YELLOW}  AEGIS_PROGRAM_ID not found in .env.devnet${RESET}`);
    console.log(`${DIM}  Add AEGIS_PROGRAM_ID=<address> to scripts/.env.devnet after deploying the program.${RESET}\n`);
    console.log(`${DIM}  Running in dry-run mode: computing PDA addresses without submitting transactions.${RESET}\n`);
    dryRun(creator.publicKey);
    return;
  }

  const programId = new PublicKey(programIdStr);
  const idl = loadIdl();

  // Create Anchor provider and program
  const wallet = new Wallet(creator);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program = new Program(idl as any, programId, provider);

  // Derive config PDA
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    programId,
  );

  // Check if config exists; if not, initialize it
  const configAccount = await connection.getAccountInfo(configPda);
  if (!configAccount) {
    console.log(`${YELLOW}  Protocol not initialized. Initializing...${RESET}`);
    await initializeProtocol(program, admin, creator, configPda, programId);
  }

  console.log(`${GREEN}[3/4]${RESET} Program loaded: ${programId.toBase58()}`);
  console.log(`${DIM}  Config PDA: ${configPda.toBase58()}${RESET}`);

  // Step 5: Register operators
  console.log(`${GREEN}[4/4]${RESET} Registering ${DEMO_OPERATORS.length} operators...\n`);

  const operatorPdas: string[] = [];

  for (let i = 0; i < DEMO_OPERATORS.length; i++) {
    const op = DEMO_OPERATORS[i];
    const priceLamports = usdToLamports(op.priceUsd);

    try {
      // Fetch current config to get total_operators for PDA derivation
      const config = await program.account.protocolConfig.fetch(configPda);
      const operatorId = (config as { totalOperators: BN }).totalOperators;

      // Derive operator PDA
      const [operatorPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("operator"),
          creator.publicKey.toBuffer(),
          operatorId.toArrayLike(Buffer, "le", 8),
        ],
        programId,
      );

      // Register the operator
      const tx = await program.methods
        .registerOperator(op.name, op.endpoint, new BN(priceLamports), op.category)
        .accounts({
          creator: creator.publicKey,
          config: configPda,
          operator: operatorPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      operatorPdas.push(operatorPda.toBase58());

      const categoryName = Object.entries(CATEGORIES).find(([, v]) => v === op.category)?.[0] ?? "Unknown";
      console.log(`  ${CHECK} ${BOLD}${op.name}${RESET}`);
      console.log(`     Category: ${categoryName} | Price: $${op.priceUsd}/call | PDA: ${operatorPda.toBase58()}`);
      console.log(`     ${DIM}${explorerUrl(tx, "tx")}${RESET}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Check if it's an "already in use" error (idempotent)
      if (msg.includes("already in use") || msg.includes("0x0")) {
        console.log(`  ${YELLOW}[SKIP]${RESET} ${op.name} - already registered`);
      } else {
        console.log(`  ${CROSS} ${op.name} - ${msg}`);
      }
    }
  }

  // Save operator PDAs
  if (operatorPdas.length > 0) {
    saveToEnv("OPERATOR_PDAS", operatorPdas.join(","));
  }

  // Summary
  console.log(`\n${BOLD}${CYAN}=== Seeding Complete ===${RESET}\n`);
  console.log(`  Program:    ${programId.toBase58()}`);
  console.log(`  Config PDA: ${configPda.toBase58()}`);
  console.log(`  Creator:    ${creator.publicKey.toBase58()}`);
  console.log(`  Operators:  ${operatorPdas.length} registered`);
  console.log(`  ${DIM}Saved to: ${ENV_PATH}${RESET}\n`);
}

/**
 * Initialize the protocol if it hasn't been initialized yet.
 */
async function initializeProtocol(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: Program<any>,
  admin: Keypair,
  creator: Keypair,
  configPda: PublicKey,
  programId: PublicKey,
): Promise<void> {
  // Use creator's pubkey as treasury and staker pool for demo
  // In production these would be separate addresses
  const aegisMintStr = readFromEnv("AEGIS_MINT");
  const aegisMint = aegisMintStr
    ? new PublicKey(aegisMintStr)
    : web3.Keypair.generate().publicKey; // Placeholder if token not created yet

  const feeBps: number[] = [6000, 1500, 1200, 800, 300, 200]; // 60/15/12/8/3/2

  const adminWallet = new Wallet(admin);
  const adminProvider = new AnchorProvider(
    program.provider.connection,
    adminWallet,
    { commitment: "confirmed" },
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminProgram = new Program(program.idl as any, programId, adminProvider);

  const tx = await adminProgram.methods
    .initialize(feeBps)
    .accounts({
      admin: admin.publicKey,
      config: configPda,
      treasury: admin.publicKey,     // admin doubles as treasury in demo
      stakerPool: creator.publicKey,  // creator doubles as staker pool in demo
      aegisMint,
      systemProgram: web3.SystemProgram.programId,
    })
    .signers([admin])
    .rpc();

  console.log(`${GREEN}  Protocol initialized!${RESET}`);
  console.log(`${DIM}  Tx: ${explorerUrl(tx, "tx")}${RESET}`);
}

/**
 * Dry-run mode: compute PDA addresses without submitting transactions.
 * Useful when the program hasn't been deployed yet.
 */
function dryRun(creatorPubkey: PublicKey): void {
  console.log(`${BOLD}${CYAN}--- Dry Run: Computed Operator PDAs ---${RESET}\n`);

  // Use a placeholder program ID (would be replaced with real one after deploy)
  const placeholderProgramId = new PublicKey("11111111111111111111111111111111");

  for (let i = 0; i < DEMO_OPERATORS.length; i++) {
    const op = DEMO_OPERATORS[i];
    const operatorIdBuf = Buffer.alloc(8);
    operatorIdBuf.writeBigUInt64LE(BigInt(i));

    const [operatorPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("operator"),
        creatorPubkey.toBuffer(),
        operatorIdBuf,
      ],
      placeholderProgramId,
    );

    const categoryName = Object.entries(CATEGORIES).find(([, v]) => v === op.category)?.[0] ?? "Unknown";
    console.log(`  ${DIM}[${i + 1}]${RESET} ${BOLD}${op.name}${RESET}`);
    console.log(`      Category: ${categoryName} | Price: $${op.priceUsd}/call`);
    console.log(`      PDA (placeholder): ${operatorPda.toBase58()}`);
  }

  console.log(`\n${DIM}  Note: These PDAs use a placeholder program ID.${RESET}`);
  console.log(`${DIM}  Deploy the program and set AEGIS_PROGRAM_ID in .env.devnet to register for real.${RESET}\n`);
}

main().catch((err) => {
  console.error(`\n${RED}Error: ${err instanceof Error ? err.message : String(err)}${RESET}`);
  if (err instanceof Error && err.stack) {
    console.error(`${DIM}${err.stack}${RESET}`);
  }
  process.exit(1);
});
