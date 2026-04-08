import { PublicKey } from "@solana/web3.js";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export interface DecodedProtocolConfig {
  admin: string;
  treasury: string;
  validatorPool: string;
  stakerPool: string;
  insuranceFund: string;
  aegisMint: string;
  usdcMint: string;
  totalOperators: bigint;
  totalInvocations: bigint;
  totalVolumeLamports: bigint;
  feeBps: [number, number, number, number, number, number];
  pendingAdmin: string;
  bump: number;
}

export interface DecodedInvocationReceipt {
  operator: string;
  caller: string;
  amountPaid: bigint;
  responseMs: number;
  success: boolean;
  trustDelta: number;
  timestamp: bigint;
  bump: number;
}

export interface DecodedOperatorAccount {
  creator: string;
  operatorId: bigint;
  name: string;
  slug: string;
  metadataUri: string;
  priceUsdcBase: bigint;
  category: number;
  trustScore: number;
  totalInvocations: bigint;
  successfulInvocations: bigint;
  totalEarnedLamports: bigint;
  isActive: boolean;
  createdAt: bigint;
  bump: number;
}

function ensureLength(data: Uint8Array, minBytes: number, label: string): void {
  if (data.length < minBytes) {
    throw new Error(`${label} account is too small to decode`);
  }
}

function readPubkey(data: Uint8Array, offset: number): string {
  return new PublicKey(data.slice(offset, offset + 32)).toBase58();
}

function readU16(data: Uint8Array, offset: number): number {
  return new DataView(data.buffer, data.byteOffset + offset, 2).getUint16(0, true);
}

function readU32(data: Uint8Array, offset: number): number {
  return new DataView(data.buffer, data.byteOffset + offset, 4).getUint32(0, true);
}

function readU64(data: Uint8Array, offset: number): bigint {
  return new DataView(data.buffer, data.byteOffset + offset, 8).getBigUint64(0, true);
}

function readI16(data: Uint8Array, offset: number): number {
  return new DataView(data.buffer, data.byteOffset + offset, 2).getInt16(0, true);
}

function readI64(data: Uint8Array, offset: number): bigint {
  return new DataView(data.buffer, data.byteOffset + offset, 8).getBigInt64(0, true);
}

function readString(data: Uint8Array, offset: number): { value: string; nextOffset: number } {
  const len = readU32(data, offset);
  const start = offset + 4;
  const end = start + len;
  return {
    value: textDecoder.decode(data.slice(start, end)),
    nextOffset: end,
  };
}

export function decodeProtocolConfigAccount(data: Uint8Array): DecodedProtocolConfig {
  ensureLength(data, 8 + 293, "ProtocolConfig");

  return {
    admin: readPubkey(data, 8),
    treasury: readPubkey(data, 40),
    validatorPool: readPubkey(data, 72),
    stakerPool: readPubkey(data, 104),
    insuranceFund: readPubkey(data, 136),
    aegisMint: readPubkey(data, 168),
    usdcMint: readPubkey(data, 200),
    totalOperators: readU64(data, 232),
    totalInvocations: readU64(data, 240),
    totalVolumeLamports: readU64(data, 248),
    feeBps: [
      readU16(data, 256),
      readU16(data, 258),
      readU16(data, 260),
      readU16(data, 262),
      readU16(data, 264),
      readU16(data, 266),
    ],
    pendingAdmin: readPubkey(data, 268),
    bump: data[300],
  };
}

export function decodeInvocationReceiptAccount(data: Uint8Array): DecodedInvocationReceipt {
  ensureLength(data, 8 + 88, "InvocationReceipt");

  return {
    operator: readPubkey(data, 8),
    caller: readPubkey(data, 40),
    amountPaid: readU64(data, 72),
    responseMs: readU32(data, 80),
    success: data[84] === 1,
    trustDelta: readI16(data, 85),
    timestamp: readI64(data, 87),
    bump: data[95],
  };
}

export function decodeOperatorAccount(data: Uint8Array): DecodedOperatorAccount {
  ensureLength(data, 8 + 32 + 8 + 4 + 4 + 4 + 8 + 1 + 2 + 8 + 8 + 8 + 1 + 8 + 1, "Operator");

  let offset = 8;
  const creator = readPubkey(data, offset);
  offset += 32;

  const operatorId = readU64(data, offset);
  offset += 8;

  const name = readString(data, offset);
  offset = name.nextOffset;

  const slug = readString(data, offset);
  offset = slug.nextOffset;

  const metadataUri = readString(data, offset);
  offset = metadataUri.nextOffset;

  const priceUsdcBase = readU64(data, offset);
  offset += 8;

  const category = data[offset];
  offset += 1;

  const trustScore = readU16(data, offset);
  offset += 2;

  const totalInvocations = readU64(data, offset);
  offset += 8;

  const successfulInvocations = readU64(data, offset);
  offset += 8;

  const totalEarnedLamports = readU64(data, offset);
  offset += 8;

  const isActive = data[offset] === 1;
  offset += 1;

  const createdAt = readI64(data, offset);
  offset += 8;

  const bump = data[offset];

  return {
    creator,
    operatorId,
    name: name.value,
    slug: slug.value,
    metadataUri: metadataUri.value,
    priceUsdcBase,
    category,
    trustScore,
    totalInvocations,
    successfulInvocations,
    totalEarnedLamports,
    isActive,
    createdAt,
    bump,
  };
}

export function deriveInvocationReceiptPda(params: {
  programId: string | PublicKey;
  operatorPda: string | PublicKey;
  invocationId: bigint;
}): PublicKey {
  const programId = typeof params.programId === "string" ? new PublicKey(params.programId) : params.programId;
  const operatorPda = typeof params.operatorPda === "string" ? new PublicKey(params.operatorPda) : params.operatorPda;
  const invocationIdBytes = new Uint8Array(8);
  new DataView(invocationIdBytes.buffer).setBigUint64(0, params.invocationId, true);

  return PublicKey.findProgramAddressSync(
    [textEncoder.encode("invocation"), operatorPda.toBytes(), invocationIdBytes],
    programId,
  )[0];
}