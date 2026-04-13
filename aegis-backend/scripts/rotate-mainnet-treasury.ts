import "dotenv/config";
import * as anchor from "@coral-xyz/anchor";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";

import aegisIdl from "../../target/idl/aegis.json";

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
const PROGRAM_ID = new PublicKey(process.env.AEGIS_PROGRAM_ID ?? aegisIdl.address);
const USDC_MINT = new PublicKey(
  process.env.USDC_MINT ?? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
);
const TREASURY_OWNER = new PublicKey(process.env.TREASURY_WALLET ?? "");

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

async function main() {
  if (!process.env.TREASURY_WALLET?.trim()) {
    throw new Error("TREASURY_WALLET must be set to the treasury owner wallet you control.");
  }

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
  const config = await program.account.protocolConfig.fetch(configPda);

  if ((config.admin as PublicKey).toBase58() !== admin.publicKey.toBase58()) {
    throw new Error(
      `Loaded signer ${admin.publicKey.toBase58()} is not the protocol admin ${(config.admin as PublicKey).toBase58()}`,
    );
  }

  const balance = await connection.getBalance(admin.publicKey, "confirmed");
  console.log(`Admin wallet: ${admin.publicKey.toBase58()}`);
  console.log(`Admin balance: ${balance / LAMPORTS_PER_SOL} SOL`);

  const treasuryAta = await getOrCreateAssociatedTokenAccount(
    connection,
    admin,
    USDC_MINT,
    TREASURY_OWNER,
  );

  const currentTreasury = (config.treasury as PublicKey).toBase58();
  const validatorPool = (config.validatorPool as PublicKey).toBase58();
  const stakerPool = (config.stakerPool as PublicKey).toBase58();
  const insuranceFund = (config.insuranceFund as PublicKey).toBase58();

  if (currentTreasury === treasuryAta.address.toBase58()) {
    console.log(`Treasury already points to ${currentTreasury}`);
    return;
  }

  const signature = await program.methods
    .updateConfig(
      null,
      treasuryAta.address,
      null,
      null,
      null,
      null,
    )
    .accounts({
      config: configPda,
      admin: admin.publicKey,
    })
    .remainingAccounts([
      { pubkey: treasuryAta.address, isSigner: false, isWritable: false },
      { pubkey: new PublicKey(validatorPool), isSigner: false, isWritable: false },
      { pubkey: new PublicKey(stakerPool), isSigner: false, isWritable: false },
      { pubkey: new PublicKey(insuranceFund), isSigner: false, isWritable: false },
    ])
    .signers([admin])
    .rpc({ commitment: "confirmed" });

  console.log("Treasury rotation complete.");
  console.log(`Tx: ${signature}`);
  console.log(`Old treasury token account: ${currentTreasury}`);
  console.log(`New treasury owner wallet: ${TREASURY_OWNER.toBase58()}`);
  console.log(`New treasury token account: ${treasuryAta.address.toBase58()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
