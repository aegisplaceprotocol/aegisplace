/**
 * Royalty System - MongoDB schemas and query functions
 * Tracks dependency edges between skills and distributes royalty payments upstream.
 */
import mongoose, { type Document, type Model, type Types } from "mongoose";
import { OperatorModel } from "./db";

// ────────────────────────────────────────────────────────────
// Decimal128 helper (matches db.ts pattern)
// ────────────────────────────────────────────────────────────

const dec128 = (defaultVal = "0") => ({
  type: mongoose.Schema.Types.Decimal128,
  default: mongoose.Types.Decimal128.fromString(defaultVal),
  get: (v: unknown) => (v ? (v as mongoose.Types.Decimal128).toString() : defaultVal),
});

// ────────────────────────────────────────────────────────────
// DependencyEdge Schema
// ────────────────────────────────────────────────────────────

export interface IDependencyEdge extends Document {
  parentSkillId: Types.ObjectId;
  parentSkillSlug: string;
  childSkillId: Types.ObjectId;
  childSkillSlug: string;
  parentCreatorWallet: string;
  childCreatorWallet: string;
  royaltyBps: number;
  depth: number;
  isActive: boolean;
  onChainEdgePda: string;
  registeredAt: Date;
}

const DependencySchema = new mongoose.Schema<IDependencyEdge>(
  {
    parentSkillId: { type: mongoose.Schema.Types.ObjectId, ref: "Operator", required: true },
    parentSkillSlug: { type: String, required: true, maxlength: 128 },
    childSkillId: { type: mongoose.Schema.Types.ObjectId, ref: "Operator", required: true },
    childSkillSlug: { type: String, required: true, maxlength: 128 },
    parentCreatorWallet: { type: String, required: true, maxlength: 64 },
    childCreatorWallet: { type: String, required: true, maxlength: 64 },
    royaltyBps: { type: Number, required: true, min: 1, max: 2000 },
    depth: { type: Number, required: true, min: 1, max: 5 },
    isActive: { type: Boolean, default: true, required: true },
    onChainEdgePda: { type: String, required: true, maxlength: 128 },
    registeredAt: { type: Date, default: Date.now, required: true },
  },
  {
    timestamps: true,
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true },
    collection: "dependency_edges",
  }
);

