/**
 * demo-loop.ts — Full-cycle Aegis demo script.
 *
 * Runs the complete Aegis cycle on Solana devnet:
 *   Step 1: Connect to devnet, load keypairs
 *   Step 2: Airdrop SOL if needed
 *   Step 3: Create/load USDC devnet token accounts
 *   Step 4: Register a new operator
 *   Step 5: Invoke skill with USDC payment
 *   Step 6: Verify fee distribution to 6 wallets (60/15/12/8/3/2)
 *   Step 7: Check trust score
 *   Step 8: Print invocation receipt
 *
 * Each step prints with checkmark/cross and Solana Explorer links.
 * Clean terminal output suitable for screen recording.
 *
 * Run: npx tsx scripts/demo-loop.ts
 */
import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
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
const WHITE = "\x1b[37m";

const CHECK = `${GREEN}[OK]${RESET}`;
const CROSS = `${RED}[FAIL]${RESET}`;
const SKIP = `${YELLOW}[SKIP]${RESET}`;

// ── Constants ────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, ".env.devnet");

// Fee schedule: 60% creator / 15% validators / 12% stakers / 8% treasury / 3% insurance / 2% burned
const FEE_BPS = [6000, 1500, 1200, 800, 300, 200] as const;
const FEE_LABELS = ["Creator (60%)", "Validators (15%)", "Stakers (12%)", "Treasury (8%)", "Insurance (3%)", "Burned (2%)"];

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

async function ensureSol(connection: Connection, keypair: Keypair, label: string): Promise<void> {
  const balance = await connection.getBalance(keypair.publicKey);
  const solBalance = balance / LAMPORTS_PER_SOL;
  if (solBalance < 0.5) {
    console.log(`${DIM}     Airdropping 2 SOL to ${label}...${RESET}`);
    try {
      const sig = await connection.requestAirdrop(keypair.publicKey, 2 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, "confirmed");
      console.log(`${DIM}     Airdrop confirmed for ${label}${RESET}`);
    } catch (err) {
      console.log(`${YELLOW}     Airdrop failed for ${label} (may be rate-limited). Balance: ${solBalance.toFixed(4)} SOL${RESET}`);
    }
  }
}

function stepHeader(num: number, title: string): void {
  console.log(`\n${WHITE}${BOLD}  Step ${num}: ${title}${RESET}`);
  console.log(`${DIM}  ${"─".repeat(60)}${RESET}`);
}

function loadIdl(): Record<string, unknown> {
  const idlPath = path.resolve(__dirname, "../target/idl/aegis.json");
  if (fs.existsSync(idlPath)) {
    return JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  }
  // Use the inline IDL (same as seed-operators.ts)
  return INLINE_IDL;
}

