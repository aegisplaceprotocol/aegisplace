import mongoose from "mongoose";
import { ENV } from "./_core/env";
import logger from "./logger";

// ────────────────────────────────────────────────────────────
// Connection
// ────────────────────────────────────────────────────────────

const MONGO_URI =
  process.env.DATABASE_URL ||
  "mongodb://localhost:27017/aegis";

const isLocalhost = MONGO_URI.includes("localhost") || MONGO_URI.includes("127.0.0.1");
const options: mongoose.ConnectOptions = {
  tls: !isLocalhost && process.env.NODE_ENV === "production",
  ...(isLocalhost ? {} : { tlsAllowInvalidCertificates: process.env.NODE_ENV !== "production" }),
};

let _connected = false;

export async function getDb() {
  if (!_connected && MONGO_URI) {
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGO_URI, options);
      }
      _connected = true;
    } catch (error) {
      logger.warn({ error }, "[Database] Failed to connect");
      return null;
    }
  }
  return mongoose.connection.readyState === 1 ? mongoose.connection : null;
}

// Eagerly connect
mongoose.connect(MONGO_URI, options).catch((err) => {
  logger.warn({ err }, "[Database] Initial connection failed");
});

// ────────────────────────────────────────────────────────────
// Decimal128 helper
// ────────────────────────────────────────────────────────────

const dec128 = (defaultVal = "0") => ({
  type: mongoose.Schema.Types.Decimal128,
  default: mongoose.Types.Decimal128.fromString(defaultVal),
  get: (v: any) => (v ? v.toString() : defaultVal),
});

const objectIdLike = mongoose.Schema.Types.ObjectId;

// ────────────────────────────────────────────────────────────
// Schemas & Models
// ────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    openId: { type: String, required: true, unique: true, maxlength: 64 },
    name: { type: String, default: null },
    email: { type: String, default: null, maxlength: 320 },
    loginMethod: { type: String, default: null, maxlength: 64 },
    role: { type: String, enum: ["user", "admin"], default: "user", required: true },
    walletAddress: { type: String, default: null, maxlength: 64 },
    lastSignedIn: { type: Date, default: Date.now, required: true },
  },
  { timestamps: true, toJSON: { getters: true, virtuals: true }, toObject: { getters: true, virtuals: true }, collection: "users" }
);
userSchema.index({ walletAddress: 1 });

const operatorSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, maxlength: 128 },
    name: { type: String, required: true, maxlength: 256 },
    tagline: { type: String, default: null, maxlength: 512 },
    description: { type: String, default: null },
    category: {
      type: String,
      enum: [
        "code-review", "sentiment-analysis", "data-extraction",
        "image-generation", "text-generation", "translation",
        "summarization", "classification", "search",
        "financial-analysis", "security-audit", "other",
      ],
      default: "other",
      required: true,
    },
    skill: { type: String, default: null },
    pricePerCall: dec128("0.003"),
    creatorWallet: { type: String, required: true, maxlength: 64 },
    creatorId: { type: objectIdLike, default: null },
    onChainProgramId: { type: String, default: null, maxlength: 64 },
    onChainConfigPda: { type: String, default: null, maxlength: 64 },
    onChainOperatorPda: { type: String, default: null, maxlength: 64 },
    onChainOperatorId: { type: Number, default: null },
    onChainTxSignature: { type: String, default: null, maxlength: 128 },
    onChainMetadataUri: { type: String, default: null, maxlength: 1024 },
    onChainCluster: { type: String, enum: ["devnet", "mainnet-beta", "testnet"], default: null },
    onChainRegisteredAt: { type: Date, default: null },
    onChainSyncStatus: {
      type: String,
      enum: ["unregistered", "pending", "confirmed", "failed"],
      default: "unregistered",
      required: true,
    },
    stakeAmount: dec128("0"),
    trustScore: { type: Number, default: 50, required: true },
    totalInvocations: { type: Number, default: 0, required: true },
    successfulInvocations: { type: Number, default: 0, required: true },
    totalEarned: dec128("0"),
    avgResponseMs: { type: Number, default: 0, required: true },
    isActive: { type: Boolean, default: true, required: true },
    isVerified: { type: Boolean, default: false, required: true },
    suspensionReason: { type: String, default: null },
    tags: [{ type: String }],
    iconUrl: { type: String, default: null, maxlength: 1024 },
    docsUrl: { type: String, default: null, maxlength: 1024 },
    githubUrl: { type: String, default: null, maxlength: 1024 },
    lastHealthCheck: { type: Date, default: null },
    healthStatus: { type: String, enum: ["healthy", "degraded", "down", "unknown"], default: "unknown", required: true },
    consecutiveFailures: { type: Number, default: 0, required: true },
    source: { type: String, default: null },
  },
  { timestamps: true, toJSON: { getters: true, virtuals: true }, toObject: { getters: true, virtuals: true }, collection: "operators" }
);
operatorSchema.index({ category: 1 });
operatorSchema.index({ creatorWallet: 1 });
operatorSchema.index({ trustScore: -1 });
operatorSchema.index({ isActive: 1 });
operatorSchema.index({ onChainOperatorPda: 1 });
operatorSchema.index({ onChainSyncStatus: 1 });

const invocationSchema = new mongoose.Schema(
  {
    operatorId: { type: mongoose.Schema.Types.Mixed, required: true },
    callerWallet: { type: String, default: null, maxlength: 64 },
    amountPaid: dec128("0"),
    creatorShare: dec128("0"),
    validatorShare: dec128("0"),
    treasuryShare: dec128("0"),
    insuranceShare: dec128("0"),
    burnAmount: dec128("0"),
    responseMs: { type: Number, default: null },
    success: { type: Boolean, default: true, required: true },
    statusCode: { type: Number, default: null },
    trustDelta: { type: Number, default: 0, required: true },
    txSignature: { type: String, default: null, maxlength: 128 },
    onChainReceiptPda: { type: String, default: null, maxlength: 64 },
    settlementMethod: { type: String, enum: ["legacy_transfer", "aegis_program"], default: null },
    paymentToken: { type: String, default: null, maxlength: 512 },
    paymentVerified: { type: Boolean, default: false, required: true },
    guardrailInputPassed: { type: Boolean, default: true, required: true },
    guardrailOutputPassed: { type: Boolean, default: true, required: true },
    guardrailViolations: [{ type: String }],
    guardrailLatencyMs: { type: Number, default: 0, required: true },
  },
  { timestamps: true, toJSON: { getters: true }, toObject: { getters: true }, collection: "invocations" }
);
invocationSchema.index({ operatorId: 1 });
invocationSchema.index({ callerWallet: 1 });
invocationSchema.index({ createdAt: -1 });