DependencySchema.index({ childSkillId: 1, isActive: 1 });
DependencySchema.index({ parentSkillId: 1, isActive: 1 });
DependencySchema.index({ childCreatorWallet: 1 });
DependencySchema.index({ parentCreatorWallet: 1 });
// Unique active edge per child→parent pair
DependencySchema.index(
  { childSkillId: 1, parentSkillId: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

// ────────────────────────────────────────────────────────────
// RoyaltyPayment Schema
// ────────────────────────────────────────────────────────────

export interface IRoyaltyPayment extends Document {
  invocationId: Types.ObjectId;
  childSkillId: Types.ObjectId;
  childSkillSlug: string;
  parentSkillId: Types.ObjectId;
  parentSkillSlug: string;
  parentCreatorWallet: string;
  // Decimal128 fields - getters transform to string at runtime
  invocationAmount: string;
  royaltyAmount: string;
  depth: number;
  status: "pending" | "deposited" | "claimed";
  txSignature: string;
  settledAt: Date | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RoyaltyPaymentSchema = new mongoose.Schema<any>(
  {
    invocationId: { type: mongoose.Schema.Types.ObjectId, ref: "Invocation", required: true },
    childSkillId: { type: mongoose.Schema.Types.ObjectId, ref: "Operator", required: true },
    childSkillSlug: { type: String, required: true, maxlength: 128 },
    parentSkillId: { type: mongoose.Schema.Types.ObjectId, ref: "Operator", required: true },
    parentSkillSlug: { type: String, required: true, maxlength: 128 },
    parentCreatorWallet: { type: String, required: true, maxlength: 64 },
    invocationAmount: dec128("0"),
    royaltyAmount: dec128("0"),
    depth: { type: Number, required: true, min: 1, max: 5 },
    status: {
      type: String,
      enum: ["pending", "deposited", "claimed"],
      default: "pending",
      required: true,
    },
    txSignature: { type: String, default: "", maxlength: 128 },
    settledAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true },
    collection: "royalty_payments",
  }
);

RoyaltyPaymentSchema.index({ invocationId: 1 });
RoyaltyPaymentSchema.index({ parentCreatorWallet: 1, status: 1 });
RoyaltyPaymentSchema.index({ childSkillId: 1 });
RoyaltyPaymentSchema.index({ parentSkillId: 1 });
RoyaltyPaymentSchema.index({ createdAt: -1 });

// ────────────────────────────────────────────────────────────
// RoyaltyVault Schema
// ────────────────────────────────────────────────────────────

export interface IRoyaltyVault extends Document {
  creatorWallet: string;
  // Decimal128 fields - getters transform to string at runtime
  unclaimed: string;
  totalEarned: string;
  totalClaimed: string;
  lastClaimAt: Date | null;
  lastDepositAt: Date | null;
  onChainVaultPda: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RoyaltyVaultSchema = new mongoose.Schema<any>(
  {
    creatorWallet: { type: String, required: true, unique: true, maxlength: 64 },
    unclaimed: dec128("0"),
    totalEarned: dec128("0"),
    totalClaimed: dec128("0"),
    lastClaimAt: { type: Date, default: null },
    lastDepositAt: { type: Date, default: null },
    onChainVaultPda: { type: String, default: "", maxlength: 128 },
  },
  {
    timestamps: true,
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true },
    collection: "royalty_vaults",
  }
);

RoyaltyVaultSchema.index({ totalEarned: -1 });

// ────────────────────────────────────────────────────────────
// Models (guard against re-registration in hot-reload)
// ────────────────────────────────────────────────────────────

export const DependencyModel: Model<IDependencyEdge> =
  mongoose.models["DependencyEdge"] ||
  mongoose.model<IDependencyEdge>("DependencyEdge", DependencySchema);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const RoyaltyPaymentModel: Model<IRoyaltyPayment> =
  (mongoose.models["RoyaltyPayment"] ||
    mongoose.model("RoyaltyPayment", RoyaltyPaymentSchema)) as unknown as Model<IRoyaltyPayment>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const RoyaltyVaultModel: Model<IRoyaltyVault> =
  (mongoose.models["RoyaltyVault"] ||
    mongoose.model("RoyaltyVault", RoyaltyVaultSchema)) as unknown as Model<IRoyaltyVault>;

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export interface RegisterDependencyParams {
  parentSkillSlug: string;
  childSkillSlug: string;
  royaltyBps: number;
  childCreatorWallet: string;
  onChainEdgePda: string;
}

export interface RoyaltyPaymentInput {
  invocationId: Types.ObjectId;
  childSkillId: Types.ObjectId;
  childSkillSlug: string;
  parentSkillId: Types.ObjectId;
  parentSkillSlug: string;
  parentCreatorWallet: string;
  invocationAmount: string;
  royaltyAmount: string;
  depth: number;
  txSignature?: string;
}

export interface DependencyTreeNode {
  skillId: string;
  skillName: string;
  slug: string;
  creatorWallet: string;
  royaltyBps: number;
  depth: number;
  parents: DependencyTreeNode[];
}

// ────────────────────────────────────────────────────────────
// Query Functions
// ────────────────────────────────────────────────────────────

/**
 * Register a new dependency edge.
 * Validates ownership, enforces max depth 5, and detects cycles via BFS.
 */
export async function registerDependency(
  params: RegisterDependencyParams
): Promise<IDependencyEdge> {
  const { parentSkillSlug, childSkillSlug, royaltyBps, childCreatorWallet, onChainEdgePda } =
    params;

  if (parentSkillSlug === childSkillSlug) {
    throw new Error("A skill cannot depend on itself");
  }

  if (royaltyBps < 1 || royaltyBps > 2000) {
    throw new Error("royaltyBps must be between 1 and 2000");
  }

  // Resolve both skills from the Operator collection
  const [childOp, parentOp] = await Promise.all([
    OperatorModel.findOne({ slug: childSkillSlug }).lean(),
    OperatorModel.findOne({ slug: parentSkillSlug }).lean(),
  ]);

  if (!childOp) throw new Error(`Child skill not found: ${childSkillSlug}`);
  if (!parentOp) throw new Error(`Parent skill not found: ${parentSkillSlug}`);

  // Validate caller is the child skill's creator
  if (childOp.creatorWallet !== childCreatorWallet) {
    throw new Error("Caller is not the creator of the child skill");
  }

  const childSkillId = childOp._id as Types.ObjectId;
  const parentSkillId = parentOp._id as Types.ObjectId;

  // Check for duplicate active edge
  const existing = await DependencyModel.findOne({
    childSkillId,
    parentSkillId,
    isActive: true,
  }).lean();

  if (existing) {
    throw new Error("This dependency edge already exists");
  }

  // ── Cycle detection: BFS upward from parentSkillId ──────────────
  // If we encounter childSkillId while traversing ancestors of parentSkillId,
  // adding this edge would create a cycle.
  const childIdStr = childSkillId.toString();
  const visited = new Set<string>();
  const queue: Types.ObjectId[] = [parentSkillId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentStr = current.toString();

    if (visited.has(currentStr)) continue;
    visited.add(currentStr);

    if (currentStr === childIdStr) {
      throw new Error(
        "Adding this dependency would create a cycle in the skill graph"
      );
    }

    // Fetch direct parents of current node
    const parentEdges = await DependencyModel.find(
      { childSkillId: current, isActive: true },
      { parentSkillId: 1 }
    ).lean();

    for (const edge of parentEdges) {
      queue.push(edge.parentSkillId as Types.ObjectId);
    }
  }

  // ── Enforce max depth 5 ────────────────────────────────────────
  // The new edge will be at depth 1 relative to child.
  // All existing edges where this parent is itself a child are at some depth.
  // We need to ensure no ancestor chain exceeds depth 5 with this new edge.
  const deepestChildChain = await _getMaxDepthBelow(childSkillId);
  const deepestParentChain = await _getMaxDepthAbove(parentSkillId);

  // The new edge adds 1 level: childChain + 1 (new edge) + parentChain
  const totalDepth = deepestChildChain + 1 + deepestParentChain;
  if (totalDepth > 5) {
    throw new Error(
      `Adding this dependency would exceed the maximum depth of 5 (projected depth: ${totalDepth})`
    );
  }

  const edge = await DependencyModel.create({
    parentSkillId,
    parentSkillSlug,
    childSkillId,
    childSkillSlug,
    parentCreatorWallet: parentOp.creatorWallet,
    childCreatorWallet,
    royaltyBps,
    depth: 1,
    isActive: true,
    onChainEdgePda,
    registeredAt: new Date(),
  });

  return edge;
}

/** BFS to find the longest chain below (children of) a given skill. */
async function _getMaxDepthBelow(skillId: Types.ObjectId): Promise<number> {
  let maxDepth = 0;
  const queue: Array<{ id: Types.ObjectId; depth: number }> = [{ id: skillId, depth: 0 }];

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (depth > maxDepth) maxDepth = depth;
    if (depth >= 5) continue;

    const childEdges = await DependencyModel.find(
      { parentSkillId: id, isActive: true },
      { childSkillId: 1 }
    ).lean();

    for (const edge of childEdges) {
      queue.push({ id: edge.childSkillId as Types.ObjectId, depth: depth + 1 });
    }
  }

  return maxDepth;
}

/** BFS to find the longest chain above (parents of) a given skill. */
async function _getMaxDepthAbove(skillId: Types.ObjectId): Promise<number> {
  let maxDepth = 0;
  const queue: Array<{ id: Types.ObjectId; depth: number }> = [{ id: skillId, depth: 0 }];

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (depth > maxDepth) maxDepth = depth;
    if (depth >= 5) continue;

    const parentEdges = await DependencyModel.find(
      { childSkillId: id, isActive: true },
      { parentSkillId: 1 }
    ).lean();

    for (const edge of parentEdges) {
      queue.push({ id: edge.parentSkillId as Types.ObjectId, depth: depth + 1 });
    }
  }

  return maxDepth;
}

