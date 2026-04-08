import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
} from "@solana/web3.js";

import { deriveConfigPda, getDecodedProtocolConfig } from "../src/solana";

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const DEFAULT_AMOUNT = 100;
const DEFAULT_DEVNET_USDC_MINT = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";

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
  const walletArg = process.argv[2];
  const amountArg = process.argv[3];

  if (!walletArg) {
    throw new Error("Usage: pnpm fund:devnet-usdc -- <wallet-address> [amount]");
  }

  const recipient = new PublicKey(walletArg);
  const amount = amountArg ? Number(amountArg) : DEFAULT_AMOUNT;

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number of USDC units.");
  }

  const connection = new Connection(RPC_URL, "confirmed");
  const admin = loadAdminKeypair();
  const configPda = deriveConfigPda().toBase58();
  const config = await getDecodedProtocolConfig(configPda);
  const mint = new PublicKey(config.usdcMint);
  const mintInfo = await getMint(connection, mint, "confirmed");

  if (mint.toBase58() === DEFAULT_DEVNET_USDC_MINT) {
    throw new Error(
      `Protocol is using the configured devnet payment mint (${DEFAULT_DEVNET_USDC_MINT}). This faucet only works for custom test mints controlled by the loaded admin wallet.`,
    );
  }

  if (!mintInfo.mintAuthority || !mintInfo.mintAuthority.equals(admin.publicKey)) {
    throw new Error(
      `Loaded wallet ${admin.publicKey.toBase58()} is not the mint authority for ${mint.toBase58()}.`,
    );
  }

  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    admin,
    mint,
    recipient,
  );

  const baseUnits = BigInt(Math.round(amount * 10 ** mintInfo.decimals));
  const signature = await mintTo(
    connection,
    admin,
    mint,
    ata.address,
    admin,
    baseUnits,
  );

  console.log(JSON.stringify({
    recipient: recipient.toBase58(),
    ata: ata.address.toBase58(),
    usdcMint: mint.toBase58(),
    amount,
    decimals: mintInfo.decimals,
    signature,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});