import * as anchor from "@coral-xyz/anchor";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createAccount,
  createMint,
  getAccount,
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

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(
  process.env.AEGIS_PROGRAM_ID ?? aegisIdl.address,
);
const DEVNET_USDC_MINT = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");
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

async function ensureAirdrop(connection: Connection, publicKey: PublicKey, sol = 0.25) {
  const balance = await connection.getBalance(publicKey, "confirmed");
  if (balance >= sol * LAMPORTS_PER_SOL) return balance;

  try {
    const signature = await connection.requestAirdrop(publicKey, sol * LAMPORTS_PER_SOL);
    const latestBlockhash = await connection.getLatestBlockhash("confirmed");
    await connection.confirmTransaction(
      {
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      "confirmed",
    );
  } catch (error) {
    const refreshedBalance = await connection.getBalance(publicKey, "confirmed");
    if (refreshedBalance > 0) {
      return refreshedBalance;
    }
    throw error;
  }

  return connection.getBalance(publicKey, "confirmed");
}

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  const admin = loadAdminKeypair();

  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(admin),
    { commitment: "confirmed" },
  );
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

  const fundedBalance = await ensureAirdrop(connection, admin.publicKey);
  console.log(`Admin wallet: ${admin.publicKey.toBase58()}`);
  console.log(`Admin balance: ${fundedBalance / LAMPORTS_PER_SOL} SOL`);

  const usdcMint = DEVNET_USDC_MINT;
  const aegisMint = await createMint(
    connection,
    admin,
    admin.publicKey,
    null,
    9,
  );

  const treasury = await createAccount(connection, admin, usdcMint, admin.publicKey, Keypair.generate());
  const validatorPool = await createAccount(connection, admin, usdcMint, admin.publicKey, Keypair.generate());
  const stakerPool = await createAccount(connection, admin, usdcMint, admin.publicKey, Keypair.generate());
  const insuranceFund = await createAccount(connection, admin, usdcMint, admin.publicKey, Keypair.generate());

  await program.methods
    .initialize([...FEE_BPS])
    .accounts({
      admin: admin.publicKey,
      config: configPda,
      treasury,
      validatorPool,
      stakerPool,
      insuranceFund,
      aegisMint,
      usdcMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([admin])
    .rpc({ commitment: "confirmed" });

  const treasuryAccount = await getAccount(connection, treasury, "confirmed");
  const validatorAccount = await getAccount(connection, validatorPool, "confirmed");
  const stakerAccount = await getAccount(connection, stakerPool, "confirmed");
  const insuranceAccount = await getAccount(connection, insuranceFund, "confirmed");

  console.log(`Protocol initialized on ${RPC_URL}`);
  console.log(`Config PDA: ${configPda.toBase58()}`);
  console.log(`Program ID: ${PROGRAM_ID.toBase58()}`);
  console.log(`USDC Mint: ${usdcMint.toBase58()} (configured devnet payment mint)`);
  console.log(`AEGIS Mint: ${aegisMint.toBase58()}`);
  console.log(`Treasury Token Account: ${treasury.toBase58()} (owner ${treasuryAccount.owner.toBase58()})`);
  console.log(`Validator Pool Token Account: ${validatorPool.toBase58()} (owner ${validatorAccount.owner.toBase58()})`);
  console.log(`Staker Pool Token Account: ${stakerPool.toBase58()} (owner ${stakerAccount.owner.toBase58()})`);
  console.log(`Insurance Fund Token Account: ${insuranceFund.toBase58()} (owner ${insuranceAccount.owner.toBase58()})`);
  console.log(`Treasury Wallet Owner: ${admin.publicKey.toBase58()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});