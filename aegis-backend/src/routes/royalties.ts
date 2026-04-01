/**
 * REST API routes for the royalty system.
 * Base path: /api/royalties
 */
import { Router, type Request, type Response } from "express";
import { Types } from "mongoose";
import { OperatorModel } from "../db";
import {
  type DependencyTreeNode,
  registerDependency,
  removeDependency,
  getDependencyTree,
  calculateRoyalties,
  recordRoyaltyPayments,
  updateRoyaltyVault,
  getCreatorEarnings,
  claimRoyalties,
  getRoyaltyLeaderboard,
  getRoyaltyStats,
} from "../royalties";

// ────────────────────────────────────────────────────────────
// Tree mapper (module-level to avoid strict-mode block issue)
// ────────────────────────────────────────────────────────────

function mapDependencyTree(node: DependencyTreeNode): unknown {
  return {
    skill: node.skillName,
    slug: node.slug,
    creatorWallet: node.creatorWallet,
    royaltyBps: node.royaltyBps,
    depth: node.depth,
    children: node.parents.map(mapDependencyTree),
  };
}

const router = Router();

// ────────────────────────────────────────────────────────────
// Auth helper
// ────────────────────────────────────────────────────────────

/**
 * Very lightweight wallet-based auth check.
 * The caller must provide the `x-creator-wallet` header whose value must
 * match the `childCreatorWallet` (or `creatorWallet`) in the request body.
 * Full JWT / session verification would happen in middleware upstream;
 * this guard ensures the header and body wallet are consistent.
 */
function requireWalletAuth(
  req: Request,
  expectedWallet: string,
  res: Response
): boolean {
  const headerWallet = (req.headers["x-creator-wallet"] as string | undefined)?.trim();
  if (!headerWallet) {
    res.status(401).json({ error: "Missing x-creator-wallet header" });
    return false;
  }
  if (headerWallet !== expectedWallet) {
    res.status(401).json({ error: "Auth token does not match creatorWallet" });
    return false;
  }
  return true;
}

// ────────────────────────────────────────────────────────────
// Input validation helpers
// ────────────────────────────────────────────────────────────

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isSolanaWallet(v: unknown): v is string {
  return typeof v === "string" && v.length >= 32 && v.length <= 64;
}

function isValidRoyaltyBps(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 2000;
}

// ────────────────────────────────────────────────────────────
// POST /api/royalties/register-dependency
// ────────────────────────────────────────────────────────────

router.post("/register-dependency", async (req: Request, res: Response) => {
  const { parentSkillSlug, childSkillSlug, royaltyBps, childCreatorWallet, onChainEdgePda } =
    req.body as Record<string, unknown>;

  if (!isNonEmptyString(parentSkillSlug)) {
    res.status(400).json({ error: "parentSkillSlug is required" });
    return;
  }
  if (!isNonEmptyString(childSkillSlug)) {
    res.status(400).json({ error: "childSkillSlug is required" });
    return;
  }
  if (!isValidRoyaltyBps(royaltyBps)) {
    res.status(400).json({ error: "royaltyBps must be an integer between 1 and 2000" });
    return;
  }
  if (!isSolanaWallet(childCreatorWallet)) {
    res.status(400).json({ error: "childCreatorWallet must be a valid wallet address (32-64 chars)" });
    return;
  }
  if (!isNonEmptyString(onChainEdgePda)) {
    res.status(400).json({ error: "onChainEdgePda is required" });
    return;
  }

  if (!requireWalletAuth(req, childCreatorWallet as string, res)) return;

  try {
    const edge = await registerDependency({
      parentSkillSlug: (parentSkillSlug as string).trim(),
      childSkillSlug: (childSkillSlug as string).trim(),
      royaltyBps: royaltyBps as number,
      childCreatorWallet: (childCreatorWallet as string).trim(),
      onChainEdgePda: (onChainEdgePda as string).trim(),
    });

    res.status(201).json({ success: true, edge });
  } catch (err) {
    const message = "Failed to register dependency";
    const status =
      message.includes("not found") ? 404 :
      message.includes("cycle") || message.includes("depth") || message.includes("already exists") || message.includes("creator") ? 400 :
      500;
    res.status(status).json({ error: message });
  }
});

