import { Router, Request, Response } from "express";
import { generateReceiptMetadata } from "../cnft-receipts";
import { InvocationModel, OperatorModel } from "../db";

const router = Router();

// GET /api/receipts/:invocationId - Get receipt metadata
router.get("/:invocationId", async (req: Request, res: Response) => {
  try {
    const { invocationId } = req.params;
    if (!/^\d+$/.test(invocationId)) {
      return res.status(400).json({ error: "Invalid invocation ID" });
    }
    const invocation = await InvocationModel.findOne(
      { id: Number(invocationId) }
    ).lean() as any;

    if (!invocation) {
      return res.status(404).json({ error: "Invocation not found" });
    }

    const operator = await OperatorModel.findOne({
      _id: invocation.operatorId
    }).lean() as any;

    const amount = invocation.amountPaid?.$numberDecimal
      ? invocation.amountPaid.$numberDecimal
      : String(invocation.amountPaid || "0");

    const totalAmount = parseFloat(amount);

    const metadata = generateReceiptMetadata({
      id: invocation.id || invocation._id,
      operatorSlug: operator?.slug || "unknown",
      operatorName: operator?.name || "Unknown Operator",
      callerWallet: invocation.callerWallet || "",
      amount: totalAmount.toFixed(6),
      responseMs: invocation.responseMs || 0,
      trustScore: operator?.trustScore || 0,
      success: invocation.success ?? true,
      timestamp: invocation.createdAt?.toISOString?.() || new Date().toISOString(),
      creatorWallet: operator?.creatorWallet || "",
      category: operator?.category || "other",
      feeSplit: {
        creator: (totalAmount * 0.85).toFixed(6),
        validators: (totalAmount * 0.10).toFixed(6),
        treasury: (totalAmount * 0.03).toFixed(6),
        insurance: (totalAmount * 0.015).toFixed(6),
        burned: (totalAmount * 0.005).toFixed(6),
      },
    });

    res.json(metadata);
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/receipts/:invocationId/image - Get receipt SVG image
router.get("/:invocationId/image", async (req: Request, res: Response) => {
  try {
    const { invocationId } = req.params;
    if (!/^\d+$/.test(invocationId)) {
      return res.status(400).json({ error: "Invalid invocation ID" });
    }
    const invocation = await InvocationModel.findOne(
      { id: Number(invocationId) }
    ).lean() as any;

    if (!invocation) {
      return res.status(404).json({ error: "Invocation not found" });
    }

    const operator = await OperatorModel.findOne({
      _id: invocation.operatorId
    }).lean() as any;

    const amount = invocation.amountPaid?.$numberDecimal
      ? invocation.amountPaid.$numberDecimal
      : String(invocation.amountPaid || "0");

    const metadata = generateReceiptMetadata({
      id: invocation.id || invocation._id,
      operatorSlug: operator?.slug || "unknown",
      operatorName: operator?.name || "Unknown Operator",
      callerWallet: invocation.callerWallet || "",
      amount: parseFloat(amount).toFixed(6),
      responseMs: invocation.responseMs || 0,
      trustScore: operator?.trustScore || 0,
      success: invocation.success ?? true,
      timestamp: invocation.createdAt?.toISOString?.() || new Date().toISOString(),
      creatorWallet: operator?.creatorWallet || "",
      category: operator?.category || "other",
      feeSplit: {
        creator: "0", validators: "0", treasury: "0", insurance: "0", burned: "0",
      },
    });

    // Decode the base64 SVG from the data URI
    const svgBase64 = metadata.image.replace("data:image/svg+xml;base64,", "");
    const svg = Buffer.from(svgBase64, "base64").toString("utf-8");

    res.set("Content-Type", "image/svg+xml");
    res.send(svg);
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
