/**
 * Operator Registry Service
 *
 * Reads operators from the existing MongoDB (shared with main app).
 * Falls back gracefully when the database is unavailable.
 * In the future, can also read from the on-chain Anchor program.
 */

import mongoose from "mongoose";

const DATABASE_URL = process.env.DATABASE_URL ?? "";

// ────────────────────────────────────────────────────────────
// MongoDB Connection (shared with main app's database)
// ────────────────────────────────────────────────────────────

let _connected = false;

async function ensureConnection(): Promise<boolean> {
  if (_connected && mongoose.connection.readyState === 1) return true;

  if (!DATABASE_URL) {
    console.warn("[operator-registry] DATABASE_URL not set — running without database");
    return false;
  }

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(DATABASE_URL);
    }
    _connected = true;
    return true;
  } catch (err) {
    console.warn("[operator-registry] Failed to connect to MongoDB:", err);
    _connected = false;
    return false;
  }
}

// ────────────────────────────────────────────────────────────
// Mongoose Schema (mirrors drizzle/schema.ts OperatorModel)
// ────────────────────────────────────────────────────────────

const operatorSchema = new mongoose.Schema(
  {
    name: String,
    slug: { type: String, unique: true, index: true },
    tagline: String,
    description: String,
    category: String,
    endpoint: String,
    method: { type: String, default: "POST" },
    expectedSchema: { type: mongoose.Schema.Types.Mixed, default: {} },
    creatorWallet: String,
    creatorId: String,
    priceUsdc: { type: Number, default: 0.25 },
    trustScore: { type: Number, default: 50 },
    totalInvocations: { type: Number, default: 0 },
    successfulInvocations: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    avgResponseMs: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    stakeRequired: { type: Number, default: 0 },
    tags: [String],
  },
  { timestamps: true, collection: "operators" },
);

// Reuse existing model if already registered (hot-reload safety)
const OperatorModel =
  mongoose.models.Operator ?? mongoose.model("Operator", operatorSchema);

const invocationSchema = new mongoose.Schema(
  {
    operatorId: { type: mongoose.Schema.Types.ObjectId, ref: "Operator" },
    callerWallet: String,
    payload: mongoose.Schema.Types.Mixed,
    responseBody: mongoose.Schema.Types.Mixed,
    statusCode: Number,
    responseMs: Number,
    qualityScore: Number,
    trustDelta: Number,
    amountUsdc: Number,
    creatorShare: Number,
    txSignature: String,
    success: Boolean,
    flags: [String],
  },
  { timestamps: true, collection: "invocations" },
);

const InvocationModel =
  mongoose.models.Invocation ?? mongoose.model("Invocation", invocationSchema);

// ────────────────────────────────────────────────────────────
// Operator interface
// ────────────────────────────────────────────────────────────

export interface OperatorRecord {
  _id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  category: string;
  endpoint: string;
  method: string;
  expectedSchema: Record<string, unknown>;
  creatorWallet: string;
  priceUsdc: number;
  trustScore: number;
  totalInvocations: number;
  successfulInvocations: number;
  totalEarned: number;
  avgResponseMs: number;
  isActive: boolean;
  createdAt: Date;
}

// ────────────────────────────────────────────────────────────
// Query Functions
// ────────────────────────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 100);
}

export async function listOperatorsFromRegistry(opts: {
  category?: string;
  search?: string;
  sortBy?: "trust" | "invocations" | "earnings" | "newest";
  limit?: number;
  offset?: number;
}): Promise<{ operators: OperatorRecord[]; total: number }> {
  const connected = await ensureConnection();
  if (!connected) return { operators: [], total: 0 };

  const filter: Record<string, unknown> = { isActive: true };
  if (opts.category && opts.category !== "all") {
    filter.category = opts.category;
  }
  if (opts.search) {
    filter.$or = [
      { name: { $regex: escapeRegex(opts.search), $options: "i" } },
      { tagline: { $regex: escapeRegex(opts.search), $options: "i" } },
    ];
  }

  const sortMap: Record<string, Record<string, -1>> = {
    trust: { trustScore: -1 },
    invocations: { totalInvocations: -1 },
    earnings: { totalEarned: -1 },
    newest: { createdAt: -1 },
  };
  const sort = sortMap[opts.sortBy ?? "trust"];
  const limit = Math.min(opts.limit ?? 20, 100);
  const offset = opts.offset ?? 0;

  const [items, total] = await Promise.all([
    OperatorModel.find(filter).sort(sort).skip(offset).limit(limit).lean(),
    OperatorModel.countDocuments(filter),
  ]);

  return { operators: items as unknown as OperatorRecord[], total };
}