const validatorSchema = new mongoose.Schema(
  {
    userId: { type: Number, default: null },
    wallet: { type: String, required: true, unique: true, maxlength: 64 },
    name: { type: String, required: true, maxlength: 256 },
    description: { type: String, default: null },
    stakeLamports: { type: Number, default: 0, required: true },
    status: { type: String, enum: ["active", "inactive", "slashed", "pending"], default: "pending", required: true },
    validatedCount: { type: Number, default: 0, required: true },
    slashedCount: { type: Number, default: 0, required: true },
    reputationScore: { type: Number, default: 50, required: true },
    totalEarnings: dec128("0"),
    commissionBps: { type: Number, default: 500, required: true },
    website: { type: String, default: null, maxlength: 1024 },
    avatarUrl: { type: String, default: null, maxlength: 1024 },
  },
  { timestamps: true, toJSON: { getters: true }, toObject: { getters: true }, collection: "validators" }
);
validatorSchema.index({ status: 1 });
validatorSchema.index({ reputationScore: -1 });

const operatorBondSchema = new mongoose.Schema(
  {
    operatorId: { type: mongoose.Schema.Types.Mixed, required: true },
    bondWallet: { type: String, required: true, maxlength: 64 },
    amountLamports: { type: Number, required: true },
    txSignature: { type: String, default: null, maxlength: 128 },
    status: { type: String, enum: ["active", "released", "slashed"], default: "active", required: true },
    slashReason: { type: String, default: null },
    bondedAt: { type: Date, default: Date.now, required: true },
    releasedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "operator_bonds" }
);
operatorBondSchema.index({ operatorId: 1 });
operatorBondSchema.index({ status: 1 });

const disputeSchema = new mongoose.Schema(
  {
    invocationId: { type: Number, required: true },
    operatorId: { type: mongoose.Schema.Types.Mixed, required: true },
    challengerWallet: { type: String, required: true, maxlength: 64 },
    reason: {
      type: String,
      enum: ["incorrect_output", "timeout", "overcharge", "schema_violation", "malicious_response", "other"],
      default: "other",
      required: true,
    },
    description: { type: String, default: null },
    evidenceUrl: { type: String, default: null, maxlength: 1024 },
    status: {
      type: String,
      enum: ["open", "under_review", "resolved_for_challenger", "resolved_for_operator", "dismissed"],
      default: "open",
      required: true,
    },
    resolutionNotes: { type: String, default: null },
    reviewerValidatorId: { type: Number, default: null },
    refundAmount: dec128("0"),
    slashAmount: dec128("0"),
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { getters: true }, toObject: { getters: true }, collection: "disputes" }
);
disputeSchema.index({ operatorId: 1 });
disputeSchema.index({ status: 1 });
disputeSchema.index({ challengerWallet: 1 });
disputeSchema.index({ invocationId: 1 });

const skillReviewSchema = new mongoose.Schema(
  {
    operatorId: { type: mongoose.Schema.Types.Mixed, required: true },
    reviewerWallet: { type: String, required: true, maxlength: 64 },
    reviewerUserId: { type: Number, default: null },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: null },
    flagged: { type: Boolean, default: false, required: true },
  },
  { timestamps: true, collection: "skill_reviews" }
);
skillReviewSchema.index({ operatorId: 1 });
skillReviewSchema.index({ reviewerWallet: 1 });

const reportSchema = new mongoose.Schema(
  {
    operatorId: { type: mongoose.Schema.Types.Mixed, required: true },
    validatorId: { type: Number, default: null },
    reporterWallet: { type: String, default: null, maxlength: 64 },
    reportType: {
      type: String,
      enum: ["quality-check", "security-audit", "performance-test", "dispute", "periodic-validation"],
      default: "quality-check",
      required: true,
    },
    score: { type: Number, required: true },
    findings: { type: String, default: null },
    applied: { type: Boolean, default: false, required: true },
  },
  { timestamps: true, collection: "reports" }
);
reportSchema.index({ operatorId: 1 });
reportSchema.index({ validatorId: 1 });

const paymentSchema = new mongoose.Schema(
  {
    invocationId: { type: mongoose.Schema.Types.Mixed, required: true },
    txSignature: { type: String, required: true, maxlength: 128 },
    totalAmount: dec128("0"),
    operatorShare: dec128("0"),
    protocolShare: dec128("0"),
    validatorShare: dec128("0"),
    insuranceShare: dec128("0"),
    burnAmount: dec128("0"),
    onChainReceiptPda: { type: String, default: null, maxlength: 64 },
    settlementMethod: { type: String, enum: ["legacy_transfer", "aegis_program"], default: "legacy_transfer", required: true },
    status: { type: String, enum: ["pending", "settled", "failed", "refunded"], default: "pending", required: true },
    settledAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { getters: true }, toObject: { getters: true }, collection: "payments" }
);
paymentSchema.index({ invocationId: 1 });
paymentSchema.index({ status: 1 });

const rateLimitSchema = new mongoose.Schema(
  {
    identifier: { type: String, required: true, maxlength: 128 },
    endpoint: { type: String, required: true, maxlength: 256 },
    requestCount: { type: Number, default: 0, required: true },
    windowStart: { type: Date, default: Date.now, required: true },
    windowSeconds: { type: Number, default: 60, required: true },
  },
  { timestamps: false, collection: "rate_limits" }
);
rateLimitSchema.index({ identifier: 1, endpoint: 1 });

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: Number, default: null },
    action: { type: String, required: true, maxlength: 128 },
    targetType: { type: String, default: null, maxlength: 64 },
    targetId: { type: Number, default: null },
    details: { type: mongoose.Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: null, maxlength: 64 },
  },
  { timestamps: true, collection: "audit_log" }
);
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ userId: 1 });

const protocolStatsSchema = new mongoose.Schema(
  {
    metric: { type: String, required: true, unique: true, maxlength: 128 },
    value: dec128("0"),
  },
  { timestamps: true, collection: "protocol_stats" }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 256 },
    description: { type: String, required: true },
    category: { type: String, default: "other", required: true },
    budget: dec128("0"),
    budgetAmount: { type: Number, default: 0, required: true },
    status: { type: String, default: "open", required: true },
    clientWallet: { type: String, required: true, maxlength: 64 },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assignedAgentId: { type: mongoose.Schema.Types.ObjectId, ref: "Agent", default: null },
    tags: [{ type: String }],
    requirements: { type: String, default: null },
    deliverableSpecs: [{ type: String }],
    proposalsCount: { type: Number, default: 0, required: true },
    paidAmount: dec128("0"),
    paymentTx: { type: String, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { getters: true }, toObject: { getters: true }, collection: "tasks" }
);

const proposalSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: "Agent", required: true },
    amount: { type: Number, required: true },
    coverLetter: { type: String, required: true },
    timeEstimate: { type: String, default: null },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending", required: true },
  },
  { timestamps: true, collection: "proposals" }
);

const agentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, maxlength: 128 },
    bio: { type: String, default: null, maxlength: 1000 },
    capabilities: [{ type: String }],
    walletAddress: { type: String, default: null, maxlength: 64, sparse: true },
    apiKeyHash: { type: String, required: true },
    apiKeyExpiresAt: { type: Date, default: null },
    reputation: { type: Number, default: 0, required: true },
    completedTasks: { type: Number, default: 0, required: true },
    totalEarnings: dec128("0"),
    totalProposals: { type: Number, default: 0, required: true },
    isVerified: { type: Boolean, default: false, required: true },
    website: { type: String, default: null, maxlength: 512 },
    twitter: { type: String, default: null, maxlength: 128 },
  },
  { timestamps: true, toJSON: { getters: true }, toObject: { getters: true }, collection: "agents" }
);

const revokedTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    revokedAt: { type: Date, default: Date.now, required: true },
  },
  { timestamps: false, collection: "revoked_tokens" }
);

const operatorTokenSchema = new mongoose.Schema(
  {
    operatorSlug: { type: String, required: true, unique: true },
    operatorId: { type: mongoose.Schema.Types.Mixed, default: null },
    tokenMint: { type: String, default: null },
    bagsUrl: { type: String, default: null },
    dexscreenerPair: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "operator_tokens" }
);

const mcpServerSchema = new mongoose.Schema(
  {
    serverUrl: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    ownerWallet: { type: String },
    description: { type: String },
    toolCount: { type: Number, default: 0 },
    tools: [{ name: String, description: String }],
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "revoked"],
      default: "unverified",
    },
    trustScore: { type: Number, default: 0 },
    lastScannedAt: { type: Date },
    scanResults: {
      connectivity: { type: Boolean, default: false },
      schemaValid: { type: Boolean, default: false },
      ssrfSafe: { type: Boolean, default: false },
      responseTimeMs: { type: Number },
      toolsEnumerated: { type: Number, default: 0 },
    },
    badgeType: {
      type: String,
      enum: ["none", "basic", "verified", "premium"],
      default: "none",
    },
  },
  { timestamps: true, collection: "mcp_servers" }
);
mcpServerSchema.index({ verificationStatus: 1 });
mcpServerSchema.index({ trustScore: -1 });

// ── Model registration ──────────────────────────────────────

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
const OperatorModel = mongoose.models.Operator || mongoose.model("Operator", operatorSchema);
const InvocationModel = mongoose.models.Invocation || mongoose.model("Invocation", invocationSchema);
const ValidatorModel = mongoose.models.Validator || mongoose.model("Validator", validatorSchema);
const OperatorBondModel = mongoose.models.OperatorBond || mongoose.model("OperatorBond", operatorBondSchema);
const DisputeModel = mongoose.models.Dispute || mongoose.model("Dispute", disputeSchema);
const SkillReviewModel = mongoose.models.SkillReview || mongoose.model("SkillReview", skillReviewSchema);
const ReportModel = mongoose.models.Report || mongoose.model("Report", reportSchema);
const PaymentModel = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
const RateLimitModel = mongoose.models.RateLimit || mongoose.model("RateLimit", rateLimitSchema);
const AuditLogModel = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
const ProtocolStatsModel = mongoose.models.ProtocolStat || mongoose.model("ProtocolStat", protocolStatsSchema);
const TaskModel = mongoose.models.Task || mongoose.model("Task", taskSchema);
const ProposalModel = mongoose.models.Proposal || mongoose.model("Proposal", proposalSchema);
const AgentModel = mongoose.models.Agent || mongoose.model("Agent", agentSchema);
const RevokedTokenModel = mongoose.models.RevokedToken || mongoose.model("RevokedToken", revokedTokenSchema);
const OperatorTokenModel = mongoose.models.OperatorToken || mongoose.model("OperatorToken", operatorTokenSchema);
const McpServerModel = mongoose.models.McpServer || mongoose.model("McpServer", mcpServerSchema);

// Export models for direct use (e.g. in mcp.ts)
export {
  UserModel, OperatorModel, InvocationModel, ValidatorModel,
  OperatorBondModel, DisputeModel, SkillReviewModel, ReportModel,
  PaymentModel, RateLimitModel, AuditLogModel, ProtocolStatsModel,
  TaskModel, ProposalModel, AgentModel, RevokedTokenModel, OperatorTokenModel,
  McpServerModel as McpServer,
};

// ────────────────────────────────────────────────────────────
// Helper: Auto-increment ID
// ────────────────────────────────────────────────────────────

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
}, { collection: "counters" });
const CounterModel = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

