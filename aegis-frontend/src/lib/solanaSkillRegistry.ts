import { PublicKey, SystemProgram, Transaction, TransactionInstruction, type Connection } from "@solana/web3.js";

const CATEGORY_TO_INDEX: Record<string, number> = {
  "code-review": 0,
  "sentiment-analysis": 1,
  "data-extraction": 2,
  "image-generation": 3,
  "text-generation": 4,
  "translation": 5,
  "summarization": 6,
  "classification": 7,
  "search": 8,
  "financial-analysis": 9,
  "security-audit": 10,
  other: 11,
};

export interface PreparedSkillRegistrationPlan {
  cluster: string;
  rpcUrl: string;
  programId: string;
  configPda: string;
  operatorPda: string;
  operatorId: number;
  metadataUri: string;
}

export interface SkillRegistrationPayload {
  name: string;
  slug: string;
  endpointUrl: string;
  metadataUri: string;
  pricePerCall: string;
  category: string;
}

function isBlockhashExpiredError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("block height exceeded") || message.includes("blockhash not found");
}

async function hasConfirmedSignature(connection: Connection, signature: string): Promise<boolean> {
  const { value } = await connection.getSignatureStatuses([signature], {
    searchTransactionHistory: true,
  });
  const status = value[0];
  if (!status) return false;
  if (status.err) throw new Error(`Registration transaction failed on-chain: ${JSON.stringify(status.err)}`);

  return status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized";
}

async function confirmRegistrationSignature(
  connection: Connection,
  signature: string,
  blockhash: string,
  lastValidBlockHeight: number,
): Promise<void> {
  try {
    await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed",
    );
    return;
  } catch (error) {
    if (!isBlockhashExpiredError(error)) throw error;
  }

  if (await hasConfirmedSignature(connection, signature)) {
    return;
  }

  throw new Error(
    "The wallet approval took too long and the transaction blockhash expired before confirmation. Approve the prompt and resubmit quickly.",
  );
}

function encodeU32(value: number): Uint8Array {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, true);
  return bytes;
}

function encodeU64(value: bigint): Uint8Array {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setBigUint64(0, value, true);
  return bytes;
}

function encodeString(value: string): Uint8Array {
  const body = new TextEncoder().encode(value);
  const bytes = new Uint8Array(4 + body.length);
  bytes.set(encodeU32(body.length), 0);
  bytes.set(body, 4);
  return bytes;
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

export function priceToBaseUnits(pricePerCall: string): bigint {
  const value = Number.parseFloat(pricePerCall);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Price per call must be a positive USDC amount");
  }
  return BigInt(Math.round(value * 1_000_000));
}

export function sanitizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export async function buildRegisterOperatorInstruction(
  plan: PreparedSkillRegistrationPlan,
  creatorWallet: string,
  payload: SkillRegistrationPayload,
): Promise<TransactionInstruction> {
  const discriminator = await getAnchorDiscriminator("register_operator");
  const priceBaseUnits = priceToBaseUnits(payload.pricePerCall);
  const categoryIndex = CATEGORY_TO_INDEX[payload.category] ?? CATEGORY_TO_INDEX.other;

  const data = concatBytes([
    discriminator,
    encodeString(payload.name),
    encodeString(payload.slug),
    encodeString(payload.endpointUrl),
    encodeString(payload.metadataUri),
    encodeU64(priceBaseUnits),
    new Uint8Array([categoryIndex]),
  ]);

  return new TransactionInstruction({
    programId: new PublicKey(plan.programId),
    keys: [
      { pubkey: new PublicKey(creatorWallet), isSigner: true, isWritable: true },
      { pubkey: new PublicKey(plan.configPda), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(plan.operatorPda), isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(data),
  });
}

export async function sendSkillRegistrationTransaction(params: {
  connection: Connection;
  sendTransaction: (transaction: Transaction, connection: Connection, options?: { skipPreflight?: boolean; preflightCommitment?: "processed" | "confirmed" | "finalized" }) => Promise<string>;
  creatorWallet: string;
  plan: PreparedSkillRegistrationPlan;
  payload: SkillRegistrationPayload;
}): Promise<string> {
  const instruction = await buildRegisterOperatorInstruction(
    params.plan,
    params.creatorWallet,
    params.payload,
  );

  const transaction = new Transaction().add(instruction);
  transaction.feePayer = new PublicKey(params.creatorWallet);

  const latest = await params.connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = latest.blockhash;

  const signature = await params.sendTransaction(transaction, params.connection, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  await confirmRegistrationSignature(
    params.connection,
    signature,
    latest.blockhash,
    latest.lastValidBlockHeight,
  );

  return signature;
}