import { Buffer } from "buffer";
import {
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SendTransactionError,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
  type SendOptions,
} from "@solana/web3.js";
import { apiUrl } from "./api";
import {
  decodeOperatorAccount,
  decodeProtocolConfigAccount,
  deriveInvocationReceiptPda,
} from "./aegisProgram";

type WalletSender = (
  transaction: Transaction,
  connection: Connection,
  options?: SendOptions,
) => Promise<string>;

export interface X402Challenge {
  error: string;
  code: number;
  message: string;
  x402Version: number;
  payment: {
    amount: string;
    amountAtomic: string;
    currency: string;
    chain: string;
    recipient: string;
    network: string;
    asset: string;
    settlement?: {
      method: "legacy_transfer" | "aegis_program";
      programId?: string;
      configPda?: string;
      operatorPda?: string;
      operatorId?: number;
      creatorWallet?: string;
    };
  };
  instructions?: Record<string, string>;
}

export interface PaidInvokeResult {
  success: boolean;
  operatorId: number | string;
  operatorName: string;
  result: unknown;
  execution: {
    durationMs: number;
    trustScore: number;
    guardrailsPass: boolean;
    timestamp: string;
  };
  payment: {
    amount: number | string | { $numberDecimal?: string };
    token: string;
    chain: string;
    txSignature: string | null;
    receiptPda?: string | null;
    settlementMethod?: string | null;
    settledAt: string;
    feeSplit: Record<string, string>;
  };
  invocationId: number | string;
  guardrails: {
    inputPassed: boolean;
    outputPassed: boolean;
    violations: string[];
    inputScore?: number;
    outputScore?: number;
  };
}

function parseNumericValue(value: number | string | { $numberDecimal?: string }): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  if (value && typeof value === "object" && "$numberDecimal" in value) {
    return parseFloat(value.$numberDecimal || "0") || 0;
  }
  return 0;
}

function normalizePaidInvokeResult(result: PaidInvokeResult): PaidInvokeResult {
  return {
    ...result,
    payment: {
      ...result.payment,
      amount: parseNumericValue(result.payment.amount),
    },
  };
}

export interface InvokeWithPaywallParams {
  slug: string;
  payload: unknown;
  callerWallet?: string;
  connection: Connection;
  publicKey?: PublicKey | null;
  sendTransaction?: WalletSender;
}

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function sendInvokeRequest(
  slug: string,
  payload: unknown,
  init?: RequestInit,
): Promise<Response> {
  return fetch(apiUrl(`/api/v1/operators/${slug}/invoke`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    body: JSON.stringify(payload),
    ...init,
  });
}

function explainMissingSenderAta(params: {
  mint: PublicKey;
  challenge: X402Challenge;
}): string {
  const settlement = params.challenge.payment.settlement;
  if (settlement?.method === "aegis_program" && params.challenge.payment.network === "devnet") {
    return `Connected wallet does not have a token account for the configured devnet payment mint ${params.mint.toBase58()}. Create or fund that token account before invoking this skill.`;
  }

  return `Connected wallet does not have a token account for payment mint ${params.mint.toBase58()} on this cluster.`;
}

function extractWalletErrorMessage(error: unknown): string {
  if (error instanceof SendTransactionError) {
    const logs = error.logs?.filter(Boolean) ?? [];
    const firstRelevantLog = logs.find((line) =>
      /Error|failed|custom program error|AnchorError|insufficient|constraint/i.test(line),
    );
    return firstRelevantLog || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unexpected error";
  }
}

function extractSimulationError(logs: string[] | null | undefined): string {
  const relevant = (logs ?? []).find((line) =>
    /AnchorError|custom program error|Error:|failed|insufficient|constraint/i.test(line),
  );

  return relevant || "Transaction simulation failed.";
}

async function ensureSufficientTokenBalance(params: {
  connection: Connection;
  tokenAccount: PublicKey;
  requiredAmountAtomic: string;
  mintLabel: string;
}): Promise<void> {
  const balance = await params.connection.getTokenAccountBalance(params.tokenAccount, "confirmed");
  const current = BigInt(balance.value.amount);
  const required = BigInt(params.requiredAmountAtomic);

  if (current < required) {
    throw new Error(
      `Insufficient ${params.mintLabel} balance. Need ${required.toString()} base units, wallet has ${current.toString()}.`,
    );
  }
}

async function assertTransactionSimulates(params: {
  connection: Connection;
  transaction: Transaction;
}): Promise<void> {
  const versionedTransaction = new VersionedTransaction(params.transaction.compileMessage());
  const simulation = await params.connection.simulateTransaction(versionedTransaction, {
    commitment: "confirmed",
    replaceRecentBlockhash: true,
    sigVerify: false,
  });

  if (simulation.value.err) {
    throw new Error(extractSimulationError(simulation.value.logs));
  }
}

