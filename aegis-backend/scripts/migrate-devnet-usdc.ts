import * as anchor from "@coral-xyz/anchor";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  createAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
} from "@solana/web3.js";

import aegisIdl from "../../target/idl/aegis.json";
import { deriveConfigPda, getDecodedProtocolConfig } from "../src/solana";

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(process.env.AEGIS_PROGRAM_ID ?? aegisIdl.address);
const DEVNET_PAYMENT_MINT = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");

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
  const configPda = deriveConfigPda();
  const config = await getDecodedProtocolConfig(configPda.toBase58());

  if (config.admin !== admin.publicKey.toBase58()) {
    throw new Error(
      `Loaded wallet ${admin.publicKey.toBase58()} is not the protocol admin ${config.admin}.`,
    );
  }

  if (config.usdcMint === DEVNET_PAYMENT_MINT.toBase58()) {
    console.log(JSON.stringify({
      migrated: false,
      reason: "Protocol already uses the configured devnet payment mint.",
      configPda: configPda.toBase58(),
      usdcMint: config.usdcMint,
    }, null, 2));
    return;
  }

  const treasury = await createAccount(connection, admin, DEVNET_PAYMENT_MINT, admin.publicKey, Keypair.generate());
  const validatorPool = await createAccount(connection, admin, DEVNET_PAYMENT_MINT, admin.publicKey, Keypair.generate());
  const stakerPool = await createAccount(connection, admin, DEVNET_PAYMENT_MINT, admin.publicKey, Keypair.generate());
  const insuranceFund = await createAccount(connection, admin, DEVNET_PAYMENT_MINT, admin.publicKey, Keypair.generate());

  const signature = await program.methods
    .updateConfig(
      null,
      treasury,
      validatorPool,
      stakerPool,
      insuranceFund,
      DEVNET_PAYMENT_MINT,
    )
    .accounts({
      config: configPda,
      admin: admin.publicKey,
    })
    .remainingAccounts([
      { pubkey: treasury, isSigner: false, isWritable: false },
      { pubkey: validatorPool, isSigner: false, isWritable: false },
      { pubkey: stakerPool, isSigner: false, isWritable: false },
      { pubkey: insuranceFund, isSigner: false, isWritable: false },
    ])
    .signers([admin])
    .rpc({ commitment: "confirmed" });

  console.log(JSON.stringify({
    migrated: true,
    signature,
    configPda: configPda.toBase58(),
    previousUsdcMint: config.usdcMint,
    usdcMint: DEVNET_PAYMENT_MINT.toBase58(),
    treasury: treasury.toBase58(),
    validatorPool: validatorPool.toBase58(),
    stakerPool: stakerPool.toBase58(),
    insuranceFund: insuranceFund.toBase58(),
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});