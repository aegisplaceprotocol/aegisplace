/**
 * Solana payment verification for Aegis Protocol.
 * Verifies USDC SPL token transfers on the configured Solana cluster.
 */

import { Connection, ParsedTransactionWithMeta, PublicKey, SystemProgram } from "@solana/web3.js";
import { ENV } from "./_core/env";
import {
  decodeOperatorAccount,
  decodeInvocationReceiptAccount,
  decodeProtocolConfigAccount,
} from "./aegis-program";

const CLUSTER_USDC_MINTS: Record<string, string> = {
  "mainnet-beta": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  devnet: "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr",
  testnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
};

const CLUSTER_NETWORK_IDS: Record<string, string> = {
  "mainnet-beta": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  devnet: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
  testnet: "solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z",
};

const USDC_DECIMALS = 6;

export interface PaymentVerificationResult {
  verified: boolean;
  error?: string;
  receiptPda?: string;
}

export interface ProtocolConfigSnapshot {
  address: string;
  totalOperators: number;
}

export interface SkillRegistrationPlan {
  cluster: string;
  rpcUrl: string;
  programId: string;
  configPda: string;
  operatorPda: string;
  operatorId: number;
  metadataUri: string;
  accounts: Array<{
    pubkey: string;
    isSigner: boolean;
    isWritable: boolean;
  }>;
}

export interface ProgramPaymentVerificationParams {
  txSignature: string;
  expectedAmount: number;
  callerWallet: string;
  programId: string;
  operatorPda: string;
  configPda: string;
  receiptPda?: string;
}

let connection: Connection | null = null;

export function getUsdcMintForCluster(cluster = ENV.solanaCluster): string {
  if (ENV.usdcMint) return ENV.usdcMint;
  return CLUSTER_USDC_MINTS[cluster] || CLUSTER_USDC_MINTS.devnet;
}

export function getSolanaNetworkId(cluster = ENV.solanaCluster): string {
  return CLUSTER_NETWORK_IDS[cluster] || CLUSTER_NETWORK_IDS.devnet;
}

function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(ENV.solanaRpcUrl, "confirmed");
  }
  return connection;
}

export function getAegisProgramId(): PublicKey {
  return new PublicKey(ENV.aegisProgramId);
}

export function deriveConfigPda(programId = getAegisProgramId()): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], programId)[0];
}

export function deriveOperatorPda(
  creatorWallet: string,
  operatorId: number | bigint,
  programId = getAegisProgramId(),
): PublicKey {
  const creator = new PublicKey(creatorWallet);
  const operatorIdBytes = Buffer.alloc(8);
  operatorIdBytes.writeBigUInt64LE(BigInt(operatorId));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("operator"), creator.toBuffer(), operatorIdBytes],
    programId,
  )[0];
}

export async function getProtocolConfigSnapshot(): Promise<ProtocolConfigSnapshot> {
  const client = getConnection();
  const configPda = deriveConfigPda();
  const accountInfo = await client.getAccountInfo(configPda, "confirmed");

  if (!accountInfo) {
    throw new Error(
      `Aegis protocol config not found at ${configPda.toBase58()}. Initialize the program before registering skills.`,
    );
  }

  if (accountInfo.data.length < 240) {
    throw new Error("Aegis protocol config account is smaller than expected");
  }

  const totalOperators = Number(accountInfo.data.readBigUInt64LE(232));

  return {
    address: configPda.toBase58(),
    totalOperators,
  };
}

export async function prepareSkillRegistrationPlan(params: {
  creatorWallet: string;
  slug: string;
  apiBaseUrl: string;
}): Promise<SkillRegistrationPlan> {
  const config = await getProtocolConfigSnapshot();
  const programId = getAegisProgramId();
  const operatorPda = deriveOperatorPda(params.creatorWallet, config.totalOperators, programId);
  const metadataUri = `${params.apiBaseUrl.replace(/\/$/, "")}/api/v1/skills/${params.slug}/metadata`;

  return {
    cluster: ENV.solanaCluster,
    rpcUrl: ENV.solanaRpcUrl,
    programId: programId.toBase58(),
    configPda: config.address,
    operatorPda: operatorPda.toBase58(),
    operatorId: config.totalOperators,
    metadataUri,
    accounts: [
      { pubkey: params.creatorWallet, isSigner: true, isWritable: true },
      { pubkey: config.address, isSigner: false, isWritable: true },
      { pubkey: operatorPda.toBase58(), isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId.toBase58(), isSigner: false, isWritable: false },
    ],
  };
}