/**
 * Soft-delete a dependency edge.
 * Only the creator of the child skill may remove it.
 */
export async function removeDependency(
  childSkillId: Types.ObjectId,
  childCreatorWallet: string
): Promise<void> {
  const edge = await DependencyModel.findOne({
    childSkillId,
    isActive: true,
  }).lean();

  if (!edge) {
    throw new Error("Active dependency edge not found for this child skill");
  }

  if (edge.childCreatorWallet !== childCreatorWallet) {
    throw new Error("Caller is not the creator of the child skill");
  }

  await DependencyModel.updateMany(
    { childSkillId, isActive: true },
    { $set: { isActive: false } }
  );
}

/**
 * BFS traverse upstream from skillId.
 * Returns a nested tree of all ancestor skills.
 */
export async function getDependencyTree(skillSlug: string): Promise<DependencyTreeNode | null> {
  const op = await OperatorModel.findOne({ slug: skillSlug }).lean();
  if (!op) return null;

  const skillId = op._id as Types.ObjectId;
  return _buildTreeNode(skillId, op.name as string, skillSlug, op.creatorWallet as string, 0, 0, new Set<string>());
}

async function _buildTreeNode(
  skillId: Types.ObjectId,
  skillName: string,
  slug: string,
  creatorWallet: string,
  royaltyBps: number,
  depth: number,
  visited: Set<string>
): Promise<DependencyTreeNode> {
  const node: DependencyTreeNode = {
    skillId: skillId.toString(),
    skillName,
    slug,
    creatorWallet,
    royaltyBps,
    depth,
    parents: [],
  };

  if (depth >= 5) return node;

  const idStr = skillId.toString();
  if (visited.has(idStr)) return node;
  visited.add(idStr);

  const parentEdges = await DependencyModel.find(
    { childSkillId: skillId, isActive: true },
    { parentSkillId: 1, parentSkillSlug: 1, parentCreatorWallet: 1, royaltyBps: 1 }
  ).lean();

  for (const edge of parentEdges) {
    const parentOp = await OperatorModel.findById(edge.parentSkillId, { name: 1 }).lean();
    const parentName = (parentOp?.name as string) ?? edge.parentSkillSlug;
    const childNode = await _buildTreeNode(
      edge.parentSkillId as Types.ObjectId,
      parentName,
      edge.parentSkillSlug,
      edge.parentCreatorWallet,
      edge.royaltyBps,
      depth + 1,
      new Set(visited)
    );
    node.parents.push(childNode);
  }

  return node;
}

