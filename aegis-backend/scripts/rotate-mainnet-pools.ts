import "dotenv/config";
import * as anchor from "@coral-xyz/anchor";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

import aegisIdl from "../../target/idl/aegis.json";

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
const PROGRAM_ID = new PublicKey(process.env.AEGIS_PROGRAM_ID ?? aegisIdl.address);
const USDC_MINT = new PublicKey(
  process.env.USDC_MINT ?? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
);

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

function optionalPublicKey(value: string | undefined): PublicKey | null {
  const trimmed = value?.trim();
  return trimmed ? new PublicKey(trimmed) : null;
}

async function main() {
  const validatorOwner = optionalPublicKey(process.env.VALIDATOR_POOL_OWNER);
  const insuranceOwner = optionalPublicKey(process.env.INSURANCE_FUND_OWNER);

  if (!validatorOwner && !insuranceOwner) {
    throw new Error("Set VALIDATOR_POOL_OWNER and/or INSURANCE_FUND_OWNER in the environment.");
  }

  const connection = new Connection(RPC_URL, "confirmed");
  const admin = loadAdminKeypair();
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(admin), {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const program = new anchor.Program(aegisIdl as anchor.Idl, provider);
  const configPda = getConfigPda(PROGRAM_ID);
  const config = await program.account.protocolConfig.fetch(configPda);

  if ((config.admin as PublicKey).toBase58() !== admin.publicKey.toBase58()) {
    throw new Error(
      `Loaded signer ${admin.publicKey.toBase58()} is not the protocol admin ${(config.admin as PublicKey).toBase58()}`,
    );
  }

  const balance = await connection.getBalance(admin.publicKey, "confirmed");
  console.log(`Admin wallet: ${admin.publicKey.toBase58()}`);
  console.log(`Admin balance: ${balance / LAMPORTS_PER_SOL} SOL`);

  const treasury = config.treasury as PublicKey;
  const stakerPool = config.stakerPool as PublicKey;
  let nextValidatorPool = config.validatorPool as PublicKey;
  let nextInsuranceFund = config.insuranceFund as PublicKey;

  if (validatorOwner) {
    const validatorAta = await getOrCreateAssociatedTokenAccount(
      connection,
      admin,
      USDC_MINT,
      validatorOwner,
    );
    nextValidatorPool = validatorAta.address;
    console.log(`Validator pool owner: ${validatorOwner.toBase58()}`);
    console.log(`Validator pool token account: ${validatorAta.address.toBase58()}`);
  }

  if (insuranceOwner) {
    const insuranceAta = await getOrCreateAssociatedTokenAccount(
      connection,
      admin,
      USDC_MINT,
      insuranceOwner,
    );
    nextInsuranceFund = insuranceAta.address;
    console.log(`Insurance fund owner: ${insuranceOwner.toBase58()}`);
    console.log(`Insurance fund token account: ${insuranceAta.address.toBase58()}`);
  }

  const signature = await program.methods
    .updateConfig(
      null,
      null,
      nextValidatorPool,
      null,
      nextInsuranceFund,
      null,
    )
    .accounts({
      config: configPda,
      admin: admin.publicKey,
    })
    .remainingAccounts([
      { pubkey: treasury, isSigner: false, isWritable: false },
      { pubkey: nextValidatorPool, isSigner: false, isWritable: false },
      { pubkey: stakerPool, isSigner: false, isWritable: false },
      { pubkey: nextInsuranceFund, isSigner: false, isWritable: false },
    ])
    .signers([admin])
    .rpc({ commitment: "confirmed" });

  console.log("Pool rotation complete.");
  console.log(`Tx: ${signature}`);
  console.log(`Treasury token account: ${treasury.toBase58()}`);
  console.log(`Validator pool token account: ${nextValidatorPool.toBase58()}`);
  console.log(`Staker pool token account: ${stakerPool.toBase58()}`);
  console.log(`Insurance fund token account: ${nextInsuranceFund.toBase58()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