export async function verifyPayment(
  txSignature: string,
  expectedAmount: number,
  callerWallet: string,
  treasuryWallet: string,
): Promise<PaymentVerificationResult> {
  try {
    const client = getConnection();
    const usdcMint = getUsdcMintForCluster();

    let tx: ParsedTransactionWithMeta | null;
    try {
      tx = await client.getParsedTransaction(txSignature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });
    } catch (err: any) {
      return { verified: false, error: `Failed to fetch transaction: ${err.message}` };
    }

    if (!tx) {
      return { verified: false, error: "Transaction not found. It may not be confirmed yet." };
    }

    if (tx.meta?.err) {
      return { verified: false, error: `Transaction failed on-chain: ${JSON.stringify(tx.meta.err)}` };
    }

    const allInstructions = [
      ...(tx.transaction.message.instructions || []),
      ...(tx.meta?.innerInstructions?.flatMap((ix) => ix.instructions) || []),
    ];

    const expectedBaseUnits = Math.round(expectedAmount * Math.pow(10, USDC_DECIMALS));
    const tolerance = Math.max(1, Math.round(expectedBaseUnits * 0.01));
    let matchingTransferFound = false;

    for (const ix of allInstructions) {
      if (!("parsed" in ix) || !ix.parsed) continue;

      const parsed = ix.parsed as any;
      const type = parsed.type;
      if (type !== "transfer" && type !== "transferChecked") continue;

      const info = parsed.info;
      if (!info) continue;

      if (type === "transferChecked" && info.mint !== usdcMint) continue;

      const amount = parseInt(
        type === "transferChecked" ? info.tokenAmount?.amount : info.amount,
        10,
      );
      if (isNaN(amount)) continue;
      if (Math.abs(amount - expectedBaseUnits) > tolerance) continue;

      const senderAuthority = info.authority || info.source;
      const destination = info.destination;
      if (senderAuthority !== callerWallet) continue;

      if (verifyDestinationOwner(tx, destination, treasuryWallet, usdcMint)) {
        matchingTransferFound = true;
        break;
      }
    }

    if (!matchingTransferFound && tx.meta?.preTokenBalances && tx.meta?.postTokenBalances) {
      const preBalances = tx.meta.preTokenBalances.filter((b) => b.mint === usdcMint);
      const postBalances = tx.meta.postTokenBalances.filter((b) => b.mint === usdcMint);

      let treasuryReceived = 0;
      let callerSent = 0;

      for (const post of postBalances) {
        if (post.owner === treasuryWallet) {
          const pre = preBalances.find((p) => p.accountIndex === post.accountIndex);
          const preAmount = parseInt(pre?.uiTokenAmount?.amount || "0", 10);
          const postAmount = parseInt(post.uiTokenAmount?.amount || "0", 10);
          treasuryReceived += postAmount - preAmount;
        }

        if (post.owner === callerWallet) {
          const pre = preBalances.find((p) => p.accountIndex === post.accountIndex);
          const preAmount = parseInt(pre?.uiTokenAmount?.amount || "0", 10);
          const postAmount = parseInt(post.uiTokenAmount?.amount || "0", 10);
          callerSent += preAmount - postAmount;
        }
      }

      if (
        treasuryReceived > 0 &&
        Math.abs(treasuryReceived - expectedBaseUnits) <= tolerance &&
        callerSent > 0
      ) {
        matchingTransferFound = true;
      }
    }

    if (!matchingTransferFound) {
      return {
        verified: false,
        error: `No matching USDC transfer found. Expected ~${expectedAmount} USDC from ${callerWallet} to ${treasuryWallet}.`,
      };
    }

    return { verified: true };
  } catch (err: any) {
    return { verified: false, error: `Payment verification error: ${err.message}` };
  }
}

function verifyDestinationOwner(
  tx: ParsedTransactionWithMeta,
  destinationTokenAccount: string,
  expectedOwner: string,
  usdcMint: string,
): boolean {
  const accountKeys = tx.transaction.message.accountKeys.map((key) =>
    typeof key === "string" ? key : key.pubkey.toBase58(),
  );

  const destIndex = accountKeys.indexOf(destinationTokenAccount);
  if (destIndex === -1) {
    return tx.meta?.postTokenBalances?.some(
      (balance) => balance.mint === usdcMint && balance.owner === expectedOwner,
    ) ?? false;
  }

  const postBalance = tx.meta?.postTokenBalances?.find(
    (balance) => balance.accountIndex === destIndex && balance.mint === usdcMint,
  );

  return postBalance?.owner === expectedOwner;
}

export async function getDecodedProtocolConfig(configPda: string): Promise<ReturnType<typeof decodeProtocolConfigAccount>> {
  const client = getConnection();
  const accountInfo = await client.getAccountInfo(new PublicKey(configPda), "confirmed");

  if (!accountInfo) {
    throw new Error(`Aegis protocol config not found at ${configPda}`);
  }

  return decodeProtocolConfigAccount(accountInfo.data);
}