export async function getOperatorBySlugFromRegistry(
  slug: string,
): Promise<OperatorRecord | null> {
  const connected = await ensureConnection();
  if (!connected) return null;

  const result = await OperatorModel.findOne({ slug }).lean();
  return (result as unknown as OperatorRecord) ?? null;
}

export async function getOperatorByIdFromRegistry(
  id: string,
): Promise<OperatorRecord | null> {
  const connected = await ensureConnection();
  if (!connected) return null;

  const result = await OperatorModel.findById(id).lean();
  return (result as unknown as OperatorRecord) ?? null;
}

export async function getOperatorCount(): Promise<number> {
  const connected = await ensureConnection();
  if (!connected) return 0;

  return OperatorModel.countDocuments({ isActive: true });
}

export async function getProtocolStats(): Promise<{
  totalOperators: number;
  activeOperators: number;
  totalInvocations: number;
  totalVolumeUsdc: number;
  avgTrustScore: number;
}> {
  const connected = await ensureConnection();
  if (!connected) {
    return {
      totalOperators: 0,
      activeOperators: 0,
      totalInvocations: 0,
      totalVolumeUsdc: 0,
      avgTrustScore: 0,
    };
  }

  const [totalOps, activeOps, invocAgg, earningsAgg, trustAgg] = await Promise.all([
    OperatorModel.countDocuments(),
    OperatorModel.countDocuments({ isActive: true }),
    OperatorModel.aggregate([
      { $group: { _id: null, total: { $sum: "$totalInvocations" } } },
    ]),
    OperatorModel.aggregate([
      { $group: { _id: null, total: { $sum: { $toDouble: "$totalEarned" } } } },
    ]),
    OperatorModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, avg: { $avg: "$trustScore" } } },
    ]),
  ]);

  return {
    totalOperators: totalOps,
    activeOperators: activeOps,
    totalInvocations: invocAgg[0]?.total ?? 0,
    totalVolumeUsdc: earningsAgg[0]?.total ?? 0,
    avgTrustScore: Math.round(trustAgg[0]?.avg ?? 0),
  };
}

/**
 * Record an invocation in the database.
 */
export async function recordInvocationInDb(data: {
  operatorId: string;
  callerWallet: string;
  payload: unknown;
  responseBody: unknown;
  statusCode: number;
  responseMs: number;
  qualityScore: number;
  trustDelta: number;
  amountUsdc: number;
  creatorShare: number;
  txSignature: string;
  success: boolean;
  flags: string[];
}): Promise<string> {
  const connected = await ensureConnection();
  if (!connected) throw new Error("Database not available");

  const doc = await InvocationModel.create({
    ...data,
    operatorId: new mongoose.Types.ObjectId(data.operatorId),
  });

  // Update operator stats
  const incFields: Record<string, number> = {
    totalInvocations: 1,
    totalEarned: data.creatorShare,
  };
  if (data.success) {
    incFields.successfulInvocations = 1;
  }

  await OperatorModel.findByIdAndUpdate(data.operatorId, {
    $inc: incFields,
  });

  return String(doc._id);
}

/**
 * Get invocation by ID.
 */
export async function getInvocationByIdFromDb(id: string): Promise<Record<string, unknown> | null> {
  const connected = await ensureConnection();
  if (!connected) return null;

  const result = await InvocationModel.findById(id).lean();
  return (result as Record<string, unknown>) ?? null;
}
