import { Router } from "express";
const router = Router();

router.get("/:slug", async (req, res) => {
  try {
    const { OperatorModel } = await import("../db");
    const { generateKYAReport } = await import("../kya-engine");
    const op = await OperatorModel.findOne({ slug: req.params.slug }).lean();
    if (!op) return res.status(404).json({ error: "Operator not found" });
    const report = await generateKYAReport((op as any)._id);
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