/**
 * Return only the direct parent edges of a skill.
 */
export async function getDependencies(skillId: Types.ObjectId): Promise<IDependencyEdge[]> {
  return DependencyModel.find({ childSkillId: skillId, isActive: true });
}

/**
 * Return only the direct child edges of a skill.
 */
export async function getDependents(skillId: Types.ObjectId): Promise<IDependencyEdge[]> {
  return DependencyModel.find({ parentSkillId: skillId, isActive: true });
}

/**
 * Compute the royalty split for all upstream parents of a child skill.
 * Returns an array of { edge, royaltyAmount } records.
 */
export async function calculateRoyalties(
  invocationId: Types.ObjectId,
  childSkillId: Types.ObjectId,
  invocationAmount: string
): Promise<RoyaltyPaymentInput[]> {
  const invocationAmountNum = parseFloat(invocationAmount);
  if (isNaN(invocationAmountNum) || invocationAmountNum <= 0) {
    return [];
  }

  const results: RoyaltyPaymentInput[] = [];

  // BFS upward - track visited to avoid double-counting in diamond graphs
  const visited = new Set<string>();
  const queue: Array<{ skillId: Types.ObjectId; depth: number }> = [
    { skillId: childSkillId, depth: 0 },
  ];

  while (queue.length > 0) {
    const { skillId, depth } = queue.shift()!;
    const idStr = skillId.toString();
    if (visited.has(idStr)) continue;
    visited.add(idStr);

    if (depth >= 5) continue;

    const parentEdges = await DependencyModel.find(
      { childSkillId: skillId, isActive: true },
      {
        parentSkillId: 1,
        parentSkillSlug: 1,
        parentCreatorWallet: 1,
        childSkillSlug: 1,
        royaltyBps: 1,
      }
    ).lean();

    for (const edge of parentEdges) {
      const royaltyAmount = (invocationAmountNum * edge.royaltyBps) / 10000;

      results.push({
        invocationId,
        childSkillId,
        childSkillSlug: edge.childSkillSlug,
        parentSkillId: edge.parentSkillId as Types.ObjectId,
        parentSkillSlug: edge.parentSkillSlug,
        parentCreatorWallet: edge.parentCreatorWallet,
        invocationAmount,
        royaltyAmount: royaltyAmount.toFixed(9),
        depth: depth + 1,
      });

      queue.push({ skillId: edge.parentSkillId as Types.ObjectId, depth: depth + 1 });
    }
  }

  return results;
}