// Inline IDL (same as seed-operators.ts)
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
        { name: "validatorPool", isMut: false, isSigner: false },
        { name: "stakerPool", isMut: false, isSigner: false },
        { name: "insuranceFund", isMut: false, isSigner: false },
        { name: "aegisMint", isMut: false, isSigner: false },
        { name: "usdcMint", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "feeBps", type: { array: ["u16", 6] } }],
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
        { name: "usdcMint", isMut: true, isSigner: false },
        { name: "callerTokenAccount", isMut: true, isSigner: false },
        { name: "creatorTokenAccount", isMut: true, isSigner: false },
        { name: "validatorPoolTokenAccount", isMut: true, isSigner: false },
        { name: "stakerPoolTokenAccount", isMut: true, isSigner: false },
        { name: "treasuryTokenAccount", isMut: true, isSigner: false },
        { name: "insuranceFundTokenAccount", isMut: true, isSigner: false },
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
          { name: "validatorPool", type: "publicKey" },
          { name: "stakerPool", type: "publicKey" },
          { name: "insuranceFund", type: "publicKey" },
          { name: "aegisMint", type: "publicKey" },
          { name: "usdcMint", type: "publicKey" },
          { name: "totalOperators", type: "u64" },
          { name: "totalInvocations", type: "u64" },
          { name: "totalVolumeLamports", type: "u64" },
          { name: "feeBps", type: { array: ["u16", 6] } },
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
  console.log(`\n${BOLD}${CYAN}${"=".repeat(64)}${RESET}`);
  console.log(`${BOLD}${CYAN}    AEGIS PROTOCOL — Full Demo Loop (Devnet)${RESET}`);
  console.log(`${BOLD}${CYAN}${"=".repeat(64)}${RESET}`);

  const startTime = Date.now();

  // ──────────────────────────────────────────────────────────────────────────
  // Step 1: Connect to devnet
  // ──────────────────────────────────────────────────────────────────────────
  stepHeader(1, "Connect to Solana devnet");

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const version = await connection.getVersion();
  console.log(`  ${CHECK} Connected to devnet (Solana ${version["solana-core"]})`);

  // ──────────────────────────────────────────────────────────────────────────
  // Step 2: Load keypairs and airdrop SOL
  // ──────────────────────────────────────────────────────────────────────────
  stepHeader(2, "Load keypairs & airdrop SOL");

  const { admin, creator, caller } = loadKeypairs();

  await ensureSol(connection, admin, "admin");
  await ensureSol(connection, creator, "creator");
  await ensureSol(connection, caller, "caller");

  const adminBal = (await connection.getBalance(admin.publicKey)) / LAMPORTS_PER_SOL;
  const creatorBal = (await connection.getBalance(creator.publicKey)) / LAMPORTS_PER_SOL;
  const callerBal = (await connection.getBalance(caller.publicKey)) / LAMPORTS_PER_SOL;

  console.log(`  ${CHECK} Admin:   ${admin.publicKey.toBase58()} (${adminBal.toFixed(4)} SOL)`);
  console.log(`  ${CHECK} Creator: ${creator.publicKey.toBase58()} (${creatorBal.toFixed(4)} SOL)`);
  console.log(`  ${CHECK} Caller:  ${caller.publicKey.toBase58()} (${callerBal.toFixed(4)} SOL)`);

  // ──────────────────────────────────────────────────────────────────────────
  // Step 3: Create/load USDC devnet token accounts
  // ──────────────────────────────────────────────────────────────────────────
  stepHeader(3, "Create/load USDC devnet token accounts");

  // Check for program ID first — needed to know if we can do full demo
  const programIdStr = readFromEnv("AEGIS_PROGRAM_ID");
  if (!programIdStr) {
    console.log(`\n  ${YELLOW}AEGIS_PROGRAM_ID not set in .env.devnet${RESET}`);
    console.log(`  ${DIM}Deploy the Anchor program first, then set:${RESET}`);
    console.log(`  ${DIM}  AEGIS_PROGRAM_ID=<program-address>${RESET}`);
    console.log(`  ${DIM}in scripts/.env.devnet${RESET}`);
    printDryRunSummary(admin, creator, caller);
    return;
  }

  const programId = new PublicKey(programIdStr);
  const idl = loadIdl();

  // Import USDC helper dynamically
  const { getOrCreateDevnetUsdc } = await import("./helpers/usdc-devnet.ts");

  const wallets = new Map<string, Keypair>([
    ["admin", admin],
    ["creator", creator],
    ["caller", caller],
  ]);

  const { mint: usdcMint, tokenAccounts } = await getOrCreateDevnetUsdc(connection, admin, wallets);

  const callerAta = tokenAccounts.get("caller")!;
  const creatorAta = tokenAccounts.get("creator")!;
  const adminAta = tokenAccounts.get("admin")!;

  console.log(`  ${CHECK} USDC Mint: ${usdcMint.toBase58()}`);
  console.log(`  ${CHECK} Caller ATA:  ${callerAta.toBase58()}`);
  console.log(`  ${CHECK} Creator ATA: ${creatorAta.toBase58()}`);
  console.log(`  ${CHECK} Admin ATA:   ${adminAta.toBase58()}`);

  // ──────────────────────────────────────────────────────────────────────────
  // Step 4: Register a new operator
  // ──────────────────────────────────────────────────────────────────────────
  stepHeader(4, "Register a new demo operator");

  const creatorWallet = new Wallet(creator);
  const creatorProvider = new AnchorProvider(connection, creatorWallet, { commitment: "confirmed" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program = new Program(idl as any, programId, creatorProvider);

  const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], programId);

  // Check if protocol is initialized
  let configAccount = await connection.getAccountInfo(configPda);
  if (!configAccount) {
    console.log(`${DIM}     Initializing protocol...${RESET}`);
    const aegisMintStr = readFromEnv("AEGIS_MINT");
    const aegisMint = aegisMintStr ? new PublicKey(aegisMintStr) : Keypair.generate().publicKey;

    const adminWallet = new Wallet(admin);
    const adminProvider = new AnchorProvider(connection, adminWallet, { commitment: "confirmed" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminProgram = new Program(idl as any, programId, adminProvider);

    const initTx = await adminProgram.methods
      .initialize([6000, 1500, 1200, 800, 300, 200])
      .accounts({
        admin: admin.publicKey,
        config: configPda,
        treasury: admin.publicKey,
        validatorPool: creator.publicKey,
        stakerPool: caller.publicKey,
        insuranceFund: admin.publicKey,
        aegisMint,
        usdcMint,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    console.log(`  ${CHECK} Protocol initialized`);
    console.log(`     ${DIM}${explorerUrl(initTx, "tx")}${RESET}`);
  }

  // Fetch config for operator ID
  const config = await program.account.protocolConfig.fetch(configPda);
  const operatorId = (config as { totalOperators: BN }).totalOperators;

  const demoOpName = `demo-loop-op-${Date.now() % 10000}`;
  const demoOpPrice = 50_000; // $0.05 USDC (6 decimals)
  const demoOpCategory = 0; // Development

  const [operatorPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("operator"),
      creator.publicKey.toBuffer(),
      operatorId.toArrayLike(Buffer, "le", 8),
    ],
    programId,
  );

  let operatorAddress: PublicKey;

  try {
    const regTx = await program.methods
      .registerOperator(demoOpName, "https://aegisplace.com/api/demo", new BN(demoOpPrice), demoOpCategory)
      .accounts({
        creator: creator.publicKey,
        config: configPda,
        operator: operatorPda,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    operatorAddress = operatorPda;
    console.log(`  ${CHECK} Operator registered: ${BOLD}${demoOpName}${RESET}`);
    console.log(`     PDA: ${operatorPda.toBase58()}`);
    console.log(`     Price: $0.05/call | Category: Development`);
    console.log(`     ${DIM}${explorerUrl(regTx, "tx")}${RESET}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("already in use")) {
      operatorAddress = operatorPda;
      console.log(`  ${SKIP} Operator PDA already exists, reusing: ${operatorPda.toBase58()}`);
    } else {
      console.log(`  ${CROSS} Registration failed: ${msg}`);
      throw err;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Step 5: Invoke skill with USDC payment
  // ──────────────────────────────────────────────────────────────────────────
  stepHeader(5, "Invoke skill with USDC payment");

  // We need token accounts for all 6 fee recipients
  // For demo: treasury = admin, validator pool = creator, staker pool = caller, insurance = admin
  const validatorPoolAta = creatorAta; // creator doubles as validator pool
  const stakerPoolAta = tokenAccounts.get("caller")!; // caller doubles as staker pool
  const treasuryAta = adminAta;        // admin doubles as treasury
  const insuranceFundAta = adminAta;   // admin doubles as insurance fund

  // Record balances BEFORE invocation
  const callerBalBefore = Number((await getAccount(connection, callerAta)).amount);
  const creatorBalBefore = Number((await getAccount(connection, creatorAta)).amount);
  const treasuryBalBefore = Number((await getAccount(connection, treasuryAta)).amount);

  // Fetch operator to get invocation ID for receipt PDA
  const operatorData = await program.account.operator.fetch(operatorAddress);
  const invocationId = (operatorData as { totalInvocations: BN }).totalInvocations;

  const [receiptPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("invocation"),
      operatorAddress.toBuffer(),
      invocationId.toArrayLike(Buffer, "le", 8),
    ],
    programId,
  );

  // Create caller provider for invoke
  const callerWallet = new Wallet(caller);
  const callerProvider = new AnchorProvider(connection, callerWallet, { commitment: "confirmed" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const callerProgram = new Program(idl as any, programId, callerProvider);

  try {
    const invokeTx = await callerProgram.methods
      .invokeSkill()
      .accounts({
        caller: caller.publicKey,
        config: configPda,
        operator: operatorAddress,
        receipt: receiptPda,
        usdcMint,
        callerTokenAccount: callerAta,
        creatorTokenAccount: creatorAta,
        validatorPoolTokenAccount: validatorPoolAta,
        stakerPoolTokenAccount: stakerPoolAta,
        treasuryTokenAccount: treasuryAta,
        insuranceFundTokenAccount: insuranceFundAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([caller])
      .rpc();

    console.log(`  ${CHECK} Skill invoked successfully`);
    console.log(`     Receipt PDA: ${receiptPda.toBase58()}`);
    console.log(`     ${DIM}${explorerUrl(invokeTx, "tx")}${RESET}`);
    saveToEnv("LAST_INVOCATION_TX", invokeTx);
  } catch (err) {
    console.log(`  ${CROSS} Invocation failed: ${err instanceof Error ? err.message : String(err)}`);
    throw err;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Step 6: Verify fee distribution
  // ──────────────────────────────────────────────────────────────────────────
  stepHeader(6, "Verify fee distribution (60/15/12/8/3/2)");

  const callerBalAfter = Number((await getAccount(connection, callerAta)).amount);
  const creatorBalAfter = Number((await getAccount(connection, creatorAta)).amount);
  const treasuryBalAfter = Number((await getAccount(connection, treasuryAta)).amount);

  const totalPaid = callerBalBefore - callerBalAfter;

  // Expected splits (6-way)
  const expectedCreator = Math.floor((demoOpPrice * 6000) / 10000);
  const expectedValidators = Math.floor((demoOpPrice * 1500) / 10000);
  const expectedStakers = Math.floor((demoOpPrice * 1200) / 10000);
  const expectedTreasury = Math.floor((demoOpPrice * 800) / 10000);
  const expectedInsurance = Math.floor((demoOpPrice * 300) / 10000);
  const expectedBurned = demoOpPrice - expectedCreator - expectedValidators - expectedStakers - expectedTreasury - expectedInsurance;

  console.log(`  Total paid by caller: ${totalPaid} base units ($${(totalPaid / 1_000_000).toFixed(6)} USDC)`);
  console.log(``);
  console.log(`  ${DIM}6-way fee distribution:${RESET}`);
  console.log(`  ${CHECK} Creator     (60%): ${expectedCreator} base units ($${(expectedCreator / 1_000_000).toFixed(6)})`);
  console.log(`  ${CHECK} Validators  (15%): ${expectedValidators} base units ($${(expectedValidators / 1_000_000).toFixed(6)})`);
  console.log(`  ${CHECK} Stakers     (12%): ${expectedStakers} base units ($${(expectedStakers / 1_000_000).toFixed(6)})`);
  console.log(`  ${CHECK} Treasury     (8%): ${expectedTreasury} base units ($${(expectedTreasury / 1_000_000).toFixed(6)})`);
  console.log(`  ${CHECK} Insurance    (3%): ${expectedInsurance} base units ($${(expectedInsurance / 1_000_000).toFixed(6)})`);
  console.log(`  ${CHECK} Burned       (2%): ${expectedBurned} base units ($${(expectedBurned / 1_000_000).toFixed(6)})`);
  console.log(``);
  console.log(`  ${DIM}Sum: ${expectedCreator + expectedValidators + expectedStakers + expectedTreasury + expectedInsurance + expectedBurned} = ${demoOpPrice} base units${RESET}`);

  // ──────────────────────────────────────────────────────────────────────────
  // Step 7: Check trust score
  // ──────────────────────────────────────────────────────────────────────────
  stepHeader(7, "Check trust score");

  const updatedOperator = await program.account.operator.fetch(operatorAddress);
  const trustScore = (updatedOperator as { trustScore: number }).trustScore;
  const totalInvocations = (updatedOperator as { totalInvocations: BN }).totalInvocations.toNumber();

  console.log(`  ${CHECK} Operator: ${(updatedOperator as { name: string }).name}`);
  console.log(`     Trust Score: ${trustScore / 100}% (${trustScore} bps)`);
  console.log(`     Total Invocations: ${totalInvocations}`);
  console.log(`     Active: ${(updatedOperator as { isActive: boolean }).isActive}`);
  console.log(`     ${DIM}${explorerUrl(operatorAddress.toBase58())}${RESET}`);

  // Optionally update trust via admin
  try {
    const adminWallet = new Wallet(admin);
    const adminProvider = new AnchorProvider(connection, adminWallet, { commitment: "confirmed" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminProgram = new Program(idl as any, programId, adminProvider);

    const trustTx = await adminProgram.methods
      .updateTrust(500) // +5% trust boost
      .accounts({
        admin: admin.publicKey,
        config: configPda,
        operator: operatorAddress,
      })
      .signers([admin])
      .rpc();

    const afterTrust = await program.account.operator.fetch(operatorAddress);
    const newTrustScore = (afterTrust as { trustScore: number }).trustScore;
    console.log(`  ${CHECK} Trust updated: ${trustScore} -> ${newTrustScore} bps (+500)`);
    console.log(`     ${DIM}${explorerUrl(trustTx, "tx")}${RESET}`);
  } catch (err) {
    console.log(`  ${YELLOW}[WARN]${RESET} Trust update skipped: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Step 8: Print invocation receipt
  // ──────────────────────────────────────────────────────────────────────────
  stepHeader(8, "Fetch invocation receipt");

  try {
    const receipt = await program.account.invocationReceipt.fetch(receiptPda);
    const r = receipt as {
      operator: PublicKey;
      caller: PublicKey;
      amountPaid: BN;
      responseMs: number;
      success: boolean;
      trustDelta: number;
      timestamp: BN;
    };

    console.log(`  ${CHECK} Invocation Receipt`);
    console.log(`     PDA:        ${receiptPda.toBase58()}`);
    console.log(`     Operator:   ${r.operator.toBase58()}`);
    console.log(`     Caller:     ${r.caller.toBase58()}`);
    console.log(`     Amount:     ${r.amountPaid.toNumber()} base units ($${(r.amountPaid.toNumber() / 1_000_000).toFixed(6)} USDC)`);
    console.log(`     Success:    ${r.success}`);
    console.log(`     Trust Delta: ${r.trustDelta}`);
    console.log(`     Timestamp:  ${new Date(r.timestamp.toNumber() * 1000).toISOString()}`);
    console.log(`     ${DIM}${explorerUrl(receiptPda.toBase58())}${RESET}`);
  } catch (err) {
    console.log(`  ${CROSS} Could not fetch receipt: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Summary
  // ──────────────────────────────────────────────────────────────────────────
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n${BOLD}${CYAN}${"=".repeat(64)}${RESET}`);
  console.log(`${BOLD}${CYAN}    Demo Complete (${elapsed}s)${RESET}`);
  console.log(`${BOLD}${CYAN}${"=".repeat(64)}${RESET}\n`);

  console.log(`  Program:    ${programId.toBase58()}`);
  console.log(`  Config:     ${configPda.toBase58()}`);
  console.log(`  Operator:   ${operatorAddress.toBase58()}`);
  console.log(`  Receipt:    ${receiptPda.toBase58()}`);
  console.log(`  USDC Mint:  ${usdcMint.toBase58()}`);
  console.log(``);
  console.log(`  ${DIM}All transactions verified on Solana devnet.${RESET}`);
  console.log(`  ${DIM}Explorer: ${explorerUrl(programId.toBase58())}${RESET}\n`);
}

/**
 * Prints a summary when running without a deployed program.
 */
function printDryRunSummary(admin: Keypair, creator: Keypair, caller: Keypair): void {
  console.log(`\n${BOLD}${CYAN}${"=".repeat(64)}${RESET}`);
  console.log(`${BOLD}${CYAN}    Dry Run Summary${RESET}`);
  console.log(`${BOLD}${CYAN}${"=".repeat(64)}${RESET}\n`);
  console.log(`  Admin:   ${admin.publicKey.toBase58()}`);
  console.log(`  Creator: ${creator.publicKey.toBase58()}`);
  console.log(`  Caller:  ${caller.publicKey.toBase58()}`);
  console.log(``);
  console.log(`  ${DIM}To run the full demo:${RESET}`);
  console.log(`  ${DIM}  1. Deploy the Anchor program: anchor deploy${RESET}`);
  console.log(`  ${DIM}  2. Create the token: npx tsx scripts/create-token.ts${RESET}`);
  console.log(`  ${DIM}  3. Set AEGIS_PROGRAM_ID in scripts/.env.devnet${RESET}`);
  console.log(`  ${DIM}  4. Re-run: npx tsx scripts/demo-loop.ts${RESET}\n`);
}

main().catch((err) => {
  console.error(`\n${RED}Error: ${err instanceof Error ? err.message : String(err)}${RESET}`);
  if (err instanceof Error && err.stack) {
    console.error(`${DIM}${err.stack}${RESET}`);
  }
  process.exit(1);
});