async function nextId(name: string): Promise<number> {
  const counter = await CounterModel.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

// ────────────────────────────────────────────────────────────
// Helper: Lean doc → plain object with numeric id
// ────────────────────────────────────────────────────────────

function toPlain(doc: any): any {
  if (!doc) return undefined;
  const obj = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  if (obj._id && !obj.id) obj.id = obj._id;
  return obj;
}

// ────────────────────────────────────────────────────────────
// User Queries
// ────────────────────────────────────────────────────────────

export interface InsertUser {
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  role?: "user" | "admin";
  lastSignedIn?: Date;
  walletAddress?: string | null;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const updateSet: Record<string, unknown> = {};
  if (user.name !== undefined) updateSet.name = user.name ?? null;
  if (user.email !== undefined) updateSet.email = user.email ?? null;
  if (user.loginMethod !== undefined) updateSet.loginMethod = user.loginMethod ?? null;
  if (user.lastSignedIn !== undefined) updateSet.lastSignedIn = user.lastSignedIn;
  if (user.role !== undefined) updateSet.role = user.role;
  else if (ENV.adminWallets.includes(user.openId)) updateSet.role = "admin";
  if (!updateSet.lastSignedIn) updateSet.lastSignedIn = new Date();

  await UserModel.findOneAndUpdate(
    { openId: user.openId },
    { $set: updateSet, $setOnInsert: { openId: user.openId } },
    { upsert: true, new: true }
  );
}

export async function getUserByOpenId(openId: string) {
  const doc = await UserModel.findOne({ openId }).lean();
  return toPlain(doc);
}

export async function getUserById(id: number | string) {
  // Support both numeric id (legacy) and ObjectId
  const doc = await UserModel.findById(id).lean();
  return toPlain(doc);
}

export async function updateUserWallet(userId: number | string, walletAddress: string) {
  await UserModel.findByIdAndUpdate(userId, { walletAddress });
}

// ────────────────────────────────────────────────────────────
// Operator Queries
// ────────────────────────────────────────────────────────────

export async function createOperator(data: Record<string, any>) {
  const doc = await OperatorModel.create(data);
  return toPlain(doc);
}

export async function getOperatorBySlug(slug: string) {
  const doc = await OperatorModel.findOne({ slug }).lean();
  return toPlain(doc);
}

export async function getOperatorById(id: number | string) {
  // Try by _id first, then by numeric id if applicable
  let doc = await OperatorModel.findById(id).lean();
  if (!doc && typeof id === "number") {
    doc = await OperatorModel.findOne({ id }).lean();
  }
  return toPlain(doc);
}

export async function listOperators(opts: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: "trust" | "invocations" | "earnings" | "newest";
  activeOnly?: boolean;
}) {
  const filter: Record<string, any> = {};
  if (opts.activeOnly !== false) filter.isActive = true;
  if (opts.category && opts.category !== "all") filter.category = opts.category;
  if (opts.search) {
    const escaped = String(opts.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 200);
    const re = new RegExp(escaped, "i");
    filter.$or = [{ name: re }, { tagline: re }];
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    trust: { trustScore: -1 },
    invocations: { totalInvocations: -1 },
    earnings: { totalEarned: -1 },
    newest: { createdAt: -1 },
  };
  const sort = sortMap[opts.sortBy || "trust"] || { trustScore: -1 };
  const limit = opts.limit || 20;
  const offset = opts.offset || 0;

  const [items, total] = await Promise.all([
    OperatorModel.find(filter).sort(sort).skip(offset).limit(limit).lean(),
    OperatorModel.countDocuments(filter),
  ]);

  return { operators: items.map(toPlain), total };
}

export async function updateOperator(id: number | string, data: Record<string, any>) {
  await OperatorModel.findByIdAndUpdate(id, { $set: data });
  return getOperatorById(id);
}

export async function softDeleteOperator(id: number | string) {
  await OperatorModel.findByIdAndUpdate(id, { $set: { isActive: false } });
}

export async function getOperatorsByCreator(walletAddress: string) {
  const docs = await OperatorModel.find({ creatorWallet: walletAddress }).sort({ createdAt: -1 }).lean();
  return docs.map(toPlain);
}

export async function getMcpServerByUrl(serverUrl: string) {
  return McpServerModel.findOne({ serverUrl }).lean();
}

export async function getOperatorsByUserId(userId: number | string) {
  const creatorIds = Array.from(new Set([userId, String(userId)]));
  const docs = await OperatorModel.find({ creatorId: { $in: creatorIds } }).sort({ createdAt: -1 }).lean();
  return docs.map(toPlain);
}

export async function getOperatorCount() {
  return OperatorModel.countDocuments({ isActive: true });
}

// ────────────────────────────────────────────────────────────
// Invocation Queries
// ────────────────────────────────────────────────────────────

export async function recordInvocation(data: Record<string, any>): Promise<number | string> {
  const doc = await InvocationModel.create(data);

  // Update operator stats atomically
  if (data.operatorId) {
    const incSet: Record<string, number> = { totalInvocations: 1 };
    if (data.success) incSet.successfulInvocations = 1;

    await OperatorModel.findByIdAndUpdate(data.operatorId, {
      $inc: incSet,
    });

    // Update totalEarned and avgResponseMs separately
    const op = await OperatorModel.findById(data.operatorId).lean();
    if (op) {
      const oldTotal = parseFloat((op as any).totalEarned?.toString() || "0");
      const newTotal = oldTotal + parseFloat(data.creatorShare || "0");
      const oldInvocations = ((op as any).totalInvocations || 1) - 1; // before increment
      const oldAvg = (op as any).avgResponseMs || 0;
      const newAvg = oldInvocations > 0
        ? Math.round((oldAvg * oldInvocations + (data.responseMs || 0)) / (oldInvocations + 1))
        : (data.responseMs || 0);

      await OperatorModel.findByIdAndUpdate(data.operatorId, {
        $set: {
          totalEarned: mongoose.Types.Decimal128.fromString(newTotal.toFixed(6)),
          avgResponseMs: newAvg,
        },
      });
    }
  }

  return doc._id;
}

export async function getInvocationById(id: number | string) {
  const doc = await InvocationModel.findById(id).lean();
  return toPlain(doc);
}

