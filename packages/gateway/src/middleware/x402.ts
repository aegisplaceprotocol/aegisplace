/**
 * x402 Payment Verification Middleware
 *
 * Decodes X-Payment-Signature header (base64 JSON), verifies the
 * referenced Solana USDC transfer on-chain, and returns a structured
 * verification result.
 *
 * Header format (base64-encoded JSON):
 * {
 *   "txSignature": "<solana tx sig>",
 *   "sender": "<wallet pubkey>",
 *   "amount": "250000",       // lamport-scale USDC (6 decimals)
 *   "currency": "USDC",
 *   "network": "solana"
 * }
 */

import {
  Connection,
  type ParsedTransactionWithMeta,
} from "@solana/web3.js";

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const TREASURY_WALLET = process.env.TREASURY_WALLET ?? "";
const USDC_MINT = process.env.USDC_MINT ?? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDC_DECIMALS = 6;

let _connection: Connection | null = null;
function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(SOLANA_RPC_URL, "confirmed");
  }
  return _connection;
}

export interface PaymentHeader {
  txSignature: string;
  sender: string;
  amount: string;
  currency: string;
  network: string;
}

export interface PaymentVerification {
  verified: boolean;
  txSignature: string;
  sender: string;
  amountUsdc: number;
  error?: string;
}

/**
 * Decode the X-Payment-Signature header from base64 JSON.
 */
export function decodePaymentHeader(headerValue: string): PaymentHeader | null {
  try {
    const decoded = Buffer.from(headerValue, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);

    if (
      typeof parsed.txSignature !== "string" ||
      typeof parsed.sender !== "string" ||
      typeof parsed.amount !== "string"
    ) {
      return null;
    }

    return {
      txSignature: parsed.txSignature,
      sender: parsed.sender,
      amount: parsed.amount,
      currency: parsed.currency ?? "USDC",
      network: parsed.network ?? "solana",
    };
  } catch {
    return null;
  }
}

/**
 * Build the X-Payment-Required header value for a 402 response.
 */
export function buildPaymentRequiredHeader(amountBaseUnits: string, recipient?: string): string {
  return JSON.stringify({
    amount: amountBaseUnits,
    currency: "USDC",
    network: "solana",
    recipient: recipient ?? TREASURY_WALLET,
  });
}

/**
 * Build the X-Payment-Response header for successful payment.
 */
export function buildPaymentResponseHeader(txSignature: string, settled: boolean): string {
  return JSON.stringify({
    txSignature,
    settled,
  });
}

/**
 * Verify an on-chain USDC transfer matches the expected payment.
 *
 * Checks:
 * 1. Transaction exists and is confirmed
 * 2. Transaction has no errors
 * 3. Contains a USDC token transfer
 * 4. Transfer amount matches expected amount
 * 5. Sender matches the declared sender
 * 6. Recipient matches the treasury wallet
 */