async function signUsdcPayment(params: {
  challenge: X402Challenge;
  connection: Connection;
  publicKey: PublicKey;
  sendTransaction: WalletSender;
}): Promise<{ txSignature: string; receiptPda?: string }> {
  const mint = new PublicKey(params.challenge.payment.asset);
  const recipientOwner = new PublicKey(params.challenge.payment.recipient);
  const sender = params.publicKey;
  const senderAta = await getAssociatedTokenAddress(mint, sender);
  const recipientAta = await getAssociatedTokenAddress(mint, recipientOwner);
  const senderAccountInfo = await params.connection.getAccountInfo(senderAta, "confirmed");

  if (!senderAccountInfo) {
    throw new Error(explainMissingSenderAta({ mint, challenge: params.challenge }));
  }

  const recipientAccountInfo = await params.connection.getAccountInfo(recipientAta, "confirmed");
  const transaction = new Transaction();

  if (!recipientAccountInfo) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        sender,
        recipientAta,
        recipientOwner,
        mint,
      ),
    );
  }

  transaction.add(
    createTransferCheckedInstruction(
      senderAta,
      mint,
      recipientAta,
      sender,
      BigInt(params.challenge.payment.amountAtomic),
      6,
    ),
  );

  const latestBlockhash = await params.connection.getLatestBlockhash("confirmed");
  transaction.feePayer = sender;
  transaction.recentBlockhash = latestBlockhash.blockhash;

  await ensureSufficientTokenBalance({
    connection: params.connection,
    tokenAccount: senderAta,
    requiredAmountAtomic: params.challenge.payment.amountAtomic,
    mintLabel: params.challenge.payment.currency,
  });
  await assertTransactionSimulates({
    connection: params.connection,
    transaction,
  });

  const signature = await params.sendTransaction(transaction, params.connection, {
    preflightCommitment: "confirmed",
    skipPreflight: false,
  });

  await params.connection.confirmTransaction(
    {
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    },
    "confirmed",
  );

  return { txSignature: signature };
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

async function getAnchorDiscriminator(name: string): Promise<Uint8Array> {
  const preimage = new TextEncoder().encode(`global:${name}`);
  const hash = await crypto.subtle.digest("SHA-256", preimage);
  return new Uint8Array(hash).slice(0, 8);
}

