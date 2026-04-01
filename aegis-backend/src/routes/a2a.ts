import { Router, Request, Response } from "express";
import { OperatorModel as Operator, InvocationModel as Invocation } from "../db";

const router = Router();

// A2A JSON-RPC 2.0 handler
router.post("/", async (req: Request, res: Response) => {
  const { jsonrpc, method, params, id } = req.body;

  if (jsonrpc !== "2.0") {
    return res.json({ jsonrpc: "2.0", error: { code: -32600, message: "Invalid Request" }, id });
  }

  try {
    let result: any;

    switch (method) {
      // Agent discovery
      case "agent/discover": {
        result = {
          name: "Aegis Protocol",
          version: "1.0.0",
          description: "Economic layer for autonomous agent commerce on Solana",
          capabilities: ["invoke_skill", "list_operators", "search", "trust_score", "dispute", "royalties"],
          protocols: ["mcp", "x402", "a2a"],
          chain: "solana",
          settlement: "USDC",
        };
        break;
      }

      // List available skills/operators
      case "skills/list": {
        const limit = Math.min(params?.limit || 20, 100);
        const category = params?.category;
        const query: any = { isActive: true };
        if (category) query.category = category;
        const operators = await Operator.find(query).sort({ trustScore: -1 }).limit(limit).lean();
        result = {
          skills: operators.map((op: any) => ({
            id: op.slug,
            name: op.name,
            description: op.tagline || op.description,
            category: op.category,
            trustScore: op.trustScore,
            pricePerCall: op.pricePerCall?.toString?.() || "0.01",
            currency: "USDC",
          })),
          total: await Operator.countDocuments(query),
        };
        break;
      }

      // Invoke a skill
      case "skills/invoke": {
        const { skillId, payload, callerWallet } = params || {};
        if (!skillId) {
          return res.json({ jsonrpc: "2.0", error: { code: -32602, message: "skillId required" }, id });
        }
        const op = await Operator.findOne({ slug: skillId, isActive: true });
        if (!op) {
          return res.json({ jsonrpc: "2.0", error: { code: -32001, message: "Skill not found" }, id });
        }
        // Return skill info for invocation (actual execution goes through /api/v1/operators/:slug/invoke)
        result = {
          skillId: op.slug,
          name: op.name,
          invokeUrl: `/api/v1/operators/${op.slug}/invoke`,
          pricePerCall: op.pricePerCall?.toString?.() || "0.01",
          currency: "USDC",
          method: op.httpMethod || "POST",
          message: "Use the invokeUrl to execute this skill with x402 payment",
        };
        break;
      }

      // Get trust score
      case "trust/score": {
        const { skillId: trustSkillId } = params || {};
        if (!trustSkillId) {
          return res.json({ jsonrpc: "2.0", error: { code: -32602, message: "skillId required" }, id });
        }
        const trustOp = await Operator.findOne({ slug: trustSkillId });
        if (!trustOp) {
          return res.json({ jsonrpc: "2.0", error: { code: -32001, message: "Skill not found" }, id });
        }
        result = {
          skillId: trustOp.slug,
          trustScore: trustOp.trustScore,
          totalInvocations: trustOp.totalInvocations,
          successRate: trustOp.successfulInvocations && trustOp.totalInvocations
            ? ((trustOp.successfulInvocations / trustOp.totalInvocations) * 100).toFixed(1)
            : "0",
          isVerified: trustOp.isVerified,
        };
        break;
      }

      // Protocol stats
      case "protocol/stats": {
        const totalOps = await Operator.countDocuments({ isActive: true });
        const totalInvocations = await Invocation.countDocuments();
        result = {
          totalOperators: totalOps,
          totalInvocations,
          chain: "solana",
          settlement: "USDC",
          guardrails: "nvidia-nemo",
        };
        break;
      }

      default:
        return res.json({ jsonrpc: "2.0", error: { code: -32601, message: `Method not found: ${method}` }, id });
    }

    res.json({ jsonrpc: "2.0", result, id });
  } catch (err: any) {
    res.json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id });
  }
});

// GET for agent card discovery (A2A spec)
router.get("/", (_req: Request, res: Response) => {
  res.json({
    jsonrpc: "2.0",
    result: {
      name: "Aegis Protocol",
      version: "1.0.0",
      description: "Economic layer for autonomous agent commerce on Solana",
      url: "https://aegisplace.com",
      capabilities: ["invoke_skill", "list_operators", "search", "trust_score", "dispute", "royalties"],
      protocols: ["mcp", "x402", "a2a"],
    },
  });
});

export default router;