export async function getInvocationsByOperator(operatorId: number | string, limit = 50) {
  const docs = await InvocationModel.find({ operatorId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return docs.map(toPlain);
}

export async function getInvocationsByCaller(callerWallet: string, limit = 50) {
  const invocations = await InvocationModel.find({ callerWallet })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  // Join with operator data
  const opIds = Array.from(new Set(invocations.map(i => i.operatorId)));
  const operators = await OperatorModel.find({ _id: { $in: opIds } }).lean();
  const opMap = new Map(operators.map(o => [(o as any)._id?.toString(), o]));

  return invocations.map(inv => {
    const op = opMap.get(String(inv.operatorId)) as any;
    return {
      invocation: toPlain(inv),
      operatorName: op?.name || null,
      operatorSlug: op?.slug || null,
    };
  });
}

export async function getRecentInvocations(limit = 20) {
  const invocations = await InvocationModel.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const opIds = Array.from(new Set(invocations.map(i => i.operatorId)));
  const operators = await OperatorModel.find({ _id: { $in: opIds } }).lean();
  const opMap = new Map(operators.map(o => [(o as any)._id?.toString(), o]));

  return invocations.map(inv => {
    const op = opMap.get(String(inv.operatorId)) as any;
    return {
      invocation: toPlain(inv),
      operatorName: op?.name || null,
      operatorSlug: op?.slug || null,
    };
  });
}

export async function getOperatorEarnings(operatorId: number | string) {
  const now = new Date();
  const day = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const week = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const month = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const sumCreatorShare = (match: Record<string, any>) =>
    InvocationModel.aggregate([
      { $match: match },
      { $group: { _id: null, sum: { $sum: { $toDouble: "$creatorShare" } } } },
    ]).then(r => String(r[0]?.sum || 0));

  const baseMatch = { operatorId };
  const [total, last24h, last7d, last30d, countResult] = await Promise.all([
    sumCreatorShare(baseMatch),
    sumCreatorShare({ ...baseMatch, createdAt: { $gte: day } }),
    sumCreatorShare({ ...baseMatch, createdAt: { $gte: week } }),
    sumCreatorShare({ ...baseMatch, createdAt: { $gte: month } }),
    InvocationModel.countDocuments(baseMatch),
  ]);

  return { total, last24h, last7d, last30d, invocationCount: countResult };
}

// ────────────────────────────────────────────────────────────
// Validator Queries
// ────────────────────────────────────────────────────────────

export async function createValidator(data: Record<string, any>) {
  const doc = await ValidatorModel.create(data);
  return toPlain(doc);
}

export async function getValidatorByWallet(wallet: string) {
  const doc = await ValidatorModel.findOne({ wallet }).lean();
  return toPlain(doc);
}

export async function getValidatorById(id: number | string) {
  const doc = await ValidatorModel.findById(id).lean();
  return toPlain(doc);
}

export async function listValidators(opts: {
  status?: string;
  limit?: number;
  offset?: number;
  sortBy?: "reputation" | "stake" | "validated" | "newest";
}) {
  const filter: Record<string, any> = {};
  if (opts.status && opts.status !== "all") filter.status = opts.status;

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    reputation: { reputationScore: -1 },
    stake: { stakeLamports: -1 },
    validated: { validatedCount: -1 },
    newest: { createdAt: -1 },
  };
  const sort = sortMap[opts.sortBy || "reputation"] || { reputationScore: -1 };
  const limit = opts.limit || 20;
  const offset = opts.offset || 0;

  const [items, total] = await Promise.all([
    ValidatorModel.find(filter).sort(sort).skip(offset).limit(limit).lean(),
    ValidatorModel.countDocuments(filter),
  ]);

  return { validators: items.map(toPlain), total };
}

export async function updateValidator(id: number | string, data: Record<string, any>) {
  await ValidatorModel.findByIdAndUpdate(id, { $set: data });
  return getValidatorById(id);
}

export async function incrementValidatorCount(id: number | string, earnings: string) {
  await ValidatorModel.findByIdAndUpdate(id, {
    $inc: { validatedCount: 1 },
  });
  // Update totalEarnings
  const doc = await ValidatorModel.findById(id).lean();
  if (doc) {
    const oldEarnings = parseFloat((doc as any).totalEarnings?.toString() || "0");
    const newEarnings = oldEarnings + parseFloat(earnings || "0");
    await ValidatorModel.findByIdAndUpdate(id, {
      $set: { totalEarnings: mongoose.Types.Decimal128.fromString(newEarnings.toFixed(6)) },
    });
  }
}

export async function slashValidator(id: number | string) {
  const doc = await ValidatorModel.findById(id).lean();
  if (!doc) throw new Error("Validator not found");
  const newRep = Math.max(0, ((doc as any).reputationScore || 0) - 15);
  await ValidatorModel.findByIdAndUpdate(id, {
    $inc: { slashedCount: 1 },
    $set: { reputationScore: newRep },
  });
}

// ────────────────────────────────────────────────────────────
// Operator Bond Queries
// ────────────────────────────────────────────────────────────

export async function createBond(data: Record<string, any>) {
  await OperatorBondModel.create(data);
  // Update operator stake amount
  const op = await OperatorModel.findById(data.operatorId).lean();
  if (op) {
    const oldStake = parseFloat((op as any).stakeAmount?.toString() || "0");
    const newStake = oldStake + (data.amountLamports || 0);
    await OperatorModel.findByIdAndUpdate(data.operatorId, {
      $set: { stakeAmount: mongoose.Types.Decimal128.fromString(String(newStake)) },
    });
  }
}

export async function getBondsByOperator(operatorId: number | string) {
  const docs = await OperatorBondModel.find({ operatorId }).sort({ bondedAt: -1 }).lean();
  return docs.map(toPlain);
}

export async function releaseBond(bondId: number | string) {
  const bond = await OperatorBondModel.findById(bondId).lean();
  if (!bond) throw new Error("Bond not found");
  if ((bond as any).status !== "active") throw new Error("Bond is not active");

  await OperatorBondModel.findByIdAndUpdate(bondId, {
    $set: { status: "released", releasedAt: new Date() },
  });

  const op = await OperatorModel.findById((bond as any).operatorId).lean();
  if (op) {
    const oldStake = parseFloat((op as any).stakeAmount?.toString() || "0");
    const newStake = Math.max(0, oldStake - ((bond as any).amountLamports || 0));
    await OperatorModel.findByIdAndUpdate((bond as any).operatorId, {
      $set: { stakeAmount: mongoose.Types.Decimal128.fromString(String(newStake)) },
    });
  }
}

export async function slashBond(bondId: number | string, reason: string) {
  await OperatorBondModel.findByIdAndUpdate(bondId, {
    $set: { status: "slashed", slashReason: reason, releasedAt: new Date() },
  });
}

// ────────────────────────────────────────────────────────────
// Dispute Queries
// ────────────────────────────────────────────────────────────

export async function createDispute(data: Record<string, any>): Promise<number | string> {
  const doc = await DisputeModel.create(data);
  return doc._id;
}

export async function getDisputeById(id: number | string) {
  const doc = await DisputeModel.findById(id).lean();
  return toPlain(doc);
}

export async function listDisputes(opts: {
  status?: string;
  operatorId?: number;
  limit?: number;
  offset?: number;
}) {
  const filter: Record<string, any> = {};
  if (opts.status && opts.status !== "all") filter.status = opts.status;
  if (opts.operatorId) filter.operatorId = opts.operatorId;

  const limit = opts.limit || 20;
  const offset = opts.offset || 0;

  const [items, total] = await Promise.all([
    DisputeModel.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
    DisputeModel.countDocuments(filter),
  ]);

  return { disputes: items.map(toPlain), total };
}

export async function resolveDispute(
  id: number | string,
  data: {
    status: "resolved_for_challenger" | "resolved_for_operator" | "dismissed";
    resolutionNotes?: string;
    refundAmount?: string;
    slashAmount?: string;
    reviewerValidatorId?: number;
  }
) {
  await DisputeModel.findByIdAndUpdate(id, {
    $set: {
      status: data.status,
      resolutionNotes: data.resolutionNotes || null,
      refundAmount: data.refundAmount
        ? mongoose.Types.Decimal128.fromString(data.refundAmount)
        : undefined,
      slashAmount: data.slashAmount
        ? mongoose.Types.Decimal128.fromString(data.slashAmount)
        : undefined,
      reviewerValidatorId: data.reviewerValidatorId || null,
      resolvedAt: new Date(),
    },
  });
}

// ────────────────────────────────────────────────────────────
// Skill Review Queries
// ────────────────────────────────────────────────────────────

export async function createReview(data: Record<string, any>) {
  await SkillReviewModel.create(data);
}

export async function getReviewsByOperator(operatorId: number | string, limit = 50) {
  const docs = await SkillReviewModel.find({ operatorId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return docs.map(toPlain);
}

export async function getAverageRating(operatorId: number | string) {
  const result = await SkillReviewModel.aggregate([
    { $match: { operatorId } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const row = result[0];
  return {
    average: row ? Math.round((row.avg || 0) * 10) / 10 : 0,
    count: row?.count || 0,
  };
}

// ────────────────────────────────────────────────────────────
// Report Queries
// ────────────────────────────────────────────────────────────

export async function createReport(data: Record<string, any>) {
  await ReportModel.create(data);
}

export async function getReportsByOperator(operatorId: number | string) {
  const docs = await ReportModel.find({ operatorId }).sort({ createdAt: -1 }).lean();
  return docs.map(toPlain);
}

// ────────────────────────────────────────────────────────────
// Payment Queries
// ────────────────────────────────────────────────────────────

export async function createPayment(data: Record<string, any>): Promise<number | string> {
  const doc = await PaymentModel.create(data);
  return doc._id;
}

export async function hasPaymentTxSignature(txSignature: string): Promise<boolean> {
  if (!txSignature) return false;
  const existing = await PaymentModel.exists({ txSignature });
  return Boolean(existing);
}

export async function settlePayment(id: number | string, txSignature: string) {
  await PaymentModel.findByIdAndUpdate(id, {
    $set: { status: "settled", txSignature, settledAt: new Date() },
  });
}

export async function getPaymentsByInvocation(invocationId: number | string) {
  const docs = await PaymentModel.find({ invocationId }).lean();
  return docs.map(toPlain);
}

// ────────────────────────────────────────────────────────────
// Rate Limiting
// ────────────────────────────────────────────────────────────

export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowSeconds * 1000);

    const existing = await RateLimitModel.findOne({
      identifier,
      endpoint,
      windowStart: { $gte: windowStart },
    });

    if (existing) {
      if (existing.requestCount >= maxRequests) {
        const resetAt = new Date(existing.windowStart.getTime() + windowSeconds * 1000);
        return { allowed: false, remaining: 0, resetAt };
      }
      await RateLimitModel.findByIdAndUpdate(existing._id, { $inc: { requestCount: 1 } });
      return {
        allowed: true,
        remaining: maxRequests - existing.requestCount - 1,
        resetAt: new Date(existing.windowStart.getTime() + windowSeconds * 1000),
      };
    }

    // Create new window
    await RateLimitModel.create({ identifier, endpoint, requestCount: 1, windowStart: now, windowSeconds });
    return { allowed: true, remaining: maxRequests - 1, resetAt: new Date(now.getTime() + windowSeconds * 1000) };
  } catch (err) {
    logger.error({ err }, "[RateLimit] DB error, failing closed");
    return { allowed: false, remaining: 0, resetAt: new Date(Date.now() + windowSeconds * 1000) };
  }
}

export async function cleanupRateLimits() {
  const cutoff = new Date(Date.now() - 3600 * 1000);
  await RateLimitModel.deleteMany({ windowStart: { $lte: cutoff } });
}

// ────────────────────────────────────────────────────────────
// Audit Log
// ────────────────────────────────────────────────────────────

export async function logAudit(data: Record<string, any>) {
  try {
    await AuditLogModel.create(data);
  } catch (err) {
    logger.error({ err }, "[Audit] Failed to log");
  }
}

export async function getAuditLog(opts: { userId?: number; action?: string; limit?: number; offset?: number }) {
  const filter: Record<string, any> = {};
  if (opts.userId) filter.userId = opts.userId;
  if (opts.action) filter.action = opts.action;

  const limit = opts.limit || 50;
  const offset = opts.offset || 0;

  const [items, total] = await Promise.all([
    AuditLogModel.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
    AuditLogModel.countDocuments(filter),
  ]);

  return { entries: items.map(toPlain), total };
}

// ────────────────────────────────────────────────────────────
// Protocol Stats
// ────────────────────────────────────────────────────────────

export async function getProtocolStats() {
  const [totalOps, realOps, totalVals, totalDisp, openDisp, healthyOps, degradedOps] = await Promise.all([
    OperatorModel.countDocuments({ isActive: true }),
    OperatorModel.countDocuments({ isActive: true, skill: { $nin: [null, ""] } }),
    ValidatorModel.countDocuments({ status: "active" }),
    DisputeModel.countDocuments(),
    DisputeModel.countDocuments({ status: "open" }),
    OperatorModel.countDocuments({ healthStatus: "healthy" }),
    OperatorModel.countDocuments({ healthStatus: "degraded" }),
  ]);

  const invocationAgg = await OperatorModel.aggregate([
    { $group: { _id: null, totalInvocations: { $sum: "$totalInvocations" }, totalEarnings: { $sum: { $toDouble: "$totalEarned" } } } },
  ]);
  const agg = invocationAgg[0] || { totalInvocations: 0, totalEarnings: 0 };

  // Compute real avg trust score
  const trustAgg = await OperatorModel.aggregate([
    { $match: { isActive: true, trustScore: { $gt: 0 } } },
    { $group: { _id: null, avg: { $avg: "$trustScore" } } },
  ]);
  const avgTrustScore = trustAgg[0]?.avg ? Math.round(trustAgg[0].avg * 10) / 10 : 0;

  // Guardrail metrics
  const [guardrailChecks, guardrailBlocks] = await Promise.all([
    InvocationModel.countDocuments({ guardrailInputPassed: { $exists: true } }),
    InvocationModel.countDocuments({ guardrailInputPassed: false }),
  ]);

  return {
    totalOperators: totalOps,
    realOperators: realOps,
    totalInvocations: agg.totalInvocations,
    totalEarnings: String(agg.totalEarnings || 0),
    avgTrustScore,
    totalValidators: totalVals,
    totalDisputes: totalDisp,
    openDisputes: openDisp,
    health: {
      healthy: healthyOps,
      degraded: degradedOps,
    },
    guardrails: {
      totalChecks: guardrailChecks,
      blocked: guardrailBlocks,
      passRate: guardrailChecks > 0 ? ((guardrailChecks - guardrailBlocks) / guardrailChecks * 100).toFixed(1) : "100.0",
      serverStatus: (process.env.GUARDRAILS_ENABLED ?? "true") === "true" ? "active" : "standby",
    },
  };
}

// ────────────────────────────────────────────────────────────
// Guardrail Stats
// ────────────────────────────────────────────────────────────

export async function getGuardrailStats(operatorId?: number | string) {
  const match: Record<string, any> = { guardrailLatencyMs: { $gt: 0 } };
  if (operatorId) match.operatorId = operatorId;

  const [result, operatorsProtected] = await Promise.all([
    InvocationModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalChecked: { $sum: 1 },
          inputPassCount: { $sum: { $cond: ["$guardrailInputPassed", 1, 0] } },
          outputPassCount: { $sum: { $cond: ["$guardrailOutputPassed", 1, 0] } },
          inputFailCount: { $sum: { $cond: [{ $eq: ["$guardrailInputPassed", false] }, 1, 0] } },
          outputFailCount: { $sum: { $cond: [{ $eq: ["$guardrailOutputPassed", false] }, 1, 0] } },
          avgLatencyMs: { $avg: "$guardrailLatencyMs" },
        },
      },
    ]),
    operatorId
      ? Promise.resolve(1)
      : InvocationModel.distinct("operatorId", { guardrailLatencyMs: { $gt: 0 } }).then((ids: any[]) => ids.length),
  ]);

  const row = result[0];
  const total = row?.totalChecked || 0;
  const inputFail = row?.inputFailCount || 0;
  const outputFail = row?.outputFailCount || 0;
  const totalViolations = inputFail + outputFail;

  return {
    totalChecked: total,
    inputPassRate: total > 0 ? Math.round(((row?.inputPassCount || 0) / total) * 10000) / 100 : 100,
    outputPassRate: total > 0 ? Math.round(((row?.outputPassCount || 0) / total) * 10000) / 100 : 100,
    inputFailCount: inputFail,
    outputFailCount: outputFail,
    violationRate: total > 0 ? Math.round((totalViolations / total) * 10000) / 100 : 0,
    operatorsProtected: operatorsProtected as number,
    avgLatencyMs: Math.round(row?.avgLatencyMs || 0),
    guardrailsEnabled: process.env.GUARDRAILS_ENABLED === "true",
  };
}