async function buildInvokeSkillInstruction(params: {
  challenge: X402Challenge;
  connection: Connection;
  publicKey: PublicKey;
}): Promise<{ instruction: TransactionInstruction; receiptPda: PublicKey; preInstructions: TransactionInstruction[]; callerAta: PublicKey; amountAtomic: string }> {
  const settlement = params.challenge.payment.settlement;
  if (!settlement || settlement.method !== "aegis_program") {
    throw new Error("This payment challenge does not include an Aegis on-chain settlement plan.");
  }
  if (!settlement.programId || !settlement.configPda || !settlement.operatorPda) {
    throw new Error("The Aegis payment challenge is missing required on-chain settlement accounts.");
  }

  const configAccount = await params.connection.getAccountInfo(new PublicKey(settlement.configPda), "confirmed");
  if (!configAccount) {
    throw new Error("Aegis protocol config account was not found on-chain.");
  }

  const operatorAccount = await params.connection.getAccountInfo(new PublicKey(settlement.operatorPda), "confirmed");
  if (!operatorAccount) {
    throw new Error("Aegis operator account was not found on-chain.");
  }

  const config = decodeProtocolConfigAccount(configAccount.data);
  const operator = decodeOperatorAccount(operatorAccount.data);
  const mint = new PublicKey(params.challenge.payment.asset);
  const onChainAmountAtomic = operator.priceUsdcBase.toString();

  if (config.usdcMint !== mint.toBase58()) {
    throw new Error("The x402 challenge USDC mint does not match the configured on-chain Aegis USDC mint.");
  }

  if (params.challenge.payment.amountAtomic !== onChainAmountAtomic) {
    throw new Error(
      `The x402 challenge amount ${params.challenge.payment.amountAtomic} does not match the configured on-chain operator price ${onChainAmountAtomic}.`,
    );
  }

  const callerAta = await getAssociatedTokenAddress(mint, params.publicKey);
  const callerAccountInfo = await params.connection.getAccountInfo(callerAta, "confirmed");
  if (!callerAccountInfo) {
    throw new Error(explainMissingSenderAta({ mint, challenge: params.challenge }));
  }

  const creatorWallet = new PublicKey(operator.creator);
  const creatorAta = await getAssociatedTokenAddress(mint, creatorWallet);
  const creatorAccountInfo = await params.connection.getAccountInfo(creatorAta, "confirmed");
  const preInstructions: TransactionInstruction[] = [];

  if (!creatorAccountInfo) {
    preInstructions.push(
      createAssociatedTokenAccountInstruction(
        params.publicKey,
        creatorAta,
        creatorWallet,
        mint,
      ),
    );
  }

  const receiptPda = deriveInvocationReceiptPda({
    programId: settlement.programId,
    operatorPda: settlement.operatorPda,
    invocationId: operator.totalInvocations,
  });

  const discriminator = await getAnchorDiscriminator("invoke_skill");

  return {
    amountAtomic: onChainAmountAtomic,
    callerAta,
    receiptPda,
    preInstructions,
    instruction: new TransactionInstruction({
      programId: new PublicKey(settlement.programId),
      keys: [
        { pubkey: params.publicKey, isSigner: true, isWritable: true },
        { pubkey: new PublicKey(settlement.configPda), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(settlement.operatorPda), isSigner: false, isWritable: true },
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
      data: Buffer.from(concatBytes([discriminator])),
    }),
  };
}

async function signAegisProgramPayment(params: {
  challenge: X402Challenge;
  connection: Connection;
  publicKey: PublicKey;
  sendTransaction: WalletSender;
}): Promise<{ txSignature: string; receiptPda: string }> {
  const { instruction, receiptPda, preInstructions, callerAta, amountAtomic } = await buildInvokeSkillInstruction(params);

  const transaction = new Transaction();
  for (const ix of preInstructions) transaction.add(ix);
  transaction.add(instruction);

  const latestBlockhash = await params.connection.getLatestBlockhash("confirmed");
  transaction.feePayer = params.publicKey;
  transaction.recentBlockhash = latestBlockhash.blockhash;

  await ensureSufficientTokenBalance({
    connection: params.connection,
    tokenAccount: callerAta,
    requiredAmountAtomic: amountAtomic,
    mintLabel: params.challenge.payment.currency,
  });
  await assertTransactionSimulates({
    connection: params.connection,
    transaction,
  });

  let signature: string;
  try {
    signature = await params.sendTransaction(transaction, params.connection, {
      preflightCommitment: "confirmed",
      skipPreflight: false,
    });
  } catch (error) {
    throw new Error(extractWalletErrorMessage(error));
  }

  await params.connection.confirmTransaction(
    {
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    },
    "confirmed",
  );

  return {
    txSignature: signature,
    receiptPda: receiptPda.toBase58(),
  };
}

export async function invokeWithPaywall(
  params: InvokeWithPaywallParams,
): Promise<PaidInvokeResult> {
  const requestBody = {
    ...(typeof params.payload === "object" && params.payload !== null ? (params.payload as Record<string, unknown>) : { input: params.payload }),
    callerWallet: params.callerWallet,
  };

  const firstResponse = await sendInvokeRequest(params.slug, requestBody);
  if (firstResponse.ok) {
    const result = await parseJson<PaidInvokeResult>(firstResponse);
    if (!result) throw new Error("Invocation succeeded but returned an unreadable response.");
    return normalizePaidInvokeResult(result);
  }

  if (firstResponse.status !== 402) {
    const failure = await parseJson<{ error?: string; message?: string }>(firstResponse);
    throw new Error(failure?.message || failure?.error || `Invocation failed with status ${firstResponse.status}`);
  }

  const challenge = await parseJson<X402Challenge>(firstResponse);
  if (!challenge?.payment) {
    throw new Error("The skill returned 402 but no payment challenge payload was included.");
  }

  if (!params.publicKey || !params.sendTransaction) {
    throw new Error("Connect a Solana wallet to pay for this skill.");
  }

  const paymentProof = challenge.payment.settlement?.method === "aegis_program"
    ? await signAegisProgramPayment({
        challenge,
        connection: params.connection,
        publicKey: params.publicKey,
        sendTransaction: params.sendTransaction,
      })
    : await signUsdcPayment({
        challenge,
        connection: params.connection,
        publicKey: params.publicKey,
        sendTransaction: params.sendTransaction,
      });

  const retryResponse = await sendInvokeRequest(params.slug, requestBody, {
    headers: {
      "X-Payment-Proof": paymentProof.txSignature,
      "X-Payer-Wallet": params.publicKey.toBase58(),
      ...(paymentProof.receiptPda ? { "X-Invocation-Receipt": paymentProof.receiptPda } : {}),
      ...(challenge.payment.settlement?.method ? { "X-Settlement-Method": challenge.payment.settlement.method } : {}),
    },
  });

  const retryBody = await parseJson<PaidInvokeResult | { error?: string; message?: string }>(retryResponse);
  if (!retryResponse.ok) {
    const failure = retryBody as { error?: string; message?: string } | null;
    throw new Error(failure?.message || failure?.error || `Paid invoke failed with status ${retryResponse.status}`);
  }

  return normalizePaidInvokeResult(retryBody as PaidInvokeResult);
}