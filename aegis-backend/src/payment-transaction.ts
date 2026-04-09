import { createHash } from "crypto";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { ENV } from "./_core/env";
import {
  decodeInvocationReceiptAccount,
  decodeOperatorAccount,
  decodeProtocolConfigAccount,
  deriveInvocationReceiptPda,
} from "./aegis-program";

function getConnection(): Connection {
  return new Connection(ENV.solanaRpcUrl, "confirmed");
}

function getAnchorDiscriminator(name: string): Buffer {
  return createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);
}

export interface PreparedOperatorPayment {
  transactionBase64: string;
  encoding: "base64";
  feePayer: string;
  recentBlockhash: string;
  lastValidBlockHeight: number;
  programId: string;
  configPda: string;
  operatorPda: string;
  receiptPda: string;
  callerTokenAccount: string;
  creatorTokenAccount: string;
  mint: string;
  amountAtomic: string;
}

export async function buildPreparedOperatorPayment(params: {
  callerWallet: string;
  programId: string;
  configPda: string;
  operatorPda: string;
}): Promise<PreparedOperatorPayment> {
  const connection = getConnection();
  const callerWallet = new PublicKey(params.callerWallet);
  const configPda = new PublicKey(params.configPda);
  const operatorPda = new PublicKey(params.operatorPda);
  const programId = new PublicKey(params.programId);

  const [configAccount, operatorAccount] = await Promise.all([
    connection.getAccountInfo(configPda, "confirmed"),
    connection.getAccountInfo(operatorPda, "confirmed"),
  ]);

  if (!configAccount) {
    throw new Error(`Aegis config account was not found on-chain: ${params.configPda}`);
  }
  if (!operatorAccount) {
    throw new Error(`Aegis operator account was not found on-chain: ${params.operatorPda}`);
  }

  const config = decodeProtocolConfigAccount(configAccount.data);
  const operator = decodeOperatorAccount(operatorAccount.data);
  const mint = new PublicKey(config.usdcMint);

  const callerAta = await getAssociatedTokenAddress(mint, callerWallet);
  const creatorWallet = new PublicKey(operator.creator);
  const creatorAta = await getAssociatedTokenAddress(mint, creatorWallet);

  const callerAtaInfo = await connection.getAccountInfo(callerAta, "confirmed");
  if (!callerAtaInfo) {
    throw new Error(
      `Caller wallet ${callerWallet.toBase58()} does not have the required USDC token account ${callerAta.toBase58()} for mint ${mint.toBase58()}.`,
    );
  }

  const creatorAtaInfo = await connection.getAccountInfo(creatorAta, "confirmed");
  const preInstructions: TransactionInstruction[] = [];
  if (!creatorAtaInfo) {
    preInstructions.push(
      createAssociatedTokenAccountInstruction(
        callerWallet,
        creatorAta,
        creatorWallet,
        mint,
      ),
    );
  }

  const receiptPda = deriveInvocationReceiptPda({
    programId,
    operatorPda,
    invocationId: operator.totalInvocations,
  });

  const discriminator = getAnchorDiscriminator("invoke_skill");
  const instruction = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: callerWallet, isSigner: true, isWritable: true },
      { pubkey: configPda, isSigner: false, isWritable: true },
      { pubkey: operatorPda, isSigner: false, isWritable: true },
      { pubkey: receiptPda, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: callerAta, isSigner: false, isWritable: true },
      { pubkey: creatorAta, isSigner: false, isWritable: true },
      { pubkey: new PublicKey(config.validatorPool), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(config.stakerPool), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(config.treasury), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(config.insuranceFund), isSigner: false, isWritable: true },
      { pubkey: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: discriminator,
  });

  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  const transaction = new Transaction({
    feePayer: callerWallet,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  });
  for (const ix of preInstructions) transaction.add(ix);
  transaction.add(instruction);

  return {
    transactionBase64: transaction
      .serialize({ requireAllSignatures: false, verifySignatures: false })
      .toString("base64"),
    encoding: "base64",
    feePayer: callerWallet.toBase58(),
    recentBlockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    programId: programId.toBase58(),
    configPda: configPda.toBase58(),
    operatorPda: operatorPda.toBase58(),
    receiptPda: receiptPda.toBase58(),
    callerTokenAccount: callerAta.toBase58(),
    creatorTokenAccount: creatorAta.toBase58(),
    mint: mint.toBase58(),
    amountAtomic: operator.priceUsdcBase.toString(),
  };
}