export async function getGuardrailViolationTypes(limit = 5) {
  const result = await InvocationModel.aggregate([
    { $match: { guardrailViolations: { $exists: true, $ne: [] } } },
    { $unwind: "$guardrailViolations" },
    { $group: { _id: "$guardrailViolations", count: { $sum: 1 } } },
    { $sort: { count: -1 as const } },
    { $limit: limit },
  ]);
  return result.map((r: any) => ({ type: r._id as string, count: r.count as number }));
}

export async function getRecentGuardrailViolations(limit = 10) {
  const docs = await InvocationModel.find({
    $or: [{ guardrailInputPassed: false }, { guardrailOutputPassed: false }],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  // Join with operator data
  const operatorIds = [...new Set(docs.map((d: any) => d.operatorId))];
  const operators = await OperatorModel.find({ _id: { $in: operatorIds } })
    .select("name slug category")
    .lean();
  const opMap = new Map(operators.map((o: any) => [String(o._id), o]));

  return docs.map((inv: any) => {
    const op = opMap.get(String(inv.operatorId));
    return {
      operatorName: op?.name || "Unknown",
      type: inv.guardrailInputPassed === false ? "input" : "output",
      violations: (inv.guardrailViolations || []) as string[],
      timestamp: inv.createdAt,
      latencyMs: inv.guardrailLatencyMs,
    };
  });
}

// ────────────────────────────────────────────────────────────
// Trust Engine Queries
// ────────────────────────────────────────────────────────────

export async function getActiveOperatorIds(): Promise<any[]> {
  const docs = await OperatorModel.find({ isActive: true }).select("_id").lean();
  return docs.map((d: any) => d._id);
}

export async function updateOperatorTrustScore(id: number | string, trustScore: number) {
  await OperatorModel.findByIdAndUpdate(id, { $set: { trustScore } });
}

export async function getTrustComponentsForOperator(operatorId: number | string) {
  const [opData, reviewData, disputeData] = await Promise.all([
    OperatorModel.findById(operatorId).lean(),
    SkillReviewModel.aggregate([
      { $match: { operatorId } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]),
    DisputeModel.countDocuments({ operatorId }),
  ]);

  const op = opData as any;
  const totalInvocations = op?.totalInvocations ?? 0;
  const successfulInvocations = op?.successfulInvocations ?? 0;

  return {
    avgResponseMs: op?.avgResponseMs ?? 0,
    totalInvocations,
    successfulInvocations,
    guardrailPassCount: successfulInvocations,
    avgRating: reviewData[0]?.avg ?? 0,
    reviewCount: reviewData[0]?.count ?? 0,
    disputeCount: disputeData,
  };
}

// ────────────────────────────────────────────────────────────
// Creator Earnings Queries
// ────────────────────────────────────────────────────────────

export async function getCreatorEarningsData(walletAddress: string) {
  const now = new Date();
  const day = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const week = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const month = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const creatorOps = await OperatorModel.find({ creatorWallet: walletAddress })
    .select("_id name slug")
    .lean();

  if (creatorOps.length === 0) {
    return { total: "0", last24h: "0", last7d: "0", last30d: "0", pending: "0", settled: "0", byOperator: [] };
  }

  const opIds = creatorOps.map((o: any) => o._id);

  const sumShare = (extraMatch: Record<string, any> = {}) =>
    InvocationModel.aggregate([
      { $match: { operatorId: { $in: opIds }, ...extraMatch } },
      { $group: { _id: null, sum: { $sum: { $toDouble: "$creatorShare" } } } },
    ]).then(r => String(r[0]?.sum || 0));

  const sumPayments = (status: string) =>
    PaymentModel.aggregate([
      { $match: { status } },
      {
        $lookup: {
          from: "invocations",
          localField: "invocationId",
          foreignField: "_id",
          as: "inv",
        },
      },
      { $unwind: "$inv" },
      { $match: { "inv.operatorId": { $in: opIds } } },
      { $group: { _id: null, sum: { $sum: { $toDouble: "$operatorShare" } } } },
    ]).then(r => String(r[0]?.sum || 0));

  const [total, last24h, last7d, last30d, pending, settled, byOpRes] = await Promise.all([
    sumShare(),
    sumShare({ createdAt: { $gte: day } }),
    sumShare({ createdAt: { $gte: week } }),
    sumShare({ createdAt: { $gte: month } }),
    sumPayments("pending"),
    sumPayments("settled"),
    InvocationModel.aggregate([
      { $match: { operatorId: { $in: opIds } } },
      {
        $group: {
          _id: "$operatorId",
          total: { $sum: { $toDouble: "$creatorShare" } },
          invocationCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  const opMap = new Map(creatorOps.map((o: any) => [String(o._id), o]));
  const byOperator = byOpRes.map((row: any) => ({
    operatorId: row._id,
    operatorName: (opMap.get(String(row._id)) as any)?.name || "Unknown",
    operatorSlug: (opMap.get(String(row._id)) as any)?.slug || "unknown",
    total: String(row.total),
    invocationCount: row.invocationCount,
  }));

  return { total, last24h, last7d, last30d, pending, settled, byOperator };
}

export async function getCreatorDailyAnalytics(walletAddress: string, days: number) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const creatorOps = await OperatorModel.find({ creatorWallet: walletAddress }).select("_id").lean();
  if (creatorOps.length === 0) return [];
  const opIds = creatorOps.map((o: any) => o._id);

  const result = await InvocationModel.aggregate([
    { $match: { operatorId: { $in: opIds }, createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        invocations: { $sum: 1 },
        revenue: { $sum: { $toDouble: "$creatorShare" } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return result.map((row: any) => ({
    date: row._id,
    invocations: row.invocations,
    revenue: String(row.revenue),
  }));
}

export async function getCreatorOperatorsWithStats(walletAddress: string) {
  const docs = await OperatorModel.find({ creatorWallet: walletAddress })
    .sort({ totalEarned: -1 })
    .lean();

  return docs.map((doc: any) => ({
    id: doc._id,
    name: doc.name,
    slug: doc.slug,
    category: doc.category,
    trustScore: doc.trustScore,
    totalInvocations: doc.totalInvocations,
    successfulInvocations: doc.successfulInvocations,
    totalEarned: doc.totalEarned?.toString() || "0",
    avgResponseMs: doc.avgResponseMs,
    isActive: doc.isActive,
    isVerified: doc.isVerified,
    createdAt: doc.createdAt,
  }));
}

// ────────────────────────────────────────────────────────────
// Admin Stats
// ────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const now = new Date();
  const day = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const week = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    userCount, operatorCount, invocationAgg, validatorCount,
    disputeCount, revenueAgg, revenue24hAgg, revenue7dAgg,
    invocations24h, newUsers24h,
  ] = await Promise.all([
    UserModel.countDocuments(),
    OperatorModel.countDocuments(),
    OperatorModel.aggregate([{ $group: { _id: null, total: { $sum: "$totalInvocations" } } }]),
    ValidatorModel.countDocuments(),
    DisputeModel.countDocuments({ status: "open" }),
    OperatorModel.aggregate([{ $group: { _id: null, total: { $sum: { $toDouble: "$totalEarned" } } } }]),
    InvocationModel.aggregate([
      { $match: { createdAt: { $gte: day } } },
      { $group: { _id: null, total: { $sum: { $toDouble: "$amountPaid" } } } },
    ]),
    InvocationModel.aggregate([
      { $match: { createdAt: { $gte: week } } },
      { $group: { _id: null, total: { $sum: { $toDouble: "$amountPaid" } } } },
    ]),
    InvocationModel.countDocuments({ createdAt: { $gte: day } }),
    UserModel.countDocuments({ createdAt: { $gte: day } }),
  ]);

  return {
    users: userCount,
    operators: operatorCount,
    totalInvocations: invocationAgg[0]?.total || 0,
    validators: validatorCount,
    openDisputes: disputeCount,
    revenueTotal: String(revenueAgg[0]?.total || 0),
    revenue24h: String(revenue24hAgg[0]?.total || 0),
    revenue7d: String(revenue7dAgg[0]?.total || 0),
    invocations24h,
    newUsers24h,
  };
}

// ────────────────────────────────────────────────────────────
// Task / Proposal / Agent Queries (for MCP)
// ────────────────────────────────────────────────────────────

export async function listTasks(opts: {
  category?: string;
  status?: string;
  search?: string;
  limit?: number;
}) {
  const filter: Record<string, any> = {};
  if (opts.category) filter.category = opts.category;
  if (opts.status) filter.status = opts.status;
  if (opts.search) {
    const escaped = String(opts.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 200);
    const re = new RegExp(escaped, "i");
    filter.$or = [{ title: re }, { description: re }];
  }
  const limit = opts.limit || 20;

  const [tasks, total] = await Promise.all([
    TaskModel.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
    TaskModel.countDocuments(filter),
  ]);

  return { tasks: tasks.map(toPlain), total };
}

export async function createTask(data: Record<string, any>) {
  if (data.budget && typeof data.budget === "string") {
    data.budget = mongoose.Types.Decimal128.fromString(data.budget);
  }
  const doc = await TaskModel.create(data);
  return toPlain(doc);
}

export async function createProposal(data: Record<string, any>) {
  const doc = await ProposalModel.create(data);
  return toPlain(doc);
}

export async function createAgent(data: Record<string, any>) {
  const doc = await AgentModel.create(data);
  const plain = toPlain(doc);
  // Never leak apiKeyHash in any response
  delete plain.apiKeyHash;
  return plain;
}

// ────────────────────────────────────────────────────────────
// API Key Schema
// ────────────────────────────────────────────────────────────

const apiKeySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    keyHash: { type: String, required: true, unique: true }, // SHA-256 of the key
    keyPrefix: { type: String, required: true }, // First 14 chars for display: "sk-aegis-..."
    scopes: [{ type: String, enum: ["read", "invoke", "register", "admin"] }],
    lastUsedAt: { type: Date },
    usageCount: { type: Number, default: 0 },
    rateLimit: { type: Number, default: 60 }, // requests per minute
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
  },
  { timestamps: true, collection: "apikeys" }
);

apiKeySchema.index({ userId: 1 });
export const ApiKey = mongoose.models.ApiKey || mongoose.model("ApiKey", apiKeySchema);