export async function getDecodedOperator(operatorPda: string): Promise<ReturnType<typeof decodeOperatorAccount>> {
  const client = getConnection();
  const accountInfo = await client.getAccountInfo(new PublicKey(operatorPda), "confirmed");

  if (!accountInfo) {
    throw new Error(`Aegis operator account not found at ${operatorPda}`);
  }

  return decodeOperatorAccount(accountInfo.data);
}

export async function verifyProgramPayment(
  params: ProgramPaymentVerificationParams,
): Promise<PaymentVerificationResult> {
  try {
    const client = getConnection();
    const tx = await client.getParsedTransaction(params.txSignature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });

    if (!tx) {
      return { verified: false, error: "Transaction not found. It may not be confirmed yet." };
    }

    if (tx.meta?.err) {
      return { verified: false, error: `Transaction failed on-chain: ${JSON.stringify(tx.meta.err)}` };
    }

    const programId = new PublicKey(params.programId).toBase58();
    const operatorPda = new PublicKey(params.operatorPda).toBase58();
    const configPda = new PublicKey(params.configPda).toBase58();
    const callerWallet = new PublicKey(params.callerWallet).toBase58();
    const explicitReceiptPda = params.receiptPda ? new PublicKey(params.receiptPda).toBase58() : null;

    const accountKeys = tx.transaction.message.accountKeys.map((key) =>
      typeof key === "string" ? key : key.pubkey.toBase58(),
    );

    if (!accountKeys.includes(programId)) {
      return { verified: false, error: `Transaction does not reference Aegis program ${programId}.` };
    }

    for (const required of [operatorPda, configPda, callerWallet]) {
      if (!accountKeys.includes(required)) {
        return { verified: false, error: `Transaction is missing required account ${required}.` };
      }
    }

    const config = await getDecodedProtocolConfig(configPda);
    const expectedAmountBaseUnits = BigInt(Math.round(params.expectedAmount * 1_000_000));

    const excludedAccounts = new Set([
      programId,
      operatorPda,
      configPda,
      callerWallet,
      config.treasury,
      config.validatorPool,
      config.stakerPool,
      config.insuranceFund,
    ]);
    const receiptCandidates = explicitReceiptPda
      ? [explicitReceiptPda]
      : accountKeys.filter((account) => !excludedAccounts.has(account));

    let matchedReceiptPda: string | null = null;
    let matchedReceipt: ReturnType<typeof decodeInvocationReceiptAccount> | null = null;

    for (const candidate of receiptCandidates) {
      const receiptInfo = await client.getAccountInfo(new PublicKey(candidate), "confirmed");
      if (!receiptInfo || !receiptInfo.owner.equals(new PublicKey(programId))) {
        continue;
      }

      try {
        const decoded = decodeInvocationReceiptAccount(receiptInfo.data);
        if (
          decoded.operator === operatorPda &&
          decoded.caller === callerWallet &&
          decoded.amountPaid === expectedAmountBaseUnits
        ) {
          matchedReceiptPda = candidate;
          matchedReceipt = decoded;
          break;
        }
      } catch {
        // Ignore other Aegis-owned accounts that are not invocation receipts.
      }
    }

    if (!matchedReceiptPda || !matchedReceipt) {
      return {
        verified: false,
        error: explicitReceiptPda
          ? `Invocation receipt ${explicitReceiptPda} was not created or does not match the transaction.`
          : "Could not locate a matching invocation receipt in the confirmed Aegis transaction.",
      };
    }

    if (matchedReceipt.operator !== operatorPda) {
      return { verified: false, error: `Receipt operator ${matchedReceipt.operator} does not match expected operator ${operatorPda}.` };
    }

    if (matchedReceipt.caller !== callerWallet) {
      return { verified: false, error: `Receipt caller ${matchedReceipt.caller} does not match expected payer ${callerWallet}.` };
    }

    if (matchedReceipt.amountPaid !== expectedAmountBaseUnits) {
      return {
        verified: false,
        error: `Receipt amount ${matchedReceipt.amountPaid.toString()} does not match expected ${expectedAmountBaseUnits.toString()} base units.`,
      };
    }

    const sawConfiguredAccount = [config.treasury, config.validatorPool, config.stakerPool, config.insuranceFund]
      .every((account) => accountKeys.includes(account));

    if (!sawConfiguredAccount) {
      return {
        verified: false,
        error: "Transaction did not touch the configured protocol settlement token accounts.",
      };
    }

    return { verified: true, receiptPda: matchedReceiptPda };
  } catch (err: any) {
    return { verified: false, error: `Program payment verification error: ${err.message}` };
  }
}