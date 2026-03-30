/**
 * Solana payment verification for Aegis Protocol.
 * Verifies USDC SPL token transfers on Solana mainnet.
 */

import { Connection, ParsedTransactionWithMeta } from "@solana/web3.js";
import { ENV } from "./_core/env";

/** USDC mint address on Solana mainnet */
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

/** USDC has 6 decimal places */
const USDC_DECIMALS = 6;

export interface PaymentVerificationResult {
  verified: boolean;
  error?: string;
}

let _connection: Connection | null = null;

function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(ENV.solanaRpcUrl, "confirmed");
  }
  return _connection;
}

/**
 * Verify a Solana USDC payment on-chain.
 *
 * Checks:
 * 1. Transaction exists and is confirmed
 * 2. Transaction has no errors
 * 3. Contains a USDC token transfer
 * 4. Transfer amount matches expected amount
 * 5. Sender matches callerWallet
 * 6. Recipient matches treasuryWallet
 */
export async function verifyPayment(
  txSignature: string,
  expectedAmount: number,
  callerWallet: string,
  treasuryWallet: string,
): Promise<PaymentVerificationResult> {
  try {
    const connection = getConnection();

    // Fetch the parsed transaction
    let tx: ParsedTransactionWithMeta | null;
    try {
      tx = await connection.getParsedTransaction(txSignature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });
    } catch (err: any) {
      return { verified: false, error: `Failed to fetch transaction: ${err.message}` };
    }

    if (!tx) {
      return { verified: false, error: "Transaction not found. It may not be confirmed yet." };
    }

    // Check for transaction errors
    if (tx.meta?.err) {
      return { verified: false, error: `Transaction failed on-chain: ${JSON.stringify(tx.meta.err)}` };
    }

    // Look for USDC token transfers in the inner instructions and main instructions
    const allInstructions = [
      ...(tx.transaction.message.instructions || []),
      ...(tx.meta?.innerInstructions?.flatMap((ix) => ix.instructions) || []),
    ];

    // Convert expected amount to USDC base units (6 decimals)
    const expectedBaseUnits = Math.round(expectedAmount * Math.pow(10, USDC_DECIMALS));

    // Tolerance: allow 1% difference to account for rounding
    const tolerance = Math.max(1, Math.round(expectedBaseUnits * 0.01));

    let matchingTransferFound = false;

    for (const ix of allInstructions) {
      // Check parsed SPL token transfer instructions
      if ("parsed" in ix && ix.parsed) {
        const parsed = ix.parsed as any;
        const type = parsed.type;

        // Handle both 'transfer' and 'transferChecked' instruction types
        if (type === "transfer" || type === "transferChecked") {
          const info = parsed.info;
          if (!info) continue;

          // For transferChecked, the mint is directly available
          if (type === "transferChecked" && info.mint !== USDC_MINT) {
            continue;
          }

          const amount = parseInt(
            type === "transferChecked" ? info.tokenAmount?.amount : info.amount,
            10,
          );

          if (isNaN(amount)) continue;

          // Verify amount is within tolerance
          if (Math.abs(amount - expectedBaseUnits) > tolerance) continue;

          // For SPL token transfers, authority/source/destination are token accounts.
          // We need to verify the owner wallets via pre/post token balances.
          // The `authority` field is the wallet that signed the transfer.
          const senderAuthority = info.authority || info.source;
          const destination = info.destination;

          // Check if the sender authority matches the caller wallet
          // (authority is the wallet public key for SPL token transfers)
          if (senderAuthority === callerWallet) {
            // Verify destination belongs to treasury wallet using token balances
            if (verifyDestinationOwner(tx, destination, treasuryWallet)) {
              matchingTransferFound = true;
              break;
            }
          }
        }
      }
    }

    // Also check pre/post token balances as a fallback verification method
    if (!matchingTransferFound && tx.meta?.preTokenBalances && tx.meta?.postTokenBalances) {
      const preBalances = tx.meta.preTokenBalances.filter((b) => b.mint === USDC_MINT);
      const postBalances = tx.meta.postTokenBalances.filter((b) => b.mint === USDC_MINT);

      // Find the treasury wallet's balance increase
      let treasuryReceived = 0;
      let callerSent = 0;

      for (const post of postBalances) {
        if (post.owner === treasuryWallet) {
          const pre = preBalances.find(
            (p) => p.accountIndex === post.accountIndex,
          );
          const preAmount = parseInt(pre?.uiTokenAmount?.amount || "0", 10);
          const postAmount = parseInt(post.uiTokenAmount?.amount || "0", 10);
          treasuryReceived += postAmount - preAmount;
        }
        if (post.owner === callerWallet) {
          const pre = preBalances.find(
            (p) => p.accountIndex === post.accountIndex,
          );
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

/**
 * Check if a token account destination is owned by the expected wallet
 * using the transaction's pre/post token balances.
 */
function verifyDestinationOwner(
  tx: ParsedTransactionWithMeta,
  destinationTokenAccount: string,
  expectedOwner: string,
): boolean {
  // Check post token balances for the destination account
  const accountKeys = tx.transaction.message.accountKeys.map((k) =>
    typeof k === "string" ? k : k.pubkey.toBase58(),
  );

  const destIndex = accountKeys.indexOf(destinationTokenAccount);
  if (destIndex === -1) {
    // If we can't find the exact account, check if any post balance
    // shows the expected owner receiving USDC
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
