import "dotenv/config";
import * as anchor from "@coral-xyz/anchor";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createAccount,
  createMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";

import aegisIdl from "../../target/idl/aegis.json";

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
const PROGRAM_ID = new PublicKey(process.env.AEGIS_PROGRAM_ID ?? aegisIdl.address);
const USDC_MINT = new PublicKey(
  process.env.USDC_MINT ?? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
);
const FEE_BPS = [8500, 1000, 0, 300, 150, 50] as const;

function getConfigPda(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], programId)[0];
}

function resolveKeypairPath(): string {
  const configured = process.env.SOLANA_KEYPAIR || process.env.ANCHOR_WALLET;
  if (configured?.trim()) {
    return configured.replace(/^~(?=$|[\\/])/, os.homedir());
  }
  return path.join(os.homedir(), ".config", "solana", "id.json");
}

function loadAdminKeypair(): Keypair {
  const keypairPath = resolveKeypairPath();
  const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

function envPubkey(name: string, fallback: PublicKey): PublicKey {
  const value = process.env[name]?.trim();
  if (!value) return fallback;
  return new PublicKey(value);
}

async function resolveAegisMint(connection: Connection, admin: Keypair): Promise<PublicKey> {
  const configuredMint = process.env.AEGIS_MINT?.trim();
  if (configuredMint) {
    const mint = new PublicKey(configuredMint);
    const info = await connection.getAccountInfo(mint, "confirmed");
    if (!info) throw new Error(`AEGIS_MINT is set but does not exist on-chain: ${mint.toBase58()}`);
    if (!info.owner.equals(TOKEN_PROGRAM_ID)) {
      throw new Error(`AEGIS_MINT must be an SPL Token mint owned by ${TOKEN_PROGRAM_ID.toBase58()}. Found owner ${info.owner.toBase58()}.`);
    }
    return mint;
  }

  return createMint(connection, admin, admin.publicKey, null, 9);
}

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  const admin = loadAdminKeypair();

  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(admin), {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const program = new anchor.Program(aegisIdl as anchor.Idl, provider);
  const configPda = getConfigPda(PROGRAM_ID);

  const existingConfig = await connection.getAccountInfo(configPda, "confirmed");
  if (existingConfig) {
    console.log(`Protocol config already exists at ${configPda.toBase58()}`);
    return;
  }

  const programInfo = await connection.getAccountInfo(PROGRAM_ID, "confirmed");
  if (!programInfo) {
    throw new Error(`Program ${PROGRAM_ID.toBase58()} is not deployed on ${RPC_URL}`);
  }

  const balance = await connection.getBalance(admin.publicKey, "confirmed");
  console.log(`Admin wallet: ${admin.publicKey.toBase58()}`);
  console.log(`Admin balance: ${balance / LAMPORTS_PER_SOL} SOL`);

  const aegisMint = await resolveAegisMint(connection, admin);

  const treasuryOwner = envPubkey("TREASURY_WALLET", admin.publicKey);
  const validatorOwner = envPubkey("VALIDATOR_POOL_OWNER", admin.publicKey);
  const stakerOwner = envPubkey("STAKER_POOL_OWNER", admin.publicKey);
  const insuranceOwner = envPubkey("INSURANCE_FUND_OWNER", admin.publicKey);

  const treasury = await createAccount(connection, admin, USDC_MINT, treasuryOwner, Keypair.generate());
  const validatorPool = await createAccount(connection, admin, USDC_MINT, validatorOwner, Keypair.generate());
  const stakerPool = await createAccount(connection, admin, USDC_MINT, stakerOwner, Keypair.generate());
  const insuranceFund = await createAccount(connection, admin, USDC_MINT, insuranceOwner, Keypair.generate());

  const signature = await program.methods
    .initialize([...FEE_BPS])
    .accounts({
      admin: admin.publicKey,
      config: configPda,
      treasury,
      validatorPool,
      stakerPool,
      insuranceFund,
      aegisMint,
      usdcMint: USDC_MINT,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([admin])
    .rpc({ commitment: "confirmed" });

  console.log(`Initialized mainnet protocol config.`);
  console.log(`Tx: ${signature}`);
  console.log(`Config PDA: ${configPda.toBase58()}`);
  console.log(`USDC Mint: ${USDC_MINT.toBase58()}`);
  console.log(`AEGIS Mint: ${aegisMint.toBase58()}`);
  console.log(`Treasury Token Account: ${treasury.toBase58()} (owner ${treasuryOwner.toBase58()})`);
  console.log(`Validator Pool Token Account: ${validatorPool.toBase58()} (owner ${validatorOwner.toBase58()})`);
  console.log(`Staker Pool Token Account: ${stakerPool.toBase58()} (owner ${stakerOwner.toBase58()})`);
  console.log(`Insurance Fund Token Account: ${insuranceFund.toBase58()} (owner ${insuranceOwner.toBase58()})`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