/**
 * Batch-insert royalty payment records.
 */
export async function recordRoyaltyPayments(
  payments: RoyaltyPaymentInput[]
): Promise<IRoyaltyPayment[]> {
  if (payments.length === 0) return [];

  const docs = payments.map((p) => ({
    invocationId: p.invocationId,
    childSkillId: p.childSkillId,
    childSkillSlug: p.childSkillSlug,
    parentSkillId: p.parentSkillId,
    parentSkillSlug: p.parentSkillSlug,
    parentCreatorWallet: p.parentCreatorWallet,
    invocationAmount: mongoose.Types.Decimal128.fromString(p.invocationAmount),
    royaltyAmount: mongoose.Types.Decimal128.fromString(p.royaltyAmount),
    depth: p.depth,
    status: "pending" as const,
    txSignature: p.txSignature ?? "",
    settledAt: null,
  }));

  return RoyaltyPaymentModel.insertMany(docs) as unknown as Promise<IRoyaltyPayment[]>;
}

/**
 * Add an amount to a creator's unclaimed vault balance.
 * Creates the vault document if it does not exist yet.
 */
export async function updateRoyaltyVault(
  creatorWallet: string,
  amount: string
): Promise<IRoyaltyVault> {
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum)) {
    throw new Error(`Invalid amount for vault update: ${amount}`);
  }

  const existing = await RoyaltyVaultModel.findOne({ creatorWallet }).lean<IRoyaltyVault>();

  if (!existing) {
    const createDoc = {
      creatorWallet,
      unclaimed: mongoose.Types.Decimal128.fromString(amountNum.toFixed(9)),
      totalEarned: mongoose.Types.Decimal128.fromString(amountNum.toFixed(9)),
      totalClaimed: mongoose.Types.Decimal128.fromString("0"),
      lastDepositAt: new Date(),
      lastClaimAt: null as Date | null,
      onChainVaultPda: "",
    };
    // Schema<any> model: cast doc to any to avoid mismatch with Decimal128 field types
    const created = await RoyaltyVaultModel.create(createDoc as unknown as IRoyaltyVault);
    return created as unknown as IRoyaltyVault;
  }

  const currentUnclaimed = parseFloat(String(existing.unclaimed));
  const currentTotalEarned = parseFloat(String(existing.totalEarned));

  await RoyaltyVaultModel.updateOne(
    { creatorWallet },
    {
      $set: {
        unclaimed: mongoose.Types.Decimal128.fromString(
          (currentUnclaimed + amountNum).toFixed(9)
        ),
        totalEarned: mongoose.Types.Decimal128.fromString(
          (currentTotalEarned + amountNum).toFixed(9)
        ),
        lastDepositAt: new Date(),
      },
    }
  );

  const updated = await RoyaltyVaultModel.findOne({ creatorWallet });
  if (!updated) throw new Error(`Failed to retrieve vault for wallet: ${creatorWallet}`);
  return updated as unknown as IRoyaltyVault;
}

/**
 * Return vault state and recent royalty payments for a creator wallet.
 */
export async function getCreatorEarnings(creatorWallet: string): Promise<{
  vault: IRoyaltyVault | null;
  recentPayments: IRoyaltyPayment[];
  topSources: Array<{ slug: string; totalEarned: string; paymentCount: number }>;
}> {
  const [vault, recentPayments] = await Promise.all([
    RoyaltyVaultModel.findOne({ creatorWallet }),
    RoyaltyPaymentModel.find({ parentCreatorWallet: creatorWallet })
      .sort({ createdAt: -1 })
      .limit(50),
  ]);

  // Aggregate top earning source skills
  const topSourcesAgg = await RoyaltyPaymentModel.aggregate([
    { $match: { parentCreatorWallet: creatorWallet } },
    {
      $group: {
        _id: "$childSkillSlug",
        totalEarned: { $sum: { $toDouble: "$royaltyAmount" } },
        paymentCount: { $sum: 1 },
      },
    },
    { $sort: { totalEarned: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        slug: "$_id",
        totalEarned: { $toString: "$totalEarned" },
        paymentCount: 1,
      },
    },
  ]);

  return {
    vault,
    recentPayments,
    topSources: topSourcesAgg,
  };
}