// ────────────────────────────────────────────────────────────
// DELETE /api/royalties/remove-dependency
// ────────────────────────────────────────────────────────────

router.delete("/remove-dependency", async (req: Request, res: Response) => {
  const { parentSkillSlug, childSkillSlug, childCreatorWallet } =
    req.body as Record<string, unknown>;

  if (!isNonEmptyString(childSkillSlug)) {
    res.status(400).json({ error: "childSkillSlug is required" });
    return;
  }
  if (!isSolanaWallet(childCreatorWallet)) {
    res.status(400).json({ error: "childCreatorWallet must be a valid wallet address" });
    return;
  }

  if (!requireWalletAuth(req, childCreatorWallet as string, res)) return;

  // Resolve childSkillId from slug
  const childOp = await OperatorModel.findOne({
    slug: (childSkillSlug as string).trim(),
  })
    .select("_id")
    .lean();

  if (!childOp) {
    res.status(404).json({ error: `Child skill not found: ${childSkillSlug}` });
    return;
  }

  try {
    await removeDependency(
      childOp._id as Types.ObjectId,
      (childCreatorWallet as string).trim()
    );

    res.json({ success: true, removed: { parentSkillSlug, childSkillSlug } });
  } catch (err) {
    const message = "Failed to remove dependency";
    const status = message.includes("not found") ? 404 : message.includes("creator") ? 403 : 500;
    res.status(status).json({ error: message });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/royalties/tree/:skillSlug
// ────────────────────────────────────────────────────────────

router.get("/tree/:skillSlug", async (req: Request, res: Response) => {
  const { skillSlug } = req.params;

  if (!isNonEmptyString(skillSlug)) {
    res.status(400).json({ error: "skillSlug is required" });
    return;
  }

  try {
    const tree = await getDependencyTree(skillSlug.trim());

    if (!tree) {
      res.status(404).json({ error: `Skill not found: ${skillSlug}` });
      return;
    }

    res.json(mapDependencyTree(tree));
  } catch (err) {
    const message = "Failed to fetch dependency tree";
    res.status(500).json({ error: message });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/royalties/earnings/:wallet
// ────────────────────────────────────────────────────────────

router.get("/earnings/:wallet", async (req: Request, res: Response) => {
  const { wallet } = req.params;

  if (!isSolanaWallet(wallet)) {
    res.status(400).json({ error: "Invalid wallet address" });
    return;
  }

  try {
    const { vault, recentPayments, topSources } = await getCreatorEarnings(wallet.trim());

    res.json({
      unclaimed: vault?.unclaimed?.toString() ?? "0",
      totalEarned: vault?.totalEarned?.toString() ?? "0",
      totalClaimed: vault?.totalClaimed?.toString() ?? "0",
      lastClaimAt: vault?.lastClaimAt ?? null,
      lastDepositAt: vault?.lastDepositAt ?? null,
      onChainVaultPda: vault?.onChainVaultPda ?? "",
      recentPayments: recentPayments.map((p) => ({
        id: p._id,
        childSkillSlug: p.childSkillSlug,
        parentSkillSlug: p.parentSkillSlug,
        invocationAmount: p.invocationAmount?.toString() ?? "0",
        royaltyAmount: p.royaltyAmount?.toString() ?? "0",
        depth: p.depth,
        status: p.status,
        settledAt: p.settledAt,
        createdAt: (p as unknown as { createdAt?: unknown }).createdAt,
      })),
      topSources,
    });
  } catch (err) {
    const message = "Failed to fetch earnings";
    res.status(500).json({ error: message });
  }
});

// ────────────────────────────────────────────────────────────
// POST /api/royalties/claim
// ────────────────────────────────────────────────────────────

router.post("/claim", async (req: Request, res: Response) => {
  const { creatorWallet, txSignature } = req.body as Record<string, unknown>;

  if (!isSolanaWallet(creatorWallet)) {
    res.status(400).json({ error: "creatorWallet must be a valid wallet address" });
    return;
  }
  if (!isNonEmptyString(txSignature)) {
    res.status(400).json({ error: "txSignature is required" });
    return;
  }

  if (!requireWalletAuth(req, creatorWallet as string, res)) return;

  try {
    const amountClaimed = await claimRoyalties((creatorWallet as string).trim());

    res.json({
      success: true,
      amountClaimed,
      txSignature,
    });
  } catch (err) {
    const message = "Failed to claim royalties";
    const status =
      message.includes("No royalty vault") || message.includes("No unclaimed") ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/royalties/leaderboard
// ────────────────────────────────────────────────────────────

router.get("/leaderboard", async (req: Request, res: Response) => {
  const rawLimit = req.query.limit;
  const limit = rawLimit !== undefined ? parseInt(String(rawLimit), 10) : 20;

  if (isNaN(limit) || limit < 1 || limit > 100) {
    res.status(400).json({ error: "limit must be an integer between 1 and 100" });
    return;
  }

  try {
    const leaderboard = await getRoyaltyLeaderboard(limit);
    res.json(leaderboard);
  } catch (err) {
    const message = "Failed to fetch leaderboard";
    res.status(500).json({ error: message });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/royalties/stats
// ────────────────────────────────────────────────────────────

router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const stats = await getRoyaltyStats();
    res.json(stats);
  } catch (err) {
    const message = "Failed to fetch royalty stats";
    res.status(500).json({ error: message });
  }
});

// ────────────────────────────────────────────────────────────
// POST /api/royalties/distribute  (internal - trigger distribution)
// ────────────────────────────────────────────────────────────
// This endpoint is intended for internal use by the invocation engine
// to record and distribute royalties after a successful invocation.

router.post("/distribute", async (req: Request, res: Response) => {
  // Authentication: internal endpoint only
  const internalKey = req.headers["x-internal-key"];
  if (!process.env.INTERNAL_API_KEY || internalKey !== process.env.INTERNAL_API_KEY) {
    return res.status(403).json({ error: "Forbidden: internal endpoint" });
  }

  const { invocationId, childSkillSlug, invocationAmount, txSignature } =
    req.body as Record<string, unknown>;

  if (!isNonEmptyString(invocationId)) {
    res.status(400).json({ error: "invocationId is required" });
    return;
  }
  if (!isNonEmptyString(childSkillSlug)) {
    res.status(400).json({ error: "childSkillSlug is required" });
    return;
  }
  if (typeof invocationAmount !== "string" || isNaN(parseFloat(invocationAmount as string))) {
    res.status(400).json({ error: "invocationAmount must be a numeric string" });
    return;
  }

  const childOp = await OperatorModel.findOne({
    slug: (childSkillSlug as string).trim(),
  })
    .select("_id")
    .lean();

  if (!childOp) {
    res.status(404).json({ error: `Skill not found: ${childSkillSlug}` });
    return;
  }

  try {
    let invocationObjId: Types.ObjectId;
    try {
      invocationObjId = new Types.ObjectId(invocationId as string);
    } catch {
      res.status(400).json({ error: "invocationId is not a valid ObjectId" });
      return;
    }

    const payments = await calculateRoyalties(
      invocationObjId,
      childOp._id as Types.ObjectId,
      invocationAmount as string
    );

    if (payments.length === 0) {
      res.json({ success: true, paymentsRecorded: 0, distributions: [] });
      return;
    }

    // Attach txSignature to each payment if provided
    const enrichedPayments = isNonEmptyString(txSignature)
      ? payments.map((p) => ({ ...p, txSignature: txSignature as string }))
      : payments;

    const recorded = await recordRoyaltyPayments(enrichedPayments);

    // Update each creator's vault balance
    await Promise.all(
      payments.map((p) => updateRoyaltyVault(p.parentCreatorWallet, p.royaltyAmount))
    );

    res.status(201).json({
      success: true,
      paymentsRecorded: recorded.length,
      distributions: payments.map((p) => ({
        parentSkillSlug: p.parentSkillSlug,
        parentCreatorWallet: p.parentCreatorWallet,
        royaltyAmount: p.royaltyAmount,
        depth: p.depth,
      })),
    });
  } catch (err) {
    const message = "Failed to distribute royalties";
    res.status(500).json({ error: message });
  }
});

export default router;