export async function verifyPaymentOnChain(
  payment: PaymentHeader,
  expectedAmountBaseUnits: number,
  treasuryWallet?: string,
): Promise<PaymentVerification> {
  const recipient = treasuryWallet ?? TREASURY_WALLET;
  const amountUsdc = expectedAmountBaseUnits / Math.pow(10, USDC_DECIMALS);

  try {
    const connection = getConnection();

    let tx: ParsedTransactionWithMeta | null;
    try {
      tx = await connection.getParsedTransaction(payment.txSignature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return {
        verified: false,
        txSignature: payment.txSignature,
        sender: payment.sender,
        amountUsdc,
        error: `Failed to fetch transaction: ${message}`,
      };
    }

    if (!tx) {
      return {
        verified: false,
        txSignature: payment.txSignature,
        sender: payment.sender,
        amountUsdc,
        error: "Transaction not found. It may not be confirmed yet.",
      };
    }

    if (tx.meta?.err) {
      return {
        verified: false,
        txSignature: payment.txSignature,
        sender: payment.sender,
        amountUsdc,
        error: `Transaction failed on-chain: ${JSON.stringify(tx.meta.err)}`,
      };
    }

    // Look for USDC token transfers
    const allInstructions = [
      ...(tx.transaction.message.instructions || []),
      ...(tx.meta?.innerInstructions?.flatMap((ix) => ix.instructions) || []),
    ];

    const tolerance = Math.max(1, Math.round(expectedAmountBaseUnits * 0.01));
    let matchingTransferFound = false;

    for (const ix of allInstructions) {
      if ("parsed" in ix && ix.parsed) {
        const parsed = ix.parsed as Record<string, unknown>;
        const type = parsed.type as string;

        if (type === "transfer" || type === "transferChecked") {
          const info = parsed.info as Record<string, unknown>;
          if (!info) continue;

          if (type === "transferChecked" && info.mint !== USDC_MINT) {
            continue;
          }

          const tokenAmount = info.tokenAmount as { amount?: string } | undefined;
          const rawAmount = type === "transferChecked"
            ? tokenAmount?.amount
            : info.amount as string;
          const amount = parseInt(rawAmount ?? "0", 10);
          if (isNaN(amount)) continue;

          if (Math.abs(amount - expectedAmountBaseUnits) > tolerance) continue;

          const senderAuthority = (info.authority ?? info.source) as string;
          if (senderAuthority === payment.sender) {
            // Verify destination belongs to treasury via post token balances
            const destination = info.destination as string;
            if (verifyDestinationOwner(tx, destination, recipient)) {
              matchingTransferFound = true;
              break;
            }
          }
        }
      }
    }

    // Fallback: check pre/post token balances
    if (!matchingTransferFound && tx.meta?.preTokenBalances && tx.meta?.postTokenBalances) {
      const preBalances = tx.meta.preTokenBalances.filter((b) => b.mint === USDC_MINT);
      const postBalances = tx.meta.postTokenBalances.filter((b) => b.mint === USDC_MINT);

      let treasuryReceived = 0;
      let callerSent = 0;

      for (const post of postBalances) {
        if (post.owner === recipient) {
          const pre = preBalances.find((p) => p.accountIndex === post.accountIndex);
          const preAmount = parseInt(pre?.uiTokenAmount?.amount ?? "0", 10);
          const postAmount = parseInt(post.uiTokenAmount?.amount ?? "0", 10);
          treasuryReceived += postAmount - preAmount;
        }
        if (post.owner === payment.sender) {
          const pre = preBalances.find((p) => p.accountIndex === post.accountIndex);
          const preAmount = parseInt(pre?.uiTokenAmount?.amount ?? "0", 10);
          const postAmount = parseInt(post.uiTokenAmount?.amount ?? "0", 10);
          callerSent += preAmount - postAmount;
        }
      }

      if (
        treasuryReceived > 0 &&
        Math.abs(treasuryReceived - expectedAmountBaseUnits) <= tolerance &&
        callerSent > 0
      ) {
        matchingTransferFound = true;
      }
    }

    if (!matchingTransferFound) {
      return {
        verified: false,
        txSignature: payment.txSignature,
        sender: payment.sender,
        amountUsdc,
        error: `No matching USDC transfer found. Expected ~${amountUsdc} USDC from ${payment.sender} to ${recipient}.`,
      };
    }

    return {
      verified: true,
      txSignature: payment.txSignature,
      sender: payment.sender,
      amountUsdc,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      verified: false,
      txSignature: payment.txSignature,
      sender: payment.sender,
      amountUsdc,
      error: `Payment verification error: ${message}`,
    };
  }
}

/**
 * Check if a token account destination is owned by the expected wallet.
 */
function verifyDestinationOwner(
  tx: ParsedTransactionWithMeta,
  destinationTokenAccount: string,
  expectedOwner: string,
): boolean {
  const accountKeys = tx.transaction.message.accountKeys.map((k) =>
    typeof k === "string" ? k : k.pubkey.toBase58(),
  );

  const destIndex = accountKeys.indexOf(destinationTokenAccount);
  if (destIndex === -1) {
    return (
      tx.meta?.postTokenBalances?.some(
        (b) => b.mint === USDC_MINT && b.owner === expectedOwner,
      ) ?? false
    );
  }

  const postBalance = tx.meta?.postTokenBalances?.find(
    (b) => b.accountIndex === destIndex && b.mint === USDC_MINT,
  );

  return postBalance?.owner === expectedOwner;
}