/**
 * Zero out unclaimed balance and record the claim timestamp.
 * Returns the amount that was claimed.
 */
export async function claimRoyalties(creatorWallet: string): Promise<string> {
  const vault = await RoyaltyVaultModel.findOne({ creatorWallet }).lean<IRoyaltyVault>();
  if (!vault) {
    throw new Error("No royalty vault found for this wallet");
  }

  // With .lean() + getters, Decimal128 fields are returned as strings by the getter
  const unclaimedStr = String(vault.unclaimed);
  const unclaimedNum = parseFloat(unclaimedStr);

  if (unclaimedNum <= 0) {
    throw new Error("No unclaimed royalties available");
  }

  // Mark all pending/deposited payments as claimed for this creator
  await RoyaltyPaymentModel.updateMany(
    { parentCreatorWallet: creatorWallet, status: { $in: ["pending", "deposited"] } },
    { $set: { status: "claimed", settledAt: new Date() } }
  );

  // Reset unclaimed and accumulate totalClaimed
  const totalClaimedNum = parseFloat(String(vault.totalClaimed)) + unclaimedNum;

  await RoyaltyVaultModel.updateOne(
    { creatorWallet },
    {
      $set: {
        unclaimed: mongoose.Types.Decimal128.fromString("0"),
        totalClaimed: mongoose.Types.Decimal128.fromString(
          totalClaimedNum.toFixed(9)
        ),
        lastClaimAt: new Date(),
      },
    }
  );

  return unclaimedStr;
}

/**
 * Return the top skills ordered by total royalties earned by their upstream dependents.
 */
export async function getRoyaltyLeaderboard(limit = 20): Promise<
  Array<{
    rank: number;
    skillName: string;
    slug: string;
    totalRoyaltiesEarned: string;
    totalDependents: number;
  }>
> {
  const agg = await RoyaltyPaymentModel.aggregate([
    {
      $group: {
        _id: "$parentSkillSlug",
        parentSkillId: { $first: "$parentSkillId" },
        totalRoyaltiesEarned: { $sum: { $toDouble: "$royaltyAmount" } },
        totalPayments: { $sum: 1 },
      },
    },
    { $sort: { totalRoyaltiesEarned: -1 } },
    { $limit: Math.max(1, Math.min(100, limit)) },
  ]);

  // Enrich with operator names
  const rows = await Promise.all(
    agg.map(async (row, idx) => {
      const op = await OperatorModel.findById(row.parentSkillId, { name: 1, slug: 1 }).lean();
      return {
        rank: idx + 1,
        skillName: (op?.name as string) ?? row._id,
        slug: (op?.slug as string) ?? row._id,
        totalRoyaltiesEarned: row.totalRoyaltiesEarned.toFixed(9),
        totalDependents: row.totalPayments,
      };
    })
  );

  return rows;
}

/**
 * Protocol-wide royalty statistics.
 */
export async function getRoyaltyStats(): Promise<{
  totalDependencies: number;
  totalRoyaltiesDistributed: string;
  totalUnclaimed: string;
  avgRoyaltyBps: number;
}> {
  const [
    totalDependencies,
    paymentAgg,
    vaultAgg,
    bpsAgg,
  ] = await Promise.all([
    DependencyModel.countDocuments({ isActive: true }),
    RoyaltyPaymentModel.aggregate([
      { $group: { _id: null, total: { $sum: { $toDouble: "$royaltyAmount" } } } },
    ]),
    RoyaltyVaultModel.aggregate([
      { $group: { _id: null, total: { $sum: { $toDouble: "$unclaimed" } } } },
    ]),
    DependencyModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, avg: { $avg: "$royaltyBps" } } },
    ]),
  ]);

  return {
    totalDependencies,
    totalRoyaltiesDistributed: (paymentAgg[0]?.total ?? 0).toFixed(9),
    totalUnclaimed: (vaultAgg[0]?.total ?? 0).toFixed(9),
    avgRoyaltyBps: Math.round(bpsAgg[0]?.avg ?? 0),
  };
}
