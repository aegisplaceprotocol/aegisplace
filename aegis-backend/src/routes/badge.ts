import { Router, Request, Response } from "express";
import { McpServer } from "../db";

const router = Router();

router.get("/:slug", async (req: Request, res: Response) => {
  const server = await McpServer.findOne({ slug: req.params.slug }).lean();

  const status = server?.verificationStatus === "verified" ? "verified" : "unverified";
  const score = server?.trustScore ?? 0;
  const color = status === "verified" ? "%2334D399" : "%23666";
  const label = status === "verified" ? `Aegis Verified \u00B7 ${score}` : "Unverified";

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="20">
    <rect width="180" height="20" rx="3" fill="%23111"/>
    <rect x="80" width="100" height="20" rx="3" fill="${color}"/>
    <rect x="80" width="4" height="20" fill="${color}"/>
    <text x="40" y="14" font-family="sans-serif" font-size="11" fill="white" text-anchor="middle">AEGIS</text>
    <text x="130" y="14" font-family="sans-serif" font-size="11" fill="white" text-anchor="middle">${label}</text>
  </svg>`);
});

export default router;
